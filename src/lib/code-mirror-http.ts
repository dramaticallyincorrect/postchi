import { parseMixed } from "@lezer/common"
import {
    foldInside,
    foldNodeProp,
    HighlightStyle,
    LanguageSupport,
    LRLanguage,
    syntaxHighlighting
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./http/parser/parser";
import { EditorView } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json"
import completeHttp from "./http/autocomplete/http-autocomplete";

const httpTheme = EditorView.theme({
    "&": {
        color: "#cdd6f4",
        backgroundColor: "#191A1C",
    },
    "&.cm-focused": {
        outline: "none"
    },
    ".cm-selectionBackground": {
        backgroundColor: "#2a2d3a"
    },
    ".cm-gutters": {
        backgroundColor: "#191A1C",
        color: "#343748",
    }
}, { dark: true });


const myHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#ff79c6" },
    { tag: t.attributeName, color: "#50fa7b", },
    { tag: t.attributeValue, color: "#f1fa8c" },
    { tag: t.url, color: "#8be9fd" },
    { tag: t.variableName, class: 'variableName' },
    { tag: t.annotation, color: "#ffb86c" },
    { tag: t.comment, color: "#A0A0A0" },
    // json
    { tag: t.string, color: '#98d4a3' },
    { tag: t.number, color: '#d4a96a' },
    { tag: t.bool, color: '#c792ea' },
    { tag: t.propertyName, color: '#e06c75' },
    { tag: t.null, color: '#61afef' },
    { tag: t.separator, color: '#6b7394' },
    { tag: t.squareBracket, color: '#6b7394' },
    { tag: t.brace, color: '#6b7394' }
    // ----
])

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

export function customHttp() {
    const httpAutoComplete = customHttpLanguage.data.of({
        autocomplete: completeHttp
    })
    return new LanguageSupport(customHttpLanguage, [syntaxHighlighting(myHighlightStyle), json(), httpAutoComplete]);
}

export { httpTheme };