import { useAsync } from "@/hooks/use-async"
import { deleteSource, readSources, Source, sourcesFilePath } from "@/postchi/sources/sources"
import { getSourceToken, setSourceToken, deleteSourceToken } from "@/lib/storage/store/credential-store"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRoundIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useFileWatch } from "@/hooks/file-watch"
import { Fill, Row } from "@/components/layout"
import { checkSources, SourceSyncError } from "@/postchi/sources/source-checker"
import { applySourceChanges } from "@/postchi/sources/source-applier"
import { SourceChangesDialog } from "./source-changes-dialog"
import { getActiveProject } from "@/lib/project-state"
import { useTimeout } from "@/hooks/use-timeout"
import { cn } from "@/lib/utils"

export const SourceTokensManagement = ({ projectPath }: { projectPath: string }) => {
    const { data: config, loading, execute } = useAsync(() => readSources(projectPath))

    useFileWatch(sourcesFilePath(projectPath), () => {
        execute()
    }, {
        ignoreModified: false,
    })

    useEffect(() => {
        execute()
    }, [projectPath])


    const [sourcesWithAuthErrors, setSourcesWithAuthErrors] = useState<SourceSyncError[]>([])


    if (loading) return null



    return (
        <div className="flex flex-col gap-2 p-4 mx-auto w-full max-w-3xl ">
            <Row className="pe-12">
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Sources</h2>
                <Fill />
                <FetchChanges onAuthErrors={setSourcesWithAuthErrors} />
            </Row>
            {config?.sources.map(source => (
                <SourceItem
                    key={source.url}
                    source={source}
                    fetchError={sourcesWithAuthErrors.find((e) => e.source.url == source.url)?.error}
                    onDeleted={() => execute()}
                />
            ))}
        </div>
    )
}

function FetchChanges({ onAuthErrors }: { onAuthErrors: (sources: SourceSyncError[]) => void }) {

    const { data: changes, loading: changesLoading, execute: executeChanges, reset: resetChanges } = useAsync(checkSources)

    useEffect(() => {
        executeChanges()
    }, [])

    useEffect(() => {
        onAuthErrors(changes?.authErrors ?? [])
    }, [changes])

    const [open, setOpen] = useState(false)

    useTimeout(() => {
        if (changes && changes.changes.length == 0 && changes.authErrors.length == 0) {
            changes.authErrors
            resetChanges()
        }
    }, changes ? 1000 : null)


    if (!changes || changes.changes.length == 0) return (
        <Button className="min-w-32" onClick={() => {
            if (changesLoading) return
            executeChanges()
        }} >
            {
                changesLoading ? <Loader2Icon className="animate-spin" /> : 'Fetch Changes'
            }
        </Button>
    )

    const totalCount = changes.changes.reduce((sum, c) => sum + c.changes.length, 0)


    if (changes.changes.length > 0) {

        return <>
            <Button
                className="min-w-32"
                onClick={() => setOpen(true)}
            >
                <RefreshCwIcon className="size-3" />
                {
                    totalCount == 0 ? 'No changes' : `${totalCount} ${totalCount === 1 ? 'change' : 'changes'}`
                }
            </Button>
            <SourceChangesDialog open={open} onClose={() => setOpen(false)} changes={changes.changes || []} onApply={() => applySourceChanges(changes.changes || [], getActiveProject()!)} />
        </>
    }
}

function SourceItem({ source, fetchError, onDeleted }: {
    source: Source
    fetchError: string | undefined,
    onDeleted: () => void
}) {
    const [editing, setEditing] = useState(false)
    const [token, setToken] = useState('')
    const [saving, setSaving] = useState(false)

    const { data: currentToken, execute: loadToken } = useAsync(() => getSourceToken(source.url))

    useEffect(() => {
        if (source.authType) {
            loadToken()
        }
    }, [source.url])

    const handleSave = async () => {
        if (!token.trim()) return
        setSaving(true)
        try {
            await setSourceToken(source.url, token.trim())
            await loadToken()
            setEditing(false)
            setToken('')
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
        <div className="flex flex-row items-stretch">
            <Card className={cn("flex flex-1 min-w-0 flex-col gap-2 p-3 bg-background-panel", fetchError ? 'border border-error' : '')}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate ">{source.path}</span>
                        <span className="text-xs text-foreground/40 truncate">{source.url}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <KeyRoundIcon className="size-3" />
                    {currentToken ? (
                        <span className="font-mono tracking-widest">{'•'.repeat(12)}</span>
                    ) : (
                        <span className={source.authType ? 'text-destructive' : ''}>{source.authType ? 'No token set' : 'Auth not required'}</span>
                    )}
                    <div className="flex flex-1 items-center gap-1">
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
                            hidden={!source.authType}
                            onClick={handleDelete}
                            title="Remove token"
                        >
                            <Trash2Icon className="size-3.5" />
                        </Button>
                        <Fill />
                        <span className="text-error first-letter:uppercase">
                            {fetchError}
                        </span>
                    </div>
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
            </Card>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size='icon' title="Delete Source" className="mx-2 place-self-center">
                        <Trash2Icon />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will disconnect the source and delete all of its data including requests.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => {
                            deleteSource(source.path)
                        }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}