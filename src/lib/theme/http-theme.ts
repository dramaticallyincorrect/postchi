import { HighlightStyle, syntaxHighlighting, TagStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@uiw/react-codemirror";
import { getCSSVar, isDarkTheme } from "./utils";

export function buildCMTheme(theme: PostchiTheme) {
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
            outline: "none"
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

    const highlightStyle = HighlightStyle.define([
        ...tokenConfig(theme.tokens),
    ]);

    return [editorTheme, syntaxHighlighting(highlightStyle)];
}

function tokenConfig(tk: ThemeTokens): TagStyle[] {
    return [
        { tag: t.comment, color: `${tk.comment}` },
        { tag: t.keyword, color: `${tk.keyword}` },
        { tag: t.attributeName, color: `${tk.attrName}` },
        { tag: t.attributeValue, color: `${tk.attrValue}` },
        { tag: t.url, color: `${tk.url}` },
        { tag: t.variableName, color: `${tk.varName}`, backgroundColor: `${tk.varNameBg}` },
        { tag: t.annotation, color: `${tk.annotation}` },

        // json
        { tag: t.string, color: `${tk.string}` },
        { tag: t.number, color: `${tk.number}` },
        { tag: t.bool, color: `${tk.bool}` },
        { tag: t.propertyName, color: `${tk.propName}` },
        { tag: t.null, color: `${tk.null}` },
        { tag: t.separator, color: `${tk.separator}` },
        { tag: t.squareBracket, color: `${tk.squareBracket}` },
        { tag: t.brace, color: `${tk.brace}` }
    ]
}