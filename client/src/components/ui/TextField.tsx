import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

// Ô nhập liệu có nhãn và thông báo lỗi, kèm thuộc tính accessibility.
export default function TextField({ label, id, error, ...rest }: TextFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          error
            ? 'border-red-400 focus:border-red-500 dark:border-red-500/50'
            : 'border-gray-300 focus:border-brand-500 dark:border-slate-700'
        }`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
