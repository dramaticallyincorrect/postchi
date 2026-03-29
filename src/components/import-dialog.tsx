import { useState, useCallback, useMemo } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, X, AlertCircle, TriangleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportResult } from '@/lib/data/import/import-folder';
import { MenuActions } from '@/lib/menu/menu-events';
import { useMenuTrigger } from '@/lib/hooks/use-menu-trigger';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { isGitLabUrl } from '@/lib/data/integrations/gitlab';


function PostmanIcon({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
            <rect x="1.5" y="2.5" width="13" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.25" />
            <path d="M4.5 8h7M4.5 5.5h7M4.5 10.5h4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
    );
}

function OpenApiIcon({ className }: { className?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
            <path d="M8 1.5L2 5v6l6 3.5L14 11V5L8 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M8 1.5v13M2 5l6 3.5M14 5L8 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
    );
}


type FormatInfo = {
    format: ImportFormat;
    label: string;
    hint: string;
    inputType: 'file' | 'url';
    accept?: Record<string, string[]>;
    acceptedExtensions?: string[];
    supportedVersions: string;
    icon: React.ReactNode;
}

type ImportFormat = 'postman' | 'openapi';

const FORMAT_INFO: FormatInfo[] = [
    {
        format: 'postman',
        label: 'Postman',
        hint: '.json / .zip',
        inputType: 'file',
        accept: { 'application/json': ['.json'], 'application/zip': ['.zip'] },
        acceptedExtensions: ['.json', '.zip'],
        supportedVersions: 'Supports Postman Collection v2.0/v2.1 (.json) or Data Export (.zip)',
        icon: <PostmanIcon />,
    },
    {
        format: 'openapi',
        label: 'OpenAPI',
        hint: 'v3.0 · URL',
        inputType: 'url',
        supportedVersions: 'Supports  Swagger 2.0, OpenAPI 3.0 and v3.1 — enter a public spec URL',
        icon: <OpenApiIcon />,
    },
]


interface ImportDialogProps {
    onImport: (format: ImportFormat, source: File | string, saveAsSource: boolean, token?: string) => Promise<ImportResult>;
}

