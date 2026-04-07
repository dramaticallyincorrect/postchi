import { PanelLeftIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from './app/theme/theme-context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { FileTree } from './app/project/FileTree';
import { collectHttpFiles } from './postchi/project/project-files';
import HttpRequestResponse from './app/editors/http/http-request-response';
import { ActiveEnvironment } from './app/active-environment/active-environment';
import { EnvironmentEditor } from './app/editors/environment-editor';
import { ScriptEditor } from './app/editors/scripts/script-editor';
import { EnvironmentProvider } from './app/active-environment/environment-context';
import MsWindowControls from './components/window-controls';
import { isDesktopMac, isMac } from './lib/utils/os';
import { cn } from './lib/utils';
import { FileWatchEventType } from './lib/storage/files/file';
import { fileMenuItems } from './app/menu/project-menu'
import { SearchDialog } from './components/search-dialog';
import { isOsCommandKey } from './lib/utils/keyboard-event';
import { SourceChangesButton } from './app/sources/source-changes-dialog';
import { useFileWatch } from './hooks/file-watch';
import { getFileTypeFromPath } from './postchi/project/file-types/file-type-recognizer';
import { FileType } from './postchi/project/file-types/supported-filetypes';
import { Project } from './postchi/project/project';
import { useFileTree } from './hooks/use-file-tree';
import { FolderSettings } from './app/folder-setting/folder-settings-dialog';
import { usePanel } from './app/project/panel-context';
import { ImportData } from './app/import/import';
import { SourceTokensManagement } from './app/sources/manage-sources';
import { getActiveProject } from './lib/project-state';
import { osCommandKey } from './lib/utils/platform-modifiers';


export default function App({ project, isTemp }: { project: Project, isTemp: boolean }) {

    const [isFileTreeVisible, setIsFileTreeVisible] = useState(true)
    const [searchOpen, setSearchOpen] = useState(false)

    const { tree: fileTree } = useFileTree(project)

    const httpFiles = useMemo(() => collectHttpFiles(fileTree), [fileTree])

    const { viewState, openView } = usePanel()

    let selectedPath = undefined
    switch (viewState?.type) {
        case 'EDITOR':
            selectedPath = viewState.params.path;
    }

    useFileWatch(selectedPath ?? null, (event) => {
        if (event.type === FileWatchEventType.Deleted) {
            openView(null)
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

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (isOsCommandKey(e) && e.key === 's') {
                e.preventDefault()
                setIsFileTreeVisible(visible => !visible)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return <EnvironmentProvider project={project} >
        <div className='flex-col h-screen w-screen flex'>
            <TitleBar project={project} isTemp={isTemp} onToggleFileTree={() => setIsFileTreeVisible(!isFileTreeVisible)} />
            <Split isFileTreeVisible={isFileTreeVisible}>
                <FileTree items={fileTree} actionsPath={project.actionsPath} onItemClick={(item) => {
                    openView({ type: 'EDITOR', params: { path: item.path } })
                }} selectedPath={selectedPath} />
                <MainPanel />
            </Split>
            <SearchDialog
                open={searchOpen}
                onOpenChange={setSearchOpen}
                files={httpFiles}
                collectionsPath={project.collectionsPath}
                onSelect={item => {
                    openView({ type: 'EDITOR', params: { path: item.path } })
                    setSearchOpen(false)
                }}
            />
        </div>
    </EnvironmentProvider>

}

const TitleBar = ({ project, isTemp, onToggleFileTree }: { project: Project; isTemp: boolean; onToggleFileTree: () => void }) => {
    return <div className="titlebar bg-background-panel">
        <div data-tauri-drag-region className='flex items-center justify-between w-full h-full'>

            <div className="flex items-center mt-1.5">
                <Button title={`${osCommandKey} + S`} variant="ghost" size="icon" className={cn(isDesktopMac() ? 'ms-22' : 'ms-4') + ' me-1'} onClick={onToggleFileTree}>
                    <PanelLeftIcon />
                </Button>
                <FileMenu projectName={project.name} isTemp={isTemp} />
                <span className='text-muted-foreground mx-1 select-none'>•</span>
                <ActiveEnvironment />
            </div>

            <div className="ml-auto" />
            <SourceChangesButton project={project} />
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
                    {fileMenuItems(isTemp).map((item, index) =>
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

const MainPanel = () => {
    const { viewState } = usePanel()
    switch (viewState?.type) {
        case 'EDITOR':
            return <Editor path={viewState.params.path} />
        case 'FOLDER_SETTINGS':
            return <FolderSettings folderPath={viewState.params.path} />
        case 'IMPORT':
            return <ImportData />
        case 'SOURCE_TOKENS':
            return <SourceTokensManagement projectPath={getActiveProject()!.path} />
    }
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