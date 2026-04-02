import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { patchFolderSettings, readFolderSettings, SecurityRequirement } from "@/postchi/project/project";
import { SecurityStep } from "../import/import-dialog";
import { isVariable } from "@/lib/utils/variable-name";
import { useEnvironment } from "../active-environment/environment-context";

const isValidBaseUrl = (url: string): boolean => {
    if (url === '' || isVariable(url)) return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};


export const FolderSettingsDialog = ({ folderPath, onClose }: { folderPath: string, onClose: () => void }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [baseUrlError, setBaseUrlError] = useState<string | null>(null);
    const { environments } = useEnvironment();


    const vars = useMemo(() => {
        return [...environments.flatMap(env => [env.variables, env.secrets].flat().map(v => v.key)),].filter((v, i, arr) => arr.indexOf(v) === i);
    }, [environments]);

    const [security, setSecurity] = useState<SecurityRequirement[]>([]);


    useEffect(() => {
        readFolderSettings(folderPath).then(settings => {
            setBaseUrl(settings.baseUrl);
            setSecurity(settings.security || []);
        }).catch(() => {
            setBaseUrl('');
        });
    }, [folderPath]);

    const handleSave = async () => {
        if (!isValidBaseUrl(baseUrl)) {
            setBaseUrlError('Must be an absolute HTTP/HTTPS URL');
            return;
        }

        await patchFolderSettings(folderPath, { baseUrl, security });
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-162 min-w-75">
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

                    <div className="space-y-2" hidden={security.length === 0}>
                        <Label>Authentication</Label>
                        <SecurityStep security={security} onChange={v => setSecurity(v)} existingVarNames={vars} disabled={false} />
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
