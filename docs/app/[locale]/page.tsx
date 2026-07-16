import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { isLocale } from '../../i18n/routing'
import { Navbar } from '../../components/landing/Navbar'
import { Hero } from '../../components/landing/Hero'
import { LoopEngineering } from '../../components/landing/LoopEngineering'
import { LogsVignette } from '../../components/landing/LogsVignette'
import { ChatVignette } from '../../components/landing/ChatVignette'
import { WizardVignette } from '../../components/landing/WizardVignette'
import { FeatureBento } from '../../components/landing/FeatureBento'
import { Trust } from '../../components/landing/Trust'
import { Quickstart } from '../../components/landing/Quickstart'
import { Footer } from '../../components/landing/Footer'
import { Reveal } from '../../components/landing/Reveal'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations()
  const docsHref = `/${locale}/docs`

  return (
    <div className="min-h-screen bg-frame text-text">
      <Navbar
        docsHref={docsHref}
        labels={{
          loopEngineering: t('nav.loopEngineering'),
          features: t('nav.features'),
          docs: t('nav.docs'),
          getStarted: t('nav.getStarted'),
          github: t('nav.github'),
          openMenu: t('nav.openMenu'),
          closeMenu: t('nav.closeMenu'),
        }}
      />

      <Hero
        docsHref={docsHref}
        labels={{
          eyebrow: t('hero.eyebrow'),
          headline1: t('hero.headline1'),
          headline2: t('hero.headline2'),
          subtext: t('hero.subtext'),
          ctaPrimary: t('hero.ctaPrimary'),
          ctaSecondary: t('hero.ctaSecondary'),
        }}
      />

      <LoopEngineering
        labels={{
          heading: t('loopEngineering.heading'),
          p1: t('loopEngineering.p1'),
          p2: t('loopEngineering.p2'),
          p3: t('loopEngineering.p3'),
          framing: t('loopEngineering.framing'),
          readingLabel: t('loopEngineering.readingLabel'),
        }}
      />

      {/* Proof beat 1: split, text left, live log preview right */}
      <section className="border-t border-line-subtle">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-28 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('beatLogs.heading')}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-text-sec">
              {t('beatLogs.p1')}
            </p>
            <p className="mt-3 text-lg leading-relaxed text-text-sec">
              {t('beatLogs.p2')}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <LogsVignette />
          </Reveal>
        </div>
      </section>

      {/* Proof beat 2: full width, breaks the split rhythm */}
      <section className="border-t border-line-subtle">
        <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('beatChat.heading')}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-text-sec">
              {t('beatChat.p1')} {t('beatChat.p2')}
            </p>
            <p className="mt-3 text-lg leading-relaxed text-text-sec">
              {t('beatChat.p3')}
            </p>
          </Reveal>
          <Reveal delay={0.12} className="mt-12">
            <ChatVignette />
          </Reveal>
        </div>
      </section>

      {/* Proof beat 3: reversed split, wizard preview left */}
      <section className="border-t border-line-subtle">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-28 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={0.1} className="order-2 lg:order-1">
            <WizardVignette />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('beatWizard.heading')}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-text-sec">
              {t('beatWizard.p1')}
            </p>
            <p className="mt-3 text-lg leading-relaxed text-text-sec">
              {t('beatWizard.p2')}
            </p>
          </Reveal>
        </div>
      </section>

      <FeatureBento
        labels={{
          heading: t('bento.heading'),
          fleet: { title: t('bento.fleet.title'), desc: t('bento.fleet.desc') },
          logs: { title: t('bento.logs.title'), desc: t('bento.logs.desc') },
          ssh: { title: t('bento.ssh.title'), desc: t('bento.ssh.desc') },
          tailscale: {
            title: t('bento.tailscale.title'),
            desc: t('bento.tailscale.desc'),
          },
          chat: { title: t('bento.chat.title'), desc: t('bento.chat.desc') },
          signal: { title: t('bento.signal.title'), desc: t('bento.signal.desc') },
        }}
      />

      <Trust
        labels={{
          heading: t('trust.heading'),
          p1: t.rich('trust.p1', {
            code: (chunks) => (
              <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[0.9em] text-text">
                {chunks}
              </code>
            ),
          }),
          p2: t('trust.p2'),
          col1: t('trust.col1'),
          col2: t('trust.col2'),
          col3: t('trust.col3'),
        }}
      />

      <Quickstart
        docsHref={docsHref}
        labels={{
          heading: t('quickstart.heading'),
          intro: t('quickstart.intro'),
          outro: t('quickstart.outro'),
          ctaDocs: t('quickstart.ctaDocs'),
          ctaStar: t('quickstart.ctaStar'),
          starAsk: t('quickstart.starAsk'),
          copy: t('quickstart.copy'),
          copied: t('quickstart.copied'),
        }}
      />

      <Footer
        docsHref={docsHref}
        labels={{
          line: t('footer.line'),
          docs: t('footer.docs'),
          github: t('footer.github'),
          loopTask: t('footer.loopTask'),
        }}
      />
    </div>
  )
}
