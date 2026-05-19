/**
 * Template: Pagamento confirmado (Pix pago ou cartão aprovado).
 * Enviado quando payment_status muda para 'paid'.
 *
 * TODO TF03: substituir textos placeholder pelo conteúdo real do evento.
 */

import { Section, Text, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { BaseEmail, styles } from './base'
import { formatCurrency } from '@/utils/format'
import type { Order } from '@/repositories/OrderRepository'

interface PaymentApprovedEmailProps {
  order: Order
  eventName: string   // TODO TF03
  eventDate: string   // TODO TF03
  eventLocation: string // TODO TF03
  groupLink?: string  // TODO TF03
}

export default function PaymentApprovedEmail({
  order,
  eventName,
  eventDate,
  eventLocation,
  groupLink,
}: PaymentApprovedEmailProps) {
  return (
    <BaseEmail previewText={`Seu ingresso para ${eventName} está confirmado!`}>

      {/* Ícone de sucesso (emoji — funciona em todos os clientes) */}
      <Text style={{ ...styles.p, fontSize: '32px', textAlign: 'center', margin: '0 0 16px 0' }}>
        ✅
      </Text>

      <Text style={{ ...styles.h1, textAlign: 'center' }}>
        Pagamento confirmado!
      </Text>

      <Text style={{ ...styles.p, textAlign: 'center' }}>
        Olá, <strong>{order.buyer_name}</strong>! Seu ingresso está garantido.
      </Text>

      <Hr style={styles.divider} />

      {/* Dados do pedido */}
      <Text style={styles.label}>Evento</Text>
      <Text style={{ ...styles.value, fontWeight: 600 }}>{eventName}</Text>

      <Text style={styles.label}>Data</Text>
      <Text style={styles.value}>{eventDate}</Text>

      <Text style={styles.label}>Local</Text>
      <Text style={styles.value}>{eventLocation}</Text>

      <Hr style={styles.divider} />

      <Text style={styles.label}>Número do pedido</Text>
      <Text style={styles.value}>#{order.id.slice(0, 8).toUpperCase()}</Text>

      <Text style={styles.label}>Total pago</Text>
      <Text style={{ ...styles.value, ...styles.primary, fontSize: '18px', fontWeight: 700 }}>
        {formatCurrency(order.total)}
      </Text>

      <Text style={styles.label}>Método de pagamento</Text>
      <Text style={styles.value}>
        {order.payment_method === 'pix' ? 'Pix' : 'Cartão de crédito'}
      </Text>

      <Hr style={styles.divider} />

      {/* CTA grupo */}
      {groupLink && (
        <Section style={{ textAlign: 'center' }}>
          <Text style={styles.muted}>
            Acesse o grupo exclusivo do evento para receber informações e atualizações:
          </Text>
          {/* TODO TF03: substituir texto e link do grupo */}
          <Text style={{ ...styles.p, textAlign: 'center' }}>
            <a href={groupLink} style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>
              Entrar no grupo →
            </a>
          </Text>
        </Section>
      )}

      <Text style={{ ...styles.muted, textAlign: 'center' }}>
        Guarde este e-mail — seu ingresso digital será enviado em breve. {/* TODO TF03 */}
      </Text>

    </BaseEmail>
  )
}
