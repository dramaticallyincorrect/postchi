import { PostchiTheme } from "./theme";
let styleEl: HTMLStyleElement | null = null;

export function applyThemeToCSSVars(theme: PostchiTheme) {
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "active-theme";
        document.head.appendChild(styleEl);
    }

    const declarations = Object.entries(theme.vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join("\n");

    // Injecting on :root means Tailwind's var() references resolve automatically
    styleEl.textContent = `:root {\n${declarations}\n}`;
}


/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          CODEMIRROR 6 — CURATED THEME COLLECTION         ║
 * ║                                                          ║
 * ║  1. Obsidian Marble   — dark, cool, mineral              ║
 * ║  2. Cremeria          — warm cream & burnt sienna        ║
 * ║  3. Neon Residue      — cyberpunk terminal               ║
 * ║  4. Arctic Paper      — crisp Scandinavian light         ║
 * ║  5. Vermillion Dusk   — deep burgundy & gold             ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   import { obsidianMarble } from './codemirror-themes.js'
 *   new EditorView({ extensions: [obsidianMarble] })
 *
 * Requires: @codemirror/view, @codemirror/language, @codemirror/state
 */


import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView, Extension } from "@uiw/react-codemirror";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: compose theme + highlight into a single extension array
// ─────────────────────────────────────────────────────────────────────────────
function mkTheme(view: Extension, hl: HighlightStyle) {
  return [syntaxHighlighting(hl)]
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. OBSIDIAN MARBLE
//    Deep charcoal with blue-grey veins. Sophisticated, icy, mineral.
//    Inspired by polished stone and high-end code editors.
// ═════════════════════════════════════════════════════════════════════════════
const obsidianMarbleView = EditorView.theme({
  '&': {
    color: '#cdd6f4',
    backgroundColor: '#0f1117',
    fontFamily: '"Iosevka", "Cascadia Code", "Fira Code", monospace',
    fontSize: '14px',
  },
  '.cm-content': {
    caretColor: '#89b4fa',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#89b4fa',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#89b4fa',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#1e2640',
  },
  '.cm-gutters': {
    backgroundColor: '#090b0f',
    color: '#3b4261',
    border: 'none',
    borderRight: '1px solid #1a1d2e',
  },
  '.cm-gutterElement': {
    padding: '0 12px 0 8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#131520',
    color: '#565f89',
  },
  '.cm-activeLine': {
    backgroundColor: '#131520',
  },
  '.cm-lineNumbers': {
    color: '#3b4261',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#1e2640',
    border: '1px solid #3b4261',
    color: '#89b4fa',
    borderRadius: '3px',
  },
  '.cm-tooltip': {
    backgroundColor: '#1e2640',
    border: '1px solid #3b4261',
    borderRadius: '6px',
    color: '#cdd6f4',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#2a2f4a',
    color: '#cdd6f4',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#2a3a5e',
    outline: '1px solid #89b4fa44',
  },
  '.cm-searchMatch': {
    backgroundColor: '#89b4fa22',
    outline: '1px solid #89b4fa55',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#89b4fa44',
  },
  '.cm-panels': {
    backgroundColor: '#090b0f',
    color: '#cdd6f4',
  },
  '.cm-panel.cm-search': {
    backgroundColor: '#0f1117',
    borderTop: '1px solid #1a1d2e',
    padding: '8px 12px',
  },
}, { dark: true })

export const obsidianMarbleHL = HighlightStyle.define([
  { tag: t.keyword,              color: '#89b4fa', fontWeight: '500' },
  { tag: t.controlKeyword,       color: '#cba6f7' },
  { tag: t.operatorKeyword,      color: '#89dceb' },
  { tag: t.definitionKeyword,    color: '#89b4fa' },
  { tag: t.moduleKeyword,        color: '#89b4fa' },
  { tag: t.operator,             color: '#89dceb' },
  { tag: t.punctuation,          color: '#7f849c' },
  { tag: t.bracket,              color: '#7f849c' },
  { tag: t.string,               color: '#a6e3a1' },
  { tag: t.special(t.string),    color: '#94e2d5' },
  { tag: t.number,               color: '#fab387' },
  { tag: t.bool,                 color: '#fab387' },
  { tag: t.null,                 color: '#f38ba8' },
  { tag: t.comment,              color: '#45475a', fontStyle: 'italic' },
  { tag: t.lineComment,          color: '#45475a', fontStyle: 'italic' },
  { tag: t.blockComment,         color: '#45475a', fontStyle: 'italic' },
  { tag: t.name,                 color: '#cdd6f4' },
  { tag: t.variableName,         color: '#cdd6f4' },
  { tag: t.definition(t.variableName), color: '#89b4fa' },
  { tag: t.local(t.variableName),      color: '#cdd6f4' },
  { tag: t.function(t.variableName),   color: '#89b4fa' },
  { tag: t.function(t.propertyName),   color: '#89b4fa' },
  { tag: t.definition(t.function(t.variableName)), color: '#cba6f7' },
  { tag: t.propertyName,         color: '#cba6f7' },
  { tag: t.attributeName,        color: '#89b4fa' },
  { tag: t.attributeValue,       color: '#a6e3a1' },
  { tag: t.className,            color: '#f9e2af' },
  { tag: t.tagName,              color: '#f38ba8' },
  { tag: t.typeName,             color: '#f9e2af' },
  { tag: t.typeOperator,         color: '#89dceb' },
  { tag: t.namespace,            color: '#f9e2af' },
  { tag: t.meta,                 color: '#7f849c' },
  { tag: t.regexp,               color: '#94e2d5' },
  { tag: t.escape,               color: '#f2cdcd' },
  { tag: t.url,                  color: '#89b4fa', textDecoration: 'underline' },
  { tag: t.heading,              color: '#89b4fa', fontWeight: 'bold' },
  { tag: t.strong,               fontWeight: 'bold' },
  { tag: t.emphasis,             fontStyle: 'italic' },
  { tag: t.strikethrough,        textDecoration: 'line-through' },
])

export const obsidianMarble = mkTheme(obsidianMarbleView, obsidianMarbleHL)


// ═════════════════════════════════════════════════════════════════════════════
// 2. CREMERIA
//    Aged parchment and burnt sienna. Warm ivory background, ink-brown text.
//    Like writing code with a fountain pen in a leather-bound notebook.
// ═════════════════════════════════════════════════════════════════════════════
const cremeriaView = EditorView.theme({
  '&': {
    color: '#2c1a0e',
    backgroundColor: '#f5eedd',
    fontFamily: '"Hack", "Iosevka", "Source Code Pro", monospace',
    fontSize: '14px',
  },
  '.cm-content': {
    caretColor: '#8b3a2c',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#8b3a2c',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#e2ceae',
  },
  '.cm-gutters': {
    backgroundColor: '#ede5d0',
    color: '#b89f7e',
    border: 'none',
    borderRight: '1px solid #d6c9a8',
  },
  '.cm-gutterElement': {
    padding: '0 12px 0 8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e2ceae',
    color: '#8b6442',
  },
  '.cm-activeLine': {
    backgroundColor: '#ede5d088',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#e2ceae',
    border: '1px solid #b89f7e',
    color: '#8b3a2c',
    borderRadius: '3px',
  },
  '.cm-tooltip': {
    backgroundColor: '#ede5d0',
    border: '1px solid #b89f7e',
    borderRadius: '4px',
    color: '#2c1a0e',
    boxShadow: '0 2px 8px #2c1a0e22',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#d6c9a8',
    outline: '1px solid #8b6442',
  },
  '.cm-searchMatch': {
    backgroundColor: '#d4a57433',
    outline: '1px solid #8b3a2c66',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#d4a57466',
  },
  '.cm-panels': {
    backgroundColor: '#ede5d0',
    color: '#2c1a0e',
  },
}, { dark: false })

const cremeriaHL = HighlightStyle.define([
  { tag: t.keyword,              color: '#8b3a2c', fontWeight: '600' },
  { tag: t.controlKeyword,       color: '#7a2e1a', fontWeight: '600' },
  { tag: t.operatorKeyword,      color: '#5c6e2e' },
  { tag: t.definitionKeyword,    color: '#8b3a2c', fontWeight: '600' },
  { tag: t.moduleKeyword,        color: '#8b3a2c' },
  { tag: t.operator,             color: '#5c3a1a' },
  { tag: t.punctuation,          color: '#9e8060' },
  { tag: t.bracket,              color: '#9e8060' },
  { tag: t.string,               color: '#3d6b44' },
  { tag: t.special(t.string),    color: '#5c8e5c' },
  { tag: t.number,               color: '#a04a18' },
  { tag: t.bool,                 color: '#a04a18', fontWeight: '600' },
  { tag: t.null,                 color: '#a04a18', fontStyle: 'italic' },
  { tag: t.comment,              color: '#b89f7e', fontStyle: 'italic' },
  { tag: t.lineComment,          color: '#b89f7e', fontStyle: 'italic' },
  { tag: t.blockComment,         color: '#b89f7e', fontStyle: 'italic' },
  { tag: t.name,                 color: '#2c1a0e' },
  { tag: t.variableName,         color: '#2c1a0e' },
  { tag: t.definition(t.variableName), color: '#3b4e7a' },
  { tag: t.function(t.variableName),   color: '#3b4e7a', fontWeight: '500' },
  { tag: t.function(t.propertyName),   color: '#3b4e7a' },
  { tag: t.definition(t.function(t.variableName)), color: '#2e3f6b', fontWeight: '600' },
  { tag: t.propertyName,         color: '#5c3a80' },
  { tag: t.attributeName,        color: '#8b3a2c' },
  { tag: t.attributeValue,       color: '#3d6b44' },
  { tag: t.className,            color: '#6b4a0e', fontWeight: '600' },
  { tag: t.tagName,              color: '#8b3a2c', fontWeight: '500' },
  { tag: t.typeName,             color: '#6b4a0e' },
  { tag: t.typeOperator,         color: '#5c6e2e' },
  { tag: t.namespace,            color: '#6b4a0e' },
  { tag: t.meta,                 color: '#b89f7e' },
  { tag: t.regexp,               color: '#5c8e5c' },
  { tag: t.escape,               color: '#a04a18' },
  { tag: t.url,                  color: '#3b4e7a', textDecoration: 'underline' },
  { tag: t.heading,              color: '#8b3a2c', fontWeight: 'bold' },
  { tag: t.strong,               fontWeight: 'bold' },
  { tag: t.emphasis,             fontStyle: 'italic' },
])

export const cremeria = mkTheme(cremeriaView, cremeriaHL)


// ═════════════════════════════════════════════════════════════════════════════
// 3. NEON RESIDUE
//    Pure black terminal, acid green primaries, hot magenta accents.
//    Like data dripping through a rain-slicked neon city at 3am.
// ═════════════════════════════════════════════════════════════════════════════
const neonResidueView = EditorView.theme({
  '&': {
    color: '#c8ffc8',
    backgroundColor: '#050505',
    fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
    fontSize: '13.5px',
  },
  '.cm-content': {
    caretColor: '#00ff41',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#00ff41',
    borderLeftWidth: '2px',
    boxShadow: '0 0 6px #00ff4188',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#00ff4118',
  },
  '.cm-gutters': {
    backgroundColor: '#020202',
    color: '#1a5c1a',
    border: 'none',
    borderRight: '1px solid #0a2a0a',
  },
  '.cm-gutterElement': {
    padding: '0 12px 0 8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#061206',
    color: '#00cc33',
  },
  '.cm-activeLine': {
    backgroundColor: '#00ff410a',
    boxShadow: 'inset 0 0 0 1px #00ff4112',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#0a1a0a',
    border: '1px solid #00ff4155',
    color: '#00ff41',
    borderRadius: '2px',
    textShadow: '0 0 4px #00ff41',
  },
  '.cm-tooltip': {
    backgroundColor: '#0a0f0a',
    border: '1px solid #00ff4155',
    borderRadius: '2px',
    color: '#c8ffc8',
    boxShadow: '0 0 12px #00ff4122',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#00ff4122',
    color: '#00ff41',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#00ff4122',
    outline: '1px solid #00ff4166',
    textShadow: '0 0 4px #00ff41',
  },
  '.cm-searchMatch': {
    backgroundColor: '#ff00ff22',
    outline: '1px solid #ff00ff55',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ff00ff44',
  },
  '.cm-panels': {
    backgroundColor: '#020202',
    color: '#c8ffc8',
    borderTop: '1px solid #0a2a0a',
  },
  '.cm-scroller': {
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 23px, #00ff4104 24px)',
  },
}, { dark: true })

const neonResidueHL = HighlightStyle.define([
  { tag: t.keyword,              color: '#ff00ff', fontWeight: '600', textShadow: '0 0 6px #ff00ff88' },
  { tag: t.controlKeyword,       color: '#ff00ff', fontWeight: '700', textShadow: '0 0 8px #ff00ff' },
  { tag: t.operatorKeyword,      color: '#00e5ff' },
  { tag: t.definitionKeyword,    color: '#ff00ff' },
  { tag: t.moduleKeyword,        color: '#ff6600' },
  { tag: t.operator,             color: '#00e5ff' },
  { tag: t.punctuation,          color: '#2a5a2a' },
  { tag: t.bracket,              color: '#00ff4177' },
  { tag: t.string,               color: '#ffee00', textShadow: '0 0 4px #ffee0066' },
  { tag: t.special(t.string),    color: '#ffe066' },
  { tag: t.number,               color: '#ff6600', textShadow: '0 0 4px #ff660066' },
  { tag: t.bool,                 color: '#ff6600', fontWeight: '600' },
  { tag: t.null,                 color: '#ff003c', textShadow: '0 0 4px #ff003c66' },
  { tag: t.comment,              color: '#1a5c1a', fontStyle: 'italic' },
  { tag: t.lineComment,          color: '#1a5c1a', fontStyle: 'italic' },
  { tag: t.blockComment,         color: '#1a5c1a', fontStyle: 'italic' },
  { tag: t.name,                 color: '#c8ffc8' },
  { tag: t.variableName,         color: '#c8ffc8' },
  { tag: t.definition(t.variableName), color: '#00ff41', textShadow: '0 0 4px #00ff4155' },
  { tag: t.function(t.variableName),   color: '#00ff41', textShadow: '0 0 5px #00ff4188' },
  { tag: t.function(t.propertyName),   color: '#00ff41' },
  { tag: t.definition(t.function(t.variableName)), color: '#00ff41', fontWeight: '600', textShadow: '0 0 8px #00ff41' },
  { tag: t.propertyName,         color: '#66ffcc' },
  { tag: t.attributeName,        color: '#ff00ff' },
  { tag: t.attributeValue,       color: '#ffee00' },
  { tag: t.className,            color: '#00e5ff', textShadow: '0 0 5px #00e5ff66' },
  { tag: t.tagName,              color: '#ff00ff' },
  { tag: t.typeName,             color: '#00e5ff' },
  { tag: t.typeOperator,         color: '#00e5ff' },
  { tag: t.namespace,            color: '#00e5ff' },
  { tag: t.meta,                 color: '#2a5a2a' },
  { tag: t.regexp,               color: '#66ffcc' },
  { tag: t.escape,               color: '#ff6600' },
  { tag: t.url,                  color: '#00e5ff', textDecoration: 'underline' },
  { tag: t.heading,              color: '#ff00ff', fontWeight: 'bold', textShadow: '0 0 8px #ff00ff' },
  { tag: t.strong,               fontWeight: 'bold' },
  { tag: t.emphasis,             fontStyle: 'italic', color: '#66ffcc' },
])

export const neonResidue = mkTheme(neonResidueView, neonResidueHL)


// ═════════════════════════════════════════════════════════════════════════════
// 4. ARCTIC PAPER
//    Crisp white with steel-blue accents. Scandinavian minimalism.
//    Clean, disciplined, typographically sensitive. Snow and slate.
// ═════════════════════════════════════════════════════════════════════════════
const arcticPaperView = EditorView.theme({
  '&': {
    color: '#1e2832',
    backgroundColor: '#f8fafc',
    fontFamily: '"IBM Plex Mono", "Input Mono", monospace',
    fontSize: '14px',
  },
  '.cm-content': {
    caretColor: '#2d6fa8',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#2d6fa8',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#d0e7f7',
  },
  '.cm-gutters': {
    backgroundColor: '#f0f4f8',
    color: '#9eb3c5',
    border: 'none',
    borderRight: '1px solid #dde6ed',
  },
  '.cm-gutterElement': {
    padding: '0 14px 0 8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e4eef5',
    color: '#5a8ba8',
  },
  '.cm-activeLine': {
    backgroundColor: '#eef4f9',
  },
  '.cm-lineNumbers': {
    minWidth: '3em',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#dde6ed',
    border: '1px solid #9eb3c5',
    color: '#2d6fa8',
    borderRadius: '3px',
  },
  '.cm-tooltip': {
    backgroundColor: '#f8fafc',
    border: '1px solid #c4d7e5',
    borderRadius: '6px',
    color: '#1e2832',
    boxShadow: '0 4px 16px #1e283211',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#d0e7f7',
    color: '#1e2832',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#c4dff0',
    outline: '1px solid #2d6fa8',
  },
  '.cm-searchMatch': {
    backgroundColor: '#2d6fa822',
    outline: '1px solid #2d6fa844',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#2d6fa844',
  },
  '.cm-panels': {
    backgroundColor: '#f0f4f8',
    color: '#1e2832',
    borderTop: '1px solid #dde6ed',
  },
}, { dark: false })

const arcticPaperHL = HighlightStyle.define([
  { tag: t.keyword,              color: '#1a5fa0', fontWeight: '600' },
  { tag: t.controlKeyword,       color: '#1a5fa0', fontWeight: '700' },
  { tag: t.operatorKeyword,      color: '#0d7a70' },
  { tag: t.definitionKeyword,    color: '#1a5fa0' },
  { tag: t.moduleKeyword,        color: '#4a3e8c' },
  { tag: t.operator,             color: '#3a6e8c' },
  { tag: t.punctuation,          color: '#7a9ab0' },
  { tag: t.bracket,              color: '#5a7a90' },
  { tag: t.string,               color: '#217a3a' },
  { tag: t.special(t.string),    color: '#1a6b50' },
  { tag: t.number,               color: '#a05010' },
  { tag: t.bool,                 color: '#a05010', fontWeight: '600' },
  { tag: t.null,                 color: '#8a2020', fontStyle: 'italic' },
  { tag: t.comment,              color: '#9eb3c5', fontStyle: 'italic' },
  { tag: t.lineComment,          color: '#9eb3c5', fontStyle: 'italic' },
  { tag: t.blockComment,         color: '#9eb3c5', fontStyle: 'italic' },
  { tag: t.name,                 color: '#1e2832' },
  { tag: t.variableName,         color: '#1e2832' },
  { tag: t.definition(t.variableName), color: '#1a5fa0' },
  { tag: t.function(t.variableName),   color: '#1a5fa0', fontWeight: '500' },
  { tag: t.function(t.propertyName),   color: '#1a5fa0' },
  { tag: t.definition(t.function(t.variableName)), color: '#1a4080', fontWeight: '600' },
  { tag: t.propertyName,         color: '#4a3e8c' },
  { tag: t.attributeName,        color: '#1a5fa0' },
  { tag: t.attributeValue,       color: '#217a3a' },
  { tag: t.className,            color: '#0d7a70', fontWeight: '600' },
  { tag: t.tagName,              color: '#8a2020', fontWeight: '500' },
  { tag: t.typeName,             color: '#0d7a70' },
  { tag: t.typeOperator,         color: '#0d7a70' },
  { tag: t.namespace,            color: '#0d7a70' },
  { tag: t.meta,                 color: '#9eb3c5' },
  { tag: t.regexp,               color: '#1a6b50' },
  { tag: t.escape,               color: '#a05010' },
  { tag: t.url,                  color: '#1a5fa0', textDecoration: 'underline' },
  { tag: t.heading,              color: '#1a5fa0', fontWeight: 'bold' },
  { tag: t.strong,               fontWeight: 'bold' },
  { tag: t.emphasis,             fontStyle: 'italic', color: '#4a3e8c' },
])

export const arcticPaper = mkTheme(arcticPaperView, arcticPaperHL)


// ═════════════════════════════════════════════════════════════════════════════
// 5. VERMILLION DUSK
//    Deep claret background, gold type, vermillion red highlights.
//    Rich, theatrical, confident. Like code written in a velvet-draped study.
// ═════════════════════════════════════════════════════════════════════════════
const vermillionDuskView = EditorView.theme({
  '&': {
    color: '#e8d5a8',
    backgroundColor: '#1a0a0e',
    fontFamily: '"Monaspace Neon", "Rec Mono", "Fira Code", monospace',
    fontSize: '14px',
  },
  '.cm-content': {
    caretColor: '#e8643c',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#e8643c',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#3a1a22',
  },
  '.cm-gutters': {
    backgroundColor: '#130708',
    color: '#5a2a33',
    border: 'none',
    borderRight: '1px solid #2a0f15',
  },
  '.cm-gutterElement': {
    padding: '0 12px 0 8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#220c12',
    color: '#a04040',
  },
  '.cm-activeLine': {
    backgroundColor: '#220c1288',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#3a1a22',
    border: '1px solid #5a2a33',
    color: '#e8643c',
    borderRadius: '3px',
  },
  '.cm-tooltip': {
    backgroundColor: '#220c12',
    border: '1px solid #5a2a33',
    borderRadius: '4px',
    color: '#e8d5a8',
    boxShadow: '0 4px 16px #00000066',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#3a1a22',
    color: '#e8d5a8',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#5a2020',
    outline: '1px solid #e8643c66',
  },
  '.cm-searchMatch': {
    backgroundColor: '#e8643c22',
    outline: '1px solid #e8643c55',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#e8643c44',
  },
  '.cm-panels': {
    backgroundColor: '#130708',
    color: '#e8d5a8',
    borderTop: '1px solid #2a0f15',
  },
}, { dark: true })

const vermillionDuskHL = HighlightStyle.define([
  { tag: t.keyword,              color: '#e8643c', fontWeight: '600' },
  { tag: t.controlKeyword,       color: '#c84030', fontWeight: '700' },
  { tag: t.operatorKeyword,      color: '#c8a04a' },
  { tag: t.definitionKeyword,    color: '#e8643c' },
  { tag: t.moduleKeyword,        color: '#d4782a' },
  { tag: t.operator,             color: '#c8a04a' },
  { tag: t.punctuation,          color: '#6a3a42' },
  { tag: t.bracket,              color: '#8a4a52' },
  { tag: t.string,               color: '#98c87a' },
  { tag: t.special(t.string),    color: '#7ab88a' },
  { tag: t.number,               color: '#d4a84a' },
  { tag: t.bool,                 color: '#e87844', fontWeight: '600' },
  { tag: t.null,                 color: '#a83040', fontStyle: 'italic' },
  { tag: t.comment,              color: '#5a2a33', fontStyle: 'italic' },
  { tag: t.lineComment,          color: '#5a2a33', fontStyle: 'italic' },
  { tag: t.blockComment,         color: '#5a2a33', fontStyle: 'italic' },
  { tag: t.name,                 color: '#e8d5a8' },
  { tag: t.variableName,         color: '#e8d5a8' },
  { tag: t.definition(t.variableName), color: '#f0c060' },
  { tag: t.function(t.variableName),   color: '#f0c060', fontWeight: '500' },
  { tag: t.function(t.propertyName),   color: '#f0c060' },
  { tag: t.definition(t.function(t.variableName)), color: '#f8d060', fontWeight: '600' },
  { tag: t.propertyName,         color: '#c8a04a' },
  { tag: t.attributeName,        color: '#e8643c' },
  { tag: t.attributeValue,       color: '#98c87a' },
  { tag: t.className,            color: '#e8a840', fontWeight: '600' },
  { tag: t.tagName,              color: '#c84030', fontWeight: '500' },
  { tag: t.typeName,             color: '#e8a840' },
  { tag: t.typeOperator,         color: '#c8a04a' },
  { tag: t.namespace,            color: '#e8a840' },
  { tag: t.meta,                 color: '#6a3a42' },
  { tag: t.regexp,               color: '#7ab88a' },
  { tag: t.escape,               color: '#d4a84a' },
  { tag: t.url,                  color: '#c8a04a', textDecoration: 'underline' },
  { tag: t.heading,              color: '#e8643c', fontWeight: 'bold' },
  { tag: t.strong,               fontWeight: 'bold' },
  { tag: t.emphasis,             fontStyle: 'italic', color: '#c8a04a' },
])

export const vermillionDusk = mkTheme(vermillionDuskView, vermillionDuskHL)


// ─────────────────────────────────────────────────────────────────────────────
// ALL THEMES — convenience export
// ─────────────────────────────────────────────────────────────────────────────
export const themes = {
  obsidianMarble,   // dark  · blue-grey mineral
  cremeria,         // light · warm parchment
  neonResidue,      // dark  · cyberpunk terminal
  arcticPaper,      // light · Scandinavian steel
  vermillionDusk,   // dark  · claret & gold
}

export default themes