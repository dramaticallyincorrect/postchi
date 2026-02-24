import CodeMirror, { keymap, Prec } from '@uiw/react-codemirror';
import { autocompletion } from "@codemirror/autocomplete"
import { lintGutter } from '@codemirror/lint';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { EnvironmentsLanguage, environmentSyntaxHighlighting } from '@/lib/environments/environments-language';
import { customHttp, httpSyntaxHighlighting } from '@/lib/http/http-language';

export enum EditorType {
  HTTP,
  ENVIRONMENT
}

export function HttpEditor({ theme, type, text, onChange }: { theme: PostchiTheme, type: EditorType, text: string, onChange: (value: string) => void }) {

  const language = type === EditorType.ENVIRONMENT ? EnvironmentsLanguage() : customHttp()

  const cmTheme = type === EditorType.ENVIRONMENT ? buildCMTheme(environmentSyntaxHighlighting(theme), theme.editor) : buildCMTheme(httpSyntaxHighlighting(theme), theme.editor)

  const submitKeymap = keymap.of([{
    key: "Mod-Enter", // "Mod" = Cmd on Mac, Ctrl on Windows
    run: () => {
      return true;
    }
  }]);


  return text ? (
    <CodeMirror
      value={text}
      onChange={onChange}
      height='100%'
      theme={cmTheme}
      className='height: 100% outline-none'
      extensions={[lintGutter(), language, autocompletion(), Prec.highest(submitKeymap)]}
    />
  ) : null;
}