import { check, Update } from '@tauri-apps/plugin-updater';

export async function checkForUpdate(): Promise<Update | null> {
    const update = await check();
    return update ?? null;
}
