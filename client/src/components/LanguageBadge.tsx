import type { ProgrammingLanguage } from '@/types';

const labels: Record<ProgrammingLanguage, string> = {
  SQL: 'SQL',
  C: 'C',
  CPP: 'C++',
  PYTHON: 'Python',
};

const colors: Record<ProgrammingLanguage, string> = {
  SQL: 'bg-amber-100 text-amber-800',
  C: 'bg-sky-100 text-sky-800',
  CPP: 'bg-indigo-100 text-indigo-800',
  PYTHON: 'bg-green-100 text-green-800',
};

export default function LanguageBadge({ language }: { language: ProgrammingLanguage }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[language]}`}>
      {labels[language]}
    </span>
  );
}

export function languageLabel(language: ProgrammingLanguage): string {
  return labels[language];
}
