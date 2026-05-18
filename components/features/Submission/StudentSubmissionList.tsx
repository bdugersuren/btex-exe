'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSubmissions } from '@/hooks/useSubmissions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GRADE_LABELS, GRADE_COLORS } from '@/lib/constants'
import { formatDateTime, formatDate } from '@/lib/utils'

const statusConfig: Record<string, { label: string; desc: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  PENDING:            { label: 'Хүлээгдэж байна', desc: 'Багш үнэлэх хүртэл хүлээнэ үү',          variant: 'default' },
  EVALUATED:          { label: 'Үнэлэгдэж байна', desc: 'Багш үнэлгээг шалгаж байна',             variant: 'info' },
  RETURNED:           { label: 'Үнэлгээ ирсэн',   desc: 'Үнэлгээгээ харах боломжтой',             variant: 'success' },
  RESUBMIT_REQUESTED: { label: 'Хүсэлт илгээсэн', desc: 'Багш resubmit хүсэлтийг хянаж байна',   variant: 'warning' },
  RESUBMIT_APPROVED:  { label: 'Resubmit зөвшөөрөгдсөн', desc: 'Та дахин тайлан илгээх боломжтой', variant: 'info' },
  RESUBMITTED:        { label: 'Дахин илгээсэн',   desc: 'Багш үнэлэх хүртэл хүлээнэ үү',        variant: 'default' },
}

export function StudentSubmissionList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useSubmissions(page, 10)

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-500 py-8">
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Ачааллаж байна...
    </div>
  )
  if (error) return <div className="text-red-600 py-4">Алдаа: {(error as Error).message}</div>

  return (
    <div className="space-y-4">
      {data?.items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 font-medium">Та одоогоор тайлан илгээгээгүй байна</p>
          <p className="text-sm text-gray-400 mt-1">Даалгавар хэсгээс тайланаа илгээнэ үү</p>
          <Link href="/dashboard/upload" className="inline-block mt-4">
            <Button size="sm">Тайлан илгээх</Button>
          </Link>
        </div>
      )}

      {data?.items.map((sub) => {
        const cfg = statusConfig[sub.status] ?? { label: sub.status, desc: '', variant: 'default' as const }
        const evaluation = sub.evaluation as {
          score?: number; grade?: string; isPublished?: boolean
        } | null

        return (
          <Card key={sub.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {(sub.assignment as { title?: string })?.title ?? '—'}
                  </p>
                  {sub.attempt > 1 && (
                    <Badge label={`${sub.attempt}-р оролдлого`} variant="info" />
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-2">{sub.fileName}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge label={cfg.label} variant={cfg.variant} />
                  {cfg.desc && (
                    <span className="text-xs text-gray-400">{cfg.desc}</span>
                  )}
                </div>

                {sub.status === 'RESUBMIT_APPROVED' && sub.resubmitDeadline && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⏰ Resubmit дуусах: {formatDate(sub.resubmitDeadline)}
                  </p>
                )}

                {evaluation?.isPublished && evaluation.grade && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[evaluation.grade] ?? 'bg-gray-100 text-gray-600'}`}>
                      {GRADE_LABELS[evaluation.grade] ?? evaluation.grade}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {evaluation.score?.toFixed(1)}%
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">{formatDateTime(sub.createdAt)}</p>
              </div>

              <Link href={`/dashboard/my-submissions/${sub.id}`} className="shrink-0">
                <Button variant="secondary" size="sm">Дэлгэрэнгүй →</Button>
              </Link>
            </div>
          </Card>
        )
      })}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Өмнөх</Button>
          <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Дараах →</Button>
        </div>
      )}
    </div>
  )
}
