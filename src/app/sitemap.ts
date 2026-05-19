/**
 * src/app/sitemap.ts
 *
 * Sitemap dinâmico — apenas URLs públicas indexáveis.
 * Exclui: /checkout, /obrigado, /admin/*
 * Referência: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from 'next'
import { env } from '@/config/env'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]
}
