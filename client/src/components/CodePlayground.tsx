import { useState } from 'react';
import type { ProgrammingLanguage } from '@/types';
import CodeEditor from './CodeEditor';
import { runPython } from '@/lib/runners/pyodideRunner';
import { runSql } from '@/lib/runners/sqlRunner';
import { runRemote } from '@/lib/runners/remoteRunner';
import { languageLabel } from '@/lib/language';

interface CodePlaygroundProps {
  language: ProgrammingLanguage;
  initialCode: string;
  showStdin?: boolean;
}

// Giới hạn thời gian chạy phía client cho Python (chống vòng lặp vô hạn).
const CLIENT_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Vượt quá thời gian cho phép.')), ms),
    ),
  ]);
}

export default function CodePlayground({
  language,
  initialCode,
  showStdin = false,
}: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState<'idle' | 'ok' | 'error'>('idle');
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    setOutput('');
    setOutputType('idle');
    try {
      if (language === 'PYTHON') {
        const res = await withTimeout(runPython(code, stdin), CLIENT_TIMEOUT_MS);
        if (res.stderr) {
          setOutput(res.stderr);
          setOutputType('error');
        } else {
          setOutput(res.stdout || '(không có kết quả)');
          setOutputType('ok');
        }
      } else if (language === 'SQL') {
        const res = await runSql(code);
        if (res.error) {
          setOutput(res.error);
          setOutputType('error');
        } else {
          setOutput(formatSqlResult(res.tables));
          setOutputType('ok');
        }
      } else {
        // C / C++ -> backend Judge0
        const res = await runRemote(language, code, stdin);
        if (res.compileOutput) {
          setOutput(res.compileOutput);
          setOutputType('error');
        } else if (res.stderr) {
          setOutput(res.stderr);
          setOutputType('error');
        } else {
          setOutput(res.stdout || '(không có kết quả)');
          setOutputType('ok');
        }
      }
    } catch (err) {
      setOutput(err instanceof Error ? err.message : String(err));
      setOutputType('error');
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    setCode(initialCode);
    setOutput('');
    setOutputType('idle');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          {languageLabel(language)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
            type="button"
          >
            Đặt lại
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            type="button"
          >
            {running ? 'Đang chạy...' : '▶ Chạy'}
          </button>
        </div>
      </div>

      <CodeEditor language={language} value={code} onChange={setCode} />

      {showStdin && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">Dữ liệu nhập (stdin)</label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Mỗi dòng là một dòng nhập"
          />
        </div>
      )}

      {outputType !== 'idle' && (
        <div>
          <span className="block text-sm text-gray-600 mb-1">Kết quả</span>
          <pre
            className={`p-3 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto ${
              outputType === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-gray-900 text-gray-100'
            }`}
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

// Định dạng kết quả truy vấn SQL thành bảng văn bản đơn giản.
function formatSqlResult(tables: { columns: string[]; rows: unknown[][] }[]): string {
  if (tables.length === 0) return 'Thực thi thành công (không có dữ liệu trả về).';
  return tables
    .map((t) => {
      const header = t.columns.join(' | ');
      const sep = t.columns.map(() => '---').join(' | ');
      const rows = t.rows.map((r) => r.map((c) => String(c)).join(' | '));
      return [header, sep, ...rows].join('\n');
    })
    .join('\n\n');
}
