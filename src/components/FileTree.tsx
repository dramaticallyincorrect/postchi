import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon, FileCodeIcon, FolderIcon, ZapIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FileItem, FileTreeItem, FolderItem } from "@/lib/data/project-files"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu"
import { FileDialogType, NewFileDialog } from "@/lib/file-dialogs/new-file-dialog"
import { Dialog } from "./ui/dialog"
import DefaultFileStorage from "@/lib/data/files/file-default"
import { pathOf } from "@/lib/data/files/join"
import { useMemo, useState } from "react"
import { FolderSettingsDialog } from "@/lib/folder-setting/folder-settings-dialog"
import { createHttpRequest } from "@/lib/data/project/project"
import { beforeScriptPath } from "@/lib/data/http/before-script-executor"
import { FileType } from "@/lib/data/supported-filetypes"

export const FileTree = ({ items, onItemClick, selectedPath }: {
    items: FileTreeItem[],
    onItemClick: (item: FileTreeItem) => void,
    selectedPath?: string
}) => {

    return (
        <ScrollArea className="h-full">
            {items.map((item) => (
                <FileTreeEntry
                    key={item.path}
                    item={item}
                    onItemClick={onItemClick}
                    selectedPath={selectedPath}
                />
            ))}
        </ScrollArea>
    );
};

const FileTreeEntry = ({ item, onItemClick, selectedPath }: any) => {
    if (item instanceof FolderItem) {
        return <FolderNode folder={item} onItemClick={onItemClick} selectedPath={selectedPath} />;
    }
    return <FileNode item={item} onItemClick={onItemClick} isSelected={selectedPath === item.path} />;
};



const FolderNode = ({
    folder,
    onItemClick,
    selectedPath,
}: {
    folder: FolderItem,
    onItemClick: (item: FileTreeItem) => void,
    selectedPath?: string
}) => {
    const [dialogType, setDialogType] = useState<FileDialogType | null>(null);

    const [settingsDialog, setSettingsDialog] = useState<boolean>(false);

    const isOpen = isAncestor(folder.path, selectedPath);

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
        setSettingsDialog(true);
    }

    const deleteItem = () => {
        fileStorage.delete(folder.path)
    }

    return (
        <Dialog open={dialogType !== null} onOpenChange={(open) => !open && setDialogType(null)}>
            <ContextMenu>
                <Collapsible defaultOpen={isOpen || undefined}>
                    <ContextMenuTrigger>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="group text-foreground hover:bg-muted w-full justify-start transition-none data-[state=open]:bg-transparent"
                            >
                                <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                                <FolderIcon />
                                {folder.name}
                            </Button>
                        </CollapsibleTrigger>
                    </ContextMenuTrigger>
                    <CollapsibleContent className="ml-5">
                        <div className="flex flex-col gap-1">
                            {folder.items.map((child) => (
                                <FileTreeEntry
                                    key={child.path}
                                    item={child}
                                    onItemClick={onItemClick}
                                    selectedPath={selectedPath}
                                />
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => setDialogType(FileDialogType.NewHttpRequest)}>New Request</ContextMenuItem>
                    <ContextMenuItem onClick={() => setDialogType(FileDialogType.NewFolder)}>New Folder</ContextMenuItem>
                    <ContextMenuItem onClick={onSettingsClick}>Settings</ContextMenuItem>
                    <ContextMenuItem onClick={deleteItem} variant="destructive">Delete</ContextMenuItem>
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
    );
};

const FileNode = ({ item, onItemClick, isSelected }: { item: FileTreeItem, onItemClick: any, isSelected: boolean }) => {
    const storage = DefaultFileStorage.getInstance();
    const isHttpRequest = item.name.endsWith(FileType.HTTP);
    const isBeforeScript = item.name.endsWith(FileType.BEFORE_SCRIPT);

    const deleteItem = () => {
        storage.delete(item.path)
    }

    const addBeforeScript = () => {
        const scriptPath = beforeScriptPath(item.path);
        storage.create(scriptPath, '// Before script\n// Available: request (method, url, headers, body), env, fetch\n');
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onItemClick(item)}
                    className={cn(
                        "w-full justify-start gap-2 transition-none",
                        isSelected ? "text-foreground bg-muted" : "text-foreground hover:bg-muted"
                    )}
                >
                    {isBeforeScript ? <ZapIcon /> : <FileCodeIcon />}
                    <span>{item.name}</span>
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                {isHttpRequest && (
                    <ContextMenuItem onClick={addBeforeScript}>Add Before Script</ContextMenuItem>
                )}
                <ContextMenuItem onClick={deleteItem} variant="destructive">Delete</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
};



const isAncestor = (folderPath: string, selectedPath?: string) =>
    selectedPath?.startsWith(folderPath + '/') ?? false;