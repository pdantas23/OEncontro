'use client'

/**
 * ProgramacaoTabs — exibe a programação do evento.
 * Client Component necessário: Tabs requer estado para aba ativa.
 *
 * - 1 dia → linha do tempo vertical
 * - Múltiplos dias → abas (Dia 1, Dia 2...)
 *
 * Dados chegam do Server Component (page.tsx) via props — zero fetch no cliente.
 */

import Image from 'next/image'
import { Clock, UtensilsCrossed, Coffee, Mic, Users, Flag } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatTime } from '@/utils/format'
import { getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { ScheduleItemWithSpeaker } from '@/repositories/ScheduleRepository'

interface ProgramacaoTabsProps {
  schedule: ScheduleItemWithSpeaker[]
  className?: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  palestra: Mic,
  almoco: UtensilsCrossed,
  coffee_break: Coffee,
  abertura: Flag,
  encerramento: Flag,
  networking: Users,
  outro: Clock,
}

function ScheduleCard({ item }: { item: ScheduleItemWithSpeaker }) {
  const Icon = TYPE_ICONS[item.item_type] ?? Clock

  return (
    <div className="flex gap-4">
      {/* Linha do tempo */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-2 w-px flex-1 bg-border" aria-hidden="true" />
      </div>

      {/* Conteúdo */}
      <div className="pb-8 flex-1 min-w-0">
        {/* Horário */}
        <p className="mb-1 text-xs font-medium text-primary">
          {formatTime(item.start_time)}
          {item.end_time && ` – ${formatTime(item.end_time)}`}
        </p>

        {/* Título da palestra */}
        <h3 className="font-display text-base font-semibold text-foreground leading-snug">
          {item.talk_title}
        </h3>

        {/* Palestrante */}
        {item.speaker && (
          <div className="mt-2 flex items-center gap-2">
            {item.speaker.photo_url ? (
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image
                  src={item.speaker.photo_url}
                  alt={item.speaker.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            ) : (
              <Avatar
                fallback={getInitials(item.speaker.name)}
                size="sm"
              />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{item.speaker.name}</p>
              {item.speaker.role && (
                <p className="text-xs text-muted-foreground">{item.speaker.role}</p>
              )}
            </div>
          </div>
        )}

        {/* Descrição */}
        {item.description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

export function ProgramacaoTabs({ schedule, className }: ProgramacaoTabsProps) {
  if (schedule.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Programação em breve.
      </p>
    )
  }

  const days = [...new Set(schedule.map((s) => s.day))].sort((a, b) => a - b)

  return (
    <div className={cn('grid gap-8 md:grid-cols-3', className)}>
      {days.map((day) => {
        const dayItems = schedule.filter((s) => s.day === day)
        return (
          <div key={day}>
            <h3 className="mb-6 text-start font-display text-xl font-semibold text-foreground">
              Dia {day}
            </h3>
            <div className="space-y-0">
              {dayItems.map((item) => (
                <ScheduleCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
