import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './global.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://orbion.ckgrafico.com'),
  title: {
    default: 'Orbion: the open-source control plane for Loop Engineering',
    template: '%s | Orbion',
  },
  description:
    'Every loop, every machine, one window. Orbion watches the loop-task daemons on your fleet: status, live logs, and AI agents.',
  openGraph: {
    siteName: 'Orbion',
    type: 'website',
    images: ['/og.png'],
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
