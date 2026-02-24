import HttpResponseView, { HttpResponse } from "@/components/http-response-view";
import { EditorType, HttpEditor } from "@/components/HttpEditor";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { themes } from "@/lib/theme/themes";
import { useEffect, useState } from "react";
import executeHttpTemplate from "@/lib/data/http/http-runner";
import DefaultFileStorage from "@/lib/data/files/file-default";


export default function HttpRequestResponse({ path }: { path: string }) {

    const [response, setResponse] = useState<HttpResponse | null>(null)

    const [text, setText] = useState('')

    useEffect(() => {
        const loadFile = async () => {
            const storage = new DefaultFileStorage()
            const content = await storage.readText(path)
            setText(content)
        }
        loadFile()
    }, [path])

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


    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="50%" className='m-1 rounded-xl bg-background-panel'>
                <HttpEditor type={EditorType.HTTP} onChange={setText} theme={themes[1]} text={text} />
            </ResizablePanel>

            <ResizableHandle className='bg-muted/70' />

            <ResizablePanel className='m-1 rounded-xl bg-background-panel'>
                {response ? <HttpResponseView response={response} /> : null}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}