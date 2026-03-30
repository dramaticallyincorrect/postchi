import { Extension } from "@codemirror/state";

export type ThemeType = 'dark' | 'light';

export type SyntaxTokens = {
    keyword: string;
    string: string;
    propertyName: string;
    variableName: string;
    comment: string;
    annotation: string;
};

// Editor-specific colors, decoupled from UI semantics
export type EditorColors = {
    background: string;
    foreground: string;
    gutterBackground: string;
    cursor: string;
    tooltipBackground: string;
    tooltipForeground: string;
    tooltipBorder: string;
    selection: string;
    variableValidBackground: string;
    variableValidForeground: string;
    variableInvalidBackground: string;
    variableInvalidForeground: string;
    lintError: string;
    lintWarning: string;
    lintInfo: string;
};

// Input type: all optional, defaults derived from core vars
export type EditorColorsInput = Partial<EditorColors>;

export type CodeMirrorTheme = {
    editorTheme: Extension;
    syntaxHighlighting: Extension;
    tokens: SyntaxTokens;
    colors: EditorColors;
};

export type PostchiTheme = {
    id: string;
    name: string;
    type: ThemeType;
    vars: ResolvedVarColors;
    codemirror: CodeMirrorTheme;
    /** Raw inputs preserved for recomputation when user toggles flags */
    _source: {
        vars: VarColors;
        tokens: SyntaxTokens;
        editor?: EditorColorsInput;
    };
};

// Required core colors every theme must define
export type CoreVarColors = {
    '--primary': string;
    '--primary-foreground': string;
    '--background': string;
    '--background-elevated': string;
    '--background-panel': string;
    '--foreground': string;
    '--muted': string;
    '--muted-foreground': string;
    '--destructive': string;
    '--success': string;
    '--error': string;
    '--warning': string;
};

// Optional UI colors that can be derived from core colors
export type OptionalVarColors = {
    '--card'?: string;
    '--card-foreground'?: string;
    '--popover'?: string;
    '--popover-foreground'?: string;
    '--secondary'?: string;
    '--secondary-foreground'?: string;
    '--text-soft-muted'?: string;
    '--accent'?: string;
    '--accent-foreground'?: string;
    '--border'?: string;
    '--input'?: string;
    '--ring'?: string;
    '--chart-1'?: string;
    '--chart-2'?: string;
    '--chart-3'?: string;
    '--chart-4'?: string;
    '--chart-5'?: string;
    '--sidebar'?: string;
    '--sidebar-foreground'?: string;
    '--sidebar-primary'?: string;
    '--sidebar-primary-foreground'?: string;
    '--sidebar-accent'?: string;
    '--sidebar-accent-foreground'?: string;
    '--sidebar-border'?: string;
    '--sidebar-ring'?: string;
};

// Input type: core required + optional overrides
export type VarColors = CoreVarColors & OptionalVarColors;

// Fully resolved type with all values filled in
export type ResolvedVarColors = Required<CoreVarColors & OptionalVarColors>;
