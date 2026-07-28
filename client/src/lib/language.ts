import type { ProgrammingLanguage } from '@/types';

const languageLabels: Record<string, string> = {
  SQL: 'SQL',
  C: 'C',
  CPP: 'C++',
  CSHARP: 'C#',
  PYTHON: 'Python',
  JAVA: 'Java',
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  GO: 'Go',
  RUST: 'Rust',
  PHP: 'PHP',
  RUBY: 'Ruby',
  KOTLIN: 'Kotlin',
  SWIFT: 'Swift',
};

export const programmingLanguageOptions = Object.entries(languageLabels).map(([value, label]) => ({
  value,
  label,
}));

export function languageLabel(language: ProgrammingLanguage): string {
  return languageLabels[language] ?? language;
}
