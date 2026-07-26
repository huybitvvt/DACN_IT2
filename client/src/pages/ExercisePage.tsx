import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchExercise,
  fetchSubmissionHistory,
  submitExercise,
  type ExerciseDetail,
  type SubmissionHistoryItem,
  type SubmitResult,
} from '@/lib/exerciseApi';
import { getErrorMessage } from '@/lib/api';
import { renderMarkdown } from '@/lib/markdown';
import { explainExerciseErrorStream } from '@/lib/aiApi';
import { useAuth } from '@/context/AuthContext';
import CodeEditor from '@/components/CodeEditor';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { Bot, Loader2 } from 'lucide-react';

export default function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [history, setHistory] = useState<SubmissionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchExercise(id)
      .then((ex) => {
        setExercise(ex);
        setCode(ex.starterCode);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  // Tải lịch sử nộp khi đã đăng nhập.
  useEffect(() => {
    if (!id || !user) return;
    fetchSubmissionHistory(id).then(setHistory).catch(() => setHistory([]));
  }, [id, user, result]);

  const promptHtml = useMemo(
    () => (exercise ? renderMarkdown(exercise.promptMarkdown) : ''),
    [exercise],
  );

  async function handleSubmit() {
    if (!id) return;
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const res = await submitExercise(id, code);
      setResult(res);
    } catch (err) {
      // Giữ lại code người dùng khi lỗi (Property 10).
      setError(getErrorMessage(err, 'Nộp bài thất bại. Code của bạn vẫn được giữ nguyên.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (error && !exercise) return <Alert type="error">{error}</Alert>;
  if (!exercise) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exercise.title}</h1>

      <div
        className="lesson-content text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-soft"
        dangerouslySetInnerHTML={{ __html: promptHtml }}
      />

      {exercise.sampleTestCases.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-soft">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Ví dụ test case</h2>
          <div className="space-y-2">
            {exercise.sampleTestCases.map((tc, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Input:</span>
                  <pre className="bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 p-2 rounded mt-1 whitespace-pre-wrap">{tc.input || '(trống)'}</pre>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Output:</span>
                  <pre className="bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 p-2 rounded mt-1 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                </div>
              </div>
            ))}
          </div>
          {exercise.hiddenTestCount > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              + {exercise.hiddenTestCount} test case ẩn để chấm điểm.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Bài làm của bạn</span>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Đang chấm...' : 'Nộp bài'}
          </button>
        </div>
        <CodeEditor language={exercise.language} value={code} onChange={setCode} height="260px" />
        {!user && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Bạn đang làm với tư cách khách. Đăng nhập để lưu kết quả vào tiến độ.
          </p>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {result && <ResultPanel result={result} exercise={exercise} sourceCode={code} />}

      {/* Lịch sử bài nộp (chỉ khi đã đăng nhập và có lịch sử) */}
      {user && history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {showHistory ? '▼' : '▶'} Lịch sử bài nộp ({history.length})
          </button>
          {showHistory && (
            <ul className="mt-2 space-y-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-ink-800 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        h.status === 'PASSED' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {h.status === 'PASSED' ? '✓ Đạt' : '✗ Chưa đạt'} ({h.passedCount}/{h.totalCount})
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(h.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-brand-600 dark:text-brand-400 text-xs">
                      Xem code
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {h.sourceCode}
                    </pre>
                    <button
                      onClick={() => setCode(h.sourceCode)}
                      className="mt-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      ↺ Nạp lại code này
                    </button>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  result,
  exercise,
  sourceCode,
}: {
  result: SubmitResult;
  exercise: ExerciseDetail;
  sourceCode: string;
}) {
  const isPass = result.status === 'PASSED';
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  // Gửi code và các test công khai bị sai qua luồng phân tích nhanh, không dùng RAG.
  async function explainError() {
    setExplaining(true);
    setExplanation('');
    try {
      await explainExerciseErrorStream(
        {
          language: exercise.language,
          title: exercise.title,
          sourceCode,
          compileError: result.compileError,
          failedTests: result.results
            .filter((test) => !test.passed && !test.isHidden)
            .slice(0, 2)
            .map((test) => ({
              input: test.input ?? '',
              expectedOutput: test.expectedOutput ?? '',
              actualOutput: test.actualOutput ?? '',
            })),
        },
        (token) => setExplanation((current) => current + token),
      );
    } catch (err) {
      setExplanation(
        getErrorMessage(err, 'Không lấy được giải thích từ AI. Vui lòng xem lỗi bên dưới.'),
      );
    } finally {
      setExplaining(false);
    }
  }

  return (
    <div className="space-y-3">
      <Alert type={isPass ? 'success' : 'error'}>
        {isPass
          ? `Đạt! Bạn đã qua ${result.passed}/${result.total} test case.`
          : result.status === 'ERROR'
            ? 'Lỗi khi chạy hoặc biên dịch — xem chi tiết bên dưới.'
            : `Chưa đạt: qua ${result.passed}/${result.total} test case.`}
      </Alert>

      {!isPass && (
        <div>
          <button
            onClick={explainError}
            disabled={explaining}
            aria-busy={explaining}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:opacity-60 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
          >
            {explaining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {explaining ? 'AI đang phân tích...' : 'Nhờ AI giải thích lỗi'}
          </button>
          {(explaining || explanation) && (
            <div
              aria-live="polite"
              className="mt-2 p-3 rounded-lg text-sm whitespace-pre-wrap bg-blue-50 text-blue-900 border border-blue-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30"
            >
              {explanation || 'Đã nhận code và kết quả test. Llama local đang kiểm tra...'}
            </div>
          )}
        </div>
      )}

      {result.compileError && (
        <pre className="p-3 rounded-lg text-sm font-mono whitespace-pre-wrap bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30 overflow-x-auto">
          {result.compileError}
        </pre>
      )}

      <ul className="space-y-2">
        {result.results.map((r) => (
          <li
            key={r.index}
            className={`p-3 rounded-lg border text-sm ${
              r.passed
                ? 'bg-green-50 border-green-200 text-gray-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-slate-200'
                : 'bg-red-50 border-red-200 text-gray-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Test #{r.index + 1} {r.isHidden && '(ẩn)'}
              </span>
              <span>{r.passed ? '✓ Đạt' : '✗ Sai'}</span>
            </div>
            {!r.isHidden && !r.passed && (
              <div className="mt-2 grid sm:grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Input</span>
                  <pre className="bg-white/70 dark:bg-slate-800/70 p-1.5 rounded mt-1 whitespace-pre-wrap">{r.input}</pre>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Mong đợi</span>
                  <pre className="bg-white/70 dark:bg-slate-800/70 p-1.5 rounded mt-1 whitespace-pre-wrap">{r.expectedOutput}</pre>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Của bạn</span>
                  <pre className="bg-white/70 dark:bg-slate-800/70 p-1.5 rounded mt-1 whitespace-pre-wrap">{r.actualOutput}</pre>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
