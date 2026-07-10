'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const PHOTOS = [
  { src: `${basePath}/photos/img1.jpeg`, alt: 'Edição anterior — momento 1' },
  { src: `${basePath}/photos/img2.webp`, alt: 'Edição anterior — momento 2' },
  { src: `${basePath}/photos/img3.webp`, alt: 'Edição anterior — momento 3' },
  { src: `${basePath}/photos/img4.webp`, alt: 'Edição anterior — momento 4' },
  { src: `${basePath}/photos/img5.webp`, alt: 'Edição anterior — momento 5' },
  { src: `${basePath}/photos/img6.webp`, alt: 'Edição anterior — momento 6' },
  { src: `${basePath}/photos/img7.webp`, alt: 'Edição anterior — momento 7' },
  { src: `${basePath}/photos/img8.webp`, alt: 'Edição anterior — momento 8' },
]

export function PhotoCarousel() {
  const [current, setCurrent] = useState(0)
  const total = PHOTOS.length

  const goTo = useCallback(
    (i: number) => setCurrent((i + total) % total),
    [total],
  )
  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  // Auto-play every 5s
  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 5000)
    return () => clearInterval(timer)
  }, [current, goTo])

  return (
    <div
      className="relative"
      role="region"
      aria-label="Fotos de edições anteriores"
      aria-roledescription="carousel"
    >
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {PHOTOS.map((photo, i) => (
            <div
              key={photo.src}
              className="w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`Foto ${i + 1} de ${total}`}
              aria-hidden={i !== current}
            >
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 1024px"
                  priority={i === 0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Próxima foto"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Fotos">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              i === current ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground',
            )}
            role="tab"
            aria-selected={i === current}
            aria-label={`Ir para foto ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
