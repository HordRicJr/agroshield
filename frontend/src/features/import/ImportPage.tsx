import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, CloudOff, RotateCw } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AnalysingStep } from './AnalysingStep'
import { DropStep, type DropError } from './DropStep'
import { ShareFilePanel } from './ShareFilePanel'
import { SummaryStep } from './SummaryStep'
import {
  ACCEPTED_EXTENSIONS,
  analyzeFile,
  extensionOf,
  formatNumber,
  saveCorrections,
} from './import-data'
import type { AnalysisResult, CategoryId } from './import-data'

type Step = 'drop' | 'analysing' | 'summary' | 'saved' | 'error'

const STEPS: { id: Step; label: string }[] = [
  { id: 'drop', label: 'Déposer' },
  { id: 'analysing', label: 'Analyse' },
  { id: 'summary', label: 'Vérifier' },
]

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 Mo — limite backend

function stepIndex(step: Step) {
  if (step === 'drop') return 0
  if (step === 'analysing') return 1
  return 2
}

function analyzeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'Le serveur ne répond pas. Vérifiez votre connexion internet puis réessayez.'
    }
    if (error.status === 413) {
      return 'Ce fichier est trop volumineux (10 Mo maximum).'
    }
    if (error.status === 415 || error.status === 422) {
      return error.message
    }
    return error.message
  }
  return 'Une erreur inattendue est survenue pendant l’analyse.'
}

export default function ImportPage() {
  const { hasPermission } = useAuth()
  const [step, setStep] = useState<Step>('drop')
  const [error, setError] = useState<DropError>(null)
  const [serverError, setServerError] = useState('')
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const runId = useRef(0)

  const canCorrect = hasPermission('DATA_WRITE')

  // Progression « rassurante » pendant l'appel réel (durée inconnue).
  useEffect(() => {
    if (step !== 'analysing') return
    const started = Date.now()
    const timer = window.setInterval(() => {
      const ratio = 1 - Math.exp(-(Date.now() - started) / 2500)
      setProgress(Math.min(Math.round(ratio * 100), 95))
    }, 120)
    return () => window.clearInterval(timer)
  }, [step])

  useEffect(() => {
    if (step !== 'analysing' || !file) return
    const currentRun = ++runId.current
    analyzeFile(file)
      .then((analysis) => {
        if (runId.current !== currentRun) return
        setProgress(100)
        setResult(analysis)
        setStep('summary')
      })
      .catch((err) => {
        if (runId.current !== currentRun) return
        setServerError(analyzeErrorMessage(err))
        setStep('error')
      })
    return () => {
      runId.current++
    }
  }, [step, file])

  function handleFile(nextFile: File) {
    if (!ACCEPTED_EXTENSIONS.includes(extensionOf(nextFile.name))) {
      setError('format')
      return
    }
    if (nextFile.size === 0) {
      setError('empty')
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError('format')
      return
    }
    setError(null)
    setFile(nextFile)
    setProgress(0)
    setStep('analysing')
  }

  function handleCorrect(name: string, category: CategoryId) {
    setResult((current) =>
      current
        ? {
            ...current,
            columns: current.columns.map((column) =>
              column.name === name ? { ...column, category } : column,
            ),
          }
        : current,
    )
  }

  async function handleConfirm() {
    if (!result) return
    setIsSaving(true)
    try {
      await saveCorrections(result.columns)
      setStep('saved')
    } catch {
      setServerError(
        'Vos corrections n’ont pas pu être enregistrées. Le fichier importé est bien conservé — réessayez dans un instant.',
      )
      setStep('error')
    } finally {
      setIsSaving(false)
    }
  }

  function reset() {
    setStep('drop')
    setError(null)
    setServerError('')
    setResult(null)
    setFile(null)
    setProgress(0)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Importer un fichier"
        description="Déposez votre liste de producteurs. Nous vérifions son contenu avant de l’enregistrer."
      />

      {step !== 'saved' && step !== 'error' && (
        <ol className="mb-6 flex items-center gap-2">
          {STEPS.map((item, index) => {
            const current = stepIndex(step)
            const state =
              index < current ? 'done' : index === current ? 'active' : 'todo'
            return (
              <li key={item.id} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    state === 'todo' ? 'bg-line' : 'bg-brand-600',
                  )}
                />
                <span
                  className={cn(
                    'text-[13px] transition-colors',
                    state === 'active'
                      ? 'font-medium text-brand-900'
                      : 'text-ink-disabled',
                  )}
                >
                  {item.label}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <AnimatePresence mode="wait">
        {step === 'drop' && (
          <DropStep key="drop" error={error} onFile={handleFile} />
        )}

        {step === 'analysing' && (
          <AnalysingStep
            key="analysing"
            fileName={file?.name ?? ''}
            progress={progress}
          />
        )}

        {step === 'summary' && result && (
          <SummaryStep
            key="summary"
            result={result}
            canCorrect={canCorrect}
            isSaving={isSaving}
            onCorrect={handleCorrect}
            onConfirm={handleConfirm}
            onCancel={reset}
          />
        )}

        {step === 'saved' && result && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-brand-600/25 bg-brand-50 px-6 py-14 text-center"
          >
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-900 text-white">
              <CheckCircle2 className="size-8" aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-brand-900">
              Fichier enregistré
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-brand-900/70">
              {formatNumber(result.rows)} ligne{result.rows > 1 ? 's' : ''}{' '}
              analysée{result.rows > 1 ? 's' : ''} et{' '}
              {formatNumber(result.columns.length)} colonnes maintenant
              protégées.
            </p>
            <ShareFilePanel
              fileId={result.fileId}
              columns={result.columns.map((column) => column.name)}
            />
            <Button variant="secondary" size="lg" className="mt-3 w-full" onClick={reset}>
              Importer un autre fichier
            </Button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
              <CloudOff className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold">
              L’analyse n’a pas abouti
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
              {serverError}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
              {file && (
                <Button
                  size="lg"
                  onClick={() => {
                    setServerError('')
                    setProgress(0)
                    setStep('analysing')
                  }}
                >
                  <RotateCw className="size-4" aria-hidden />
                  Réessayer
                </Button>
              )}
              <Button size="lg" variant="secondary" onClick={reset}>
                Choisir un autre fichier
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
