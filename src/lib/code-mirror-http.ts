import { parseMixed } from "@lezer/common"
import { LRLanguage, foldNodeProp, foldInside, indentNodeProp, delimitedIndent } from "@codemirror/language"
import { HighlightStyle, LanguageSupport, syntaxHighlighting } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./http/parser/parser";
import { EditorView } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json"

const httpTheme = EditorView.theme({
  "&": {
    color: "white",
    backgroundColor: "#001"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#000000"
  },
  ".cm-gutters": {
    backgroundColor: "#045",
    color: "#ddd",
    border: "none"
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
      if (node.name == "Body") {
        console.log("Parsing body with json parser ${node}")
      }
      return node.name == "Body" ? { parser: json().language.parser } : null
    })
  }),
});

export function customHttp() {
  return new LanguageSupport(customHttpLanguage, [syntaxHighlighting(myHighlightStyle), json()],);
}

export { httpTheme };