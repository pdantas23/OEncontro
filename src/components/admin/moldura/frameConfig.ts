/**
 * src/components/admin/moldura/frameConfig.ts
 *
 * Configuração PARAMETRIZÁVEL da moldura "Eu Vou!".
 * Todas as coordenadas são em pixels no canvas NATIVO (1080×1350).
 * Para trocar a moldura no futuro: substitua o PNG e ajuste os números aqui —
 * nenhum outro arquivo precisa mudar.
 *
 * Coordenadas conferidas sobre a arte (ponto de partida; ajuste fino ±10px
 * olhando o preview ao vivo).
 */

export interface FrameConfig {
  /** Caminho do PNG de fundo (relativo à raiz pública, respeita basePath). */
  src: string
  /** Dimensões nativas do canvas de export. */
  canvas: { width: number; height: number }
  /** Círculo onde a foto do cliente é recortada (clip). */
  photo: {
    cx: number
    cy: number
    /** Raio: borda da foto deve encostar por dentro do anel dourado. */
    r: number
  }
  /** Barra dourada onde o nome é escrito. */
  nameBar: {
    x1: number
    y1: number
    x2: number
    y2: number
    /** Centro padrão do texto. */
    centerX: number
    centerY: number
    /**
     * Zona da "ponta dobrada" no canto inferior direito — o texto NUNCA
     * deve invadir esta área.
     */
    safeCorner: { x1: number; y1: number; x2: number; y2: number }
    /** Respiro interno horizontal aplicado às bordas da barra. */
    paddingX: number
  }
  /** Estilo padrão do texto do nome. */
  text: {
    color: string
    uppercase: boolean
    /** Espaçamento entre letras (px, escala nativa). */
    letterSpacing: number
    /** Tamanho máximo da fonte (px). */
    maxSize: number
    /** Tamanho mínimo antes de parar de encolher (px). */
    minSize: number
    shadow: { color: string; blur: number; offsetX: number; offsetY: number }
  }
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const FRAME: FrameConfig = {
  src: `${basePath}/moldura/moldura.png`,
  canvas: { width: 1080, height: 1350 },
  photo: {
    cx: 540,
    cy: 556,
    r: 240,
  },
  nameBar: {
    // x = largura total da barra; y = FAIXA SUPERIOR livre (acima do "EU VOU!"
    // que já vem impresso na arte, ~y1040). O nome ocupa só essa faixa de cima.
    x1: 195,
    y1: 935,
    x2: 885,
    y2: 1010,
    centerX: 540,
    centerY: 972,
    // Ponta dobrada (canto inferior direito). Fica ABAIXO da faixa do nome,
    // então não afeta o texto — mantida só para referência/futuras molduras.
    safeCorner: { x1: 830, y1: 1030, x2: 895, y2: 1100 },
    paddingX: 24,
  },
  text: {
    color: '#FFFFFF',
    uppercase: true,
    letterSpacing: 2,
    maxSize: 52,
    minSize: 22,
    shadow: { color: 'rgba(0,0,0,0.35)', blur: 6, offsetX: 0, offsetY: 2 },
  },
}

/**
 * Largura máxima disponível para o texto do nome, descontando o padding da
 * barra. Como o nome fica na faixa superior (acima da ponta dobrada), usa-se a
 * largura cheia da barra.
 */
export function maxTextWidth(config: FrameConfig = FRAME): number {
  const { nameBar } = config
  return nameBar.x2 - nameBar.x1 - nameBar.paddingX * 2
}
