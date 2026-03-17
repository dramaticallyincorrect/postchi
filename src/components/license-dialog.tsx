import { useState } from 'react'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    isValidLicenseFormat,
    validateLicense,
    saveLicense,
    openBuyPage,
} from '@/lib/license/license'

const FREE_FEATURES = [
    'HTTP requests',
    'Environments',
    'Intellisense',
]

const PRO_ONLY_FEATURES = [
    'Request Scripts',
    'Folder Scripts',
    'Folder Configuration',
    'Base Path',
]

type ActivationStatus = 'idle' | 'validating' | 'success' | 'error'

type LicenseDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onActivated: () => void
}

export function LicenseDialog({ open, onOpenChange, onActivated }: LicenseDialogProps) {
    const [key, setKey] = useState('')
    const [status, setStatus] = useState<ActivationStatus>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleActivate = async () => {
        const trimmed = key.trim()
        if (!isValidLicenseFormat(trimmed)) {
            setStatus('error')
            setErrorMessage('Invalid license key format. Keys start with CHI-')
            return
        }

        setStatus('validating')
        setErrorMessage(null)

        try {
            const result = await validateLicense(trimmed)
            if (result.isValid) {
                await saveLicense(trimmed)
                setStatus('success')
                onActivated()
            } else {
                setStatus('error')
                setErrorMessage(result.errorMessage ?? 'License key is not valid.')
            }
        } catch {
            setStatus('error')
            setErrorMessage('Could not reach the server. Check your connection and try again.')
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setKey('')
            setStatus('idle')
            setErrorMessage(null)
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl px-32 py-24" aria-describedby={undefined}>
                <DialogHeader className="text-center items-center pb-2">
                    <DialogTitle className="text-3xl font-bold tracking-tight">Unlock Your Full Potential</DialogTitle>
                    <p className="text-muted-foreground">Get more out of Postchi with a Pro license.</p>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 mt-1">
                    <PlanCard
                        title="Free"
                        features={FREE_FEATURES}
                        missingFeatures={PRO_ONLY_FEATURES}
                        action={
                            <Button variant="outline" className="w-full" onClick={() => handleOpenChange(false)}>
                                Continue with Free
                            </Button>
                        }
                    />
                    <PlanCard
                        title="Pro"
                        highlighted
                        features={[...FREE_FEATURES, ...PRO_ONLY_FEATURES]}
                        action={
                            <Button className="w-full" onClick={openBuyPage}>
                                Buy Pro
                            </Button>
                        }
                    />
                </div>

                <div className="border-t pt-4 mt-1">
                    <p className="text-sm text-muted-foreground mb-2">Already have a license key?</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="CHI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            value={key}
                            onChange={e => { setKey(e.target.value); setStatus('idle'); setErrorMessage(null) }}
                            onKeyDown={e => { if (e.key === 'Enter') handleActivate() }}
                            disabled={status === 'validating' || status === 'success'}
                            className={status === 'error' ? 'border-destructive' : ''}
                        />
                        <Button
                            onClick={handleActivate}
                            disabled={!key.trim() || status === 'validating' || status === 'success'}
                        >
                            {status === 'validating' ? 'Activating…' : status === 'success' ? 'Activated!' : 'Activate'}
                        </Button>
                    </div>
                    {status === 'error' && errorMessage && (
                        <p className="text-sm text-destructive mt-1.5">{errorMessage}</p>
                    )}
                    {status === 'success' && (
                        <p className="text-sm text-green-600 mt-1.5">License activated successfully.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PlanCard({
    title,
    highlighted = false,
    features,
    missingFeatures = [],
    action,
}: {
    title: string
    highlighted?: boolean
    features: string[]
    missingFeatures?: string[]
    action: React.ReactNode
}) {
    return (
        <div className={`rounded-lg border p-4 flex flex-col gap-3 ${highlighted ? 'border-primary bg-primary/5' : ''}`}>
            <div className="font-semibold text-base">{title}</div>
            <ul className="flex-1 space-y-1.5">
                {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                        {f}
                    </li>
                ))}
                {missingFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-3.5 w-3.5 shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>
            {action}
        </div>
    )
}
