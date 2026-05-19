/**
 * Root Layout — O Encontro 2026
 *
 * Tipografia oficial:
 *   display  → Cormorant Garamond (títulos, hero, headings)
 *   sans     → Inter (corpo, nav, botões, formulários)
 *   detail   → Manrope (labels, metadata, pequenos detalhes)
 */

import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter, Manrope } from 'next/font/google'
import { Providers } from '@/providers/Providers'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const manrope = Manrope({
  variable: '--font-detail',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | O Encontro 2026',
    default: 'O Encontro 2026',
  },
  description:
    'Um encontro criado para cerimonialistas, organizadores e profissionais de eventos que desejam fortalecer conexões, ampliar visão de mercado e viver uma experiência construída nos detalhes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorantGaramond.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
