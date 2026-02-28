import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEnvironment } from "./environment-context";


export const ActiveEnvironment = ({ envPath }: { envPath: string }) => {

    const { environments, activeEnvironment, setActiveEnvironment } = useEnvironment()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">{activeEnvironment?.name || "No Environment"}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-max min-w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuGroup>
                    {environments.map((env, index) => (
                        <DropdownMenuItem onClick={() => setActiveEnvironment(env)} key={index} className="flex justify-between gap-4">
                            {env.name}
                            <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}