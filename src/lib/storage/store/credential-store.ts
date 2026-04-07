import { setPassword, getPassword, deletePassword } from 'tauri-plugin-keyring-api';

const SERVICE_NAME = import.meta.env.DEV ? 'postchi-dev' : 'postchi'

export async function getSourceToken(sourceUrl: string): Promise<string | null> {
    return getPassword(SERVICE_NAME, sourceUrl)
}

export async function setSourceToken(sourceUrl: string, token: string): Promise<void> {
    await setPassword(SERVICE_NAME, sourceUrl, token)
}

export async function deleteSourceToken(sourceUrl: string): Promise<void> {
    await deletePassword(SERVICE_NAME, sourceUrl)
}
