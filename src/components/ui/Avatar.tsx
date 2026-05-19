import { forwardRef } from 'react'
import * as RadixAvatar from '@radix-ui/react-avatar'
import { cn } from '@/utils/cn'

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
const AvatarRoot = forwardRef<
  React.ElementRef<typeof RadixAvatar.Root>,
  React.ComponentPropsWithoutRef<typeof RadixAvatar.Root>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
))
AvatarRoot.displayName = RadixAvatar.Root.displayName

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------
const AvatarImage = forwardRef<
  React.ElementRef<typeof RadixAvatar.Image>,
  React.ComponentPropsWithoutRef<typeof RadixAvatar.Image>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = RadixAvatar.Image.displayName

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------
const AvatarFallback = forwardRef<
  React.ElementRef<typeof RadixAvatar.Fallback>,
  React.ComponentPropsWithoutRef<typeof RadixAvatar.Fallback>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium',
      className,
    )}
    {...props}
  />
))
AvatarFallback.displayName = RadixAvatar.Fallback.displayName

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  return (
    <AvatarRoot className={cn(sizeClass[size], className)}>
      {src && <AvatarImage src={src} alt={alt ?? fallback ?? 'avatar'} />}
      <AvatarFallback>{fallback ?? '?'}</AvatarFallback>
    </AvatarRoot>
  )
}

export { Avatar, AvatarRoot, AvatarImage, AvatarFallback }
