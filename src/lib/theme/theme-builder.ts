import { EditorView, Extension } from "@uiw/react-codemirror";
import { getCSSVar, isDarkTheme } from "./utils";

let styleEl: HTMLStyleElement | null = null;

export function applyThemeToCSSVars(theme: PostchiTheme) {
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "active-theme";
        document.head.appendChild(styleEl);
    }

    const declarations = Object.entries(theme.vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n");

    // Injecting on :root means Tailwind's var() references resolve automatically
    styleEl.textContent = `:root {\n${declarations}\n}`;
}

export function buildCMTheme(syntaxHighlighting: Extension): Extension[] {
    const background = getCSSVar('--background');
    const bg = getCSSVar('--background-secondary');
    const fg = getCSSVar('--foreground');
    const muted = getCSSVar('--muted-foreground');
    const mutedFg = getCSSVar('--muted-foreground');
    const primary = getCSSVar('--primary');
    const border = getCSSVar('--border');
    const accent = getCSSVar('--accent');

    const editorTheme = EditorView.theme({
        '&': {
            background: bg,
            color: fg,
        },
        "cm-scroller": {
            'border-radius': getCSSVar('--radius-xl'),
        },
        "&.cm-focused": {
            outline: "none",
        },
        ".cm-tooltip-autocomplete": {
            background: bg,
            color: fg,
            "& > ul > li[aria-selected]": {
                backgroundColor: background,
                color: fg,
            }
        },
        '.cm-content': {
            caretColor: primary,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        '.cm-cursor': {
            borderLeftColor: fg,
        },
        '.cm-selectionBackground, ::selection': {
            background: accent + ' !important',
        },
        '.cm-scroller .cm-gutters': {
            background: getCSSVar('--background-secondary'),
            color: getCSSVar('--muted-foreground'),
            borderRight: '1px solid ' + getCSSVar('--border'),
        },
        '.cm-activeLine': {
            background: accent,
        },
        '.cm-activeLineGutter': {
            background: accent,
            color: fg,
        },
        '.cm-foldPlaceholder': {
            background: muted,
            border: `1px solid ${border}`,
            color: mutedFg,
        },
    }, { dark: isDarkTheme() });


    return [editorTheme, syntaxHighlighting];
}