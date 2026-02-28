import DefaultFileStorage from "@/lib/data/files/file-default"
import { useEffect, useState } from "react"

export const useFileText = (path: string) => {
    const [text, setText] = useState('')

    useEffect(() => {
        const load = async () => {
            const content = await new DefaultFileStorage().readText(path)
            setText(content)
        }
        load()
    }, [path])

    return { text, setText }
}

export const useAutoSave = (path: string) => {
    const { text, setText } = useFileText(path)

    const save = (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            new DefaultFileStorage().writeText(path, text)
        }
    }

    return { text, setText, save }
}