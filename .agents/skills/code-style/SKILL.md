---
name: Casas y Espacios Code Style
description: Trigger this skill when writing or refactoring any code in the Casas y Espacios repository.
---

# Code and Language Style

- **Code is in English**: All variable names, function names, class names, type aliases, inline comments, and docstrings MUST be written in English.
- **UI is in Spanish**: User-facing strings rendered in the UI (labels, error messages, toast notifications, etc.) MUST be in Spanish.
- **No Inline Types**: Never define types inline in components or hooks. Use the central `types/index.ts` (or equivalent).
- **Styling**: Use standard Tailwind CSS utility classes and the predefined color palette.

## Frontend Specifics
- Always use `useAuthStore` or standard services from `src/services/` for data fetching.
- Ensure strict TypeScript typing (`tsc --noEmit` must pass).
- For UI aesthetics, prioritize visual excellence and glassmorphism where applicable, per design.
