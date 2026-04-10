import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeyAuth, AuthMethod, HttpBasicAuth, HttpBearerAuth, patchFolderSettings, readFolderSettings, SecurityRequirement } from "@/postchi/project/project";
import { isVariable } from "@/lib/utils/variable-name";
import { useEnvironment } from "../active-environment/environment-context";
import { filename } from "@/lib/storage/files/file-utils/file-utils";
import { LabeledVarInput } from "../components/variable-selector";
import { CircleAlert, Layers, Shield } from "lucide-react";
import { debounce } from "perfect-debounce";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { getActiveProject } from "@/lib/project-state";
import { EnvironmentEditor } from "../editors/environment-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Row } from "@/components/layout";

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
            .map(v => v.key)),]
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

    const saveBaseUrl = useMemo(() => debounce(async (baseUrl: string) => {
        console.log('Saving base URL:', baseUrl);
        await patchFolderSettings(folderPath, { baseUrl });
    }, 300), [folderPath]);

    const saveAuthentication = async (securities: SecurityRequirement[]) => {
        await patchFolderSettings(folderPath, { security: securities });
        setSecurity(securities);
    };


    const [showEnvironment, setShowEnvironment] = useState(false);

    return (

        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="50%" className='bg-background-panel'>
                <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="sm:max-w-162 min-w-75 w-full">
                        <div className="my-8">
                            <div>{filename(folderPath)} Settings</div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="baseUrl">Base URL</Label>
                                <Input
                                    id="baseUrl"
                                    placeholder="https://api.example.com"
                                    value={baseUrl}
                                    onChange={e => {
                                        setBaseUrl(e.target.value);
                                        if (isValidBaseUrl(e.target.value)) {
                                            setBaseUrlError(null);
                                            saveBaseUrl(e.target.value);
                                        } else {
                                            setBaseUrlError('Invalid URL. Must be a variable or start with http:// or https://');
                                        }
                                    }}
                                />
                                <p className={cn("text-sm text-destructive", !baseUrlError && "text-transparent")}>
                                    {baseUrlError || 'Placeholder for error message'}
                                </p>
                            </div>

                            <div className="space-y-2 flex flex-col" hidden={security.length === 0}>
                                <Label className="text-md font-medium">Authentication</Label>
                                <SecurityStep securities={security} onImport={v => saveAuthentication(v)} existingVarNames={vars} />
                                <Button className="place-self-end" variant="secondary" size="sm" onClick={() => setShowEnvironment(prev => !prev)}>
                                    <Layers className="mr-2 h-3.5 w-3.5" />
                                    {showEnvironment ? 'Hide' : 'Show'} Environments
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>

            </ResizablePanel>

            <ResizableHandle className={'w-px bg-muted/60'} />

            <ResizablePanel className='bg-background-panel overflow-hidden' hidden={!showEnvironment}>
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
        <div className="rounded-lg bg-background p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-primary bg-muted px-1.5 py-0.5 rounded">
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
            {
                isVariableValid(method, existingVarNames) ? null : (
                    <Row className="text-sm text-error items-center gap-2">
                        <CircleAlert></CircleAlert>
                        <p>
                            Variable is not defined in any environment or has no value.
                        </p>
                    </Row>

                )
            }
        </div>
    );
}

function isVariableValid(auth: AuthMethod, vars: string[]): boolean {
    if (auth.type === 'http' && auth.scheme === 'bearer') {
        return vars.includes(auth.tokenVariable);
    }
    if (auth.type === 'http' && auth.scheme === 'basic') {
        return vars.includes(auth.usernameVariable) && vars.includes(auth.passwordVariable);
    }
    if (auth.type === 'apiKey') {
        return vars.includes(auth.keyVariable);
    }
    return true;
}