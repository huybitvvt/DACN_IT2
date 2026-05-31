export default function Spinner({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 dark:text-slate-400"
      role="status"
    >
      <span className="relative inline-flex h-8 w-8">
        {/* Vòng nền mờ */}
        <span className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
        {/* Cung xoay */}
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-500" />
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
