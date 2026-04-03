import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeyAuth, AuthMethod, HttpBasicAuth, HttpBearerAuth, patchFolderSettings, readFolderSettings, SecurityRequirement } from "@/postchi/project/project";
import { isVariable } from "@/lib/utils/variable-name";
import { useEnvironment } from "../active-environment/environment-context";
import { filename } from "@/lib/storage/files/file-utils/file-utils";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EnvironmentEditor } from "../editors/environment-editor";
import { getActiveProject } from "@/lib/project-state";
import { LabeledVarInput } from "../components/variable-selector";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const isValidBaseUrl = (url: string): boolean => {
    if (url === '' || isVariable(url)) return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};


export const FolderSettings = ({ folderPath }: { folderPath: string }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [baseUrlError, setBaseUrlError] = useState<string | null>(null);
    const { environments } = useEnvironment();


    const vars = useMemo(() => {
        return [...environments.flatMap(env => [env.variables, env.secrets]
            .flat()
            .map(v => `<${v.key}>`)),]
            .filter((v, i, arr) => arr.indexOf(v) === i);
    }, [environments]);

    const [security, setSecurity] = useState<SecurityRequirement[]>([]);

    useEffect(() => {
        readFolderSettings(folderPath).then(settings => {
            setBaseUrl(settings.baseUrl);
            setSecurity(settings.security || []);
        }).catch(() => {
            setBaseUrl('');
            setSecurity([]);
        });
    }, [folderPath]);

    const saveAuthentication = async (securities: SecurityRequirement[]) => {
        await patchFolderSettings(folderPath, { security: securities });
        setSecurity(securities);
    };


    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="50%" className='bg-background-panel'>
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="sm:max-w-162 min-w-75">
                        <div className="my-8">
                            <div>{filename(folderPath)} Settings</div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="baseUrl">Base URL</Label>
                                <Input
                                    onBlur={() => {
                                        if (!isValidBaseUrl(baseUrl)) setBaseUrlError('Must be an absolute HTTP/HTTPS URL');
                                        else setBaseUrlError(null);
                                    }}
                                    id="baseUrl"
                                    placeholder="https://api.example.com"
                                    value={baseUrl}
                                    onChange={e => setBaseUrl(e.target.value)}
                                />
                                {baseUrlError && <p className="text-sm text-red-500">{baseUrlError}</p>}
                            </div>

                            <div className="space-y-2" hidden={security.length === 0}>
                                <Label>Authentication</Label>
                                <SecurityStep securities={security} onImport={v => saveAuthentication(v)} existingVarNames={vars} />
                            </div>

                        </div>
                    </div>
                </div>

            </ResizablePanel>

            <ResizableHandle className={'w-px bg-muted/60'} />

            <ResizablePanel className='bg-background-panel overflow-hidden'>
                <EnvSecretSplit />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}

function EnvSecretSplit() {
    return <ResizablePanelGroup
        orientation="vertical"
        className="w-full h-full">
        <ResizablePanel defaultSize="50%" className='bg-background-panel relative'>
            <EnvironmentEditor path={getActiveProject()!.envPath} />
            <Badge className="absolute bottom-8 right-8" >Environments</Badge>
        </ResizablePanel>

        <ResizableHandle className={'w-px'} />

        <ResizablePanel className='bg-background-panel overflow-visible h-full relative'>
            <EnvironmentEditor path={getActiveProject()!.secretsPath} />
            <Badge className="absolute bottom-8 right-8" >Secrets</Badge>
        </ResizablePanel>
    </ResizablePanelGroup>
}


function SecurityStep({
    securities, onImport, existingVarNames
}: {
    securities: SecurityRequirement[];
    onImport: (s: SecurityRequirement[]) => void;
    existingVarNames: string[];
}) {
    const updateScheme = (reqIdx: number, schemeName: string, method: AuthMethod) => {
        const newSecurities = securities.map((req, i) =>
            i === reqIdx ? { ...req, [schemeName]: method } : req,
        )
        onImport(newSecurities);
    };

    return <div className="space-y-3">
        <div className="space-y-2">
            {securities.map((req, reqIdx) =>
                Object.entries(req).map(([schemeName, method]) => (
                    <SchemeConfig
                        key={`${reqIdx}-${schemeName}`}
                        method={method}
                        existingVarNames={existingVarNames}
                        onChange={m => updateScheme(reqIdx, schemeName, m)}
                    />
                )),
            )}
        </div>
    </div>
}

function SchemeConfig({
    method, existingVarNames, onChange,
}: {
    method: AuthMethod;
    existingVarNames: string[];
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
                    onChange={v => onChange({ ...method, tokenVariable: v } satisfies HttpBearerAuth)}
                />
            )}
            {method.type === 'http' && method.scheme === 'basic' && (
                <div className="flex flex-row gap-3">
                    <LabeledVarInput
                        label="Username Variable"
                        value={method.usernameVariable}
                        existingVarNames={existingVarNames}
                        onChange={v => onChange({ ...method, usernameVariable: v } satisfies HttpBasicAuth)}
                    />
                    <LabeledVarInput
                        label="Password Variable"
                        value={method.passwordVariable}
                        existingVarNames={existingVarNames}
                        onChange={v => onChange({ ...method, passwordVariable: v } satisfies HttpBasicAuth)}
                    />
                </div>
            )}
            {method.type === 'apiKey' && (
                <LabeledVarInput
                    label="Key Variable"
                    value={method.keyVariable}
                    existingVarNames={existingVarNames}
                    onChange={v => onChange({ ...method, keyVariable: v } satisfies ApiKeyAuth)}
                />
            )}
        </div>
    );
}