import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertCircle, TriangleAlert, CircleCheck,
    ServerIcon, ImportIcon, ArrowLeft, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isGitLabUrl } from '@/lib/storage/integrations/gitlab';
import {
    importFolderInto, ImportResult,
} from '@/postchi/import/import-folder';
import { pathOf } from '@/lib/storage/files/join';
import { patchFolderSettings } from '@/postchi/project/project';
import { fetchOpenApiSpec, convertDocumentToFolder, extractGlobalSecurity } from '@/postchi/import/open-api/open-api-parser';
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'js-yaml';
import DefaultFileStorage from '@/lib/storage/files/file-default';
import { setSourceToken } from '@/lib/storage/store/credential-store';
import { addSource } from '@/postchi/sources/sources';
import { OneTimeImport } from './one-time-import';
import { getActiveProject } from '@/lib/project-state';
import { useAsync } from '@/hooks/use-async';
import { usePanel } from '../project/panel-context';
import { useLicense } from '../license/license-context';
import { emitMenuEvent, MenuActions } from '../menu/menu-events';

export const ImportData = () => {
    return <div className='flex flex-col justify-center items-center h-full'>
        <ImportWizard />
    </div>
};

type ImportMode = 'live-source' | 'one-time';

function ImportWizard() {
    const { isPro } = useLicense();
    const activeProject = getActiveProject()!;
    const [mode, setMode] = useState<ImportMode | null>(null);

    if (mode === null) {
        return (
            <ModeSelect
                onSelect={(mode) => {
                    if (mode === 'live-source' && !isPro) {
                        emitMenuEvent(MenuActions.ACTIVATE_LICENSE);
                        return
                    }
                    if (mode === 'live-source') {
                        setMode('live-source');
                    } else {
                        setMode('one-time');
                    }
                }}
            />
        );
    }


    switch (mode) {
        case 'live-source':
            return <LiveImport onCancel={() => setMode(null)} />;
        case 'one-time':
            return <OneTimeImport onCancel={() => setMode(null)} rootPath={activeProject?.collectionsPath} />;
    }
}

function ModeSelect({ onSelect }: { onSelect: (mode: 'live-source' | 'one-time') => void }) {
    const { isPro } = useLicense();

    return (
        <div className="flex flex-col items-center px-8 gap-6">
            <div className="text-center">
                <h1 className="text-[17px] font-semibold tracking-tight"></h1>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-130">
                {([
                    {
                        mode: 'live-source' as const,
                        icon: <ServerIcon className="h-6 w-6" />,
                        label: 'Live Source',
                        description: 'Track an OpenAPI spec URL. Enables Automatic sync, encriched autocomplete and linting.',
                        badge: isPro ? 'Recommended' : 'Pro',
                    },
                    {
                        mode: 'one-time' as const,
                        icon: <ImportIcon className="h-6 w-6" />,
                        label: 'One Time Import',
                        description: 'Import a snapshot from a Postman collection or OpenAPI spec file. No ongoing sync.',
                        badge: null,
                    },
                ]).map((item) => (
                    <button
                        key={item.mode}
                        type="button"
                        onClick={() => onSelect(item.mode)}
                        className={cn(
                            'relative flex flex-col items-start gap-3 rounded-xl border px-5 py-5 text-left',
                            'transition-all duration-100',
                            'border-border/60 hover:border-border bg-card hover:bg-muted/30',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        )}
                    >
                        {item.badge && (
                            <span className="absolute top-3.5 right-3.5 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                                {item.badge}
                            </span>
                        )}
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg border border-border/60 bg-muted/60 text-foreground">
                            {item.icon}
                        </div>
                        <div>
                            <p className="text-[14px] font-semibold text-foreground">{item.label}</p>
                            <p className="text-[12px] text-foreground/70 leading-relaxed mt-1">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}


const LiveImport = ({ onCancel }: { onCancel: () => void },) => {

    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [doc, setDoc] = useState<OpenAPIV3.Document | null>(null)

    const { openView } = usePanel()

    const isGitLab = isGitLabUrl(url);

    const startFetch = async () => {
        if (url.trim()) {
            setError(null);
            setLoading(true);
            try {
                const doc = await fetchOpenApiSpec(url, token || undefined);
                setDoc(doc)
                setLoading(false)
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to fetch spec');
                setLoading(false);
            }
        }
    }

    return (
        <WizardLayout actions={
            <Button
                onClick={startFetch}
                hidden={doc != null}
            >
                {loading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Fetching…</>
                    : 'Fetch Spec'}
            </Button>
        }>
            <WizardStepNav title='Back' onBack={onCancel} />
            <div className="space-y-4">
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Enter the URL of your OpenAPI spec.
                </p>
                <div className="flex gap-2">
                    <Input
                        type="url"
                        value={url}
                        onChange={e => {
                            setUrl(e.target.value);
                            setDoc(null)
                        }}
                        onKeyDown={e => { if (e.key === 'Enter' && url.trim()) startFetch(); }}
                        placeholder="https://example.com/openapi.yaml-json"
                        className="flex-1"
                        autoFocus
                    />
                </div>
                {isGitLab && (
                    <div className="space-y-1">
                        <Input
                            type="password"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder="GitLab Personal Access Token"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Required for private repositories. must have read-repository access.
                        </p>
                    </div>
                )}
                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-[12px] text-destructive">{error}</p>
                    </div>
                )}
                <p className="text-[11px] text-muted-foreground" hidden={doc != null}>
                    Supports Swagger 2.0, OpenAPI 3.0 and 3.1
                </p>

                {
                    doc && (
                        <ImportSpec doc={doc} url={url} token={token} onDone={(result) => openView({
                            type: 'FOLDER_SETTINGS',
                            params: {
                                path: pathOf(getActiveProject()!.collectionsPath, result.rootFolderName)
                            }
                        })} />
                    )
                }
            </div>
        </WizardLayout>
    );
}

function ImportSpec({ doc, url, token, onDone }: { doc: OpenAPIV3.Document, url: string, token: string, onDone: (result: ImportResult) => void }) {

    const importData = async () => {
        const project = getActiveProject()!;
        const rootFolder = convertDocumentToFolder(doc!);
        const result = await importFolderInto(rootFolder, project.collectionsPath);
        const specYaml = yaml.dump(doc);
        if (result.rootFolderName) {
            const folderPath = pathOf(project.collectionsPath, result.rootFolderName);
            await DefaultFileStorage.getInstance().create(
                pathOf(folderPath, 'source.yaml'),
                specYaml,
            );
            if (token) {
                await setSourceToken(url, token);
            }
            await addSource(project.path, {
                type: 'open-api',
                url,
                path: result.rootFolderName,
                authType: token ? 'gitlab-pat' : undefined,
            });

            const security = extractGlobalSecurity(doc)
            patchFolderSettings(folderPath, { security: security })
        }
        return result
    }

    const { data: importResult, loading, error, execute } = useAsync(importData)


    if (importResult) {
        return <ImportResults result={importResult} onConfigure={(result) => onDone(result)} />;
    }


    return <WizardLayout actions={
        <Button
            onClick={execute}
        >
            {loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Fetching…</>
                : 'Import'}
        </Button>
    }>
        <div className="border-t pt-4">
            <p className="text-foreground leading-relaxed">
                {doc.info.title}
            </p>
            <p className='text-[12px] text-muted-foreground'>
                version: {doc.info.version}
            </p>
            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[12px] text-destructive">{error.message}</p>
                </div>
            )}
        </div>
    </WizardLayout>

}

