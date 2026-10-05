import { Fragment, type ReactNode } from 'react'

const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(import|from|export|default|const|let|var|function|return|if|else|async|await|new|try|catch|finally|throw|for|of|in|while|switch|case|break|continue|class|extends|true|false|null|undefined|typeof)\b|\b(\d+(?:\.\d+)?)\b/g

/** Tiny highlighter for the generated JS/JSX/JSON/CSS. Display only. */
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of code.matchAll(TOKEN)) {
    const i = m.index ?? 0
    if (i > last) out.push(code.slice(last, i))
    const cls = m[1] ? 'text-[#8a7f75] italic' : m[2] ? 'text-[#2f7d4f]' : m[3] ? 'text-[#a3582b] font-semibold' : 'text-[#1b6f8a]'
    out.push(
      <span key={k++} className={cls}>
        {m[0]}
      </span>,
    )
    last = i + m[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function CodeViewer({ path, code }: { path: string; code: string }) {
  const plain = /\.(md|example)$|gitignore$/.test(path)
  const lineCount = code.split('\n').length
  return (
    <div className="flex min-w-0 overflow-auto bg-[#fffdf9] font-mono text-[12.5px] leading-[1.65] [font-variant-ligatures:none]">
      <pre aria-hidden="true" className="select-none border-r border-line bg-cream/60 px-3 py-3 text-right text-muted/70">
        {Array.from({ length: lineCount }, (_, i) => (
          <Fragment key={i}>
            {i + 1}
            {'\n'}
          </Fragment>
        ))}
      </pre>
      <pre className="min-w-0 flex-1 px-4 py-3 text-ink">
        <code>{plain ? code : highlight(code)}</code>
      </pre>
    </div>
  )
}
