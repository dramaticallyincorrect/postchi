import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { themes } from "@/lib/theme/themes"
import { useTheme } from "@/theme-context/theme-context"

export const Preferences = () => {
    return <Dialog defaultOpen={true}>
        <DialogTrigger asChild>
            <Button variant="outline">Preferences</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="bg-background-panel">
            <DialogHeader>
                <ThemeSelector />
            </DialogHeader>
        </DialogContent>
    </Dialog>
}

const ThemeSelector = () => {
    const { theme, setTheme } = useTheme()

    const darkThemes = themes.filter(t => t.type === 'dark')
    const lightThemes = themes.filter(t => t.type === 'light')

    const findAndApply = (id: string) => {
        const found = themes.find(t => t.id === id)
        if (found) setTheme(found)
    }

    return (
        <Select
            value={theme.id}
            onValueChange={findAndApply}
        >
            <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder={theme.name} />
            </SelectTrigger>
            <SelectContent
                className="bg-background-panel"
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
    )
}
