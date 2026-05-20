'use client'

/**
 * DynamicSections — seções da home que buscam dados em runtime via API Hono.
 *
 * Substitui as queries de build time (Server Component + Repository)
 * para que mudanças no admin reflitam imediatamente sem rebuild.
 *
 * Seções: Hero CTAs, Programação, Palestrantes, Ingressos.
 * Dados estáticos (FAQ, Sobre, Memórias, Depoimentos) ficam no Server Component.
 */

import { Calendar, MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useLots, useSpeakers, useSchedule, useEventConfig } from '@/services/api/hooks'
import type { ScheduleItemWithSpeaker } from '@/repositories/ScheduleRepository'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgramacaoTabs } from '@/components/ui/ProgramacaoTabs'
import { Skeleton } from '@/components/ui/Skeleton'

import { cn } from '@/utils/cn'
import { formatLongDate } from '@/utils/dates'
import { formatCurrency, getInitials } from '@/utils/format'

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
          <span>{config?.date ? formatLongDate(config.date) : 'Data a confirmar'}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>{config?.location ?? 'Local a confirmar'}</span>
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
            <a href="#ingressos">Garantir meu ingresso</a>
          </Button>
        ) : (
          <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" disabled>Vendas encerradas</Button>
        )}
        <Button variant="outline" size="lg" className="w-[280px] rounded-full sm:w-[220px]" asChild>
          <a href="#programacao">Ver programação</a>
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
// Palestrantes
// ---------------------------------------------------------------------------

export function PalestrantesSection() {
  const { data: speakers, loading } = useSpeakers()

  const skeletons = (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {speakers.map((speaker) => (
        <article
          key={speaker.id}
          className="group flex flex-col gap-4 rounded-lg border border-border bg-secondary p-6 transition-colors duration-300 hover:border-accent/40"
        >
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
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {speaker.bio}
            </p>
          )}
        </article>
      ))}
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lots.map((lot) => {
        const available = lot.total_limit - lot.sold_count
        const isLotSoldOut = lot.status === 'soldout' || available <= 0
        const isLowStock = !isLotSoldOut && available <= lowStockThreshold
        const benefits = Array.isArray(lot.benefits) ? lot.benefits as string[] : []

        return (
          <article
            key={lot.id}
            className={cn(
              'relative flex flex-col gap-4 rounded-lg border p-6 transition-colors duration-300',
              isLotSoldOut
                ? 'border-border bg-secondary opacity-60'
                : 'border-accent/30 bg-background hover:border-accent/60',
            )}
            aria-label={`Lote ${lot.name}${isLotSoldOut ? ' — esgotado' : ''}`}
          >
            {isLowStock && !isLotSoldOut && (
              <Badge variant="warning" className="absolute -top-2.5 left-4">
                Últimas {available} vagas
              </Badge>
            )}
            {isLotSoldOut && (
              <Badge variant="secondary" className="absolute -top-2.5 left-4">
                Esgotado
              </Badge>
            )}
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">{lot.name}</h3>
              {lot.description && (
                <p className="font-detail mt-1 text-xs text-muted-foreground">{lot.description}</p>
              )}
            </div>
            <p className="font-display text-3xl font-semibold text-accent">
              {formatCurrency(lot.price)}
            </p>
            {benefits.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {!isLotSoldOut && (
              <p className="font-detail text-xs text-muted-foreground">
                {available} {available === 1 ? 'vaga disponível' : 'vagas disponíveis'}
              </p>
            )}
            <Button
              className="mt-auto w-full"
              disabled={isLotSoldOut || !isSaleOpen}
              asChild
            >
              <Link
                href={isLotSoldOut || !isSaleOpen ? '#' : `/checkout?lot=${lot.id}`}
                aria-disabled={isLotSoldOut || !isSaleOpen}
                tabIndex={isLotSoldOut || !isSaleOpen ? -1 : undefined}
              >
                {isLotSoldOut ? 'Esgotado' : !isSaleOpen ? 'Vendas encerradas' : 'Garantir minha participação'}
              </Link>
            </Button>
          </article>
        )
      })}
    </div>
  )
}
