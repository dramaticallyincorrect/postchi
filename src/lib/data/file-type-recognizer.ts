import { FileType } from "./supported-filetypes";

export function getFileTypeFromPath(path: string): FileType | undefined {
    // Check longest matches first so .before.js wins over .js
    const types = [FileType.BEFORE_SCRIPT, FileType.ENVIRONMENT, FileType.HTTP];
    return types.find(filetype => path.toLowerCase().endsWith(filetype));
}