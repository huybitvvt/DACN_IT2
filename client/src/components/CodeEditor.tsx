import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { cpp } from '@codemirror/lang-cpp';
import type { Extension } from '@codemirror/state';
import type { ProgrammingLanguage } from '@/types';

function extensionsFor(language: ProgrammingLanguage): Extension[] {
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
  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      <CodeMirror
        value={value}
        height={height}
        extensions={extensionsFor(language)}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{ lineNumbers: true, highlightActiveLine: !readOnly }}
      />
    </div>
  );
}
