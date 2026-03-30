/**
 * In-memory store that matches the @tauri-apps/plugin-store API.
 * Used as a drop-in replacement when running in the browser.
 */

type StoreData = Record<string, unknown>
type UnlistenFn = () => void

class MemoryStore {
  private data: StoreData = {}
  private listeners: Set<(key: string, value: unknown) => void> = new Set()

  async get<T>(key: string): Promise<T | null> {
    return (this.data[key] as T) ?? null
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data[key] = value
    this.listeners.forEach(cb => cb(key, value))
  }

  async delete(key: string): Promise<void> {
    delete this.data[key]
    this.listeners.forEach(cb => cb(key, undefined))
  }

  async has(key: string): Promise<boolean> {
    return key in this.data
  }

  async keys(): Promise<string[]> {
    return Object.keys(this.data)
  }

  async values(): Promise<unknown[]> {
    return Object.values(this.data)
  }

  async entries(): Promise<[string, unknown][]> {
    return Object.entries(this.data)
  }

  async clear(): Promise<void> {
    this.data = {}
  }

  async save(): Promise<void> {
    // no-op in memory — nothing to persist
  }

  async load(): Promise<void> {
    // no-op in memory — nothing to load
  }

  async reset(): Promise<void> {
    await this.clear()
  }

  async length(): Promise<number> {
    return Object.keys(this.data).length
  }

  async onChange<T>(
    cb: (key: string, value: T | undefined) => void
  ): Promise<UnlistenFn> {
    this.listeners.add(cb as (key: string, value: unknown | undefined) => void)
    return () => this.listeners.delete(cb as (key: string, value: unknown | undefined) => void)
  }
}

export { MemoryStore }