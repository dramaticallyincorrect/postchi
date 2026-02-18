// src/components/HttpEditor.tsx
import { customHttp, httpTheme } from '@/lib/code-mirror-http';
import { json } from '@codemirror/lang-json';
import { syntaxHighlighting } from '@codemirror/language';
import CodeMirror from '@uiw/react-codemirror';
import { androidstudio } from '@uiw/codemirror-theme-androidstudio';
import { autocompletion } from "@codemirror/autocomplete"
import { lintGutter } from '@codemirror/lint';

export function HttpEditor() {
  const defaultValue =
    `POST /api/v1/data
Content-Type: application/json // this is a comment
user-agent: postchi/1.0.0 // <<useragent>>
Authorization: basic(param1, param2, <<token>>)

@body
{
  "name": "John",
  "age": 30,
  "location": {
    "city": "New York",
    "country": "USA"
  }
}
`;

  return (
    <CodeMirror
      value={defaultValue}
      height='100%'
      theme={[httpTheme]}
      className='height: 100% outline-none'
      extensions={[lintGutter(),customHttp(), autocompletion()]}
    />
  );
}