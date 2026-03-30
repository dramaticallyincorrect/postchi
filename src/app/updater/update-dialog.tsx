import { Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'

type Phase = 'available' | 'downloading' | 'done'

type UpdateDialogProps = {
    update: Update | null
    onClose: () => void
}

export function UpdateDialog({ update, onClose }: UpdateDialogProps) {
    const [phase, setPhase] = useState<Phase>('available')
    const [downloaded, setDownloaded] = useState(0)
    const [total, setTotal] = useState<number | undefined>(undefined)

    const handleInstall = async () => {
        if (!update) return
        setPhase('downloading')
        await update.downloadAndInstall((event) => {
            if (event.event === 'Started') {
                setTotal(event.data.contentLength ?? undefined)
            } else if (event.event === 'Progress') {
                setDownloaded(d => d + event.data.chunkLength)
            }
        })
        setPhase('done')
    }

    const handleRelaunch = async () => {
        await relaunch()
    }

    const progressPercent = total && total > 0
        ? Math.round((downloaded / total) * 100)
        : null

    return (
        <Dialog open={update !== null} onOpenChange={(open) => { if (!open && phase !== 'downloading') onClose() }}>
            <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>
                        {phase === 'done' ? 'Update Ready' : 'Update Available'}
                    </DialogTitle>
                </DialogHeader>

                <div className="text-sm text-muted-foreground">
                    {phase === 'available' && (
                        <p>Version <span className="font-medium text-foreground">{update?.version}</span> is available.</p>
                    )}
                    {phase === 'downloading' && (
                        <p>
                            {progressPercent !== null
                                ? `Downloading… ${progressPercent}%`
                                : 'Downloading…'}
                        </p>
                    )}
                    {phase === 'done' && (
                        <p>Update installed. Restart to apply the update.</p>
                    )}
                </div>

                <DialogFooter>
                    {phase === 'available' && (
                        <>
                            <Button variant="outline" onClick={onClose}>Later</Button>
                            <Button onClick={handleInstall}>Update Now</Button>
                        </>
                    )}
                    {phase === 'downloading' && (
                        <Button disabled>Downloading…</Button>
                    )}
                    {phase === 'done' && (
                        <>
                            <Button variant="outline" onClick={onClose}>Later</Button>
                            <Button onClick={handleRelaunch}>Restart Now</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
