import { FileType } from "./supported-filetypes";

export function getFileTypeFromPath(path: string): FileType | undefined {
    const extension = path.substring(path.lastIndexOf('.')).toLowerCase();

    return [FileType.ENVIRONMENT, FileType.HTTP,].find(filetype => filetype === extension)

}