import { isMac } from './os';


export function isOsCommandKey(e: KeyboardEvent): boolean {
    return (isMac() ? e.metaKey : e.ctrlKey);
}