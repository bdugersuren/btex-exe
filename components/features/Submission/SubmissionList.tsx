'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSubmissions } from '@/hooks/useSubmissions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import { SubmissionStatus } from '@/types/enums'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  PENDING:            { label: 'Хүлээгдэж байна', variant: 'default' },
  EVALUATED:          { label: 'Үнэлэгдсэн',       variant: 'info' },
  RETURNED:           { label: 'Буцаагдсан',        variant: 'success' },
  RESUBMIT_REQUESTED: { label: 'Resubmit хүсэлт',  variant: 'warning' },
  RESUBMIT_APPROVED:  { label: 'Resubmit зөвшөөрөгдсөн', variant: 'info' },
  RESUBMITTED:        { label: 'Дахин илгээсэн',    variant: 'default' },
}

interface SubmissionListProps {
  assignmentId?: string
}

export function SubmissionList({ assignmentId }: SubmissionListProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useSubmissions(page, 20, assignmentId)

  if (isLoading) return <div className="text-gray-500">Ачааллаж байна...</div>
  if (error)     return <div className="text-red-600">Алдаа: {(error as Error).message}</div>

  return (
    <div>
      <div className="grid gap-3">
        {data?.items.map((sub) => {
          const cfg = statusConfig[sub.status] ?? { label: sub.status, variant: 'default' as const }
          const hasEval = !!sub.evaluation
          const isResubmitReq = sub.status === SubmissionStatus.RESUBMIT_REQUESTED

          return (
            <Card key={sub.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      {(sub.student as { fullName?: string })?.fullName ?? '—'}
                    </span>
                    <Badge label={`Оролдлого ${sub.attempt}`} variant="default" />
                    {isResubmitReq && (
                      <Badge label="⚠ Resubmit хүсэлт" variant="warning" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{sub.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(sub.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge label={cfg.label} variant={cfg.variant} />
                  <Link href={`/dashboard/submissions/${sub.id}`}>
                    <Button variant="secondary" size="sm">Дэлгэрэнгүй</Button>
                  </Link>
                </div>
              </div>

              {hasEval && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-sm">
                  <span className="text-gray-500">Дүн:</span>
                  <span className="font-semibold text-gray-900">
                    {(sub.evaluation as { score?: number })?.score?.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">
                    — {(sub.evaluation as { grade?: string })?.grade}
                  </span>
                  {!(sub.evaluation as { isPublished?: boolean })?.isPublished && (
                    <Badge label="Нийтлэгдээгүй" variant="warning" />
                  )}
                </div>
              )}
            </Card>
          )
        })}

        {data?.items.length === 0 && (
          <div className="text-center py-12 text-gray-500">Тайлан байхгүй байна.</div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Өмнөх</Button>
          <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Дараах</Button>
        </div>
      )}
    </div>
  )
}
