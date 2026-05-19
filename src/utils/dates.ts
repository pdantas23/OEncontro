/**
 * src/utils/dates.ts
 * Funções puras de data/hora. Sem dependências de framework.
 */

export function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function minutesUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((new Date(dateStr).getTime() - Date.now()) / 60_000))
}

export function toDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

/** Formata "2025-08-15T10:00:00" → "15 de agosto de 2025" */
export function formatLongDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/** Formata "2025-08-15T10:00:00" → "sex., 15 ago." */
export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}
