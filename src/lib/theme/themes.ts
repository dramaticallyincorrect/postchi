import { PostchiTheme } from "./theme";
import { ayuLight, coolGlow } from 'thememirror';
import { buildCMTheme } from "./theme-builder";

export const themes: PostchiTheme[] = [
  {
    id: 'dark',
    name: 'Dark',
    vars: {
      '--primary': '#F00',
      '--background': '#111111',
      '--background-elevated': '#1A1A2E',
      '--muted': '#1E1E2E',
      '--background-panel': '#0D0D0D',
      '--foreground': '#ECECEC',
      '--muted-foreground': '#7F849C',
      '--destructive': '#F38BA8',
      '--success': '#A6FFA1',
      '--warning': '#F9E2AF',
      '--error': '#DF0000',
    },
    codemirror: {
      theme: buildCMTheme(coolGlow, '#0D0D0D'),
      tokens: {
        attributeName: '#60A4F1',
        attributeValue: '#8DFF8E',
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
      '--success': '#A6FFA1',
      '--warning': '#F9E2AF',
      '--error': '#DF0000',
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