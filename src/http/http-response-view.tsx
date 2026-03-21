import { Bullet } from '../components/bullet';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { HttpExecution } from '@/lib/data/http/http-runner';
import { ContentTypeInfo } from '@/lib/data/http/body-classifier/http-body-classifier';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/theme-context/theme-context';
import { customHttpLanguage } from '@/lib/http/http-language';
import usePersistentState from '@/lib/hooks/persistent-state';
import { HttpRequest } from '@/lib/data/http/client/http-client';

export type HttpResponse = {
    status: number,
    durationInMillies: number,
    body: string
}

const HttpResponseView = ({ execution }: { execution: HttpExecution }) => {

    const [showRequest, setShowRequest, showRequestLoading] = usePersistentState('showRequest', false);
    const [showHeaders, setShowHeaders, showHeadersLoading] = usePersistentState('showHeaders', false);

    const response = execution.response;

    if (showRequestLoading || showHeadersLoading) return null;

    return (
        <div className='flex flex-col overflow-y-auto min-h-0 h-full'>
            <div className='flex flex-row my-2 mx-6 font-mono'>
                <span className={statusColor(response.status) + ' mr-2'}>{response.status}</span>
                <span className={statusColor(response.status)}>{status(response.status)}</span>
                <Bullet className='mx-3' />
                <span className='text-muted-foreground'>{execution.durationInMillies.toFixed(2)} ms</span>
                <div className='flex flex-row ml-auto'>
                    <div className='flex flex-col'>
                        <Button variant='ghost' className={cn([showRequest ? '' : 'text-muted-foreground', 'hover:bg-transparent'])} onClick={() => setShowRequest(!showRequest)}>
                            <span className={cn(['border-b-2', showRequest ? 'border-green-500' : 'border-muted'])}>Request</span>
                        </Button>

                    </div>
                    <Button variant='ghost' className={cn([showHeaders ? '' : 'text-muted-foreground', 'hover:bg-transparent'])} onClick={() => setShowHeaders(!showHeaders)}>
                        <span className={cn(['border-b-2', showHeaders ? 'border-green-500' : 'border-muted'])}>Response Headers</span>
                    </Button>
                </div>
            </div>
            {showRequest && <RequestView request={execution.response.request} />}
            {showHeaders && <ResponseHeaders headers={execution.response.headers} />}
            <BodyView body={execution.response.body} contentTypeInfo={execution.response.contentTypeInfo} />
        </div>
    );
}

const BodyView = ({ body, contentTypeInfo }: { body: string | ArrayBuffer, contentTypeInfo: ContentTypeInfo }) => {
    if (contentTypeInfo.kind === 'binary') {
        return <div>Binary content of type {contentTypeInfo.mimeType}</div>;
    } else {
        switch (contentTypeInfo.type) {
            case 'json':
                return <JsonView body={(body as string).trim()} />
            default:
                return <div>Text content of type {contentTypeInfo.mimeType}</div>;
        }
    }
}

const ResponseHeaders = ({ headers }: { headers: Headers }) => {
    const { theme } = useTheme();
    return (
        <div className='flex flex-col'>
            <div className='text-sm flex flex-row ml-4 mb-4'>
                <VerticalLine color='var(--secondary)' />
                <div className='flex flex-col'>
                    {Array.from(headers.entries()).map(([key, value], index) => (
                        <div key={index}>
                            <span style={{ color: theme.codemirror.tokens.attributeName, fontWeight: 'bold' }} >{key}: </span><span style={{ color: theme.codemirror.tokens.attributeValue }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const RequestView = ({ request }: { request: HttpRequest }) => {
    const { theme } = useTheme();

    const formatRequest = (request: HttpRequest): string => {
        let result = `${request.method} ${request.url}`;
        if (request.headers.length > 0) {
            result += '\n' + request.headers.map(([k, v]) => `${k}: ${v}`).join('\n');
        }
        return result;
    }

    return (
        <div className='flex flex-col'>
            <div className='text-sm flex flex-row ml-4'>
                <VerticalLine color='var(--secondary)' />
                <div className='flex flex-col'>
                    <CodeMirror
                        value={formatRequest(request)}
                        height='100%'
                        theme={theme.codemirror.theme}
                        className='height: 100% outline-none'
                        extensions={[customHttpLanguage]}
                        readOnly={true}
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            highlightActiveLine: false,
                            highlightActiveLineGutter: false,
                        }}
                    />
                    <RequestBodyView body={request.body} />
                </div>
            </div>
            <hr className="border-t border-muted/70 ml-2 mr-6 my-4" />
        </div>
    );
}

const RequestBodyView = ({ body }: { body: string | FormData | URLSearchParams }) => {
    if (!body) {
        return null;
    }
    const { theme } = useTheme();

    if (typeof body === 'string') {

        const formattedBody = () => {
            try {
                return JSON.stringify(JSON.parse(body), null, 2);
            } catch {
                return body;
            }
        }

        return <CodeMirror
            value={formattedBody()}
            theme={theme.codemirror.theme}
            readOnly={true}
            className='height: 100% outline-none'
            basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
            }}
            extensions={[json()]}
        />
    } else if (body instanceof FormData || body instanceof URLSearchParams) {
        const entries = Array.from(body.entries());
        return (
            <div className='ml-1'>
                {entries.map(([key, value], index) => (
                    <div key={index}>
                        <span style={{ color: theme.codemirror.tokens.attributeName }}>{key}: </span>
                        <span style={{ color: theme.codemirror.tokens.attributeValue }}>{value instanceof File ? `File(${value.name})` : String(value)}</span>
                    </div>
                ))}
            </div>
        );
    }
}


const JsonView = ({ body }: { body: string }) => {
    const { theme } = useTheme();
    return (
        <CodeMirror
            value={body}
            theme={theme.codemirror.theme}
            readOnly={true}
            className='height: 100% outline-none'
            extensions={[json()]}
        />
    );
}

const VerticalLine = ({ color }: { color: string }) => (
    <div className="border-r-2 rounded-md mr-2" style={{ borderColor: color }} />
);

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

export default HttpResponseView;