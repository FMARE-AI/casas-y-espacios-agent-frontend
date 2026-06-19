---
name: Spec-Driven Development Workflow
description: Trigger this skill when the user asks to start a new feature, use SDD, or design a solution before coding.
---

# Spec-Driven Development (SDD)

When starting a new feature that is large, ambiguous, or cross-cutting (touches more than 3 files):
1. Do NOT start coding immediately.
2. Work inside the `specs/<feature_name>/` directory.
3. Create `01-spec.md` to define the WHAT and WHY (no implementation details).
4. Create `02-clarification.md` to resolve any Q&A ambiguities with the user.
5. Create `03-design.md` detailing the technical solution. **Wait for explicit approval from the user before coding.**
6. Create `04-implementation.md` with the task plan and execution log.

For smaller features (≤3 files, clear spec), implement directly without SDD.
