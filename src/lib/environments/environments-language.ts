import {
    foldInside,
    foldNodeProp,
    HighlightStyle,
    LanguageSupport,
    LRLanguage,
    syntaxHighlighting,
    TagStyle,
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser/parser";
import { Extension } from "@codemirror/state";
import { environmentLinter } from "./linter/environments-linter";

export const environmentsLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                EnvironmentName: t.keyword,
                Key: t.attributeName,
                Value: t.attributeValue,
                Comment: t.comment,
                Pound: t.controlKeyword
            }),

            foldNodeProp.add({ Body: foldInside }),
        ],
    }),
});

// todo: add sperate tokens for env, use those if availbe if not fallback to http tokens
function environmentStyles(tk: ThemeTokens): TagStyle[] {
    return [
        { tag: t.comment, color: `${tk.comment}` },
        { tag: t.keyword, color: `${tk.environment.environmentName}` },
        { tag: t.attributeName, color: `${tk.environment.key}` },
        { tag: t.attributeValue, color: `${tk.environment.url}` },
        { tag: t.controlKeyword, color: `${tk.environment.environmentName}` },
    ]
}

export function environmentSyntaxHighlighting(theme: PostchiTheme): Extension {
    const highlightStyle = HighlightStyle.define([
        ...environmentStyles(theme.tokens),
    ]);
    return syntaxHighlighting(highlightStyle);
}


export function EnvironmentsLanguage(): LanguageSupport {
    return new LanguageSupport(environmentsLanguage, environmentLinter);
}