import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { lintGutter } from '@codemirror/lint';
import { autocompletion } from '@codemirror/autocomplete';
import { EnvironmentsLanguage } from '@/lib/environments/environments-language';
import DefaultFileStorage from '@/lib/data/files/file-default';
import { useEffect, useRef } from 'react';
import { loadText } from './load-text';
import { useTheme } from '@/theme-context/theme-context';

export const EnvironmentEditor = ({ path }: { path: string }) => {

    const viewRef = useRef<EditorView>(null)

    const onChange = (value: string) => {
        DefaultFileStorage.getInstance().writeText(path, value)
    }

    useEffect(() => {
        if (viewRef.current) {
            loadText(viewRef.current, path)
        }
    }, [path])

    const { theme } = useTheme()


    return <CodeMirror
        onChange={onChange}
        height='100%'
        theme={[theme.codemirror.editorTheme, theme.codemirror.syntaxHighlighting]}
        className='height: 100% outline-none'
        extensions={[lintGutter(), EnvironmentsLanguage(), autocompletion()]}
        onCreateEditor={(view) => {
            viewRef.current = view;
            loadText(view, path);
        }}
    />
}