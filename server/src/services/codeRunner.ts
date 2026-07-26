import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Dịch vụ chạy/biên dịch code qua Judge0 CE tự host local.
// Python/SQL vẫn chạy thử phía client (Pyodide/sql.js), nhưng khi nộp bài thì
// server có thể chấm tập trung để giữ kín test case ẩn.

// Language id mặc định của Judge0 CE.
const LANGUAGE_IDS: Record<string, number> = {
  C: 50,
  CPP: 54,
  PYTHON: 71,
};

export interface RunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  timeMs: number | null;
}

function getLanguageId(language: string) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw AppError.badRequest(`Ngôn ngữ không được hỗ trợ bởi trình chạy server: ${language}`);
  }
  return languageId;
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

interface Judge0Response {
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

// Biên dịch & chạy code. Trả về stdout/stderr/compileOutput đã chuẩn hoá.
export async function executeCode(params: {
  language: string;
  sourceCode: string;
  stdin?: string;
}): Promise<RunResult> {
  const languageId = getLanguageId(params.language);

  const body = {
    language_id: languageId,
    source_code: params.sourceCode,
    stdin: params.stdin ?? '',
    cpu_time_limit: 5,
    wall_time_limit: 10,
    memory_limit: 128000,
    enable_network: false,
    // Docker Desktop on Windows uses cgroup v2, while Judge0 CE 1.13.x ships
    // isolate configured for cgroup v1. These flags make Judge0 use regular
    // per-process limits so local demo submissions run correctly.
    enable_per_process_and_thread_time_limit: true,
    enable_per_process_and_thread_memory_limit: true,
  };

  const res = await fetchWithTimeout(
    `${env.judge0Url.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    20000,
  );

  if (!res.ok) {
    if (res.status === 429) {
      throw AppError.tooManyRequests('Trình chạy code đang quá tải. Vui lòng thử lại sau.');
    }
    throw AppError.badGateway(`Judge0 trả về lỗi (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as Judge0Response;

  const compileOutput = data.compile_output ?? '';
  const statusDescription = data.status?.description ?? 'Không rõ trạng thái';
  const statusId = data.status?.id;
  let status = statusDescription;
  if (statusId === 3) {
    status = 'Thành công';
  } else if (statusId === 6) {
    status = 'Lỗi biên dịch';
  }

  return {
    stdout: (data.stdout ?? '').replace(/\n$/, ''),
    stderr: ((data.stderr ?? '') + (data.message ? `\n${data.message}` : '')).trim(),
    compileOutput: compileOutput.replace(/\n$/, ''),
    status,
    timeMs: data.time ? Math.round(Number(data.time) * 1000) : null,
  };
}
