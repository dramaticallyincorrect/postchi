import { Extension } from "@codemirror/state";

export type PostchiTheme = {
    id: string;
    name: string;
    vars: VarColors;
    codemirror: CodeMirrorTheme;
};

export type CodeMirrorTheme = {
    theme: Extension;
    tokens: {
        attributeName: string,
        attributeValue: string,
    };
}

type VarColors = {
    '--primary': string,
    '--background': string,
    '--background-elevated': string,
    '--muted': string,
    '--background-panel': string,
    '--foreground': string,
    '--muted-foreground': string,
    '--destructive': string,
}