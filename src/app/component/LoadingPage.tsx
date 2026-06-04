import React from 'react'
import Confetti from '@/app/component/decor/Confetti'

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  showSpinner?: boolean;
}

export function LoadingPage({
  title = "Loading...",
  subtitle,
  showSpinner = true
}: LoadingStateProps) {
  return (
    <div className="relative flex h-screen items-center justify-center bg-cream">
      <Confetti variant="login" />
      <div className="relative z-10 rounded-3xl bg-card px-8 py-6 text-center shadow-lg">
        <p className="type-heading text-ink">{title}</p>
        {subtitle && (
          <p className="type-caption mt-2 text-muted">{subtitle}</p>
        )}
        {showSpinner && (
          <div className="mt-4 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-coral" />
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingPage
