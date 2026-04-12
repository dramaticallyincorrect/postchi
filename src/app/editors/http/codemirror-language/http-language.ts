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
import completeHttp from "../../../../postchi/http/autocomplete/http-autocomplete";

import { autocompletion } from "@codemirror/autocomplete";
import { variableValidatorDecoration } from "./decoration/json-variable-decoration";
import { ProjectEnvironment } from "@/app/active-environment/environment-context";
import { httpLinter } from "@/postchi/http/linter/http-linter";
import { OpenAPIV3 } from "openapi-types";

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
                BodyStart: t.keyword,
                QueryKey: t.propertyName,
                QueryValue: t.string,
            }),

            foldNodeProp.add({ Body: foldInside }),
        ],
        wrap: parseMixed(node => {
            return node.name == "JsonBody" ? { parser: json().language.parser } : null
        })
    }),
});

export function customHttp(environment?: ProjectEnvironment, spec?: OpenAPIV3.OperationObject): LanguageSupport {
    const vars = [
        environment?.variables || [],
        environment?.secrets || []
    ].flat()
    const httpAutoComplete = autocompletion({ override: [completeHttp(vars, spec)] })
    return new LanguageSupport(customHttpLanguage, [json(), httpAutoComplete, httpLinter(vars), variableValidatorDecoration(new Set(vars.map(v => v.key)))]);
}