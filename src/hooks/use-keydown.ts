import { useEffect } from "react";


export function useKeydown(handler: (e: KeyboardEvent) => void, deps: any[] = []) {
    useEffect(() => {
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [deps]);
}