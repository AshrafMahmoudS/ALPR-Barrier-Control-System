import React, { forwardRef, useState, useCallback } from 'react'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'

interface FormFileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  maxSize?: number // in MB
  preview?: boolean
  onFileSelect?: (file: File | null) => void
}

const FormFileUpload = forwardRef<HTMLInputElement, FormFileUploadProps>(
  ({ label, error, helperText, fullWidth = true, maxSize, preview = true, onFileSelect, className = '', ...props }, ref) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFileChange = useCallback((file: File | null) => {
      if (!file) {
        setSelectedFile(null)
        setPreviewUrl(null)
        onFileSelect?.(null)
        return
      }

      // Check file size
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`)
        return
      }

      setSelectedFile(file)
      onFileSelect?.(file)

      // Generate preview for images
      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }, [maxSize, preview, onFileSelect])

    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true)
      } else if (e.type === 'dragleave') {
        setDragActive(false)
      }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0])
      }
    }, [handleFileChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileChange(e.target.files[0])
      }
    }

    const clearFile = () => {
      handleFileChange(null)
      if (ref && 'current' in ref && ref.current) {
        ref.current.value = ''
      }
    }

    const isImage = selectedFile?.type.startsWith('image/')

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl transition-all duration-200
            ${dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : error
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-white/20 bg-white/5 hover:border-blue-500/50 hover:bg-white/[0.07]'
            }
          `}
        >
          <input
            ref={ref}
            type="file"
            onChange={handleInputChange}
            className="sr-only"
            id={`file-upload-${label}`}
            {...props}
          />

          {selectedFile ? (
            <div className="p-4">
              {previewUrl && isImage ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-200 truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <label
              htmlFor={`file-upload-${label}`}
              className="flex flex-col items-center justify-center p-8 cursor-pointer"
            >
              <div className="p-3 bg-blue-500/10 rounded-full mb-3">
                {props.accept?.startsWith('image/') ? (
                  <ImageIcon className="w-8 h-8 text-blue-400" />
                ) : (
                  <Upload className="w-8 h-8 text-blue-400" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                {props.accept || 'Any file type'}
                {maxSize && ` (Max ${maxSize}MB)`}
              </p>
            </label>
          )}
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

FormFileUpload.displayName = 'FormFileUpload'

export default FormFileUpload
