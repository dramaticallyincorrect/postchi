import { useState, useId, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    X, AlertCircle, TriangleAlert, CircleCheck,
    ServerIcon, ImportIcon, ArrowLeft, Loader2, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isGitLabUrl } from '@/lib/storage/integrations/gitlab';
import {
    importFolderInto, ImportResult,
} from '@/postchi/import/import-folder';
import { pathOf } from '@/lib/storage/files/join';
import { patchFolderSettings, Project, SecurityRequirement, HttpBearerAuth, HttpBasicAuth, ApiKeyAuth, AuthMethod } from '@/postchi/project/project';
import { extractGlobalSecurity, fetchOpenApiSpec, convertDocumentToFolder } from '@/postchi/import/open-api/open-api-parser';
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'js-yaml';
import { appendEnvironmentVariables } from '@/postchi/environments/env-writer';
import DefaultFileStorage from '@/lib/storage/files/file-default';
import { setSourceToken } from '@/lib/storage/store/credential-store';
import { addSource } from '@/postchi/sources/sources';
import { isMac } from '@/lib/utils/os';
import MsWindowControls from '@/components/window-controls';
import parseEnvironments from '@/postchi/environments/parser/environments-parser';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { OneTimeImport } from './one-time-import';
import { LabeledVarInput, VarInput } from '../components/variable-selector';

export type ServerMapping = {
    url: string;
    envName: string;
    varName: string;
}

type Step = 'live-fetch' | 'live-servers' | 'live-security' | 'live-result';
type ImportMode = 'live-source' | 'one-time';



export const ImportData = ({ project }: { project: Project }) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('window') !== 'import') return null;
    return <ImportDataContent project={project} />;
};

function ImportDataContent({ project }: { project: Project }) {
    const [existingVarNames, setExistingVarNames] = useState<string[]>([]);
    const [existingEnvNames, setExistingEnvNames] = useState<string[]>([]);

    useEffect(() => {
        DefaultFileStorage.getInstance().readText(project.envPath)
            .then(content => {
                const envs = parseEnvironments(content);
                setExistingVarNames([...new Set(envs.flatMap(e => e.variables.map(v => v.key)))]);
                setExistingEnvNames(envs.map(e => e.name));
            })
            .catch(() => { });
    }, [project.envPath]);

    return (
        <div className="flex flex-col h-screen bg-background">
            <div data-tauri-drag-region className="h-10 shrink-0 flex items-center justify-end px-2">
                {!isMac() && <MsWindowControls />}
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="min-h-full flex items-center justify-center py-6">
                    <ImportWizard
                        existingVarNames={existingVarNames}
                        existingEnvNames={existingEnvNames}
                        project={project}
                    />
                </div>
            </div>
        </div>
    );
}

interface ImportWizardProps {
    existingVarNames: string[];
    existingEnvNames: string[];
    project: Project;
}

