'use client'

/**
 * src/components/admin/moldura/MolduraEditor.tsx
 *
 * Gerador de moldura "Eu Vou!" — 100% client-side. A foto NUNCA sai do browser:
 * upload → recorte circular (react-easy-crop) → composição em canvas → download
 * do PNG em 1080×1350 nativo. Sem backend, storage ou DB.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { toast } from 'sonner'
import { Upload, Download, ImageOff, Frame } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { FRAME } from './frameConfig'
import { drawFrame, fitName, type CropPixels, type DrawState } from './drawFrame'
import { FONT_OPTIONS, DEFAULT_FONT_ID, getFont } from './fonts'

/** Escala do canvas de preview (nativo é 1080×1350). 0.5 = 540×675, nítido. */
const PREVIEW_SCALE = 0.5
const PREVIEW_W = FRAME.canvas.width * PREVIEW_SCALE
const PREVIEW_H = FRAME.canvas.height * PREVIEW_SCALE

function clamp(v: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2
  return Math.min(max, Math.max(min, v))
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = src
  })
}

/**
 * Normaliza a foto enviada: aplica orientação EXIF e devolve um objectURL +
 * HTMLImageElement compartilhados pelo cropper e pelo desenho (mesmos pixels).
 */
async function normalizePhoto(
  file: File,
): Promise<{ url: string; img: HTMLImageElement }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
    bitmap.close?.()
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob falhou'))), 'image/jpeg', 0.95),
    )
    const url = URL.createObjectURL(blob)
    return { url, img: await loadImage(url) }
  } catch {
    // Fallback: browsers antigos sem imageOrientation — usa o arquivo direto.
    const url = URL.createObjectURL(file)
    return { url, img: await loadImage(url) }
  }
}

