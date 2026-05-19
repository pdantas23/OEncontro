import { cn } from '@/utils/cn'

export interface FooterProps {
  className?: string
}

/**
 * Footer da landing page.
 * Conteúdo (nome, data, contato) será substituído nas Tasks Finais TF03/TF04.
 */
export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="mx-auto max-w-7xl px-container-x py-12">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          {/* Marca */}
          <p className="font-display text-sm font-semibold text-primary">
            {/* Task Final TF03 */}
            Evento
          </p>

          {/* Info do evento */}
          <p className="text-xs text-muted-foreground">
            {/* Task Final TF04 */}
            Data e local a definir
          </p>

          {/* Direitos */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
