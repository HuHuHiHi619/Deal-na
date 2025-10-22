import React from 'react'
// components/ui/LoadingState.tsx
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-xl">
      <div className="text-center bg-white/40 px-8 py-6 rounded-2xl shadow-md border border-white/30 backdrop-blur-md">
        <p className="text-gray-700 text-lg font-medium tracking-wide">
          {title}
        </p>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
        )}
        {showSpinner && (
          <div className="mt-3 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingPage