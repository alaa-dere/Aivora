'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline';

type TeacherItem = {
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  conversationId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

type MessageItem = {
  id: string;
  senderId: string;
  senderRole: 'student' | 'teacher';
  body: string;
  createdAt: string;
};

export default function StudentChatPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [selected, setSelected] = useState<TeacherItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<EventSource | null>(null);

  const selectedConversationId = selected?.conversationId || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await fetch('/api/student/chat/teachers', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load teachers');
        if (data.needsMigration) {
          setDiagnostic('Chat tables not found. Please run the chat migration.');
        }
        setTeachers(data.teachers || []);
        if (!selected && data.teachers?.length) {
          setSelected(data.teachers[0]);
        }
      } catch {
        // ignore
      } finally {
        setLoadingTeachers(false);
      }
    };
    loadTeachers();
  }, []);

  const ensureConversation = async (item: TeacherItem) => {
    if (item.conversationId) return item.conversationId;
    const res = await fetch('/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: item.courseId, teacherId: item.teacherId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiagnostic(
        data.message ||
          `Could not open chat. Check enrollment for course ${item.courseId}.`
      );
      throw new Error(data.message || 'Failed to create conversation');
    }
    const updated = teachers.map((t) =>
      t.courseId === item.courseId && t.teacherId === item.teacherId
        ? { ...t, conversationId: data.conversationId }
        : t
    );
    setTeachers(updated);
    const current = updated.find(
      (t) => t.courseId === item.courseId && t.teacherId === item.teacherId
    );
    if (current) setSelected(current);
    return data.conversationId as string;
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 50);
      setDiagnostic(null);
    } else {
      setDiagnostic(data.message || 'Failed to load messages.');
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    const run = async () => {
      if (!selected) return;
      const convId = await ensureConversation(selected);
      await loadMessages(convId);

      if (streamRef.current) {
        streamRef.current.close();
      }
      const since = Date.now();
      const stream = new EventSource(`/api/chat/stream?conversationId=${convId}&since=${since}`);
      streamRef.current = stream;
      stream.addEventListener('message', (evt) => {
        try {
          const msg = JSON.parse((evt as MessageEvent).data) as MessageItem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 50);
        } catch {
          // ignore
        }
      });
      stream.addEventListener('error', () => {
        // let it auto-reconnect
      });
    };
    run().catch(() => {
      // diagnostics are handled inside
    });
    return () => {
      if (streamRef.current) streamRef.current.close();
    };
  }, [selected?.courseId, selected?.teacherId]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConversationId || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConversationId, body: input.trim() }),
      });
      if (!res.ok) return;
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
  }, [teachers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Chat
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Contact your instructors for enrolled courses.
        </p>
      </div>

      {diagnostic && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {diagnostic}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Your instructors
            </p>
            {loadingTeachers ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : sortedTeachers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You are not enrolled in any courses yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedTeachers.map((t) => (
                  <button
                    key={`${t.courseId}-${t.teacherId}`}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                      selected?.courseId === t.courseId && selected?.teacherId === t.teacherId
                        ? 'border-blue-300 bg-blue-50/60 dark:bg-blue-900/20'
                        : 'border-blue-100 dark:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <UserCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          {t.teacherName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.courseTitle}
                        </p>
                        {t.lastMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {t.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 flex flex-col h-[600px]">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Select an instructor to start chatting.
              </div>
            ) : (
              <>
                <div className="border-b border-blue-100 dark:border-blue-800 pb-3 mb-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selected.teacherName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selected.courseTitle}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {loadingMessages ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${
                          m.senderRole === 'student' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            m.senderRole === 'student'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
