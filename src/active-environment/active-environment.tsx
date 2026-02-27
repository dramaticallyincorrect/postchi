import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DefaultFileStorage from "@/lib/data/files/file-default";
import parseEnvironments, { Environment } from "@/lib/environments/parser/environments-parser";
import { useEffect, useState } from "react";


export const ActiveEnvironment = ({ envPath }: { envPath: string }) => {

    const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null)
    const [environments, setEnvironments] = useState<Environment[]>([])

    useEffect(() => {
        const fetchEnvironments = async () => {
            const text = await (new DefaultFileStorage().readText(envPath))

            const envs = parseEnvironments(text)
            setEnvironments([...envs])
            setActiveEnvironment(envs[0] || null)
        }

        fetchEnvironments()
    }, [envPath])


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">{activeEnvironment?.name || "No Environment"}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-max min-w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuGroup>
                    {environments.map((env, index) => (
                        <DropdownMenuItem key={index} className="flex justify-between gap-4">
                            {env.name}
                            <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}