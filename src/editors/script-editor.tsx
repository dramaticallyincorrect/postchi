import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import DefaultFileStorage from '@/lib/data/files/file-default';
import { useEffect, useMemo, useRef } from 'react';
import { loadText } from './load-text';
import { useTheme } from '@/theme-context/theme-context';
import { afterScriptCompletion, beforeScriptCompletion } from '@/lib/scripts/language-support/script-autocomplete';
import { FileType } from '@/lib/data/supported-filetypes';

export const ScriptEditor = ({ path, type }: { path: string, type: FileType }) => {
    const viewRef = useRef<EditorView>(null);
    const { theme } = useTheme();

    const onChange = (value: string) => {
        DefaultFileStorage.getInstance().writeText(path, value);
    };

    useEffect(() => {
        if (viewRef.current) {
            loadText(viewRef.current, path);
        }
    }, [path]);

    const extensions = useMemo(() => {
        const autoCompleteExtension = () => {
            if (type === FileType.AFTER_SCRIPT || type === FileType.FOLDER_AFTER_SCRIPT) {
                return javascriptLanguage.data.of({ autocomplete: afterScriptCompletion })
            } else if (type === FileType.BEFORE_SCRIPT || type === FileType.FOLDER_BEFORE_SCRIPT) {
                return javascriptLanguage.data.of({ autocomplete: beforeScriptCompletion })
            } else {
                throw new Error('Unsupported file type for ScriptEditor: ' + type)
            }
        }
        return [javascript(), autoCompleteExtension()]
    }, [path])

    return <CodeMirror
        onChange={onChange}
        height='100%'
        theme={theme.codemirror.theme}
        className='height: 100% outline-none'
        extensions={extensions}
        onCreateEditor={(view) => {
            viewRef.current = view;
            loadText(view, path);
        }}
    />;
};
