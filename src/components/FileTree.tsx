import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon, FileCodeIcon, FolderIcon, LockIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FileItem, FileTreeItem, FolderItem } from "@/lib/data/project-files"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu"
import { FileDialogType, NewFileDialog } from "@/lib/file-dialogs/new-file-dialog"
import { Dialog } from "./ui/dialog"
import DefaultFileStorage from "@/lib/data/files/file-default"
import { pathOf } from "@/lib/data/files/join"
import { useEffect, useMemo, useState } from "react"
import { useLicense } from "@/lib/license/license-context"
import { FolderSettingsDialog } from "@/lib/folder-setting/folder-settings-dialog"
import { createHttpRequest, createQuickAction } from "@/lib/data/project/project"
import { NewQuickActionDialog } from "./new-quick-action-dialog"
import { beforeScriptPath } from "@/lib/data/http/before-script-executor"
import { afterScriptPath } from "@/lib/data/http/after-script-executor"
import { FileType } from "@/lib/data/supported-filetypes"
import FileJavascriptIcon from "./icons/file-js"

export const FileTree = ({ items, actionsPath, onItemClick, selectedPath }: {
    items: FileTreeItem[],
    actionsPath: string,
    onItemClick: (item: FileItem) => void,
    selectedPath?: string
}) => {

    return (
        <ScrollArea className="h-full">
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
    const [dialogType, setDialogType] = useState<FileDialogType | null>(null);
    const [settingsDialog, setSettingsDialog] = useState<boolean>(false);
    const [open, setOpen] = useState(() => isAncestor(folder.path, selectedPath));
    const { isPro, openLicenseDialog } = useLicense();

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
        setSettingsDialog(true);
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
        fileStorage.delete(folder.path)
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
            <Dialog open={dialogType !== null} onOpenChange={(open) => !open && setDialogType(null)}>
                <ContextMenu>
                    <Collapsible open={open} onOpenChange={setOpen}>
                        <ContextMenuTrigger>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="group text-muted-foreground data-[state=open]:hover:text-foreground data-[state=open]:text-muted-foreground hover:bg-muted w-full justify-start transition-none data-[state=open]:bg-transparent"
                                >
                                    <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                                    <FolderIcon />
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
                    <ContextMenuContent>
                        {isActionsFolder ? (
                            <ContextMenuItem onClick={addQuickAction} className="flex items-center justify-between gap-4">New Action {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                        ) : (
                            <>
                                <ContextMenuItem onClick={() => setDialogType(FileDialogType.NewHttpRequest)}>New Request</ContextMenuItem>
                                <ContextMenuItem onClick={() => setDialogType(FileDialogType.NewFolder)}>New Folder</ContextMenuItem>
                                <ContextMenuItem onClick={addFolderBeforeScript} className="flex items-center justify-between gap-4">Before Script {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                                <ContextMenuItem onClick={addFolderAfterScript} className="flex items-center justify-between gap-4">After Script {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                                <ContextMenuItem onClick={onSettingsClick} className="flex items-center justify-between gap-4">Settings {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                                <ContextMenuItem onClick={deleteItem} variant="destructive">Delete</ContextMenuItem>
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
                {settingsDialog && (
                    <FolderSettingsDialog
                        folderPath={folder.path}
                        onClose={() => setSettingsDialog(false)}
                    />
                )}
            </Dialog>
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

const FileNode = ({ item, isInActionsFolder, onItemClick, selectedPath }: { item: FileTreeItem, isInActionsFolder?: boolean, onItemClick: any, selectedPath: string }) => {
    const storage = DefaultFileStorage.getInstance();
    const { isPro, openLicenseDialog } = useLicense();
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

    const icon = isBeforeScript || isAfterScript ? <FileJavascriptIcon /> : <FileCodeIcon />;

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onItemClick(item)}
                        className={cn(
                            "w-full justify-start gap-2 transition-none",
                            selectedPath === item.path ? "text-foreground bg-muted" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {icon}
                        <span>{item.name}</span>
                    </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {!isInActionsFolder && (
                        <>
                            <ContextMenuItem onClick={addBeforeScript} className="flex items-center justify-between gap-4">Before Script {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                            <ContextMenuItem onClick={addAfterScript} className="flex items-center justify-between gap-4">After Script {!isPro && <LockIcon className="size-3 text-muted-foreground" />}</ContextMenuItem>
                        </>
                    )}
                    <ContextMenuItem onClick={deleteItem} variant="destructive">Delete</ContextMenuItem>
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
                    className={cn(
                        "w-full justify-start gap-1 transition-none",
                        isSelected ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <FileJavascriptIcon />
                    <span>{label}</span>
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={deleteItem} variant="destructive">Delete</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
};



const isAncestor = (folderPath: string, selectedPath?: string) =>
    selectedPath?.startsWith(folderPath + '/') ?? false;