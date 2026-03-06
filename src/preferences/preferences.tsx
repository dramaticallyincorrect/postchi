import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { themes } from "@/lib/theme/themes"
import { useTheme } from "@/theme-context/theme-context"

export const Preferences = () => {
    return <Dialog>
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

    return (
        <Select
            onValueChange={(value) => {
                const found = themes.find(t => t.name === value)
                if (found) setTheme(found)
            }}
        >
            <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder={theme.name} />
            </SelectTrigger>
            <SelectContent
                className="bg-background-panel"
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        // Radix focuses the next item after this event
                        setTimeout(() => {
                            const focused = document.querySelector('[data-slot="select-item"]:focus')
                            const value = focused?.textContent?.trim()
                            const found = themes.find(t => t.name === value)
                            if (found) setTheme(found)
                        }, 10)
                    }
                }}
            >
                <SelectGroup>
                    <SelectLabel>{theme.name}</SelectLabel>
                    {themes.map((t, i) => (
                        <SelectItem key={i} value={t.name}>{t.name}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}