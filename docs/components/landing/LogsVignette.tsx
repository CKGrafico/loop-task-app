'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/* Sample data: a believable loop, clearly a rendered demo of the log
   viewer's behavior, not a screenshot. */
const RUNS = [
  { header: 'run #33 · 02:00:04', lines: ['syncing 4 sources', 'rows: 12,842', 'exit 0, duration 412ms'], ok: true },
  { header: 'run #34 · 02:30:03', lines: ['syncing 4 sources', 'rows: 12,901', 'exit 0, duration 388ms'], ok: true },
  { header: 'run #35 · 03:00:05', lines: ['syncing 4 sources', 'source "billing" timed out', 'exit 1, duration 5,004ms'], ok: false },
  { header: 'run #36 · 03:30:02', lines: ['syncing 4 sources', 'rows: 12,955', 'exit 0, duration 401ms'], ok: true },
]

type Row = { text: string; kind: 'header' | 'line' | 'ok' | 'bad' }

function flatten(): Row[] {
  return RUNS.flatMap((r) => [
    { text: r.header, kind: 'header' as const },
    ...r.lines.map((l, i) => ({
      text: l,
      kind: i === r.lines.length - 1 ? (r.ok ? ('ok' as const) : ('bad' as const)) : ('line' as const),
    })),
  ])
}

const ALL_ROWS = flatten()
const WINDOW = 9

export function LogsVignette() {
  const reduce = useReducedMotion()
  const [count, setCount] = useState(WINDOW)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setCount((c) => (c >= ALL_ROWS.length ? WINDOW : c + 1))
    }, 1700)
    return () => clearInterval(id)
  }, [reduce])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [count])

  const visible = ALL_ROWS.slice(0, count).slice(-WINDOW)

  return (
    <div className="rounded-[20px] border border-line-subtle bg-panel/70 p-1.5">
      <div className="overflow-hidden rounded-[15px] border border-line bg-log">
        <div className="flex items-center justify-between border-b border-line-subtle px-4 py-2.5">
          <span className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-running" />
            <span className="font-mono text-xs text-text">etl-nightly-sync</span>
            <span className="font-mono text-[10px] text-text-muted">30m</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-accent">
            Following
          </span>
        </div>
        <div
          ref={scrollRef}
          className="h-56 overflow-hidden px-4 py-3 font-mono text-xs leading-[1.9]"
          aria-hidden
        >
          {visible.map((row, i) => (
            <div key={`${row.text}-${i}`}>
              {row.kind === 'header' ? (
                <span className="text-warm">{row.text}</span>
              ) : row.kind === 'ok' ? (
                <span className="text-accent">{row.text}</span>
              ) : row.kind === 'bad' ? (
                <span className="text-danger">{row.text}</span>
              ) : (
                <span className="text-text-sec">{row.text}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
