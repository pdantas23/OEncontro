'use client'

/**
 * DynamicSections — seções da home que buscam dados em runtime via API Hono.
 *
 * Substitui as queries de build time (Server Component + Repository)
 * para que mudanças no admin reflitam imediatamente sem rebuild.
 *
 * Seções: Hero CTAs, Programação, Palestrantes, Ingressos.
 * Dados estáticos (FAQ, Sobre, Memórias) ficam no Server Component.
 */

import { Calendar, ChevronDown, MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'

import type { ScheduleItemWithSpeaker } from '@/repositories/ScheduleRepository'
import { useEventConfig, useLots, useSchedule, useSpeakers } from '@/services/api/hooks'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Carousel } from '@/components/ui/Carousel'
import { ProgramacaoTabs } from '@/components/ui/ProgramacaoTabs'
import { Skeleton } from '@/components/ui/Skeleton'

import { cn } from '@/utils/cn'
import { formatCurrency, getInitials } from '@/utils/format'
import { trackCtaClick, trackSelectTicket } from '@/utils/tracking'

// ---------------------------------------------------------------------------
// Hero dinâmico (data, local, CTAs baseados em sale_status)
// ---------------------------------------------------------------------------

export function HeroDynamic() {
  const { data: config, loading } = useEventConfig()

  const isSaleOpen = !config || config.sale_status === 'open'
  const isSoldOut = config?.sale_status === 'soldout'

  return (
    <>
      {/* Data e local */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-5 font-detail text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>17, 18 e 19 de agosto</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>Finess Buffet</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row">
        {loading ? (
          <Skeleton className="h-11 w-[220px] rounded-full" />
        ) : isSoldOut ? (
          <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" disabled>Esgotado</Button>
        ) : isSaleOpen ? (
          <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" asChild>
            <a href="#ingressos" onClick={() => trackCtaClick('hero_ingresso', '#ingressos')}>Garantir meu ingresso</a>
          </Button>
        ) : (
          <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" disabled>Vendas encerradas</Button>
        )}
        <Button variant="outline" size="lg" className="w-[280px] rounded-full sm:w-[220px]" asChild>
          <a href="#programacao" onClick={() => trackCtaClick('hero_programacao', '#programacao')}>Ver programação</a>
        </Button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Programação
// ---------------------------------------------------------------------------

export function ProgramacaoSection() {
  const { data: schedule, loading } = useSchedule()

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Carregando programação">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (schedule.length === 0) {
    return (
      <div className="space-y-6" aria-label="Programação em breve">
        <p className="text-center text-sm text-muted-foreground">
          A programação completa será divulgada em breve.
        </p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <ProgramacaoTabs schedule={schedule as unknown as ScheduleItemWithSpeaker[]} />
}

// ---------------------------------------------------------------------------
// Palestrantes — card expandível
// ---------------------------------------------------------------------------

function SpeakerCard({
  speaker,
  asset,
  isRight,
  expanded,
  onToggle,
}: {
  speaker: { id: string; name: string; role?: string | null; bio?: string | null; photo_url?: string | null }
  asset: string
  isRight: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const bioRef = useRef<HTMLDivElement>(null)

  return (
    <article
      className="group relative flex flex-col gap-4 overflow-hidden rounded-lg border border-border bg-secondary p-6 transition-colors duration-300 hover:border-accent/40"
    >
      <div
        className={cn(
          'pointer-events-none absolute bottom-0 h-40 w-40 opacity-[0.12]',
          isRight ? 'right-0' : 'left-0',
        )}
        aria-hidden="true"
      >
        <Image
          src={asset}
          alt=""
          fill
          className={cn('object-contain', isRight ? 'object-right-bottom' : 'object-left-bottom')}
          sizes="64px"
        />
      </div>

      <div className="flex items-center gap-4">
        {speaker.photo_url ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent/20">
            <Image
              src={speaker.photo_url}
              alt={speaker.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="64px"
            />
          </div>
        ) : (
          <Avatar
            fallback={getInitials(speaker.name)}
            size="lg"
            className="border-2 border-accent/20"
          />
        )}
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-foreground leading-tight">
            {speaker.name}
          </h3>
          {speaker.role && (
            <p className="font-detail text-xs text-muted-foreground mt-0.5">{speaker.role}</p>
          )}
        </div>
      </div>

      {speaker.bio && (
        <>
          <div
            className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
            style={{ maxHeight: expanded ? `${bioRef.current?.scrollHeight ?? 500}px` : '4.5em' }}
          >
            <div ref={bioRef}>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {speaker.bio}
              </p>
            </div>
            {/* Fade quando colapsado */}
            {!expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-secondary to-transparent" />
            )}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1 self-center text-xs font-medium text-accent transition-colors hover:text-accent-foreground"
            aria-label={expanded ? 'Ver menos' : 'Ver mais'}
          >
            <span>{expanded ? 'Ver menos' : 'Ver mais'}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', expanded && 'rotate-180')} />
          </button>
        </>
      )}
    </article>
  )
}

export function PalestrantesSection() {
  const { data: speakers, loading } = useSpeakers()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const skeletons = (
    <div className="grid gap-6 sm:grid-cols-2">
      {loading && <p className="col-span-full text-center text-sm text-muted-foreground">Carregando...</p>}
      {!loading && speakers.length === 0 && (
        <p className="col-span-full text-center text-sm text-muted-foreground">
          Os convidados serão anunciados em breve.
        </p>
      )}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-4 rounded-lg border border-border bg-secondary p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )

  if (loading || speakers.length === 0) return skeletons

  const assets = [
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/guara-realista.png`,
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/guaras2.png`,
  ]

  // Gera posição e asset determinísticos por índice (parecem aleatórios)
  function getDecoration(index: number) {
    const asset = assets[index % assets.length]
    const isRight = (index * 7 + 3) % 2 === 0
    return { asset, isRight }
  }

  return (
    <div className="grid items-start gap-6 sm:grid-cols-2">
      {speakers.map((speaker, i) => {
        const { asset, isRight } = getDecoration(i)
        return (
          <SpeakerCard
            key={speaker.id}
            speaker={speaker}
            asset={asset}
            isRight={isRight}
            expanded={expandedId === speaker.id}
            onToggle={() => setExpandedId(expandedId === speaker.id ? null : speaker.id)}
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ingressos
// ---------------------------------------------------------------------------

export function IngressosSection() {
  const { data: lots, loading: lotsLoading } = useLots()
  const { data: config, loading: configLoading } = useEventConfig()

  const loading = lotsLoading || configLoading
  const isSaleOpen = !config || config.sale_status === 'open'
  const lowStockThreshold = config?.low_stock_threshold ?? 20

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-background/60 p-12 text-center">
        <p className="font-detail text-sm text-muted-foreground">Carregando ingressos...</p>
        {[1, 2].map((i) => (
          <div key={i} className="w-full max-w-xs space-y-3 rounded-lg border border-border bg-secondary p-6">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (lots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-background/60 p-12 text-center">
        <p className="font-detail text-sm text-muted-foreground">
          Os lotes de ingresso serão publicados em breve.
        </p>
        {[1, 2].map((i) => (
          <div key={i} className="w-full max-w-xs space-y-3 rounded-lg border border-border bg-secondary p-6">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        ))}
      </div>
    )
  }

  const [featured, ...rest] = lots

  function renderCard(lot: typeof lots[number], highlight = false) {
    const available = lot.total_limit - lot.sold_count
    const isLotSoldOut = lot.status === 'soldout' || available <= 0
    const isLowStock = !isLotSoldOut && available <= lowStockThreshold
    const benefits = Array.isArray(lot.benefits) ? lot.benefits as string[] : []
    const imageUrl = lot.image_url

    const priceStr = formatCurrency(lot.price)
    const priceParts = priceStr.match(/^(R\$\s?)(.+)$/)

    return (
      <article
        key={lot.id}
        className={cn(
          'relative flex w-full flex-col overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300',
          isLotSoldOut
            ? 'border-border bg-secondary/80 opacity-70 shadow-none'
            : highlight
              ? 'border-accent bg-gradient-to-b from-background to-secondary/30 shadow-2xl hover:shadow-2xl'
              : 'border-accent/20 bg-gradient-to-b from-background to-secondary/30 hover:shadow-xl hover:border-accent/40',
        )}
        aria-label={`Lote ${lot.name}${isLotSoldOut ? ' — esgotado' : ''}`}
      >
        {/* Label do dia — destaque com fundo dourado */}
        {lot.label && (
          <div
            className={cn(
              'py-2 text-center font-detail text-xs font-semibold uppercase tracking-[0.15em]',
              highlight
                ? 'bg-gradient-to-r from-accent/20 via-accent/30 to-accent/20 text-accent-foreground'
                : 'bg-accent/10 text-accent-foreground',
            )}
          >
            {lot.label}
          </div>
        )}

        {isLowStock && !isLotSoldOut && (
          <Badge variant="warning" className="absolute top-4 left-4 z-10 shadow-sm">
            Últimas {available} vagas
          </Badge>
        )}
        {isLotSoldOut && (
          <Badge variant="secondary" className="absolute top-4 left-4 z-10">
            Esgotado
          </Badge>
        )}

        {imageUrl ? (
          <div className="relative w-full overflow-hidden aspect-[2/1]">
            <Image
              src={imageUrl}
              alt={lot.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 85vw, 33vw"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        ) : (
          <div className="flex w-full items-center justify-center bg-muted/40 aspect-[2/1]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <Star className="h-10 w-10" />
              <span className="font-detail text-xs">Imagem do ingresso</span>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          {/* Bloco variável — absorve o espaço para alinhar preço e botão */}
          <div className="flex-1">
            <div className="text-center">
              <h3 className={cn(
                'font-display text-2xl font-bold sm:text-3xl',
                highlight ? 'text-accent' : 'text-foreground',
              )}>
                {lot.name}
              </h3>
              {lot.description && (
                <p className="mt-2 whitespace-pre-line text-left text-sm leading-relaxed text-muted-foreground">
                  {lot.description}
                </p>
              )}
            </div>

            {benefits.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2 px-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bloco fixo — preço e botão sempre alinhados na base */}
          <div className="mt-5 text-center">
            <p className="font-sans font-bold tracking-tight text-primary">
              {priceParts ? (
                <>
                  <span className="text-base font-semibold">{priceParts[1]}</span>
                  <span className="text-4xl sm:text-5xl">{priceParts[2]}</span>
                </>
              ) : (
                <span className="text-4xl sm:text-5xl">{priceStr}</span>
              )}
            </p>
          </div>

          <Button
            className="mt-5 w-full py-3 text-base font-semibold transition-all hover:shadow-md"
            disabled={isLotSoldOut || !isSaleOpen}
            asChild
          >
            <Link
              href={isLotSoldOut || !isSaleOpen ? '#' : `/checkout?lot=${lot.id}`}
              aria-disabled={isLotSoldOut || !isSaleOpen}
              tabIndex={isLotSoldOut || !isSaleOpen ? -1 : undefined}
              onClick={() => {
                if (!isLotSoldOut && isSaleOpen) {
                  trackCtaClick('ingresso_comprar', `/checkout?lot=${lot.id}`)
                  trackSelectTicket(lot.id, lot.name, lot.price)
                }
              }}
            >
              {isLotSoldOut ? 'Esgotado' : !isSaleOpen ? 'Vendas encerradas' : 'Garantir minha participação'}
            </Link>
          </Button>
        </div>
      </article>
    )
  }

  const allLots = [featured, ...rest]

  // Carrossel mobile: featured primeiro, com destaque visual
  const carouselItems = allLots.map((lot, i) => ({
    id: lot.id,
    content: renderCard(lot, i === 0),
  }))

  return (
    <>
      {/* Desktop — destaque ao centro, elevado e à frente */}
      <div className="hidden md:flex md:items-stretch md:justify-center md:gap-6">
        {rest.length > 0 && (
          <div className="flex w-full max-w-sm">
            {renderCard(rest[0])}
          </div>
        )}
        <div className="relative z-10 flex w-full max-w-sm -my-6 -mx-2">
          {renderCard(featured, true)}
        </div>
        {rest.slice(1).map((lot) => (
          <div key={lot.id} className="flex w-full max-w-sm">
            {renderCard(lot)}
          </div>
        ))}
      </div>

      {/* Mobile — carrossel com swipe e setas */}
      <div className="md:hidden px-2">
        <Carousel items={carouselItems} showArrows itemClassName="px-1" />
      </div>
    </>
  )
}
