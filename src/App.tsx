import { PanelLeftIcon } from 'lucide-react';
import { FileTree } from './components/FileTree';
import { HttpEditor } from './components/HttpEditor';
import { Button } from './components/ui/button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { themes } from './lib/theme/themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { useState } from 'react';
import { applyThemeToCSSVars } from './lib/theme/theme-builder';

export function App() {

    const [theme, setTheme] = useState(() => themes[0]);

    return <div className='flex-col h-screen w-screen flex'>
        <div className="titlebar bg-primary mt-1.5">
            <div data-tauri-drag-region>
                <PanelLeftIcon className='ms-22 me-1 size-4 inline' />
                <Button variant="ghost" className='text-foreground'>Project</Button>
                <span className='text-muted-foreground mx-1 select-none'>•</span>
                <Button variant="ghost">Production</Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost">{theme.name}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {themes.map(theme => {
                            return <DropdownMenuItem onClick={() => {
                                applyThemeToCSSVars(theme)
                                setTheme(theme);
                            }} key={theme.id}>{theme.name}</DropdownMenuItem>
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <ResizableDemo>
            <FileTree />
            <HttpEditor theme={theme} />
        </ResizableDemo>
    </div>
}

export function ResizableDemo(props: { children: React.ReactNode[] }) {
    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="w-full h-full">
            <ResizablePanel defaultSize="17%" className='m-1 rounded-xl bg-sidebar'>
                {props.children[0]}
            </ResizablePanel>

            <ResizableHandle className='bg-transparent' />

            <ResizablePanel className='m-1 rounded-xl bg-background-secondary'>
                {props.children[1]}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}


export default App;