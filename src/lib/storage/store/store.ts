import { isTauri } from '@tauri-apps/api/core'
import { load as tauriLoad } from '@tauri-apps/plugin-store'
import { MemoryStore } from './memory-store'

type UnlistenFn = () => void

/**
 * Unified store interface matching @tauri-apps/plugin-store.
 * Uses Tauri's persistent store when in Tauri, falls back to in-memory store in browser.
 */
export interface IStore {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
  values(): Promise<unknown[]>
  entries(): Promise<[string, unknown][]>
  clear(): Promise<void>
  save(): Promise<void>
  reset(): Promise<void>
  length(): Promise<number>
  onChange<T>(cb: (key: string, value: T | undefined) => void): Promise<UnlistenFn>
}

// Cache store instances by filename
const storeCache = new Map<string, IStore>()

/**
 * Load a store by filename.
 * In Tauri: uses plugin-store (persisted to disk).
 * In browser: uses in-memory store.
 *
 * @example
 * const store = await loadStore('settings.json')
 * await store.set('theme', 'dark')
 * const theme = await store.get<string>('theme')
 */
export async function loadStore(filename: string): Promise<IStore> {
  if (storeCache.has(filename)) {
    return storeCache.get(filename)!
  }

  let store: IStore

  if (isTauri()) {
    // Use Tauri's persistent store
    store = await tauriLoad(filename) as unknown as IStore
  } else {
    // Use in-memory store for browser/dev
    store = new MemoryStore()
  }

  storeCache.set(filename, store)
  return store
}

/**
 * Clear the store cache (useful for testing).
 */
export function clearStoreCache(): void {
  storeCache.clear()
}