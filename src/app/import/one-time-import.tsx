import { AlertCircle, CircleCheck, FileText, Loader2, TriangleAlert, X } from "lucide-react";
import { WizardLayout } from "./import";
import { importAutoFromFile, ImportResult } from "@/postchi/import/import-folder";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils/file-size-format";
import { FileRejection, useDropzone } from "react-dropzone";
import { importPostmanZip } from "@/postchi/import/import-postman-zip";
import { useCallback, useState } from "react";

export const OneTimeImport = ({ rootPath }: { onCancel: () => void; rootPath: string },) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [rejectedFile, setRejectedFile] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
        if (accepted[0]) {
            setFile(accepted[0]);
            setResult(null);
            setRejectedFile(false);
            handleOneTimeFileImport(accepted[0]);
        } else if (rejected.length > 0) {
            setRejectedFile(true);
        }
    }, []);

    const importData = async (source: File) => {
        if (source.name.endsWith('.zip')) {
            return importPostmanZip(source, rootPath);
        }
        return importAutoFromFile(source, rootPath);
    }

    const handleOneTimeFileImport = async (source: File) => {
        setLoading(true);
        setResult(null);
        try {
            const result = await importData(source);
            setResult(result);
        } finally {
            setLoading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        accept: ONE_TIME_ACCEPT,
        maxFiles: 1,
        onDrop,
        disabled: loading,
    });

    const fileSize = formatFileSize(file?.size ?? 0);

    const dropZoneBorder =
        isDragReject || rejectedFile
            ? 'border-destructive/70 bg-destructive/5'
            : isDragActive
                ? 'border-primary bg-primary/5'
                : file
                    ? 'border-border/80 hover:border-border'
                    : 'border-border/50 hover:border-border/80';

    return (
        <WizardLayout
            actions={null}
        >
            <div className="space-y-4">
                <div
                    {...getRootProps()}
                    className={cn(
                        'relative flex min-h-44 flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed px-4 text-center transition-all duration-150',
                        loading ? 'cursor-default opacity-40 pointer-events-none' : 'cursor-pointer',
                        dropZoneBorder,
                    )}
                >
                    <input {...getInputProps()} />
                    {isDragActive && !isDragReject && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5">
                                <UploadIcon className="text-primary" />
                            </div>
                            <p className="text-[13px] font-medium text-primary">Drop to import</p>
                        </div>
                    )}
                    {isDragReject && (
                        <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="text-[13px] font-medium text-destructive">
                                Only {ONE_TIME_EXTENSIONS.join(', ')} files are supported
                            </p>
                        </div>
                    )}
                    {!isDragActive && file && (
                        <div className="flex flex-col items-center gap-2">
                            {loading
                                ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                : (
                                    <div className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-muted/60 px-3 py-1.5">
                                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span className="max-w-48 truncate text-[13px] font-medium">{file.name}</span>
                                        {fileSize && <span className="text-[11px] text-muted-foreground">{fileSize}</span>}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            <p className="text-[12px] text-muted-foreground">Drop to replace or <span className="text-primary">browse</span></p>
                        </div>
                    )}
                    {!isDragActive && !file && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="rounded-lg border border-border/60 bg-muted/60 p-2.5">
                                <UploadIcon className="text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[13px] font-medium">Drop your file here</p>
                                <p className="text-[12px] text-muted-foreground mt-0.5">
                                    or <span className="text-primary">browse files</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <div className={cn(
                    'flex items-center justify-center gap-1.5 text-[11px]',
                    rejectedFile && !isDragActive ? 'text-destructive' : 'text-muted-foreground',
                )}>
                    {rejectedFile && !isDragActive && <AlertCircle className="h-3 w-3 shrink-0" />}
                    <span>
                        {rejectedFile && !isDragActive
                            ? `Only ${ONE_TIME_EXTENSIONS.join(', ')} files are supported`
                            : 'Postman collection (.json, .zip) or OpenAPI spec (.yaml, .json)'}
                    </span>
                </div>
                {result && (
                    <div className="rounded-lg border border-border overflow-hidden">
                        <OneTimeResultRow result={result} />
                    </div>
                )}
            </div>
        </WizardLayout>
    );
}


function OneTimeResultRow({ result }: { result: ImportResult }) {
    const skipped = result.skippedRequests.length;
    return (
        <div className={cn(
            'flex items-center gap-2.5 px-4 py-3',
            skipped > 0 ? 'text-warning' : 'text-success',
        )}>
            {skipped > 0
                ? <TriangleAlert className="h-4 w-4 shrink-0" />
                : <CircleCheck className="h-4 w-4 shrink-0" />}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">
                    {skipped > 0 ? 'Imported with warnings' : 'Import successful'}
                </p>
                <p className="text-[12px] opacity-80">
                    {skipped > 0
                        ? `${result.count} imported · ${skipped} skipped`
                        : `${result.count} requests imported`}
                </p>
            </div>
        </div>
    );
}

function UploadIcon({ className }: { className?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
            <path d="M10 3v10M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

const ONE_TIME_ACCEPT = {
    'application/json': ['.json'],
    'application/zip': ['.zip'],
    'application/x-yaml': ['.yaml', '.yml'],
    'text/yaml': ['.yaml', '.yml'],
};
const ONE_TIME_EXTENSIONS = ['.json', '.zip', '.yaml', '.yml'];