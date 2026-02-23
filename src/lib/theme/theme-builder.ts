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

export function buildCMTheme(syntaxHighlighting: Extension, colors: EditorColors ): Extension[] {
    const background = colors.background;

    const editorTheme = EditorView.theme({
        '&': {
            background: background,
            color: getCSSVar('--destructive'),
            fontSize: '10pt'
        },
        "cm-scroller": {
            'border-radius': getCSSVar('--radius-xl'),
        },
        "&.cm-focused": {
            outline: "none",
        },
        ".cm-tooltip-autocomplete": {
            background: colors.tooltip.tooltipBackground,
            color: colors.tooltip.tooltipForeground,
            "& > ul > li[aria-selected]": {
                backgroundColor: colors.tooltip.activeItemBackground,
                color: colors.tooltip.activeItemForeground,
            }
        },
        '.cm-content': {
            caretColor: colors.caret,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        '.cm-cursor': {
            borderLeftColor: colors.caret,
        },
        '.cm-selectionBackground, ::selection': {
            background: colors.selectionBackground + ' !important',
        },
        '.cm-scroller .cm-gutters': {
            background: colors.gutterBackground,
            color: colors.gutterForeground,
            borderRight: colors.gutterBorder,
        },
        '.cm-activeLineGutter': {
            background: colors.gutterBackground,
            color: colors.gutterActiveForeground,
        },
        '.cm-foldPlaceholder': {
            background: colors.gutterForeground,
            border: `1px solid ${colors.gutterBorder}`,
            color: colors.gutterActiveForeground,
        },
    }, { dark: isDarkTheme() });


    return [editorTheme, syntaxHighlighting];
}