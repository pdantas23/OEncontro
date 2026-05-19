import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200',
  {
    variants: {
      variant: {
        default:     'bg-primary/20 text-primary border border-primary/30',
        secondary:   'bg-muted text-muted-foreground border border-border',
        success:     'bg-success/20 text-success border border-success/30',
        warning:     'bg-warning/20 text-warning border border-warning/30',
        destructive: 'bg-destructive/20 text-destructive border border-destructive/30',
        info:        'bg-info/20 text-info border border-info/30',
        outline:     'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
