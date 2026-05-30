import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { cpp } from '@codemirror/lang-cpp';
import { autocompletion } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { keymap } from '@codemirror/view';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import type { Extension } from '@codemirror/state';
import type { ProgrammingLanguage } from '@/types';
import { useTheme } from '@/context/ThemeContext';

function languageExtensions(language: ProgrammingLanguage): Extension[] {
  switch (language) {
    case 'PYTHON':
      return [python()];
    case 'SQL':
      return [sql()];
    case 'C':
    case 'CPP':
      return [cpp()];
    default:
      return [];
  }
}

interface CodeEditorProps {
  language: ProgrammingLanguage;
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  height = '200px',
  readOnly = false,
}: CodeEditorProps) {
  const { theme } = useTheme();

  // Các extension nâng cao: autocomplete, phím tắt tìm kiếm (Ctrl+F).
  const extensions: Extension[] = [
    ...languageExtensions(language),
    autocompletion(),
    keymap.of(searchKeymap),
  ];

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
      <CodeMirror
        value={value}
        height={height}
        theme={theme === 'dark' ? vscodeDark : vscodeLight}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: !readOnly,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          foldGutter: true,
          highlightSelectionMatches: true,
        }}
      />
    </div>
  );
}
