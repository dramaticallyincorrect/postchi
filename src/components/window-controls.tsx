import { isTauri } from "@/lib/utils/os";
import { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect } from "react";

export default function MsWindowControls() {
  if (!isTauri()) return null;
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: UnlistenFn | null;

    async function setupListeners() {
      setIsMaximized(await appWindow.isMaximized());

      unlisten = await appWindow.onResized(async () => {
        setIsMaximized(await appWindow.isMaximized());
      });
    }

    setupListeners();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);


  return (
    <div className="flex self-start  pl-4 [app-region:no-drag] [-webkit-app-region:no-drag]">

      {/* Minimize */}
      <button
        onClick={() => appWindow.minimize()}
        title="Minimize"
        className="
          inline-flex items-center justify-center
          w-11.5 h-10 border-none outline-none cursor-default
          text-foreground/60
          hover:text-foreground hover:bg-foreground/10
          transition-colors duration-100
          [app-region:no-drag] [-webkit-app-region:no-drag]
        "
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={() => appWindow.toggleMaximize()}
        title={isMaximized ? "Restore" : "Maximize"}
        className="
          inline-flex items-center justify-center
          w-11.5 h-10 border-none outline-none cursor-default
          text-foreground/60
          hover:text-foreground hover:bg-foreground/10
          transition-colors duration-100
          [app-region:no-drag] [-webkit-app-region:no-drag]
        "
      >
        {isMaximized ? (
          // Restore icon
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2" y="0" width="8" height="8" />
            <polyline points="0,2 0,10 8,10" />
          </svg>
        ) : (
          // Maximize icon
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        onClick={() => appWindow.close()}
        title="Close"
        className="
          inline-flex items-center justify-center
          w-11.5 h-10 border-none outline-none cursor-default
          text-foreground/60
          hover:text-white hover:bg-destructive
          transition-colors duration-100
          [app-region:no-drag] [-webkit-app-region:no-drag]
        "
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>

    </div>
  );
}