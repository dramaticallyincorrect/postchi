import {
    foldInside,
    foldNodeProp,
    LanguageSupport,
    LRLanguage,
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser/parser";
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


export function EnvironmentsLanguage(): LanguageSupport {
    return new LanguageSupport(environmentsLanguage, environmentLinter);
}