function ImportResults({ result, onConfigure }: { result: ImportResult | null, onConfigure: (result: ImportResult) => void }) {
    const [showSkipped, setShowSkipped] = useState(false);
    if (!result) return null;

    const skipped = result.skippedRequests.length;
    const isSuccess = skipped === 0;
    return (
        <WizardLayout actions={
            <Button
                onClick={() => onConfigure(result)}
            >
                Configure
            </Button>
        }>
            <div className="space-y-4 ">
                <div className={cn(
                    'flex items-start gap-3 rounded-lg border px-4 py-3.5',
                    isSuccess
                        ? 'bg-success/10 border-success/20 text-success'
                        : 'bg-warning/10 border-warning/20 text-warning',
                )}>
                    {isSuccess
                        ? <CircleCheck className="h-4 w-4 mt-0.5 shrink-0" />
                        : <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div>
                        <p className="text-[13px] font-medium">
                            {isSuccess ? 'Import successful' : 'Import completed with warnings'}
                        </p>
                        <p className="text-[12px] opacity-80 mt-0.5">
                            {isSuccess
                                ? `${result.count} requests imported`
                                : `${skipped} requests skipped`}
                        </p>
                    </div>
                </div>
                {skipped > 0 && <div className="flex gap-6 px-1">
                    <Stat label="Imported" value={result.count} />
                    <Stat label="Skipped" value={skipped} warn />
                </div>}
                {skipped > 0 && (
                    <div>
                        <button
                            onClick={() => setShowSkipped(v => !v)}
                            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showSkipped ? 'Hide skipped' : `View ${skipped} skipped`}
                        </button>
                        {showSkipped && (
                            <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                {result.skippedRequests.map((name, i) => (
                                    <li key={i} className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-warning shrink-0" />
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </WizardLayout>
    );
}

function WizardStepNav({ title, stepLabel, onBack }: {
    title: string;
    stepLabel?: string;
    onBack?: () => void;
}) {
    return <div className="flex items-center gap-2 mb-5">
        {onBack && (
            <button
                onClick={onBack}
                className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>
        )}
        <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
            {stepLabel && (
                <p className="text-[11px] text-muted-foreground">{stepLabel}</p>
            )}
        </div>
    </div>
}


export function WizardLayout({
    children,
    actions,
}: {
    children: React.ReactNode;
    actions: React.ReactNode;
}) {
    return (
        <div className="flex flex-col pt-5 pb-6 w-full max-w-130">
            <div>
                {children}
            </div>
            {actions && (
                <div className="mt-5 flex items-center justify-end gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
    return (
        <div>
            <p className={cn('text-xl font-semibold leading-none', warn && 'text-warning')}>{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
    );
}
