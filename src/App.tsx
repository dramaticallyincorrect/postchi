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
import { ActiveEnvironment } from './active-environment/active-environment';
import { Project } from './lib/data/project/project';
import { getFileTypeFromPath } from './lib/data/file-type-recognizer';
import { FileType } from './lib/data/supported-filetypes';
import { EnvironmentEditor } from './editors/environment-editor';
import { EnvironmentProvider } from './active-environment/environment-context';
import { ThemeProvider } from './theme-context/theme-context';
import { themes } from './lib/theme/themes';
import MsWindowControls from './components/window-controls';
import { isMac } from './lib/utils/os';
import { cn } from './lib/utils';


export default function App({ project }: { project: Project }) {

    const [fileTree, setFileTree] = useState<FileTreeItem[]>([])

    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

    useEffect(() => {
        const fetchFileTree = async () => {
            const tree = await readFileTree(project.path);
            setFileTree(tree);
        };
        fetchFileTree();
    }, []);

    return <ThemeProvider initialTheme={themes[0]}>
        <EnvironmentProvider path={project.envPath} >
            <div className='flex-col h-screen w-screen flex'>
                <div className="titlebar bg-background-panel">
                    <div data-tauri-drag-region className='flex items-center justify-between w-full h-full'>

                        <div className="flex items-center mt-1.5">
                            <PanelLeftIcon className={cn(isMac() ? 'ms-22' : 'ms-4') + ' me-1 size-4 inline'} />
                            <Button variant="ghost" className='hover:bg-muted-foreground'>{project.name}</Button>
                            <span className='text-muted-foreground mx-1 select-none'>•</span>
                            <ActiveEnvironment />
                        </div>

                        <div className="ml-auto" />
                        <MsWindowControls />

                    </div>
                </div>
                <Split>
                    <FileTree items={fileTree} onItemClick={setSelectedFile} selectedPath={selectedFile?.path} />
                    {selectedFile?.path ? <Editor path={selectedFile.path} /> : null}
                </Split>
            </div>
        </EnvironmentProvider>
    </ThemeProvider>

}

const Editor = ({ path }: { path: string }) => {

    const type = getFileTypeFromPath(path)

    switch (type) {
        case FileType.HTTP:
            return <HttpRequestResponse path={path} />
        default:
            return <EnvironmentEditor path={path} />
    }

}

function Split(props: { children: React.ReactNode[] }) {
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