import { EditorView, Extension } from "@uiw/react-codemirror";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { CoreVarColors, EditorColors, EditorColorsInput, MonacoTheme, PostchiTheme, ResolvedVarColors, SyntaxTokens, VarColors } from "./theme";

let styleEl: HTMLStyleElement | null = null;

export type ThemeDisplayOptions = {
    inverted: boolean;
    gapless: boolean;
};

// Recompute a theme with display options applied (inverted swaps bg/panel)
export function deriveTheme(base: PostchiTheme, options: ThemeDisplayOptions): PostchiTheme {
    if (!options.inverted) return base;

    const vars: VarColors = {
        ...base._source.vars,
        '--background': base._source.vars['--background-panel'],
        '--background-panel': base._source.vars['--background'],
    };
    const resolved = resolveThemeVars(vars);
    const editorColors = resolveEditorColors(base._source.editor, vars);
    return {
        ...base,
        vars: resolved,
        codemirror: {
            editorTheme: buildEditorTheme(editorColors, base.type === 'dark'),
            syntaxHighlighting: buildSyntaxHighlighting(base._source.tokens),
            tokens: base._source.tokens,
            colors: editorColors,
        },
        monaco: buildMonacoTheme(base.id, base.type === 'dark', editorColors, base._source.tokens),
    };
}

export function applyThemeToCSSVars(theme: PostchiTheme, options: ThemeDisplayOptions) {
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "active-theme";
        document.head.appendChild(styleEl);
    }

    const declarations = Object.entries(theme.vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n");

    styleEl.textContent = `:root {\n${declarations}\n}`;

    document.documentElement.classList.toggle('dark', theme.type === 'dark');
    document.documentElement.toggleAttribute('data-gapless', options.gapless);
}

export function resolveThemeVars(vars: VarColors): ResolvedVarColors {
    return {
        '--primary': vars['--primary'],
        '--primary-foreground': vars['--primary-foreground'],
        '--background': vars['--background'],
        '--background-elevated': vars['--background-elevated'],
        '--background-panel': vars['--background-panel'],
        '--foreground': vars['--foreground'],
        '--muted': vars['--muted'],
        '--muted-foreground': vars['--muted-foreground'],
        '--destructive': vars['--destructive'],
        '--success': vars['--success'],
        '--error': vars['--error'],
        '--warning': vars['--warning'],
        '--card': vars['--card'] ?? vars['--background-panel'],
        '--card-foreground': vars['--card-foreground'] ?? vars['--foreground'],
        '--popover': vars['--popover'] ?? vars['--background'],
        '--popover-foreground': vars['--popover-foreground'] ?? vars['--foreground'],
        '--secondary': vars['--secondary'] ?? vars['--muted'],
        '--secondary-foreground': vars['--secondary-foreground'] ?? vars['--foreground'],
        '--text-soft-muted': vars['--text-soft-muted'] ?? vars['--muted-foreground'],
        '--accent': vars['--accent'] ?? vars['--muted'],
        '--accent-foreground': vars['--accent-foreground'] ?? vars['--foreground'],
        '--border': vars['--border'] ?? vars['--muted'],
        '--input': vars['--input'] ?? vars['--muted'],
        '--ring': vars['--ring'] ?? vars['--muted'],
        '--chart-1': vars['--chart-1'] ?? vars['--primary'],
        '--chart-2': vars['--chart-2'] ?? vars['--muted-foreground'],
        '--chart-3': vars['--chart-3'] ?? vars['--foreground'],
        '--chart-4': vars['--chart-4'] ?? vars['--muted'],
        '--chart-5': vars['--chart-5'] ?? vars['--destructive'],
        '--sidebar': vars['--sidebar'] ?? vars['--background-panel'],
        '--sidebar-foreground': vars['--sidebar-foreground'] ?? vars['--foreground'],
        '--sidebar-primary': vars['--sidebar-primary'] ?? vars['--primary'],
        '--sidebar-primary-foreground': vars['--sidebar-primary-foreground'] ?? vars['--primary-foreground'],
        '--sidebar-accent': vars['--sidebar-accent'] ?? vars['--muted'],
        '--sidebar-accent-foreground': vars['--sidebar-accent-foreground'] ?? vars['--foreground'],
        '--sidebar-border': vars['--sidebar-border'] ?? vars['--muted'],
        '--sidebar-ring': vars['--sidebar-ring'] ?? vars['--muted'],
    };
}

