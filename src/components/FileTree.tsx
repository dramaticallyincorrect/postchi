import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon, FileCodeIcon, FolderIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FileTreeItem, FolderItem } from "@/lib/data/project-files"


export const FileTree = ({ items, onItemClick, selectedPath }: {
    items: FileTreeItem[],
    onItemClick: (item: FileTreeItem) => void,
    selectedPath?: string
}) => {

    const isAncestor = (folderPath: string) =>
        selectedPath?.startsWith(folderPath + '/') ?? false

    const renderItem = (fileItem: FileTreeItem) => {
        if (fileItem instanceof FolderItem) {
            const isOpen = isAncestor(fileItem.path)

            return (
                <Collapsible key={fileItem.name} open={isOpen || undefined}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group text-foreground hover:bg-muted w-full justify-start transition-none data-[state=open]:bg-transparent"
                        >
                            <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                            <FolderIcon />
                            {fileItem.name}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="style-lyra:ml-4 ml-5">
                        <div className="flex flex-col gap-1">
                            {fileItem.items.map((child) => renderItem(child))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )
        }

        const isSelected = selectedPath === fileItem.path

        return (
            <Button
                key={fileItem.name}
                variant="ghost"
                size="sm"
                onClick={() => onItemClick(fileItem)}
                className={cn(
                    "w-full justify-start gap-2 transition-none",
                    isSelected
                        ? "text-foreground bg-muted"
                        : "text-foreground hover:bg-muted"
                )}
            >
                <FileCodeIcon />
                <span>{fileItem.name}</span>
            </Button>
        )
    }

    return (
        <ScrollArea className="h-full">
            {items.map((item) => renderItem(item))}
        </ScrollArea>
    )
}
