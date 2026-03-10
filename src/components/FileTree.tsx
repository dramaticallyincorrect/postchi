import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon, FileCodeIcon, FolderIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FileItem, FileTreeItem, FolderItem } from "@/lib/data/project-files"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu"
import { FileDialogType, NewFileDialog } from "@/lib/file-dialogs/new-file-dialog"
import { Dialog } from "./ui/dialog"
import DefaultFileStorage from "@/lib/data/files/file-default"
import { pathOf } from "@/lib/data/files/join"
import { useMemo, useState } from "react"

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
    const isOpen = isAncestor(folder.path, selectedPath);

    const fileStorage = useMemo(() => DefaultFileStorage.getInstance(), []);

    const onNewFile = (name: string, type: FileDialogType) => {
        const fullpath = pathOf(folder.path, name);
        switch (type) {
            case FileDialogType.NewFolder:
                fileStorage.mkdir(fullpath);
                break;
            case FileDialogType.NewHttpRequest:
                fileStorage.create(fullpath, 'GET http://').then(() => {
                    onItemClick(new FileItem(name, fullpath));
                });
                break;
        }
        setDialogType(null);
    };

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
                    <ContextMenuItem onClick={deleteItem} variant="destructive">Delete</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            {dialogType !== null && (
                <NewFileDialog
                    onConfirm={(name) => onNewFile(name, dialogType)}
                    type={dialogType}
                />
            )}
        </Dialog>
    );
};

const FileNode = ({ item, onItemClick, isSelected }: { item: FileTreeItem, onItemClick: any, isSelected: boolean }) => {
    const deleteItem = () => {
        DefaultFileStorage.getInstance().delete(item.path)
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
                    <FileCodeIcon />
                    <span>{item.name}</span>
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