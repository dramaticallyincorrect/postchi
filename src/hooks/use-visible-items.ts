import { useEffect, useRef, useState } from "react"

const BATCH_SIZE = 25

export function useVisibleItems<T>(items: T[], root?: Element | null) {
    const [count, setCount] = useState(BATCH_SIZE)
    const sentinelRef = useRef<HTMLDivElement>(null)

    useEffect(() => setCount(BATCH_SIZE), [items])

    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        if (root === null) return
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setCount(c => Math.min(c + BATCH_SIZE, items.length))
        }, { root: root ?? null, rootMargin: '100px' })
        observer.observe(el)
        return () => observer.disconnect()
    }, [items, root])

    return { visible: items.slice(0, count), sentinelRef, hasMore: count < items.length }
}
