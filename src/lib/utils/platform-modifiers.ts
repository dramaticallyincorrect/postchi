import { isMac } from "./os";

export const osShiftKey = isMac() ? "⇧" : "Shift";
export const osCommandKey = isMac() ? "⌘" : "Ctrl";