import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CheckoutStepsProps {
  steps: string[]
  currentStep: number // índice base 0
  className?: string
}

export function CheckoutSteps({ steps, currentStep, className }: CheckoutStepsProps) {
  return (
    <nav
      aria-label="Etapas do checkout"
      className={cn('w-full', className)}
    >
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isPending = index > currentStep
          const isLast = index === steps.length - 1

          return (
            <li
              key={step}
              className={cn('flex items-center', !isLast && 'flex-1')}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Círculo do passo */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors duration-200',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    isPending && 'border border-border bg-muted text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label — visível apenas em md+ */}
                <span
                  className={cn(
                    'hidden text-xs md:block whitespace-nowrap',
                    isActive ? 'font-medium text-primary' : 'text-muted-foreground',
                    isCompleted && 'text-foreground',
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Linha conectora */}
              {!isLast && (
                <div
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors duration-200',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
