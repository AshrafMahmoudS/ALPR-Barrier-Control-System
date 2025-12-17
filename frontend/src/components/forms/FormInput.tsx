import React, { forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: LucideIcon
  fullWidth?: boolean
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon: Icon, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          )}
          <input
            ref={ref}
            className={`
              ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
              bg-white/5 border rounded-xl text-slate-100 placeholder-slate-500
              focus:outline-none focus:ring-2 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error
                ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/50'
              }
              ${fullWidth ? 'w-full' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
