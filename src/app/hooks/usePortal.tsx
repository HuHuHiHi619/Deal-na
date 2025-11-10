"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function usePortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (children: React.ReactNode) =>
    mounted ? createPortal(children, document.body) : null;
}
