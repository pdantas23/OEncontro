'use client'

/**
 * OpenAnswers — As quatro perguntas abertas, uma aba para cada.
 * Texto na íntegra, do mais recente para o mais antigo.
 */

import { Quote } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { formatDate } from '@/utils/format'
import type { OpenAnswerGroup } from '@/services/SurveyStatsService'

interface OpenAnswersProps {
  groups: OpenAnswerGroup[]
}

export function OpenAnswers({ groups }: OpenAnswersProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-5 font-sans text-sm font-semibold text-foreground">
        O que escreveram
      </h2>

      <Tabs defaultValue={groups[0]?.key}>
        <TabsList className="flex-wrap">
          {groups.map((group) => (
            <TabsTrigger key={group.key} value={group.key}>
              {group.question}
              <span className="ml-2 rounded-full bg-background px-1.5 py-0.5 font-detail text-[10px] tabular-nums">
                {group.answers.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.key} value={group.key}>
            {group.answers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ninguém respondeu esta pergunta ainda.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {group.answers.map((answer) => (
                  <li
                    key={answer.id}
                    className="flex gap-3 rounded border border-border bg-secondary p-3.5"
                  >
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-foreground">{answer.text}</p>
                      <p className="mt-1 font-detail text-xs text-muted-foreground">
                        {formatDate(answer.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
