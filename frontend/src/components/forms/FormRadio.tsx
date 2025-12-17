import React, { forwardRef } from 'react'

interface FormRadioOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
}

interface FormRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  options: FormRadioOption[]
  orientation?: 'vertical' | 'horizontal'
}

const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  ({ label, error, helperText, options, orientation = 'vertical', className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-3">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className={`
          flex gap-4
          ${orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}
        `}>
          {options.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-start gap-3 cursor-pointer group
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  ref={ref}
                  type="radio"
                  value={option.value}
                  disabled={option.disabled}
                  className="peer sr-only"
                  {...props}
                />
                <div className={`
                  w-5 h-5 rounded-full border-2 transition-all duration-200
                  peer-checked:border-blue-500
                  peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-focus:ring-offset-2 peer-focus:ring-offset-slate-900
                  peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                  ${error
                    ? 'border-red-500/50'
                    : 'border-white/30 group-hover:border-blue-400/50'
                  }
                `}>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex-1">
                <span className="text-sm font-medium text-slate-200 select-none">
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    )
  }
)

FormRadio.displayName = 'FormRadio'

export default FormRadio
