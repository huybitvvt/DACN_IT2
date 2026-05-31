import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCourse, fetchLesson, type CourseWithLessons } from '@/lib/contentApi';
import { fetchProgress } from '@/lib/progressApi';
import { getErrorMessage } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

interface RoadmapStep {
  id: string;
  label: string;
  type: 'LESSON' | 'EXERCISE' | 'QUIZ';
  to: string;
  completed: boolean;
}

export default function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      try {
        const [courseData, progress] = await Promise.all([fetchCourse(slug), fetchProgress()]);
        setCourse(courseData);
        const completed = new Set(progress.completedItemIds);

        // Dựng các bước theo thứ tự: với mỗi bài học, lấy thêm bài tập & quiz.
        const allSteps: RoadmapStep[] = [];
        for (const lessonSummary of courseData.lessons) {
          allSteps.push({
            id: lessonSummary.id,
            label: lessonSummary.title,
            type: 'LESSON',
            to: `/lessons/${lessonSummary.id}`,
            completed: completed.has(lessonSummary.id),
          });
          // Tải chi tiết bài học để biết bài tập & quiz.
          const detail = await fetchLesson(lessonSummary.id);
          for (const ex of detail.exercises) {
            allSteps.push({
              id: ex.id,
              label: `Bài tập: ${ex.title}`,
              type: 'EXERCISE',
              to: `/exercises/${ex.id}`,
              completed: completed.has(ex.id),
            });
          }
          if (detail.quiz) {
            allSteps.push({
              id: detail.quiz.id,
              label: `Quiz: ${lessonSummary.title}`,
              type: 'QUIZ',
              to: `/lessons/${lessonSummary.id}/quiz`,
              completed: completed.has(detail.quiz.id),
            });
          }
        }
        setSteps(allSteps);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!course) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lộ trình: {course.title}</h1>
        <p className="text-gray-600 dark:text-slate-400">{course.description}</p>
      </div>

      <ol className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-3 space-y-4">
        {steps.map((step) => (
          <li key={`${step.type}-${step.id}`} className="ml-6">
            <span
              className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                step.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {step.completed ? '✓' : ''}
            </span>
            <Link
              to={step.to}
              className={`block p-3 rounded-lg border transition-colors ${
                step.completed
                  ? 'bg-green-50 border-green-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                  : 'bg-white border-gray-200 hover:border-brand-400 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-brand-500/60'
              }`}
            >
              <span className="text-gray-800 dark:text-slate-200">{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
