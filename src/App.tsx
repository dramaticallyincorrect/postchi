import { PanelLeftIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useMemo, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { FileTree } from './components/FileTree';
import { collectHttpFiles, FileItem } from './lib/data/project-files';
import HttpRequestResponse from './http/http-request-response';
import { ActiveEnvironment } from './active-environment/active-environment';
import { Project } from './lib/data/project/project';
import { getFileTypeFromPath } from './lib/data/file-type-recognizer';
import { FileType } from './lib/data/supported-filetypes';
import { EnvironmentEditor } from './editors/environment-editor';
import { ScriptEditor } from './editors/script-editor';
import { EnvironmentProvider } from './active-environment/environment-context';
import { ThemeProvider } from './theme-context/theme-context';
import { themes } from './lib/theme/themes';
import MsWindowControls from './components/window-controls';
import { isDesktopMac, isMac } from './lib/utils/os';
import { cn } from './lib/utils';
import { useFileTree } from './lib/hooks/use-file-tree';
import { useFileWatch } from './lib/hooks/file-watch';
import { FileWatchEventType } from './lib/data/files/file';
import { projectMenuItems } from './lib/menu/project-menu';
import usePersistentState from './lib/hooks/persistent-state';
import { SearchDialog } from './components/search-dialog';
import { isOsCommandKey } from './lib/utils/keyboard-event';

export default function App({ project }: { project: Project }) {

    const [selectedFile, setSelectedFile] = usePersistentState<FileItem | null>('selectedFile', null)
    const [isFileTreeVisible, setIsFileTreeVisible] = useState(true)
    const [searchOpen, setSearchOpen] = useState(false)

    const { tree: fileTree } = useFileTree(project)

    const httpFiles = useMemo(() => collectHttpFiles(fileTree), [fileTree])

    useFileWatch(selectedFile?.path ?? null, (event) => {
        if (event.type === FileWatchEventType.Deleted) {
            setSelectedFile(null)
        }
    })

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (isOsCommandKey(e) && e.key === 'k') {
                e.preventDefault()
                setSearchOpen(open => !open)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return <ThemeProvider initialTheme={themes[0]}>
        <EnvironmentProvider path={project.envPath} >
            <div className='flex-col h-screen w-screen flex'>
                <TitleBar projectName={project.name} onToggleFileTree={() => setIsFileTreeVisible(!isFileTreeVisible)} />
                <Split isFileTreeVisible={isFileTreeVisible}>
                    <FileTree items={fileTree} onItemClick={setSelectedFile} selectedPath={selectedFile?.path} />
                    {selectedFile?.path ? <Editor path={selectedFile.path} /> : null}
                </Split>
                <SearchDialog
                    open={searchOpen}
                    onOpenChange={setSearchOpen}
                    files={httpFiles}
                    collectionsPath={project.collectionsPath}
                    onSelect={item => {
                        setSelectedFile(item)
                        setSearchOpen(false)
                    }}
                />
            </div>
        </EnvironmentProvider>
    </ThemeProvider>

}

const TitleBar = ({ projectName, onToggleFileTree }: { projectName: string; onToggleFileTree: () => void }) => {
    return <div className="titlebar bg-background-panel">
        <div data-tauri-drag-region className='flex items-center justify-between w-full h-full'>

            <div className="flex items-center mt-1.5">
                <Button variant="ghost" size="icon" className={cn(isDesktopMac() ? 'ms-22' : 'ms-4') + ' me-1'} onClick={onToggleFileTree}>
                    <PanelLeftIcon />
                </Button>
                <FileMenu projectName={projectName} />
                <span className='text-muted-foreground mx-1 select-none'>•</span>
                <ActiveEnvironment />
            </div>

            <div className="ml-auto" />
            {!isMac() && <MsWindowControls />}

        </div>
    </div>
}

const FileMenu = ({ projectName }: { projectName: string }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className='hover:bg-muted-foreground'>{projectName}</Button>
            </DropdownMenuTrigger>
            {
                !isDesktopMac() && <DropdownMenuContent>
                    {projectMenuItems.map((item, index) =>
                        'item' in item ? (
                            <DropdownMenuSeparator key={`separator-${index}`} />
                        ) : (
                            <DropdownMenuItem
                                key={item.id}
                                onClick={item.action}>
                                {item.text}
                            </DropdownMenuItem>
                        )
                    )}
                </DropdownMenuContent>
            }
        </DropdownMenu>
    )
}

const Editor = ({ path }: { path: string }) => {

    const type = getFileTypeFromPath(path)

    switch (type) {
        case FileType.HTTP:
            return <HttpRequestResponse path={path} />
        case FileType.BEFORE_SCRIPT:
        case FileType.AFTER_SCRIPT:
        case FileType.FOLDER_BEFORE_SCRIPT:
        case FileType.FOLDER_AFTER_SCRIPT:
            return <ScriptEditor path={path} type={type} />
        default:
            return <EnvironmentEditor path={path} />
    }

}

function Split(props: { children: React.ReactNode[]; isFileTreeVisible: boolean }) {
    function getDefaultFileTreeSize(screenWidth: number): number {
        if (screenWidth < 640) return 30
        if (screenWidth < 1024) return 22
        if (screenWidth < 1440) return 18
        return 15
    }
    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full" >
            {props.isFileTreeVisible && (
                <>
                    <ResizablePanel defaultSize={`${getDefaultFileTreeSize(window.innerWidth)}%`} className='m-1 rounded-xl bg-background-panel'>
                        {props.children[0]}
                    </ResizablePanel>

                    <ResizableHandle className='bg-transparent' />
                </>
            )}

            <ResizablePanel className='m-1 rounded-xl bg-background-panel'>
                {props.children[1]}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}