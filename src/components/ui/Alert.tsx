import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        default:     'border-border bg-muted text-foreground',
        success:     'border-success/30 bg-success/10 text-foreground',
        warning:     'border-warning/30 bg-warning/10 text-foreground',
        destructive: 'border-destructive/30 bg-destructive/10 text-foreground',
        info:        'border-info/30 bg-info/10 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const iconMap = {
  default:     Info,
  success:     CheckCircle2,
  warning:     TriangleAlert,
  destructive: AlertCircle,
  info:        Info,
}

const iconColorMap = {
  default:     'text-muted-foreground',
  success:     'text-success',
  warning:     'text-warning',
  destructive: 'text-destructive',
  info:        'text-info',
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  icon?: boolean
}

function Alert({ className, variant = 'default', title, icon = true, children, ...props }: AlertProps) {
  const Icon = iconMap[variant ?? 'default']
  const iconColor = iconColorMap[variant ?? 'default']

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon && <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} aria-hidden="true" />}
      <div className="flex flex-col gap-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  )
}

export { Alert }
