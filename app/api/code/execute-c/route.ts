import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const runtime = 'nodejs';
const DEFAULT_REMOTE_EXECUTE_URL = 'https://emkc.org/api/v2/piston/execute';
const WANDBOX_EXECUTE_URL = 'https://wandbox.org/api/compile.json';
const DEFAULT_JUDGE0_URL = 'https://ce.judge0.com/submissions/?base64_encoded=false&wait=true';
const EXECUTION_MODE = String(process.env.C_EXECUTION_MODE || 'remote').toLowerCase(); // remote | local | auto
const REMOTE_RETRY_COUNT = Math.max(0, Number(process.env.C_REMOTE_RETRY_COUNT || 2));
const JUDGE0_URL = String(process.env.C_JUDGE0_URL || DEFAULT_JUDGE0_URL).trim();
const JUDGE0_API_KEY = String(process.env.C_JUDGE0_API_KEY || '').trim();
const JUDGE0_API_HOST = String(process.env.C_JUDGE0_API_HOST || '').trim();

type ExecResult = {
  stdout: string;
  stderr: string;
  code: number | null;
};

function normalizeCSourceForCompile(input: string): string {
  const src = String(input || '');
  if (!src.trim()) return src;

  // Fix common malformed starter output where code is appended to #include line:
  // "#include <stdint.h> int main(void) {"
  // -> split into two lines so the include stays valid.
  return src
    .replace(/(#\s*include\s*<[^>\n]+>)\s+(?=(?:int|void|static|const|size_t|uint\d+_t)\b)/g, '$1\n')
    .replace(/\r\n/g, '\n');
}

function runFile(command: string, args: string[], timeoutMs: number): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
      if (!error) {
        resolve({ stdout: String(stdout || ''), stderr: String(stderr || ''), code: 0 });
        return;
      }

      const err = error as NodeJS.ErrnoException & { code?: number | string | null };
      if (typeof err.code === 'string' && err.code === 'ENOENT') {
        reject(err);
        return;
      }

      resolve({
        stdout: String(stdout || ''),
        stderr: String(stderr || err.message || ''),
        code: typeof err.code === 'number' ? err.code : null,
      });
    });
  });
}

async function ensureDeleted(filePath: string) {
  try {
    await fs.rm(filePath, { force: true, recursive: true });
  } catch {
    // Ignore cleanup failures.
  }
}

async function tryCompile(
  compiler: 'gcc' | 'clang',
  sourcePath: string,
  outputPath: string
): Promise<ExecResult> {
  return runFile(compiler, ['-std=c11', '-O0', sourcePath, '-o', outputPath], 8000);
}

