const MENU_ACTION_EVENT = 'menu:action';

export const MenuActions = {
    IMPORT_PROJECT: 'import_project',
    SAVE_PROJECT: 'save_project',
    NEW_PROJECT: 'new_project',
    OPEN_PROJECT: 'open_project',
    CHECK_FOR_UPDATES: 'check_for_updates',
} as const;

export type MenuAction = (typeof MenuActions)[keyof typeof MenuActions];

export function emitMenuEvent(action: MenuAction): void {
    window.dispatchEvent(new CustomEvent(MENU_ACTION_EVENT, { detail: action }));
}

export function onMenuEvent(handler: (action: MenuAction) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent<MenuAction>).detail);
    window.addEventListener(MENU_ACTION_EVENT, listener);
    return () => window.removeEventListener(MENU_ACTION_EVENT, listener);
}
