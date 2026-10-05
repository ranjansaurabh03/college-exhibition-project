import { Fragment, type ReactNode } from 'react'

// A small Markdown subset for chat replies: paragraphs, headings, lists, code blocks,
// **bold**, *italic*, `code` and http(s) links. Renders React elements (no raw HTML).

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s\n][^*\n]*\*)|(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of text.matchAll(INLINE)) {
    const i = m.index ?? 0
    if (i > last) out.push(text.slice(last, i))
    const t = m[0]
    if (m[1]) out.push(<code key={k++} className="rounded bg-sand/70 px-1 py-0.5 font-mono text-[0.85em]">{t.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={k++} className="font-semibold text-espresso">{t.slice(2, -2)}</strong>)
    else if (m[3]) out.push(<em key={k++}>{t.slice(1, -1)}</em>)
    else {
      const label = t.slice(1, t.indexOf(']('))
      const href = t.slice(t.indexOf('](') + 2, -1)
      out.push(
        <a key={k++} href={href} target="_blank" rel="noreferrer noopener" className="font-semibold text-teal underline">
          {label}
        </a>,
      )
    }
    last = i + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'h'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'code'; text: string }

function parse(md: string): Block[] {
  const blocks: Block[] = []
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      i++ // closing fence (or end of a still-streaming reply)
      blocks.push({ kind: 'code', text: code.join('\n') })
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push({ kind: 'h', text: heading[1] })
      i++
      continue
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ''))
      blocks.push({ kind: 'ul', items })
      continue
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''))
      blocks.push({ kind: 'ol', items })
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(\s*[-*•]\s+|\s*\d+[.)]\s+|#{1,6}\s|\s*```)/.test(lines[i])) para.push(lines[i++])
    blocks.push({ kind: 'p', lines: para })
  }
  return blocks
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {parse(text).map((b, n) => {
        switch (b.kind) {
          case 'h':
            return (
              <p key={n} className="font-semibold text-espresso">
                {inline(b.text)}
              </p>
            )
          case 'ul':
            return (
              <ul key={n} className="list-disc space-y-1 pl-5 marker:text-tan">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={n} className="list-decimal space-y-1 pl-5 marker:text-muted">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre key={n} className="overflow-x-auto rounded-lg bg-cream px-3 py-2 font-mono text-[12px] leading-relaxed [font-variant-ligatures:none]">
                <code>{b.text}</code>
              </pre>
            )
          default:
            return (
              <p key={n}>
                {b.lines.map((l, j) => (
                  <Fragment key={j}>
                    {j > 0 ? <br /> : null}
                    {inline(l)}
                  </Fragment>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
