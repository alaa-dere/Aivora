'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

const normalizeEditorCode = (raw: string) =>
  String(raw || '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .replace(/(#[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\/[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n');

export default function LiveSqlEditor({
  initialCode,
  onSubmissionChange,
}: {
  initialCode: string;
  onSubmissionChange?: (submission: LiveEditorSubmission) => void;
}) {
  const [code, setCode] = useState(() => normalizeEditorCode(initialCode));
  const [output, setOutput] = useState<string>('No output yet.');
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const outputRef = useRef<HTMLPreElement | null>(null);
  const lastSubmissionSignatureRef = useRef<string>('');

  useEffect(() => {
    setCode(normalizeEditorCode(initialCode));
  }, [initialCode]);

  useEffect(() => {
    const signature = JSON.stringify({
      code,
      output,
      hasRun,
      error: error || null,
    });
    if (signature === lastSubmissionSignatureRef.current) return;
    lastSubmissionSignatureRef.current = signature;
    onSubmissionChange?.({ code, output, hasRun, error });
  }, [code, output, hasRun, error, onSubmissionChange]);

  const runQuery = () => {
    const sql = code.trim();
    if (!sql) {
      setError('SQL query is empty.');
      setOutput('SQL query is empty.');
      setHasRun(true);
      return;
    }

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    const firstKeyword = (statements[0]?.split(/\s+/)[0] || '').toUpperCase();
    const allowed = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'WITH'];

    if (!allowed.includes(firstKeyword)) {
      setError('Could not detect a valid SQL statement.');
      setOutput('Could not detect a valid SQL statement.');
      setHasRun(true);
      return;
    }

    setError(null);
    setOutput(`SQL parsed successfully (${statements.length} statement${statements.length > 1 ? 's' : ''}).`);
    setHasRun(true);

    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const buttonLabel = useMemo(() => 'Run SQL', []);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Live SQL Editor</p>
        <button
          type="button"
          onClick={runQuery}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold"
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
        spellCheck={false}
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


