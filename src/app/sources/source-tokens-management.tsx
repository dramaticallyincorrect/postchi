import { useAsync } from "@/hooks/use-async"
import { readSources, Source } from "@/postchi/sources/sources"
import { getSourceToken, setSourceToken, deleteSourceToken } from "@/lib/storage/store/credential-store"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRoundIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

export const SourceTokensManagement = ({ projectPath }: { projectPath: string }) => {
    const { data: config, loading, execute } = useAsync(() => readSources(projectPath), [projectPath + '-sources-config'])

    useEffect(() => {
        execute()
    }, [projectPath])

    if (loading) return null

    const sourcesWithAuth = config?.sources.filter(s => s.authType) ?? []

    if (sourcesWithAuth.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <KeyRoundIcon className="size-8 opacity-40" />
                <p className="text-sm">No sources with authentication configured</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 p-4 max-w-2xl mx-auto w-full">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Source Tokens</h2>
            {sourcesWithAuth.map(source => (
                <SourceTokenRow
                    key={source.url}
                    source={source}
                    onDeleted={() => execute()}
                />
            ))}
        </div>
    )
}

export function SourceTokenRow({ source, onDeleted }: {
    source: Source
    onDeleted: () => void
}) {
    const [editing, setEditing] = useState(false)
    const [token, setToken] = useState('')
    const [saving, setSaving] = useState(false)

    const { data: currentToken, execute: loadToken } = useAsync(() => getSourceToken(source.url), [])

    useEffect(() => {
        loadToken()
    }, [source.url])

    const handleSave = async () => {
        if (!token.trim()) return
        setSaving(true)
        try {
            await setSourceToken(source.url, token.trim())
            await loadToken()
            setEditing(false)
            setToken('')
            toast.success('Token updated')
        } catch {
            toast.error('Failed to save token')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteSourceToken(source.url)
            onDeleted()
        } catch {
            toast.error('Failed to remove token')
        }
    }

    const handleCancel = () => {
        setEditing(false)
        setToken('')
    }

    return (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3 bg-background-panel">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{source.path}</span>
                    <span className="text-xs text-muted-foreground truncate">{source.url}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setEditing(true)}
                        title="Change token"
                    >
                        <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        title="Remove token"
                    >
                        <Trash2Icon className="size-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <KeyRoundIcon className="size-3" />
                {currentToken ? (
                    <span className="font-mono tracking-widest">{'•'.repeat(12)}</span>
                ) : (
                    <span className="text-destructive">No token set</span>
                )}
            </div>

            {editing && (
                <div className="flex items-center gap-2 mt-1">
                    <Input
                        className="h-7 text-xs font-mono"
                        placeholder="Enter token"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSave()
                            if (e.key === 'Escape') handleCancel()
                        }}
                        autoFocus
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
                        onClick={handleSave}
                        disabled={saving || !token.trim()}
                    >
                        <CheckIcon className="size-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
                        onClick={handleCancel}
                    >
                        <XIcon className="size-3.5" />
                    </Button>
                </div>
            )}
        </div>
    )
}