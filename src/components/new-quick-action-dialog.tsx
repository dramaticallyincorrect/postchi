import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'

type Step = 'intro' | 'name'

export const NewQuickActionDialog = ({
    open,
    hasActions,
    onClose,
    onCreate,
}: {
    open: boolean
    hasActions: boolean
    onClose: () => void
    onCreate: (name: string) => void
}) => {
    const [step, setStep] = useState<Step>(hasActions ? 'name' : 'intro')
    const [name, setName] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setStep(hasActions ? 'name' : 'intro')
            setName('')
        }
    }, [open, hasActions])

    const handleClose = () => {
        onClose()
    }

    const handleConfirm = () => {
        const trimmed = name.trim()
        if (!trimmed) return
        onCreate(trimmed)
        onClose()
    }

    if (step === 'intro') {
        return (
            <Dialog open={open} onOpenChange={o => !o && handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quick Actions</DialogTitle>
                        <DialogDescription>
                            Quick Actions are JavaScript scripts you can run directly from the title bar — great for automating tasks like setting tokens, seeding environment variables, or triggering external APIs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={() => setStep('name')}>Create Action</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={o => !o && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Quick Action</DialogTitle>
                    <DialogDescription>Give your action a name.</DialogDescription>
                </DialogHeader>
                <Input
                    ref={inputRef}
                    placeholder="Action name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    autoFocus
                />
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!name.trim()}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
