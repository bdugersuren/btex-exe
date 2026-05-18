import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'BTEC IT Evaluator',
  description: 'Pearson BTEC IT Assignment Evaluation System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
