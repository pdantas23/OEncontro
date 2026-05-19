'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CarouselItem {
  id: string
  content: React.ReactNode
}

export interface CarouselProps {
  items: CarouselItem[]
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  itemClassName?: string
}

export function Carousel({
  items,
  className,
  showDots = true,
  showArrows = true,
  itemClassName,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + items.length) % items.length)
    },
    [items.length],
  )

  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])
  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo])

  if (items.length === 0) return null

  return (
    <div
      className={cn('relative', className)}
      role="region"
      aria-label="Carrossel"
      aria-roledescription="carousel"
    >
      {/* Track */}
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className={cn('w-full shrink-0', itemClassName)}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} de ${items.length}`}
              aria-hidden={i !== currentIndex}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && items.length > 1 && (
        <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Slides">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground',
              )}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
