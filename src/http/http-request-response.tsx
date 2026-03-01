import CodeMirror, { EditorView, keymap, Prec } from '@uiw/react-codemirror';
import HttpResponseView, { HttpResponse } from "@/http/http-response-view";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { themes } from "@/lib/theme/themes";
import { use, useEffect, useRef, useState } from "react";
import executeHttpTemplate from "@/lib/data/http/http-runner";
import { SendRequestInstructions } from "@/components/send-request-shortcut";
import { useAutoSave } from "@/editors/use-auto-save";
import { forceLinting, lintGutter } from "@codemirror/lint";
import { autocompletion } from "@codemirror/autocomplete";
import { buildCMTheme } from "@/lib/theme/theme-builder";
import { customHttp, httpSyntaxHighlighting } from "@/lib/http/http-language";
import { useEnvironment } from '@/active-environment/environment-context';


export default function HttpRequestResponse({ path }: { path: string }) {

    const viewRef = useRef<EditorView>(null)


    const [response, setResponse] = useState<HttpResponse | null>(null)

    const { text, setText, save } = useAutoSave(path)

    const { activeEnvironment } = useEnvironment()

    useEffect(() => {
        const handler = async (e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!text.trim()) {
                    return;
                }

                const response = await executeHttpTemplate(text);

                setResponse({
                    status: response.status,
                    durationInMillies: 0,
                    body: await response.text()
                })

            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [text]);

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


    return (
        <ResizablePanelGroup
            onBlur={save}
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="50%" className='rounded-xl bg-background-panel'>
                <CodeMirror
                    value={text}
                    onCreateEditor={(view) => {
                        viewRef.current = view;
                    }}
                    onChange={setText}
                    height='100%'
                    theme={buildCMTheme(httpSyntaxHighlighting(themes[1]), themes[1].editor)}
                    className='height: 100% outline-none'
                    extensions={[lintGutter(), customHttp(activeEnvironment ?? undefined), autocompletion(), Prec.highest(submitKeymap)]}
                />
            </ResizablePanel>

            <ResizableHandle className='bg-muted/70' />

            <ResizablePanel className='m-1 rounded-xl bg-background-panel'>
                {response ? <HttpResponseView response={response} /> : <SendRequestInstructions />}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}