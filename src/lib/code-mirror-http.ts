import { parseMixed } from "@lezer/common"
import {
    foldInside,
    foldNodeProp,
    LanguageSupport,
    LRLanguage,
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./http/parser/parser";
import { json } from "@codemirror/lang-json"
import completeHttp from "./http/autocomplete/http-autocomplete";
import { httpLinter } from "./http/linter/http-linter";

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

export function customHttp(): LanguageSupport {
    const httpAutoComplete = customHttpLanguage.data.of({
        autocomplete: completeHttp
    })
    return new LanguageSupport(customHttpLanguage, [json(), httpAutoComplete, httpLinter]);
}