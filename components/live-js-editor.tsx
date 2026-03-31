"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

export default function LiveJsEditor({
  initialCode,
  onSubmissionChange,
}: {
  initialCode: string;
  onSubmissionChange?: (submission: LiveEditorSubmission) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("No output yet.");
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const outputRef = useRef<HTMLPreElement | null>(null);
  const lastSubmissionSignatureRef = useRef<string>("");

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

  const runCode = () => {
    const logs: string[] = [];
    const consoleProxy = {
      log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      warn: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    };

    try {
      setError(null);
      const fn = new Function("console", code);
      fn(consoleProxy);
      setOutput(logs.join("\n") || "Done");
      setHasRun(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to run code";
      setOutput(message);
      setError(message);
      setHasRun(true);
    }

    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const buttonLabel = useMemo(() => "Run", []);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Live JavaScript Editor</p>
        <button
          type="button"
          onClick={runCode}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold"
        >
          {buttonLabel}
        </button>
      </div>
      <textarea
        rows={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setHasRun(false);
        }}
        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-900 dark:text-gray-100"
      />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Output</p>
        <pre
          ref={outputRef}
          className="max-h-40 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-700 dark:text-gray-200"
        >
          {output}
        </pre>
      </div>
    </div>
  );
}
