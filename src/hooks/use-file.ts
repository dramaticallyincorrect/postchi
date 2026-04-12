import DefaultFileStorage from "@/lib/storage/files/file-default"
import { useEffect, useState } from "react"

export function useFile(path: string, deps: any[] = []): string | null {
    const [content, setContent] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true
        DefaultFileStorage.getInstance().readText(path).then(text => {
            if (isMounted) {
                setContent(text)
            }
        }).catch(() => { })
        return () => {
            isMounted = false
        }
    }, deps)

    return content
}

export function useTransformedFile<T>(path: string, transform: (content: string) => T, deps: any[]): T | null {

    const content = useFile(path, deps)
    const [transformed, setTransformed] = useState<T | null>(null)

    useEffect(() => {
        if (content !== null) {
            try {
                const result = transform(content)
                setTransformed(result)
            } catch {
                setTransformed(null)
            }
        } else {
            setTransformed(null)
        }
    }, [content, ...deps])

    return transformed
}