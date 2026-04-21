import Editor, { OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import DefaultFileStorage from '@/lib/storage/files/file-default';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/app/theme/theme-context';
import { FileType } from '@/postchi/project/file-types/supported-filetypes';
import { applyContextAmbient, contextKindFor } from './monaco-setup';

export const ScriptEditor = ({ path, type }: { path: string, type: FileType }) => {
    const { theme } = useTheme();
    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
    const [initialContent, setInitialContent] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setInitialContent(null);
        DefaultFileStorage.getInstance().readText(path).then((content) => {
            if (!cancelled) setInitialContent(content ?? '');
        });
        return () => { cancelled = true; };
    }, [path]);

    const onChange = useCallback((value: string | undefined) => {
        DefaultFileStorage.getInstance().writeText(path, value ?? '');
    }, [path]);

    const handleMount: OnMount = (editor, m) => {
        editorRef.current = editor;
        monacoRef.current = m;
        m.editor.defineTheme(theme.monaco.name, theme.monaco.data);
        m.editor.setTheme(theme.monaco.name);
        applyContextAmbient(m, contextKindFor(type));
    };

    useEffect(() => {
        const m = monacoRef.current;
        if (!m) return;
        applyContextAmbient(m, contextKindFor(type));
    }, [type]);

    useEffect(() => {
        const m = monacoRef.current;
        if (!m) return;
        m.editor.defineTheme(theme.monaco.name, theme.monaco.data);
        m.editor.setTheme(theme.monaco.name);
    }, [theme]);

    if (initialContent === null) return <div style={{ height: '100%' }} />;

    return (
        <Editor
            height='100%'
            language='typescript'
            path={`inmemory://scripts${path}.ts`}
            value={initialContent}
            defaultValue={initialContent}
            theme={theme.monaco.name}
            onChange={onChange}
            onMount={handleMount}
            beforeMount={(m) => {
                m.editor.defineTheme(theme.monaco.name, theme.monaco.data);
            }}
            options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                tabSize: 2,
                fixedOverflowWidgets: true,
            }}
        />
    );
};
