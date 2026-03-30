import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror';
import HttpResponseView from "@/app/editors/http/http-response-view";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useEffect, useMemo, useRef, useState } from "react";
import executeHttpTemplate, { HttpExecution } from "@/postchi/http/runner/http-runner";
import { SendRequestInstructions } from "@/components/send-request-shortcut";
import { forceLinting, lintGutter } from "@codemirror/lint";
import { customHttp } from "@/app/editors/http/codemirror-language/http-language";
import { useEnvironment } from '@/app/active-environment/environment-context';
import DefaultFileStorage from '@/lib/storage/files/file-default';
import { loadText } from '@/app/editors/load-text';
import { Bullet } from '@/components/bullet';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/app/theme/theme-context';
import { toggleLineCommentAtStart } from '@/app/editors/toggle-line-comment';
import { isOnlyOsCommandKey } from '@/lib/utils/keyboard-event';
import { getResponseHistory } from '@/postchi/http/response-history/default-response-history';

export default function HttpRequestResponse({ path }: { path: string }) {

    const viewRef = useRef<EditorView>(null)

    const [response, setResponse] = useState<HttpExecutionStatus | null | undefined>(undefined)

    const { activeEnvironment } = useEnvironment()

    const abort = useRef(new AbortController());

    useEffect(() => {
        const handler = async (e: KeyboardEvent) => {
            if (e.key === "Enter" && isOnlyOsCommandKey(e)) {
                e.preventDefault();
                const text = viewRef.current?.state.doc.toString() ?? '';
                if (!text.trim()) {
                    return;
                }

                abort.current = new AbortController();

                setResponse(new Loading())

                const response = await executeHttpTemplate(text, path, abort.current);
                if (response.isOk) {
                    setResponse(response.value);
                    getResponseHistory().save(path, response.value);
                } else {
                    const error = response.error;
                    if (error.type === 'abort') {
                        setResponse(null)
                    } else {
                        setResponse(new Error(error.message))
                    }
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [activeEnvironment, path]);

    const submitKeymap = keymap.of([
        {
            key: "Mod-Enter",
            run: () => { return true; }
        },
        {
            key: "Mod-/",
            run: toggleLineCommentAtStart
        }
    ]);


    useEffect(() => {
        if (viewRef.current) {
            forceLinting(viewRef.current)
        }
    }, [activeEnvironment])

    const extensions = useMemo(() => {
        return [
            lintGutter(),
            customHttp(activeEnvironment ?? undefined),
            Prec.highest(submitKeymap),
        ];
    }, [activeEnvironment]);

    const saveOnBlur = (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            const text = viewRef.current?.state.doc.toString()
            if (text != undefined) {
                DefaultFileStorage.getInstance().writeText(path, text)
            }
        }
    }

    useEffect(() => {
        if (viewRef.current) {
            loadText(viewRef.current, path)
        }
        setResponse(undefined)
        getResponseHistory().getLatest(path).then(stored => {
            setResponse(stored);
        });
    }, [path])

    const { theme, gapless } = useTheme()
    const g = gapless

    return (
        <ResizablePanelGroup
            onBlur={saveOnBlur}
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="50%" className={g ? 'bg-background-panel' : 'rounded-xl bg-background-panel'}>
                <CodeMirror
                    onCreateEditor={(view) => {
                        viewRef.current = view;
                        loadText(view, path);
                    }}
                    height='100%'
                    theme={[theme.codemirror.editorTheme, theme.codemirror.syntaxHighlighting]}
                    className='height: 100% outline-none'
                    extensions={extensions}
                />
            </ResizablePanel>

            <ResizableHandle className={g ? 'w-px bg-muted' : 'bg-muted/70'} />

            <ResizablePanel className={g ? 'bg-background-panel overflow-hidden' : 'm-1 rounded-xl bg-background-panel overflow-hidden'}>
                <ResponsePanel response={response} onCancel={() => {
                    console.log('cancel')
                    abort.current.abort()
                }} />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

const ResponsePanel = ({ response, onCancel }: { response: HttpExecutionStatus | null | undefined, onCancel: () => void }) => {
    // response === undefined means it's loading the latest response from the history which might end up being null
    if (response === undefined) {
        return null
    }

    if (response === null) {
        return <SendRequestInstructions />
    }

    if ('response' in response) {
        return <HttpResponseView execution={response} />
    }

    if (response instanceof Loading) {
        return <LoadingView onCancel={onCancel} />
    }

    if (response instanceof Error) {
        return <div className='flex items-center justify-center text-center h-full text-destructive'>{response.message}</div>
    }
}

function LoadingView({ onCancel }: { onCancel: () => void }) {
    const [ms, setMs] = useState(0);

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            setMs(Date.now() - start);
        }, 10);

        return () => clearInterval(interval);
    }, []);

    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;

    const display = seconds > 0
        ? `${seconds}.${String(milliseconds).padStart(3, "0")}s`
        : `${milliseconds}ms`;

    return (
        <div className='flex flex-row my-2 mx-6 font-mono w-full'>
            <span className='text-muted mr-2'>---</span>
            <span className='text-muted'>--</span>
            <Bullet className='mx-3' />
            <span className='text-muted-foreground'>{display}</span>
            <Button variant='ghost' className='ml-auto mr-8' onClick={onCancel}>Cancel</Button>
        </div>
    );
}

class Loading { };
class Error {
    message: string;
    constructor(message: string) {
        this.message = message;
    }
};
type HttpExecutionStatus = HttpExecution | Loading | Error;