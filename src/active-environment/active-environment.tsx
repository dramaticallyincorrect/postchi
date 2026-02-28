import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEnvironment } from "./environment-context";
import { useEffect } from "react";
import { isOsCommandKey } from "@/lib/utils/keyboard-event";


export const ActiveEnvironment = () => {

    const { environments, activeEnvironment, setActiveEnvironment } = useEnvironment()

    useEffect(() => {
        const handler = async (e: KeyboardEvent) => {
            const index = parseInt(e.key) - 1
            if (index >= 1 && index < environments.length && isOsCommandKey(e)) {
                e.preventDefault();
                setActiveEnvironment(environments[index])
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [environments]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">{activeEnvironment?.name || "No Environment"}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-max min-w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuGroup>
                    {environments.map((env, index) => (
                        <DropdownMenuItem onClick={() => setActiveEnvironment(env)} key={index} className="justify-between gap-4 items-end">
                            {env.name}
                            <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}