import { useState, useEffect, useRef } from 'react'
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

const BATCH_SIZE = 20

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

function useVisibleItems<T>(items: T[]) {
    const [count, setCount] = useState(BATCH_SIZE)
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => setCount(BATCH_SIZE), [items])

    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setCount(c => Math.min(c + BATCH_SIZE, items.length))
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [items])

    return { visible: items.slice(0, count), sentinelRef, hasMore: count < items.length }
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
                            {visible.map(file => {
                                const path = displayPath(file.path)
                                const folder = dir(path)
                                return (
                                    <CommandItem
                                        key={file.path}
                                        onSelect={() => onSelect(file)}
                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg mx-1"
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">
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
                            {hasMore && <div ref={sentinelRef} />}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
