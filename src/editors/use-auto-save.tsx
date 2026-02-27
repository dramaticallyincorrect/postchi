import DefaultFileStorage from "@/lib/data/files/file-default"
import { useEffect, useState } from "react"

export const useAutoSave = (path: string) => {
    const [text, setText] = useState('')

    useEffect(() => {
        const loadFile = async () => {
            const content = await new DefaultFileStorage().readText(path)
            setText(content)
        }
        loadFile()
    }, [path])


    const save = (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            new DefaultFileStorage().writeText(path, text)
        }
    }

    return { text, setText, save }
}