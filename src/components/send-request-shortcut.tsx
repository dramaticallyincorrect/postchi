import { Kbd, KbdGroup } from "./ui/kbd";

export const SendRequestInstructions = () => (
    <div className="flex flex-row place-self-center items-center h-full text-muted-foreground">
        <span className="mx-8">Send Request</span>
        <KbdGroup>
            <Kbd className="bg-background-panel">⌘</Kbd>
            <Kbd data-icon="inline-end" className="translate-x-0.5 bg-background-panel">
                ⏎
            </Kbd>
        </KbdGroup>
    </div>
)