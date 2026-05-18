'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useVerifyEvaluation } from '@/hooks/useVerifications'
import { formatDateTime } from '@/lib/utils'

interface VerificationInfo {
  isVerified:   boolean
  verifiedAt?:  string | null
  verifierNote?: string | null
  verifierName?: string | null
}

interface VerificationPanelProps {
  evaluationId: string
  isIv:         boolean
  info:         VerificationInfo
}

export function VerificationPanel({ evaluationId, isIv, info }: VerificationPanelProps) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const verify = useVerifyEvaluation(evaluationId)

  const handleVerify = async () => {
    setError('')
    try {
      await verify.mutateAsync(note || undefined)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (info.isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">Баталгаажуулагдсан</p>
            {info.verifiedAt && (
              <p className="text-sm text-green-700 mt-0.5">{formatDateTime(info.verifiedAt)}</p>
            )}
            {info.verifierName && (
              <p className="text-sm text-green-700">IV: {info.verifierName}</p>
            )}
            {info.verifierNote && (
              <p className="text-sm text-gray-700 mt-2 bg-white rounded-lg p-2 border border-green-200">
                {info.verifierNote}
              </p>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (!isIv) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <p className="text-sm text-yellow-800 font-medium">⏳ IV баталгаажуулалт хүлээгдэж байна</p>
      </Card>
    )
  }

  return (
    <Card title="IV Баталгаажуулалт">
      <p className="text-sm text-gray-600 mb-3">
        Үнэлгээг хянаад баталгаажуулна уу. Тайлбар нэмэх боломжтой.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Тайлбар (заавал биш)..."
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
      />
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      <Button onClick={handleVerify} isLoading={verify.isLoading}>
        ✅ Баталгаажуулах
      </Button>
    </Card>
  )
}
