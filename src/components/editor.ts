/**
 * A small, opinionated CodeMirror 6 setup for Python.
 *
 * Colours come from CSS custom properties (see global.css) so the editor
 * re-themes with the rest of the page without rebuilding the extension.
 */
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, highlightSpecialChars } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting, indentUnit, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { tags as t } from "@lezer/highlight";

const pythonHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.moduleKeyword, t.controlKeyword], color: "var(--tok-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--tok-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--tok-number)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--tok-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--tok-function)" },
  { tag: [t.standard(t.variableName), t.self], color: "var(--tok-builtin)" },
  { tag: [t.operator, t.operatorKeyword, t.derefOperator], color: "var(--tok-operator)" },
  { tag: [t.className, t.definition(t.className), t.typeName], color: "var(--tok-class)" },
  { tag: [t.variableName, t.propertyName, t.attributeName], color: "var(--tok-variable)" },
  { tag: [t.punctuation, t.bracket, t.paren, t.squareBracket, t.brace], color: "var(--text-muted)" },
  { tag: t.invalid, color: "#f87171" },
]);

const surface = EditorView.theme({
  "&": { color: "var(--text)", backgroundColor: "transparent" },
  ".cm-content": { padding: "0.75rem 0", caretColor: "var(--accent)" },
  ".cm-line": { padding: "0 1rem" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in oklab, var(--accent) 28%, transparent)",
  },
  ".cm-matchingBracket, .cm-nonmatchingBracket": {
    backgroundColor: "color-mix(in oklab, var(--accent) 22%, transparent)",
    outline: "none",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-strong)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "color-mix(in oklab, var(--accent) 22%, transparent)",
    color: "var(--text)",
  },
  ".cm-foldGutter span": { color: "var(--text-faint)" },
});

export interface EditorOptions {
  doc: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  /** Ctrl/Cmd+Enter — the muscle-memory shortcut for "run this". */
  onRun?: () => void;
}

export function createEditor(parent: HTMLElement, options: EditorOptions): EditorView {
  const extensions: Extension[] = [
    lineNumbers(),
    foldGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    rectangularSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    indentUnit.of("    "),
    python(),
    syntaxHighlighting(pythonHighlight),
    surface,
    EditorView.lineWrapping,
    keymap.of([
      {
        key: "Mod-Enter",
        preventDefault: true,
        run: () => {
          options.onRun?.();
          return true;
        },
      },
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
  ];

  if (options.readOnly) {
    extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
  } else if (options.onChange) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) options.onChange!(update.state.doc.toString());
      })
    );
  }

  return new EditorView({
    state: EditorState.create({ doc: options.doc, extensions }),
    parent,
  });
}
