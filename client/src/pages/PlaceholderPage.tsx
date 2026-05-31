// Trang tạm cho các tính năng sẽ được xây ở các task sau.
// Giúp router hoạt động đầy đủ ngay từ khung ban đầu.
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-gray-500 dark:text-slate-400">Phần này sẽ được hoàn thiện trong các bước tiếp theo.</p>
    </div>
  );
}