export function MolduraEditor() {
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null)
  const [loadingPhoto, setLoadingPhoto] = useState(false)

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropPixels | null>(null)

  const [name, setName] = useState('')
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID)
  const [fontSize, setFontSize] = useState(FRAME.text.maxSize)
  const [nameOffset, setNameOffset] = useState({ x: 0, y: 0 })

  const [fontTick, setFontTick] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const previewRef = useRef<HTMLCanvasElement>(null)
  const draggingName = useRef(false)
  const photoUrlRef = useRef<string | null>(null)

  // Carrega a moldura uma vez.
  useEffect(() => {
    let alive = true
    loadImage(FRAME.src)
      .then((img) => alive && setFrameImg(img))
      .catch(() => toast.error('Não consegui carregar a moldura.'))
    return () => {
      alive = false
    }
  }, [])

  // Garante que a fonte selecionada esteja carregada antes de desenhar.
  useEffect(() => {
    const font = getFont(fontId)
    if (typeof document === 'undefined' || !document.fonts) return
    document.fonts
      .load(`${font.weight} 64px ${font.family}`)
      .then(() => setFontTick((t) => t + 1))
      .catch(() => undefined)
  }, [fontId])

  // Revoga objectURL da foto ao desmontar.
  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    }
  }, [])

  const drawState = useMemo<Omit<DrawState, 'frameImg'>>(() => {
    const font = getFont(fontId)
    return {
      photoImg,
      crop: croppedAreaPixels,
      name,
      fontFamily: font.family,
      fontWeight: font.weight,
      fontSize,
      nameOffset,
    }
  }, [photoImg, croppedAreaPixels, name, fontId, fontSize, nameOffset])

  // Redesenha o preview a cada mudança.
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !frameImg) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const raf = requestAnimationFrame(() => {
      drawFrame(ctx, { frameImg, ...drawState }, PREVIEW_SCALE)
    })
    return () => cancelAnimationFrame(raf)
  }, [frameImg, drawState, fontTick])

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.')
      return
    }
    setLoadingPhoto(true)
    try {
      const { url, img } = await normalizePhoto(file)
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
      photoUrlRef.current = url
      setPhotoUrl(url)
      setPhotoImg(img)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setNameOffset({ x: 0, y: 0 })
    } catch {
      toast.error('Não consegui abrir essa imagem.')
    } finally {
      setLoadingPhoto(false)
    }
  }, [])

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  // ---- Arrasto do nome sobre o preview (travado dentro da barra) ----
  const clampOffset = useCallback(
    (nativeX: number, nativeY: number) => {
      const label = FRAME.text.uppercase ? name.toUpperCase() : name
      const font = getFont(fontId)
      const { size, width } = fitName(label, font.family, font.weight, fontSize)
      const halfW = width / 2
      const halfH = size / 2
      const { nameBar } = FRAME
      const minCX = nameBar.x1 + nameBar.paddingX + halfW
      const maxCX = nameBar.x2 - nameBar.paddingX - halfW
      const minCY = nameBar.y1 + halfH + 4
      const maxCY = nameBar.y2 - halfH - 4
      return {
        x: clamp(nativeX, minCX, maxCX) - nameBar.centerX,
        y: clamp(nativeY, minCY, maxCY) - nameBar.centerY,
      }
    },
    [name, fontId, fontSize],
  )

  const moveNameTo = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = previewRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const backingX = (clientX - rect.left) * (canvas.width / rect.width)
      const backingY = (clientY - rect.top) * (canvas.height / rect.height)
      const nativeX = backingX / PREVIEW_SCALE
      const nativeY = backingY / PREVIEW_SCALE
      setNameOffset(clampOffset(nativeX, nativeY))
    },
    [clampOffset],
  )

  const canDrag = name.trim().length > 0 && !!photoImg

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDrag) return
    draggingName.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    moveNameTo(e.clientX, e.clientY)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingName.current) return
    moveNameTo(e.clientX, e.clientY)
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingName.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // ---- Export nativo 1080×1350 ----
  const handleDownload = useCallback(async () => {
    if (!frameImg || !photoImg || !croppedAreaPixels) return
    setExporting(true)
    try {
      const font = getFont(fontId)
      if (document.fonts) await document.fonts.load(`${font.weight} 64px ${font.family}`)

      const canvas = document.createElement('canvas')
      canvas.width = FRAME.canvas.width
      canvas.height = FRAME.canvas.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('sem contexto 2d')

      drawFrame(ctx, { frameImg, ...drawState }, 1)

      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob falhou'))), 'image/png'),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eu-vou-${slugify(name) || 'moldura'}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Moldura baixada!')
    } catch {
      toast.error('Não consegui gerar o PNG.')
    } finally {
      setExporting(false)
    }
  }, [frameImg, photoImg, croppedAreaPixels, drawState, fontId, name])

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
          <Frame className="h-6 w-6 text-accent" aria-hidden="true" />
          Moldura “Eu Vou!”
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suba uma foto, ajuste no círculo e escreva o nome. O resultado é gerado no
          seu navegador em alta resolução — a foto não é enviada para nenhum servidor.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Coluna de controles */}
        <div className="flex flex-col gap-6">
          {/* Foto */}
          <section className="rounded-lg border border-border bg-secondary/40 p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">1. Foto</h2>

            {!photoUrl ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  handleFile(e.dataTransfer.files[0])
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors',
                  isDragOver
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/60 hover:bg-muted/50',
                )}
              >
                <Upload className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">
                  {loadingPhoto ? 'Processando…' : 'Arraste uma foto ou clique'}
                </span>
                <span className="text-xs text-muted-foreground">JPG, PNG ou WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            ) : (
              <>
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-neutral-900">
                  <Cropper
                    image={photoUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    minZoom={1}
                    maxZoom={4}
                    restrictPosition
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-accent"
                    aria-label="Zoom da foto"
                  />
                </div>

                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-primary hover:underline">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Trocar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
              </>
            )}
          </section>

          {/* Nome */}
          <section className="rounded-lg border border-border bg-secondary/40 p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">2. Nome</h2>

            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameOffset({ x: 0, y: 0 })
              }}
              placeholder="Ex.: Maria Antônia"
              maxLength={40}
              aria-label="Nome na moldura"
            />

            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Fonte
              </span>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFontId(font.id)}
                    className={cn(
                      font.className,
                      'rounded-md border px-3 py-1.5 text-sm uppercase tracking-wide transition-colors',
                      fontId === font.id
                        ? 'border-accent bg-accent/15 text-foreground'
                        : 'border-border text-muted-foreground hover:border-accent/60',
                    )}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Tamanho do nome
              </label>
              <input
                type="range"
                min={FRAME.text.minSize}
                max={FRAME.text.maxSize}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-accent"
                aria-label="Tamanho do nome"
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Dica: arraste o nome direto no preview para reposicionar dentro da barra.
            </p>
          </section>
        </div>

        {/* Coluna de preview + export */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[360px]">
            <canvas
              ref={previewRef}
              width={PREVIEW_W}
              height={PREVIEW_H}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={cn(
                'w-full rounded-lg border border-border bg-muted shadow-sm touch-none',
                canDrag ? 'cursor-move' : 'cursor-default',
              )}
              aria-label="Pré-visualização da moldura"
            />
            {!photoImg && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ImageOff className="h-3.5 w-3.5" aria-hidden="true" />
                Suba uma foto para começar
              </p>
            )}
          </div>

          <Button
            onClick={handleDownload}
            disabled={!photoImg || !croppedAreaPixels}
            loading={exporting}
            size="lg"
            className="w-full max-w-[360px]"
          >
            {!exporting && <Download className="h-4 w-4" aria-hidden="true" />}
            Baixar PNG (1080×1350)
          </Button>
        </div>
      </div>
    </div>
  )
}
