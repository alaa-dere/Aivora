"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send, Trash2 } from "lucide-react";

type Teacher = {
  id: string;
  fullName: string;
};

type ThreadSummary = {
  id: string;
  teacherId: string;
  teacherName: string;
  lastMessageAt: string;
  lastMessage: string | null;
  unreadCount: number;
};

type MessageItem = {
  id: string;
  senderRole: "admin" | "teacher";
  body: string;
  createdAt: string;
};

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const threadMap = useMemo(() => {
    return new Map(threads.map((t) => [t.teacherId, t]));
  }, [threads]);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;
  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((t) => t.fullName.toLowerCase().includes(term));
  }, [search, teachers]);

  const loadTeachers = async () => {
    try {
      const res = await fetch("/api/teachers/list", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Failed to load teachers", error);
    }
  };

  const loadThreads = async () => {
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setThreads(data.threads || []);
    } catch (error) {
      console.error("Failed to load message threads", error);
    }
  };

  const loadMessages = async (teacherId: string, markRead = true) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(
        `/api/admin/messages?teacherId=${teacherId}${markRead ? "&markRead=1" : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to load messages");
        return;
      }
      setMessages(data.messages || []);
      setErrorMsg("");
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadTeachers();
    loadThreads();
  }, []);

  useEffect(() => {
    const teacherId = searchParams.get("teacherId");
    if (teacherId) {
      setSelectedTeacherId(teacherId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (teachers.length === 0) return;
    if (selectedTeacherId) return;
    const unreadTeacher = teachers.find((t) => (threadMap.get(t.id)?.unreadCount || 0) > 0);
    setSelectedTeacherId(unreadTeacher?.id || teachers[0].id);
  }, [teachers, selectedTeacherId, threadMap]);

  useEffect(() => {
    if (!selectedTeacherId) return;
    loadMessages(selectedTeacherId, true);
    loadThreads();
  }, [selectedTeacherId]);

  const sendMessage = async () => {
    if (!selectedTeacherId || !draft.trim()) return;
    try {
      setSending(true);
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacherId, body: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to send message");
        return;
      }
      setDraft("");
      await loadMessages(selectedTeacherId, false);
      await loadThreads();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const res = await fetch("/api/admin/messages", {
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Teacher Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chat directly with teachers and keep track of replies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Teachers</p>
              <span className="text-xs text-gray-400">{filteredTeachers.length}</span>
            </div>
            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teacher..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {filteredTeachers.length === 0 && (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No teachers found.</div>
            )}
            {filteredTeachers.map((teacher) => {
              const thread = threadMap.get(teacher.id);
              const unreadCount = thread?.unreadCount || 0;
              const initials = teacher.fullName
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              return (
                <button
                  key={teacher.id}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                    selectedTeacherId === teacher.id ? "bg-blue-50/60 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold">
                        {initials || "T"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {teacher.fullName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {thread?.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-2 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {selectedTeacher ? `Chat with ${selectedTeacher.fullName}` : "Select a teacher"}
            </p>
          </div>

          <div className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3">
            {loadingMessages && (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</div>
            )}
            {!loadingMessages && errorMsg && (
              <div className="text-sm text-red-600 dark:text-red-300">{errorMsg}</div>
            )}
            {!loadingMessages && !errorMsg && messages.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation.
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group relative max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.senderRole === "admin"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  }`}
                >
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className={`absolute -top-2 ${msg.senderRole === "admin" ? "right-2" : "left-2"} hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-gray-600 hover:text-red-600 shadow`}
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
                disabled={sending || !selectedTeacherId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