async function executeWithPiston(code: string, endpoint: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        version: '10.2.0',
        files: [{ content: code }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Piston request failed (${response.status}).`);

    const data = (await response.json()) as {
      run?: { stdout?: string; stderr?: string; code?: number | null; output?: string };
      message?: string;
    };

    const run = data?.run || {};
    const stdout = String(run.stdout || '');
    const stderr = String(run.stderr || '');
    const combined = String(run.output || '').trim();
    const output = stdout || combined || 'Program finished with no output.';
    const codeValue = typeof run.code === 'number' ? run.code : 0;

    if (codeValue !== 0) {
      return {
        success: false as const,
        stage: 'run' as const,
        output,
        error: stderr || data?.message || `Program exited with code ${codeValue}.`,
      };
    }

    return {
      success: true as const,
      output,
      error: stderr || '',
      compiler: 'remote:piston',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function executeWithWandbox(code: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(WANDBOX_EXECUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'gcc-head',
        code,
        options: 'warning,gnu++17',
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Wandbox request failed (${response.status}).`);

    const data = (await response.json()) as {
      program_output?: string;
      program_error?: string;
      compiler_output?: string;
      compiler_error?: string;
      status?: string;
      signal?: string;
    };

    const compileErr = String(data.compiler_error || data.compiler_output || '').trim();
    if (compileErr) {
      return {
        success: false as const,
        stage: 'compile' as const,
        output: '',
        error: compileErr,
      };
    }

    const runErr = String(data.program_error || '').trim();
    if (runErr) {
      return {
        success: false as const,
        stage: 'run' as const,
        output: String(data.program_output || ''),
        error: runErr,
      };
    }

    return {
      success: true as const,
      output: String(data.program_output || 'Program finished with no output.'),
      error: '',
      compiler: 'remote:wandbox',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function executeWithJudge0(code: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (JUDGE0_API_KEY) {
      headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
      if (JUDGE0_API_HOST) headers['X-RapidAPI-Host'] = JUDGE0_API_HOST;
    }

    const response = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // Judge0 C (GCC 9.2.0)
        language_id: 50,
        source_code: code,
        stdin: '',
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Judge0 request failed (${response.status}).`);

    const data = (await response.json()) as {
      stdout?: string;
      stderr?: string;
      compile_output?: string;
      message?: string;
      status?: { id?: number; description?: string };
    };

    const compileErr = String(data.compile_output || '').trim();
    if (compileErr) {
      return {
        success: false as const,
        stage: 'compile' as const,
        output: '',
        error: compileErr,
      };
    }

    const runErr = String(data.stderr || '').trim();
    if (runErr) {
      return {
        success: false as const,
        stage: 'run' as const,
        output: String(data.stdout || ''),
        error: runErr,
      };
    }

    if (String(data.message || '').trim()) {
      return {
        success: false as const,
        stage: 'run' as const,
        output: String(data.stdout || ''),
        error: String(data.message),
      };
    }

    return {
      success: true as const,
      output: String(data.stdout || 'Program finished with no output.'),
      error: '',
      compiler: 'remote:judge0',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function executeRemotely(code: string) {
  const primaryEndpoint = String(process.env.C_REMOTE_EXECUTE_URL || DEFAULT_REMOTE_EXECUTE_URL).trim();
  const errors: string[] = [];

  try {
    return await executeWithPiston(code, primaryEndpoint);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Primary remote compiler failed.');
  }

  if (primaryEndpoint !== DEFAULT_REMOTE_EXECUTE_URL) {
    try {
      return await executeWithPiston(code, DEFAULT_REMOTE_EXECUTE_URL);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Default Piston endpoint failed.');
    }
  }

  try {
    return await executeWithJudge0(code);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Judge0 fallback failed.');
  }

  try {
    return await executeWithWandbox(code);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Wandbox fallback failed.');
  }

  throw new Error(`Remote compiler failed. ${errors.join(' | ')}`);
}

function isTransientInfraErrorMessage(message: string): boolean {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('resource temporarily unavailable') ||
    text.includes('oci runtime error') ||
    text.includes('clone:') ||
    text.includes('timed out') ||
    text.includes('timeout') ||
    text.includes('econnreset') ||
    text.includes('503') ||
    text.includes('502') ||
    text.includes('429')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeRemotelyWithRetry(code: string) {
  const attempts = REMOTE_RETRY_COUNT + 1;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await executeRemotely(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err || 'Remote compiler failed.');
      lastError = err instanceof Error ? err : new Error(message);
      const shouldRetry = attempt < attempts && isTransientInfraErrorMessage(message);
      if (!shouldRetry) break;
      await delay(300 * attempt);
    }
  }

  throw lastError || new Error('Remote compiler failed.');
}

export async function POST(req: Request) {
  let tempDir = '';
  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = String(body?.code || '');
    const code = normalizeCSourceForCompile(rawCode);
    if (!code.trim()) {
      return NextResponse.json({ message: 'Code is required.' }, { status: 400 });
    }

    if (EXECUTION_MODE === 'remote') {
      const remote = await executeRemotelyWithRetry(code);
      return NextResponse.json(remote, { status: 200 });
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aivora-c-'));
    const sourcePath = path.join(tempDir, 'main.c');
    const isWindows = process.platform === 'win32';
    const outputPath = path.join(tempDir, isWindows ? 'program.exe' : 'program');

    await fs.writeFile(sourcePath, code, 'utf8');

    let compileResult: ExecResult | null = null;
    let compilerUsed: 'gcc' | 'clang' | null = null;

    for (const compiler of ['gcc', 'clang'] as const) {
      try {
        const result = await tryCompile(compiler, sourcePath, outputPath);
        compileResult = result;
        compilerUsed = compiler;
        if (result.code === 0) break;
      } catch (err) {
        const e = err as NodeJS.ErrnoException;
        if (e.code === 'ENOENT') {
          continue;
        }
        throw err;
      }
    }

    if (!compileResult || !compilerUsed) {
      if (EXECUTION_MODE === 'auto') {
        const remote = await executeRemotelyWithRetry(code);
        return NextResponse.json(remote, { status: 200 });
      }
      return NextResponse.json({ message: 'No C compiler found on server.' }, { status: 503 });
    }

    if (compileResult.code !== 0) {
      return NextResponse.json(
        {
          success: false,
          stage: 'compile',
          compiler: compilerUsed,
          output: compileResult.stdout,
          error: compileResult.stderr || 'Compilation failed.',
        },
        { status: 200 }
      );
    }

    const runResult = await runFile(outputPath, [], 5000);
    if (runResult.code !== 0) {
      return NextResponse.json(
        {
          success: false,
          stage: 'run',
          compiler: compilerUsed,
          output: runResult.stdout,
          error: runResult.stderr || `Program exited with code ${String(runResult.code)}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      compiler: compilerUsed,
      output: runResult.stdout || 'Program finished with no output.',
      error: runResult.stderr || '',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute C code.';
    return NextResponse.json({ message }, { status: 500 });
  } finally {
    if (tempDir) {
      await ensureDeleted(tempDir);
    }
  }
}
