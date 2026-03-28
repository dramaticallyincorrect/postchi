import { Kbd, KbdGroup } from "./ui/kbd";

export const SendRequestInstructions = () => (
    <div className="flex flex-row items-center h-full text-muted-foreground justify-center">
        <span className="mx-8">Send Request</span>
        <KbdGroup>
            <Kbd className="bg-background-panel">⌘</Kbd>
            <Kbd data-icon="inline-end" className="-translate-x-1 bg-background-panel">
                ⏎
            </Kbd>
        </KbdGroup>
    </div>
)