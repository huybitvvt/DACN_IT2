import type { ProgrammingLanguage } from '@/types';

const languageLabels: Record<ProgrammingLanguage, string> = {
  SQL: 'SQL',
  C: 'C',
  CPP: 'C++',
  PYTHON: 'Python',
};

export function languageLabel(language: ProgrammingLanguage): string {
  return languageLabels[language];
}
