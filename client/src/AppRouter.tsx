import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import LessonPage from '@/pages/LessonPage';
import QuizPage from '@/pages/QuizPage';
import SearchPage from '@/pages/SearchPage';
import DashboardPage from '@/pages/DashboardPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import RoadmapPage from '@/pages/RoadmapPage';
import CertificatePage from '@/pages/CertificatePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Trang dùng CodeMirror được tải động để không phình bundle chính.
const ExercisePage = lazy(() => import('@/pages/ExercisePage'));

// Khu vực admin tải động (chỉ admin mới vào).
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminHome = lazy(() => import('@/pages/admin/AdminHome'));
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'));
const AdminLessons = lazy(() => import('@/pages/admin/AdminLessons'));
const AdminExercises = lazy(() => import('@/pages/admin/AdminExercises'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải...</div>}>{children}</Suspense>;
}

// Định tuyến toàn ứng dụng. Các trang placeholder sẽ được thay bằng trang thật
// ở các task tương ứng (đăng nhập, khoá học, bài học, bài tập, admin...).
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      { path: 'lessons/:id', element: <LessonPage /> },
      { path: 'lessons/:id/quiz', element: <QuizPage /> },
      { path: 'exercises/:id', element: <Lazy><ExercisePage /></Lazy> },
      { path: 'search', element: <SearchPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roadmap/:slug',
        element: (
          <ProtectedRoute>
            <RoadmapPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'certificate/:slug',
        element: (
          <ProtectedRoute>
            <CertificatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <Lazy>
              <AdminLayout />
            </Lazy>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Lazy><AdminHome /></Lazy> },
          { path: 'courses', element: <Lazy><AdminCourses /></Lazy> },
          { path: 'lessons', element: <Lazy><AdminLessons /></Lazy> },
          { path: 'exercises', element: <Lazy><AdminExercises /></Lazy> },
          { path: 'users', element: <Lazy><AdminUsers /></Lazy> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
