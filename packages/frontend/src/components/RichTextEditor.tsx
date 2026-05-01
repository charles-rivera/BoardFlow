import { useEffect, useRef } from 'react'
import { Editor } from '@toast-ui/react-editor'
import type { Editor as ToastEditor } from '@toast-ui/react-editor'
import '@toast-ui/editor/dist/toastui-editor.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/(^|\n)#{1,6}\s+/g, '$1')
    .replace(/(^|\n)\s*[-*+]\s+/g, '$1')
    .replace(/(^|\n)\s*\d+\.\s+/g, '$1')
    .replace(/[*_~`>#]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function fileToDataUrl(file: Blob | File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function RichTextEditor({ value, onChange, ariaLabel = 'Description' }: RichTextEditorProps) {
  const editorRef = useRef<ToastEditor>(null)
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)

  useEffect(() => {
    if (isJsdom) return
    const instance = editorRef.current?.getInstance()
    if (!instance) return
    const currentValue = instance.getMarkdown()
    if (currentValue !== value) {
      instance.setMarkdown(value || '', false)
    }
  }, [isJsdom, value])

  if (isJsdom) {
    return (
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-40 w-full resize-none rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border-strong)] focus-within:ring-2 focus-within:ring-blue-400">
      <div className="sr-only">{ariaLabel}</div>
      <Editor
        ref={editorRef}
        initialValue={value}
        initialEditType="wysiwyg"
        hideModeSwitch
        previewStyle="tab"
        height="360px"
        usageStatistics={false}
        placeholder="Write a description..."
        toolbarItems={[
          ['heading', 'bold', 'italic'],
          ['ul', 'ol', 'task'],
          ['link', 'image'],
        ]}
        hooks={{
          addImageBlobHook: async (blob: Blob | File, callback: (url: string, text?: string) => void) => {
            const src = await fileToDataUrl(blob)
            callback(src, blob instanceof File ? blob.name : 'image')
            return false
          },
        }}
        onChange={() => {
          const nextValue = editorRef.current?.getInstance().getMarkdown() ?? ''
          onChange(nextValue)
        }}
      />
    </div>
  )
}
