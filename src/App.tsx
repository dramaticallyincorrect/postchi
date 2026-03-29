import { PanelLeftIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from './theme-context/theme-context';
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
import MsWindowControls from './components/window-controls';
import { isDesktopMac, isMac } from './lib/utils/os';
import { cn } from './lib/utils';
import { useFileTree } from './lib/hooks/use-file-tree';
import { useFileWatch } from './lib/hooks/file-watch';
import { FileWatchEventType } from './lib/data/files/file';
import { projectMenuItems } from './lib/menu/project-menu'
import usePersistentState from './lib/hooks/persistent-state';
import { SearchDialog } from './components/search-dialog';
import { isOsCommandKey } from './lib/utils/keyboard-event';
import { QuickActionsButton } from './lib/quick-actions/quick-action';
import { SourceChangesButton } from './components/source-changes-dialog';
import { PendingSourceChanges } from './lib/data/sources/source-checker';

export default function App({ project, isTemp, pendingSourceChanges }: { project: Project, isTemp: boolean, pendingSourceChanges: PendingSourceChanges[] }) {

    const [selectedFile, setSelectedFile] = usePersistentState<FileItem | null>(`selectedFile:${project.path}`, null)
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

    return <EnvironmentProvider project={project} >
        <div className='flex-col h-screen w-screen flex'>
            <TitleBar project={project} isTemp={isTemp} onToggleFileTree={() => setIsFileTreeVisible(!isFileTreeVisible)} pendingSourceChanges={pendingSourceChanges} />
            <Split isFileTreeVisible={isFileTreeVisible}>
                <FileTree items={fileTree} actionsPath={project.actionsPath} onItemClick={setSelectedFile} selectedPath={selectedFile?.path} />
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

}

const TitleBar = ({ project, isTemp, onToggleFileTree, pendingSourceChanges }: { project: Project; isTemp: boolean; onToggleFileTree: () => void; pendingSourceChanges: PendingSourceChanges[] }) => {
    return <div className="titlebar bg-background-panel">
        <div data-tauri-drag-region className='flex items-center justify-between w-full h-full'>

            <div className="flex items-center mt-1.5">
                <Button variant="ghost" size="icon" className={cn(isDesktopMac() ? 'ms-22' : 'ms-4') + ' me-1'} onClick={onToggleFileTree}>
                    <PanelLeftIcon />
                </Button>
                <FileMenu projectName={project.name} isTemp={isTemp} />
                <span className='text-muted-foreground mx-1 select-none'>•</span>
                <ActiveEnvironment />
            </div>

            <div className="ml-auto" />
            <SourceChangesButton changes={pendingSourceChanges} />
            <QuickActionsButton project={project} />
            {!isMac() && <MsWindowControls />}

        </div>
    </div>
}

const FileMenu = ({ projectName, isTemp }: { projectName: string; isTemp: boolean }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className='hover:bg-muted-foreground'>{projectName}</Button>
            </DropdownMenuTrigger>
            {
                !isDesktopMac() && <DropdownMenuContent className='w-full'>
                    {projectMenuItems(isTemp).map((item, index) =>
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
        case FileType.QUICK_ACTION:
            return <ScriptEditor path={path} type={type} />
        default:
            return <EnvironmentEditor path={path} />
    }

}


function Split(props: { children: React.ReactNode[]; isFileTreeVisible: boolean }) {
    const { gapless } = useTheme()
    const g = gapless

    function getDefaultFileTreeSize(screenWidth: number): number {
        if (screenWidth < 640) return 30
        if (screenWidth < 1024) return 22
        if (screenWidth < 1440) return 18
        return 15
    }

    const panelClass = g
        ? 'bg-background-panel'
        : 'm-1 rounded-xl bg-background-panel'
    const handleClass = g
        ? 'w-px bg-muted'
        : 'bg-transparent'

    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full" >
            {props.isFileTreeVisible && (
                <>
                    <ResizablePanel defaultSize={`${getDefaultFileTreeSize(window.innerWidth)}%`} className={panelClass}>
                        {props.children[0]}
                    </ResizablePanel>

                    <ResizableHandle className={handleClass} />
                </>
            )}

            <ResizablePanel className={panelClass}>
                {props.children[1]}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}