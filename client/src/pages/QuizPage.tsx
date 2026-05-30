import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchQuiz,
  submitQuiz,
  type Quiz,
  type QuizResult,
} from '@/lib/quizApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function QuizPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    fetchQuiz(lessonId)
      .then(setQuiz)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [lessonId]);

  function toggleChoice(questionId: string, choiceId: string, single: boolean) {
    setAnswers((prev) => {
      const current = new Set(prev[questionId] ?? []);
      if (single) {
        return { ...prev, [questionId]: new Set([choiceId]) };
      }
      if (current.has(choiceId)) current.delete(choiceId);
      else current.add(choiceId);
      return { ...prev, [questionId]: current };
    });
  }

  async function handleSubmit() {
    if (!quiz) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        choiceIds: [...(answers[q.id] ?? [])],
      }));
      const res = await submitQuiz(quiz.id, payload);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (error && !quiz) return <Alert type="error">{error}</Alert>;
  if (!quiz) return null;

  const correctionMap = new Map(result?.corrections.map((c) => [c.questionId, c]));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>

      {result && (
        <Alert type={result.score === result.total ? 'success' : 'info'}>
          Bạn đúng {result.score}/{result.total} câu.
          {result.saved ? ' Kết quả đã được lưu.' : ''}
        </Alert>
      )}

      <ol className="space-y-5">
        {quiz.questions.map((q, qi) => {
          const correction = correctionMap.get(q.id);
          return (
            <li key={q.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900 mb-1">
                Câu {qi + 1}. {q.text}
              </p>
              {q.type === 'MULTI' && (
                <p className="text-xs text-gray-500 mb-2">(Có thể có nhiều đáp án đúng)</p>
              )}
              <div className="space-y-2">
                {q.choices.map((c) => {
                  const selected = answers[q.id]?.has(c.id) ?? false;
                  const isCorrectChoice = correction?.correctChoiceIds.includes(c.id);
                  // Sau khi nộp: tô xanh đáp án đúng.
                  const stateClass = result
                    ? isCorrectChoice
                      ? 'border-green-400 bg-green-50'
                      : selected
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200'
                    : selected
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-200';
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${stateClass}`}
                    >
                      <input
                        type={q.type === 'SINGLE' ? 'radio' : 'checkbox'}
                        name={q.id}
                        checked={selected}
                        disabled={Boolean(result)}
                        onChange={() => toggleChoice(q.id, c.id, q.type === 'SINGLE')}
                      />
                      <span className="text-sm text-gray-800">{c.text}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {error && <Alert type="error">{error}</Alert>}

      {!result && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Đang chấm...' : 'Nộp quiz'}
          </button>
          {!user && <span className="text-xs text-gray-500">Đăng nhập để lưu điểm.</span>}
        </div>
      )}
    </div>
  );
}
