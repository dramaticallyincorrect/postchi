import { Extension } from "@codemirror/state";


export type PostchiTheme = {
    id: string;
    name: string;
    vars: VarColors;
    codemirrorTheme: Extension;
};

type SidebarColors = { background: string, activeBg: string, foreground: string, mutedFg: string, sectionLabel: string }
type GutterColors = { background: string, border: string, foreground: string, activeFg: string }

type VarColors = {
    '--primary': string,
    '--background': string,
    '--background-elevated' : string,
    '--muted': string,
    '--background-panel': string,
    '--foreground': string,
    '--muted-foreground': string,
    '--destructive': string,
}

type ThemeTokens = {
    comment: string;
    keyword: string;
    attrName: string;
    attrValue: string;
    url: string;
    varName: string;
    varNameBg: string
    annotation: string;
    string: string;
    number: string;
    bool: string;
    propName: string;
    null: string;
    separator: string;
    squareBracket: string;
    brace: string;
    environment: EnvironmentStyles;
};

export type EditorColors = {
    background: string;
    gutterBorder: string;
    gutterBackground: string;
    gutterForeground: string;
    gutterActiveForeground: string;
    tooltip: EditorTooltipColors
    caret: string;
    selectionBackground: string;
}

type EditorTooltipColors = {
    tooltipBackground: string;
    tooltipForeground: string;
    activeItemBackground: string;
    activeItemForeground: string;
}   

type EnvironmentStyles = {
    environmentName: string,
    key: string,
    operator: string,
    value: string,
    url: string,
    comment: string,
}