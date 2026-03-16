"use client";

import { useMemo, useState } from "react";

export default function LiveHtmlPreview({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);

  const srcDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>body{font-family:Arial, sans-serif;padding:12px;}</style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  }, [code]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Live HTML/CSS Preview</p>
      </div>
      <textarea
        rows={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-900 dark:text-gray-100"
      />
      <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white">
        <iframe title="HTML preview" className="w-full h-48" sandbox="allow-scripts allow-same-origin" srcDoc={srcDoc} />
      </div>
    </div>
  );
}
