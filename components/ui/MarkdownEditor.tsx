'use client'

import { useState } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MarkdownEditorProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  rows?: number
  required?: boolean
}

export function MarkdownEditor({
  label,
  placeholder,
  value,
  onChange,
  error,
  rows = 8,
  required,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <div>
      {/* Label */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <span className="text-xs text-gray-400">Markdown дэмжигдсэн</span>
      </div>

      {/* Tabs */}
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === 'write'
                ? 'bg-white text-primary-700 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✏ Бичих
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === 'preview'
                ? 'bg-white text-primary-700 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👁 Preview
          </button>
        </div>

        {tab === 'write' ? (
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 text-sm font-mono focus:outline-none resize-y ${
              error ? 'bg-red-50' : 'bg-white'
            }`}
          />
        ) : (
          <div className={`min-h-[${rows * 1.5}rem] px-3 py-2 bg-white`}>
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-sm text-gray-400 italic">Бичих хэсэгт текст оруулна уу...</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
