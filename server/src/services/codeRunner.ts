import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Dịch vụ chạy/biên dịch code cho C và C++ qua Wandbox (https://wandbox.org).
// Miễn phí, không cần API key. Python/SQL vẫn chạy phía client (Pyodide/sql.js).

// Ánh xạ ngôn ngữ nội bộ -> compiler và tên file trên Wandbox.
const COMPILERS: Record<string, { compiler: string; filename: string }> = {
  C: { compiler: 'gcc-13.2.0-c', filename: 'main.c' },
  CPP: { compiler: 'gcc-13.2.0', filename: 'main.cpp' },
  PYTHON: { compiler: 'cpython-3.13.8', filename: 'main.py' },
};

export interface RunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  timeMs: number | null;
}

function getCompiler(language: string) {
  const c = COMPILERS[language];
  if (!c) {
    throw AppError.badRequest(`Ngôn ngữ không được hỗ trợ bởi trình chạy server: ${language}`);
  }
  return c;
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

interface WandboxResponse {
  status?: string; // mã thoát chương trình ('0' nếu thành công)
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
}

// Biên dịch & chạy code. Trả về stdout/stderr/compileOutput đã chuẩn hoá.
export async function executeCode(params: {
  language: string;
  sourceCode: string;
  stdin?: string;
}): Promise<RunResult> {
  const { compiler } = getCompiler(params.language);

  const body = {
    compiler,
    code: params.sourceCode,
    stdin: params.stdin ?? '',
    // Bật tối ưu cơ bản và chuẩn C++ hiện đại.
    'compiler-option-raw': params.language === 'CPP' ? '-std=c++17' : '',
  };

  const res = await fetchWithTimeout(
    `${env.wandboxUrl}/api/compile.json`,
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
    throw AppError.badGateway(`Trình chạy code trả về lỗi (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as WandboxResponse;

  const compileOutput = data.compiler_error ?? '';
  const exitStatus = data.status ?? '';
  let status: string;
  if (compileOutput && (data.program_output === undefined || exitStatus === '')) {
    status = 'Lỗi biên dịch';
  } else if (exitStatus === '0') {
    status = 'Thành công';
  } else {
    status = `Kết thúc với mã thoát ${exitStatus || '?'}`;
  }

  return {
    stdout: (data.program_output ?? '').replace(/\n$/, ''),
    stderr: (data.program_error ?? '').replace(/\n$/, ''),
    compileOutput: compileOutput.replace(/\n$/, ''),
    status,
    timeMs: null, // Wandbox không trả thời gian chạy ổn định.
  };
}
