import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon, DeleteIcon, FileCodeIcon, FilePlus2Icon, FolderIcon, FolderOpenIcon, FolderPlusIcon, LockIcon, PinIcon, PinOffIcon, ServerIcon, Settings2Icon, TrashIcon, ZapIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FileItem, FileTreeItem, FolderItem } from "@/postchi/project/project-files"
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../../components/ui/context-menu"
import { FileDialogType, NewFileDialog } from "@/app/file-dialogs/new-file-dialog"
import DefaultFileStorage from "@/lib/storage/files/file-default"
import { pathOf } from "@/lib/storage/files/join"
import { useEffect, useMemo, useState } from "react"
import { useLicense } from "@/app/license/license-context"
import { NewQuickActionDialog } from "../../components/new-quick-action-dialog"
import FileJavascriptIcon from "../../components/icons/file-js"
import { isTauri } from "@tauri-apps/api/core"
import { isMac } from "@/lib/utils/os"
import { emitMenuEvent, MenuActions } from "@/app/menu/menu-events"
import { afterScriptPath } from "@/postchi/http/scripts/after/after-script-executor"
import { beforeScriptPath } from "@/postchi/http/scripts/before/before-script-executor"
import { createHttpRequest, createQuickAction } from "@/postchi/project/project"
import { FileType } from "@/postchi/project/file-types/supported-filetypes"
import { usePanel } from "./panel-context"
import { deleteSource } from "@/postchi/sources/sources"
import { FileExecution } from "./item-execution"
import { addToPinned, removePinned } from "@/postchi/project/pin/pin"
import { getActiveProject } from "@/lib/project-state"

const revealLabel = isMac() ? 'Show in Finder' : 'Show in Explorer';

const revealInFinder = async (path: string) => {
    if (!isTauri()) return;
    const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
    await revealItemInDir(path);
};

const openLicenseDialog = () => {
    emitMenuEvent(MenuActions.ACTIVATE_LICENSE);
}



export const FileTree = ({ items, actionsPath, onItemClick, selectedPath }: {
    items: FileTreeItem[],
    actionsPath: string,
    onItemClick: (item: FileItem) => void,
    selectedPath?: string
}) => {

    return (
        <ScrollArea className="h-full text-foreground/64">
            {items.map((item) => (
                <FileTreeEntry
                    key={item.path}
                    item={item}
                    actionsPath={actionsPath}
                    onItemClick={onItemClick}
                    selectedPath={selectedPath}
                />
            ))}
        </ScrollArea>
    );
};

const FileTreeEntry = ({ item, actionsPath, onItemClick, selectedPath }: any) => {
    if (item instanceof FolderItem) {
        return <FolderNode folder={item} actionsPath={actionsPath} onItemClick={onItemClick} selectedPath={selectedPath} />;
    }
    return <FileNode item={item} isInActionsFolder={item.path.startsWith(actionsPath + '/')} onItemClick={onItemClick} selectedPath={selectedPath} />;
};



