'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Award, Handshake, Heart, Lightbulb, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/utils/cn'

const CARDS = [
  {
    icon: Heart,
    title: 'Cerimonialistas em crescimento',
    description:
      'Profissionais que desejam fortalecer posicionamento, ampliar atendimento e construir uma carreira com mais solidez e reconhecimento no mercado.',
  },
  {
    icon: Award,
    title: 'Organizadores de eventos',
    description:
      'Quem atua na produção de eventos sociais e corporativos e quer ampliar visão de mercado, referências e conexões qualificadas.',
  },
  {
    icon: Handshake,
    title: 'Profissionais em busca de networking',
    description:
      'Quem entende que as relações certas constroem carreiras e quer construir uma rede sólida e genuína dentro do setor.',
  },
  {
    icon: TrendingUp,
    title: 'Equipes e produtores',
    description:
      'Times que desejam ampliar visão de mercado, integrar aprendizados e alinhar processos com as melhores práticas do setor.',
  },
  {
    icon: Lightbulb,
    title: 'Quem valoriza experiência e atendimento',
    description:
      'Profissionais que acreditam que o diferencial está nos detalhes e buscam referências para elevar o nível do próprio trabalho.',
  },
  {
    icon: Users,
    title: 'Profissionais que desejam se posicionar',
    description:
      'Quem quer ocupar um lugar de referência no mercado e entende que posicionamento se constrói com consistência e presença.',
  },
]

export function ParaQuemCarousel() {
  const [index, setIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)

  useEffect(() => {
    const update = () => setItemsPerView(window.innerWidth >= 640 ? 3 : 1)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const maxIndex = CARDS.length - itemsPerView
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex])

  const itemWidth = 100 / itemsPerView
  const totalDots = maxIndex + 1

  return (
    <div className="relative" role="region" aria-label="Para quem é o encontro">
      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * itemWidth}%)` }}
        >
          {CARDS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="shrink-0 px-2"
              style={{ width: `${itemWidth}%` }}
              role="group"
              aria-roledescription="slide"
            >
              <article className="flex h-full flex-col gap-3 rounded-lg border border-white/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ backgroundColor: '#ED1C24' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/80">{description}</p>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 bg-white/80 text-foreground shadow-sm transition-all duration-200',
            'hover:bg-white hover:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-30',
          )}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2" role="tablist">
          {Array.from({ length: totalDots }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'rounded-full transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === index
                  ? 'h-2 w-6 bg-foreground'
                  : 'h-2 w-2 bg-foreground/30 hover:bg-foreground/50',
              )}
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === maxIndex}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 bg-white/80 text-foreground shadow-sm transition-all duration-200',
            'hover:bg-white hover:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-30',
          )}
          aria-label="Próximo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
