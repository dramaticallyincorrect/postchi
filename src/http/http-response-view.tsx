import { Bullet } from '../components/bullet';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { buildCMTheme } from '@/lib/theme/theme-builder';
import { themes } from '@/lib/theme/themes';
import { jsonSyntaxHighlighting } from '../components/json-editor-tokens';

export type HttpResponse = {
    status: number,
    durationInMillies: number,
    body: string
}

const HttpresponseView = ({ response }: { response: HttpResponse }) => {
  
    return (
        <div className='flex-col overflow-y-auto h-full'>
            <div className='flex flex-row my-2 mx-6 font-mono'>
                <span className={statusColor(response.status)}> {status(response.status)}</span>
                <Bullet className='mx-3' />
                <span className='text-muted-foreground'>{response.durationInMillies} ms</span>
            </div>
            <CodeMirror
                value={response.body}
                theme={buildCMTheme(jsonSyntaxHighlighting(themes[1]), themes[1].editor)}
                readOnly={true}
                className='height: 100% outline-none'
                extensions={[json()]}
            />
        </div>
    );
}

function status(code: number): string {
    return StatusCodes[code] || "unknown";
}

const statusColor = (status: number) => {
    if (status >= 200 && status < 300) {
        return 'text-green-400';
    } else if (status >= 400 && status < 600) {
        return 'text-red-500';
    } else {
        return 'text-gray-500';
    }
};

const StatusCodes: { [key: number]: string } = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Satisfiable',
    417: 'Expectation Failed',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported'
};

export default HttpresponseView;