import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchCourse, type CourseWithLessons } from '@/lib/contentApi';

interface LessonSidebarProps {
  courseSlug: string;
  currentLessonId?: string;
  onNavigate?: () => void;
}

// Sidebar liệt kê toàn bộ bài học của khoá (đặc trưng giao diện W3Schools).
export default function LessonSidebar({ courseSlug, currentLessonId, onNavigate }: LessonSidebarProps) {
  const [course, setCourse] = useState<CourseWithLessons | null>(null);

  useEffect(() => {
    fetchCourse(courseSlug).then(setCourse).catch(() => setCourse(null));
  }, [courseSlug]);

  if (!course) return null;

  return (
    <nav aria-label="Danh sách bài học" className="text-sm">
      <div className="px-3 py-2 font-bold text-gray-900 dark:text-gray-100 uppercase text-xs tracking-wide">
        {course.title}
      </div>
      <ul>
        {course.lessons.map((lesson, idx) => (
          <li key={lesson.id}>
            <NavLink
              to={`/lessons/${lesson.id}`}
              onClick={onNavigate}
              className={() =>
                `block px-3 py-2 border-l-4 transition-colors ${
                  lesson.id === currentLessonId
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-300'
                }`
              }
            >
              <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
              {lesson.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
