/**
 * src/components/admin/moldura/drawFrame.ts
 *
 * Função de desenho ÚNICA usada tanto pelo preview ao vivo (canvas reduzido)
 * quanto pelo export (canvas offscreen 1080×1350 nativo). Como é o mesmo código
 * em escalas diferentes, o preview É exatamente o PNG final — fidelidade de
 * pixel garantida, sem html2canvas.
 *
 * Ordem de desenho:
 *   1. moldura.png como fundo inteiro (opaco)
 *   2. foto do cliente recortada em círculo, POR CIMA da área clara central
 *   3. nome sobre a barra dourada (uppercase, auto-encolher, sombra)
 */

import { FRAME, maxTextWidth, type FrameConfig } from './frameConfig'

/** Retângulo de recorte da foto original (saída do react-easy-crop). */
export interface CropPixels {
  x: number
  y: number
  width: number
  height: number
}

export interface DrawState {
  /** Moldura já carregada. */
  frameImg: CanvasImageSource
  /** Foto do cliente já carregada e normalizada (orientação EXIF aplicada). */
  photoImg?: CanvasImageSource | null
  /** Sub-retângulo selecionado da foto (react-easy-crop). */
  crop?: CropPixels | null
  /** Texto do nome (será uppercase se a config pedir). */
  name: string
  /** Família da fonte (string exata do next/font: font.style.fontFamily). */
  fontFamily: string
  /** Peso da fonte. */
  fontWeight: number
  /** Tamanho-base desejado (o auto-encolher só reduz a partir daqui). */
  fontSize: number
  /**
   * Deslocamento do nome em relação ao centro da barra, em px NATIVOS.
   * {0,0} = centralizado. O componente já clampa para dentro da barra.
   */
  nameOffset?: { x: number; y: number }
}

/**
 * Aplica letter-spacing no contexto se suportado (todos os browsers modernos).
 * measureText passa a considerá-lo automaticamente.
 */
function applyLetterSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  if ('letterSpacing' in ctx) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
  }
}

/** Canvas offscreen só para medir texto (criado sob demanda, apenas no browser). */
let measureCanvas: HTMLCanvasElement | null = null
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCanvas) measureCanvas = document.createElement('canvas')
  return measureCanvas.getContext('2d')!
}

/**
 * Calcula o tamanho de fonte que faz o nome caber na barra (auto-encolher) e a
 * largura resultante. Usado pelo desenho E pelo clamp do arrasto do nome.
 * Passe um `ctx` para reaproveitar o contexto de desenho; senão usa o offscreen.
 */
export function fitName(
  label: string,
  fontFamily: string,
  fontWeight: number,
  desiredSize: number,
  config: FrameConfig = FRAME,
  ctx?: CanvasRenderingContext2D,
): { size: number; width: number } {
  const m = ctx ?? getMeasureCtx()
  const budget = maxTextWidth(config)
  applyLetterSpacing(m, config.text.letterSpacing)

  let size = Math.min(desiredSize, config.text.maxSize)
  m.font = `${fontWeight} ${size}px ${fontFamily}`
  while (size > config.text.minSize && m.measureText(label).width > budget) {
    size -= 1
    m.font = `${fontWeight} ${size}px ${fontFamily}`
  }
  return { size, width: m.measureText(label).width }
}

/**
 * Desenha o quadro completo no contexto informado.
 * @param scale fator de escala (1 = nativo 1080×1350; <1 = preview reduzido).
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: DrawState,
  scale = 1,
  config: FrameConfig = FRAME,
): void {
  const { canvas, photo, nameBar, text } = config

  ctx.save()
  ctx.clearRect(0, 0, canvas.width * scale, canvas.height * scale)
  ctx.scale(scale, scale)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // 1. Moldura de fundo (inteira)
  ctx.drawImage(state.frameImg, 0, 0, canvas.width, canvas.height)

  // 2. Foto recortada em círculo, por cima
  if (state.photoImg && state.crop) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(photo.cx, photo.cy, photo.r, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    const { x, y, width, height } = state.crop
    // Destino: quadrado que circunscreve o círculo. crop é quadrado (aspect=1),
    // então o mapeamento quadrado→quadrado não distorce.
    ctx.drawImage(
      state.photoImg,
      x,
      y,
      width,
      height,
      photo.cx - photo.r,
      photo.cy - photo.r,
      photo.r * 2,
      photo.r * 2,
    )
    ctx.restore()
  }

  // 3. Nome sobre a barra dourada
  const label = text.uppercase ? state.name.toUpperCase() : state.name
  if (label.trim().length > 0) {
    // Auto-encolher: reaproveita a mesma lógica do clamp de arrasto.
    const { size } = fitName(
      label,
      state.fontFamily,
      state.fontWeight,
      state.fontSize,
      config,
      ctx,
    )
    ctx.font = `${state.fontWeight} ${size}px ${state.fontFamily}`
    applyLetterSpacing(ctx, text.letterSpacing)

    const offset = state.nameOffset ?? { x: 0, y: 0 }
    const cx = nameBar.centerX + offset.x
    const cy = nameBar.centerY + offset.y

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = text.color
    ctx.shadowColor = text.shadow.color
    ctx.shadowBlur = text.shadow.blur
    ctx.shadowOffsetX = text.shadow.offsetX
    ctx.shadowOffsetY = text.shadow.offsetY
    ctx.fillText(label, cx, cy)
  }

  ctx.restore()
}
