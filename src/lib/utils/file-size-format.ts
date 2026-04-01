const KB = 1024;
const MB = KB * 1024;

export function formatFileSize(bytes: number): string {
    return bytes < KB ? `${bytes} B` : bytes < MB
        ? `${Math.round(bytes / KB)} KB`
        : `${(bytes / MB).toFixed(1)} MB`;
}