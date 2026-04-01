import MsWindowControls from "@/components/window-controls";
import { isMac } from "@/lib/utils/os";

export function WindowShell({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex flex-col h-screen">
            <div data-tauri-drag-region className="h-10 shrink-0 justify-end flex items-center">
                {!isMac() && <MsWindowControls />}
            </div>
            <div className="flex-1 flex items-center justify-center">
                {children}
            </div>
        </div>
    )
}