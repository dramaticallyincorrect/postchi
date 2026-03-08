import { useState, useEffect, useCallback, useRef } from 'react'
import { loadStore } from '../data/store/store'

/**
 * Drop-in replacement for useState that persists to Tauri store (or memory in browser).
 *
 * @example
 * const [theme, setTheme] = usePersistentState('settings.json', 'theme', 'light')
 */
export default function usePersistentState<T>(
  key: string,
  defaultValue: T,
  filename: string = 'settings.json',
) {
  const [state, setState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const unlistenRef = useRef<(() => void) | null>(null)

  // Load initial value and subscribe to changes
  useEffect(() => {
    let cancelled = false

    async function init() {
      const store = await loadStore(filename)

      // Load persisted value
      const stored = await store.get<T>(key)
      if (!cancelled && stored !== null && stored !== undefined) {
        setState(stored)
      }
      setIsLoading(false)

      // Watch for external changes (e.g. another window updating the store)
      unlistenRef.current = await store.onChange<T>(key, (value) => {
        if (!cancelled) setState(value)
      })
    }

    init()

    return () => {
      cancelled = true
      unlistenRef.current?.()
    }
  }, [filename, key])

  const setPersistentState = useCallback(
    async (value: T | ((prev: T) => T)) => {
      setState(prev => {
        const newValue =
          typeof value === 'function'
            ? (value as (prev: T) => T)(prev)
            : value

        loadStore(filename).then(store => {
          store.set(key, newValue)
          store.save()
        })

        return newValue
      })
    },
    [filename, key]
  )

  return [state, setPersistentState, isLoading] as const
}