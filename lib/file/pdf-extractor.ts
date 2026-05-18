import pdfParse from 'pdf-parse'
import fs from 'fs'

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)
  return data.text
}