export function resolveEditorColors(input: EditorColorsInput | undefined, vars: CoreVarColors): EditorColors {
    return {
        background: input?.background ?? vars['--background-panel'],
        foreground: input?.foreground ?? vars['--muted-foreground'],
        gutterBackground: input?.gutterBackground ?? vars['--background-panel'],
        cursor: input?.cursor ?? vars['--foreground'],
        tooltipBackground: input?.tooltipBackground ?? vars['--background-panel'],
        tooltipForeground: input?.tooltipForeground ?? vars['--foreground'],
        tooltipBorder: input?.tooltipBorder ?? vars['--muted'],
        selection: input?.selection ?? vars['--muted'],
        variableValidBackground: input?.variableValidBackground ?? '#006400',
        variableValidForeground: input?.variableValidForeground ?? '#FFFFFF',
        variableInvalidBackground: input?.variableInvalidBackground ?? vars['--error'],
        variableInvalidForeground: input?.variableInvalidForeground ?? '#FFFFFF',
        lintError: input?.lintError ?? vars['--destructive'],
        lintWarning: input?.lintWarning ?? vars['--warning'],
        lintInfo: input?.lintInfo ?? vars['--muted-foreground'],
    };
}

export function buildEditorTheme(colors: EditorColors, dark: boolean): Extension {
    return EditorView.theme({
        '&': {
            background: colors.background,
            color: colors.foreground,
            fontSize: '9.8pt'
        },
        '.cm-scroller': {
            borderRadius: 'var(--radius-xl)',
        },
        '&.cm-focused': {
            outline: 'none',
        },
        '.cm-cursor': {
            borderLeftColor: `${colors.cursor} !important`,
        },
        '.cm-activeLine': {
            background: 'transparent !important',
        },
        '.cm-activeLineGutter': {
            background: 'transparent !important',
        },
        '.cm-gutters': {
            background: `${colors.gutterBackground} !important`,
            borderRight: 'none !important',
        },
        '.cm-tooltip': {
            backgroundColor: `${colors.tooltipBackground} !important`,
            border: `1px solid ${colors.tooltipBorder} !important`,
            borderRadius: '4px !important',
            padding: '4px 8px !important',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5) !important',
            color: `${colors.tooltipForeground} !important`,
        },
        '.cm-tooltip-autocomplete > ul > li': {
            padding: '4px 8px !important',
            lineHeight: '1.3 !important',
        },
        '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
            backgroundColor: `${colors.selection} !important`,
            color: `${colors.tooltipForeground} !important`,
            borderRadius: '3px !important',
        },
        '.cm-tooltip-autocomplete > ul > li > span.cm-completionIcon': {
            color: `${colors.foreground} !important`,
            paddingRight: '8px !important',
        },
        '.cm-tooltip-autocomplete > ul > li > span.cm-completionDetail': {
            color: `${colors.foreground} !important`,
            fontStyle: 'italic !important',
        },
        '.cm-tooltip .cm-tooltip-arrow:before': {
            borderTopColor: 'transparent !important',
            borderBottomColor: 'transparent !important',
        },
        '.cm-tooltip .cm-tooltip-arrow:after': {
            borderTopColor: `${colors.tooltipBackground} !important`,
            borderBottomColor: `${colors.tooltipBackground} !important`,
        },
        '.cm-diagnostic-error': {
            borderLeft: `3px solid ${colors.lintError} !important`,
        },
        '.cm-diagnostic-warning': {
            borderLeft: `3px solid ${colors.lintWarning} !important`,
        },
        '.cm-diagnostic-info': {
            borderLeft: `3px solid ${colors.lintInfo} !important`,
        },
        '.cm-lintPoint-error': {
            borderBottom: `2px wavy ${colors.lintError} !important`,
        },
        '.cm-lintPoint-warning': {
            borderBottom: `2px wavy ${colors.lintWarning} !important`,
        },
        '.cm-tooltip-lint': {
            background: `${colors.tooltipBackground} !important`,
            color: `${colors.tooltipForeground} !important`,
            borderRadius: 'var(--radius-md) !important',
            fontSize: 'var(--font-size-xs) !important',
        },
        '.cm-panel.cm-panel-lint': {
            background: `${colors.background} !important`,
        },
        '.cm-panel.cm-panel-lint ul [aria-selected]': {
            backgroundColor: `${colors.selection} !important`,
            color: `${colors.tooltipForeground} !important`,
            borderRadius: '3px !important',
        },
        '.cm-variable-valid': {
            backgroundColor: `${colors.variableValidBackground} !important`,
            borderRadius: '2px',
            color: `${colors.variableValidForeground} !important`,
        },
        // Handle case where variable is wrapped in a span (e.g. due to syntax highlighting like in JSON)
        '.cm-variable-valid span': {
            backgroundColor: `${colors.variableValidBackground} !important`,
            borderRadius: '2px',
            color: `${colors.variableValidForeground} !important`,
        },
        '.cm-variable-invalid': {
            backgroundColor: colors.variableInvalidBackground,
            borderRadius: '4px',
            color: colors.variableInvalidForeground
        },
        // Handle case where variable is wrapped in a span (e.g. due to syntax highlighting like in JSON)
        '.cm-variable-invalid span': {
            backgroundColor: colors.variableInvalidBackground,
            borderRadius: '4px',
            color: colors.variableInvalidForeground,
        },
    }, { dark });
}

