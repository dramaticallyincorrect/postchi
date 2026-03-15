import { FileType } from "./supported-filetypes";

export function getFileTypeFromPath(path: string): FileType | undefined {
    // Check longest matches first so .before.js / .after.js win over .js
    const types = [FileType.BEFORE_SCRIPT, FileType.AFTER_SCRIPT, FileType.ENVIRONMENT, FileType.HTTP];
    return types.find(filetype => path.toLowerCase().endsWith(filetype));
}