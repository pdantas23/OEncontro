/**
 * src/app/robots.ts
 *
 * Robots.txt dinâmico.
 * Bloqueia rotas que não devem ser indexadas.
 */

import type { MetadataRoute } from 'next'
import { env } from '@/config/env'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/obrigado', '/admin'],
    },
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  }
}
