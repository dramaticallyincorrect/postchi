import { FileType } from "./supported-filetypes";

export function getFileTypeFromPath(path: string): FileType | undefined {
    const basename = path.split('/').pop() ?? '';
    if (basename === FileType.FOLDER_SETTINGS) return FileType.FOLDER_SETTINGS;
    if (basename === FileType.FOLDER_BEFORE_SCRIPT) return FileType.FOLDER_BEFORE_SCRIPT;
    if (basename === FileType.FOLDER_AFTER_SCRIPT) return FileType.FOLDER_AFTER_SCRIPT;
    // Check longest matches first so .before.js / .after.js win over .js
    const types = [FileType.BEFORE_SCRIPT, FileType.AFTER_SCRIPT, FileType.QUICK_ACTION, FileType.ENVIRONMENT, FileType.HTTP];
    return types.find(filetype => path.toLowerCase().endsWith(filetype));
}