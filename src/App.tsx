import { FileTree } from './components/FileTree';
import { HttpEditor } from './components/HttpEditor';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

export function App() {

    return <div className='flex-col h-screen w-screen flex'>
        <div className="titlebar bg-primary mt-1.5">
            <div data-tauri-drag-region>
                <Button variant="ghost" className='ms-20'>Project</Button>
                <span className='text-muted-foreground'>&gt;</span>
                <Button variant="ghost">Production</Button>
            </div>
        </div>
        <ResizableDemo>
            <FileTree />
            <HttpEditor />
        </ResizableDemo>
    </div>
}

export function ResizableDemo(props: { children: React.ReactNode[] }) {
    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="17%" className='m-1 rounded-xl bg-card'>
                {props.children[0]}
            </ResizablePanel>

            <ResizableHandle className='bg-transparent' />

            <ResizablePanel className='m-1 rounded-xl '>
                {props.children[1]}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}


export default App;