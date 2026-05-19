/**
 * Template: Pix expirado sem pagamento.
 * Enviado quando polling detecta pix_expires_at < now() com status pending.
 *
 * TODO TF03: substituir textos placeholder pelo conteúdo real do evento.
 */

import { Section, Text, Hr } from '@react-email/components'
import * as React from 'react'
import { BaseEmail, styles } from './base'
import type { Order } from '@/repositories/OrderRepository'

interface PaymentExpiredEmailProps {
  order: Order
  eventName: string   // TODO TF03
  appUrl: string
}

export default function PaymentExpiredEmail({
  order,
  eventName,
  appUrl,
}: PaymentExpiredEmailProps) {
  return (
    <BaseEmail previewText={`Seu Pix para ${eventName} expirou — mas ainda há vagas`}>

      <Text style={{ ...styles.p, fontSize: '28px', textAlign: 'center', margin: '0 0 16px 0' }}>
        ⏰
      </Text>

      <Text style={{ ...styles.h1, textAlign: 'center' }}>
        Seu código Pix expirou
      </Text>

      <Text style={{ ...styles.p, textAlign: 'center' }}>
        Olá, <strong>{order.buyer_name}</strong>!
        O tempo para pagamento do pedido{' '}
        <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> encerrou.
      </Text>

      <Hr style={styles.divider} />

      <Text style={{ ...styles.p, textAlign: 'center' }}>
        Ainda há ingressos disponíveis para <strong>{eventName}</strong>.
        Gere um novo código para concluir sua compra.
      </Text>

      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <a
          href={`${appUrl}/#ingressos`}
          style={{
            backgroundColor: '#C9A84C',
            color: '#0D0D0D',
            fontSize: '14px',
            fontWeight: 700,
            padding: '12px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Garantir meu ingresso
        </a>
      </Section>

      <Hr style={styles.divider} />

      <Text style={{ ...styles.muted, textAlign: 'center' }}>
        Se não reconhece este pedido, ignore este e-mail.
      </Text>

    </BaseEmail>
  )
}
