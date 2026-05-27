/**
 * Textos legais aceitos no checkout (Step 3).
 *
 * Convenção de versionamento:
 *   Bump TERMS_VERSION sempre que QUALQUER um dos dois textos mudar.
 *   A versão é gravada no pedido (orders_encontro.accept_*_version),
 *   então pedidos antigos preservam qual texto aceitaram mesmo após edits.
 *   As colunas no banco são separadas (accept_image_rights_version vs
 *   accept_purchase_terms_version), o que permite no futuro migrar
 *   para versões independentes por termo sem nova migration.
 */

export const TERMS_VERSION = 'v1-2026-05-27' as const

export interface LegalTerm {
  version: string
  title: string
  body: string
}

export const IMAGE_RIGHTS_TERMS: LegalTerm = {
  version: TERMS_VERSION,
  title: 'Termo de Direito de Imagem',
  body: `Autorizo, de forma gratuita e por tempo indeterminado, o uso da minha imagem, voz e depoimentos captados durante O Encontro 2026, em fotografias e vídeos, para divulgação institucional do evento e de suas próximas edições — incluindo redes sociais (Instagram, Facebook, YouTube, TikTok), site oficial, materiais promocionais e e-mails de marketing.

Declaro que essa autorização é cedida sem ônus para a organização e que não terei direito a qualquer remuneração pelo uso das imagens.

Caso eu não deseje aparecer em registros, comprometo-me a comunicar a equipe de produção no dia do evento.`,
}

export const PURCHASE_TERMS: LegalTerm = {
  version: TERMS_VERSION,
  title: 'Regras de Compra e Política de Cancelamento',
  body: `Declaro que li e estou ciente das regras de compra deste evento:

1. Não-reembolso por desistência. Em caso de desistência por parte do(a) participante, o valor pago não será reembolsado, total ou parcialmente, independentemente do motivo ou da antecedência do aviso.

2. Transferência de titularidade. O ingresso pode ser transferido para outra pessoa até 72h antes do evento, mediante solicitação por e-mail ou WhatsApp à organização, com envio dos dados do novo titular.

3. Cancelamento pela organização. Caso o evento seja cancelado pela organização por qualquer motivo, o valor pago será reembolsado integralmente em até 30 dias.

4. Alterações de programação. A organização se reserva o direito de alterar a programação, palestrantes e atividades sem aviso prévio, mantendo a essência e o propósito do evento.`,
}
