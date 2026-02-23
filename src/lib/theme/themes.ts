export const themes: PostchiTheme[] = [
  {
    id: 'light',
    name: 'Light',
    vars: {
      '--primary': '#0969da',
      '--background': '#f6f8fa',
      '--background-elevated': '#ffffff',
      '--muted': '#eaeef2',
      '--background-panel': '#ffffff',
      '--foreground': '#1f2328',
      '--muted-foreground': '#8c959f',
      '--destructive': '#cf222e',
    },
    editor: {
      background: '#ffffff',
      gutterBorder: '1px solid #eaeef2',
      gutterBackground: '#ffffff',
      gutterForeground: '#8c959f',
      gutterActiveForeground: '#1f2328',
      caret: '#0969da',
      selectionBackground: '#dce8f7',
      tooltip: {
        tooltipBackground: '#ffffff',
        tooltipForeground: '#1f2328',
        activeItemBackground: '#0969da',
        activeItemForeground: '#ffffff',
      }
    },
    tokens: {
      comment: '#6e7781', keyword: '#cf222e', attrName: '#116329', attrValue: '#0a3069', url: '#0969da', varName: '#953800', varNameBg: '#fff8f0', annotation: '#0969da', string: '#0a3069', number: '#0550ae', bool: '#8250df', propName: '#116329', null: '#8250df', separator: '#6e7781', squareBracket: '#0969da', brace: '#0969da',
      environment: {
        environmentName: '#0969da',
        key: '#116329',
        operator: '#6e7781',
        value: '#0a3069',
        url: '#0550ae',
        comment: '#6e7781',
      }
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    vars: {
      '--primary': '#4a7fd4',
      '--background': '#222426',
      '--background-elevated': '#2A2C2E',
      '--muted': '#383a42',
      '--background-panel': '#191A1C',
      '--foreground': '#ffffff',
      '--muted-foreground': '#696969',
      '--destructive': '#e05050',
    },
    editor: {
      background: '#191A1C',
      gutterBorder: 'none',
      gutterBackground: '#191A1C',
      gutterForeground: '#696969',
      gutterActiveForeground: '#c8d8f0',
      caret: '#4a7fd4',
      selectionBackground: '#2d4a7a',
      tooltip: {
        tooltipBackground: '#191A1C',
        tooltipForeground: '#c8d8f0',
        activeItemBackground: '#4a7fd4',
        activeItemForeground: '#ffffff',
      }
    },
    tokens: {
      comment: '#2d4a7a', keyword: '#4a7fd4', attrName: '#7eb8f7', attrValue: '#a8d4ff', url: '#e8f4ff', varName: '#f7c948', varNameBg: '#1e1800', annotation: '#4a7fd4', string: '#64c8a0', number: '#f7c948', bool: '#c084fc', propName: '#7eb8f7', null: '#c084fc', separator: '#2d4a7a', squareBracket: '#3a6aad', brace: '#3a6aad',
      environment: {
        environmentName: '#4a7fd4',
        key: '#7eb8f7',
        operator: '#2d4a7a',
        value: '#a8d4ff',
        url: '#64c8a0',
        comment: '#2d4a7a',
      }
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    vars: {
      '--primary': '#bd93f9',
      '--background': '#282a36',
      '--background-elevated': '#333545',
      '--muted': '#373945',
      '--background-panel': '#21222c',
      '--foreground': '#f8f8f2',
      '--muted-foreground': '#6272a4',
      '--destructive': '#ff5555',
    },
    editor: {
      background: '#21222c',
      gutterBorder: '1px solid #373945',
      gutterBackground: '#21222c',
      gutterForeground: '#6272a4',
      gutterActiveForeground: '#f8f8f2',
      caret: '#bd93f9',
      selectionBackground: '#44475a',
      tooltip: {
        tooltipBackground: '#21222c',
        tooltipForeground: '#f8f8f2',
        activeItemBackground: '#bd93f9',
        activeItemForeground: '#21222c',
      }
    },
    tokens: {
      comment: '#6272a4', keyword: '#ff79c6', attrName: '#50fa7b', attrValue: '#f1fa8c', url: '#8be9fd', varName: '#ffb86c', varNameBg: '#2a1f00', annotation: '#bd93f9', string: '#f1fa8c', number: '#bd93f9', bool: '#ff79c6', propName: '#50fa7b', null: '#ff79c6', separator: '#6272a4', squareBracket: '#f8f8f2', brace: '#f8f8f2',
      environment: {
        environmentName: '#bd93f9',
        key: '#50fa7b',
        operator: '#6272a4',
        value: '#f1fa8c',
        url: '#8be9fd',
        comment: '#6272a4',
      }
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    vars: {
      '--primary': '#88c0d0',
      '--background': '#2e3440',
      '--background-elevated': '#38404f',
      '--muted': '#3b4252',
      '--background-panel': '#242933',
      '--foreground': '#eceff4',
      '--muted-foreground': '#616e88',
      '--destructive': '#bf616a',
    },
    editor: {
      background: '#242933',
      gutterBorder: '1px solid #3b4252',
      gutterBackground: '#242933',
      gutterForeground: '#616e88',
      gutterActiveForeground: '#eceff4',
      caret: '#88c0d0',
      selectionBackground: '#434c5e',
      tooltip: {
        tooltipBackground: '#242933',
        tooltipForeground: '#eceff4',
        activeItemBackground: '#88c0d0',
        activeItemForeground: '#242933',
      }
    },
    tokens: {
      comment: '#616e88', keyword: '#81a1c1', attrName: '#8fbcbb', attrValue: '#a3be8c', url: '#88c0d0', varName: '#ebcb8b', varNameBg: '#1e1a00', annotation: '#88c0d0', string: '#a3be8c', number: '#b48ead', bool: '#81a1c1', propName: '#8fbcbb', null: '#81a1c1', separator: '#616e88', squareBracket: '#eceff4', brace: '#eceff4',
      environment: {
        environmentName: '#88c0d0',
        key: '#8fbcbb',
        operator: '#616e88',
        value: '#a3be8c',
        url: '#81a1c1',
        comment: '#616e88',
      }
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    vars: {
      '--primary': '#268bd2',
      '--background': '#073642',
      '--background-elevated': '#0e4455',
      '--muted': '#0d4454',
      '--background-panel': '#002b36',
      '--foreground': '#fdf6e3',
      '--muted-foreground': '#657b83',
      '--destructive': '#dc322f',
    },
    editor: {
      background: '#002b36',
      gutterBorder: '1px solid #0d4454',
      gutterBackground: '#002b36',
      gutterForeground: '#657b83',
      gutterActiveForeground: '#fdf6e3',
      caret: '#268bd2',
      selectionBackground: '#094555',
      tooltip: {
        tooltipBackground: '#002b36',
        tooltipForeground: '#fdf6e3',
        activeItemBackground: '#268bd2',
        activeItemForeground: '#fdf6e3',
      }
    },
    tokens: {
      comment: '#657b83', keyword: '#859900', attrName: '#2aa198', attrValue: '#268bd2', url: '#93a1a1', varName: '#b58900', varNameBg: '#1a1200', annotation: '#268bd2', string: '#2aa198', number: '#d33682', bool: '#6c71c4', propName: '#2aa198', null: '#6c71c4', separator: '#657b83', squareBracket: '#93a1a1', brace: '#93a1a1',
      environment: {
        environmentName: '#268bd2',
        key: '#2aa198',
        operator: '#657b83',
        value: '#859900',
        url: '#2aa198',
        comment: '#657b83',
      }
    },
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    vars: {
      '--primary': '#c4a7e7',
      '--background': '#1f1d2e',
      '--background-elevated': '#2a2740',
      '--muted': '#2a2837',
      '--background-panel': '#191724',
      '--foreground': '#e0def4',
      '--muted-foreground': '#6e6a86',
      '--destructive': '#eb6f92',
    },
    editor: {
      background: '#191724',
      gutterBorder: '1px solid #2a2837',
      gutterBackground: '#191724',
      gutterForeground: '#6e6a86',
      gutterActiveForeground: '#e0def4',
      caret: '#c4a7e7',
      selectionBackground: '#403d52',
      tooltip: {
        tooltipBackground: '#191724',
        tooltipForeground: '#e0def4',
        activeItemBackground: '#c4a7e7',
        activeItemForeground: '#191724',
      }
    },
    tokens: {
      comment: '#6e6a86', keyword: '#eb6f92', attrName: '#9ccfd8', attrValue: '#f6c177', url: '#c4a7e7', varName: '#f6c177', varNameBg: '#1e1500', annotation: '#c4a7e7', string: '#9ccfd8', number: '#ebbcba', bool: '#eb6f92', propName: '#9ccfd8', null: '#eb6f92', separator: '#6e6a86', squareBracket: '#e0def4', brace: '#e0def4',
      environment: {
        environmentName: '#c4a7e7',
        key: '#9ccfd8',
        operator: '#6e6a86',
        value: '#f6c177',
        url: '#ebbcba',
        comment: '#6e6a86',
      }
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    vars: {
      '--primary': '#a6e22e',
      '--background': '#272822',
      '--background-elevated': '#32332c',
      '--muted': '#3e3d32',
      '--background-panel': '#1e1f1c',
      '--foreground': '#f8f8f2',
      '--muted-foreground': '#75715e',
      '--destructive': '#f92672',
    },
    editor: {
      background: '#1e1f1c',
      gutterBorder: '1px solid #3e3d32',
      gutterBackground: '#1e1f1c',
      gutterForeground: '#75715e',
      gutterActiveForeground: '#f8f8f2',
      caret: '#f8f8f0',
      selectionBackground: '#49483e',
      tooltip: {
        tooltipBackground: '#1e1f1c',
        tooltipForeground: '#f8f8f2',
        activeItemBackground: '#a6e22e',
        activeItemForeground: '#1e1f1c',
      }
    },
    tokens: {
      comment: '#75715e', keyword: '#f92672', attrName: '#a6e22e', attrValue: '#e6db74', url: '#66d9e8', varName: '#fd971f', varNameBg: '#1e1200', annotation: '#66d9e8', string: '#e6db74', number: '#ae81ff', bool: '#f92672', propName: '#a6e22e', null: '#f92672', separator: '#75715e', squareBracket: '#f8f8f2', brace: '#f8f8f2',
      environment: {
        environmentName: '#66d9e8',
        key: '#a6e22e',
        operator: '#75715e',
        value: '#e6db74',
        url: '#66d9e8',
        comment: '#75715e',
      }
    },
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    vars: {
      '--primary': '#cba6f7',
      '--background': '#1e1e2e',
      '--background-elevated': '#2a2a3d',
      '--muted': '#313244',
      '--background-panel': '#181825',
      '--foreground': '#cdd6f4',
      '--muted-foreground': '#6c7086',
      '--destructive': '#f38ba8',
    },
    editor: {
      background: '#181825',
      gutterBorder: '1px solid #313244',
      gutterBackground: '#181825',
      gutterForeground: '#6c7086',
      gutterActiveForeground: '#cdd6f4',
      caret: '#cba6f7',
      selectionBackground: '#45475a',
      tooltip: {
        tooltipBackground: '#181825',
        tooltipForeground: '#cdd6f4',
        activeItemBackground: '#cba6f7',
        activeItemForeground: '#181825',
      }
    },
    tokens: {
      comment: '#6c7086', keyword: '#cba6f7', attrName: '#a6e3a1', attrValue: '#f9e2af', url: '#89dceb', varName: '#fab387', varNameBg: '#1e1200', annotation: '#89b4fa', string: '#a6e3a1', number: '#fab387', bool: '#cba6f7', propName: '#89dceb', null: '#f38ba8', separator: '#6c7086', squareBracket: '#cdd6f4', brace: '#cdd6f4',
      environment: {
        environmentName: '#cba6f7',
        key: '#a6e3a1',
        operator: '#6c7086',
        value: '#f9e2af',
        url: '#89dceb',
        comment: '#6c7086',
      }
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    vars: {
      '--primary': '#58a6ff',
      '--background': '#161b22',
      '--background-elevated': '#1e242c',
      '--muted': '#21262d',
      '--background-panel': '#0d1117',
      '--foreground': '#e6edf3',
      '--muted-foreground': '#484f58',
      '--destructive': '#f85149',
    },
    editor: {
      background: '#0d1117',
      gutterBorder: '1px solid #21262d',
      gutterBackground: '#0d1117',
      gutterForeground: '#484f58',
      gutterActiveForeground: '#e6edf3',
      caret: '#58a6ff',
      selectionBackground: '#1f3a5f',
      tooltip: {
        tooltipBackground: '#0d1117',
        tooltipForeground: '#e6edf3',
        activeItemBackground: '#58a6ff',
        activeItemForeground: '#0d1117',
      }
    },
    tokens: {
      comment: '#484f58', keyword: '#ff7b72', attrName: '#7ee787', attrValue: '#a5d6ff', url: '#58a6ff', varName: '#ffa657', varNameBg: '#1e1200', annotation: '#58a6ff', string: '#a5d6ff', number: '#79c0ff', bool: '#ff7b72', propName: '#7ee787', null: '#ff7b72', separator: '#484f58', squareBracket: '#e6edf3', brace: '#e6edf3',
      environment: {
        environmentName: '#58a6ff',
        key: '#7ee787',
        operator: '#484f58',
        value: '#a5d6ff',
        url: '#79c0ff',
        comment: '#484f58',
      }
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    vars: {
      '--primary': '#61afef',
      '--background': '#282c34',
      '--background-elevated': '#2e3340',
      '--muted': '#3e4451',
      '--background-panel': '#21252b',
      '--foreground': '#abb2bf',
      '--muted-foreground': '#5c6370',
      '--destructive': '#e06c75',
    },
    editor: {
      background: '#21252b',
      gutterBorder: '1px solid #3e4451',
      gutterBackground: '#21252b',
      gutterForeground: '#5c6370',
      gutterActiveForeground: '#abb2bf',
      caret: '#61afef',
      selectionBackground: '#3e4451',
      tooltip: {
        tooltipBackground: '#21252b',
        tooltipForeground: '#abb2bf',
        activeItemBackground: '#61afef',
        activeItemForeground: '#21252b',
      }
    },
    tokens: {
      comment: '#5c6370', keyword: '#c678dd', attrName: '#98c379', attrValue: '#e5c07b', url: '#61afef', varName: '#e5c07b', varNameBg: '#1e1800', annotation: '#61afef', string: '#98c379', number: '#d19a66', bool: '#c678dd', propName: '#e06c75', null: '#c678dd', separator: '#5c6370', squareBracket: '#abb2bf', brace: '#abb2bf',
      environment: {
        environmentName: '#61afef',
        key: '#98c379',
        operator: '#5c6370',
        value: '#e5c07b',
        url: '#56b6c2',
        comment: '#5c6370',
      }
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    vars: {
      '--primary': '#7aa2f7',
      '--background': '#1a1b26',
      '--background-elevated': '#222337',
      '--muted': '#24283b',
      '--background-panel': '#16161e',
      '--foreground': '#c0caf5',
      '--muted-foreground': '#565f89',
      '--destructive': '#f7768e',
    },
    editor: {
      background: '#16161e',
      gutterBorder: '1px solid #24283b',
      gutterBackground: '#16161e',
      gutterForeground: '#565f89',
      gutterActiveForeground: '#c0caf5',
      caret: '#7aa2f7',
      selectionBackground: '#283457',
      tooltip: {
        tooltipBackground: '#16161e',
        tooltipForeground: '#c0caf5',
        activeItemBackground: '#7aa2f7',
        activeItemForeground: '#16161e',
      }
    },
    tokens: {
      comment: '#565f89', keyword: '#9d7cd8', attrName: '#73daca', attrValue: '#e0af68', url: '#7aa2f7', varName: '#e0af68', varNameBg: '#1e1800', annotation: '#7aa2f7', string: '#9ece6a', number: '#ff9e64', bool: '#9d7cd8', propName: '#73daca', null: '#f7768e', separator: '#565f89', squareBracket: '#c0caf5', brace: '#c0caf5',
      environment: {
        environmentName: '#7aa2f7',
        key: '#73daca',
        operator: '#565f89',
        value: '#e0af68',
        url: '#b4f9f8',
        comment: '#565f89',
      }
    },
  },
  {
    id: 'everforest',
    name: 'Everforest',
    vars: {
      '--primary': '#83c092',
      '--background': '#2d353b',
      '--background-elevated': '#374046',
      '--muted': '#3d484d',
      '--background-panel': '#272e33',
      '--foreground': '#d3c6aa',
      '--muted-foreground': '#7a8478',
      '--destructive': '#e67e80',
    },
    editor: {
      background: '#272e33',
      gutterBorder: '1px solid #3d484d',
      gutterBackground: '#272e33',
      gutterForeground: '#7a8478',
      gutterActiveForeground: '#d3c6aa',
      caret: '#83c092',
      selectionBackground: '#424d45',
      tooltip: {
        tooltipBackground: '#272e33',
        tooltipForeground: '#d3c6aa',
        activeItemBackground: '#83c092',
        activeItemForeground: '#272e33',
      }
    },
    tokens: {
      comment: '#7a8478', keyword: '#e67e80', attrName: '#83c092', attrValue: '#dbbc7f', url: '#7fbbb3', varName: '#dbbc7f', varNameBg: '#1e1900', annotation: '#7fbbb3', string: '#a7c080', number: '#d699b6', bool: '#e67e80', propName: '#83c092', null: '#e67e80', separator: '#7a8478', squareBracket: '#d3c6aa', brace: '#d3c6aa',
      environment: {
        environmentName: '#7fbbb3',
        key: '#83c092',
        operator: '#7a8478',
        value: '#dbbc7f',
        url: '#7fbbb3',
        comment: '#7a8478',
      }
    },
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    vars: {
      '--primary': '#fabd2f',
      '--background': '#282828',
      '--background-elevated': '#32302f',
      '--muted': '#3c3836',
      '--background-panel': '#1d2021',
      '--foreground': '#ebdbb2',
      '--muted-foreground': '#928374',
      '--destructive': '#fb4934',
    },
    editor: {
      background: '#1d2021',
      gutterBorder: '1px solid #3c3836',
      gutterBackground: '#1d2021',
      gutterForeground: '#928374',
      gutterActiveForeground: '#ebdbb2',
      caret: '#fabd2f',
      selectionBackground: '#504945',
      tooltip: {
        tooltipBackground: '#1d2021',
        tooltipForeground: '#ebdbb2',
        activeItemBackground: '#fabd2f',
        activeItemForeground: '#1d2021',
      }
    },
    tokens: {
      comment: '#928374', keyword: '#fb4934', attrName: '#b8bb26', attrValue: '#fabd2f', url: '#83a598', varName: '#fabd2f', varNameBg: '#1e1700', annotation: '#83a598', string: '#b8bb26', number: '#d3869b', bool: '#fb4934', propName: '#8ec07c', null: '#fb4934', separator: '#928374', squareBracket: '#ebdbb2', brace: '#ebdbb2',
      environment: {
        environmentName: '#83a598',
        key: '#8ec07c',
        operator: '#928374',
        value: '#fabd2f',
        url: '#83a598',
        comment: '#928374',
      }
    },
  },
  {
    id: 'ayu-dark',
    name: 'Ayu Dark',
    vars: {
      '--primary': '#ffb454',
      '--background': '#0d1017',
      '--background-elevated': '#151a24',
      '--muted': '#131721',
      '--background-panel': '#0a0e14',
      '--foreground': '#bfbdb6',
      '--muted-foreground': '#3d4354',
      '--destructive': '#f07178',
    },
    editor: {
      background: '#0a0e14',
      gutterBorder: '1px solid #131721',
      gutterBackground: '#0a0e14',
      gutterForeground: '#3d4354',
      gutterActiveForeground: '#bfbdb6',
      caret: '#ffb454',
      selectionBackground: '#1e2432',
      tooltip: {
        tooltipBackground: '#0a0e14',
        tooltipForeground: '#bfbdb6',
        activeItemBackground: '#ffb454',
        activeItemForeground: '#0a0e14',
      }
    },
    tokens: {
      comment: '#3d4354', keyword: '#ff8f40', attrName: '#59c2ff', attrValue: '#aad94c', url: '#73b8ff', varName: '#ffb454', varNameBg: '#1e1500', annotation: '#73b8ff', string: '#aad94c', number: '#d2a6ff', bool: '#ff8f40', propName: '#59c2ff', null: '#f07178', separator: '#3d4354', squareBracket: '#bfbdb6', brace: '#bfbdb6',
      environment: {
        environmentName: '#73b8ff',
        key: '#59c2ff',
        operator: '#3d4354',
        value: '#aad94c',
        url: '#73b8ff',
        comment: '#3d4354',
      }
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    vars: {
      '--primary': '#268bd2',
      '--background': '#eee8d5',
      '--background-elevated': '#fdf6e3',
      '--muted': '#e4dfc8',
      '--background-panel': '#fdf6e3',
      '--foreground': '#073642',
      '--muted-foreground': '#93a1a1',
      '--destructive': '#dc322f',
    },
    editor: {
      background: '#fdf6e3',
      gutterBorder: '1px solid #e4dfc8',
      gutterBackground: '#fdf6e3',
      gutterForeground: '#93a1a1',
      gutterActiveForeground: '#073642',
      caret: '#268bd2',
      selectionBackground: '#d3cbb6',
      tooltip: {
        tooltipBackground: '#fdf6e3',
        tooltipForeground: '#073642',
        activeItemBackground: '#268bd2',
        activeItemForeground: '#fdf6e3',
      }
    },
    tokens: {
      comment: '#93a1a1', keyword: '#859900', attrName: '#2aa198', attrValue: '#268bd2', url: '#073642', varName: '#b58900', varNameBg: '#f5efcf', annotation: '#268bd2', string: '#2aa198', number: '#d33682', bool: '#6c71c4', propName: '#2aa198', null: '#6c71c4', separator: '#93a1a1', squareBracket: '#657b83', brace: '#657b83',
      environment: {
        environmentName: '#268bd2',
        key: '#2aa198',
        operator: '#93a1a1',
        value: '#859900',
        url: '#2aa198',
        comment: '#93a1a1',
      }
    },
  },
];