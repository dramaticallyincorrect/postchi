import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export const toggleLineCommentAtStart = (view: EditorView): boolean => {
    const { state, dispatch } = view;
    const { doc, selection } = state;

    const lineNumbers = new Set<number>();
    for (const range of selection.ranges) {
        const startLine = doc.lineAt(range.from).number;
        const endLineNum = doc.lineAt(range.to).number;
        const endLine = doc.line(endLineNum);
        const effectiveEnd = (range.to === endLine.from && endLineNum > startLine)
            ? endLineNum - 1
            : endLineNum;
        for (let i = startLine; i <= effectiveEnd; i++) {
            lineNumbers.add(i);
        }
    }

    const lines = [...lineNumbers].map(n => doc.line(n));
    const allCommented = lines.every(l => l.text.startsWith('//'));

    const changes = lines.map(line => {
        if (allCommented) {
            const removeLen = line.text.startsWith('// ') ? 3 : 2;
            return { from: line.from, to: line.from + removeLen, insert: '' };
        } else {
            return { from: line.from, to: line.from, insert: '// ' };
        }
    });

    const changeSet = state.changes(changes);
    const lastLineNum = Math.max(...lineNumbers);
    const newSelection = lastLineNum < doc.lines
        ? EditorSelection.cursor(changeSet.mapPos(doc.line(lastLineNum).to) + 1)
        : undefined;

    dispatch(state.update({
        changes,
        ...(newSelection ? { selection: newSelection } : {}),
        scrollIntoView: true,
        userEvent: 'input'
    }));
    return true;
};