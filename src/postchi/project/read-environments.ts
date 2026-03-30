import DefaultFileStorage from "@/lib/storage/files/file-default"
import parseEnvironments from "../environments/parser/environments-parser"

export default async function readEnvironments(path: string) {
    const text = await DefaultFileStorage.getInstance().readText(path)
    return parseEnvironments(text)
}