import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createFolderSettings, FolderSettings, readFolderSettings } from "../data/project/project";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const isValidBaseUrl = (url: string): boolean => {
    if (url === '') return true;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export const FolderSettingsDialog = ({ folderPath, onClose }: { folderPath: string, onClose: () => void }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        readFolderSettings(folderPath).then(settings => {
            setBaseUrl(settings.baseUrl);
        }).catch(() => {
            setBaseUrl('');
        });
    }, [folderPath]);

    const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBaseUrl(value);
    };

    const showError = () => {
        if (!isValidBaseUrl(baseUrl)) {
            setError('Must be an absolute HTTP/HTTPS URL');
        } else {
            setError(null);
        }
    }

    const handleSave = async () => {
        if (!isValidBaseUrl(baseUrl)) {
            setError('Must be an absolute HTTP/HTTPS URL');
            return;
        }

        const newSettings: FolderSettings = { baseUrl };
        await createFolderSettings(folderPath, newSettings);
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
                        onBlur={showError}
                            id="baseUrl"
                            placeholder="https://api.example.com"
                            value={baseUrl}
                            onChange={handleBaseUrlChange}
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>

                <DialogFooter className="bg-background border-none" >
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