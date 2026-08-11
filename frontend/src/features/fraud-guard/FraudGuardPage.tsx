import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudOff, Loader2, RotateCw } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api'
import { ResultView } from './ResultView'
import { SubmitStep } from './SubmitStep'
import { MIN_LENGTH, analyse, analyseImage, type Analysis } from './fraud-analysis'

type Step = 'submit' | 'analysing' | 'result' | 'error'

export default function FraudGuardPage() {
  const [step, setStep] = useState<Step>('submit')
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [tooShort, setTooShort] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [decision, setDecision] = useState<'none' | 'dismissed' | 'reported'>(
    'none',
  )
  const runId = useRef(0)

  useEffect(() => {
    if (step !== 'analysing') return
    const currentRun = ++runId.current
    const run = attachment ? analyseImage(attachment, text) : analyse(text)
    run
      .then((result) => {
        if (runId.current !== currentRun) return
        setAnalysis(result)
        setStep('result')
      })
      .catch((err: unknown) => {
        if (runId.current !== currentRun) return
        setErrorMessage(
          err instanceof ApiError && !err.isNetworkError ? err.message : null,
        )
        setStep('error')
      })
    return () => {
      runId.current++
    }
  }, [step, text, attachment])

  function handleSubmit() {
    if (!attachment && text.trim().length < MIN_LENGTH) {
      setTooShort(true)
      return
    }
    setTooShort(false)
    setDecision('none')
    setStep('analysing')
  }

  function restart() {
    setStep('submit')
    setText('')
    setAttachment(null)
    setAnalysis(null)
    setDecision('none')
    setTooShort(false)
    setErrorMessage(null)
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Un message vous semble suspect ? Vérifiez-le ici"
        description="Recopiez le message reçu. Nous vous disons en une phrase s’il faut s’en méfier."
      />

      <AnimatePresence mode="wait">
        {step === 'submit' && (
          <SubmitStep
            key="submit"
            text={text}
            tooShort={tooShort}
            attachment={attachment}
            onTextChange={(value) => {
              setText(value)
              setTooShort(false)
            }}
            onAttach={setAttachment}
            onSubmit={handleSubmit}
          />
        )}

        {step === 'analysing' && (
          <motion.div
            key="analysing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl border border-line bg-surface px-6 py-16 text-center shadow-card"
          >
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-ai-50 text-ai-900">
              <Loader2 className="size-7 animate-spin" aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold">
              Analyse en cours…
            </h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-muted">
              Nous relisons votre message et le comparons aux arnaques déjà
              connues.
            </p>
          </motion.div>
        )}

        {step === 'result' && analysis && (
          <ResultView
            key="result"
            analysis={analysis}
            decision={decision}
            onDismiss={() => setDecision('dismissed')}
            onReport={() => setDecision('reported')}
            onRestart={restart}
          />
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
              {errorMessage ??
                'Votre message n’a pas été perdu. Vérifiez votre connexion internet, puis relancez l’analyse.'}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button size="lg" onClick={() => setStep('analysing')}>
                <RotateCw className="size-4" aria-hidden />
                Réessayer
              </Button>
              <Button size="lg" variant="secondary" onClick={restart}>
                Revenir au message
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
