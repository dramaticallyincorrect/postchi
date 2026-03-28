import { isMac } from './os';


export function isOsCommandKey(e: KeyboardEvent): boolean {
    return (isMac() ? e.metaKey : e.ctrlKey);
}

export function isOnlyOsCommandKey(e: KeyboardEvent): boolean {
    return (isMac() ? e.metaKey && (!e.ctrlKey && !e.altKey && !e.shiftKey) : e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey);
}