import Editor from '@monaco-editor/react';
import { HttpEditor } from './components/HttpEditor';
import { useState } from 'react';

export function App() {
    const [code, setCode] = useState(`GET /api/users

// Authentication header
Content-Type = something
Authorization = Bearer <<AUTH_TOKEN>>
Content-Type = application/json
Content-Type = something
Content-Type = <<variable>>
Content-Type = <<>>
Content-Type = <<sdf>>sdfsd
Content-Type = <<sdf>> sdfsd
Content-Type = <<sdf>>  
// comment
user-agent = basic(param1, param2, <<variable>> , <<variable, <<nope>>sdfs, <<>>)
sdf=sdf
@body
{
  "id": "uuid()",
  "name": "John Doe"
}`);
    return <div className="h-screen">
        <HttpEditor />
    </div>
}

export default App;