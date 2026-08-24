/**
 * src/app/pesquisa/page.tsx
 *
 * Pesquisa de satisfação pós-evento.
 * Rota pública por link direto — não indexada (ver src/app/robots.ts).
 * O cabeçalho vive dentro do wizard porque encolhe a partir da segunda etapa.
 */

import type { Metadata } from 'next'
import { SurveyWizard } from '@/components/survey/SurveyWizard'

export const metadata: Metadata = {
  // O layout raiz já aplica o template '%s | O Encontro 2026'
  title: 'Pesquisa de satisfação',
  description:
    'Conte como foi a sua experiência na Imersão O ENCONTRO. Leva menos de 3 minutos.',
  robots: { index: false, follow: false },
}

export default function PesquisaPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <SurveyWizard />
      </div>
    </main>
  )
}
