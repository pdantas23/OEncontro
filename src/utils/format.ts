/**
 * src/utils/format.ts
 * Funções puras de formatação. Sem dependências de framework.
 */

export function formatCurrency(valueInReais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInReais)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return ''
  // timeStr format: 'HH:MM:SS' from Supabase time column
  const [h, m] = timeStr.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (digits.length === 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return phone
}

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Máscara progressiva de telefone — formata enquanto o usuário digita.
 * Aceita valores parciais (1 a 11 dígitos) e ignora qualquer caractere não-numérico.
 */
export function maskPhoneProgressive(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

/**
 * Máscara progressiva de CPF — formata enquanto o usuário digita.
 * Aceita valores parciais (1 a 11 dígitos) e ignora qualquer caractere não-numérico.
 */
export function maskCpfProgressive(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

/** Retorna iniciais de um nome (ex: "Ana Lima" → "AL") */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

/** Formata dias do evento em pt-BR. Deduplica + ordena ASC. Ex: [17] → "Dia 17", [18,19] → "Dias 18 e 19" */
export function formatEventDaysLabel(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return ''
  const unique = [...new Set(days)].sort((a, b) => a - b)
  if (unique.length === 1) return `Dia ${unique[0]}`
  const last = unique[unique.length - 1]
  const rest = unique.slice(0, -1)
  return `Dias ${rest.join(', ')} e ${last}`
}
