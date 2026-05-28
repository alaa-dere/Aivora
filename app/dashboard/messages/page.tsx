"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileAudio,
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Search,
  Send,
  Square,
  Trash2,
  X,
  Clock3,
  MessageSquare,
} from "lucide-react";

type Teacher = {
  id: string;
  fullName: string;
  imageUrl?: string | null;
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
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(size?: number | null) {
  if (!size || Number.isNaN(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentKind(type?: string | null) {
  if (!type) return "file";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const liveStreamRef = useRef<EventSource | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const threadMap = useMemo(
    () => new Map(threads.map((thread) => [thread.teacherId, thread])),
    [threads]
  );

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => {
      const aTime = threadMap.get(a.id)?.lastMessageAt
        ? new Date(threadMap.get(a.id)!.lastMessageAt).getTime()
        : 0;
      const bTime = threadMap.get(b.id)?.lastMessageAt
        ? new Date(threadMap.get(b.id)!.lastMessageAt).getTime()
        : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [teachers, threadMap]);

  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source = onlyUnread
      ? sortedTeachers.filter((teacher) => (threadMap.get(teacher.id)?.unreadCount || 0) > 0)
      : sortedTeachers;
    if (!term) return source;
    return source.filter((teacher) => teacher.fullName.toLowerCase().includes(term));
  }, [onlyUnread, search, sortedTeachers, threadMap]);

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0),
    [threads]
  );

  const clearRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
    recorderStreamRef.current?.getTracks().forEach((track) => track.stop());
    recorderStreamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setRecordingBlob(null);
    setRecordingUrl("");
    setRecordingSeconds(0);
  };

  const clearComposerAttachment = () => {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetComposer = () => {
    setDraft("");
    clearComposerAttachment();
    clearRecording();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      if (markRead) {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.teacherId === teacherId ? { ...thread, unreadCount: 0 } : thread
          )
        );
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setErrorMsg(err.message || "Failed to load messages");
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
    const unreadTeacher = sortedTeachers.find((teacher) => (threadMap.get(teacher.id)?.unreadCount || 0) > 0);
    setSelectedTeacherId(unreadTeacher?.id || sortedTeachers[0].id);
  }, [sortedTeachers, selectedTeacherId, threadMap, teachers.length]);

  useEffect(() => {
    if (!selectedTeacherId) return;
    loadMessages(selectedTeacherId, true);
    loadThreads();
  }, [selectedTeacherId]);

  useEffect(() => {
    if (!selectedTeacherId) return;
    setTimeout(scrollToBottom, 50);
  }, [orderedMessages.length, selectedTeacherId]);

  useEffect(() => {
    const stream = liveStreamRef.current;
    const timer = timerRef.current;
    const url = recordingUrl;
    const recorderStream = recorderStreamRef.current;
    return () => {
      if (stream) stream.close();
      if (timer) window.clearInterval(timer);
      if (url) URL.revokeObjectURL(url);
      recorderStream?.getTracks().forEach((track) => track.stop());
    };
  }, [recordingUrl]);

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setRecordingError("");
    if (!file) return;
    clearRecording();
    setPendingFile(file);
  };

  const startRecording = async () => {
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("Audio recording is not supported in this browser.");
      return;
    }
    if (!window.isSecureContext) {
      setRecordingError("Microphone access requires HTTPS or localhost. Open this page on a secure origin.");
      return;
    }

    try {
      setRecordingError("");
      clearComposerAttachment();
      clearRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setRecording(false);
        recorderStreamRef.current?.getTracks().forEach((track) => track.stop());
        recorderStreamRef.current = null;
      };

      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording", error);
      const err = error as { name?: string; message?: string };
      if (err?.name === "NotAllowedError") {
        setRecordingError("Microphone permission was blocked. Please allow access in your browser.");
      } else if (err?.name === "NotFoundError") {
        setRecordingError("No microphone was found on this device.");
      } else if (err?.name === "NotReadableError") {
        setRecordingError("The microphone is already in use by another app.");
      } else {
        setRecordingError("Could not access the microphone. Use HTTPS or localhost and allow mic access.");
      }
      clearRecording();
    }
  };

  const stopRecording = () => {
    if (!recordingRefIsActive()) return;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      recorderRef.current?.stop();
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const recordingRefIsActive = () => Boolean(recorderRef.current && recording);

  const sendMessage = async () => {
    if (!selectedTeacherId || sending) return;
    const text = draft.trim();
    const hasAttachment = Boolean(pendingFile || recordingBlob);
    if (!text && !hasAttachment) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("teacherId", selectedTeacherId);
      formData.append("body", text);

      if (recordingBlob) {
        const extension = recordingBlob.type.includes("ogg") ? "ogg" : "webm";
        const voiceFile = new File(
          [recordingBlob],
          `voice-note-${Date.now()}.${extension}`,
          { type: recordingBlob.type || "audio/webm" }
        );
        formData.append("attachment", voiceFile);
      } else if (pendingFile) {
        formData.append("attachment", pendingFile);
      }

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to send message");
        return;
      }
      resetComposer();
      await loadMessages(selectedTeacherId, false);
      await loadThreads();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setErrorMsg(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string, scope: "self" | "both") => {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, scope }),
      });
      if (!res.ok) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await loadThreads();
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const activeThread = selectedTeacherId ? threadMap.get(selectedTeacherId) : null;

  const renderAttachment = (message: MessageItem) => {
    if (!message.attachmentUrl) return null;
    const kind = attachmentKind(message.attachmentType);
    const commonLabel = message.attachmentName || "Attachment";

    if (kind === "image") {
      return (
        <a
          href={message.attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block overflow-hidden rounded-2xl border border-white/15 bg-white/10"
        >
          <img src={message.attachmentUrl} alt={commonLabel} className="max-h-64 w-full object-cover" />
        </a>
      );
    }

    if (kind === "audio") {
      return (
        <div className="mt-2 rounded-2xl border border-white/15 bg-white/10 p-2">
          <audio controls src={message.attachmentUrl} className="w-full" />
          <p className="mt-2 text-[11px] opacity-80">{commonLabel}</p>
        </div>
      );
    }

    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className={`mt-2 flex items-center gap-3 rounded-2xl border px-3 py-2 transition ${
          message.senderRole === "admin"
            ? "border-white/15 bg-white/10 hover:bg-white/15"
            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600"
        }`}
      >
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            message.senderRole === "admin"
              ? "bg-white/15 text-white"
              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
          }`}
        >
          {message.attachmentType?.startsWith("audio/") ? (
            <FileAudio className="h-5 w-5" />
          ) : message.attachmentType?.startsWith("image/") ? (
            <ImageIcon className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold ${
              message.senderRole === "admin" ? "text-white" : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {commonLabel}
          </p>
          <p
            className={`text-xs ${
              message.senderRole === "admin" ? "text-white/70" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {message.attachmentSize ? formatFileSize(message.attachmentSize) : "File"}
          </p>
        </div>
      </a>
    );
  };

  const selectedInitials = selectedTeacher
    ? selectedTeacher.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "T";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-5 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur dark:border-sky-900/60 dark:bg-slate-900/70 dark:text-sky-300">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
              Teacher Messages
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A cleaner inbox for teacher conversations with file sharing and voice notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyUnread((prev) => !prev)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                onlyUnread
                  ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-300"
                  : "border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
              }`}
            >
              Unread {unreadTotal > 0 ? `(${unreadTotal})` : ""}
            </button>
            <button
              onClick={() => setOnlyUnread(false)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                !onlyUnread
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
              }`}
            >
              All {teachers.length > 0 ? `(${teachers.length})` : ""}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 xl:gap-5">
          <aside className="admin-surface relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400" />
            <div className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Teachers</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Browse active conversations
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {filteredTeachers.length}
                </span>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teacher..."
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800/50"
                />
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-2 messages-scroll">
              {filteredTeachers.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No teachers found.</div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const thread = threadMap.get(teacher.id);
                  const unreadCount = thread?.unreadCount || 0;
                  const isActive = selectedTeacherId === teacher.id;
                  const initials = teacher.fullName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <button
                      key={teacher.id}
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${
                        isActive
                          ? "border-sky-200 bg-sky-50/80 shadow-sm dark:border-sky-800 dark:bg-sky-900/20"
                          : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700 shadow-sm dark:from-sky-900/40 dark:to-cyan-900/30 dark:text-sky-300">
                          {teacher.imageUrl ? (
                            <img
                              src={teacher.imageUrl}
                              alt={teacher.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                              {initials || "T"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {teacher.fullName}
                            </p>
                            {thread?.lastMessageAt ? (
                              <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                                {formatTime(thread.lastMessageAt)}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {thread?.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Teacher chat
                        </span>
                        {unreadCount > 0 && (
                            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="admin-surface relative overflow-hidden flex min-h-[78vh] flex-col rounded-3xl border border-slate-200/80 bg-white/85 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-4 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-700 shadow-sm dark:from-emerald-900/30 dark:to-cyan-900/20 dark:text-emerald-300">
                  {selectedTeacher ? (
                    selectedTeacher.imageUrl ? (
                      <img
                        src={selectedTeacher.imageUrl}
                        alt={selectedTeacher.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                        {selectedInitials}
                      </div>
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                      T
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {selectedTeacher ? `Chat with ${selectedTeacher.fullName}` : "Select a teacher"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {activeThread?.lastMessageAt
                      ? `Last activity ${formatDateTime(activeThread.lastMessageAt)}`
                      : "Fresh conversation space with attachments and voice notes"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <Clock3 className="h-3.5 w-3.5" />
                Secure chat
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 messages-scroll">
              {loadingMessages && (
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading messages...</div>
              )}
              {!loadingMessages && errorMsg && (
                <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}
              {!loadingMessages && !errorMsg && messages.length === 0 && (
                <div className="flex h-full min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                  Start the conversation with a text, file, or voice note.
                </div>
              )}

              <div className="space-y-3">
                {orderedMessages.map((msg) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`group relative max-w-[92%] sm:max-w-[76%] rounded-[1.4rem] px-4 py-3 text-sm shadow-sm border ${
                          isAdmin
                          ? "border-blue-500/30 bg-gradient-to-br from-blue-600 to-sky-600 text-white"
                            : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                        }`}
                      >
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTargetId(msg.id)}
                            className="absolute -top-2 right-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow hover:text-rose-600 group-hover:flex"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {msg.body.trim() && (
                          <p className="whitespace-pre-wrap leading-6">{msg.body}</p>
                        )}

                        {renderAttachment(msg)}

                        <p
                          className={`mt-2 text-[10px] ${
                            isAdmin ? "text-white/75" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {formatDateTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-slate-200/70 px-3 py-3 dark:border-slate-800 sm:px-4">
              {(pendingFile || recordingBlob) && (
                <div className="mb-3 space-y-2">
                  {pendingFile && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-700 dark:text-slate-100">
                          {pendingFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(pendingFile.size)}
                        </p>
                      </div>
                      <button
                        onClick={clearComposerAttachment}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        aria-label="Remove attachment"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {recordingBlob && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 dark:border-sky-900/50 dark:bg-sky-900/20">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                            Voice note ready
                          </p>
                          <p className="text-xs text-sky-600/80 dark:text-sky-400">
                            {recordingSeconds > 0 ? `Recorded for ${recordingSeconds}s` : "Recorded voice note"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            clearRecording();
                          }}
                          className="rounded-full p-1.5 text-sky-500 hover:bg-white/70 hover:text-sky-700 dark:hover:bg-slate-800"
                          aria-label="Remove voice note"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {recordingUrl && <audio controls src={recordingUrl} className="w-full" />}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach file
                </button>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-semibold shadow-sm transition ${
                    recording
                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
                  }`}
                >
                  {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {recording ? `Stop recording ${recordingSeconds}s` : "Voice note"}
                </button>
                {recordingError && <span className="text-rose-600 dark:text-rose-300">{recordingError}</span>}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..."
                  rows={2}
                  className="admin-surface min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-blue-700 dark:focus:ring-blue-900/40"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || (!draft.trim() && !pendingFile && !recordingBlob) || !selectedTeacherId}
                  className="inline-flex h-[52px] items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/*"
                className="hidden"
                onChange={handleFilePick}
              />
            </div>
          </section>
        </div>
      </div>

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Delete message</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Choose whether to delete it only for you or for everyone.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => deleteMessage(deleteTargetId, "self")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Delete for me
              </button>
              <button
                onClick={() => deleteMessage(deleteTargetId, "both")}
                className="rounded-2xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Delete for everyone
              </button>
              <button
                onClick={() => setDeleteTargetId(null)}
                className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
