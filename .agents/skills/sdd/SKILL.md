---
name: sdd
description: Guides the full Spec-Driven Development (SDD) cycle for a new feature in any project that follows the specs/<feature>/ folder convention. Use this skill whenever the user wants to start a new feature using SDD, design something before coding it, or work through the spec→clarification→design→implementation pipeline. Trigger on: "nueva feature", "quiero agregar X", "empecemos con SDD", "arranca el ciclo para X", "start SDD for X", "spec for X", "diseñemos X antes de codear", "/sdd", or any time the user introduces a new capability and wants to spec it before implementing.
---

# SDD — Spec-Driven Development

You are guiding the user through a structured Spec-Driven Development cycle. The goal is to think before coding: write the spec, resolve ambiguities, design the solution, and only then implement.

Every feature lives in `specs/<feature_name>/` and follows exactly four ordered documents. You work through them one at a time, in order. Never skip ahead.

---

## Step 0 — Bootstrap

Before anything else:

1. **Read `specs/global-architecture.md`** if it exists — it contains cross-cutting constraints and decisions that apply to all features. Everything you write must be consistent with it. If it doesn't exist, skip this step.
2. **Read `constitution.md`** at the project root if it exists — it contains foundational principles and non-negotiable rules that govern all features. Everything you write must respect them. If it doesn't exist, skip this step.
3. **Read `CLAUDE.md`** at the project root if it exists — it contains project-specific patterns, conventions, and rules that implementation must follow.
4. **Identify the feature folder name** — ask the user if they haven't specified one. Use `snake_case`. Example: `user_notifications`, `entra_id_login`.
5. **Read `specs/<feature_name>/prd.md`** if it exists — this is the primary source of truth for what the product team wants built. Extract goals, expected behavior, constraints, and any explicit non-goals from it. Everything you produce in subsequent phases must align with it. If it doesn't exist, skip this step.
6. **Create the folder** `specs/<feature_name>/` if it doesn't exist.
7. **Create the four files** if they don't exist (they can be empty — you'll fill them in each phase):
   - `specs/<feature_name>/01-spec.md`
   - `specs/<feature_name>/02-clarification.md`
   - `specs/<feature_name>/03-design.md`
   - `specs/<feature_name>/04-implementation.md`

Then proceed to Phase 1.

---

## Phase 1 — Spec (`01-spec.md`)

**Goal**: Capture what we are building and why, with zero implementation detail.

### What to do
If a `prd.md` was read in Step 0, use it as the primary source to fill the spec template — extract goals, behavior, constraints, and non-goals directly from it. Only ask the user for information that the PRD doesn't cover. If there is no PRD, ask all questions in a single message. Wait for answers, then write the file.

### Questions to ask (if not already known from the PRD)
- What problem does this feature solve? Who has this problem?
- What is the expected behavior from the user's perspective?
- What is explicitly out of scope?
- Are there any constraints (performance, security, backward compatibility, external systems involved)?
- Is there a deadline or priority level?

### Template for `01-spec.md`

```markdown
# Spec: <Feature Name>

## Problem
[What problem are we solving and for whom.]

## Goals
- [Goal 1]
- [Goal 2]

## Non-Goals
- [What this feature explicitly does NOT do]

## Expected Behavior
[How this feature behaves from the user's or system's perspective. Use concrete examples.]

## Constraints
- [Technical, security, performance, or product constraints]

## Priority
[High / Medium / Low — and why]
```

Write the completed spec to `specs/<feature_name>/01-spec.md`.
After writing: summarize in 2 sentences what was captured, and confirm with the user before moving to Phase 2.

---

## Phase 2 — Clarification (`02-clarification.md`)

**Goal**: Surface and resolve every ambiguity before design begins. No surprises during implementation.

### What to do
Read `01-spec.md`. Identify every assumption, ambiguity, or missing detail that could affect the design. Generate a numbered list of questions. Present them to the user in one message. Wait for answers.

### Format for `02-clarification.md`
```markdown
# Clarifications: <Feature Name>

## Questions & Answers

**Q1: [Question]**
A: [Answer from the user]

**Q2: [Question]**
A: [Answer from the user]

...

## Open Decisions
[Any decisions that remain unresolved and will need a choice during design]
```

After writing: confirm with the user that all ambiguities are resolved before proceeding.

---

## Phase 3 — Design (`03-design.md`)

**Goal**: Define the technical solution — components, data flow, contracts — without writing implementation code.

### What to do
Read `01-spec.md` and `02-clarification.md`. Design the solution. Propose the design to the user for review before writing the file.

### Template for `03-design.md`
```markdown
# Design: <Feature Name>

## Overview
[One paragraph: what we're building and how it fits into the existing architecture.]

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/...` | [purpose] | Add / Modify / Create |
| ... | ... | ... |

### Key Abstractions
[New classes, functions, modules, or services introduced. For each: name, responsibility, inputs, outputs.]

### Data Flow
[Sequence or numbered steps describing how data moves through the system for the main use case.]

1. [Step 1]
2. [Step 2]
3. ...

### API / Interface Contracts
[Any new or modified interfaces: function signatures, HTTP endpoints, events, CLI commands, etc.]

### Edge Cases & Error Handling
- [Edge case 1 → how it's handled]
- [Edge case 2 → how it's handled]

## Open Questions for Implementation
[Any decisions deferred to implementation time]
```

Write the completed design to `specs/<feature_name>/03-design.md`.
After writing: ask the user to explicitly approve the design. Do not proceed to Phase 4 until they do.

---

## Phase 4 — Implementation (`04-implementation.md`)

**Goal**: Translate the approved design into a concrete, ordered list of implementation tasks, then execute them.

### What to do
Read `03-design.md`. Break the work into discrete, sequential tasks. Each task maps to one or more file changes. Write the plan, then execute it task by task — updating the file as you go.

### Template for `04-implementation.md`
```markdown
# Implementation Plan: <Feature Name>

## Tasks

- [ ] **Task 1**: [Description] — `file_path`
- [ ] **Task 2**: [Description] — `file_path`
- [ ] **Task 3**: [Description] — `file_path`
...

## Execution Log

### Task 1 — [Title]
Status: ✅ Done / 🔄 In Progress / ⏳ Pending
Notes: [anything worth noting about how this was implemented or any deviation from the design]

...
```

### Execution rules
- Mark each task 🔄 In Progress when you start it, ✅ Done when complete.
- Update `04-implementation.md` after each task — do not batch updates at the end.
- If you discover something during implementation that contradicts the design, stop, document it in the Execution Log, and ask the user how to proceed before continuing.
- When all tasks are ✅ Done, run a final check: does the implementation match `03-design.md`? Does it follow all patterns in `CLAUDE.md`?

---

## Rules That Apply to All Phases
- Never skip a phase. Each document feeds the next.
- Never start coding before Phase 3 is approved. Design first, code second.
- One phase at a time. Complete and confirm each document before opening the next.
- Stay consistent with `CLAUDE.md` if it exists. Project conventions always take precedence.
- Stay consistent with `specs/global-architecture.md` if it exists. Cross-cutting decisions there apply to every feature.
- Ask, don't assume. If you're unsure about something in any phase, surface it as a question before writing.
