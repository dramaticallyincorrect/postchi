// src/components/HttpEditor.tsx
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from "@codemirror/autocomplete"
import { lintGutter } from '@codemirror/lint';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { EnvironmentsLanguage, environmentSyntaxHighlighting } from '@/lib/environments/environments-language';

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

const environments =
    `
# production
api_url=https://api.example.com // this is a comment
auth_url = https://api.auth.example.com

# development

api_url=http://localhost:3000

`.trim();

  return (
    <CodeMirror
      value={environments}
      height='100%'
      theme={buildCMTheme(environmentSyntaxHighlighting(theme))}
      className='height: 100% outline-none'
      extensions={[lintGutter(), EnvironmentsLanguage(), autocompletion()]}
    />
  );
}