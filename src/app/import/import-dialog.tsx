import { useState, useCallback, useMemo } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, X, AlertCircle, TriangleAlert, CircleCheck, Server, ServerIcon, ImportIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuActions } from '@/app/menu/menu-events';
import { useMenuTrigger } from '@/hooks/use-menu-trigger';
import { Input } from '../../components/ui/input';
import { isGitLabUrl } from '@/lib/storage/integrations/gitlab';
import { ImportOpenApiResult, ImportResult } from '@/postchi/import/import-folder';

export type ServerMapping = {
    url: string;
    envName: string;
    varName: string;
}

type ImportFormat = 'postman' | 'openapi' | 'auto';
type ImportMode = 'live-source' | 'one-time';

interface ImportDialogProps {
    onImport: (format: ImportFormat, source: File | string, saveAsSource: boolean, token?: string) => Promise<ImportResult>;
    onSetupServers?: (mappings: ServerMapping[], folderName: string) => Promise<void>;
}

const ONE_TIME_ACCEPT = {
    'application/json': ['.json'],
    'application/zip': ['.zip'],
    'application/x-yaml': ['.yaml', '.yml'],
    'text/yaml': ['.yaml', '.yml'],
};
const ONE_TIME_EXTENSIONS = ['.json', '.zip', '.yaml', '.yml'];

export function ImportDialog({ onImport, onSetupServers }: ImportDialogProps) {
    const [open, setOpen] = useMenuTrigger(MenuActions.IMPORT_PROJECT);
    const [mode, setMode] = useState<ImportMode>('live-source');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [rejectedFile, setRejectedFile] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [gitlabToken, setGitlabToken] = useState('');
    const [serverMappings, setServerMappings] = useState<ServerMapping[] | null>(null);
    const [applyingServers, setApplyingServers] = useState(false);

    const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
        if (accepted[0]) {
            setFile(accepted[0]);
            handleImport(accepted[0]);
        } else if (rejected.length > 0) setRejectedFile(true);
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        accept: ONE_TIME_ACCEPT,
        maxFiles: 1,
        onDrop,
        disabled: loading || mode === 'live-source',
    });

    const handleModeChange = (m: ImportMode) => {
        setMode(m);
        setFile(null);
        setUrl('');
        setRejectedFile(false);
        setImportResult(null);
        setGitlabToken('');
        setServerMappings(null);
    };

    const handleImport = async (source: File | string) => {
        setLoading(true);
        try {
            const saveAsSource = mode === 'live-source';
            const format: ImportFormat = source instanceof File ? 'auto' : 'openapi';
            const result = await onImport(format, source, saveAsSource, gitlabToken || undefined);
            const openApiResult = result as ImportOpenApiResult;
            if (
                onSetupServers &&
                openApiResult.servers?.length > 0 &&
                openApiResult.rootFolderName
            ) {
                const defaultVarName = 'API_BASE_URL';
                setServerMappings(openApiResult.servers.map((s, i) => ({
                    url: s.url,
                    envName: s.description?.trim() || (openApiResult.servers.length === 1 ? 'Default' : `Server ${i + 1}`),
                    varName: defaultVarName,
                })));
            }
            setImportResult(result);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading || applyingServers) return;
        setOpen(false);
        setFile(null);
        setUrl('');
        setRejectedFile(false);
        setImportResult(null);
        setGitlabToken('');
        setServerMappings(null);
    };

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
                            Import type
                        </p>
                        <div className="flex gap-2">
                            {([
                                {
                                    mode: 'live-source' as ImportMode,
                                    label: 'Live Source',
                                    hint: 'Always in sync',
                                    icon: <ServerIcon />,
                                },
                                {
                                    mode: 'one-time' as ImportMode,
                                    label: 'One Time Import',
                                    hint: 'Postman - OpenAPI',
                                    icon: <ImportIcon />,
                                },
                            ] as const).map((item) => {
                                const active = item.mode === mode;
                                return (
                                    <button
                                        key={item.mode}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleModeChange(item.mode)}
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
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium leading-none mb-1 text-foreground">
                                                {item.label}
                                            </p>
                                            <p className="text-[11px] leading-none text-muted-foreground">
                                                {item.hint}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                    {mode === 'live-source' ? (
                        <LiveSourceInput
                            url={url}
                            loading={loading}
                            gitlabToken={gitlabToken}
                            onUrlChange={(v) => { setUrl(v); setImportResult(null); }}
                            onImport={() => handleImport(url)}
                            onGitlabTokenChange={setGitlabToken}
                        />
                    ) : (
                        <OneTimeImportInput
                            file={file}
                            fileSize={fileSize}
                            url={url}
                            loading={loading}
                            gitlabToken={gitlabToken}
                            isDragActive={isDragActive}
                            isDragReject={isDragReject}
                            rejectedFile={rejectedFile}
                            dropZoneBorder={dropZoneBorder}
                            getRootProps={getRootProps}
                            getInputProps={getInputProps}
                            onClearFile={() => { setFile(null); setRejectedFile(false); setImportResult(null); }}
                            onUrlChange={(v) => { setUrl(v); setImportResult(null); }}
                            onImportUrl={() => handleImport(url)}
                            onGitlabTokenChange={setGitlabToken}
                        />
                    )}
                </div>

                {serverMappings && importResult && onSetupServers && (
                    <ServerMappingStep
                        mappings={serverMappings}
                        applying={applyingServers}
                        onMappingsChange={setServerMappings}
                        onApply={async () => {
                            setApplyingServers(true);
                            try {
                                await onSetupServers(serverMappings, importResult.rootFolderName);
                            } finally {
                                setApplyingServers(false);
                                setServerMappings(null);
                            }
                        }}
                        onSkip={() => setServerMappings(null)}
                    />
                )}
                {!serverMappings && <ImportStats importResult={importResult} />}

            </DialogContent>
        </Dialog>
    );
}

function LiveSourceInput({ url, loading, gitlabToken, onUrlChange, onImport, onGitlabTokenChange }: {
    url: string;
    loading: boolean;
    gitlabToken: string;
    onUrlChange: (v: string) => void;
    onImport: () => void;
    onGitlabTokenChange: (v: string) => void;
}) {
    const isGitLab = useMemo(() => isGitLabUrl(url), [url]);

    return (
        <div className="space-y-3 min-h-64.5">
        <p className="text-[12px] bg-success/73 px-2 py-2 rounded text-foreground">
                Live sources stay in sync — whenever the spec at your URL changes, you'll be notified to review the changes.
            </p>
            <div className="flex gap-2 items-center">
                <Input
                    type="url"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) onImport(); }}
                    placeholder="https://example.com/openapi"
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
            <p className="text-[11px] text-muted-foreground">
                Supports Swagger 2.0, OpenAPI 3.0 and v3.1 — tracked and kept in sync automatically
            </p>
        </div>
    );
}

