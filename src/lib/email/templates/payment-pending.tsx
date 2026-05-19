/**
 * Template: Pix gerado — aguardando pagamento.
 * Enviado imediatamente após geração do QR Code Pix.
 *
 * O QR Code chega como base64 (gerado no servidor via qrcode lib).
 * Funciona em todos os clientes de e-mail sem dependência externa.
 *
 * TODO TF03: substituir textos placeholder pelo conteúdo real do evento.
 */

import { Section, Text, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { BaseEmail, styles } from './base'
import { formatCurrency } from '@/utils/format'
import type { Order } from '@/repositories/OrderRepository'

interface PaymentPendingEmailProps {
  order: Order
  eventName: string   // TODO TF03
  qrCodeBase64: string // data:image/png;base64,...
  pixExpiresAt: string // formatado para leitura
}

export default function PaymentPendingEmail({
  order,
  eventName,
  qrCodeBase64,
  pixExpiresAt,
}: PaymentPendingEmailProps) {
  return (
    <BaseEmail previewText={`Seu código Pix para ${eventName} — pague em até 30 minutos`}>

      <Text style={{ ...styles.p, fontSize: '28px', textAlign: 'center', margin: '0 0 16px 0' }}>
        📱
      </Text>

      <Text style={{ ...styles.h1, textAlign: 'center' }}>
        Pague via Pix
      </Text>

      <Text style={{ ...styles.p, textAlign: 'center' }}>
        Olá, <strong>{order.buyer_name}</strong>! Seu pedido foi registrado.
        Complete o pagamento para garantir seu ingresso.
      </Text>

      <Hr style={styles.divider} />

      {/* QR Code */}
      <Section style={{ textAlign: 'center', margin: '16px 0' }}>
        <Img
          src={qrCodeBase64}
          alt="QR Code Pix"
          width="200"
          height="200"
          style={{ display: 'block', margin: '0 auto', borderRadius: '8px' }}
        />
      </Section>

      {/* Código copia e cola */}
      {order.pix_code && (
        <Section style={{ margin: '16px 0' }}>
          <Text style={styles.label}>Código Pix (copia e cola)</Text>
          <Text style={{
            backgroundColor: '#111',
            border: '1px solid #2A2A2A',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '11px',
            color: '#888',
            wordBreak: 'break-all',
            margin: 0,
            fontFamily: 'monospace',
          }}>
            {order.pix_code}
          </Text>
        </Section>
      )}

      <Hr style={styles.divider} />

      <Text style={styles.label}>Valor a pagar</Text>
      <Text style={{ ...styles.value, ...styles.primary, fontSize: '20px', fontWeight: 700 }}>
        {formatCurrency(order.total)}
      </Text>

      <Text style={styles.label}>Evento</Text>
      <Text style={styles.value}>{eventName}</Text>

      <Text style={styles.label}>Pedido</Text>
      <Text style={styles.value}>#{order.id.slice(0, 8).toUpperCase()}</Text>

      <Hr style={styles.divider} />

      <Text style={{ ...styles.muted, textAlign: 'center' }}>
        ⏰ Este código expira em{' '}
        <strong style={{ color: '#F5F5F5' }}>{pixExpiresAt}</strong>.
        Após este prazo, gere um novo código.
      </Text>

    </BaseEmail>
  )
}
