import { GripVertical } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * DragHandle — handle visual para reordenação via @dnd-kit/sortable.
 * Aceita spread de `attributes` e `listeners` do useSortable hook.
 */

export interface DragHandleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

export function DragHandle({ className, 'aria-label': ariaLabel = 'Arrastar para reordenar', ...props }: DragHandleProps) {
  return (
    <button
      type="button"
      className={cn(
        'cursor-grab touch-none rounded p-1 text-muted-foreground',
        'transition-colors hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'active:cursor-grabbing',
        className,
      )}
      aria-label={ariaLabel}
      {...props}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
