import { FileWatchEventType } from '@/lib/storage/files/file';
import DefaultFileStorage from '@/lib/storage/files/file-default';
import { useEffect, useRef } from 'react';

interface WatchOptions {
    debounceMs?: number;
    ignoreModified?: boolean;
}

export function useFileWatch(
    path: string | null,
    onUpdate: (event: any) => void,
    options: WatchOptions = { debounceMs: 100, ignoreModified: true }
) {
    const callbackRef = useRef(onUpdate);
    callbackRef.current = onUpdate;

    useEffect(() => {
        if (!path) return;

        let unwatch: (() => void) | undefined;
        let timer: number | null = null;

        async function setup() {
            unwatch = await DefaultFileStorage.getInstance().watch(path!, (event) => {
                if (options.ignoreModified && event.type === FileWatchEventType.Modified) {
                    return;
                }

                if (timer) window.clearTimeout(timer);
                timer = window.setTimeout(() => {
                    callbackRef.current(event);
                }, options.debounceMs);
            });
        }

        setup();

        return () => {
            if (unwatch) unwatch();
            if (timer) window.clearTimeout(timer);
        };
    }, [path, options.debounceMs, options.ignoreModified]);
}