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
import { Clock } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Avatar } from '@/components/ui/Avatar'
import { formatTime } from '@/utils/format'
import { getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { ScheduleItemWithSpeaker } from '@/repositories/ScheduleRepository'

interface ProgramacaoTabsProps {
  schedule: ScheduleItemWithSpeaker[]
  className?: string
}

function ScheduleCard({ item }: { item: ScheduleItemWithSpeaker }) {
  return (
    <div className="flex gap-4">
      {/* Linha do tempo */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/30">
          <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
  const isSingleDay = days.length === 1

  if (isSingleDay) {
    // Linha do tempo vertical
    return (
      <div className={cn('space-y-0', className)}>
        {schedule.map((item) => (
          <ScheduleCard key={item.id} item={item} />
        ))}
      </div>
    )
  }

  // Abas por dia
  return (
    <Tabs defaultValue={`dia-${days[0]}`} className={className}>
      <TabsList className="mb-8">
        {days.map((day) => (
          <TabsTrigger key={day} value={`dia-${day}`}>
            Dia {day}
          </TabsTrigger>
        ))}
      </TabsList>

      {days.map((day) => {
        const dayItems = schedule.filter((s) => s.day === day)
        return (
          <TabsContent key={day} value={`dia-${day}`}>
            <div>
              {dayItems.map((item) => (
                <ScheduleCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
