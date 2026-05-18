'use client'

import { useState, useEffect } from 'react'
import { useEvaluation, useUpdateEvaluation, usePublishEvaluation } from '@/hooks/useEvaluations'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { GRADE_LABELS, GRADE_COLORS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'

interface EvaluationEditorProps {
  id: string
}

export function EvaluationEditor({ id }: EvaluationEditorProps) {
  const { data: ev, isLoading, error } = useEvaluation(id)
  const update  = useUpdateEvaluation(id)
  const publish = usePublishEvaluation()

  const [feedback,     setFeedback]     = useState('')
  const [strengths,    setStrengths]    = useState<string[]>([])
  const [improvements, setImprovements] = useState<string[]>([])
  const [saved,        setSaved]        = useState(false)
  const [publishError, setPublishError] = useState('')

  useEffect(() => {
    if (ev) {
      setFeedback(ev.feedback)
      setStrengths([...ev.strengths])
      setImprovements([...ev.improvements])
    }
  }, [ev])

  if (isLoading) return <div className="text-gray-500">Ачааллаж байна...</div>
  if (error || !ev) return <div className="text-red-600">Үнэлгээ олдсонгүй</div>

  const submission = ev.submission as { fileName?: string; student?: { fullName?: string }; assignment?: { title?: string } } | undefined

  const handleSave = async () => {
    setSaved(false)
    await update.mutateAsync({ feedback, strengths, improvements })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePublish = async () => {
    setPublishError('')
    try {
      await handleSave()
      await publish.mutateAsync(id)
    } catch (e) {
      setPublishError((e as Error).message)
    }
  }

  const updateStrength    = (i: number, val: string) => setStrengths(s => s.map((v, j) => j === i ? val : v))
  const updateImprovement = (i: number, val: string) => setImprovements(s => s.map((v, j) => j === i ? val : v))
  const addStrength    = () => setStrengths(s => [...s, ''])
  const addImprovement = () => setImprovements(s => [...s, ''])
  const removeStrength    = (i: number) => setStrengths(s => s.filter((_, j) => j !== i))
  const removeImprovement = (i: number) => setImprovements(s => s.filter((_, j) => j !== i))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Info header */}
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {submission?.student?.fullName ?? '—'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{submission?.assignment?.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {submission?.fileName} · {formatDateTime(ev.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-lg font-bold ${GRADE_COLORS[ev.grade] ?? 'bg-gray-100 text-gray-700'}`}>
              {GRADE_LABELS[ev.grade] ?? ev.grade}
            </span>
            <span className="text-2xl font-bold">{ev.score.toFixed(1)}%</span>
            <Badge
              label={ev.isPublished ? '✓ Нийтлэгдсэн' : 'Ноорог'}
              variant={ev.isPublished ? 'success' : 'warning'}
            />
          </div>
        </div>
      </Card>

      {/* Feedback editor */}
      <Card title="Нийт санал хүсэлт засах">
        <textarea
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Нийт үнэлгээний тайлбар..."
        />
      </Card>

      {/* Strengths */}
      <Card title="✅ Давуу талууд">
        <div className="space-y-2">
          {strengths.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={s}
                onChange={(e) => updateStrength(i, e.target.value)}
                placeholder={`Давуу тал ${i + 1}`}
              />
              <button
                onClick={() => removeStrength(i)}
                className="text-red-400 hover:text-red-600 px-2"
              >✕</button>
            </div>
          ))}
          <button
            onClick={addStrength}
            className="text-sm text-primary-600 hover:underline"
          >+ Нэмэх</button>
        </div>
      </Card>

      {/* Improvements */}
      <Card title="📝 Сайжруулах зүйлс">
        <div className="space-y-2">
          {improvements.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={s}
                onChange={(e) => updateImprovement(i, e.target.value)}
                placeholder={`Сайжруулах зүйл ${i + 1}`}
              />
              <button
                onClick={() => removeImprovement(i)}
                className="text-red-400 hover:text-red-600 px-2"
              >✕</button>
            </div>
          ))}
          <button
            onClick={addImprovement}
            className="text-sm text-primary-600 hover:underline"
          >+ Нэмэх</button>
        </div>
      </Card>

      {/* Student feedback (read-only) */}
      {ev.studentFeedback && (
        <Card title="Сурагчийн тайлбар">
          <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{ev.studentFeedback}</p>
        </Card>
      )}

      {publishError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {publishError}
        </div>
      )}

      {/* Actions */}
      {!ev.isPublished && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleSave}
            isLoading={update.isLoading}
          >
            💾 Хадгалах
          </Button>
          <Button
            onClick={handlePublish}
            isLoading={publish.isLoading || update.isLoading}
          >
            📤 Сурагчид илгээх
          </Button>
          {saved && <span className="text-green-600 text-sm self-center">✓ Хадгалагдлаа</span>}
        </div>
      )}

      {ev.isPublished && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">✓ Үнэлгээ сурагчид илгээгдсэн байна</p>
        </div>
      )}
    </div>
  )
}
