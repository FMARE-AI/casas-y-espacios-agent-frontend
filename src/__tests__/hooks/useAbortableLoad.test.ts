import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAbortableLoad } from '../../hooks/useAbortableLoad'

describe('useAbortableLoad', () => {
  it('hands out a live signal while mounted', () => {
    const { result } = renderHook(() => useAbortableLoad())

    expect(result.current.getSignal().aborted).toBe(false)
    expect(result.current.isMounted()).toBe(true)
  })

  it('returns the same signal for every read of a single mount', () => {
    const { result } = renderHook(() => useAbortableLoad())

    expect(result.current.getSignal()).toBe(result.current.getSignal())
  })

  it('aborts the signal on unmount', () => {
    const { result, unmount } = renderHook(() => useAbortableLoad())
    const signal = result.current.getSignal()

    unmount()

    expect(signal.aborted).toBe(true)
  })

  it('reports isMounted() false after unmount', () => {
    const { result, unmount } = renderHook(() => useAbortableLoad())
    const { isMounted } = result.current

    unmount()

    expect(isMounted()).toBe(false)
  })

  // A handler queued before unmount (a WS refetch, say) must inherit the
  // cancellation instead of escaping it with a brand new controller.
  it('keeps returning the aborted signal after unmount', () => {
    const { result, unmount } = renderHook(() => useAbortableLoad())
    const { getSignal } = result.current

    unmount()

    expect(getSignal().aborted).toBe(true)
  })

  // StrictMode mounts, unmounts and remounts: the second mount must not inherit
  // the first mount's aborted controller, or its first request is born cancelled.
  it('issues a fresh signal on remount', () => {
    const first = renderHook(() => useAbortableLoad())
    const firstSignal = first.result.current.getSignal()
    first.unmount()

    const second = renderHook(() => useAbortableLoad())

    expect(firstSignal.aborted).toBe(true)
    expect(second.result.current.getSignal().aborted).toBe(false)
    expect(second.result.current.isMounted()).toBe(true)
  })

  it('keeps getSignal/isMounted referentially stable across renders', () => {
    const { result, rerender } = renderHook(() => useAbortableLoad())
    const { getSignal, isMounted } = result.current

    rerender()

    expect(result.current.getSignal).toBe(getSignal)
    expect(result.current.isMounted).toBe(isMounted)
  })
})
