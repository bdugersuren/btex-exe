'use client'

import Link from 'next/link'
import { useSubmission } from '@/hooks/useSubmissions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StudentEvaluationView } from '@/components/features/Evaluation/StudentEvaluationView'
import { formatDateTime, formatDate, formatFileSize } from '@/lib/utils'
import { Evaluation } from '@/types/models'
import { useQueryClient } from 'react-query'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; icon: string }> = {
  PENDING:            { label: 'Хүлээгдэж байна',         variant: 'default', icon: '🕐' },
  EVALUATED:          { label: 'Үнэлэгдэж байна',         variant: 'info',    icon: '🔍' },
  RETURNED:           { label: 'Үнэлгээ ирсэн',           variant: 'success', icon: '✅' },
  RESUBMIT_REQUESTED: { label: 'Resubmit хүсэлт илгээсэн', variant: 'warning', icon: '📨' },
  RESUBMIT_APPROVED:  { label: 'Resubmit зөвшөөрөгдсөн', variant: 'info',    icon: '✔️' },
  RESUBMITTED:        { label: 'Дахин илгээсэн',          variant: 'default', icon: '📤' },
}

const statusSteps = ['PENDING', 'EVALUATED', 'RETURNED']

export function StudentSubmissionDetail({ id }: { id: string }) {
  const qc = useQueryClient()
  const { data: sub, isLoading, error } = useSubmission(id)

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-500 py-8">
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Ачааллаж байна...
    </div>
  )
  if (error || !sub) return (
    <div className="text-red-600 py-4">Тайлан олдсонгүй</div>
  )

  const cfg = statusConfig[sub.status] ?? { label: sub.status, variant: 'default' as const, icon: '📄' }
  const evaluation    = sub.evaluation as Evaluation | null
  const assignment    = sub.assignment as { id?: string; title?: string; rubric?: object; deadline?: string } | undefined
  const currentStep   = statusSteps.indexOf(sub.status)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Status progress */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {assignment?.title ?? 'Даалгавар'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{sub.attempt}-р оролдлого</p>
          </div>
          <Badge label={`${cfg.icon} ${cfg.label}`} variant={cfg.variant} />
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-0">
          {[
            { key: 'PENDING',   label: 'Илгээсэн' },
            { key: 'EVALUATED', label: 'Үнэлэгдсэн' },
            { key: 'RETURNED',  label: 'Буцаасан' },
          ].map((step, i) => {
            const done    = statusSteps.indexOf(sub.status) > i || sub.status === step.key
            const current = sub.status === step.key
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    done    ? 'bg-primary-600 border-primary-600 text-white'
                    : current ? 'border-primary-400 text-primary-600'
                    : 'border-gray-300 text-gray-400'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${done ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${
                    statusSteps.indexOf(sub.status) > i ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* File info */}
      <Card title="📄 Илгээсэн файл">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium text-gray-900">{sub.fileName}</p>
            <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(sub.createdAt)}</p>
          </div>
          <a
            href={sub.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            ⬇ Татаж авах
          </a>
        </div>
      </Card>

      {/* Resubmit approved info */}
      {sub.status === 'RESUBMIT_APPROVED' && sub.resubmitDeadline && (
        <Card className="border-blue-300 bg-blue-50">
          <p className="font-semibold text-blue-800 mb-1">✅ Resubmit зөвшөөрөгдлөо!</p>
          <p className="text-sm text-blue-700 mb-3">
            <strong>{formatDate(sub.resubmitDeadline)}</strong> хүртэл дахин тайлан илгээх боломжтой
          </p>
          <Link href={`/dashboard/upload?assignmentId=${assignment?.id}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
              📤 Дахин тайлан илгээх
            </span>
          </Link>
        </Card>
      )}

      {/* Waiting message */}
      {(sub.status === 'PENDING' || sub.status === 'EVALUATED') && (
        <Card className="border-dashed">
          <div className="text-center py-4">
            <p className="text-3xl mb-2">⏳</p>
            <p className="text-gray-600 font-medium">Багш үнэлгээ хийх хүртэл хүлээнэ үү</p>
            <p className="text-sm text-gray-400 mt-1">Үнэлгээ бэлэн болсоны дараа мэдэгдэх болно</p>
          </div>
        </Card>
      )}

      {/* Resubmit requested */}
      {sub.status === 'RESUBMIT_REQUESTED' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800 font-medium">📨 Resubmit хүсэлт илгээгдсэн</p>
          <p className="text-sm text-yellow-700 mt-1">Багш хянаж шийдвэр гаргах болно</p>
        </Card>
      )}

      {/* Evaluation */}
      {evaluation?.isPublished && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Үнэлгээний дүн</h3>
          <StudentEvaluationView
            evaluation={evaluation}
            submissionId={sub.id}
            submissionStatus={sub.status}
            assignmentDeadline={assignment?.deadline}
            resubmitDeadline={sub.resubmitDeadline ?? undefined}
            onResubmitRequested={() => qc.invalidateQueries(['submission', id])}
          />
        </div>
      )}
    </div>
  )
}
