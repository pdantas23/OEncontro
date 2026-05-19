/**
 * src/lib/email/templates/base.tsx
 *
 * Layout base para todos os e-mails transacionais.
 * Usa @react-email/components — CSS inline para compatibilidade com clientes de e-mail.
 *
 * TODO TF03: substituir cor, nome e marca pelo material real do evento.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Font,
  Preview,
} from '@react-email/components'
import * as React from 'react'

// Cores do tema (inline — não usar CSS classes em e-mails)
const colors = {
  primary: '#C9A84C',
  background: '#0D0D0D',
  card: '#1A1A1A',
  foreground: '#F5F5F5',
  muted: '#888888',
  border: '#2A2A2A',
}

interface BaseEmailProps {
  previewText: string
  children: React.ReactNode
}

export function BaseEmail({ previewText, children }: BaseEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTkzl.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: colors.background, margin: 0, padding: 0, fontFamily: 'DM Sans, Helvetica, Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>

          {/* Logo / cabeçalho */}
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Text style={{ color: colors.primary, fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>
              {/* TODO TF03: substituir pelo nome real do evento */}
              EVENTO
            </Text>
          </Section>

          {/* Conteúdo */}
          <Section style={{ backgroundColor: colors.card, borderRadius: '12px', border: `1px solid ${colors.border}`, padding: '32px' }}>
            {children}
          </Section>

          {/* Rodapé */}
          <Hr style={{ borderColor: colors.border, margin: '24px 0' }} />
          <Text style={{ color: colors.muted, fontSize: '12px', textAlign: 'center', margin: 0 }}>
            {/* TODO TF03: substituir pelos dados reais do evento */}
            Este e-mail foi enviado automaticamente. Em caso de dúvidas, entre em contato pelo WhatsApp de suporte.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

// Helpers de estilo reutilizáveis
export const styles = {
  h1: {
    color: colors.foreground,
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    lineHeight: '1.3',
  } as React.CSSProperties,
  p: {
    color: colors.foreground,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  muted: {
    color: colors.muted,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  primary: { color: colors.primary } as React.CSSProperties,
  divider: { borderColor: colors.border, margin: '20px 0' } as React.CSSProperties,
  label: {
    color: colors.muted,
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '0 0 4px 0',
  } as React.CSSProperties,
  value: {
    color: colors.foreground,
    fontSize: '14px',
    margin: '0 0 12px 0',
  } as React.CSSProperties,
}
