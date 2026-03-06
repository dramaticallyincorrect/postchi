import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { PostchiTheme } from "./theme";
import { tags as t } from "@lezer/highlight";
import { amy, ayuLight, barf, bespin, birdsOfParadise, boysAndGirls, clouds, cobalt, coolGlow, dracula, espresso, noctisLilac, rosePineDawn, smoothy, solarizedLight, tomorrow } from 'thememirror';

const amyTokens = {
  attributeName: '#D0D0FF',
  attributeValue: '#999999',
};

const ayuLightTokens = {
  attributeName: '#f2ae49',
  attributeValue: '#86b300',
};

const barfTokens = {
  attributeName: '#708E67',
  attributeValue: '#5C81B3',
};

const bespinTokens = {
  attributeName: '#937121',
  attributeValue: '#54BE0D',
};

const birdsOfParadiseTokens = {
  attributeName: '#EFCB43',
  attributeValue: '#D9D762',
};

const boysAndGirlsTokens = {
  attributeName: '#E62286',
  attributeValue: '#00D8FF',
};

const cloudsTokens = {
  attributeName: '#606060',
  attributeValue: '#5D90CD',
};

const cobaltTokens = {
  attributeName: '#9EFFFF',
  attributeValue: '#3AD900',
};

const coolGlowTokens = {
  attributeName: '#7BACCA',
  attributeValue: '#8DFF8E',
};

const draculaTokens = {
  attributeName: '#50fa7b',
  attributeValue: '#f1fa8c',
};

const espressoTokens = {
  attributeName: '#4F9FD0',
  attributeValue: '#CF4F5F',
};

const noctisLilacTokens = {
  attributeName: '#e64100',
  attributeValue: '#00b368',
};

const rosePineDawnTokens = {
  attributeName: '#907aa9',
  attributeValue: '#ea9d34',
};

const smoothyTokens = {
  attributeName: '#B06520',
  attributeValue: '#704D3D',
};

const solarizedLightTokens = {
  attributeName: '#93A1A1',
  attributeValue: '#2AA198',
};

const tomorrowTokens = {
  attributeName: '#C82829',
  attributeValue: '#718C00',
};

