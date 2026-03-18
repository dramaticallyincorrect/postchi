import { useEffect, useState } from "react";
import { useTimeout } from "../hooks/use-timeout";
import { useQuickAction } from "./use-quick-action";
import { useEnvironment } from "@/active-environment/environment-context";
import { useLicense } from "../license/license-context";
import { createQuickAction, Project } from "../data/project/project";
import { executeQuickAction } from "./quick-action-executor";
import { updateEnvironmentVariable } from "../data/project/update-environment-variable";
import { Button } from "@/components/ui/button";
import { Loader2Icon, PlayIcon, PlusIcon } from "lucide-react";
import { NewQuickActionDialog } from "@/components/new-quick-action-dialog";
import { isOsCommandKey } from "../utils/keyboard-event";

export const QuickActionsButton = ({ project }: { project: Project }) => {
    const { action, setAction } = useQuickAction(project.actionsPath, project.path);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [runState, setRunState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

    const { activeEnvironment, envPath } = useEnvironment();
    const { isPro, openLicenseDialog } = useLicense();


    useTimeout(
        () => setRunState('idle'),
        (runState === 'success') ? 3000 : null
    );

    const runAction = async (actionPath: string) => {
        if (runState === 'running') return;

        setRunState('running');
        const variables = activeEnvironment?.variables ?? [];
        const result = await executeQuickAction(actionPath, variables);

        if (result.success) {
            const envName = activeEnvironment?.name ?? '';
            await Promise.all(
                result.mutations.map(({ key, value }) =>
                    updateEnvironmentVariable(envPath, envName, key, value)
                )
            );
        }

        setRunState(result.success ? 'success' : 'failed');
    };

    const handleCreateClick = () => {
        if (!isPro) return openLicenseDialog();
        setDialogOpen(true);
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (action && isOsCommandKey(e) && e.shiftKey && e.key === "Enter") {
                e.preventDefault()
                runAction(action.path)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [action])

    if (!action) {
        return (
            <>
                <Button variant="ghost" size="icon" onClick={handleCreateClick} title="Quick Actions" className="mt-1.5 mr-1 text-muted-foreground">
                    <PlusIcon />
                </Button>
                <NewQuickActionDialog
                    open={dialogOpen}
                    hasActions={false}
                    onClose={() => setDialogOpen(false)}
                    onCreate={(name) => createQuickAction(project.actionsPath, name).then(setAction)}
                />
            </>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="text-foreground mt-1.5 mx-2"
            onClick={() => runAction(action.path)}
            disabled={runState === 'running'}
        >
            {action.name}
            <StatusIcon state={runState} />
        </Button>
    );
};


const StatusIcon = ({ state }: { state: string }) => {
    switch (state) {
        case 'running': return <Loader2Icon className="size-3 animate-spin" />;
        case 'success': return <span className="size-3 rounded-full bg-success inline-block" />;
        case 'failed': return <span className="size-3 rounded-full bg-error inline-block" />;
        default: return <PlayIcon className="size-3" />;
    }
};