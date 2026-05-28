'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileAudio, FileText, Image as ImageIcon, Search, Send, Trash2 } from 'lucide-react';

type TabMode = 'students' | 'admin';

type StudentItem = {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  conversationId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type ChatMessageItem = {
  id: string;
  senderId: string;
  senderRole: 'student' | 'teacher';
  body: string;
  createdAt: string;
};

type AdminMessageItem = {
  id: string;
  senderRole: 'admin' | 'teacher';
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
};

function formatFileSize(size?: number | null) {
  if (!size || Number.isNaN(size)) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentKind(type?: string | null) {
  if (!type) return 'file';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('audio/')) return 'audio';
  return 'file';
}

export default function TeacherMessagesPage() {
  const [mode, setMode] = useState<TabMode>('students');

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selected, setSelected] = useState<StudentItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [inputSearch, setInputSearch] = useState('');

  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminMessages, setAdminMessages] = useState<AdminMessageItem[]>([]);
  const [adminDraft, setAdminDraft] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSending, setAdminSending] = useState(false);
  const [adminErrorMsg, setAdminErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<
    | { id: string; channel: 'student' | 'admin' }
    | null
  >(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const studentMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const adminMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (channel: 'student' | 'admin') => {
    const container =
      channel === 'student' ? studentMessagesContainerRef.current : adminMessagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  const loadStudents = async (keepSelection = true) => {
    try {
      setLoadingStudents(true);
      const previous = selected;
      const res = await fetch('/api/teacher/chat/students', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load students');
      if (data.needsMigration) {
        setDiagnostic('Chat tables not found. Please run the chat migration.');
      }
      const items = data.students || [];
      setStudents(items);
      if (!keepSelection) {
        setSelected(items[0] || null);
        return;
      }
      if (previous) {
        const matched = items.find(
          (t: StudentItem) =>
            t.courseId === previous.courseId && t.studentId === previous.studentId
        );
        setSelected(matched || items[0] || null);
      } else {
        setSelected(items[0] || null);
      }
    } catch {
      // silent; surfaced through diagnostics
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (mode !== 'students') return;
    loadStudents(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const ensureConversation = async (item: StudentItem) => {
    if (item.conversationId) return item.conversationId;
    const res = await fetch('/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: item.courseId, studentId: item.studentId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiagnostic(
        data.message || `Could not open chat. Check enrollment for course ${item.courseId}.`
      );
      throw new Error(data.message || 'Failed to create conversation');
    }

    const conversationId = String(data.conversationId);
    setStudents((prev) =>
      prev.map((s) =>
        s.courseId === item.courseId && s.studentId === item.studentId
          ? { ...s, conversationId }
          : s
      )
    );
    setSelected((prev) =>
      prev && prev.courseId === item.courseId && prev.studentId === item.studentId
        ? { ...prev, conversationId }
        : prev
    );
    return conversationId;
  };

  const loadMessages = async (conversationId: string, markRead = true) => {
    setLoadingMessages(true);
    const query = markRead
      ? `/api/chat/messages?conversationId=${conversationId}&markRead=1`
      : `/api/chat/messages?conversationId=${conversationId}`;
    const res = await fetch(query, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages || []);
      setTimeout(() => scrollToBottom('student'), 50);
      setDiagnostic(null);
      if (markRead) {
        setStudents((prev) =>
          prev.map((s) =>
            s.conversationId === conversationId ? { ...s, unreadCount: 0 } : s
          )
        );
      }
    } else {
      setDiagnostic(data.message || 'Failed to load messages.');
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    if (mode !== 'students') return;

    const run = async () => {
      if (!selected) return;
      const convId = await ensureConversation(selected);
      await loadMessages(convId, true);

      if (streamRef.current) {
        streamRef.current.close();
      }
      const since = Date.now();
      const stream = new EventSource(`/api/chat/stream?conversationId=${convId}&since=${since}`);
      streamRef.current = stream;
      stream.addEventListener('message', (evt) => {
        try {
          const msg = JSON.parse((evt as MessageEvent).data) as ChatMessageItem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setStudents((prev) =>
            prev.map((s) =>
              s.conversationId === convId
                ? {
                    ...s,
                    lastMessage: msg.body,
                    lastMessageAt: msg.createdAt,
                    unreadCount: msg.senderRole === 'student' ? 0 : s.unreadCount,
                  }
                : s
            )
          );
          setTimeout(() => scrollToBottom('student'), 50);
        } catch {
          // ignore malformed events
        }
      });
    };

    run().catch(() => {
      // diagnostics handled above
    });

    return () => {
      if (streamRef.current) streamRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected?.courseId, selected?.studentId]);

  const handleSend = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    try {
      const conversationId = await ensureConversation(selected);
      const messageBody = input.trim();
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, body: messageBody }),
      });
      if (!res.ok) return;
      setInput('');
      setStudents((prev) =>
        prev.map((s) =>
          s.conversationId === conversationId
            ? { ...s, lastMessage: messageBody, lastMessageAt: new Date().toISOString() }
            : s
        )
      );
    } finally {
      setSending(false);
    }
  };

  const loadAdminMessages = async (markRead = true) => {
    try {
      setAdminLoading(true);
      const res = await fetch(`/api/teacher/messages${markRead ? '?markRead=1' : ''}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminErrorMsg(data.message || 'Failed to load messages');
        return;
      }
      if (data.thread?.adminName) {
        setAdminName(data.thread.adminName);
        setAdminId(data.thread.adminId);
      } else if (data.admin) {
        setAdminName(data.admin.fullName || 'Admin');
        setAdminId(data.admin.id);
      }
      setAdminMessages(data.messages || []);
      setAdminErrorMsg('');
      setTimeout(() => scrollToBottom('admin'), 50);
    } catch {
      setAdminErrorMsg('Failed to load messages');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== 'admin') return;
    loadAdminMessages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const sendAdminMessage = async () => {
    if (!adminDraft.trim()) return;
    try {
      setAdminSending(true);
      const res = await fetch('/api/teacher/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: adminDraft, adminId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminErrorMsg(data.message || 'Failed to send message');
        return;
      }
      setAdminDraft('');
      await loadAdminMessages(false);
    } catch {
      setAdminErrorMsg('Failed to send message');
    } finally {
      setAdminSending(false);
    }
  };

  const deleteAdminMessage = async (messageId: string, scope: 'self' | 'both') => {
    try {
      const res = await fetch('/api/teacher/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, scope }),
      });
      if (!res.ok) return;
      setAdminMessages((prev) => prev.filter((m) => m.id !== messageId));
      setDeleteTarget(null);
    } catch {
      // no-op
    }
  };

  const deleteStudentMessage = async (messageId: string, scope: 'self' | 'both') => {
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, scope }),
      });
      if (!res.ok) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setDeleteTarget(null);
    } catch {
      // no-op
    }
  };

  const handleDelete = async (scope: 'self' | 'both') => {
    if (!deleteTarget) return;
    if (deleteTarget.channel === 'admin') {
      await deleteAdminMessage(deleteTarget.id, scope);
      return;
    }
    await deleteStudentMessage(deleteTarget.id, scope);
  };

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        const byStudent = a.studentName.localeCompare(b.studentName);
        if (byStudent !== 0) return byStudent;
        return a.courseTitle.localeCompare(b.courseTitle);
      }),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const term = inputSearch.trim().toLowerCase();
    if (!term) return sortedStudents;
    return sortedStudents.filter((s) =>
      `${s.studentName} ${s.courseTitle}`.toLowerCase().includes(term)
    );
  }, [sortedStudents, inputSearch]);

  const canSendAdmin = Boolean(adminId);

  const orderedStudentMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const orderedAdminMessages = useMemo(() => {
    return [...adminMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [adminMessages]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Messages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Chat with your students and administration.
        </p>
      </div>

      <div className="admin-surface mb-4 inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur p-1">
        <button
          onClick={() => setMode('students')}
          className={`px-4 py-2 text-sm rounded-md transition border ${
            mode === 'students'
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          Students
        </button>
        <button
          onClick={() => setMode('admin')}
          className={`px-4 py-2 text-sm rounded-md transition border ${
            mode === 'admin'
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          Administration
        </button>
      </div>

      {mode === 'students' && (
        <>
          {diagnostic && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {diagnostic}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm max-h-[68vh]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
              <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Students</p>
                  <span className="text-xs text-gray-400">{filteredStudents.length}</span>
                </div>
                <div className="mt-3 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={inputSearch}
                    onChange={(e) => setInputSearch(e.target.value)}
                    placeholder="Search student or course..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
                  />
                </div>
              </div>
              <div className="max-h-[56vh] overflow-y-auto p-2 space-y-2 messages-scroll">
                {loadingStudents ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    No students found.
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const initials = s.studentName
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <button
                        key={`${s.courseId}-${s.studentId}`}
                        onClick={() => setSelected(s)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          selected?.courseId === s.courseId &&
                          selected?.studentId === s.studentId
                            ? 'bg-sky-50/80 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 shadow-sm'
                            : 'bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold">
                              {initials || 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {s.studentName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {s.courseTitle}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {s.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                          {s.unreadCount > 0 && (
                            <span className="shrink-0 min-w-[22px] h-[22px] px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold inline-flex items-center justify-center">
                              {s.unreadCount > 99 ? '99+' : s.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="admin-surface relative overflow-hidden lg:col-span-2 bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm min-h-[60vh]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
              <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {selected ? `Chat with ${selected.studentName}` : 'Select a student'}
                </p>
                {selected && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selected.courseTitle}
                  </p>
                )}
              </div>

              <div
                ref={studentMessagesContainerRef}
                className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3 messages-scroll"
              >
                {loadingMessages && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Loading messages...
                  </div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No messages yet. Start the conversation.
                  </div>
                )}
                {orderedStudentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderRole === 'teacher' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm border ${
                        msg.senderRole === 'teacher'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-100 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {msg.senderRole === 'teacher' && (
                        <button
                          onClick={() => setDeleteTarget({ id: msg.id, channel: 'student' })}
                          className="admin-surface absolute -top-2 right-2 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-gray-600 hover:text-red-600 shadow"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <p>{msg.body}</p>
                      <p className="text-[10px] opacity-70 mt-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    placeholder="Write a message..."
                    className="admin-surface flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </>
      )}

      {mode === 'admin' && (
        <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[65vh] shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
          <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {adminName ? `Administration: ${adminName}` : 'Administration Chat'}
            </p>
          </div>

          <div
            ref={adminMessagesContainerRef}
            className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3 messages-scroll"
          >
            {adminLoading && (
              <div className="text-sm text-slate-500 dark:text-slate-400">Loading messages...</div>
            )}
            {!adminLoading && adminErrorMsg && (
              <div className="text-sm text-red-600 dark:text-red-300">{adminErrorMsg}</div>
            )}
            {!adminLoading && !adminErrorMsg && adminMessages.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No messages yet. Say hello!
              </div>
            )}
            {orderedAdminMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderRole === 'teacher' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm border ${
                    msg.senderRole === 'teacher'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-slate-800 dark:text-slate-100 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {msg.senderRole === 'teacher' && (
                    <button
                      onClick={() => setDeleteTarget({ id: msg.id, channel: 'admin' })}
                      className="admin-surface absolute -top-2 right-2 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-gray-600 hover:text-red-600 shadow"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {msg.body.trim() && <p>{msg.body}</p>}
                  {msg.attachmentUrl && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/70">
                      {attachmentKind(msg.attachmentType) === 'image' ? (
                        <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                          <img
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName || 'Attachment'}
                            className="max-h-60 w-full object-cover"
                          />
                        </a>
                      ) : attachmentKind(msg.attachmentType) === 'audio' ? (
                        <div className="p-2">
                          <audio controls src={msg.attachmentUrl} className="w-full" />
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {msg.attachmentName || 'Voice note'}
                          </p>
                        </div>
                      ) : (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 text-left"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                            {msg.attachmentType?.startsWith('audio/') ? (
                              <FileAudio className="h-5 w-5" />
                            ) : msg.attachmentType?.startsWith('image/') ? (
                              <ImageIcon className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {msg.attachmentName || 'Attachment'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {msg.attachmentSize ? formatFileSize(msg.attachmentSize) : 'File'}
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] opacity-70 mt-2">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                value={adminDraft}
                onChange={(e) => setAdminDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendAdminMessage();
                }}
                placeholder="Write a message to administration..."
                className="admin-surface flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendAdminMessage}
                disabled={adminSending || !canSendAdmin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
            {!canSendAdmin && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                Admin account not found. Please create an admin user to enable messaging.
              </p>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="admin-surface w-full max-w-sm rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Delete message
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Choose how you want to delete this message.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDelete('self')}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Delete for me
              </button>
              <button
                onClick={() => handleDelete('both')}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Delete for everyone
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .messages-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .messages-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .messages-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.8);
          border-radius: 999px;
        }
        .dark .messages-scroll::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.9);
        }
      `}</style>
    </div>
  );
}
