'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GRADE_LABELS, GRADE_COLORS, CRITERION_PASS_THRESHOLD } from '@/lib/constants'
import { apiClient } from '@/lib/api/api-client'
import { endpoints } from '@/lib/api/endpoints'
import { formatDateTime } from '@/lib/utils'
import { Evaluation } from '@/types/models'
import { CriterionScore } from '@/types/models'

interface StudentEvaluationViewProps {
  evaluation: Evaluation
  submissionId: string
  submissionStatus: string
  assignmentDeadline?: string | null
  resubmitDeadline?: string | null
  onResubmitRequested?: () => void
}

export function StudentEvaluationView({
  evaluation,
  submissionId,
  submissionStatus,
  assignmentDeadline,
  resubmitDeadline,
  onResubmitRequested,
}: StudentEvaluationViewProps) {
  const [feedbackText, setFeedbackText] = useState(evaluation.studentFeedback ?? '')
  const [reason,       setReason]       = useState('')
  const [savingFb,     setSavingFb]     = useState(false)
  const [fbSaved,      setFbSaved]      = useState(false)
  const [fbError,      setFbError]      = useState('')
  const [reqError,     setReqError]     = useState('')
  const [requesting,   setRequesting]   = useState(false)
  const [reqDone,      setReqDone]      = useState(false)
  const [showResubmit, setShowResubmit] = useState(false)
  const [lang,         setLang]         = useState<'mn' | 'en'>('mn')

  const hasMn = !!(evaluation.feedbackMn || evaluation.strengthsMn?.length || evaluation.improvementsMn?.length)

  const canRequestResubmit =
    submissionStatus === 'RETURNED' &&
    (!assignmentDeadline || new Date() < new Date(assignmentDeadline))

  const criteriaScores = (evaluation.criteriaScores ?? []) as CriterionScore[]

  const saveFeedback = async () => {
    setSavingFb(true)
    setFbError('')
    try {
      await apiClient.put(endpoints.evaluations.get(evaluation.id), {
        studentFeedback: feedbackText,
      })
      setFbSaved(true)
      setTimeout(() => setFbSaved(false), 3000)
    } catch (e) {
      setFbError(e instanceof Error ? e.message : 'Алдаа гарлаа')
    } finally {
      setSavingFb(false)
    }
  }

  const requestResubmit = async () => {
    if (reason.trim().length < 10) {
      setReqError('Шалтгааныг дэлгэрэнгүй бичнэ үү (10+ тэмдэгт)')
      return
    }
    setRequesting(true)
    setReqError('')
    try {
      await apiClient.post(endpoints.submissions.resubmitRequest(submissionId), { reason })
      setReqDone(true)
      onResubmitRequested?.()
    } catch (e) {
      setReqError(e instanceof Error ? e.message : 'Алдаа гарлаа')
    } finally {
      setRequesting(false)
    }
  }

  const gradeColor = GRADE_COLORS[evaluation.grade] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-6">
      {/* Score summary + language toggle */}
      <Card>
        <div className="flex items-center gap-6 flex-wrap">
          <div className={`px-6 py-3 rounded-xl text-2xl font-bold ${gradeColor}`}>
            {GRADE_LABELS[evaluation.grade] ?? evaluation.grade}
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">{evaluation.score.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(evaluation.createdAt)}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {hasMn && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
            <Badge label="✓ Нийтлэгдсэн" variant="success" />
          </div>
        </div>
      </Card>

      {/* Overall feedback */}
      <Card title="Үнэлгээний дүгнэлт">
        <p className="text-gray-700 leading-relaxed bg-blue-50 rounded-lg p-4 text-sm">
          {lang === 'mn' && evaluation.feedbackMn ? evaluation.feedbackMn : evaluation.feedback}
        </p>
      </Card>

      {/* Criteria scores */}
      {criteriaScores.length > 0 && (
        <Card title="Шалгуур тус бүрийн үнэлгээ">
          <div className="space-y-3">
            {criteriaScores.map((cs, i) => {
              const pct     = Math.min(100, Math.max(0, cs.score))
              const passes  = cs.passes ?? pct >= CRITERION_PASS_THRESHOLD
              return (
                <div
                  key={i}
                  className={`border rounded-xl p-4 ${passes ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}
                >
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{cs.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">{pct}%</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          passes
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {passes ? '✓ PASSES' : '✗ FAILED'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar with threshold marker */}
                  <div className="relative w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div
                      className={`h-2.5 rounded-full transition-all ${passes ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                    {/* 70% threshold line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-500 opacity-50"
                      style={{ left: `${CRITERION_PASS_THRESHOLD}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {lang === 'mn' && cs.feedbackMn ? cs.feedbackMn : cs.feedback}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm flex-wrap">
            <span className="text-green-700 font-medium">
              ✓ {criteriaScores.filter((c) => c.passes ?? c.score >= CRITERION_PASS_THRESHOLD).length} шалгуур хангасан
            </span>
            <span className="text-red-700 font-medium">
              ✗ {criteriaScores.filter((c) => !(c.passes ?? c.score >= CRITERION_PASS_THRESHOLD)).length} шалгуур хангаагүй
            </span>
            <span className="text-gray-400 text-xs ml-auto">70%-аас дээш = PASSES</span>
          </div>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="✅ Давуу талууд">
          <ul className="space-y-2">
            {(lang === 'mn' && evaluation.strengthsMn?.length
              ? evaluation.strengthsMn
              : evaluation.strengths
            ).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 shrink-0">●</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="📝 Сайжруулах зүйлс">
          <ul className="space-y-2">
            {(lang === 'mn' && evaluation.improvementsMn?.length
              ? evaluation.improvementsMn
              : evaluation.improvements
            ).map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-orange-400 mt-0.5 shrink-0">●</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Student feedback */}
      <Card title="Таны тайлбар">
        <p className="text-xs text-gray-500 mb-3">
          Үнэлгээтэй холбоотой санал хүсэлтээ багшид мэдэгдэнэ үү
        </p>
        <textarea
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Үнэлгээний талаарх саналаа бичнэ үү..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        {fbError && <p className="mt-1 text-xs text-red-600">{fbError}</p>}
        <div className="flex items-center gap-3 mt-2">
          <Button size="sm" onClick={saveFeedback} isLoading={savingFb}>
            Хадгалах
          </Button>
          {fbSaved && <span className="text-green-600 text-sm">✓ Хадгалагдлаа</span>}
        </div>
      </Card>

      {/* Resubmit request */}
      {submissionStatus === 'RETURNED' && (
        <Card className={canRequestResubmit ? 'border-orange-200' : 'border-gray-200 opacity-60'}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Дахин илгээх хүсэлт</h3>
              {canRequestResubmit ? (
                <p className="text-sm text-gray-600">
                  Үнэлгээтэй санал нийлэхгүй бол багшаас resubmit зөвшөөрөл хүсэх боломжтой
                </p>
              ) : (
                <p className="text-sm text-red-600">Resubmit хүсэх хугацаа дууссан байна</p>
              )}
            </div>
            {canRequestResubmit && !reqDone && !showResubmit && (
              <Button variant="secondary" size="sm" onClick={() => setShowResubmit(true)}>
                Хүсэлт илгээх
              </Button>
            )}
          </div>

          {canRequestResubmit && showResubmit && !reqDone && (
            <div className="mt-4 pt-4 border-t border-orange-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resubmit хийх шалтгаан
              </label>
              <textarea
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  reqError ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Яагаад дахин илгээхийг хүсэж байгаагаа тайлбарлана уу..."
                value={reason}
                onChange={(e) => { setReason(e.target.value); setReqError('') }}
              />
              {reqError && <p className="mt-1 text-xs text-red-600">{reqError}</p>}
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={requestResubmit} isLoading={requesting}>
                  Илгээх
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowResubmit(false); setReqError('') }}>
                  Болих
                </Button>
              </div>
            </div>
          )}

          {reqDone && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✓ Хүсэлт амжилттай илгээгдлээ. Багш хянах болно.
              </p>
            </div>
          )}
        </Card>
      )}

      {submissionStatus === 'RESUBMIT_REQUESTED' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <p className="text-yellow-800 font-medium">⏳ Resubmit хүсэлт илгээгдсэн — багш хянаж байна</p>
        </Card>
      )}

      {submissionStatus === 'RESUBMIT_APPROVED' && resubmitDeadline && (
        <Card className="border-blue-200 bg-blue-50">
          <p className="text-blue-800 font-medium mb-1">✅ Resubmit зөвшөөрөгдсөн!</p>
          <p className="text-sm text-blue-700">
            Дуусах хугацаа: <strong>{resubmitDeadline}</strong> хэдэн болтол дахин тайлан илгээх боломжтой
          </p>
          <div className="mt-3">
            <a href="/dashboard/upload">
              <Button size="sm">📤 Дахин илгээх</Button>
            </a>
          </div>
        </Card>
      )}
    </div>
  )
}
