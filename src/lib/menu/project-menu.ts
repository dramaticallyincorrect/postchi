import { Menu } from '@tauri-apps/api/menu';
import { isDesktopMac, isTauri } from '../utils/os';
import { emitMenuEvent, MenuActions } from './menu-events';

export async function initMenu(isTemp: boolean = true): Promise<void> {
    if (isDesktopMac()) {
        await setupMacAppMenu(isTemp);
    }
}

export async function setupMacAppMenu(isTemp: boolean): Promise<void> {
    const menu = await buildFileMenu(isTemp);
    await menu.setAsAppMenu();
}

async function buildFileMenu(isTemp: boolean): Promise<Menu> {
    return Menu.new(fileMenuItems(isTemp));
}

export function projectMenuItems(isTemp: boolean) {
    return [
        ...((isTemp && isTauri()) ? [{
            id: 'save_project',
            text: 'Save Project',
            action: async () => emitMenuEvent(MenuActions.SAVE_PROJECT),
        }] : []),
        {
            id: 'import_project',
            text: 'Import',
            action: async () => emitMenuEvent(MenuActions.IMPORT_PROJECT),
        },
        ...(isTauri() ? desktopOnlyMenuItems : []),
    ];
}

const desktopOnlyMenuItems = [
    {
        id: 'new_project',
        text: 'New Project',
        action: async () => emitMenuEvent(MenuActions.NEW_PROJECT),
    },
    {
        id: 'open_project',
        text: 'Open Project',
        action: async () => emitMenuEvent(MenuActions.OPEN_PROJECT),
    },
    { item: "Separator" as const },
    {
        id: 'check_for_updates',
        text: 'Check for Updates…',
        action: async () => emitMenuEvent(MenuActions.CHECK_FOR_UPDATES),
    },
    { item: "Separator" as const },
    {
        id: "quit",
        text: "Quit",
        action: async () => {
            // const {  } = await import("@tauri-apps/api/app");
            // app.exit(0);
        },
    },
]

const helpMenuItems = [
    {
        id: 'check_for_updates',
        text: 'Check for Updates…',
        action: async () => emitMenuEvent(MenuActions.CHECK_FOR_UPDATES),
    },
]

function fileMenuItems(isTemp: boolean) {
    return {
        items: [
            {
                text: 'File',
                items: projectMenuItems(isTemp),
            },
            {
                text: 'Help',
                items: helpMenuItems,
            },
        ],
    }
}