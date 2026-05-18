'use client'

import { useState } from 'react'
import { useEvaluations } from '@/hooks/useEvaluations'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GRADE_LABELS, GRADE_COLORS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'

export function EvaluationList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useEvaluations(page)

  if (isLoading) return <div className="text-gray-500">Ачааллаж байна...</div>
  if (error)     return <div className="text-red-600">Алдаа: {(error as Error).message}</div>

  return (
    <div>
      <div className="grid gap-4">
        {data?.items.map((ev) => {
          const gradeColor = GRADE_COLORS[ev.grade] ?? 'text-gray-600 bg-gray-50'
          return (
            <Card key={ev.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${gradeColor}`}>
                      {GRADE_LABELS[ev.grade]}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{ev.score.toFixed(1)}%</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Тайлан: {(ev.submission as { fileName?: string })?.fileName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(ev.createdAt)}</p>
                  {ev.isPublished && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{ev.feedback}</p>
                  )}
                </div>
                <Badge
                  label={ev.isPublished ? 'Нийтлэгдсэн' : 'Хянагдаж байна'}
                  variant={ev.isPublished ? 'success' : 'warning'}
                />
              </div>
            </Card>
          )
        })}

        {data?.items.length === 0 && (
          <div className="text-center py-12 text-gray-500">Одоогоор үнэлгээ байхгүй байна.</div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Өмнөх
          </Button>
          <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
            Дараах
          </Button>
        </div>
      )}
    </div>
  )
}
