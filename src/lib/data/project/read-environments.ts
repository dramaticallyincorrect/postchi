import parseEnvironments from "@/lib/environments/parser/environments-parser"
import DefaultFileStorage from "../files/file-default"

export default async function readEnvironments(path: string) {
    const text = await DefaultFileStorage.getInstance().readText(path)
    return parseEnvironments(text)
}