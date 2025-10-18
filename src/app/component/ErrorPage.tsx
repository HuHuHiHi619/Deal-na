import React from 'react'

function ErrorPage() {
  return (
     <div className="flex h-screen items-center justify-center bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-xl">
      <div className="text-center bg-white/40 px-8 py-6 rounded-2xl shadow-md border border-white/30 backdrop-blur-md">
        <p className="text-rose-600 mb-4 text-lg font-medium">{error}</p>
        <button
          onClick={() => {
            clearError();
            router.push("/");
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
        >
          Go Home
        </button>
      </div>
    </div>

  )
}

export default ErrorPage