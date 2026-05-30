import { api } from '../api';
import type { ProgrammingLanguage } from '@/types';

export interface RemoteRunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  timeMs: number | null;
}

// Gửi code C/C++ tới backend để biên dịch & chạy qua Judge0 (Task 11).
export async function runRemote(
  language: ProgrammingLanguage,
  sourceCode: string,
  stdin = '',
): Promise<RemoteRunResult> {
  const { data } = await api.post<RemoteRunResult>('/run', {
    language,
    sourceCode,
    stdin,
  });
  return data;
}
