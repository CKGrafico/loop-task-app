'use client'

import { useEffect, useState } from 'react'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr'
import { useReducedMotion } from 'motion/react'

/* Rendered preview of the add-VM wizard's progress checklist. Cycles
   through the real step sequence; freezes mid-run under reduced motion. */
const STEPS = ['Probing VM', 'Installing services', 'Opening tunnel', 'Pairing']

export function WizardVignette() {
  const reduce = useReducedMotion()
  const [done, setDone] = useState(reduce ? 2 : 0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setDone((d) => (d >= STEPS.length ? 0 : d + 1))
    }, 1600)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="rounded-[20px] border border-line-subtle bg-panel/70 p-1.5">
      <div className="rounded-[15px] border border-line bg-sidebar px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text">Add Environment</span>
          <span className="rounded-full bg-active px-2.5 py-1 font-mono text-[10px] text-text-sec">
            ubuntu@vm-oslo
          </span>
        </div>

        <ul className="mt-5 flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'pending'
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-500 ${
                    state === 'done'
                      ? 'border-accent bg-accent text-accent-ink'
                      : state === 'active'
                        ? 'animate-pulse border-warm'
                        : 'border-line'
                  }`}
                >
                  {state === 'done' && <CheckIcon size={11} weight="bold" />}
                  {state === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-warm" />}
                </span>
                <span
                  className={`text-sm transition-colors duration-500 ${
                    state === 'pending' ? 'text-text-muted' : 'text-text'
                  }`}
                >
                  {step}
                </span>
              </li>
            )
          })}
        </ul>

        <div
          className={`mt-5 flex items-center gap-2 rounded-lg border border-line-subtle bg-input px-3.5 py-2.5 transition-opacity duration-500 ${
            done >= STEPS.length ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-xs text-text-sec">
            vm-oslo paired · SSH endpoint saved
          </span>
        </div>
      </div>
    </div>
  )
}
