import { useEffect, useState } from 'react'
import { ChevronRightIcon, DiffIcon, FolderIcon, MinusIcon, PlusIcon, RefreshCwIcon, RefreshCwOffIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useTheme } from '@/app/theme/theme-context'
import CodeMirrorMerge from 'react-codemirror-merge'
import { filenameWithoutExtension } from '@/lib/storage/files/file-utils/file-utils'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable'
import { customHttpLanguage } from '@/app/editors/http/codemirror-language/http-language'
import { useEnvironment } from '@/app/active-environment/environment-context'
import { LanguageSupport } from '@codemirror/language'
import { variableValidatorDecoration } from '@/app/editors/http/codemirror-language/decoration/json-variable-decoration'
import { SourceChange, PendingSourceChanges } from '@/postchi/sources/source-checker'
import { Source } from '@/postchi/sources/sources'
import { usePanel } from '../project/panel-context'
import { useSourceCheck } from './source-check-context'
import { applySourceChanges } from '@/postchi/sources/source-applier'
import { Project } from '@/postchi/project/project'

const { Original, Modified } = CodeMirrorMerge


type DiffFolderNode = { kind: 'folder'; name: string; children: DiffTreeNode[] }
type DiffFileNode = { kind: 'file'; name: string; change: SourceChange }
type DiffTreeNode = DiffFolderNode | DiffFileNode

/** Extract the path segments relative to the source folder.
 *  `change.path` may be an absolute filesystem path or a relative path; either way
 *  we strip everything up to and including the source folder name segment. */
function relativeParts(changePath: string, sourceFolderName: string): string[] {
    const parts = changePath.split('/').filter(Boolean)
    const idx = parts.lastIndexOf(sourceFolderName)
    return idx >= 0 ? parts.slice(idx + 1) : parts
}

function buildDiffTree(changes: SourceChange[], sourceFolderName: string): DiffTreeNode[] {
    const root: DiffFolderNode = { kind: 'folder', name: '', children: [] }

    for (const change of changes) {
        const parts = relativeParts(change.path, sourceFolderName)
        let current = root

        for (let i = 0; i < parts.length - 1; i++) {
            const name = parts[i]
            let folder = current.children.find(
                (n): n is DiffFolderNode => n.kind === 'folder' && n.name === name
            )
            if (!folder) {
                folder = { kind: 'folder', name, children: [] }
                current.children.push(folder)
            }
            current = folder
        }

        const filename = parts[parts.length - 1]
        current.children.push({ kind: 'file', name: filename, change })
    }

    return root.children
}


type Selection = { source: Source; change: SourceChange }


export function SourceChangesButton({ project }: { project: Project }) {
    const { result, refresh } = useSourceCheck()
    const { openView } = usePanel()
    const [open, setOpen] = useState(false)

    const totalCount = result?.changes.reduce((sum, s) => sum + s.changes.length, 0) || 0
    if (totalCount === 0 || result == null) return null

    const onApply = async () => {
        if (!result) return
        await applySourceChanges(result.changes, project)
        refresh()
    }

    return (
        <>
            {
                result?.authErrors.length > 0 ? <Button
                    variant="outline"
                    size="sm"
                    className="text-foreground mt-1.5 mx-2"
                    onClick={() => openView({ type: 'SOURCE_TOKENS', params: null })}
                >
                    <RefreshCwOffIcon className="size-3 text-error" />
                    {result.authErrors.length} {'source' + (result.authErrors.length > 1 ? 's' : '')} have auth issues
                </Button> : <Button
                    variant="outline"
                    size="sm"
                    className="text-foreground mt-1.5 mx-2"
                    onClick={() => setOpen(true)}
                >
                    <RefreshCwIcon className="size-3" />
                    {totalCount} {totalCount === 1 ? 'change' : 'changes'}
                </Button>
            }
            <SourceChangesDialog open={open} onClose={() => setOpen(false)} changes={result?.changes || []} onApply={onApply} />
        </>
    )
}


