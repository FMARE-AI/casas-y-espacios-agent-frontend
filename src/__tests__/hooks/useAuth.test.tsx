import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import React from "react"
import { useAuthStore } from "../../store/authStore"
import type { Advisor } from "../../types"

// vi.hoisted ensures these refs are available inside the hoisted vi.mock factories
const { mockNavigate, mockApiPost, mockGetMe } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockApiPost: vi.fn(),
  mockGetMe: vi.fn(),
}))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("../../lib/axios", () => ({
  default: {
    post: mockApiPost,
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock("../../services/advisors", () => ({
  advisorsService: { getMe: mockGetMe },
}))

import { useAuth } from "../../hooks/useAuth"

function makeAdvisor(overrides = {}) {
  return {
    id: "advisor-1", email: "ana@casasyespacios.co", full_name: "Ana Gomez",
    role: "asesor", area: "administrativa", max_conversations: 3,
    active_conversations: 0, availability_status: "available",
    is_active: true, avatar_url: null, must_change_password: false,
    ...overrides,
  }
}

function renderUseAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => React.createElement(MemoryRouter, null, children),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useAuthStore.setState({ token: null, advisor: null, role: null, isLoading: false, isFirstLogin: false, sessionExpired: false, error: null })
})

describe("useAuth", () => {
  describe("signIn success flow", () => {
    it("calls POST /auth/token, stores token, fetches advisor, navigates to /", async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: "real-jwt-token" } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signIn("ana@casasyespacios.co", "password123") })
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/panel/auth/token", { email: "ana@casasyespacios.co", password: "password123" })
      expect(useAuthStore.getState().token).toBe("real-jwt-token")
      expect(localStorage.getItem("panel_token")).toBe("real-jwt-token")
      expect(useAuthStore.getState().advisor?.id).toBe("advisor-1")
      expect(useAuthStore.getState().error).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith("/")
    })
  })

  describe("signIn must_change_password", () => {
    it("navigates to /first-login and sets isFirstLogin to true", async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: "real-jwt-token" } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor({ must_change_password: true }) })
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signIn("ana@casasyespacios.co", "password123") })
      expect(useAuthStore.getState().isFirstLogin).toBe(true)
      expect(mockNavigate).toHaveBeenCalledWith("/first-login")
    })
  })

  describe("signIn ADVISOR_INACTIVE 403", () => {
    it("resets store and sets descriptive error message", async () => {
      mockApiPost.mockRejectedValue({ response: { status: 403, data: { detail: { code: "ADVISOR_INACTIVE", message: "Inactive" } } } })
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signIn("ana@casasyespacios.co", "password123") })
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().error).toBe("Tu cuenta está desactivada. Contacta a un administrador.")
    })
  })

  describe("signIn wrong credentials", () => {
    it("sets error from backend detail message", async () => {
      mockApiPost.mockRejectedValue({ response: { status: 401, data: { detail: { code: "INVALID_TOKEN", message: "Credenciales incorrectas" } } } })
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signIn("ana@casasyespacios.co", "wrongpassword") })
      expect(useAuthStore.getState().error).toBe("Credenciales incorrectas")
      expect(useAuthStore.getState().token).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalledWith("/")
    })
  })

  describe("signIn isLoading lifecycle", () => {
    it("sets isLoading false at end", async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: "real-jwt-token" } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signIn("ana@casasyespacios.co", "password123") })
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
    it("sets isLoading false even when signIn fails", async () => {
      mockApiPost.mockRejectedValue(new Error("fail"))
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signIn("x@x.co", "bad") })
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe("session restore on mount", () => {
    it("restores token and advisor from localStorage", async () => {
      localStorage.setItem("panel_token", "stored-jwt")
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })
      const { unmount } = renderUseAuth()
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      expect(useAuthStore.getState().token).toBe("stored-jwt")
      expect(useAuthStore.getState().advisor?.id).toBe("advisor-1")
      unmount()
    })
    it("sets isFirstLogin when restored advisor has must_change_password", async () => {
      localStorage.setItem("panel_token", "stored-jwt")
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor({ must_change_password: true }) })
      const { unmount } = renderUseAuth()
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      expect(useAuthStore.getState().isFirstLogin).toBe(true)
      unmount()
    })
    it("resets store when getMe fails during session restore", async () => {
      localStorage.setItem("panel_token", "expired-jwt")
      mockGetMe.mockRejectedValue(new Error("401"))
      const { unmount } = renderUseAuth()
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      expect(useAuthStore.getState().token).toBeNull()
      expect(localStorage.getItem("panel_token")).toBeNull()
      unmount()
    })
    it("sets isLoading false even when no token in localStorage", async () => {
      const { unmount } = renderUseAuth()
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      expect(useAuthStore.getState().isLoading).toBe(false)
      unmount()
    })
  })

  describe("session-expired event", () => {
    it("sets sessionExpired to true when event is dispatched", async () => {
      const { unmount } = renderUseAuth()
      await act(async () => { window.dispatchEvent(new CustomEvent("session-expired")) })
      expect(useAuthStore.getState().sessionExpired).toBe(true)
      unmount()
    })
    it("removes session-expired listener on unmount", async () => {
      const { unmount } = renderUseAuth()
      unmount()
      await act(async () => { window.dispatchEvent(new CustomEvent("session-expired")) })
      expect(useAuthStore.getState().sessionExpired).toBe(false)
    })
  })

  describe("signOut", () => {
    it("resets store, clears localStorage, and navigates to /login", async () => {
      useAuthStore.getState().setToken("active-token")
      useAuthStore.getState().setAdvisor(makeAdvisor() as Advisor)
      const { result } = renderUseAuth()
      await act(async () => { await result.current.signOut() })
      expect(useAuthStore.getState().token).toBeNull()
      expect(localStorage.getItem("panel_token")).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith("/login")
    })
  })
})

