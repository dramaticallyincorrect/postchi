import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MenuActions } from "@/app/menu/menu-events";
import { getAppVersion } from "@/postchi/license/license";
import { useMemo } from "react";
import { useMenuTrigger } from "@/hooks/use-menu-trigger";

export const AboutDialog = () => {
    const [open, setOpen] = useMenuTrigger(MenuActions.ABOUT_POSTCHI);

    const version = useMemo(() => {
        return getAppVersion();
    }, []);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
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