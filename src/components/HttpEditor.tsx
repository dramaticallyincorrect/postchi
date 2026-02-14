// src/components/HttpEditor.tsx
import { registerHttpLanguage } from '@/lib/http-language';
import Editor, { OnMount } from '@monaco-editor/react';

interface HttpEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
}

export function HttpEditor({ value, onChange }: HttpEditorProps) {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    registerHttpLanguage(monaco);
    editor.trigger('anyString', 'editor.action.inspectTokens', null);
    editor.setPosition({ lineNumber: 1000, column: 1 });
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="customHttp"
      defaultValue={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
      }}
    />
  );
}