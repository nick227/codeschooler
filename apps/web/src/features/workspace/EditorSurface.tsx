import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { Diagnostic as CmDiagnostic, lintGutter, setDiagnostics } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, undo } from '@codemirror/commands'
import type { Diagnostic } from '@code-trainer/language-javascript'

export interface EditorHandle { undo: () => void; focus: () => void; insert: (text: string) => void }

interface Props {
  source: string
  diagnostic?: Diagnostic
  onChange: (source: string) => void
  onRun: () => void
  onCheck: () => void
}

export const EditorSurface = forwardRef<EditorHandle, Props>(function EditorSurface(
  { source, diagnostic, onChange, onRun, onCheck },
  ref,
) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView>()
  const changeRef = useRef(onChange)
  const runRef = useRef(onRun)
  const checkRef = useRef(onCheck)
  const diagnosticRef = useRef(diagnostic)
  changeRef.current = onChange
  runRef.current = onRun
  checkRef.current = onCheck

  useEffect(() => {
    if (!host.current) return
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: source,
        extensions: [
          basicSetup,
          history(),
          javascript(),
          lintGutter(),
          keymap.of([
            { key: 'Mod-Enter', run: () => { runRef.current(); return true } },
            { key: 'Mod-Shift-Enter', run: () => { checkRef.current(); return true } },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) changeRef.current(update.state.doc.toString())
          }),
          EditorView.contentAttributes.of({
            'aria-label': 'JavaScript code editor',
            'aria-description': 'Press Control or Command Enter to run. Add Shift to check your work.',
          }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '16px', backgroundColor: '#fbfcf9' },
            '.cm-content': { padding: '24px 0', caretColor: '#3157b7', fontFamily: '"IBM Plex Mono", monospace', lineHeight: '1.75' },
            '.cm-line': { padding: '0 24px' },
            '.cm-gutters': { backgroundColor: '#f1f4f0', color: '#879197', border: 'none', paddingTop: '24px' },
            '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#3157b70d' },
            '&.cm-focused': { outline: 'none' },
            '&.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: '#3157b72e !important' },
            '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px wavy #a8462b' },
            '.ͼb': { color: '#3157b7' }, '.ͼd': { color: '#116b57' }, '.ͼe': { color: '#a8462b' }, '.ͼm': { color: '#66727c' },
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  useEffect(() => {
    diagnosticRef.current = diagnostic
    const view = viewRef.current
    if (!view) return
    const items: CmDiagnostic[] = diagnostic ? [{
      from: Math.max(0, Math.min(diagnostic.column - 1, view.state.doc.length)),
      to: Math.max(1, Math.min(diagnostic.column, view.state.doc.length || 1)),
      severity: 'error',
      message: diagnostic.message,
    }] : []
    view.dispatch(setDiagnostics(view.state, items))
  }, [diagnostic])

  useEffect(() => {
    const view = viewRef.current
    if (!view || view.state.doc.toString() === source) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: source } })
  }, [source])

  useImperativeHandle(ref, () => ({
    undo: () => { const view = viewRef.current; if (view) undo(view) },
    focus: () => viewRef.current?.focus(),
    insert: (text) => {
      const view = viewRef.current
      if (!view) return
      view.dispatch({ changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: text }, selection: { anchor: view.state.selection.main.from + text.length } })
      view.focus()
    },
  }))

  return <div ref={host} className="editor-host" aria-label="JavaScript code editor" />
})
