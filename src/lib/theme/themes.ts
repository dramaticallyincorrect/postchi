import { PostchiTheme } from "./theme";
import { ayuLight, coolGlow } from 'thememirror';
import { buildCMTheme } from "./theme-builder";

export const themes: PostchiTheme[] = [
  {
    id: 'dark',
    name: 'Dark',
    vars: {
      '--primary': '#7B8CDE',
      '--background': '#0D0D0D',
      '--background-elevated': '#1A1A2E',
      '--muted': '#1E1E2E',
      '--background-panel': '#161622',
      '--foreground': '#CDD6F4',
      '--muted-foreground': '#7F849C',
      '--destructive': '#F38BA8',
    },
    codemirror: {
      theme: buildCMTheme(coolGlow, '#161622'),
      tokens: {
        attributeName: '#89B4FA',
        attributeValue: '#A6E3A1',
      }
    },
  },
  {
    id: 'light',
    name: 'Light',
    vars: {
      '--primary': '#2470B3',             // IntelliJ accent blue
      '--background': '#ECECEC',          // title bar / chrome — warm light grey
      '--background-elevated': '#F7F7F7', // sidebars, tool windows
      '--muted': '#EBEBEB',               // muted surfaces, borders
      '--background-panel': '#FFFFFF',    // editor panel — pure white
      '--foreground': '#1A1A1A',
      '--muted-foreground': '#757575',
      '--destructive': '#C7222A',
    },
    codemirror: {
      theme: buildCMTheme(ayuLight, '#FFFFFF'),
      tokens: {
        attributeName: '#1E66F5',
        attributeValue: '#40A02B',
      }
    },
  },
];