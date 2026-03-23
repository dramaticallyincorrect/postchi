import { EditorView, Extension } from "@uiw/react-codemirror";
import { PostchiTheme } from "./theme";
import { getCSSVar } from "./utils";
let styleEl: HTMLStyleElement | null = null;

export function applyThemeToCSSVars(theme: PostchiTheme) {
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "active-theme";
        document.head.appendChild(styleEl);
    }

    let declarations = Object.entries(theme.vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n");

    declarations += '\n --border: var(--muted); \n --input: var(--muted); \n --ring: var(--muted);--popover: var(--background);--popover-foreground: var(--foreground);';

    styleEl.textContent = `:root {\n${declarations}\n}`;
}

export function buildCMTheme(syntaxHighlighting: Extension, color: string): Extension[] {
    const background = color;

    const editorTheme = EditorView.theme({
        '&': {
            background: background,
            color: getCSSVar('--muted'),
            fontSize: '9.8pt'
        },
        "cm-scroller": {
            'border-radius': getCSSVar('--radius-xl'),
        },
        "&.cm-focused": {
            outline: "none",
        },
        '.cm-variable-valid': {
            backgroundColor: getCSSVar('--success'),
            borderRadius: '2px',
            padding: '0 2px',
            color: '#006400',
        },
        '.cm-variable-invalid': {
            backgroundColor: getCSSVar('--error'),
            borderRadius: '2px',
            padding: '0 2px',
            color: '#8b0000',
        }
    }, { dark: true });


    return [editorTheme, syntaxHighlighting];
}