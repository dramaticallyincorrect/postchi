import { cn } from "@/lib/utils";


export function Row({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn('flex flex-row', className)}>
            {children}
        </div>
    )
}

export function Column({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn('flex flex-col', className)}>
            {children}
        </div>
    )
}

export function Fill({  className = '' }: { className?: string }) {
    return (
        <div className={cn('flex-1', className)}></div>
    )
}