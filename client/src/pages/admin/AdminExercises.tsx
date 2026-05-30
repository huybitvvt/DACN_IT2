import { useEffect, useState } from 'react';
import {
  adminListCourses,
  adminListLessons,
  adminListExercises,
  adminCreateExercise,
  adminDeleteExercise,
  type AdminCourse,
  type AdminLesson,
  type AdminExercise,
  type AdminTestCase,
} from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/api';
import type { ProgrammingLanguage } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function AdminExercises() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const emptyForm = {
    title: '',
    promptMarkdown: '',
    language: 'PYTHON' as ProgrammingLanguage,
    starterCode: '',
    order: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const [testCases, setTestCases] = useState<AdminTestCase[]>([
    { input: '', expectedOutput: '', isHidden: false },
  ]);

  useEffect(() => {
    adminListCourses()
      .then((cs) => {
        setCourses(cs);
        if (cs.length) setCourseId(cs[0].id);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    adminListLessons(courseId)
      .then((ls) => {
        setLessons(ls);
        setLessonId(ls[0]?.id ?? '');
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [courseId]);

  useEffect(() => {
    if (!lessonId) {
      setExercises([]);
      return;
    }
    adminListExercises(lessonId)
      .then(setExercises)
      .catch((err) => setError(getErrorMessage(err)));
  }, [lessonId]);

  function updateTestCase(i: number, patch: Partial<AdminTestCase>) {
    setTestCases((prev) => prev.map((tc, idx) => (idx === i ? { ...tc, ...patch } : tc)));
  }

  async function handleCreate() {
    setError('');
    try {
      await adminCreateExercise({ ...form, lessonId, testCases });
      setForm(emptyForm);
      setTestCases([{ input: '', expectedOutput: '', isHidden: false }]);
      setExercises(await adminListExercises(lessonId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá bài tập này?')) return;
    try {
      await adminDeleteExercise(id);
      setExercises(await adminListExercises(lessonId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý bài tập</h1>
      {error && <Alert type="error">{error}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="px-3 py-2 border border-gray-300 rounded text-sm"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded text-sm"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        <h2 className="font-semibold">Thêm bài tập</h2>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          placeholder="Tiêu đề"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          placeholder="Đề bài (Markdown)"
          rows={3}
          value={form.promptMarkdown}
          onChange={(e) => setForm({ ...form, promptMarkdown: e.target.value })}
        />
        <div className="flex gap-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value as ProgrammingLanguage })}
          >
            <option value="PYTHON">Python</option>
            <option value="C">C</option>
            <option value="CPP">C++</option>
          </select>
        </div>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
          placeholder="Code khởi tạo (starter code)"
          rows={3}
          value={form.starterCode}
          onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Test cases</h3>
            <button
              onClick={() =>
                setTestCases((prev) => [...prev, { input: '', expectedOutput: '', isHidden: false }])
              }
              className="text-sm text-brand-700 hover:underline"
            >
              + Thêm test case
            </button>
          </div>
          {testCases.map((tc, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <textarea
                className="px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                placeholder="Input"
                rows={2}
                value={tc.input}
                onChange={(e) => updateTestCase(i, { input: e.target.value })}
              />
              <textarea
                className="px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                placeholder="Expected output"
                rows={2}
                value={tc.expectedOutput}
                onChange={(e) => updateTestCase(i, { expectedOutput: e.target.value })}
              />
              <label className="text-xs flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={tc.isHidden}
                  onChange={(e) => updateTestCase(i, { isHidden: e.target.checked })}
                />
                Ẩn
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded bg-brand-600 text-white text-sm hover:bg-brand-700"
        >
          Thêm bài tập
        </button>
      </div>

      <ul className="space-y-2">
        {exercises.map((ex) => (
          <li
            key={ex.id}
            className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
          >
            <span>
              {ex.title}{' '}
              <em className="text-xs text-gray-400">
                ({ex.testCases.length} test, {ex.testCases.filter((t) => t.isHidden).length} ẩn)
              </em>
            </span>
            <button onClick={() => handleDelete(ex.id)} className="text-red-600 hover:underline text-sm">
              Xoá
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
