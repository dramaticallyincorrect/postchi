import { Menu } from '@tauri-apps/api/menu';
import { isDesktopMac, isTauri } from '../../lib/utils/os';
import { emitMenuEvent, MenuActions } from './menu-events';
import { exit } from '@tauri-apps/plugin-process';

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
        ...(isTauri() ? desktopOnlyMenuItems : sharedMenuItems),
    ];
}

const sharedMenuItems = [
    { item: "Separator" as const },
    {
        id: 'settings',
        text: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        action: async () => emitMenuEvent(MenuActions.SETTINGS),
    },
    {
        id: 'activate_license',
        text: 'Activate License…',
        action: async () => emitMenuEvent(MenuActions.ACTIVATE_LICENSE),
    },
]

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
        id: 'settings',
        text: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        action: async () => emitMenuEvent(MenuActions.SETTINGS),
    },
    {
        id: 'activate_license',
        text: 'Activate License…',
        action: async () => emitMenuEvent(MenuActions.ACTIVATE_LICENSE),
    },
    { item: "Separator" as const },
    {
        id: 'about_postchi',
        text: 'About Postchi',
        action: async () => emitMenuEvent(MenuActions.ABOUT_POSTCHI),
    },
    {
        id: "quit",
        text: "Quit",
        accelerator: 'CmdOrCtrl+Q',
        action: async () => {
            exit(0);
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

const editMenuItems = [
    { item: 'Undo' as const },
    { item: 'Redo' as const },
    { item: 'Separator' as const },
    { item: 'Cut' as const },
    { item: 'Copy' as const },
    { item: 'Paste' as const },
    { item: 'Separator' as const },
    { item: 'SelectAll' as const },
]

function fileMenuItems(isTemp: boolean) {
    return {
        items: [
            {
                text: 'File',
                items: projectMenuItems(isTemp),
            },
            {
                text: 'Edit',
                items: editMenuItems,
            },
            {
                text: 'Help',
                items: helpMenuItems,
            },
        ],
    }
}
