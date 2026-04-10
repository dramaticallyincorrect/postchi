import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, PlayIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimeout } from "@/hooks/use-timeout";
import { executeQuickAction, QuickActionResult } from "@/postchi/action/action-executor";
import { getActiveProject } from "@/lib/project-state";
import executeHttpTemplate from "@/postchi/http/runner/http-runner";
import DefaultFileStorage from "@/lib/storage/files/file-default";
import { isOsCommandKey } from "@/lib/utils/keyboard-event";
import { osCommandKey, osShiftKey } from "@/lib/utils/platform-modifiers";
import { cn } from "@/lib/utils";

async function runPath(path: string): Promise<QuickActionResult> {
    if (path.startsWith(getActiveProject()!.actionsPath)) {
        return await executeQuickAction(path);
    }

    const result = await DefaultFileStorage.getInstance().readText(path).then(content => executeHttpTemplate(content, path, new AbortController()));

    if (result.isOk) {
        return { success: true };
    } else {
        return { success: false, errorMessage: result.error.message };
    }
}

export const FileExecution = ({ path, className, shortcutEnabled }: { path: string, className?: string, shortcutEnabled: boolean }) => {
    const [runState, setRunState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);


    useTimeout(
        () => setRunState('idle'),
        (runState === 'success') ? 3000 : null
    );

    const runAction = async (actionPath: string) => {
        if (runState === 'running') return;

        setRunState('running');
        const result = await runPath(actionPath);
        setErrorMessage(result.errorMessage);
        setRunState(result.success ? 'success' : 'failed');
    };

    useEffect(() => {
        if (shortcutEnabled) {
            const handler = (e: KeyboardEvent) => {
                if (isOsCommandKey(e) && e.shiftKey && e.key === 'Enter') {
                    e.preventDefault()
                    runAction(path);
                }
            }
            window.addEventListener('keydown', handler)
            return () => window.removeEventListener('keydown', handler)
        }
    }, [path, shortcutEnabled])


    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    className={cn('text-foreground mx-2 hover:text-primary invisible group-hover:visible', runState != 'idle' ? 'visible' : '', className)}
                    onClick={(e) => {
                        e.stopPropagation();
                        runAction(path);
                    }}
                    disabled={runState === 'running'}
                >
                    <StatusIcon state={runState} />
                </Button>
            </TooltipTrigger>
            <TooltipContent className={shortcutEnabled || errorMessage ? "" : "hidden"}>
                {errorMessage ? (
                    <div className="max-w-xs whitespace-pre-wrap text-sm text-error">
                        {errorMessage}
                    </div>
                ) : null}

                {errorMessage && shortcutEnabled ? (
                    null
                ) : <div className="max-w-xs whitespace-pre-wrap text-sm">
                    {osShiftKey}{osCommandKey}⏎
                </div>}
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