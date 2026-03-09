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

    const declarations = Object.entries(theme.vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n");

    // Injecting on :root means Tailwind's var() references resolve automatically
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
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            borderRadius: '2px',
            padding: '0 2px',
            color: '#006400',
        },
        '.cm-variable-invalid': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            borderRadius: '2px',
            padding: '0 2px',
            color: '#8b0000',
        }
    }, { dark: true });


    return [editorTheme, syntaxHighlighting];
}