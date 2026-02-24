import { PanelLeftIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useState } from 'react';
import { FileTree } from './components/FileTree';
import { FileItem, FileTreeItem, readFileTree } from './lib/data/project-files';
import HttpRequestResponse from './http/http-request-response';


export function App() {

    const [fileTree, setFileTree] = useState<FileTreeItem[]>([])

    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

    useEffect(() => {
        const fetchFileTree = async () => {
            const tree = await readFileTree('/Users/hamedmonji/Desktop/test/titled');
            setFileTree(tree);
            setSelectedFile(tree[0] || null);
        };
        fetchFileTree();
    }, []);

    return <div className='flex-col h-screen w-screen flex'>
        <div className="titlebar bg-background-panel mt-1.5">
            <div data-tauri-drag-region>
                <PanelLeftIcon className='ms-22 me-1 size-4 inline' />
                <Button variant="ghost" className='hover:bg-muted-foreground'>Project</Button>
                <span className='text-muted-foreground mx-1 select-none'>•</span>
                <Button variant="ghost">Production</Button>
            </div>
        </div>
        <Split>
            <FileTree items={fileTree} onItemClick={setSelectedFile} selectedPath={selectedFile?.path} />
            <HttpRequestResponse path={selectedFile?.path || ''} />
        </Split>
    </div>
}

export function Split(props: { children: React.ReactNode[] }) {
    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full" >
            <ResizablePanel defaultSize="17%" className='m-1 rounded-xl bg-background-panel'>
                {props.children[0]}
            </ResizablePanel>

            <ResizableHandle className='bg-transparent' />

            <ResizablePanel className='m-1 rounded-xl bg-background-panel'>
                {props.children[1]}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

export default App;