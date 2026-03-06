import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { lintGutter } from '@codemirror/lint';
import { autocompletion } from '@codemirror/autocomplete';
import { EnvironmentsLanguage } from '@/lib/environments/environments-language';
import { useEnvironment } from '@/active-environment/environment-context';
import DefaultFileStorage from '@/lib/data/files/file-default';
import { useEffect, useRef } from 'react';
import { loadText } from './load-text';
import { useTheme } from '@/theme-context/theme-context';

export const EnvironmentEditor = ({ path }: { path: string }) => {

    const viewRef = useRef<EditorView>(null)

    const { reload } = useEnvironment()

    const onChange = (value: string) => {
        new DefaultFileStorage().writeText(path, value).then(() => {
            reload()
        })
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
        theme={theme.codemirror.theme}
        className='height: 100% outline-none'
        extensions={[lintGutter(), EnvironmentsLanguage(), autocompletion()]}
        onCreateEditor={(view) => {
            viewRef.current = view;
            loadText(view, path);
        }}
    />
}