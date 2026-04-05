import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, PlayIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimeout } from "@/hooks/use-timeout";
import { executeQuickAction } from "@/postchi/action/action-executor";

export const FileExecution = ({ path, className }: { path: string, className?: string }) => {
    const [runState, setRunState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);


    useTimeout(
        () => setRunState('idle'),
        (runState === 'success') ? 3000 : null
    );

    const runAction = async (actionPath: string) => {
        if (runState === 'running') return;

        setRunState('running');
        const result = await executeQuickAction(actionPath);
        setErrorMessage(result.errorMessage);
        setRunState(result.success ? 'success' : 'failed');
    };


    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    className={`text-foreground mx-2 hover:text-primary ${className}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        runAction(path);
                    }}
                    disabled={runState === 'running'}
                >
                    <StatusIcon state={runState} />
                </Button>
            </TooltipTrigger>
            <TooltipContent className={errorMessage ? "" : "hidden"}>
                {errorMessage ? (
                    <div className="max-w-xs whitespace-pre-wrap text-sm text-error">
                        {errorMessage}
                    </div>
                ) : null}
            </TooltipContent>
        </Tooltip>
    );
};


const StatusIcon = ({ state }: { state: string }) => {
    switch (state) {
        case 'running': return <Loader2Icon className="size-3 animate-spin" />;
        case 'success': return <span className="size-3 rounded-full bg-success inline-block" />;
        case 'failed': return <span className="size-3 rounded-full bg-error inline-block" />;
        default: return <PlayIcon className="size-4" />;
    }
};