// src/components/HttpEditor.tsx
import { customHttp } from '@/lib/code-mirror-http';
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from "@codemirror/autocomplete"
import { lintGutter } from '@codemirror/lint';
import { buildCMTheme } from '@/lib/theme/http-theme';

export function HttpEditor({ theme }: { theme: PostchiTheme }) {
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
      theme={buildCMTheme(theme)}
      className='height: 100% outline-none'
      extensions={[lintGutter(), customHttp(), autocompletion()]}
    />
  );
}