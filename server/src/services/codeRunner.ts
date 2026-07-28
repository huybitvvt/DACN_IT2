import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export interface Judge0Language {
  id: number;
  name: string;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  timeMs: number | null;
}

interface Judge0Response {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  status?: {
    id?: number;
    description?: string;
  };
}

const PREFERRED_LANGUAGE_IDS: Record<string, number> = {
  BASH: 46,
  C: 50,
  CSHARP: 51,
  CPP: 54,
  D: 56,
  GO: 60,
  HASKELL: 61,
  JAVA: 62,
  JAVASCRIPT: 63,
  LUA: 64,
  PASCAL: 67,
  PHP: 68,
  PROLOG: 69,
  PYTHON: 71,
  RUBY: 72,
  RUST: 73,
  TYPESCRIPT: 74,
  KOTLIN: 78,
  R: 80,
  SCALA: 81,
  SQL: 82,
  SWIFT: 83,
  PERL: 85,
};

const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  BASH: [/^Bash \(/i],
  C: [/^C \(GCC/i, /^C \(Clang/i],
  CSHARP: [/^C#/i],
  CPP: [/^C\+\+ \(GCC/i, /^C\+\+ \(Clang/i],
  GO: [/^Go \(/i],
  JAVA: [/^Java \(/i],
  JAVASCRIPT: [/^JavaScript/i, /^Node/i],
  KOTLIN: [/^Kotlin/i],
  PHP: [/^PHP/i],
  PYTHON: [/^Python \(3/i, /^Python/i],
  RUBY: [/^Ruby/i],
  RUST: [/^Rust/i],
  SQL: [/^SQL/i],
  SWIFT: [/^Swift/i],
  TYPESCRIPT: [/^TypeScript/i],
};

let languageCache: { expiresAt: number; languages: Judge0Language[] } | null = null;
let activeExecutions = 0;

interface QueuedExecution {
  grant: () => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

const executionQueue: QueuedExecution[] = [];

function positiveLimit(value: number, fallback: number) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function releaseExecutionSlot() {
  activeExecutions = Math.max(0, activeExecutions - 1);
  const next = executionQueue.shift();
  if (!next) return;
  clearTimeout(next.timer);
  activeExecutions += 1;
  next.grant();
}

async function acquireExecutionSlot() {
  const maxConcurrent = positiveLimit(env.judge0MaxConcurrent, 32);
  const maxQueue = positiveLimit(env.judge0MaxQueue, 200);
  const queueTimeoutMs = positiveLimit(env.judge0QueueTimeoutMs, 15_000);

  if (activeExecutions < maxConcurrent) {
    activeExecutions += 1;
    return releaseExecutionSlot;
  }
  if (executionQueue.length >= maxQueue) {
    throw AppError.tooManyRequests(
      'Hàng đợi chạy code đã đầy. Vui lòng chờ các bài hiện tại hoàn tất.',
    );
  }

  return new Promise<() => void>((resolve, reject) => {
    const entry = {
      grant: () => resolve(releaseExecutionSlot),
      reject,
      timer: setTimeout(() => {
        const index = executionQueue.indexOf(entry);
        if (index >= 0) executionQueue.splice(index, 1);
        reject(
          AppError.tooManyRequests('Hàng đợi chạy code đang bận. Vui lòng thử lại sau ít giây.'),
        );
      }, queueTimeoutMs),
    };
    executionQueue.push(entry);
  });
}

function normalizeLanguageKey(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9+#.]/g, '');
  if (['C++', 'CPLUSPLUS'].includes(normalized)) return 'CPP';
  if (['C#', 'CS', 'DOTNET'].includes(normalized)) return 'CSHARP';
  if (['JS', 'NODE', 'NODEJS'].includes(normalized)) return 'JAVASCRIPT';
  if (['TS'].includes(normalized)) return 'TYPESCRIPT';
  if (['PY', 'PYTHON3'].includes(normalized)) return 'PYTHON';
  return normalized;
}

function configuredLanguageIds() {
  if (!env.judge0LanguageMap) return {};
  try {
    const parsed = JSON.parse(env.judge0LanguageMap) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => Number.isInteger(value))
        .map(([key, value]) => [normalizeLanguageKey(key), Number(value)]),
    );
  } catch {
    throw AppError.internal('JUDGE0_LANGUAGE_MAP phải là JSON dạng {"JAVA":62}.');
  }
}

export function selectJudge0Language(
  requestedLanguage: string,
  languages: Judge0Language[],
): Judge0Language | null {
  const key = normalizeLanguageKey(requestedLanguage);
  const configuredId = configuredLanguageIds()[key];
  const preferredId = configuredId ?? PREFERRED_LANGUAGE_IDS[key];
  if (preferredId) {
    const preferred = languages.find((language) => language.id === preferredId);
    if (preferred) return preferred;
  }

  for (const pattern of LANGUAGE_PATTERNS[key] ?? []) {
    const match = languages.find((language) => pattern.test(language.name));
    if (match) return match;
  }

  const exact = languages.find(
    (language) => normalizeLanguageKey(language.name.replace(/\s*\([^)]*\)\s*$/, '')) === key,
  );
  if (exact) return exact;

  return languages.find((language) => normalizeLanguageKey(language.name).startsWith(key)) ?? null;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw AppError.badGateway('Trình chạy code phản hồi quá chậm. Vui lòng thử lại.');
    }
    throw AppError.badGateway('Không kết nối được tới trình chạy code.');
  } finally {
    clearTimeout(timer);
  }
}

export async function listJudge0Languages(): Promise<Judge0Language[]> {
  if (languageCache && languageCache.expiresAt > Date.now()) {
    return languageCache.languages;
  }
  const response = await fetchWithTimeout(
    `${env.judge0Url.replace(/\/$/, '')}/languages`,
    { method: 'GET' },
    10_000,
  );
  if (!response.ok) {
    throw AppError.badGateway(
      `Không lấy được danh sách ngôn ngữ Judge0 (HTTP ${response.status}).`,
    );
  }
  const languages = (await response.json()) as Judge0Language[];
  languageCache = { expiresAt: Date.now() + 10 * 60_000, languages };
  return languages;
}

async function getLanguageId(language: string) {
  const languages = await listJudge0Languages();
  const selected = selectJudge0Language(language, languages);
  if (!selected) {
    throw AppError.badRequest(
      `Judge0 hiện không có runtime phù hợp cho ngôn ngữ: ${language}. Admin cần cấu hình JUDGE0_LANGUAGE_MAP.`,
    );
  }
  return selected.id;
}

function normalizeResult(data: Judge0Response): RunResult {
  const compileOutput = data.compile_output ?? '';
  const statusDescription = data.status?.description ?? 'Không rõ trạng thái';
  const statusId = data.status?.id;
  let status = statusDescription;
  if (statusId === 3) status = 'Thành công';
  else if (statusId === 6) status = 'Lỗi biên dịch';

  return {
    stdout: (data.stdout ?? '').replace(/\n$/, ''),
    stderr: ((data.stderr ?? '') + (data.message ? `\n${data.message}` : '')).trim(),
    compileOutput: compileOutput.replace(/\n$/, ''),
    status,
    timeMs: data.time ? Math.round(Number(data.time) * 1000) : null,
  };
}

async function waitForSubmission(token: string) {
  const deadline = Date.now() + env.judge0ResultTimeoutMs;
  let delayMs = 200;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const response = await fetchWithTimeout(
      `${env.judge0Url.replace(/\/$/, '')}/submissions/${encodeURIComponent(token)}?base64_encoded=false`,
      { method: 'GET' },
      10_000,
    );
    if (!response.ok) {
      throw AppError.badGateway(`Không đọc được kết quả Judge0 (HTTP ${response.status}).`);
    }
    const data = (await response.json()) as Judge0Response;
    if ((data.status?.id ?? 0) > 2) return data;
    delayMs = Math.min(1_000, Math.round(delayMs * 1.5));
  }
  throw AppError.badGateway('Judge0 đang có hàng đợi dài. Vui lòng thử lại sau.');
}

// Gửi bất đồng bộ vào hàng đợi Judge0 rồi poll token. Backend không yêu cầu
// Judge0 giữ kết nối HTTP trong suốt thời gian biên dịch.
export async function executeCode(params: {
  language: string;
  sourceCode: string;
  stdin?: string;
}): Promise<RunResult> {
  const release = await acquireExecutionSlot();
  try {
    return await executeCodeWithJudge0(params);
  } finally {
    release();
  }
}

async function executeCodeWithJudge0(params: {
  language: string;
  sourceCode: string;
  stdin?: string;
}): Promise<RunResult> {
  const languageId = await getLanguageId(params.language);
  const body = {
    language_id: languageId,
    source_code: params.sourceCode,
    stdin: params.stdin ?? '',
    cpu_time_limit: 5,
    wall_time_limit: 10,
    memory_limit: 128000,
    enable_network: false,
    enable_per_process_and_thread_time_limit: true,
    enable_per_process_and_thread_memory_limit: true,
  };

  const response = await fetchWithTimeout(
    `${env.judge0Url.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=false`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    10_000,
  );
  if (!response.ok) {
    if (response.status === 429) {
      throw AppError.tooManyRequests('Trình chạy code đang quá tải. Vui lòng thử lại sau.');
    }
    throw AppError.badGateway(`Judge0 trả về lỗi (HTTP ${response.status}).`);
  }
  const created = (await response.json()) as Judge0Response;
  if (!created.token) {
    throw AppError.badGateway('Judge0 không trả về mã tác vụ.');
  }
  return normalizeResult(await waitForSubmission(created.token));
}