export const themes: PostchiTheme[] = [
  {
    id: 'amy',
    name: 'Amy',
    vars: {
      '--primary': '#7070FF',
      '--background': '#140014',
      '--background-elevated': '#2a002a',
      '--muted': '#350035',
      '--background-panel': '#200020',
      '--foreground': '#D0D0FF',
      '--muted-foreground': '#C080C0',
      '--destructive': '#FF5060',
    },
    codemirror: {
      theme: amy,
      tokens: {
        attributeName: amyTokens.attributeName,
        attributeValue: amyTokens.attributeValue,
      }
    },
  },
  {
    id: 'ayu-light',
    name: 'Ayu Light',
    vars: {
      '--primary': '#ffaa33',
      '--background': '#ebebeb',
      '--background-elevated': '#f3f3f3',
      '--muted': '#dcdcdc',
      '--background-panel': '#fcfcfc',
      '--foreground': '#5c6166',
      '--muted-foreground': '#8a9199',
      '--destructive': '#e65050',
    },
    codemirror: {
      theme: ayuLight,
      tokens: {
        attributeName: ayuLightTokens.attributeName,
        attributeValue: ayuLightTokens.attributeValue,
      }
    },
  },
  {
    id: 'barf',
    name: 'Barf',
    vars: {
      '--primary': '#C4C4C4',
      '--background': '#0d1015',
      '--background-elevated': '#111519',
      '--muted': '#1e2530',
      '--background-panel': '#15191e',
      '--foreground': '#EEF2F7',
      '--muted-foreground': '#aaaaaa',
      '--destructive': '#ff4444',
    },
    codemirror: {
      theme: barf,
      tokens: {
        attributeName: barfTokens.attributeName,
        attributeValue: barfTokens.attributeValue,
      },
    },
  },
  {
    id: 'bespin',
    name: 'Bespin',
    vars: {
      '--primary': '#cf7d34',
      '--background': '#1c1510',
      '--background-elevated': '#221a14',
      '--muted': '#2e2218',
      '--background-panel': '#2e241d',
      '--foreground': '#BAAE9E',
      '--muted-foreground': '#BAAE9E90',
      '--destructive': '#f07070',
    },
    codemirror: {
      theme: bespin,
      tokens: {
        attributeName: bespinTokens.attributeName,
        attributeValue: bespinTokens.attributeValue,
      }
    },
  },
  {
    id: 'birds-of-paradise',
    name: 'Birds of Paradise',
    vars: {
      '--primary': '#EF5D32',
      '--background': '#2a1a1b',
      '--background-elevated': '#301e1f',
      '--muted': '#3f2a2b',
      '--background-panel': '#3b2627',
      '--foreground': '#E6E1C4',
      '--muted-foreground': '#E6E1C490',
      '--destructive': '#ef5350',
    },
    codemirror: {
      theme: birdsOfParadise,
      tokens: {
        attributeName: birdsOfParadiseTokens.attributeName,
        attributeValue: birdsOfParadiseTokens.attributeValue,
      }
    },
  },
  {
    id: 'boys-and-girls',
    name: 'Boys and Girls',
    vars: {
      '--primary': '#E60065',
      '--background': '#000000',
      '--background-elevated': '#050a10',
      '--muted': '#0a1020',
      '--background-panel': '#000205',
      '--foreground': '#FFFFFF',
      '--muted-foreground': '#ffffff90',
      '--destructive': '#ff4455',
    },
    codemirror: {
      theme: boysAndGirls,
      tokens: {
        attributeName: boysAndGirlsTokens.attributeName,
        attributeValue: boysAndGirlsTokens.attributeValue,
      }
    },
  },
  {
    id: 'clouds',
    name: 'Clouds',
    vars: {
      '--primary': '#46A609',
      '--background': '#e8e8e8',
      '--background-elevated': '#f0f0f0',
      '--muted': '#d8d8d8',
      '--background-panel': '#ffffff',
      '--foreground': '#000000',
      '--muted-foreground': '#00000070',
      '--destructive': '#C52727',
    },
    codemirror: {
      theme: clouds,
      tokens: {
        attributeName: cloudsTokens.attributeName,
        attributeValue: cloudsTokens.attributeValue,
      }
    },
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    vars: {
      '--primary': '#FF9D00',
      '--background': '#001830',
      '--background-elevated': '#001e3d',
      '--muted': '#003060',
      '--background-panel': '#00254b',
      '--foreground': '#FFFFFF',
      '--muted-foreground': '#FFFFFF70',
      '--destructive': '#FF628C',
    },
    codemirror: {
      theme: cobalt,
      tokens: {
        attributeName: cobaltTokens.attributeName,
        attributeValue: cobaltTokens.attributeValue,
      }
    },
  },
  {
    id: 'cool-glow',
    name: 'Cool Glow',
    vars: {
      '--primary': '#2BF1DC',
      '--background': '#020310',
      '--background-elevated': '#070620',
      '--muted': '#0d0b30',
      '--background-panel': '#060521',
      '--foreground': '#E0E0E0',
      '--muted-foreground': '#E0E0E090',
      '--destructive': '#ff4455',
    },
    codemirror: {
      theme: coolGlow,
      tokens: {
        attributeName: coolGlowTokens.attributeName,
        attributeValue: coolGlowTokens.attributeValue,
      }
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    vars: {
      '--primary': '#bd93f9',
      '--background': '#1e1f2b',
      '--background-elevated': '#21222c',
      '--muted': '#383a4a',
      '--background-panel': '#2d2f3f',
      '--foreground': '#f8f8f2',
      '--muted-foreground': 'rgb(144, 145, 148)',
      '--destructive': '#ff5555',
    },
    codemirror: {
      theme: dracula,
      tokens: {
        attributeName: draculaTokens.attributeName,
        attributeValue: draculaTokens.attributeValue,
      }
    },
  },
  {
    id: 'espresso',
    name: 'Espresso',
    vars: {
      '--primary': '#2F6F9F',
      '--background': '#e8e8e8',
      '--background-elevated': '#f0f0f0',
      '--muted': '#d8d8d8',
      '--background-panel': '#FFFFFF',
      '--foreground': '#000000',
      '--muted-foreground': '#00000070',
      '--destructive': '#CF4F5F',
    },
    codemirror: {
      theme: espresso,
      tokens: {
        attributeName: espressoTokens.attributeName,
        attributeValue: espressoTokens.attributeValue,
      }
    },
  },
  {
    id: 'noctis-lilac',
    name: 'Noctis Lilac',
    vars: {
      '--primary': '#5c49e9',
      '--background': '#dddbe8',
      '--background-elevated': '#e8e6f0',
      '--muted': '#d0cde0',
      '--background-panel': '#f2f1f8',
      '--foreground': '#0c006b',
      '--muted-foreground': '#0c006b70',
      '--destructive': '#ff5792',
    },
    codemirror: {
      theme: noctisLilac,
      tokens: {
        attributeName: noctisLilacTokens.attributeName,
        attributeValue: noctisLilacTokens.attributeValue,
      }
    },
  },
  {
    id: 'rose-pine-dawn',
    name: 'Rosé Pine Dawn',
    vars: {
      '--primary': '#d7827e',
      '--background': '#ede8e2',
      '--background-elevated': '#f3ede7',
      '--muted': '#e4ddd6',
      '--background-panel': '#faf4ed',
      '--foreground': '#575279',
      '--muted-foreground': '#57527970',
      '--destructive': '#b4637a',
    },
    codemirror: {
      theme: rosePineDawn,
      tokens: {
        attributeName: rosePineDawnTokens.attributeName,
        attributeValue: rosePineDawnTokens.attributeValue,
      }
    },
  },
  {
    id: 'smoothy',
    name: 'Smoothy',
    vars: {
      '--primary': '#2EB43B',
      '--background': '#ebebeb',
      '--background-elevated': '#f5f5f5',
      '--muted': '#e0e0e0',
      '--background-panel': '#FFFFFF',
      '--foreground': '#000000',
      '--muted-foreground': '#00000070',
      '--destructive': '#E66C29',
    },
    codemirror: {
      theme: smoothy,
      tokens: {
        attributeName: smoothyTokens.attributeName,
        attributeValue: smoothyTokens.attributeValue,
      }
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    vars: {
      '--primary': '#268BD2',
      '--background': '#EEE8D5',
      '--background-elevated': '#f5efdc',
      '--muted': '#e4ddc8',
      '--background-panel': '#fef7e5',
      '--foreground': '#586E75',
      '--muted-foreground': '#586E7580',
      '--destructive': '#D30102',
    },
    codemirror: {
      theme: solarizedLight,
      tokens: {
        attributeName: solarizedLightTokens.attributeName,
        attributeValue: solarizedLightTokens.attributeValue,
      }
    },
  },
  {
    id: 'tomorrow',
    name: 'Tomorrow',
    vars: {
      '--primary': '#4271AE',
      '--background': '#ebebeb',
      '--background-elevated': '#f5f5f5',
      '--muted': '#e0e0e0',
      '--background-panel': '#FFFFFF',
      '--foreground': '#4D4D4C',
      '--muted-foreground': '#4D4D4C80',
      '--destructive': '#C82829',
    },
    codemirror: {
      theme: tomorrow,
      tokens: {
        attributeName: tomorrowTokens.attributeName,
        attributeValue: tomorrowTokens.attributeValue,
      }
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    vars: {
      '--primary': '#61afef',
      '--background': '#1a1d23',
      '--background-elevated': '#2c313a',
      '--muted': '#21252b',
      '--background-panel': '#282c34',
      '--foreground': '#abb2bf',
      '--muted-foreground': '#5c6370',
      '--destructive': '#e06c75',
    },
    codemirror: {
      theme: syntaxHighlighting(HighlightStyle.define([
        { tag: t.keyword, color: '#c678dd', fontWeight: '500' },
        { tag: t.controlKeyword, color: '#c678dd', fontWeight: '600' },
        { tag: t.operatorKeyword, color: '#56b6c2' },
        { tag: t.definitionKeyword, color: '#c678dd' },
        { tag: t.moduleKeyword, color: '#c678dd' },
        { tag: t.operator, color: '#56b6c2' },
        { tag: t.punctuation, color: '#abb2bf' },
        { tag: t.bracket, color: '#abb2bf' },
        { tag: t.string, color: '#98c379' },
        { tag: t.special(t.string), color: '#98c379' },
        { tag: t.number, color: '#d19a66' },
        { tag: t.bool, color: '#d19a66' },
        { tag: t.null, color: '#d19a66', fontStyle: 'italic' },
        { tag: t.comment, color: '#5c6370', fontStyle: 'italic' },
        { tag: t.lineComment, color: '#5c6370', fontStyle: 'italic' },
        { tag: t.blockComment, color: '#5c6370', fontStyle: 'italic' },
        { tag: t.variableName, color: '#e06c75' },
        { tag: t.definition(t.variableName), color: '#e06c75' },
        { tag: t.function(t.variableName), color: '#61afef', fontWeight: '500' },
        { tag: t.function(t.propertyName), color: '#61afef' },
        { tag: t.definition(t.function(t.variableName)), color: '#61afef', fontWeight: '600' },
        { tag: t.propertyName, color: '#e06c75' },
        { tag: t.attributeName, color: '#e06c75' },
        { tag: t.attributeValue, color: '#98c379' },
        { tag: t.className, color: '#e5c07b', fontWeight: '600' },
        { tag: t.tagName, color: '#e06c75', fontWeight: '500' },
        { tag: t.typeName, color: '#e5c07b' },
        { tag: t.typeOperator, color: '#56b6c2' },
        { tag: t.namespace, color: '#e5c07b' },
        { tag: t.regexp, color: '#98c379' },
        { tag: t.escape, color: '#56b6c2' },
        { tag: t.url, color: '#61afef', textDecoration: 'underline' },
        { tag: t.heading, color: '#e06c75', fontWeight: 'bold' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic', color: '#c678dd' },
      ])),
      tokens: {
        attributeName: '#e06c75',
        attributeValue: '#98c379',
      },
    }
  },
];