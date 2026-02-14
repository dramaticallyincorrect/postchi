// src/lib/httpLanguage.ts
import { Monaco } from '@monaco-editor/react';

export function registerHttpLanguage(monaco: Monaco) {
    // Register the language
    monaco.languages.register({ id: 'customHttp' });

    // Define syntax highlighting
    monaco.languages.setMonarchTokensProvider('customHttp', {
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        tokenizer: {
            root: [
                // Line comments
                [/\/\/.*$/, 'comment'],

                // Whitespace
                [/\s+/, 'white'],

                // HTTP method (any string followed by space)
                [/^[^\s]+(?=\s)/, { token: 'keyword.method', next: '@url' }],
            ],

            url: [
                // Variable in URL
                [/<<[^>]+>>/, 'variable'],

                // URL content
                [/[^<\n]+/, 'string'],

                // Less-than sign that's not part of variable
                [/<(?!<)/, 'string'],

                // End of line - go to headers
                [/$/, { token: '', next: '@headers' }],
            ],

            headers: [
                // Line comments
                [/\/\/.*$/, 'comment'],

                // Whitespace
                [/\s+/, 'white'],

                [/^[@]body/, { token: 'keyword.bodyStart', next: '@bodyState' }],

                // Header key
                [/[a-zA-Z_][\w-]*(?=\s*=)/, 'attribute.name'],

                // Equals sign
                [/=/, 'operator', '@headerValue'],
            ],

            headerValue: [
                // Whitespace
                [/\s+/, 'white'],

                // Function call
                [/[a-zA-Z_]\w*(?=\()/, 'function', '@functionCall'],

                // Variable
                [/<<[\w]*>>\s*$/, 'variable', '@pop'],

                // String (everything else until newline)
                [/[^<(\n]+/, 'attribute.value', '@pop'],

                // Less-than sign that's not part of variable
                // [/<(?!<)/, 'attribute.value', '@pop'],

                // End of line - pop back to headers
                [/$/, { token: '', next: '@pop' }],
            ],

            bodyState: [
                { include: '@whitespaceInline' },

                // Variables and Functions (anywhere in the body)
                [/<<[^>]+>>/, 'variable'],
                [/[a-zA-Z_]\w*(?=\()/, 'function', '@functionCall'],

                // Key-Value pairs inside body (like JSON keys or Form-data)
                [/"([^"\\]|\\.)*"(?=\s*:)/, 'attribute.name'], // JSON Keys
                [/[a-zA-Z_][\w-]*(?=\s*=)/, 'attribute.name'], // Form Keys

                // Symbols common in JSON/Raw text
                [/[{}[\],]/, 'delimiter'],
                [/[=:]/, 'operator'],

                // Everything else as string/text
                [/[^<({[\], \t\n\r]+/, 'string'],

                // Handle newlines but stay in bodyState
                [/[\n\r]+/, 'white'],
            ],

            functionCall: [
                // Opening parenthesis
                [/\(/, 'delimiter.parenthesis', '@functionParams'],
            ],

            functionParams: [
                // Whitespace
                [/\s+/, 'white'],

                // Nested function call
                [/[a-zA-Z_]\w*(?=\()/, 'function', '@functionCall'],

                // Variable
                [/<<[\w]*>>(?![\w])+/, 'variable'],

                // String content
                [/[^<(),\n]+/, 'string'],

                // Less-than sign that's not part of variable
                // [/<(?!<)/, 'string'],

                // Comma separator
                [/,/, 'delimiter'],

                // Closing parenthesis
                [/\)/, 'delimiter.parenthesis'],
                // End of line - pop back to headers
                [/$/, { token: '', next: '@headers' }],
            ],

            whitespaceInline: [
                [/[ \t]+/, 'white'],
                [/\/\/.*$/, 'comment'],
            ]
        },
    });

    // Define theme colors
    monaco.editor.defineTheme('customHttp', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // --- HTTP Method & URL ---
            { token: 'keyword.method', foreground: '#C586C0', fontStyle: 'bold' },
            { token: 'keyword.bodyStart', foreground: '#FFD700', fontStyle: 'bold' },
            { token: 'variable', foreground: '#4EC9B0' },
            { token: 'string', foreground: '#CE9178' },

            // --- Headers ---
            { token: 'attribute.name', foreground: '#9CDCFE' }, // Light Blue
            { token: 'operator', foreground: '#D4D4D4' },       // Silver/Grey
            { token: 'attribute.value', foreground: '#CE9178' },

            // --- Functions & Parameters ---
            { token: 'function', foreground: '#DCDCAA' },       // Soft Yellow
            { token: 'delimiter.parenthesis', foreground: '#FFD700' }, // Gold brackets
            { token: 'delimiter.comma', foreground: '#D4D4D4' },

            // --- General ---
            { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' },
            { token: 'white', foreground: '#D4D4D4' },
            { token: '', foreground: '#CE9178' },
        ],
        colors: {
            'editor.background': '#1e1e1e',
        },
    });

    monaco.editor.setTheme('customHttp');

    // Configure autocomplete
    monaco.languages.registerCompletionItemProvider('customHttp', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const line = model.getLineContent(position.lineNumber);
            const isFirstLine = position.lineNumber === 1;
            const isAfterBody = model.getValue().split('\n').slice(0, position.lineNumber - 1).some(l => l.trim() === 'body:');

            let suggestions: monaco.languages.CompletionItem[] = [];

            // HTTP methods (only on first line)
            if (isFirstLine && position.column <= 10) {
                const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
                suggestions = methods.map(method => ({
                    label: method,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: method + ' ',
                    range,
                }));
            }

            // Built-in functions
            if (line.includes('=') || isAfterBody) {
                const functions = [
                    { label: 'uuid()', detail: 'Generate a UUID', insertText: 'uuid()' },
                    { label: 'basic()', detail: 'Basic authentication', insertText: 'basic()' },
                ];
                suggestions.push(...functions.map(fn => ({
                    label: fn.label,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: fn.insertText,
                    detail: fn.detail,
                    range,
                })));
            }

            // Environment variables
            const envVars = ['API_KEY', 'BASE_URL', 'AUTH_TOKEN', 'USER_ID']; // Add your env vars
            suggestions.push(...envVars.map(env => ({
                label: `<<${env}>>`,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: `<<${env}>>`,
                detail: 'Environment variable',
                range,
            })));

            // Common headers (when not after body: and not first line)
            if (!isFirstLine && !isAfterBody && !line.trim().startsWith('body:')) {
                const headers = [
                    'Content-Type', 'Authorization', 'Accept', 'User-Agent',
                    'Cache-Control', 'Cookie', 'Host', 'Referer'
                ];
                suggestions.push(...headers.map(header => ({
                    label: header,
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: `${header} = `,
                    range,
                })));
            }

            // Body marker
            if (!isAfterBody && line.trim() === '') {
                suggestions.push({
                    label: 'body:',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'body:\n',
                    detail: 'Start of request body',
                    range,
                });
            }

            return { suggestions };
        },
    });
}