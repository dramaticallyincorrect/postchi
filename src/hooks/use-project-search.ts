import { useState, useEffect } from 'react'
import { FileItem, searchProjectFiles } from '@/postchi/project/project-files'

export function useProjectSearch(
    collectionsPath: string,
    query: string,
    allFiles?: FileItem[]
): FileItem[] {
    const [results, setResults] = useState<FileItem[]>([])

    useEffect(() => {
        if (!query) {
            setResults([])
            return
        }
        const timer = setTimeout(() => {
            searchProjectFiles(collectionsPath, query, allFiles).then(setResults)
        }, 250)
        return () => clearTimeout(timer)
    }, [collectionsPath, query])

    return results
}
