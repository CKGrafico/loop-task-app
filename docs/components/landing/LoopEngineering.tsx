import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr'
import { Reveal } from './Reveal'

export interface LoopEngineeringLabels {
  heading: string
  p1: string
  p2: string
  p3: string
  framing: string
  readingLabel: string
}

const ARTICLES = [
  {
    title: 'Loop Engineering',
    source: 'Addy Osmani',
    href: 'https://addyosmani.com/blog/loop-engineering/',
  },
  {
    title: 'The Art of Loop Engineering',
    source: 'LangChain',
    href: 'https://www.langchain.com/blog/the-art-of-loop-engineering',
  },
  {
    title: 'The Rise of Loop Engineering',
    source: 'Quique Fdez Guerra',
    href: 'https://www.linkedin.com/pulse/we-stopped-working-alone-rise-loop-engineering-quique-fdez-guerra-a8qxe/',
  },
]

export function LoopEngineering({ labels }: { labels: LoopEngineeringLabels }) {
  return (
    <section id="loop-engineering" className="scroll-mt-20 border-t border-line-subtle">
      <div className="mx-auto max-w-3xl px-4 py-28 sm:px-6 lg:py-36">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {labels.heading}
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-6 text-lg leading-relaxed text-text-sec sm:text-xl">
          <Reveal delay={0.05}>
            <p>{labels.p1}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>{labels.p2}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-text">{labels.p3}</p>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="mt-14">
          <p className="text-sm text-text-muted">{labels.framing}</p>
          <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
            {labels.readingLabel}
          </p>
          <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
            {ARTICLES.map((a) => (
              <li key={a.href}>
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 py-3.5 transition-colors"
                >
                  <span className="text-sm text-text-sec transition-colors group-hover:text-text">
                    {a.title}
                    <span className="text-text-muted">, {a.source}</span>
                  </span>
                  <ArrowUpRightIcon
                    size={15}
                    className="shrink-0 text-text-muted transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
