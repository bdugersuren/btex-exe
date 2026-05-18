'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useEvaluations } from '@/hooks/useEvaluations'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Evaluation } from '@/types/models'
import { GRADE_LABELS, GRADE_COLORS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'

type EvalWithRels = Evaluation & {
  submission: {
    id:         string
    fileName:   string
    student:    { id: string; fullName: string }
    assignment: { id: string; title: string }
  }
}

export function VerificationList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useEvaluations(page, 10, true)

  if (isLoading) return <div className="text-gray-500">Ачааллаж байна...</div>
  if (error)     return <div className="text-red-600">Алдаа гарлаа</div>

  const items   = (data?.items ?? []) as EvalWithRels[]
  const pending  = items.filter((e) => e.isPublished && !e.isVerified)
  const verified = items.filter((e) => e.isVerified)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          ⏳ Баталгаажуулах хүлээгдэж буй ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">Баталгаажуулах үнэлгээ байхгүй байна</p>
        ) : (
          <div className="space-y-3">
            {pending.map((ev) => <EvaluationRow key={ev.id} ev={ev} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          ✅ Баталгаажуулсан ({verified.length})
        </h2>
        {verified.length === 0 ? (
          <p className="text-sm text-gray-400">Баталгаажуулсан үнэлгээ байхгүй байна</p>
        ) : (
          <div className="space-y-3">
            {verified.map((ev) => <EvaluationRow key={ev.id} ev={ev} />)}
          </div>
        )}
      </section>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Өмнөх</Button>
          <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Дараах</Button>
        </div>
      )}
    </div>
  )
}

function EvaluationRow({ ev }: { ev: EvalWithRels }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{ev.submission?.student?.fullName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{ev.submission?.assignment?.title}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${GRADE_COLORS[ev.grade] ?? 'bg-gray-100 text-gray-700'}`}>
              {GRADE_LABELS[ev.grade] ?? ev.grade}
            </span>
            <span className="text-sm font-semibold text-gray-800">{ev.score.toFixed(1)}%</span>
            <Badge
              label={ev.isVerified ? '✅ Баталгаажсан' : '⏳ Хүлээгдэж буй'}
              variant={ev.isVerified ? 'success' : 'warning'}
            />
            <span className="text-xs text-gray-400">{formatDateTime(ev.createdAt)}</span>
          </div>
        </div>
        <Link href={`/dashboard/submissions/${ev.submission?.id}`}>
          <Button variant="secondary" size="sm">Харах</Button>
        </Link>
      </div>
    </Card>
  )
}
