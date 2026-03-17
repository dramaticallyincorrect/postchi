import DefaultFileStorage from "@/lib/data/files/file-default"
import { EditorView } from "@uiw/react-codemirror"

export const loadText = async (view: EditorView, path: string) => {
    const content = await DefaultFileStorage.getInstance().readText(path)
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content
        }
    })
}