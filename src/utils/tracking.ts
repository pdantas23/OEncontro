/**
 * src/utils/tracking.ts
 *
 * Helper de rastreamento via dataLayer (Google Tag Manager).
 *
 * GTM é a camada única — Meta Pixel e Google Ads são configurados
 * como tags dentro do GTM, não como scripts separados no layout.
 *
 * Em desenvolvimento, com GTM ID placeholder, o dataLayer.push funciona
 * normalmente e pode ser inspecionado no console do browser.
 *
 * Todos os eventos do projeto passam por trackEvent().
 * Nunca chamar window.dataLayer.push diretamente fora deste arquivo.
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: name, ...params })
}

// ---------------------------------------------------------------------------
// Eventos tipados (9 eventos definidos no M8)
// ---------------------------------------------------------------------------

/** T097 — Visualização de página */
export function trackPageView(path: string): void {
  trackEvent('page_view', { page_path: path })
}

/** T098 — Seção da landing page se tornou visível (IntersectionObserver) */
export function trackScrollSection(sectionName: string): void {
  trackEvent('scroll_section', { section: sectionName })
}

/** T099 — Clique em botão CTA */
export function trackCtaClick(ctaName: string, destination?: string): void {
  trackEvent('cta_click', { cta_name: ctaName, destination })
}

/** T100 — Usuário selecionou um lote de ingresso e iniciou o checkout */
export function trackSelectTicket(lotId: string, lotName: string, price: number): void {
  trackEvent('select_ticket', {
    item_id: lotId,
    item_name: lotName,
    price: price / 100, // centavos → reais
    currency: 'BRL',
  })
}

/** T101 — Usuário avançou uma etapa no checkout wizard */
export function trackCheckoutStep(step: number, stepName: string): void {
  trackEvent('checkout_step_complete', { step, step_name: stepName })
}

/** T102 — Usuário selecionou o método de pagamento */
export function trackPaymentMethodSelected(method: 'pix' | 'card'): void {
  trackEvent('add_payment_info', { payment_type: method })
}

/**
 * T103 — Compra concluída (GA4 standard: purchase).
 * Disparado na página /obrigado quando status muda para 'paid'.
 */
export function trackPurchase(params: {
  orderId: string
  value: number    // centavos
  paymentMethod: string
}): void {
  trackEvent('purchase', {
    transaction_id: params.orderId,
    value: params.value / 100,
    currency: 'BRL',
    payment_type: params.paymentMethod,
  })
}

/** T104 — Usuário copiou o código Pix */
export function trackPixCopy(): void {
  trackEvent('pix_copy')
}

/** T105 — Consentimento LGPD aceito */
export function trackConsentAccepted(): void {
  trackEvent('consent_accepted')
}

/** T106 — Consentimento LGPD rejeitado */
export function trackConsentRejected(): void {
  trackEvent('consent_rejected')
}
