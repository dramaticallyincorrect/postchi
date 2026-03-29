import { useState, useEffect } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/theme-context/theme-context'
import { themes } from '@/lib/theme/themes'
import { LicenseContext, useLicense } from '@/lib/license/license-context'
import { emitMenuEvent, MenuActions } from '@/lib/menu/menu-events'
import { getInitialLicenseStatus, validateLicenseStatus } from '@/lib/license/license'
import { CheckIcon } from 'lucide-react'
import MsWindowControls from '@/components/window-controls'
import { isMac } from '@/lib/utils/os'

type Section = 'appearance' | 'license'

function SettingsWindowShell() {
    const [section, setSection] = useState<Section>('appearance')

    return (
        <div className="flex flex-col h-screen">

            <div className="flex flex-1 overflow-hidden">
                <nav className="w-44 shrink-0 border-r bg-background-panel flex flex-col">
                    <div data-tauri-drag-region className="h-10 shrink-0">
                    </div>
                    <div className='p-3 flex flex-col gap-1.5'>
                        <NavItem active={section === 'appearance'} onClick={() => setSection('appearance')}>
                            Appearance
                        </NavItem>
                        <NavItem active={section === 'license'} onClick={() => setSection('license')}>
                            License
                        </NavItem>
                    </div>

                </nav>
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    <div data-tauri-drag-region className="h-10 shrink-0 justify-end flex items-center">
                        {!isMac() && <MsWindowControls />}
                    </div>
                    <div className='px-12 py-4'>
                        {section === 'appearance' && <AppearanceSection />}
                        {section === 'license' && <LicenseSection />}
                    </div>
                </div>
            </div>
        </div>
    )
}

function NavItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <Button onClick={onClick} variant={active ? 'default' : 'outline'}>
            {children}
        </Button>
    )
}

function AppearanceSection() {
    const { theme, setTheme, inverted, setInverted, gapless, setGapless } = useTheme()

    const darkThemes = themes.filter(t => t.type === 'dark')
    const lightThemes = themes.filter(t => t.type === 'light')

    const findAndApply = (id: string) => {
        const found = themes.find(t => t.id === id)
        if (found) setTheme(found)
    }

    return (
        <div className="space-y-6">
            <SettingsRow label="Theme">
                <Select value={theme.id} onValueChange={findAndApply}>
                    <SelectTrigger className="w-52">
                        <SelectValue placeholder={theme.name} />
                    </SelectTrigger>
                    <SelectContent
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                setTimeout(() => {
                                    const focused = document.querySelector('[data-slot="select-item"]:focus')
                                    const id = focused?.getAttribute('data-value')
                                    if (id) findAndApply(id)
                                }, 10)
                            }
                        }}
                    >
                        <SelectGroup>
                            <SelectLabel>Dark</SelectLabel>
                            {darkThemes.map(t => (
                                <SelectItem key={t.id} value={t.id} data-value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>Light</SelectLabel>
                            {lightThemes.map(t => (
                                <SelectItem key={t.id} value={t.id} data-value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </SettingsRow>

            <SettingsRow label="Inverted" description="Swap background and panel colors">
                <Switch checked={inverted} onCheckedChange={setInverted} />
            </SettingsRow>

            <SettingsRow label="Gapless" description="Remove spacing and rounded corners between panels">
                <Switch checked={gapless} onCheckedChange={setGapless} />
            </SettingsRow>
        </div>
    )
}

function LicenseSection() {
    const { isPro } = useLicense()

    const handleActivate = () => {
        emitMenuEvent(MenuActions.ACTIVATE_LICENSE)
    }

    return (
        <div className="space-y-6">
            <SettingsRow label="Status" description="Your current license plan">
                {isPro
                    ? <Badge variant="default" className="bg-primary text-primary-foreground gap-1.5"><CheckIcon className="h-3 w-3" />Pro</Badge>
                    : <Badge variant="outline">Free</Badge>
                }
            </SettingsRow>

            {isPro ? (
                <div className="text-sm text-muted-foreground">
                    You have access to all Pro features.
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Upgrade to Pro to unlock request scripts, folder scripts, folder configuration, and base path support.
                    </p>
                    <Button size="sm" onClick={handleActivate}>
                        Activate License
                    </Button>
                </div>
            )}
        </div>
    )
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-8">
            <div className="min-w-0">
                <div className="text-sm font-medium">{label}</div>
                {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    )
}

function LicenseProvider({ children }: { children: React.ReactNode }) {
    const [isPro, setIsPro] = useState(false)

    useEffect(() => {
        getInitialLicenseStatus().then(status => setIsPro(status === 'pro')).catch(() => { })
        validateLicenseStatus().then(status => setIsPro(status === 'pro')).catch(() => { })
    }, [])

    const refreshLicense = async () => {
        const status = await validateLicenseStatus()
        setIsPro(status === 'pro')
    }

    return (
        <LicenseContext.Provider value={{ isPro, refreshLicense }}>
            {children}
        </LicenseContext.Provider>
    )
}

export function SettingsWindow() {
    return (
        <LicenseProvider>
            <SettingsWindowShell />
        </LicenseProvider>
    )
}