const FolderNode = ({
    folder,
    actionsPath,
    onItemClick,
    selectedPath,
}: {
    folder: FolderItem,
    actionsPath: string,
    onItemClick: (item: FileTreeItem) => void,
    selectedPath?: string
}) => {
    const isActionsFolder = folder.path === actionsPath;
    const isSource = folder.isSource;
    const [dialogType, setDialogType] = useState<FileDialogType | null>(null);
    const { openView } = usePanel()
    const [open, setOpen] = useState(() => isAncestor(folder.path, selectedPath));
    const { isPro } = useLicense();

    useEffect(() => {
        if (isAncestor(folder.path, selectedPath)) {
            setOpen(true);
        }
    }, [selectedPath, folder.path]);

    const fileStorage = useMemo(() => DefaultFileStorage.getInstance(), []);

    const onNewFile = (name: string, type: FileDialogType) => {
        const fullpath = pathOf(folder.path, name);
        switch (type) {
            case FileDialogType.NewFolder:
                fileStorage.mkdir(fullpath);
                break;
            case FileDialogType.NewHttpRequest:
                createHttpRequest(folder.path, name).then((path) => {
                    onItemClick(new FileItem(name, path));
                });
                break;
        }
        setDialogType(null);
    };

    const onSettingsClick = () => {
        if (!isPro) { openLicenseDialog(); return; }
        openView({
            type: 'FOLDER_SETTINGS',
            params: {
                path: folder.path
            }
        })
    }


    const addFolderBeforeScript = () => {
        if (!isPro) { openLicenseDialog(); return; }
        const scriptPath = pathOf(folder.path, FileType.FOLDER_BEFORE_SCRIPT);
        fileStorage.create(scriptPath, '// Folder before script - runs before every request in this folder and subfolders\n// Available: request (method, url, headers, body), env, fetch, setEnvironmentVariable\n');
    }

    const addFolderAfterScript = () => {
        if (!isPro) { openLicenseDialog(); return; }
        const scriptPath = pathOf(folder.path, FileType.FOLDER_AFTER_SCRIPT);
        fileStorage.create(scriptPath, '// Folder after script - runs after every request in this folder and subfolders\n// Available: response (status, headers, body, durationInMillies), request, env, fetch, setEnvironmentVariable\n');
    }

    const deleteItem = () => {
        if (folder.isSource) {
            deleteSource(folder.name)
        } else {
            fileStorage.delete(folder.path)
        }

    }

    const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false)

    const addQuickAction = () => {
        if (!isPro) { openLicenseDialog(); return; }
        setQuickActionDialogOpen(true)
    }

    const onNewQuickAction = (name: string) => {
        createQuickAction(folder.path, name).then((path) => {
            onItemClick(new FileItem(name, path));
        });
    }

    return (
        <>
            <ContextMenu>
                <Collapsible open={open} onOpenChange={setOpen}>
                    <ContextMenuTrigger>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="data-[state=open]:hover:text-foreground data-[state=open]:text-current group hover:bg-muted w-full justify-start transition-none data-[state=open]:bg-transparent"
                                onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteItem(); } }}
                            >
                                <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                                {isSource ? <ServerIcon /> : <FolderIcon />}
                                {folder.name}
                            </Button>
                        </CollapsibleTrigger>
                    </ContextMenuTrigger>
                    <CollapsibleContent className="ml-4.5">
                        <div className="flex flex-col gap-1">
                            {folder.items.map((child) => (
                                <FileTreeEntry
                                    key={child.path}
                                    item={child}
                                    actionsPath={actionsPath}
                                    onItemClick={onItemClick}
                                    selectedPath={selectedPath}
                                />
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                <ContextMenuContent className="w-50">
                    {isActionsFolder ? (
                        <>
                            <ContextMenuItem onClick={addQuickAction} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><ZapIcon className="size-4" />New Action</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => revealInFinder(folder.path)}><FolderOpenIcon className="size-4" />{revealLabel}</ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <ContextMenuItem onClick={() => setDialogType(FileDialogType.NewHttpRequest)}><FilePlus2Icon className="size-4 mx-1" />New Request</ContextMenuItem>
                            <ContextMenuItem onClick={() => setDialogType(FileDialogType.NewFolder)}><FolderPlusIcon className="size-4 mx-1" />New Folder</ContextMenuItem>
                            <ContextMenuItem onClick={addFolderBeforeScript} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><FileJavascriptIcon className="size-4 mx-1" />Before Script</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                            <ContextMenuItem onClick={addFolderAfterScript} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><FileJavascriptIcon className="size-4 mx-1" />After Script</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                            <ContextMenuItem onClick={onSettingsClick} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><Settings2Icon className="size-4 mx-1" />Settings</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => revealInFinder(folder.path)}><FolderOpenIcon className="size-4 mx-1" />{revealLabel}</ContextMenuItem>
                            <ContextMenuItem onClick={deleteItem} variant="destructive">
                                <TrashIcon className="size-4 mx-1" />{isSource ? 'Remove Source' : 'Delete'}
                                <DeleteIcon className="size-4 ml-auto" />
                            </ContextMenuItem>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>
            {dialogType !== null && (
                <NewFileDialog
                    onConfirm={(name) => onNewFile(name, dialogType)}
                    type={dialogType}
                />
            )}
            {isActionsFolder && (
                <NewQuickActionDialog
                    open={quickActionDialogOpen}
                    hasActions={folder.items.length > 0}
                    onClose={() => setQuickActionDialogOpen(false)}
                    onCreate={onNewQuickAction}
                />
            )}
        </>
    );
};

const FileNode = ({ item, isInActionsFolder, onItemClick, selectedPath }: { item: FileItem, isInActionsFolder?: boolean, onItemClick: any, selectedPath: string }) => {
    const storage = DefaultFileStorage.getInstance();
    const { isPro } = useLicense();
    const isBeforeScript = item.name.endsWith(FileType.BEFORE_SCRIPT) || item.name === FileType.FOLDER_BEFORE_SCRIPT;
    const isAfterScript = item.name.endsWith(FileType.AFTER_SCRIPT) || item.name === FileType.FOLDER_AFTER_SCRIPT;

    const hasScripts = item instanceof FileItem && (item.before || item.after);

    const deleteItem = () => {
        storage.delete(item.path)
    }

    const addBeforeScript = () => {
        if (!isPro) { openLicenseDialog(); return; }
        const scriptPath = beforeScriptPath(item.path);
        storage.create(scriptPath, '// Before script\n// Available: request (method, url, headers, body), env, fetch\n');
    }

    const addAfterScript = () => {
        if (!isPro) { openLicenseDialog(); return; }
        const scriptPath = afterScriptPath(item.path);
        storage.create(scriptPath, '// After script\n// Available: response (status, headers, body, durationInMillies), request, env, fetch\n');
    }

    const onPin = () => {
        if (!isPro) { openLicenseDialog(); return; }
        addToPinned(item.path, getActiveProject()!.path)
    }

    const unPin = () => {
        removePinned(item.path, getActiveProject()!.path)
    }

    const icon = item.isPinned ? <PinIcon className="" /> : isBeforeScript || isAfterScript || isInActionsFolder ? <FileJavascriptIcon /> : <FileCodeIcon />;

    const executable = item.traits.includes('executable') ? <FileExecution path={item.path} shortcutEnabled={item.traits.includes('shortcutExecutable')} /> : null;

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onItemClick(item)}
                        onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteItem(); } }}
                        className={cn(
                            "w-full justify-start items-center gap-2 transition-none group",
                            selectedPath === item.path ? "text-foreground bg-muted" : "hover:bg-muted"
                        )}
                    >
                        <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            {icon}
                            <span className="truncate">{item.name}</span>
                        </span>
                        {executable}
                    </Button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-50">
                    {
                        item.traits.includes('pinable') && <ContextMenuItem onClick={onPin} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><PinIcon className="size-4 mx-1" />Pin</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                    }
                    {
                        item.isPinned && <ContextMenuItem onClick={unPin} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><PinOffIcon className="size-4 mx-1" />Unpin</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                    }
                    {!isInActionsFolder && (
                        <>
                            <ContextMenuItem onClick={addBeforeScript} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><FileJavascriptIcon className="size-4 mx-1" />Before Script</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                            <ContextMenuItem onClick={addAfterScript} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><FileJavascriptIcon className="size-4 mx-1" />After Script</span> {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                        </>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => revealInFinder(item.path)}><FolderOpenIcon className="size-4 mx-1" />{revealLabel}</ContextMenuItem>
                    <ContextMenuItem onClick={deleteItem} variant="destructive">
                        <TrashIcon className="size-4 mx-1" />Delete
                        <DeleteIcon className="size-4 ml-auto" />
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            {hasScripts && (
                <div className="ml-4 border-l border-border pl-1">
                    {item.before && (
                        <ScriptNode
                            label="before"
                            isSelected={selectedPath === item.before}
                            path={item.before}
                            onItemClick={onItemClick}
                        />
                    )}
                    {item.after && (
                        <ScriptNode
                            label="after"
                            isSelected={selectedPath === item.after}
                            path={item.after}
                            onItemClick={onItemClick}
                        />
                    )}
                </div>
            )}
        </div>
    )
};

const ScriptNode = ({ label, path, isSelected, onItemClick }: { label: string, path: string, isSelected: boolean, onItemClick: any }) => {
    const storage = DefaultFileStorage.getInstance();

    const deleteItem = () => {
        storage.delete(path)
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onItemClick(new FileItem(label, path))}
                    onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteItem(); } }}
                    className={cn(
                        "w-full justify-start gap-1 transition-none",
                        isSelected ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <FileJavascriptIcon className="size-4" />
                    <span>{label}</span>
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => revealInFinder(path)}><FolderOpenIcon className="size-4 mx-1" />{revealLabel}</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuGroup>
                    <ContextMenuItem onClick={deleteItem} variant="destructive">
                        <TrashIcon className="size-4 mx-1" />Delete
                        <DeleteIcon className="size-4 ml-auto" />
                    </ContextMenuItem>
                </ContextMenuGroup>
            </ContextMenuContent>
        </ContextMenu>
    )
};



const isAncestor = (folderPath: string, selectedPath?: string) =>
    selectedPath?.startsWith(folderPath + '/') ?? false;