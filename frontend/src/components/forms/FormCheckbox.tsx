import React, { forwardRef } from 'react'
import { Check } from 'lucide-react'

interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  description?: string
}

const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, helperText, description, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <div className={`
              w-5 h-5 rounded border-2 transition-all duration-200
              peer-checked:bg-blue-500 peer-checked:border-blue-500
              peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-900
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              ${error
                ? 'border-red-500/50'
                : 'border-white/30 group-hover:border-blue-400/50'
              }
            `}>
              <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span className="text-sm font-medium text-slate-200 select-none">
                  {label}
                  {props.required && <span className="text-red-400 ml-1">*</span>}
                </span>
              )}
              {description && (
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              )}
            </div>
          )}
        </label>

        {error && (
          <p className="mt-1.5 text-sm text-red-400 ml-8">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500 ml-8">{helperText}</p>
        )}
      </div>
    )
  }
)

FormCheckbox.displayName = 'FormCheckbox'

export default FormCheckbox
