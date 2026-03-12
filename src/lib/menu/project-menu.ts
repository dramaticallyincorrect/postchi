import { Menu } from '@tauri-apps/api/menu';
import { isDesktopMac } from '../utils/os';
import { emitMenuEvent, MENU_EVENTS } from './menu-events';

export async function initMenu(): Promise<void> {
    if (isDesktopMac()) {
        await setupMacAppMenu();
    }
}

export async function setupMacAppMenu(): Promise<void> {
    const menu = await buildFileMenu();
    await menu.setAsAppMenu();
}

async function buildFileMenu(): Promise<Menu> {
    return Menu.new(fileMenuItems);
}

export const projectMenuItems = [
    {
        id: 'import_project',
        text: 'Import',
        action: async () => emitMenuEvent(MENU_EVENTS.IMPORT_PROJECT),
    },
    { item: "Separator" },
    {
        id: "quit",
        text: "Quit",
        action: async () => {
            // const {  } = await import("@tauri-apps/api/app");
            // app.exit(0);
        },
    },
] as const;

const fileMenuItems = {
    items: [
        {
            text: 'File',
            items: projectMenuItems,
        },
    ],
}