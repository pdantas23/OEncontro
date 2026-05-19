import type { Metadata } from 'next'

/**
 * SEOWrapper — utilitário para gerar Metadata do Next.js de forma padronizada.
 * Usar na exportação `metadata` de cada page.tsx.
 *
 * Exemplo:
 *   export const metadata = buildMetadata({ title: 'Ingressos' })
 */

const SITE_NAME = 'Evento' // Task Final TF03: substituir

export interface BuildMetadataInput {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
}

export function buildMetadata({
  title,
  description = 'Plataforma de ingressos para eventos de cerimonialistas e organizadores de eventos.',
  image = '/og-image.jpg', // Task Final TF05: substituir pela OG image real
  noIndex = false,
}: BuildMetadataInput = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      images: [{ url: image }],
      type: 'website',
      siteName: SITE_NAME,
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: process.env.NEXT_PUBLIC_APP_URL,
    },
  }
}
