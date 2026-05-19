'use client'

/**
 * QRCode — renderiza QR Code no cliente.
 * Recebe value: string (código Pix) e size: number.
 * NÃO gerar QR Code no servidor.
 */

import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/utils/cn'

export interface QRCodeProps {
  value: string
  size?: number
  className?: string
  label?: string
}

export function QRCode({ value, size = 240, className, label = 'QR Code para pagamento' }: QRCodeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-white p-3',
        className,
      )}
      role="img"
      aria-label={label}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#0D0D0D"
        level="M"
        includeMargin={false}
      />
    </div>
  )
}
