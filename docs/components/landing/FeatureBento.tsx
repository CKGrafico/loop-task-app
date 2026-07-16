import {
  BellSimpleIcon,
  ChatCircleDotsIcon,
  GraphIcon,
  HardDrivesIcon,
  PlugsIcon,
  TerminalWindowIcon,
} from '@phosphor-icons/react/dist/ssr'
import { Reveal } from './Reveal'

export interface BentoTile {
  title: string
  desc: string
}

export interface BentoLabels {
  heading: string
  fleet: BentoTile
  logs: BentoTile
  ssh: BentoTile
  tailscale: BentoTile
  chat: BentoTile
  signal: BentoTile
}

/* Static mini fleet rows: the sidebar's shape, rendered as a preview
   inside the large tile so the grid is not text-on-text everywhere. */
function FleetPreview() {
  const rows = [
    { name: 'vm-berlin', kind: 'Tailscale', dot: 'bg-accent', pill: 'working', pillClass: 'text-running border-running/40' },
    { name: 'homelab-01', kind: 'SSH', dot: 'bg-accent', pill: 'approval', pillClass: 'text-danger border-danger/40' },
    { name: 'mac-studio', kind: 'Direct', dot: 'bg-warm', pill: 'idle', pillClass: 'text-text-muted border-line' },
  ]
  return (
    <div className="mt-6 flex flex-col gap-2" aria-hidden>
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center gap-3 rounded-xl border border-line-subtle bg-input px-3.5 py-2.5"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
          <span className="font-mono text-xs text-text">{r.name}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-text-muted">
            {r.kind}
          </span>
          <span
            className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[9.5px] ${r.pillClass}`}
          >
            {r.pill}
          </span>
        </div>
      ))}
    </div>
  )
}

function LogPreview() {
  return (
    <div className="mt-6 rounded-xl border border-line-subtle bg-log px-3.5 py-3 font-mono text-[11px] leading-[1.9]" aria-hidden>
      <div className="text-warm">run #34 · 02:30:03</div>
      <div className="text-text-sec">rows: 12,901</div>
      <div className="text-accent">exit 0, duration 388ms</div>
    </div>
  )
}

export function FeatureBento({ labels }: { labels: BentoLabels }) {
  return (
    <section id="features" className="scroll-mt-20 border-t border-line-subtle">
      <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {labels.heading}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          <Reveal className="lg:col-span-4">
            <div className="h-full rounded-3xl border border-line-subtle bg-panel p-7 transition-colors duration-500 hover:border-line">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line-subtle bg-input text-accent">
                <HardDrivesIcon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{labels.fleet.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-sec">{labels.fleet.desc}</p>
              <FleetPreview />
            </div>
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-line-subtle bg-panel p-7 transition-colors duration-500 hover:border-line">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line-subtle bg-input text-blue">
                <TerminalWindowIcon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{labels.logs.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-sec">{labels.logs.desc}</p>
              <LogPreview />
            </div>
          </Reveal>

          <Reveal delay={0.05} className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-line-subtle bg-panel p-7 transition-colors duration-500 hover:border-line">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line-subtle bg-input text-text-sec">
                <PlugsIcon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{labels.ssh.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-sec">{labels.ssh.desc}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-4">
            <div className="h-full rounded-3xl border border-line-subtle bg-panel p-7 transition-colors duration-500 hover:border-line">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line-subtle bg-input text-infra">
                <ChatCircleDotsIcon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{labels.chat.title}</h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-text-sec">{labels.chat.desc}</p>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="lg:col-span-3">
            <div className="h-full rounded-3xl border border-line-subtle bg-panel p-7 transition-colors duration-500 hover:border-line">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line-subtle bg-input text-violet">
                <GraphIcon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{labels.tailscale.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-sec">{labels.tailscale.desc}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="h-full rounded-3xl border border-line-subtle bg-panel p-7 transition-colors duration-500 hover:border-line">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line-subtle bg-input text-warm">
                <BellSimpleIcon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{labels.signal.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-sec">{labels.signal.desc}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
