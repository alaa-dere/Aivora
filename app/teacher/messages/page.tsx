"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";

type MessageItem = {
  id: string;
  senderRole: "admin" | "teacher";
  body: string;
  createdAt: string;
};

export default function TeacherMessagesPage() {
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const canSend = Boolean(adminId);

  const loadMessages = async (markRead = true) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teacher/messages${markRead ? "?markRead=1" : ""}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to load messages");
        return;
      }
      if (data.thread?.adminName) {
        setAdminName(data.thread.adminName);
        setAdminId(data.thread.adminId);
      } else if (data.admin) {
        setAdminName(data.admin.fullName || "Admin");
        setAdminId(data.admin.id);
      }
      setMessages(data.messages || []);
      setErrorMsg("");
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true);
  }, []);

  const sendMessage = async () => {
    if (!draft.trim()) return;
    try {
      setSending(true);
      const res = await fetch("/api/teacher/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft, adminId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to send message");
        return;
      }
      setDraft("");
      await loadMessages(false);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const res = await fetch("/api/teacher/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chat with the admin about courses and students.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col min-h-[65vh]">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {adminName ? `Admin: ${adminName}` : "Admin Chat"}
          </p>
        </div>

        <div className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</div>
          )}
          {!loading && errorMsg && (
            <div className="text-sm text-red-600 dark:text-red-300">{errorMsg}</div>
          )}
          {!loading && !errorMsg && messages.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No messages yet. Say hello!
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === "teacher" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`group relative max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  msg.senderRole === "teacher"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                }`}
              >
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className={`absolute -top-2 ${msg.senderRole === "teacher" ? "right-2" : "left-2"} hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-gray-600 hover:text-red-600 shadow`}
                  title="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <p>{msg.body}</p>
                <p className="text-[10px] opacity-70 mt-2">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !canSend}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          {!canSend && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-300">
              Admin account not found. Please create an admin user to enable messaging.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