export function ImportDialog({ onImport }: ImportDialogProps) {
    const [open, setOpen] = useMenuTrigger(MenuActions.IMPORT_PROJECT);
    const [selectedFormat, setSelectedFormat] = useState<FormatInfo>(FORMAT_INFO[0]);
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [rejectedFile, setRejectedFile] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [saveAsSource, setSaveAsSource] = useState(false);
    const [gitlabToken, setGitlabToken] = useState('');

    const accept = useMemo(() => selectedFormat.accept ?? {}, [selectedFormat]);

    const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
        if (accepted[0]) {
            setFile(accepted[0]);
            handleImport(accepted[0]);
        } else if (rejected.length > 0) setRejectedFile(true);
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        accept,
        maxFiles: 1,
        onDrop,
        disabled: loading || selectedFormat.inputType === 'url',
    });

    const handleFormatChange = (f: FormatInfo) => {
        setSelectedFormat(f);
        setFile(null);
        setUrl('');
        setRejectedFile(false);
        setImportResult(null);
        setSaveAsSource(false);
        setGitlabToken('');
    };

    const handleImport = async (source: File | string) => {
        setLoading(true);
        try {
            const result = await onImport(selectedFormat.format, source, saveAsSource, gitlabToken || undefined);
            setImportResult(result);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setOpen(false);
        setFile(null);
        setUrl('');
        setRejectedFile(false);
        setImportResult(null);
        setSaveAsSource(false);
        setGitlabToken('');
    };

    // TODO: extract file size formatting to a util function
    const fileSize = file
        ? file.size < 1024
            ? `${file.size} B`
            : file.size < 1024 * 1024
                ? `${Math.round(file.size / 1024)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : null;

    const dropZoneBorder =
        isDragReject || rejectedFile
            ? 'border-destructive/70 bg-destructive/5'
            : isDragActive
                ? 'border-primary bg-primary/5'
                : file
                    ? 'border-border/80 hover:border-border'
                    : 'border-border/50 hover:border-border/80';

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-115 p-0 gap-0 overflow-hidden">

                <div className="px-5 pt-5 pb-0">
                    <h2 className="text-[15px] font-medium tracking-tight mb-4">
                        Import collection
                    </h2>

                    <div className="space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Format
                        </p>
                        <div className="flex gap-2">
                            {FORMAT_INFO.map((format) => {
                                const active = format.format === selectedFormat.format;
                                return (
                                    <button
                                        key={format.format}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleFormatChange(format)}
                                        className={cn(
                                            'relative flex flex-1 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-100 disabled:pointer-events-none',
                                            active
                                                ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                                                : 'border-border/60 hover:border-border hover:bg-muted/40',
                                        )}
                                    >
                                        <div className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors',
                                            active
                                                ? 'border-primary/30 bg-primary/10 text-primary'
                                                : 'border-border/60 bg-muted/60 text-muted-foreground',
                                        )}>
                                            {format.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium leading-none mb-1 text-foreground">
                                                {format.label}
                                            </p>
                                            <p className="text-[11px] leading-none text-muted-foreground">
                                                {format.hint}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 space-y-2">
                    {selectedFormat.inputType === 'url' ? (
                        <div>
                            <UrlInput
                                url={url}
                                loading={loading}
                                saveAsSource={saveAsSource}
                                gitlabToken={gitlabToken}
                                onUrlChange={(v) => { setUrl(v); setImportResult(null); }}
                                onImport={() => handleImport(url)}
                                onSaveAsSourceChange={setSaveAsSource}
                                onGitlabTokenChange={setGitlabToken}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                {selectedFormat.supportedVersions}
                            </p>
                        </div>

                    ) : (
                        <>
                            <div
                                {...getRootProps()}
                                className={cn(
                                    'relative flex min-h-38 flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed px-4 text-center transition-all duration-150',
                                    loading ? 'cursor-default opacity-40 pointer-events-none' : 'cursor-pointer',
                                    dropZoneBorder,
                                )}
                            >
                                <input {...getInputProps()} />

                                {isDragActive && !isDragReject && (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-primary">
                                                <path d="M10 3v10M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <p className="text-[13px] font-medium text-primary">Drop to import</p>
                                    </div>
                                )}

                                {isDragReject && (
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        <p className="text-[13px] font-medium text-destructive">
                                            Only {selectedFormat.acceptedExtensions?.join(', ')} files are supported
                                        </p>
                                    </div>
                                )}

                                {!isDragActive && file && (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-muted/60 px-3 py-1.5">
                                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            <span className="max-w-50 truncate text-[13px] font-medium text-foreground">
                                                {file.name}
                                            </span>
                                            {fileSize && (
                                                <span className="text-[11px] text-muted-foreground">{fileSize}</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); setRejectedFile(false); setImportResult(null); }}
                                                className="ml-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Drop to replace or{' '}
                                            <span className="text-primary">browse</span>
                                        </p>
                                    </div>
                                )}

                                {!isDragActive && !file && (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="rounded-lg border border-border/60 bg-muted/60 p-2">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                                                <path d="M10 3v10M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-medium text-foreground">
                                                Drop your {selectedFormat.acceptedExtensions?.join(' or ')} file here
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                or <span className="text-primary">browse files</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={cn(
                                'flex items-center justify-center gap-1.5 text-[11px] transition-colors duration-150',
                                rejectedFile && !isDragActive ? 'text-destructive' : 'text-muted-foreground',
                            )}>
                                {rejectedFile && !isDragActive && <AlertCircle className="h-3 w-3 shrink-0" />}
                                <span>
                                    {rejectedFile && !isDragActive
                                        ? `Only ${selectedFormat.acceptedExtensions?.join(', ')} files are supported`
                                        : selectedFormat.supportedVersions}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <ImportStats importResult={importResult} />

            </DialogContent>
        </Dialog>
    );
}

function UrlInput({ url, loading, saveAsSource, gitlabToken, onUrlChange, onImport, onSaveAsSourceChange, onGitlabTokenChange }: {
    url: string;
    loading: boolean;
    saveAsSource: boolean;
    gitlabToken: string;
    onUrlChange: (v: string) => void;
    onImport: () => void;
    onSaveAsSourceChange: (v: boolean) => void;
    onGitlabTokenChange: (v: string) => void;
}) {
    const isGitLab = useMemo(() => isGitLabUrl(url), [url]);

    return (
        <div className="space-y-3 min-h-40">
            <div className="flex gap-2 items-center h-full">
                <Input
                    type="url"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) onImport(); }}
                    placeholder="/openapi.(yaml|json)"
                    disabled={loading}
                />
                <Button
                    onClick={onImport}
                    disabled={loading || !url.trim()}
                >
                    {loading ? 'Importing…' : 'Import'}
                </Button>
            </div>
            {isGitLab && (
                <div className="space-y-1">
                    <Input
                        type="password"
                        value={gitlabToken}
                        onChange={(e) => onGitlabTokenChange(e.target.value)}
                        placeholder="GitLab Personal Access Token"
                        disabled={loading}
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Required for private repositories. Token is stored securely in app data.
                    </p>
                </div>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <Switch
                    size="sm"
                    checked={saveAsSource}
                    onCheckedChange={onSaveAsSourceChange}
                    disabled={loading}
                />
                <span className="text-[12px] text-muted-foreground">Track as source</span>
            </label>
        </div>
    );
}

const ImportStats = ({ importResult }: { importResult: ImportResult | null }) => {
    const [showSkipped, setShowSkipped] = useState(false);

    if (!importResult) return null;

    const skipped = importResult.skippedRequests.length;

    return (
        <div className="rounded-lg overflow-hidden border border-border mx-5 mb-5">
            <div className={cn(
                "flex items-start gap-2.5 px-5 py-2.5 border-b",
                skipped > 0
                    ? "bg-warning/10 border-warning/20 text-warning"
                    : "bg-success/10 border-success/20 text-success"
            )}>
                {skipped > 0 ? <TriangleAlert size={15} /> : <CircleCheck size={15} />}
                <div>
                    <p className="text-sm font-medium">
                        {skipped > 0 ? "Import completed with warnings" : "Import successful"}
                    </p>
                    <p className="text-xs opacity-80">
                        {skipped > 0
                            ? `${skipped} requests were skipped`
                            : `${importResult.count} requests imported`}
                    </p>
                </div>
            </div>
            {showSkipped && importResult.skippedRequests.length > 0 && (
                <div className="border-b border-border px-5 py-2.5 max-h-36 overflow-y-auto">
                    <ul className="space-y-1">
                        {importResult.skippedRequests.map((name, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-warning shrink-0" />
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex items-center justify-between px-5 py-2.5">
                <div className="flex gap-4">
                    <Stat label="imported" value={importResult.count} />
                    <Stat label="skipped" value={skipped} warn={skipped > 0} />
                </div>
                <div className="flex items-center gap-2">
                    {skipped > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setShowSkipped(v => !v)}>
                            {showSkipped ? 'Hide list' : 'View skipped'}
                        </Button>
                    )}
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </div>
            </div>
        </div>
    );
};


const Stat = ({ label, value, warn }: { label: string; value: number; warn?: boolean }) => {
    return (
        <div className="text-center">
            <p className={cn("text-lg font-medium leading-none", warn && "text-warning")}>
                {value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
    );
}
