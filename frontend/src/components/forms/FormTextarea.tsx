import React, { forwardRef } from 'react'

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, fullWidth = true, resize = 'vertical', className = '', ...props }, ref) => {
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    }[resize]

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={`
            px-4 py-3 min-h-[100px]
            bg-white/5 border rounded-xl text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
              : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/50'
            }
            ${fullWidth ? 'w-full' : ''}
            ${resizeClass}
            ${className}
          `}
          {...props}
        />

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

FormTextarea.displayName = 'FormTextarea'

export default FormTextarea