function SourceChangesDialog({ open, onClose, changes, onApply }: {
    open: boolean
    onClose: () => void
    changes: PendingSourceChanges[]
    onApply: () => Promise<void>
}) {
    const [selected, setSelected] = useState<Selection | null>(null)
    const [applying, setApplying] = useState(false)

    useEffect(() => {
        if (open && changes.length > 0 && changes[0].changes.length > 0) {
            setSelected({ source: changes[0].source, change: changes[0].changes[0] })
        }
    }, [open])

    const handleApply = async () => {
        setApplying(true)
        try {
            await onApply()
            onClose()
        } catch {
            toast.error('Failed to apply changes')
        } finally {
            setApplying(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-5xl p-0 gap-0 h-[80vh] flex flex-col">
                <div className="flex-1 min-h-0">
                    <ResizablePanelGroup orientation="horizontal" className="w-full h-full">

                        <ResizablePanel defaultSize="30%" className="bg-background-panel">
                            <ScrollArea className="h-full">
                                <div className="py-2">
                                    {changes.map((pending) => (
                                        <SourceSection
                                            key={pending.source.path}
                                            pending={pending}
                                            selected={selected}
                                            onSelect={setSelected}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </ResizablePanel>

                        <ResizableHandle className="w-px bg-muted" />

                        <ResizablePanel className="bg-background-panel">
                            {selected
                                ? <DiffView change={selected.change} />
                                : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a file to view changes</div>
                            }
                        </ResizablePanel>

                    </ResizablePanelGroup>
                </div>

                <div className="flex items-center justify-end px-4 py-2 border-t border-muted">
                    <Button size="sm" onClick={handleApply} disabled={applying}>
                        {applying
                            ? <><RefreshCwIcon className="size-3 animate-spin mr-1" />Applying...</>
                            : 'Apply All Changes'
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}


function SourceSection({ pending, selected, onSelect }: {
    pending: PendingSourceChanges
    selected: Selection | null
    onSelect: (s: Selection) => void
}) {
    const [open, setOpen] = useState(true)
    const tree = buildDiffTree(pending.changes, pending.source.path)

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    title={pending.source.url}
                    className="group text-muted-foreground data-[state=open]:text-muted-foreground hover:bg-muted w-full justify-start transition-none data-[state=open]:bg-transparent"
                >
                    <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                    <FolderIcon />
                    {pending.source.path}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4.5">
                <DiffTreeNodes
                    nodes={tree}
                    source={pending.source}
                    selected={selected}
                    onSelect={onSelect}
                />
            </CollapsibleContent>
        </Collapsible>
    )
}


function DiffTreeNodes({ nodes, source, selected, onSelect }: {
    nodes: DiffTreeNode[]
    source: Source
    selected: Selection | null
    onSelect: (s: Selection) => void
}) {
    return (
        <>
            {nodes.map((node, i) =>
                node.kind === 'folder'
                    ? <DiffFolderNode key={node.name + i} node={node} source={source} selected={selected} onSelect={onSelect} />
                    : <DiffFileNode key={node.change.path} node={node} source={source} selected={selected} onSelect={onSelect} />
            )}
        </>
    )
}

function DiffFolderNode({ node, source, selected, onSelect }: {
    node: DiffFolderNode
    source: Source
    selected: Selection | null
    onSelect: (s: Selection) => void
}) {
    const [open, setOpen] = useState(true)

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="group text-muted-foreground data-[state=open]:text-muted-foreground hover:bg-muted w-full justify-start transition-none data-[state=open]:bg-transparent"
                >
                    <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                    <FolderIcon />
                    {node.name}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4.5">
                <DiffTreeNodes nodes={node.children} source={source} selected={selected} onSelect={onSelect} />
            </CollapsibleContent>
        </Collapsible>
    )
}

function DiffFileNode({ node, source, selected, onSelect }: {
    node: DiffFileNode
    source: Source
    selected: Selection | null
    onSelect: (s: Selection) => void
}) {
    const isSelected = selected?.source.path === source.path && selected.change.path === node.change.path

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect({ source, change: node.change })}
            className={cn(
                "w-full justify-start gap-2 transition-none",
                isSelected ? "text-foreground bg-muted" : "text-muted-foreground hover:bg-muted"
            )}
        >
            <KindBadge kind={node.change.kind} />
            <span className="flex-1 truncate text-left">{filenameWithoutExtension(node.name)}</span>
        </Button>
    )
}


function KindBadge({ kind }: { kind: SourceChange['kind'] }) {
    if (kind === 'added') return <PlusIcon className='text-success' />
    if (kind === 'removed') return <MinusIcon className='text-error' />
    return <DiffIcon className='text-warning' />
}


function DiffView({ change }: { change: SourceChange }) {
    const { theme } = useTheme()
    const themeExtensions = [theme.codemirror.editorTheme, theme.codemirror.syntaxHighlighting]
    const { activeEnvironment } = useEnvironment()

    const vars = [
        activeEnvironment?.variables || [],
        activeEnvironment?.secrets || []
    ].flat()

    const oldValue = change.oldContent ?? ''
    const newValue = change.newContent ?? ''

    const extensions = [
        new LanguageSupport(customHttpLanguage, variableValidatorDecoration(new Set(vars.map(v => v.key))))
    ];

    return (
        <div className="h-full overflow-auto">
            <CodeMirrorMerge key={change.path} theme={themeExtensions} className="h-full" destroyRerender={true}>
                <Original value={oldValue} readOnly extensions={extensions} />
                <Modified value={newValue} readOnly extensions={extensions} />
            </CodeMirrorMerge>
        </div>
    )
}
