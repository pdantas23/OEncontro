'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { formatEventDaysLabel } from '@/utils/format'

interface EventDaysInputProps {
  value: number[]
  onChange: (days: number[]) => void
}

export function EventDaysInput({ value, onChange }: EventDaysInputProps) {
  const [input, setInput] = useState('')
  const [flashId, setFlashId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // normaliza dedup + sort ASC sempre (defensivo contra entrada externa fora de ordem)
  const sorted = [...new Set(value)].sort((a, b) => a - b)

  function commit(raw: string): boolean {
    const n = parseInt(raw.trim(), 10)
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return false
    if (sorted.includes(n)) {
      // duplicata — pisca o chip existente em vez de adicionar silenciosamente
      setFlashId(n)
      setTimeout(() => setFlashId(null), 600)
      return true
    }
    onChange([...sorted, n].sort((a, b) => a - b))
    return true
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (commit(input)) setInput('')
    } else if (e.key === 'Backspace' && input === '' && sorted.length > 0) {
      onChange(sorted.slice(0, -1))
    }
  }

  function removeChip(n: number) {
    onChange(sorted.filter((d) => d !== n))
    inputRef.current?.focus()
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">Dias do evento</label>
      <div
        className="flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {sorted.map((d) => (
          <span
            key={d}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium transition-all ${
              flashId === d
                ? 'animate-pulse bg-amber-200 text-amber-900'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {d}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeChip(d) }}
              className="rounded hover:bg-primary/20"
              aria-label={`Remover dia ${d}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim() !== '' && commit(input)) setInput('')
          }}
          inputMode="numeric"
          placeholder={sorted.length === 0 ? 'Digite um dia e pressione Enter (ex: 17)' : ''}
          className="min-w-[140px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {sorted.length > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Será exibido como: <span className="text-foreground">{formatEventDaysLabel(sorted)}</span>
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Aceita Enter ou vírgula como separador. Backspace remove o último chip.
        </p>
      )}
    </div>
  )
}
