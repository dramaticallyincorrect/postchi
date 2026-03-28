import { isMac } from "./os";

export const osCommandKey = isMac() ? "⌘" : "Ctrl";