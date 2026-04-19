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
import { useProjectSearch } from '@/hooks/use-project-search'
import { useVisibleItems } from '@/hooks/use-visible-items'


type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (item: FileItem) => void
    collectionsPath: string
    files?: FileItem[]
}

function dir(displayPath: string): string {
    const sep = displayPath.includes('/') ? '/' : '\\'
    const lastSep = displayPath.lastIndexOf(sep)
    if (lastSep === -1) return ''
    return displayPath.slice(0, lastSep + 1)
}

export function SearchDialog({ open, onOpenChange, onSelect, collectionsPath, files }: Props) {
    const [query, setQuery] = useState('')
    const results = useProjectSearch(collectionsPath, query, files)
    const { visible, sentinelRef, hasMore } = useVisibleItems(results)

    function displayPath(path: string): string {
        const prefix = collectionsPath.endsWith('/') ? collectionsPath : collectionsPath + '/'
        return path.startsWith(prefix) ? path.slice(prefix.length) : path
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 max-w-2xl sm:max-w-2xl top-[20%] translate-y-0" showCloseButton={false} aria-describedby={undefined}>
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
                            {visible.map(file => {
                                const path = displayPath(file.path)
                                return (
                                    <CommandItem
                                        key={file.path}
                                        onSelect={() => onSelect(file)}
                                        className="flex items-center gap-2 px-3 cursor-pointer rounded-lg mx-1 min-w-0"
                                    >
                                        <span className="text-sm font-medium shrink-0">{file.name}</span>
                                        <span className="text-xs text-foreground/60 truncate font-mono">
                                            <Highlight text={path} query={query} />
                                        </span>
                                    </CommandItem>
                                )
                            })}
                            {hasMore && <div ref={sentinelRef} />}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}


function Highlight({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return <>{text}</>
    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-transparent text-primary font-semibold underline">{text.slice(index, index + query.length)}</mark>
            {text.slice(index + query.length)}
        </>
    )
}