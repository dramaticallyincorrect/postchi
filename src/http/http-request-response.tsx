import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror';
import HttpResponseView, { HttpResponse } from "@/http/http-response-view";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { themes } from "@/lib/theme/themes";
import { useEffect, useMemo, useRef, useState } from "react";
import executeHttpTemplate from "@/lib/data/http/http-runner";
import { SendRequestInstructions } from "@/components/send-request-shortcut";
import { forceLinting, lintGutter } from "@codemirror/lint";
import { buildCMTheme } from "@/lib/theme/theme-builder";
import { customHttp, httpSyntaxHighlighting } from "@/lib/http/http-language";
import { useEnvironment } from '@/active-environment/environment-context';
import DefaultFileStorage from '@/lib/data/files/file-default';
import { loadText } from '@/editors/load-text';

export default function HttpRequestResponse({ path }: { path: string }) {

    const viewRef = useRef<EditorView>(null)

    const [response, setResponse] = useState<HttpResponse | null>(null)

    const { activeEnvironment } = useEnvironment()

    useEffect(() => {
        const handler = async (e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                const text = viewRef.current?.state.doc.toString() ?? '';
                if (!text.trim()) {
                    return;
                }

                const response = await executeHttpTemplate(text);

                if (!response) {
                    return
                }

                setResponse({
                    status: response.status,
                    durationInMillies: 0,
                    body: await response.text()
                })

            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const submitKeymap = keymap.of([{
        key: "Mod-Enter",
        run: () => {
            return true;
        }
    }]);


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
                new DefaultFileStorage().writeText(path, text)
            }
        }
    }

    useEffect(() => {
        if (viewRef.current) {
            loadText(viewRef.current, path)
        }
    }, [path])


    return (
        <ResizablePanelGroup
            onBlur={saveOnBlur}
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="50%" className='rounded-xl bg-background-panel'>
                <CodeMirror
                    onCreateEditor={(view) => {
                        viewRef.current = view;
                        loadText(view, path);
                    }}
                    height='100%'
                    theme={buildCMTheme(httpSyntaxHighlighting(themes[1]), themes[1].editor)}
                    className='height: 100% outline-none'
                    extensions={extensions}
                />
            </ResizablePanel>

            <ResizableHandle className='bg-muted/70' />

            <ResizablePanel className='m-1 rounded-xl bg-background-panel'>
                {response ? <HttpResponseView response={response} /> : <SendRequestInstructions />}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}