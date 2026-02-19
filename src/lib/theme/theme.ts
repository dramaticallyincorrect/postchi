
type PostchiTheme = {
    id: string;
    name: string;
    vars: VarColors;
    tokens: ThemeTokens;
};

type SidebarColors = { background: string, activeBg: string, foreground: string, mutedFg: string, sectionLabel: string }
type GutterColors = { background: string, border: string, foreground: string, activeFg: string }

type VarColors = {
    '--background': string,
    '--background-secondary': string,
    '--foreground': string,
    '--card': string,
    '--card-foreground': string,
    '--popover': string,
    '--popover-foreground': string,
    '--primary': string,
    '--primary-foreground': string,
    '--secondary': string,
    '--secondary-foreground': string,
    '--text-soft': string,
    '--muted': string,
    '--muted-foreground': string,
    '--accent': string,
    '--accent-foreground': string,
    '--destructive': string,
    '--border': string,
    '--input': string,
    '--ring': string,
    '--chart-1': string,
    '--chart-2': string,
    '--chart-3': string,
    '--chart-4': string,
    '--chart-5': string,
    '--radius': string,
    '--sidebar': string,
    '--sidebar-foreground': string,
    '--sidebar-primary': string,
    '--sidebar-primary-foreground': string,
    '--sidebar-accent': string,
    '--sidebar-accent-foreground': string,
    '--sidebar-border': string,
    '--sidebar-ring': string,
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

type EnvironmentStyles = {
        environmentName: string,
        key: string,
        operator: string,
        value: string,
        url: string,
        comment: string,
    }