/**
 * src/types/global.d.ts
 *
 * Extensões do objeto global Window para tracking.
 */

declare global {
  interface Window {
    /** dataLayer do Google Tag Manager */
    dataLayer: Record<string, unknown>[]
  }
}

export {}
