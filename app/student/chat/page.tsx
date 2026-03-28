'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

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
  const [inputSearch, setInputSearch] = useState('');
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

  const filteredTeachers = useMemo(() => {
    const term = inputSearch.trim().toLowerCase();
    if (!term) return sortedTeachers;
    return sortedTeachers.filter((t) =>
      `${t.teacherName} ${t.courseTitle}`.toLowerCase().includes(term)
    );
  }, [sortedTeachers, inputSearch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chat with teachers for your enrolled courses.
          </p>
        </div>
      </div>

      {diagnostic && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {diagnostic}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Teachers</p>
              <span className="text-xs text-gray-400">{filteredTeachers.length}</span>
            </div>
            <div className="mt-3">
              <input
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Search teacher or course..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
              />
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {loadingTeachers ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No teachers found.
              </div>
            ) : (
              filteredTeachers.map((t) => {
                const initials = t.teacherName
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <button
                    key={`${t.courseId}-${t.teacherId}`}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                      selected?.courseId === t.courseId && selected?.teacherId === t.teacherId
                        ? 'bg-blue-50/60 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold">
                          {initials || 'T'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {t.teacherName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {t.courseTitle}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {t.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {selected ? `Chat with ${selected.teacherName}` : 'Select a teacher'}
            </p>
          </div>

          <div className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3">
            {loadingMessages && (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</div>
            )}
            {!loadingMessages && messages.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation.
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderRole === 'student' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.senderRole === 'student'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  <p>{msg.body}</p>
                  <p className="text-[10px] opacity-70 mt-2">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Write a message..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim() || !selected}
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
