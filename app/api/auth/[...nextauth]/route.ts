// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      userinfo: {
        async request({ tokens }) {
          const profileResponse = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "User-Agent": "next-auth",
            },
          });
          const profile = await profileResponse.json();

          if (!profile.email) {
            const emailsResponse = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                "User-Agent": "next-auth",
              },
            });

            if (emailsResponse.ok) {
              const emails = (await emailsResponse.json()) as Array<{
                email: string;
                primary: boolean;
                verified: boolean;
              }>;

              const nonNoReplyVerified = emails.find(
                (e) => e.verified && !e.email.endsWith("@users.noreply.github.com")
              );
              const nonNoReply = emails.find(
                (e) => !e.email.endsWith("@users.noreply.github.com")
              );
              const primary = emails.find((e) => e.primary);
              const selected = nonNoReplyVerified || nonNoReply || primary || emails[0];
              profile.email = selected?.email ?? null;
            }
          }

          return profile;
        },
      },
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [users] = await db.query<RowDataPacket[]>(
          "SELECT u.*, r.name AS role FROM User u JOIN Role r ON u.roleId = r.id WHERE u.email = ?",
          [email]
        );

        const user = users[0];
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          name: user.fullName,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        const oauthEmail = user?.email?.trim().toLowerCase();

        if (oauthEmail && !user.email) {
          user.email = oauthEmail;
        }

        if (!oauthEmail) {
          return "/login?error=OAuthEmailMissing";
        }

        if (oauthEmail) {
          const [existingUser] = await db.query<RowDataPacket[]>(
            "SELECT u.id, r.name AS role FROM User u JOIN Role r ON u.roleId = r.id WHERE u.email = ?",
            [oauthEmail]
          );
          if (existingUser.length > 0) {
            user.id = String(existingUser[0].id);
            user.role = existingUser[0].role || "student";
          }
        }
      }

      return true;
    },

    async jwt({ token, account, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.email) token.email = user.email;
      }

      if (account && (account.provider === "google" || account.provider === "github")) {
        try {
          const oauthEmail =
            user?.email?.trim().toLowerCase() ||
            (typeof token.email === "string" ? token.email.trim().toLowerCase() : undefined);

          if (!oauthEmail) {
            console.error("OAuth login failed: provider did not return an email");
            return token;
          }

          token.email = oauthEmail;

          const [existingUser] = await db.query<RowDataPacket[]>(
            "SELECT u.id, r.name AS role FROM User u JOIN Role r ON u.roleId = r.id WHERE u.email = ?",
            [oauthEmail]
          );

          if (existingUser.length > 0) {
            token.id = String(existingUser[0].id);
            token.role = existingUser[0].role || "student";
          }
        } catch (error) {
          console.error("Error in OAuth callback:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
    signOut: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
