import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from "@codemirror/autocomplete"
import { lintGutter } from '@codemirror/lint';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { EnvironmentsLanguage, environmentSyntaxHighlighting } from '@/lib/environments/environments-language';
import { useEffect, useState } from 'react';
import { customHttp, httpSyntaxHighlighting } from '@/lib/http/http-language';
import DefaultFileStorage from '@/lib/data/files/file-default';

export function HttpEditor({ theme, path }: { theme: PostchiTheme, path: string }) {

  const language = path.endsWith('.env') ? EnvironmentsLanguage() : customHttp()

  const cmTheme = path.endsWith('.env') ? buildCMTheme(environmentSyntaxHighlighting(theme)) : buildCMTheme(httpSyntaxHighlighting(theme))

  const [text, setText] = useState('')

  useEffect(() => {
    const loadFile = async () => {
      const storage = new DefaultFileStorage()
      const content = await storage.readText(path)
      setText(content)
    }
    loadFile()
  }, [path])


  return text ? (
    <CodeMirror
      value={text}
      height='100%'
      theme={cmTheme}
      className='height: 100% outline-none'
      extensions={[lintGutter(), language, autocompletion()]}
    />
  ) : null;
}