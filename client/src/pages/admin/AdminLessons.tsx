import { useCallback, useEffect, useState } from 'react';
import {
  adminListCourses,
  adminListLessons,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  type AdminCourse,
  type AdminLesson,
} from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

export default function AdminLessons() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const emptyForm = { title: '', contentMarkdown: '', order: 0, isPublic: true };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    const cs = await adminListCourses();
    setCourses(cs);
    setCourseId((current) => current || cs[0]?.id || '');
  }, []);

  const loadLessons = useCallback(async (cid: string) => {
    if (!cid) return;
    setLessons(await adminListLessons(cid));
  }, []);

  useEffect(() => {
    loadCourses()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [loadCourses]);

  useEffect(() => {
    if (courseId) void loadLessons(courseId).catch((err) => setError(getErrorMessage(err)));
  }, [courseId, loadLessons]);

  async function handleSave() {
    setError('');
    try {
      const payload = { ...form, courseId };
      if (editingId) await adminUpdateLesson(editingId, payload);
      else await adminCreateLesson(payload);
      setForm(emptyForm);
      setEditingId(null);
      await loadLessons(courseId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá bài học này?')) return;
    try {
      await adminDeleteLesson(id);
      await loadLessons(courseId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEdit(l: AdminLesson) {
    setEditingId(l.id);
    setForm({
      title: l.title,
      contentMarkdown: l.contentMarkdown,
      order: l.order,
      isPublic: l.isPublic,
    });
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý bài học</h1>
      {error && <Alert type="error">{error}</Alert>}

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-slate-400">Khoá học:</label>
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
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-soft space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">{editingId ? 'Sửa bài học' : 'Thêm bài học'}</h2>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          placeholder="Tiêu đề bài học"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
          placeholder="Nội dung (Markdown)"
          rows={6}
          value={form.contentMarkdown}
          onChange={(e) => setForm({ ...form, contentMarkdown: e.target.value })}
        />
        <div className="flex items-center gap-4">
          <input
            type="number"
            className="px-3 py-2 border border-gray-300 rounded text-sm w-28"
            placeholder="Thứ tự"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            Công khai
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-brand-600 text-white text-sm hover:bg-brand-700"
          >
            {editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="px-4 py-2 rounded border border-gray-300 dark:border-slate-700 dark:text-slate-200 text-sm"
            >
              Huỷ
            </button>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {lessons.map((l) => (
          <li
            key={l.id}
            className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200"
          >
            <span>
              {l.title} {!l.isPublic && <em className="text-xs text-gray-400 dark:text-slate-500">(ẩn)</em>}
            </span>
            <span className="space-x-2 text-sm">
              <button onClick={() => startEdit(l)} className="text-brand-700 dark:text-brand-400 hover:underline">
                Sửa
              </button>
              <button onClick={() => handleDelete(l.id)} className="text-red-600 dark:text-red-400 hover:underline">
                Xoá
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
