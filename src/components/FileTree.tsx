import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon, FileCodeIcon, FolderIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type FileTreeItem = { name: string, isSelected?: boolean } | { name: string; items: FileTreeItem[] }

export function FileTree() {
    const fileTree: FileTreeItem[] = [
        {
            name: "components",
            items: [
                {
                    name: "ui",
                    items: [
                        {
                            name: "components",
                            items: [
                                {
                                    name: "ui",
                                    items: [
                                        { name: "button.tsx" },
                                        { name: "card.tsx" },
                                        { name: "dialog.tsx" },
                                        { name: "input.tsx" },
                                        { name: "select.tsx" },
                                        { name: "table.tsx" },
                                    ],
                                },
                                {
                                    name: "components",
                                    items: [
                                        {
                                            name: "ui",
                                            items: [
                                                { name: "button.tsx" },
                                                { name: "card.tsx" },
                                                { name: "dialog.tsx" },
                                                { name: "input.tsx" },
                                                { name: "select.tsx" },
                                                { name: "table.tsx" },
                                            ],
                                        },
                                        {
                                            name: "components",
                                            items: [
                                                {
                                                    name: "ui",
                                                    items: [
                                                        { name: "button.tsx" },
                                                        { name: "card.tsx" },
                                                        { name: "dialog.tsx" },
                                                        { name: "input.tsx" },
                                                        { name: "select.tsx" },
                                                        { name: "table.tsx" },
                                                    ],
                                                },
                                                {
                                                    name: "components",
                                                    items: [
                                                        {
                                                            name: "ui",
                                                            items: [
                                                                { name: "button.tsx" },
                                                                { name: "card.tsx" },
                                                                { name: "dialog.tsx" },
                                                                { name: "input.tsx" },
                                                                { name: "select.tsx" },
                                                                { name: "table.tsx" },
                                                            ],
                                                        },
                                                        {
                                                            name: "components",
                                                            items: [
                                                                {
                                                                    name: "ui",
                                                                    items: [
                                                                        { name: "button.tsx" },
                                                                        { name: "card.tsx" },
                                                                        { name: "dialog.tsx" },
                                                                        { name: "input.tsx" },
                                                                        { name: "select.tsx" },
                                                                        { name: "table.tsx" },
                                                                    ],
                                                                },
                                                                { name: "login-form.tsx" },
                                                                { name: "register-form.tsx" },
                                                            ],
                                                        },
                                                        { name: "register-form.tsx" },
                                                    ],
                                                },
                                                { name: "register-form.tsx" },
                                            ],
                                        },
                                        { name: "register-form.tsx" },
                                    ],
                                },
                                { name: "register-form.tsx" },
                            ],
                        },
                        { name: "card.tsx" },
                        { name: "dialog.tsx" },
                        { name: "input.tsx" },
                        { name: "select.tsx" },
                        { name: "table.tsx" },
                    ],
                },
                { name: "login-form.tsx" },
                { name: "register-form.tsx" },
            ],
        },
        {
            name: "lib",
            items: [{ name: "utils.ts" }, { name: "cn.ts" }, { name: "api.ts" }],
        },
        {
            name: "hooks",
            items: [
                { name: "use-media-query.ts" },
                { name: "use-debounce.ts" },
                { name: "use-local-storage.ts" },
            ],
        },
        {
            name: "types",
            items: [{ name: "index.d.ts" }, { name: "api.d.ts" }],
        },
        {
            name: "public",
            items: [
                { name: "favicon.ico", isSelected: true },
                { name: "logo.svg" },
                { name: "images" },
            ],
        },
        { name: "app.tsx" },
        { name: "layout.tsx" },
        { name: "globals.css" },
        { name: "package.json" },
        { name: "tsconfig.json" },
        { name: "README.md" },
        { name: ".gitignore" },
    ]

    const renderItem = (fileItem: FileTreeItem) => {
        if ("items" in fileItem) {
            return (
                <Collapsible key={fileItem.name}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start transition-none data-[state=open]:text-sidebar-foreground data-[state=open]:bg-transparent"
                        >
                            <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                            <FolderIcon />
                            {fileItem.name}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="style-lyra:ml-4 mt-1 ml-5">
                        <div className="flex flex-col gap-1">
                            {fileItem.items.map((child) => renderItem(child))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )
        }

        return (
            <Button
                key={fileItem.name}
                variant="ghost"
                size="sm"
                className={cn(
                    "w-full justify-start gap-2 transition-none",
                    fileItem.isSelected
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
            >
                <FileCodeIcon />
                <span>{fileItem.name}</span>
            </Button>
        )
    }

    return (
        <ScrollArea className="h-full">
            {fileTree.map((item) => renderItem(item))}
        </ScrollArea>
    )
}
