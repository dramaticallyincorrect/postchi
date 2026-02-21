import { PanelLeftIcon } from 'lucide-react';
import { HttpEditor } from './components/HttpEditor';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { themes } from './lib/theme/themes';
import { useEffect, useState } from 'react';
import { FileTree } from './components/FileTree';
import { FileItem, FileTreeItem, readFileTree } from './lib/data/project-files';


export function App() {

    const [fileTree, setFileTree] = useState<FileTreeItem[]>([])

    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

    useEffect(() => {
        const fetchFileTree = async () => {
            const tree = await readFileTree('/Users/hamedmonji/Desktop/test/titled');
            setFileTree(tree);
        };
        fetchFileTree();
    }, []);

    return <div className='flex-col h-screen w-screen flex'>
        <div className="titlebar bg-primary mt-1.5">
            <div data-tauri-drag-region>
                <PanelLeftIcon className='ms-22 me-1 size-4 inline' />
                <Button variant="ghost" className='text-foreground'>Project</Button>
                <span className='text-muted-foreground mx-1 select-none'>•</span>
                <Button variant="ghost">Production</Button>
            </div>
        </div>
        <Split>
            <FileTree items={fileTree} onItemClick={setSelectedFile} selectedPath={selectedFile?.path} />
            {selectedFile ? <HttpEditor theme={themes[0]} path={selectedFile.path} /> : null}
        </Split>
    </div>
}

export function Split(props: { children: React.ReactNode[] }) {
    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="17%" className='m-1 rounded-xl bg-sidebar'>
                {props.children[0]}
            </ResizablePanel>

            <ResizableHandle className='bg-transparent' />

            <ResizablePanel className='m-1 rounded-xl bg-background-secondary'>
                {props.children[1]}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}


export default App;