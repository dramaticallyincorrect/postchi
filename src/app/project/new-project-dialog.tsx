import { isTauri } from "@tauri-apps/api/core"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useMenuTrigger } from "@/hooks/use-menu-trigger"
import { MenuActions } from "@/app/menu/menu-events"

type NewProjectDialogProps = {
    onConfirm: (name: string, parentFolder: string) => void
}

export function NewProjectDialog({onConfirm }: NewProjectDialogProps) {
    const [open, setOpen] = useMenuTrigger(MenuActions.NEW_PROJECT)
    const [name, setName] = useState("")
    const [parentFolder, setParentFolder] = useState("")

    const handleBrowse = async () => {
        if (!isTauri()) return
        const { open } = await import("@tauri-apps/plugin-dialog")
        const selected = await open({ directory: true, title: "Choose Project Location" })
        if (typeof selected === "string") {
            setParentFolder(selected)
        }
    }

    const handleConfirm = () => {
        if (!name.trim() || !parentFolder) return
        onConfirm(name.trim(), parentFolder)
        setName("")
        setParentFolder("")
    }

    const isValid = name.trim().length > 0 && parentFolder.length > 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="project-name">Project name</Label>
                        <Input
                            id="project-name"
                            autoFocus
                            placeholder="My Project"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && isValid && handleConfirm()}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Location</Label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                placeholder="Choose a folder…"
                                value={parentFolder}
                                className="flex-1 text-muted-foreground"
                            />
                            <Button variant="outline" onClick={handleBrowse}>
                                Browse…
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter className="bg-background">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={!isValid}>
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
