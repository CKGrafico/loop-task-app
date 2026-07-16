import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { source } from '../../../source'
import { useMDXComponents } from '../../../../mdx-components'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>
}) {
  const { locale, slug } = await params
  const page = source.getPage(slug, locale)

  if (!page) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MDX = (page.data as any).body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toc = (page.data as any).toc as undefined | any[]
  const components = useMDXComponents({})

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description && (
        <DocsDescription>{page.data.description}</DocsDescription>
      )}
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams('slug', 'locale')
}
