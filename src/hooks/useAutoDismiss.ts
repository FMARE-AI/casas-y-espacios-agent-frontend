import { useEffect } from 'react'

export function useAutoDismiss(id: number, onDismiss: (id: number) => void, delayMs: number): void {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), delayMs)
    return () => clearTimeout(timer)
  }, [id, onDismiss, delayMs])
}
