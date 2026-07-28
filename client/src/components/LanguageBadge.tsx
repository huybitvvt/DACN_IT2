import type { ProgrammingLanguage } from '@/types';
import { languageLabel } from '@/lib/language';

const colors: Record<string, string> = {
  SQL: 'bg-amber-100 text-amber-800',
  C: 'bg-sky-100 text-sky-800',
  CPP: 'bg-indigo-100 text-indigo-800',
  PYTHON: 'bg-green-100 text-green-800',
};

export default function LanguageBadge({ language }: { language: ProgrammingLanguage }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        colors[language] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      }`}
    >
      {languageLabel(language)}
    </span>
  );
}