function OneTimeImportInput({
    file, fileSize, url, loading, gitlabToken,
    isDragActive, isDragReject, rejectedFile, dropZoneBorder,
    getRootProps, getInputProps,
    onClearFile, onUrlChange, onImportUrl, onGitlabTokenChange,
}: {
    file: File | null;
    fileSize: string | null;
    url: string;
    loading: boolean;
    gitlabToken: string;
    isDragActive: boolean;
    isDragReject: boolean;
    rejectedFile: boolean;
    dropZoneBorder: string;
    getRootProps: () => Record<string, unknown>;
    getInputProps: () => Record<string, unknown>;
    onClearFile: () => void;
    onUrlChange: (v: string) => void;
    onImportUrl: () => void;
    onGitlabTokenChange: (v: string) => void;
}) {
    const isGitLab = useMemo(() => isGitLabUrl(url), [url]);

    return (
        <div className="space-y-3">
            {/* File dropzone */}
            <div>
                <div
                    {...getRootProps()}
                    className={cn(
                        'relative flex min-h-32 flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed px-4 text-center transition-all duration-150',
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
                                Only {ONE_TIME_EXTENSIONS.join(', ')} files are supported
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
                                    onClick={(e) => { e.stopPropagation(); onClearFile(); }}
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
                                    Drop your file here
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    or <span className="text-primary">browse files</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={cn(
                    'flex items-center justify-center gap-1.5 mt-1.5 text-[11px] transition-colors duration-150',
                    rejectedFile && !isDragActive ? 'text-destructive' : 'text-muted-foreground',
                )}>
                    {rejectedFile && !isDragActive && <AlertCircle className="h-3 w-3 shrink-0" />}
                    <span>
                        {rejectedFile && !isDragActive
                            ? `Only ${ONE_TIME_EXTENSIONS.join(', ')} files are supported`
                            : 'Postman collection (.json, .zip) or OpenAPI spec (.yaml, .json)'}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border/50" />
                <span className="text-[11px] text-muted-foreground">or import from URL</span>
                <div className="flex-1 border-t border-border/50" />
            </div>

            {/* URL input */}
            <div className="space-y-2">
                <div className="flex gap-2 items-center">
                    <Input
                        type="url"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) onImportUrl(); }}
                        placeholder="/openapi.(yaml|json)"
                        disabled={loading}
                    />
                    <Button
                        onClick={onImportUrl}
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
                <p className="text-[11px] text-muted-foreground">
                    Supports Swagger 2.0, OpenAPI 3.0 and v3.1
                </p>
            </div>
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


function ServerMappingStep({ mappings, applying, onMappingsChange, onApply, onSkip }: {
    mappings: ServerMapping[];
    applying: boolean;
    onMappingsChange: (mappings: ServerMapping[]) => void;
    onApply: () => void;
    onSkip: () => void;
}) {
    const updateMapping = (index: number, patch: Partial<ServerMapping>) => {
        onMappingsChange(mappings.map((m, i) => i === index ? { ...m, ...patch } : m));
    };

    return (
        <div className="mx-5 mb-5 rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
                <Server size={13} className="text-muted-foreground shrink-0" />
                <p className="text-[12px] font-medium text-foreground">
                    {mappings.length === 1 ? '1 server detected' : `${mappings.length} servers detected`}
                </p>
                <p className="text-[11px] text-muted-foreground ml-1">— map to environment variables</p>
            </div>

            <div className="divide-y divide-border">
                {mappings.map((mapping, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Environment</p>
                            <Input
                                value={mapping.envName}
                                onChange={(e) => updateMapping(i, { envName: e.target.value })}
                                disabled={applying}
                                className="h-7 text-[12px]"
                            />
                        </div>
                        <div className="text-muted-foreground text-[11px] mt-4">→</div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Variable</p>
                            <Input
                                value={mapping.varName}
                                onChange={(e) => updateMapping(i, { varName: e.target.value })}
                                disabled={applying}
                                className="h-7 text-[12px] font-mono"
                            />
                        </div>
                        <div className="col-span-3 -mt-1">
                            <p className="text-[11px] text-muted-foreground truncate">{mapping.url}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border">
                <Button variant="ghost" size="sm" onClick={onSkip} disabled={applying}>
                    Skip
                </Button>
                <Button size="sm" onClick={onApply} disabled={applying}>
                    {applying ? 'Applying…' : 'Apply'}
                </Button>
            </div>
        </div>
    );
}

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
