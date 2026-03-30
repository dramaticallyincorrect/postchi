import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { FileItem } from '@/postchi/project/project-files'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    files: FileItem[]
    onSelect: (item: FileItem) => void
    collectionsPath: string
}

function dir(displayPath: string): string {
    const sep = displayPath.includes('/') ? '/' : '\\'
    const lastSep = displayPath.lastIndexOf(sep)
    if (lastSep === -1) return ''
    return displayPath.slice(0, lastSep + 1)
}

export function SearchDialog({ open, onOpenChange, files, onSelect, collectionsPath }: Props) {
    const [query, setQuery] = useState('')

    function displayPath(path: string): string {
        const prefix = collectionsPath.endsWith('/') ? collectionsPath : collectionsPath + '/'
        return path.startsWith(prefix) ? path.slice(prefix.length) : path
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 max-w-2xl sm:max-w-2xl" showCloseButton={false} aria-describedby={undefined}>
                <DialogTitle className='sr-only'>
                    Search Requests
                </DialogTitle>
                <Command className="bg-transparent" shouldFilter={false}>
                    <CommandInput
                        placeholder="Search requests"
                        value={query}
                        onValueChange={setQuery}
                        className='mx-4'
                    />
                    <CommandList className="max-h-96">
                        <CommandEmpty>No requests found.</CommandEmpty>
                        <CommandGroup>
                            {files
                                .filter(f => !query || f.path.toLowerCase().includes(query.toLowerCase()))
                                .map(file => {
                                    const path = displayPath(file.path)
                                    const folder = dir(path)
                                    return (
                                        <CommandItem
                                            key={file.path}
                                            onSelect={() => onSelect(file)}
                                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg mx-1"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate ">
                                                    {file.name}
                                                </span>
                                                {folder && (
                                                    <span className="text-xs text-muted-foreground truncate font-mono">
                                                        {folder}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    )
                                })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
