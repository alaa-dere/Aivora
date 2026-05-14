'use client';

import { FormEvent, useState } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  source?: 'openai' | 'rule-based';
};

export default function AdminChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hello, I am your Admin Assistant. Ask me things like: "What is this month\'s revenue?" or "Who are the most active students?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(
          `Server returned non-JSON response (status ${res.status}). ${rawText
            .slice(0, 120)
            .replace(/\s+/g, ' ')}`
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || `Request failed with status ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: String(data?.answer || 'No response'),
          source: data?.source === 'openai' ? 'openai' : 'rule-based',
        },
      ]);
      setSuggestedQuestions(Array.isArray(data?.suggestedQuestions) ? data.suggestedQuestions.slice(0, 3) : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6">
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 mb-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Admin Chatbot</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ask about admin metrics quickly using natural language.
        </p>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800">
        <div className="h-[420px] overflow-y-auto p-4 space-y-3">
          {messages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'mr-auto bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {message.text}
              {message.role === 'assistant' && message.source && (
                <div className="mt-1 text-[11px] opacity-80">
                  Source: {message.source === 'openai' ? 'OpenAI' : 'Rule-based'}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="mr-auto bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl px-4 py-2 text-sm">
              Thinking...
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-200 dark:border-slate-800 p-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            Send
          </button>
        </form>
        {suggestedQuestions.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
