import { lazy, Suspense } from 'react';
import type { ProgrammingLanguage } from '@/types';

// Lazy-load playground (CodeMirror + runner nặng) để giảm bundle ban đầu.
const CodePlayground = lazy(() => import('./CodePlayground'));

interface ExampleBlockProps {
  language: ProgrammingLanguage;
  code: string;
}

// Ví dụ code tương tác: người học có thể sửa và chạy ngay.
// Python/SQL chạy phía client; C/C++ chạy qua backend (Judge0).
export default function ExampleBlock({ language, code }: ExampleBlockProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <Suspense
        fallback={<div className="text-sm text-gray-500 py-4">Đang tải trình soạn thảo...</div>}
      >
        <CodePlayground language={language} initialCode={code} showStdin={false} />
      </Suspense>
    </div>
  );
}
