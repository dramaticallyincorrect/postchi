const KB = 1024;
const MB = KB * 1024;

export function formatFileSize(bytes: number): string {
    return bytes < KB ? `${bytes} B` : bytes < MB
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / MB).toFixed(1)} MB`;
}