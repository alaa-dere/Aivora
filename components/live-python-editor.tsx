"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (name: string, value: unknown) => void };
};

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function loadPyodide(): Promise<PyodideInstance> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideInstance>((resolve, reject) => {
    const existing = document.getElementById("pyodide-script");
    if (existing) {
      (window as any)
        .loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" })
        .then(resolve)
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "pyodide-script";
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    script.async = true;
    script.onload = () => {
      (window as any)
        .loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" })
        .then(resolve)
        .catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.body.appendChild(script);
  });

  return pyodidePromise;
}

export default function LivePythonEditor({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadPyodide()
      .then(() => {
        if (isMounted) setReady(true);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load Python runtime");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCode = async () => {
    setError(null);
    setLoading(true);
    setOutput("");
    try {
      const pyodide = await loadPyodide();
      const stdout: string[] = [];
      pyodide.globals.set("print", (...args: unknown[]) => {
        stdout.push(args.map(String).join(" "));
      });
      await pyodide.runPythonAsync(code);
      setOutput(stdout.join("\n") || "✅ Done");
    } catch (err: any) {
      setOutput("");
      setError(err.message || "Failed to run code");
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = useMemo(() => {
    if (!ready) return "Loading Python...";
    if (loading) return "Running...";
    return "Run";
  }, [ready, loading]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Live Python Editor</p>
        <button
          type="button"
          disabled={!ready || loading}
          onClick={runCode}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
      <textarea
        rows={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
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
            {output || "No output yet."}
          </pre>
        )}
      </div>
    </div>
  );
}
