import { parseMixed } from "@lezer/common"
import {
    foldInside,
    foldNodeProp,
    LanguageSupport,
    LRLanguage,
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser/parser";
import { json } from "@codemirror/lang-json"
import completeHttp from "./autocomplete/http-autocomplete";
import { httpLinter } from "./linter/http-linter";
import { Environment } from "../environments/parser/environments-parser";
import { autocompletion } from "@codemirror/autocomplete";

export const customHttpLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                Method: t.keyword,
                Path: t.string,
                Key: t.propertyName,
                Value: t.string,
                'Function/Value': t.string,
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

export function customHttp(environment?: Environment): LanguageSupport {
    const httpAutoComplete = autocompletion({ override: [completeHttp(environment?.variables || [])] })
    return new LanguageSupport(customHttpLanguage, [json(), httpAutoComplete, httpLinter(environment)]);
}