import { Button } from "@/components/ui/button"
import {
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"


export enum FileDialogType {
    NewHttpRequest,
    NewFolder
}

export function NewFileDialog({ onConfirm, type }: { onConfirm: (name: string) => void, type: FileDialogType }) {


    const [inputValue, setInputValue] = useState("")

    const title = type === FileDialogType.NewHttpRequest ? "New Request" : "New Folder"
    const placeholder = type === FileDialogType.NewHttpRequest ? "Request name" : "Folder name"
    
    return (
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <Input
                autoFocus
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConfirm(inputValue)}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">
                        Cancel
                    </Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={() => onConfirm(inputValue)} disabled={!inputValue.trim()}>
                        Create
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}
