export const MENU_EVENTS = {
  IMPORT_PROJECT: 'menu:import-project',
} as const;

export type MenuEvent = (typeof MENU_EVENTS)[keyof typeof MENU_EVENTS];

export function emitMenuEvent(event: MenuEvent): void {
  window.dispatchEvent(new CustomEvent(event));
}

export function onMenuEvent(event: MenuEvent, handler: () => void): () => void {
  window.addEventListener(event, handler);
  return () => window.removeEventListener(event, handler);
}