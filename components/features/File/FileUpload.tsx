'use client'

import { useRef, useState } from 'react'
import { useFileUpload } from '@/hooks/useFileUpload'
import { Submission } from '@/types/models'
import { Button } from '@/components/ui/Button'
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/constants'
import { formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  assignmentId: string
  onSuccess?: (submission: Submission) => void
}

export function FileUpload({ assignmentId, onSuccess }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { upload, isUploading, progress } = useFileUpload({
    assignmentId,
    onSuccess: (sub) => {
      setSuccess(true)
      setSelected(null)
      onSuccess?.(sub)
    },
    onError: setUploadError,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Файлын хэмжээ 10MB-аас хэтрэх боломжгүй')
      return
    }
    setUploadError('')
    setSelected(file)
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-4xl mb-2">📎</p>
        <p className="text-sm font-medium text-gray-700">Файл сонгох эсвэл чирж оруулах</p>
        <p className="text-xs text-gray-500 mt-1">
          {ALLOWED_FILE_EXTENSIONS.join(', ')} — Хамгийн ихдээ {formatFileSize(MAX_FILE_SIZE)}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
        />
      </div>

      {selected && (
        <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">{selected.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(selected.size)}</p>
          </div>
          <Button onClick={() => upload(selected)} isLoading={isUploading}>
            Илгээх
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      {success && <p className="text-sm text-green-600 font-medium">Тайлан амжилттай илгээгдлээ!</p>}
    </div>
  )
}
