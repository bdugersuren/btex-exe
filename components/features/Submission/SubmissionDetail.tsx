'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSubmission, useApproveResubmit, useRejectResubmit } from '@/hooks/useSubmissions'
import { useEvaluate } from '@/hooks/useEvaluations'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { VerificationPanel } from '@/components/features/Evaluation/VerificationPanel'
import { GRADE_LABELS, GRADE_COLORS, CRITERION_PASS_THRESHOLD } from '@/lib/constants'
import { CriterionScore } from '@/types/models'
import { formatDateTime, formatDate } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  PENDING:            'Хүлээгдэж байна',
  EVALUATED:          'Үнэлэгдсэн',
  RETURNED:           'Буцаагдсан',
  RESUBMIT_REQUESTED: 'Resubmit хүсэлт',
  RESUBMIT_APPROVED:  'Resubmit зөвшөөрөгдсөн',
  RESUBMITTED:        'Дахин илгээсэн',
}

interface SubmissionDetailProps {
  id: string
}

export function SubmissionDetail({ id }: SubmissionDetailProps) {
  const { data: sub, isLoading, error } = useSubmission(id)
  const { isIv, isTeacher, isAdmin }    = useAuth()
  const evaluate      = useEvaluate()
  const approveResub  = useApproveResubmit()
  const rejectResub   = useRejectResubmit()
  const [approveOpen, setApproveOpen] = useState(false)
  const [deadlineDays, setDeadlineDays] = useState(7)
  const [evalError, setEvalError] = useState('')
  const [lang, setLang] = useState<'mn' | 'en'>('mn')

  if (isLoading) return <div className="text-gray-500">Ачааллаж байна...</div>
  if (error || !sub) return <div className="text-red-600">Тайлан олдсонгүй</div>

  const evaluation = sub.evaluation as {
    id: string; score: number; grade: string; feedback: string; feedbackMn?: string;
    strengths: string[]; strengthsMn?: string[]; improvements: string[]; improvementsMn?: string[];
    criteriaScores?: CriterionScore[];
    isPublished: boolean; studentFeedback?: string;
    isVerified: boolean; verifiedAt?: string | null; verifierNote?: string | null;
  } | null

  const hasMn = !!(evaluation?.feedbackMn || evaluation?.strengthsMn?.length || evaluation?.improvementsMn?.length)

  const isResubmitReq = sub.status === 'RESUBMIT_REQUESTED'
  const canEvaluate   = ['PENDING', 'RESUBMITTED'].includes(sub.status) || (sub.status === 'EVALUATED' && !evaluation?.isPublished)

  const handleEvaluate = async () => {
    setEvalError('')
    try {
      await evaluate.mutateAsync(id)
    } catch (e) {
      setEvalError((e as Error).message)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {(sub.student as { fullName?: string })?.fullName ?? '—'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {(sub.assignment as { title?: string })?.title}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge label={statusLabels[sub.status] ?? sub.status} variant="info" />
              <Badge label={`Оролдлого ${sub.attempt}`} variant="default" />
              <span className="text-xs text-gray-500">{formatDateTime(sub.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <a
              href={sub.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              ⬇ {sub.fileName}
            </a>

            {canEvaluate && (
              <Button
                onClick={handleEvaluate}
                isLoading={evaluate.isLoading}
              >
                🤖 AI-аар үнэлэх
              </Button>
            )}
          </div>
        </div>

        {evalError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {evalError}
          </div>
        )}
      </Card>

      {/* Resubmit request */}
      {isResubmitReq && (
        <Card className="border-yellow-200 bg-yellow-50">
          <h3 className="font-semibold text-yellow-800 mb-3">⚠ Resubmit хүсэлт ирсэн</h3>
          <div className="flex gap-3">
            <Button onClick={() => setApproveOpen(true)} variant="primary" size="sm">
              Зөвшөөрөх
            </Button>
            <Button
              onClick={() => rejectResub.mutate({ id })}
              isLoading={rejectResub.isLoading}
              variant="danger"
              size="sm"
            >
              Татгалзах
            </Button>
          </div>
        </Card>
      )}

      {/* Resubmit deadline info */}
      {sub.status === 'RESUBMIT_APPROVED' && sub.resubmitDeadline && (
        <Card className="border-blue-200 bg-blue-50">
          <p className="text-blue-800 text-sm font-medium">
            ✅ Resubmit зөвшөөрөгдсөн — Дуусах: {formatDate(sub.resubmitDeadline)}
          </p>
        </Card>
      )}

      {/* Evaluation result */}
      {evaluation && (
        <Card title="Үнэлгээний дүн">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className={`px-4 py-2 rounded-full text-lg font-bold ${GRADE_COLORS[evaluation.grade] ?? 'bg-gray-100 text-gray-700'}`}>
              {GRADE_LABELS[evaluation.grade] ?? evaluation.grade}
            </span>
            <span className="text-2xl font-bold text-gray-900">{evaluation.score.toFixed(1)}%</span>
            <Badge
              label={evaluation.isPublished ? '✓ Нийтлэгдсэн' : 'Нийтлэгдээгүй'}
              variant={evaluation.isPublished ? 'success' : 'warning'}
            />
            {hasMn && (
              <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLang('mn')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${lang === 'mn' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🇲🇳 Монгол
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${lang === 'en' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>

          {/* Per-criterion results */}
          {evaluation.criteriaScores && evaluation.criteriaScores.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Шалгуур тус бүрийн үнэлгээ</p>
              <div className="space-y-2">
                {evaluation.criteriaScores.map((cs, i) => {
                  const pct    = Math.min(100, Math.max(0, cs.score))
                  const passes = cs.passes ?? pct >= CRITERION_PASS_THRESHOLD
                  return (
                    <div
                      key={i}
                      className={`border rounded-lg p-3 ${passes ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}
                    >
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm w-8">{cs.code}</span>
                        <div className="flex-1 relative bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${passes ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-500 opacity-40"
                            style={{ left: `${CRITERION_PASS_THRESHOLD}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            passes ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {passes ? '✓ PASSES' : '✗ FAILED'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 ml-11">
                        {lang === 'mn' && cs.feedbackMn ? cs.feedbackMn : cs.feedback}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Нийт санал хүсэлт</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {lang === 'mn' && evaluation.feedbackMn ? evaluation.feedbackMn : evaluation.feedback}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-green-700 mb-2">✅ Давуу талууд</p>
              <ul className="space-y-1">
                {(lang === 'mn' && evaluation.strengthsMn?.length
                  ? evaluation.strengthsMn
                  : evaluation.strengths
                ).map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-green-500 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-700 mb-2">📝 Сайжруулах зүйлс</p>
              <ul className="space-y-1">
                {(lang === 'mn' && evaluation.improvementsMn?.length
                  ? evaluation.improvementsMn
                  : evaluation.improvements
                ).map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {evaluation.studentFeedback && (
            <div className="mb-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-1">Сурагчийн тайлбар</p>
              <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{evaluation.studentFeedback}</p>
            </div>
          )}

          {!evaluation.isPublished && (isTeacher || isAdmin) && (
            <div className="flex gap-3 pt-4 border-t">
              <Link href={`/dashboard/evaluations/${evaluation.id}`}>
                <Button variant="secondary">✏️ Засах</Button>
              </Link>
              <Link href={`/dashboard/evaluations/${evaluation.id}`}>
                <Button>📤 Нийтлэх</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* IV verification panel — нийтлэгдсэн үнэлгээний хувьд */}
      {evaluation?.isPublished && (
        <VerificationPanel
          evaluationId={evaluation.id}
          isIv={isIv}
          info={{
            isVerified:   evaluation.isVerified,
            verifiedAt:   evaluation.verifiedAt,
            verifierNote: evaluation.verifierNote,
          }}
        />
      )}

      {/* Approve resubmit modal */}
      <Modal isOpen={approveOpen} onClose={() => setApproveOpen(false)} title="Resubmit зөвшөөрөх">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Хэдэн хоногийн дотор resubmit хийх боломж олгох вэ?</p>
          <Input
            label="Хоногийн тоо"
            type="number"
            min={1}
            max={30}
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(Number(e.target.value))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>Болих</Button>
            <Button
              isLoading={approveResub.isLoading}
              onClick={async () => {
                await approveResub.mutateAsync({ id, deadlineDays })
                setApproveOpen(false)
              }}
            >
              Зөвшөөрөх
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
