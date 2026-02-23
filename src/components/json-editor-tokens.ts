import { HighlightStyle, syntaxHighlighting, TagStyle } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

export function jsonSyntaxHighlighting(theme: PostchiTheme): Extension {
    const highlightStyle = HighlightStyle.define([
        ...jsonTokens(theme.tokens),
    ]);

    return syntaxHighlighting(highlightStyle);
}

export const jsonTokens = (tk: ThemeTokens): TagStyle[] => {
    return [
        { tag: t.string, color: `${tk.string}` },
        { tag: t.number, color: `${tk.number}` },
        { tag: t.bool, color: `${tk.bool}` },
        { tag: t.propertyName, color: `${tk.propName}` },
        { tag: t.null, color: `${tk.null}` },
        { tag: t.separator, color: `${tk.separator}` },
        { tag: t.squareBracket, color: `${tk.squareBracket}` },
        { tag: t.brace, color: `${tk.brace}` }
    ];
}