export function buildSyntaxHighlighting(tokens: SyntaxTokens): Extension {
    return syntaxHighlighting(HighlightStyle.define([
        { tag: t.keyword, color: tokens.keyword },
        { tag: t.string, color: tokens.string },
        { tag: t.propertyName, color: tokens.propertyName },
        { tag: t.variableName, color: tokens.variableName, class: 'px-[2px]' },
        { tag: t.comment, color: tokens.comment, fontStyle: 'italic' },
        { tag: t.annotation, color: tokens.annotation },
    ]));
}

function stripHash(color: string): string {
    const trimmed = color.trim();
    if (!trimmed.startsWith('#')) return trimmed;
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
        return hex.split('').map(c => c + c).join('');
    }
    if (hex.length === 4) {
        return hex.split('').map(c => c + c).join('');
    }
    return hex;
}

export function buildMonacoTheme(id: string, dark: boolean, colors: EditorColors, tokens: SyntaxTokens): MonacoTheme {
    const name = `postchi-${id}`;
    const data: MonacoTheme['data'] = {
        base: dark ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [
            { token: '', foreground: stripHash(tokens.variableName), background: stripHash(colors.background) },
            { token: 'keyword', foreground: stripHash(tokens.keyword) },
            { token: 'keyword.js', foreground: stripHash(tokens.keyword) },
            { token: 'keyword.ts', foreground: stripHash(tokens.keyword) },
            { token: 'string', foreground: stripHash(tokens.string) },
            { token: 'string.js', foreground: stripHash(tokens.string) },
            { token: 'string.ts', foreground: stripHash(tokens.string) },
            { token: 'string.escape', foreground: stripHash(tokens.string) },
            { token: 'number', foreground: stripHash(tokens.propertyName) },
            { token: 'number.js', foreground: stripHash(tokens.propertyName) },
            { token: 'number.ts', foreground: stripHash(tokens.propertyName) },
            { token: 'comment', foreground: stripHash(tokens.comment), fontStyle: 'italic' },
            { token: 'comment.js', foreground: stripHash(tokens.comment), fontStyle: 'italic' },
            { token: 'comment.ts', foreground: stripHash(tokens.comment), fontStyle: 'italic' },
            { token: 'identifier', foreground: stripHash(tokens.variableName) },
            { token: 'identifier.js', foreground: stripHash(tokens.variableName) },
            { token: 'identifier.ts', foreground: stripHash(tokens.variableName) },
            { token: 'type', foreground: stripHash(tokens.propertyName) },
            { token: 'type.identifier', foreground: stripHash(tokens.propertyName) },
            { token: 'type.identifier.js', foreground: stripHash(tokens.propertyName) },
            { token: 'type.identifier.ts', foreground: stripHash(tokens.propertyName) },
            { token: 'delimiter', foreground: stripHash(tokens.variableName) },
            { token: 'delimiter.js', foreground: stripHash(tokens.variableName) },
            { token: 'delimiter.ts', foreground: stripHash(tokens.variableName) },
            { token: 'annotation', foreground: stripHash(tokens.annotation) },
            { token: 'tag', foreground: stripHash(tokens.annotation) },
            { token: 'regexp', foreground: stripHash(tokens.string) },
        ],
        colors: {
            'editor.background': colors.background,
            'editor.foreground': colors.foreground,
            'editorCursor.foreground': colors.cursor,
            'editor.selectionBackground': colors.selection,
            'editor.inactiveSelectionBackground': colors.selection,
            'editor.lineHighlightBackground': colors.gutterBackground,
            'editor.lineHighlightBorder': colors.gutterBackground,
            'editorLineNumber.foreground': colors.foreground,
            'editorLineNumber.activeForeground': tokens.variableName,
            'editorGutter.background': colors.gutterBackground,
            'editorWidget.background': colors.tooltipBackground,
            'editorWidget.foreground': colors.tooltipForeground,
            'editorWidget.border': colors.tooltipBorder,
            'editorSuggestWidget.background': colors.tooltipBackground,
            'editorSuggestWidget.foreground': colors.tooltipForeground,
            'editorSuggestWidget.border': colors.tooltipBorder,
            'editorSuggestWidget.selectedBackground': colors.selection,
            'editorSuggestWidget.highlightForeground': tokens.keyword,
            'editorHoverWidget.background': colors.tooltipBackground,
            'editorHoverWidget.foreground': colors.tooltipForeground,
            'editorHoverWidget.border': colors.tooltipBorder,
            'editorError.foreground': colors.lintError,
            'editorWarning.foreground': colors.lintWarning,
            'editorInfo.foreground': colors.lintInfo,
            'editorIndentGuide.background': colors.tooltipBorder,
            'editorIndentGuide.activeBackground': colors.foreground,
            'editorBracketMatch.background': colors.selection,
            'editorBracketMatch.border': colors.tooltipBorder,
        },
    };
    return { name, data };
}
