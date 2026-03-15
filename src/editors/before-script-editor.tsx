import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import DefaultFileStorage from '@/lib/data/files/file-default';
import { useEffect, useRef } from 'react';
import { loadText } from './load-text';
import { useTheme } from '@/theme-context/theme-context';
import beforeScriptCompletion from '@/lib/scripts/language-support/before-script-autocomplete';

export const BeforeScriptEditor = ({ path }: { path: string }) => {
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

    return <CodeMirror
        onChange={onChange}
        height='100%'
        theme={theme.codemirror.theme}
        className='height: 100% outline-none'
        extensions={[
            javascript(),
            javascriptLanguage.data.of({ autocomplete: beforeScriptCompletion }),
        ]}
        onCreateEditor={(view) => {
            viewRef.current = view;
            loadText(view, path);
        }}
    />;
};
