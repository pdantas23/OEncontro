'use client'

/**
 * SurveySuccess — Tela final. Confirma o envio de forma clara e fecha o ciclo.
 */

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function SurveySuccess() {
  return (
    <div className="animate-slide-in-up flex flex-col items-center py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-8 w-8" aria-hidden="true" />
      </div>

      <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">
        Recebemos sua resposta!
      </h2>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Obrigado por dedicar esses minutos. É com o que você escreveu aqui que a
        próxima edição do O ENCONTRO vai ser montada.
      </p>

      <Button asChild variant="outline" className="mt-8">
        <a href={`${basePath}/`}>Voltar para o site</a>
      </Button>
    </div>
  )
}
