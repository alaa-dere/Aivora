require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" },
  });

  await prisma.role.upsert({
    where: { name: "teacher" },
    update: {},
    create: { name: "teacher" },
  });

  await prisma.role.upsert({
    where: { name: "student" },
    update: {},
    create: { name: "student" },
  });

  // Admin user
  const passwordHash = await bcrypt.hash("Admin@12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@aivora.com" },
    update: {},
    create: {
      roleId: adminRole.id,
      fullName: "Admin User",
      email: "admin@aivora.com",
      passwordHash,
      status: "active",
    },
  });

  console.log("✅ Seed done");
  console.log("Admin => admin@aivora.com / Admin@12345");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });