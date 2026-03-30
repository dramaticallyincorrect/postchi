import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Range } from "@codemirror/state";
import { getVariableName } from "@/lib/utils/variable-name";
import { allNodes, computeHttpAst } from "@/postchi/http/parser/http-ast";

const greenStyle = Decoration.mark({
    class: 'cm-variable-valid'
});

const redStyle = Decoration.mark({
    class: 'cm-variable-invalid'
});



export const variableValidatorDecoration = (variables: Set<string>) => ViewPlugin.fromClass(class {
    decorations: DecorationSet;


    constructor(view: EditorView) {
        this.decorations = this.getVariableDecorations(view);
    }


    getVariableDecorations(view: EditorView): DecorationSet {
        const widgets: Range<Decoration>[] = [];
        const ast = computeHttpAst(view.state.doc.toString())
        const nodes = allNodes(ast)

        nodes.forEach(node => {
            if (node.type === 'variable') {
                const text = view.state.doc.sliceString(node.from, node.to);

                const start = node.from;
                const end = node.to;
                const decoration = variables.has(getVariableName(text)) ? greenStyle : redStyle;
                widgets.push(decoration.range(start, end));
            }
        })
        return Decoration.set(widgets, true);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.getVariableDecorations(update.view);
        }
    }
}, {
    decorations: v => v.decorations
});