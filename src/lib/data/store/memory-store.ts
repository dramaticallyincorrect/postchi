/**
 * In-memory store that matches the @tauri-apps/plugin-store API.
 * Used as a drop-in replacement when running in the browser.
 */

type StoreData = Record<string, unknown>
type UnlistenFn = () => void

class MemoryStore {
  private data: StoreData = {}
  private listeners: Map<string, Set<(value: unknown) => void>> = new Map()

  async get<T>(key: string): Promise<T | null> {
    return (this.data[key] as T) ?? null
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data[key] = value
    this.listeners.get(key)?.forEach(cb => cb(value))
  }

  async delete(key: string): Promise<void> {
    delete this.data[key]
    this.listeners.get(key)?.forEach(cb => cb(undefined))
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
    key: string,
    cb: (value: T) => void
  ): Promise<UnlistenFn> {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    const handler = (value: unknown) => cb(value as T)
    this.listeners.get(key)!.add(handler)
    return () => this.listeners.get(key)?.delete(handler)
  }
}

export { MemoryStore }