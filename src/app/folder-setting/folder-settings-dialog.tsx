import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthMethod, FolderSettings, HttpBearerAuth, HttpBasicAuth, ApiKeyAuth, patchFolderSettings, readFolderSettings, SecurityRequirement } from "@/postchi/project/project";
import { useEnvironment } from "@/app/active-environment/environment-context";
import { SecurityStep } from "../import/import-dialog";

const isValidBaseUrl = (url: string): boolean => {
    if (url === '') return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey';

const getAuthType = (security: FolderSettings['security']): AuthType => {
    const method = firstAuthMethod(security);
    if (!method) return 'none';
    if (method.type === 'http' && method.scheme === 'bearer') return 'bearer';
    if (method.type === 'http' && method.scheme === 'basic') return 'basic';
    if (method.type === 'apiKey') return 'apiKey';
    return 'none';
};

const firstAuthMethod = (security: FolderSettings['security']): AuthMethod | null => {
    if (!security || security.length === 0) return null;
    const first = security[0];
    const values = Object.values(first);
    return values.length > 0 ? values[0] : null;
};

const firstSchemeName = (security: FolderSettings['security']): string => {
    if (!security || security.length === 0) return 'auth';
    const first = security[0];
    const keys = Object.keys(first);
    return keys.length > 0 ? keys[0] : 'auth';
};

const buildSecurity = (
    schemeName: string,
    authType: AuthType,
    bearer: { tokenVariable: string },
    basic: { usernameVariable: string; passwordVariable: string },
    apiKey: { name: string; in: 'header' | 'query' | 'cookie'; keyVariable: string },
): FolderSettings['security'] => {
    if (authType === 'none') return undefined;
    let method: AuthMethod;
    if (authType === 'bearer') {
        method = { type: 'http', scheme: 'bearer', tokenVariable: bearer.tokenVariable } satisfies HttpBearerAuth;
    } else if (authType === 'basic') {
        method = { type: 'http', scheme: 'basic', usernameVariable: basic.usernameVariable, passwordVariable: basic.passwordVariable } satisfies HttpBasicAuth;
    } else {
        method = { type: 'apiKey', name: apiKey.name, in: apiKey.in, keyVariable: apiKey.keyVariable } satisfies ApiKeyAuth;
    }
    return [{ [schemeName]: method }];
};

const VarSelect = ({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) => {
    const { activeEnvironment } = useEnvironment();
    const vars = activeEnvironment?.variables ?? [];
    const secrets = activeEnvironment?.secrets ?? [];
    const hasOptions = vars.length > 0 || secrets.length > 0;

    if (!hasOptions) {
        return (
            <Input
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        );
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={id}>
                <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent>
                {vars.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>Environment</SelectLabel>
                        {vars.map(v => (
                            <SelectItem key={v.key} value={v.key}>{v.key}</SelectItem>
                        ))}
                    </SelectGroup>
                )}
                {vars.length > 0 && secrets.length > 0 && <SelectSeparator />}
                {secrets.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>Secrets</SelectLabel>
                        {secrets.map(s => (
                            <SelectItem key={s.key} value={s.key}>{s.key}</SelectItem>
                        ))}
                    </SelectGroup>
                )}
            </SelectContent>
        </Select>
    );
};

export const FolderSettingsDialog = ({ folderPath, onClose }: { folderPath: string, onClose: () => void }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [baseUrlError, setBaseUrlError] = useState<string | null>(null);

    const [authType, setAuthType] = useState<AuthType>('none');
    const [schemeName, setSchemeName] = useState('auth');
    const [bearerToken, setBearerToken] = useState('');
    const [basicUsername, setBasicUsername] = useState('');
    const [basicPassword, setBasicPassword] = useState('');
    const [apiKeyName, setApiKeyName] = useState('');
    const [apiKeyIn, setApiKeyIn] = useState<'header' | 'query' | 'cookie'>('header');
    const [apiKeyVariable, setApiKeyVariable] = useState('');
    const [security, setSecurity] = useState<SecurityRequirement[]>([]);
    

    useEffect(() => {
        readFolderSettings(folderPath).then(settings => {
            setBaseUrl(settings.baseUrl);
            const method = firstAuthMethod(settings.security);
            setSecurity(settings.security ?? []);
            setAuthType(getAuthType(settings.security));
            setSchemeName(firstSchemeName(settings.security));
            if (method) {
                if (method.type === 'http' && method.scheme === 'bearer') {
                    setBearerToken(method.tokenVariable);
                } else if (method.type === 'http' && method.scheme === 'basic') {
                    setBasicUsername(method.usernameVariable);
                    setBasicPassword(method.passwordVariable);
                } else if (method.type === 'apiKey') {
                    setApiKeyName(method.name);
                    setApiKeyIn(method.in);
                    setApiKeyVariable(method.keyVariable);
                }
            }
        }).catch(() => {
            setBaseUrl('');
        });
    }, [folderPath]);

    const handleSave = async () => {
        if (!isValidBaseUrl(baseUrl)) {
            setBaseUrlError('Must be an absolute HTTP/HTTPS URL');
            return;
        }

        const security = buildSecurity(
            schemeName,
            authType,
            { tokenVariable: bearerToken },
            { usernameVariable: basicUsername, passwordVariable: basicPassword },
            { name: apiKeyName, in: apiKeyIn, keyVariable: apiKeyVariable },
        );

        await patchFolderSettings(folderPath, { baseUrl, security });
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Folder Settings</DialogTitle>
                </DialogHeader>

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

                    <div className="space-y-2">
                        <Label>Authentication</Label>
                        <SecurityStep security={security} onChange={v => setAuthType(getAuthType(v))} existingVarNames={[]} disabled={false} />
                    </div>

                </div>

                <DialogFooter className="bg-background border-none">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!isValidBaseUrl(baseUrl)}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
