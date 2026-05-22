"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

const normalizeEditorCode = (raw: string) =>
  String(raw || "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/(#[^\n]+)\n([^\n])/g, "$1\n\n$2")
    .replace(/(\/\/[^\n]+)\n([^\n])/g, "$1\n\n$2")
    .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, "$1\n\n$2")
    .replace(/\n{3,}/g, "\n\n");

function formatCCodeForEditor(input: string): string {
  const src = normalizeEditorCode(input).trim();
  if (!src) return "";

  // Keep #include and preprocessor directives on their own lines first.
  let out = src
    .replace(/\s*#\s*include\s*/g, "\n#include ")
    .replace(/\s*#\s*define\s*/g, "\n#define ")
    .replace(/\s*#\s*if(n?def)?\s*/g, "\n#if$1 ")
    .replace(/\s*#\s*endif\s*/g, "\n#endif\n");

  // Split common C statements into separate lines and clean brace spacing.
  out = out
    .replace(/;\s*/g, ";\n")
    .replace(/\{\s*/g, "{\n")
    .replace(/\s*\}/g, "\n}\n")
    .replace(/\n{3,}/g, "\n\n");

  return out
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/(#[^\n]+)\n([^\n])/g, "$1\n\n$2")
    .replace(/(\/\/[^\n]+)\n([^\n])/g, "$1\n\n$2")
    .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, "$1\n\n$2")
    .trim();
}

export default function LiveCEditor({
  initialCode,
  onSubmissionChange,
}: {
  initialCode: string;
  onSubmissionChange?: (submission: LiveEditorSubmission) => void;
}) {
  const [code, setCode] = useState(() => formatCCodeForEditor(initialCode));
  const [output, setOutput] = useState<string>("No output yet.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const outputRef = useRef<HTMLPreElement | null>(null);
  const lastSubmissionSignatureRef = useRef<string>("");

  useEffect(() => {
    setCode(formatCCodeForEditor(initialCode));
    setHasRun(false);
    setError(null);
    setOutput("No output yet.");
  }, [initialCode]);

  useEffect(() => {
    const signature = JSON.stringify({
      code,
      output,
      hasRun,
      error: error || null,
    });
    if (signature === lastSubmissionSignatureRef.current) {
      return;
    }
    lastSubmissionSignatureRef.current = signature;
    onSubmissionChange?.({ code, output, hasRun, error });
  }, [code, output, hasRun, error, onSubmissionChange]);

  const runCode = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please write some C code first.");
      setOutput("");
      setHasRun(true);
      return;
    }

    setLoading(true);
    setError(null);
    setOutput("");
    try {
      const res = await fetch("/api/code/execute-c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = String(data?.message || "Failed to execute C code.");
        setError(message);
        setOutput("");
      } else if (!data?.success) {
        const stage = String(data?.stage || "run");
        const compiler = data?.compiler ? ` (${String(data.compiler)})` : "";
        const msg = String(data?.error || "Execution failed.");
        const out = String(data?.output || "");
        setError(`${stage.toUpperCase()}${compiler}: ${msg}`);
        setOutput(out || "No output.");
      } else {
        setError(null);
        setOutput(String(data?.output || "Program finished with no output."));
      }
      setHasRun(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute C code.");
      setOutput("");
      setHasRun(true);
    } finally {
      setLoading(false);
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }
  };

  const buttonLabel = useMemo(() => (loading ? "Running..." : "Run"), [loading]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Live C Editor</p>
        <button
          type="button"
          disabled={loading}
          onClick={runCode}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
      <textarea
        rows={18}
        value={code}
        onChange={(e) => {
          setCode(formatCCodeForEditor(e.target.value));
          setHasRun(false);
        }}
        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-900 dark:text-gray-100"
      />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Output</p>
        {error ? (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-2 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : (
          <pre
            ref={outputRef}
            className="max-h-40 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-700 dark:text-gray-200"
          >
            {output}
          </pre>
        )}
      </div>
    </div>
  );
}

