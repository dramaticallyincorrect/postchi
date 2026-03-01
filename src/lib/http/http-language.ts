import { parseMixed } from "@lezer/common"
import {
    foldInside,
    foldNodeProp,
    LanguageSupport,
    LRLanguage,
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser/parser";
import { json, jsonParseLinter } from "@codemirror/lang-json"
import completeHttp from "./autocomplete/http-autocomplete";
import { httpLinter } from "./linter/http-linter";
import { HighlightStyle, syntaxHighlighting, TagStyle } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { jsonTokens } from "@/components/json-editor-tokens";
import { Environment } from "../environments/parser/environments-parser";

export const customHttpLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                Method: t.keyword,
                Path: t.url,
                Key: t.attributeName,
                Value: t.attributeValue,
                'Function/Value': t.literal,
                Variable: t.variableName,
                FunctionName: t.annotation,
                Comment: t.comment,
                BodyStart: t.keyword
            }),

            foldNodeProp.add({ Body: foldInside }),
        ],
        wrap: parseMixed(node => {
            return node.name == "JsonBody" ? { parser: json().language.parser } : null
        })
    }),
});

export function httpSyntaxHighlighting(theme: PostchiTheme): Extension {
    const highlightStyle = HighlightStyle.define([
        ...tokenConfig(theme.tokens),
    ]);

    return syntaxHighlighting(highlightStyle);
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
        ...jsonTokens(tk)
    ]
}

export function customHttp(environment?: Environment): LanguageSupport {
    const httpAutoComplete = customHttpLanguage.data.of({
        autocomplete: completeHttp
    })
    return new LanguageSupport(customHttpLanguage, [json(), httpAutoComplete, httpLinter(environment)]);
}