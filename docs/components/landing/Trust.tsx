import { Reveal } from './Reveal'

export interface TrustLabels {
  heading: string
  p1: React.ReactNode
  p2: string
  col1: string
  col2: string
  col3: string
}

export function Trust({ labels }: { labels: TrustLabels }) {
  return (
    <section className="border-t border-line-subtle">
      <div className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {labels.heading}
          </h2>
        </Reveal>
        <div className="mt-8 flex flex-col gap-4 text-lg leading-relaxed text-text-sec">
          <Reveal delay={0.05}>
            <p>{labels.p1}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>{labels.p2}</p>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-14">
          <div className="grid grid-cols-1 gap-6 border-t border-line-subtle pt-8 sm:grid-cols-3">
            {[labels.col1, labels.col2, labels.col3].map((col) => (
              <p key={col} className="font-mono text-sm text-text">
                {col}
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
