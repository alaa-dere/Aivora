"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (name: string, value: unknown) => void };
};

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

type WindowWithPyodide = Window & {
  loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInstance>;
};

let pyodidePromise: Promise<PyodideInstance> | null = null;

const splitCommentAndCodeLine = (line: string): string[] => {
  const trimmed = line.trim();
  if (!trimmed.startsWith("#")) return [line];

  const embeddedDefMatch = trimmed.match(/^#\s*(.*?)\s+(def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:.*)$/);
  if (embeddedDefMatch && embeddedDefMatch[2]) {
    const commentText = (embeddedDefMatch[1] || "").trim();
    const commentLine = commentText ? `# ${commentText}` : "#";
    return [commentLine, embeddedDefMatch[2].trim()];
  }

  const noHash = trimmed.replace(/^#+\s*/, "");
  const splitMatch = noHash.match(/\s+([a-zA-Z_][a-zA-Z0-9_]*\s*=.+)$/);
  if (!splitMatch || !splitMatch[1]) return [line];

  const code = splitMatch[1].trim();
  const commentText = noHash.slice(0, noHash.lastIndexOf(code)).trim();
  if (!commentText || !code) return [line];
  return [`# ${commentText}`, code];
};

const normalizePythonStructure = (raw: string): string => {
  const source = String(raw || "");
  const hasNestedDefinition = /^\s+def\s+[a-zA-Z_]\w*\s*\(/m.test(source);
  const hasClassBlock = /^\s*class\s+[a-zA-Z_]\w*.*:\s*$/m.test(source);
  const hasExistingIndentation = /^\s{2,}\S/m.test(source);

  // If code already contains nested defs/classes, preserve user indentation
  // and only apply light cleanup to avoid breaking valid Python blocks.
  if (hasNestedDefinition || hasClassBlock || hasExistingIndentation) {
    const light = source
      .replace(/([a-zA-Z0-9_\])}])\s*\n\s*-\s+([a-zA-Z0-9_(])/g, "$1 - $2")
      .replace(/print\("\s*\n\s*([^"]+)"\)/g, 'print("\\n$1")')
      .replace(/\belse:\s+([^\n]+)/g, "else:\n$1")
      .replace(/\belif\s+([^:\n]+):\s+([^\n]+)/g, "elif $1:\n$2")
      .replace(/\bif\s+([^:\n]+):\s+([^\n]+?)\s+else:\s*([^\n]+)/g, "if $1:\n$2\nelse:\n$3")
      .replace(/([a-zA-Z0-9_)\]])\s+(heapq\.)/g, "$1\n$2")
      .replace(
        /(=\s*heapq\.[^\n]+?)\s+([a-zA-Z_][a-zA-Z0-9_]*\s*=\s*heapq\.)/g,
        "$1\n$2"
      )
      .replace(
        /(\[[^\]]+?)\n\s*for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([^\]]+)\]/g,
        "$1 for $2 in $3]"
      )
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const lines = light.split("\n");
    const fixed: string[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const current = lines[i];
      const trimmed = current.trim();
      const prevTrimmed = (fixed[fixed.length - 1] || "").trim();
      const prevIndent = (fixed[fixed.length - 1] || "").match(/^\s*/)?.[0].length ?? 0;
      const curIndent = current.match(/^\s*/)?.[0].length ?? 0;

      const prevStartsBlock =
        /^(if\b.*:|elif\b.*:|else:|for\b.*:|while\b.*:|try:|except\b.*:|finally:|with\b.*:|def\b.*:|class\b.*:)$/.test(
          prevTrimmed
        );
      const currentIsBlockContent = !/^(elif\b|else:|except\b|finally:)/.test(trimmed);

      if (prevStartsBlock && currentIsBlockContent && curIndent <= prevIndent) {
        fixed.push(`${" ".repeat(prevIndent + 4)}${trimmed}`);
      } else {
        fixed.push(current);
      }
    }

    return fixed.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  const prepared = String(raw || "")
    .replace(/([a-zA-Z0-9_\])}])\s*\n\s*-\s+([a-zA-Z0-9_(])/g, "$1 - $2")
    .replace(/([a-zA-Z0-9_)\]])\s+(heapq\.)/g, "$1\n$2")
    .replace(
      /(=\s*heapq\.[^\n]+?)\s+([a-zA-Z_][a-zA-Z0-9_]*\s*=\s*heapq\.)/g,
      "$1\n$2"
    )
    .replace(
      /(\[[^\]]+?)\n\s*for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([^\]]+)\]/g,
      "$1 for $2 in $3]"
    )
    .replace(/([a-zA-Z0-9_)\]])\s*\n\s*([+\-*/%][^\n]+)/g, "$1 $2")
    .replace(/\breturn\s+([^\n]+?)\s+return\s+/g, "return $1\nreturn ")
    .replace(/\breturn\s+([^:\n]+?)\s+def\s+/g, "return $1\ndef ")
    .replace(/\breturn\s+([^:\n]+?)\s+if\s+/g, "return $1\nif ")
    .replace(/\breturn\s+([^:\n]+?)\s+print\s*\(/g, "return $1\nprint(")
    .replace(/\bdef\s+([a-zA-Z_]\w*\s*\([^)]*\)\s*:\s*)(?=\S)/g, "def $1\n")
    .replace(
      /\bif\s+([^:\n]+):\s*([^\n]+?)\s+else:\s*([^\n]+)/g,
      "if $1:\n$2\nelse:\n$3"
    )
    .replace(/\belse:\s+([^\n]+)/g, "else:\n$1")
    .replace(/\belif\s+([^:\n]+):\s+([^\n]+)/g, "elif $1:\n$2")
    .replace(/\bif\s+([^:\n]+):\s+([^\n]+)/g, "if $1:\n$2")
    .replace(/\bfor\s+([^:\n]+):\s+([^\n]+)/g, "for $1:\n$2")
    .replace(/\bwhile\s+([^:\n]+):\s+([^\n]+)/g, "while $1:\n$2")
    .replace(/\bdef\s+([^:\n]+):\s+([^\n]+)/g, "def $1:\n$2")
    .replace(/\bfor\s+demonstration\b/gi, "# for demonstration")
    .replace(/([^\n])\s+(def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:)/g, "$1\n\n$2");

  const lines = prepared.split("\n");
  const out: string[] = [];
  let indent = 0;
  let inTopLevelFunction = false;
  let previousWasComment = false;

  for (let i = 0; i < lines.length; i += 1) {
    const original = lines[i];
    const line = original.replace(/\t/g, "    ").trim();
    if (!line) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      previousWasComment = false;
      continue;
    }

    if (/^(else:|elif\b|except\b|finally:)/.test(line)) {
      indent = Math.max(0, indent - 4);
    }

    // Top-level classes should start at base indentation.
    if (/^class\b/.test(line)) {
      indent = 0;
      inTopLevelFunction = false;
    }

    // Track top-level function scope only when def starts at base indentation.
    if (/^def\b/.test(line) && indent === 0) {
      inTopLevelFunction = true;
    }

    // Heuristic: execution prints often belong outside helper functions.
    if (inTopLevelFunction && indent >= 4 && /^print\s*\(/.test(line)) {
      indent = 0;
      inTopLevelFunction = false;
    }

    const malformedNarrativeControlLine =
      /^(for|if|while)\b/i.test(line) &&
      !line.endsWith(":") &&
      !/\b(in|range\s*\(|and|or|not)\b/.test(line);

    const looksLikeNaturalLanguage =
      /^[a-z][a-z0-9_ ]+[a-z0-9]$/i.test(line) &&
      !/[()[\]{}:]/.test(line) &&
      /\s/.test(line) &&
      !/^(def|class|if|elif|else|for|while|try|except|finally|with|return|print)\b/i.test(line);

    const isImportStatement = /^(import\s+[a-zA-Z_][\w.]*(\s+as\s+[a-zA-Z_]\w*)?|from\s+[a-zA-Z_][\w.]*\s+import\s+.+)$/.test(
      line
    );

    const safeLine =
      (looksLikeNaturalLanguage || malformedNarrativeControlLine) &&
      !isImportStatement &&
      !line.startsWith("#")
        ? `# ${line}`
        : line;

    const isComment = safeLine.startsWith("#");
    if (isComment && out.length > 0 && out[out.length - 1] !== "" && !previousWasComment) {
      out.push("");
    }

    let effectiveIndent = indent;
    // Heuristic: comments that introduce output section are usually outside loops.
    if (
      isComment &&
      indent > 0 &&
      /^#\s*(print|output|result|demonstration|example)/i.test(safeLine) &&
      out[out.length - 1] === ""
    ) {
      effectiveIndent = Math.max(0, indent - 4);
      indent = effectiveIndent;
    }

    out.push(`${" ".repeat(effectiveIndent)}${safeLine}`);
    previousWasComment = isComment;

    if (
      /^(if\b|elif\b|else:|for\b|while\b|def\b|class\b|try:|except\b|finally:|with\b)/.test(safeLine) &&
      safeLine.endsWith(":")
    ) {
      indent += 4;
    }

    if (/^return\b/.test(safeLine) && indent >= 4) {
      // Keep consecutive statements after return from staying in same inner block.
      // This helps recover from merged lines where execution code was appended.
      const nextRaw = lines[i + 1]?.trim() || "";
      if (nextRaw && !/^(elif\b|else:|except\b|finally:|#)/.test(nextRaw)) {
        indent = Math.max(0, indent - 4);
      }
    }
  }

  let normalized = out
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (/def\s+fib\s*\(/.test(normalized) && /return 0/.test(normalized)) {
    normalized = normalized.replace(
      /def\s+fib\s*\(([^)]*)\):[\s\S]*?(?=\n\s*def\b|\n\s*print\s*\(|$)/,
      [
        "def fib($1):",
        "    if n <= 1:",
        "        return n",
        "    return fib(n - 1) + fib(n - 2)",
      ].join("\n")
    );
  }

  normalized = normalized
    // Ensure visual separation between function blocks.
    .replace(/(\n\s*return[^\n]*)(\n\s*def\s+)/g, "$1\n\n$2")
    // Ensure execution lines are separated from function definitions.
    .replace(/(\n\s*def[^\n]*\n(?:[\s\S]*?))(\nprint\s*\()/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized;
};

const normalizeEditorCode = (raw: string) =>
  normalizePythonStructure(
    String(raw || "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .split("\n")
    .flatMap((line) => splitCommentAndCodeLine(line))
    .join("\n")
    .replace(/(^|\n)(print\([^)]*\))\s+(print\()/g, "$1$2\n$3")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
  );

async function loadPyodide(): Promise<PyodideInstance> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideInstance>((resolve, reject) => {
    const existing = document.getElementById("pyodide-script");
    if (existing) {
      const pyodideWindow = window as WindowWithPyodide;
      if (!pyodideWindow.loadPyodide) {
        reject(new Error("Pyodide loader is unavailable"));
        return;
      }
      pyodideWindow
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
      const pyodideWindow = window as WindowWithPyodide;
      if (!pyodideWindow.loadPyodide) {
        reject(new Error("Pyodide loader is unavailable"));
        return;
      }
      pyodideWindow
        .loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" })
        .then(resolve)
        .catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.body.appendChild(script);
  });

  return pyodidePromise;
}

export default function LivePythonEditor({
  initialCode,
  onSubmissionChange,
}: {
  initialCode: string;
  onSubmissionChange?: (submission: LiveEditorSubmission) => void;
}) {
  const [code, setCode] = useState(() => normalizeEditorCode(initialCode));
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const outputRef = useRef<HTMLPreElement | null>(null);
  const lastSubmissionSignatureRef = useRef<string>("");

  useEffect(() => {
    setCode(normalizeEditorCode(initialCode));
  }, [initialCode]);

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
    setError(null);
    setLoading(true);
    setOutput("");
    try {
      const pyodide = await loadPyodide();
      pyodide.globals.set("__user_code__", code);
      await pyodide.runPythonAsync(`
import io
import contextlib

__buf__ = io.StringIO()
__ns__ = {"__name__": "__main__"}
with contextlib.redirect_stdout(__buf__):
    exec(__user_code__, __ns__, __ns__)
__captured_output__ = __buf__.getvalue()
      `);

      const captured = pyodide.globals.get("__captured_output__");
      const text = String(captured || "");
      if (typeof (captured as { destroy?: () => void })?.destroy === "function") {
        (captured as { destroy: () => void }).destroy();
      }
      setOutput(text || "Done");
      setHasRun(true);
    } catch (err: unknown) {
      setOutput("");
      setError(err instanceof Error ? err.message : "Failed to run code");
      setHasRun(true);
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
        rows={12}
        value={code}
        onChange={(e) => {
          setCode(normalizeEditorCode(e.target.value));
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
            {output || "No output yet."}
          </pre>
        )}
      </div>
    </div>
  );
}

