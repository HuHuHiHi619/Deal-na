// components/Portal.tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: React.ReactNode
  containerId: string
}

export default function Portal({ children, containerId }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  const container = document.getElementById(containerId)
  
  if (!container) {
    console.warn(`Portal container with id "${containerId}" not found`)
    return null
  }

  return createPortal(children, container)
}