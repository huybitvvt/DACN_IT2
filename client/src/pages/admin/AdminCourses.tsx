import { useEffect, useState } from 'react';
import {
  adminListCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  type AdminCourse,
} from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/api';
import type { ProgrammingLanguage } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

const empty = {
  slug: '',
  title: '',
  language: 'PYTHON' as ProgrammingLanguage,
  description: '',
  order: 0,
};

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<typeof empty>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCourses(await adminListCourses());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave() {
    setError('');
    try {
      if (editingId) await adminUpdateCourse(editingId, form);
      else await adminCreateCourse(form);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá khoá học này? Mọi bài học/bài tập bên trong cũng sẽ bị xoá.')) return;
    try {
      await adminDeleteCourse(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEdit(c: AdminCourse) {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      title: c.title,
      language: c.language,
      description: c.description,
      order: c.order,
    });
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý khoá học</h1>
      {error && <Alert type="error">{error}</Alert>}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-soft space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">{editingId ? 'Sửa khoá học' : 'Thêm khoá học'}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Slug (vd: python)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value as ProgrammingLanguage })}
          >
            <option value="PYTHON">Python</option>
            <option value="SQL">SQL</option>
            <option value="C">C</option>
            <option value="CPP">C++</option>
          </select>
          <input
            type="number"
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Thứ tự"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
        </div>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          placeholder="Mô tả"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
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
                setForm(empty);
              }}
              className="px-4 py-2 rounded border border-gray-300 dark:border-slate-700 dark:text-slate-200 text-sm"
            >
              Huỷ
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
        <table className="w-full text-sm bg-white dark:bg-slate-900">
          <thead className="bg-gray-50 dark:bg-slate-800/60 text-left text-gray-600 dark:text-slate-300">
            <tr>
              <th className="p-3 font-semibold">Tiêu đề</th>
              <th className="p-3 font-semibold">Slug</th>
              <th className="p-3 font-semibold">Ngôn ngữ</th>
              <th className="p-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 dark:text-slate-200">
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 dark:border-slate-800">
                <td className="p-3">{c.title}</td>
                <td className="p-3 text-gray-500 dark:text-slate-400">{c.slug}</td>
                <td className="p-3">{c.language}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => startEdit(c)} className="text-brand-700 dark:text-brand-400 hover:underline">
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 dark:text-red-400 hover:underline">
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
