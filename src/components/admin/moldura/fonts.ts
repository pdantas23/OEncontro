/**
 * src/components/admin/moldura/fonts.ts
 *
 * Fontes curadas para o nome na barra dourada, carregadas via next/font/google
 * (self-hosted, sem request externo). subsets latin + latin-ext garantem acentos
 * do português (ç, ã, é, õ, â…).
 *
 * `font.style.fontFamily` devolve o nome de família (hasheado) que usamos tanto
 * no CSS quanto no canvas (ctx.font e document.fonts.load).
 */

import { Montserrat, Poppins, Anton } from 'next/font/google'
import localFont from 'next/font/local'

// Lufga — fonte comercial de uso pessoal, auto-hospedada (arquivos em
// src/assets/fonts/lufga). Não está no Google Fonts, por isso via next/font/local.
const lufga = localFont({
  src: [
    { path: '../../../assets/fonts/lufga/LufgaRegular.woff', weight: '400', style: 'normal' },
    { path: '../../../assets/fonts/lufga/LufgaSemiBold.woff', weight: '600', style: 'normal' },
    { path: '../../../assets/fonts/lufga/LufgaBold.woff', weight: '700', style: 'normal' },
  ],
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  display: 'swap',
})

const anton = Anton({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  display: 'swap',
})

export interface FontOption {
  id: string
  label: string
  /** Família exata para ctx.font / document.fonts.load. */
  family: string
  /** Peso usado no desenho. */
  weight: number
  /** Classe do next/font (para pré-carregar via DOM). */
  className: string
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'lufga',
    label: 'Lufga',
    family: lufga.style.fontFamily,
    weight: 700,
    className: lufga.className,
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    family: montserrat.style.fontFamily,
    weight: 700,
    className: montserrat.className,
  },
  {
    id: 'anton',
    label: 'Anton',
    family: anton.style.fontFamily,
    weight: 400,
    className: anton.className,
  },
  {
    id: 'poppins',
    label: 'Poppins',
    family: poppins.style.fontFamily,
    weight: 600,
    className: poppins.className,
  },
]

/** Fonte padrão (definida pelo usuário: Montserrat Bold). */
export const DEFAULT_FONT_ID = 'montserrat'

export function getFont(id: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0]
}
