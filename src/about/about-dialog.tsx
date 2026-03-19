import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAppVersion } from "@/lib/license/license";
import { useMemo } from "react";

export const AboutDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const version = useMemo(() => {
        return getAppVersion();
    }, []);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-12" aria-describedby={undefined}>
                <DialogHeader className="text-center items-center pb-2">
                    <img src="/postchi.svg" alt="Postchi Logo" className="w-16 h-16 mb-4" />
                    <DialogTitle className="text-2xl font-bold tracking-tight">Postchi</DialogTitle>
                    <p className="text-muted-foreground">version {version}</p>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}