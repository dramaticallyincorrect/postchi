import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import sharedAmbient from '@/postchi/http/scripts/ambient/script-ambient-shared.d.ts?raw';
import beforeAmbient from '@/postchi/http/scripts/ambient/script-ambient-before.d.ts?raw';
import afterAmbient from '@/postchi/http/scripts/ambient/script-ambient-after.d.ts?raw';
import quickActionAmbient from '@/postchi/http/scripts/ambient/script-ambient-quick-action.d.ts?raw';
import { FileType } from '@/postchi/project/file-types/supported-filetypes';

(self as unknown as { MonacoEnvironment: { getWorker: (workerId: string, label: string) => Worker } }).MonacoEnvironment = {
    getWorker(_workerId, label) {
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

loader.config({ monaco });

monaco.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ES2020,
    module: monaco.typescript.ModuleKind.ESNext,
    // Force all files to be treated as ES modules so top-level await is valid
    moduleDetection: 3,
    lib: ['es2020', 'dom'],
    allowJs: true,
    checkJs: true,
    allowNonTsExtensions: true,
});

monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
});

export type ScriptContextKind = 'before' | 'after' | 'quick-action';

export function contextKindFor(type: FileType): ScriptContextKind {
    if (type === FileType.AFTER_SCRIPT || type === FileType.FOLDER_AFTER_SCRIPT) return 'after';
    if (type === FileType.BEFORE_SCRIPT || type === FileType.FOLDER_BEFORE_SCRIPT) return 'before';
    return 'quick-action';
}

const AMBIENT_URI = {
    shared: 'ts:postchi/script-ambient-shared.d.ts',
    before: 'ts:postchi/script-ambient-before.d.ts',
    after: 'ts:postchi/script-ambient-after.d.ts',
    'quick-action': 'ts:postchi/script-ambient-quick-action.d.ts',
} as const;

function setAmbientLib(m: typeof monaco, uri: string, content: string) {
    const existing = m.typescript.typescriptDefaults.getExtraLibs()[uri];
    if (existing?.content === content) return;
    m.typescript.typescriptDefaults.addExtraLib(content, uri);
}

setAmbientLib(monaco, AMBIENT_URI.shared, sharedAmbient);

export function applyContextAmbient(m: typeof monaco, kind: ScriptContextKind) {
    const libs = m.typescript.typescriptDefaults.getExtraLibs();
    for (const uri of [AMBIENT_URI.before, AMBIENT_URI.after, AMBIENT_URI['quick-action']]) {
        if (libs[uri]) {
            m.typescript.typescriptDefaults.addExtraLib('', uri);
        }
    }
    const content = kind === 'before' ? beforeAmbient : kind === 'after' ? afterAmbient : quickActionAmbient;
    setAmbientLib(m, AMBIENT_URI[kind], content);
}
