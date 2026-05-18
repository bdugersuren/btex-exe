import fs from 'fs'
import path from 'path'
import { extractTextFromPDF } from './pdf-extractor'
import { extractTextFromDOCX } from './docx-extractor'
import { AppError } from '@/lib/errors'

export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.pdf':
      return extractTextFromPDF(filePath)
    case '.docx':
      return extractTextFromDOCX(filePath)
    case '.txt':
      return fs.readFileSync(filePath, 'utf-8')
    default:
      throw new AppError('UNSUPPORTED_FILE', `Дэмжигдэхгүй файлын төрөл: ${ext}`)
  }
}
