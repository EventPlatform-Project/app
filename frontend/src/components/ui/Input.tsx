import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-400 mb-1.5">
            {label}
          </label>
        )}
        <div className={cn(
          'flex items-center gap-2 h-9 rounded-lg border bg-orbit-surface2 px-3 text-sm transition-colors',
          'border-orbit-border focus-within:border-orbit-primary focus-within:ring-1 focus-within:ring-orbit-primary/30',
          error && 'border-orbit-danger focus-within:border-orbit-danger focus-within:ring-orbit-danger/30',
          props.disabled && 'opacity-50 cursor-not-allowed',
        )}>
          {prefix && <span className="text-slate-500 flex-shrink-0">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 bg-transparent text-slate-200 placeholder-slate-600 outline-none min-w-0',
              props.disabled && 'cursor-not-allowed',
              className
            )}
            {...props}
          />
          {suffix && <span className="text-slate-500 flex-shrink-0">{suffix}</span>}
        </div>
        {(error || hint) && (
          <p className={cn('text-xs mt-1.5', error ? 'text-orbit-danger' : 'text-slate-500')}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
