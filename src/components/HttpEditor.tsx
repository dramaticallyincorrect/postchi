// src/components/HttpEditor.tsx
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from "@codemirror/autocomplete"
import { lintGutter } from '@codemirror/lint';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { EnvironmentsLanguage, environmentSyntaxHighlighting } from '@/lib/environments/environments-language';
import { useEffect, useState } from 'react';
import { TauriFileStorage } from '@/lib/data/files/file-tauri';
import { customHttp } from '@/lib/http/http-language';

export function HttpEditor({ theme, path }: { theme: PostchiTheme, path: string }) {

  const language = path.endsWith('.env') ? EnvironmentsLanguage() : customHttp()

  const [text, setText] = useState('')

  useEffect(() => {
    const loadFile = async () => {
      const storage = new TauriFileStorage()
      const content = await storage.readText(path)
      setText(content)
    }
    loadFile()
  }, [path])


  return text ? (
    <CodeMirror
      value={text}
      height='100%'
      theme={buildCMTheme(environmentSyntaxHighlighting(theme))}
      className='height: 100% outline-none'
      extensions={[lintGutter(), language, autocompletion()]}
    />
  ) : null;
}