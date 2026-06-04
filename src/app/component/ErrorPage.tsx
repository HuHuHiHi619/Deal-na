import React from 'react'
import Confetti from '@/app/component/decor/Confetti'

interface ErrorPageProps {
  error: string | Error | null
  onRetry: () => void
}

function ErrorPage({ error, onRetry }: ErrorPageProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  return (
    <div className="relative flex h-screen items-center justify-center bg-cream">
      <Confetti variant="login" />
      <div className="relative z-10 rounded-3xl bg-card px-8 py-6 text-center shadow-lg">
        <p className="type-body mb-4 text-coral">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="type-body rounded-pill bg-brand-gradient px-6 py-2.5 text-card shadow-glow-coral transition-transform duration-300 hover:scale-[1.03]"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default ErrorPage
