import React from 'react'
import { cn } from '../../utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    primary: 'badge-primary',
    secondary: 'badge-secondary',
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  }

  const dotColors = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
  }

  return (
    <span
      className={cn('badge', variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-2 h-2 rounded-full', dotColors[variant], 'animate-pulse')}
        />
      )}
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'

export default Badge