function ImportWizard({ existingVarNames, existingEnvNames, project }: ImportWizardProps) {
    const [mode, setMode] = useState<ImportMode | null>(null);

    if (mode === null) {
        return (
            <ModeSelect
                onSelect={(mode) => {
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
            return <LiveImport onCancel={() => setMode(null)} existingEnvNames={existingEnvNames} existingVarNames={existingVarNames} project={project} />;
        case 'one-time':
            return <OneTimeImport onCancel={() => setMode(null)} rootPath={project.collectionsPath} />;
    }

    return null;
}

function ModeSelect({ onSelect }: { onSelect: (mode: 'live-source' | 'one-time') => void }) {
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
                        badge: 'Recommended',
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



async function importLive(project: Project, doc: OpenAPIV3.Document, url: string, token: string | undefined, serverMappings: ServerMapping[], security: SecurityRequirement[]) {
    const rootFolder = convertDocumentToFolder(doc);
    const result = await importFolderInto(rootFolder, project.collectionsPath);
    const specYaml = yaml.dump(doc);

    if (result.rootFolderName) {
        const folderPath = pathOf(project.collectionsPath, result.rootFolderName);
        await DefaultFileStorage.getInstance().create(
            pathOf(folderPath, 'source.yaml'),
            specYaml,
        );
        if (token) {
            await setSourceToken(project.path, result.rootFolderName, token);
        }
        await addSource(project.path, {
            type: 'open-api',
            url,
            path: result.rootFolderName,
            authType: token ? 'gitlab-pat' : undefined,
        });
        if (serverMappings.length > 0) {
            const varName = serverMappings[0]?.varName ?? 'API_BASE_URL';
            await patchFolderSettings(folderPath, { baseUrl: `<${varName}>` });
            await appendEnvironmentVariables(
                project.envPath,
                serverMappings.map(m => ({ envName: m.envName, key: m.varName, value: m.url })),
            );
        }
        if (security.length > 0) {
            await patchFolderSettings(folderPath, { security });
        }
    }
    return result;
}


const LiveImport = ({ onCancel, existingVarNames, existingEnvNames, project }: { onCancel: () => void, existingVarNames: string[], existingEnvNames: string[], project: Project },) => {

    const [step, setStep] = useState<Step>('live-fetch');

    const [liveUrl, setLiveUrl] = useState('');
    const [liveToken, setLiveToken] = useState('');
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [fetchedDoc, setFetchedDoc] = useState<OpenAPIV3.Document | null>(null);
    const [docServers, setDocServers] = useState<OpenAPIV3.ServerObject[]>([]);
    const [docSecurity, setDocSecurity] = useState<SecurityRequirement[] | undefined>(undefined);
    const [serverVarName, setServerVarName] = useState('API_BASE_URL');
    const [serverMappings, setServerMappings] = useState<ServerMapping[]>([]);
    const [securityConfig, setSecurityConfig] = useState<SecurityRequirement[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);


    const handleFetch = async () => {
        setFetchLoading(true);
        setFetchError(null);
        try {
            const doc = await fetchOpenApiSpec(liveUrl, liveToken || undefined);
            const servers = doc.servers ?? [];
            const security = extractGlobalSecurity(doc);

            setFetchedDoc(doc);
            setDocServers(servers);
            setDocSecurity(security);
            setServerVarName('API_BASE_URL');
            setServerMappings(servers.map((s, i) => ({
                url: s.url,
                envName: existingEnvNames[i] ?? '',
                varName: 'API_BASE_URL',
            })));
            setSecurityConfig(security ?? []);

            if (servers.length > 0) {
                setStep('live-servers');
            } else if (security?.length) {
                setStep('live-security');
            } else {
                await handleLiveImport(doc, [], []);
            }
        } catch (e) {
            setFetchError(e instanceof Error ? e.message : 'Failed to fetch spec');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleLiveImport = async (
        doc: OpenAPIV3.Document,
        mappings: ServerMapping[],
        security: SecurityRequirement[],
    ) => {
        setImportLoading(true);
        setImportError(null);
        try {
            const result = await importLive(project, doc, liveUrl, liveToken || undefined, mappings, security);
            setImportResult(result);
            setStep('live-result');
        } catch (e) {
            setImportError(e instanceof Error ? e.message : 'Import failed');
        } finally {
            setImportLoading(false);
        }
    };

    const handleServersNext = () => {
        if (docSecurity?.length) {
            setStep('live-security');
        } else {
            handleLiveImport(fetchedDoc!, serverMappings.map(m => ({ ...m, varName: serverVarName })), []);
        }
    };

    const handleSecurityImport = () => {
        handleLiveImport(fetchedDoc!, serverMappings.map(m => ({ ...m, varName: serverVarName })), securityConfig);
    };

    const liveStepCount = 1 + (docServers.length > 0 ? 1 : 0) + (docSecurity?.length ? 1 : 0);

    if (step === 'live-fetch') {
        return (
            <WizardLayout
                title="Add Live Source"
                onBack={onCancel}
                actions={
                    <Button
                        onClick={handleFetch}
                        disabled={fetchLoading || !liveUrl.trim()}
                    >
                        {fetchLoading
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Fetching…</>
                            : 'Fetch Spec'}
                    </Button>
                }
            >
                <LiveFetchStep
                    url={liveUrl}
                    token={liveToken}
                    loading={fetchLoading}
                    error={fetchError}
                    onUrlChange={(v) => { setLiveUrl(v); setFetchError(null); }}
                    onTokenChange={setLiveToken}
                    onFetch={handleFetch}
                />
            </WizardLayout>
        );
    }

    if (step === 'live-servers') {
        const isLast = !docSecurity?.length;
        return (
            <WizardLayout
                title="Configure Servers"
                stepLabel={`Step 2 of ${liveStepCount}`}
                onBack={() => {
                    setFetchedDoc(null);
                    setDocServers([]);
                    setDocSecurity(undefined);
                    setStep('live-fetch');
                }}
                actions={
                    <>
                        {importError && (
                            <p className="text-[12px] text-destructive mr-auto">{importError}</p>
                        )}
                        <Button
                            onClick={handleServersNext}
                            disabled={importLoading}
                        >
                            {importLoading
                                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Importing…</>
                                : isLast ? 'Import' : 'Next'}
                        </Button>
                    </>
                }
            >
                <ServerStep
                    varName={serverVarName}
                    onVarNameChange={setServerVarName}
                    mappings={serverMappings}
                    onChange={setServerMappings}
                    existingVarNames={existingVarNames}
                    disabled={importLoading}
                />
            </WizardLayout>
        );
    }

    if (step === 'live-security') {
        const stepNum = docServers.length > 0 ? 3 : 2;
        return (
            <WizardLayout
                title="Configure Auth"
                stepLabel={`Step ${stepNum} of ${liveStepCount}`}
                onBack={() => {
                    if (docServers.length > 0) {
                        setStep('live-servers');
                    } else {
                        setFetchedDoc(null);
                        setDocServers([]);
                        setDocSecurity(undefined);
                        setStep('live-fetch');
                    }
                }}
                actions={
                    <>
                        {importError && (
                            <p className="text-[12px] text-destructive mr-auto">{importError}</p>
                        )}
                        <Button
                            onClick={handleSecurityImport}
                            disabled={importLoading}
                        >
                            {importLoading
                                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Importing…</>
                                : 'Import'}
                        </Button>
                    </>
                }
            >
                <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                    These auth schemes were found in the spec.
                </p>
                <SecurityStep
                    security={securityConfig}
                    onChange={setSecurityConfig}
                    existingVarNames={existingVarNames}
                    disabled={importLoading}
                />
            </WizardLayout>
        );
    }

    if (step === 'live-result') {
        return (
            <WizardLayout
                title="Import Complete"
                actions={
                    <Button onClick={() => getCurrentWindow().close()}>Done</Button>
                }
            >
                <LiveResultStep result={importResult} />
            </WizardLayout>
        );
    }
}


function LiveFetchStep({
    url, token, loading, error,
    onUrlChange, onTokenChange, onFetch,
}: {
    url: string;
    token: string;
    loading: boolean;
    error: string | null;
    onUrlChange: (v: string) => void;
    onTokenChange: (v: string) => void;
    onFetch: () => void;
}) {
    const isGitLab = isGitLabUrl(url);

    return (
        <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
                Enter the URL of your OpenAPI spec.
            </p>
            <div className="flex gap-2">
                <Input
                    type="url"
                    value={url}
                    onChange={e => onUrlChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && url.trim()) onFetch(); }}
                    placeholder="https://example.com/openapi.yaml-json"
                    disabled={loading}
                    className="flex-1"
                    autoFocus
                />
            </div>
            {isGitLab && (
                <div className="space-y-1">
                    <Input
                        type="password"
                        value={token}
                        onChange={e => onTokenChange(e.target.value)}
                        placeholder="GitLab Personal Access Token"
                        disabled={loading}
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Required for private repositories. Stored securely in app data.
                    </p>
                </div>
            )}
            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[12px] text-destructive">{error}</p>
                </div>
            )}
            <p className="text-[11px] text-muted-foreground">
                Supports Swagger 2.0, OpenAPI 3.0 and 3.1
            </p>
        </div>
    );
}

function ServerStep({
    varName, onVarNameChange, mappings, onChange, existingVarNames, disabled,
}: {
    varName: string;
    onVarNameChange: (v: string) => void;
    mappings: ServerMapping[];
    onChange: (m: ServerMapping[]) => void;
    existingVarNames: string[];
    disabled: boolean;
}) {

    const updateEntry = (i: number, patch: { envName?: string; url?: string }) => {
        onChange(mappings.map((m, idx) => idx === i ? { ...m, ...patch } : m));
    };

    const removeEntry = (i: number) => {
        onChange(mappings.filter((_, idx) => idx !== i));
    };

    return (
        <div className="space-y-5">
            <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Base URL Variable</p>
                <VarInput
                    value={varName}
                    onChange={onVarNameChange}
                    existingVarNames={existingVarNames}
                    disabled={disabled}
                    placeholder="e.g. API_BASE_URL"
                />
                <p className="text-[11px] text-muted-foreground">
                    Requests will reference <code className="font-mono bg-muted px-1 rounded text-[10px]">&lt;{varName || 'API_BASE_URL'}&gt;</code> as their base URL.
                </p>
            </div>

            {mappings.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Values per environment
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden">
                        {mappings.map((mapping, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 px-3 py-2',
                                    i > 0 && 'border-t border-border',
                                )}
                            >
                                <Input
                                    value={mapping.envName}
                                    onChange={e => updateEntry(i, { envName: e.target.value })}
                                    disabled={disabled}
                                    className="h-7 text-[12px]"
                                    placeholder="Environment name"
                                />
                                <span className="text-[11px] text-muted-foreground">→</span>
                                <Input
                                    value={mapping.url}
                                    onChange={e => updateEntry(i, { url: e.target.value })}
                                    disabled={disabled}
                                    className="h-7 text-[12px] font-mono"
                                    placeholder="https://..."
                                />
                                <button
                                    type="button"
                                    onClick={() => removeEntry(i)}
                                    disabled={disabled}
                                    className="flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:pointer-events-none"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SecurityStep({
    security, onChange, existingVarNames, disabled,
}: {
    security: SecurityRequirement[];
    onChange: (s: SecurityRequirement[]) => void;
    existingVarNames: string[];
    disabled: boolean;
}) {
    const updateScheme = (reqIdx: number, schemeName: string, method: AuthMethod) => {
        onChange(security.map((req, i) =>
            i === reqIdx ? { ...req, [schemeName]: method } : req,
        ));
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {security.map((req, reqIdx) =>
                    Object.entries(req).map(([schemeName, method]) => (
                        <SchemeConfig
                            key={`${reqIdx}-${schemeName}`}
                            method={method}
                            existingVarNames={existingVarNames}
                            disabled={disabled}
                            onChange={m => updateScheme(reqIdx, schemeName, m)}
                        />
                    )),
                )}
            </div>
        </div>
    );
}

function SchemeConfig({
    method, existingVarNames, disabled, onChange,
}: {
    method: AuthMethod;
    existingVarNames: string[];
    disabled: boolean;
    onChange: (m: AuthMethod) => void;
}) {
    const authLabel =
        method.type === 'http' && method.scheme === 'bearer' ? 'Bearer Token' :
            method.type === 'http' && method.scheme === 'basic' ? 'Basic Auth' :
                `API Key · ${method.in}: ${method.name}`;

    return (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-foreground bg-muted px-1.5 py-0.5 rounded">
                    {authLabel}
                </span>
            </div>
            {method.type === 'http' && method.scheme === 'bearer' && (
                <LabeledVarInput
                    label="Token Variable"
                    value={method.tokenVariable}
                    existingVarNames={existingVarNames}
                    disabled={disabled}
                    onChange={v => onChange({ ...method, tokenVariable: v } satisfies HttpBearerAuth)}
                />
            )}
            {method.type === 'http' && method.scheme === 'basic' && (
                <div className="flex flex-row gap-3">
                    <LabeledVarInput
                        label="Username Variable"
                        value={method.usernameVariable}
                        existingVarNames={existingVarNames}
                        disabled={disabled}
                        onChange={v => onChange({ ...method, usernameVariable: v } satisfies HttpBasicAuth)}
                    />
                    <LabeledVarInput
                        label="Password Variable"
                        value={method.passwordVariable}
                        existingVarNames={existingVarNames}
                        disabled={disabled}
                        onChange={v => onChange({ ...method, passwordVariable: v } satisfies HttpBasicAuth)}
                    />
                </div>
            )}
            {method.type === 'apiKey' && (
                <LabeledVarInput
                    label="Key Variable"
                    value={method.keyVariable}
                    existingVarNames={existingVarNames}
                    disabled={disabled}
                    onChange={v => onChange({ ...method, keyVariable: v } satisfies ApiKeyAuth)}
                />
            )}
        </div>
    );
}



function LiveResultStep({ result }: { result: ImportResult | null }) {
    const [showSkipped, setShowSkipped] = useState(false);
    if (!result) return null;

    const skipped = result.skippedRequests.length;
    const isSuccess = skipped === 0;

    return (
        <div className="space-y-4">
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
            <div className="flex gap-6 px-1">
                <Stat label="Imported" value={result.count} />
                {skipped > 0 && <Stat label="Skipped" value={skipped} warn />}
            </div>
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
    );
}


export function WizardLayout({
    title,
    stepLabel,
    onBack,
    children,
    actions,
}: {
    title: string;
    stepLabel?: string;
    onBack?: () => void;
    children: React.ReactNode;
    actions: React.ReactNode;
}) {
    return (
        <div className="flex flex-col px-8 pt-5 pb-6 w-full max-w-130">
            <div className="flex items-center gap-2 mb-5">
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
