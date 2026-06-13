# AI Build & Design Workflow — Playbook

A reusable, end‑to‑end workflow for building and polishing a product's frontend
with AI tools, **backend‑free until handoff**. Written to be lifted into any
project. Concrete examples are in parentheses (this project's stack: React + Vite
+ Tailwind + shadcn, RTL/Arabic, Supabase, Vercel).

---

## 1. Tools & roles

| Tool | Role in the workflow |
|---|---|
| **Claude.ai** | **Planning.** Produces the spec: scope, per‑feature Definition of Done, conventions, sprint/card breakdown. |
| **You (design / frontend)** | Own **UI/UX and frontend**. Drive design decisions and test them. Backend is *out of scope* — a separate engineer wires it later. |
| **Claude.design** | **Visual iteration.** Reshapes a screen's look from its code + a screenshot. |
| **Claude Code** | **Engineering.** Turns plans and designs into production code in‑convention, runs the guardrails, opens PRs. Never puts backend tasks on you. |
| **GitHub** | **Source of truth.** One branch + one PR per change. |
| **Vercel** | **Hosting.** Every PR → a preview URL to test; merge → production. |

---

## 2. Core principles

1. **Two lanes, cleanly split.** Frontend and backend are separate. The frontend
   must build, run, and be fully testable with **no backend**.
2. **One change = one branch = one PR = one preview.** Keep each unit small and
   isolated so it gets its own preview and review.
3. **Complete before you announce.** Push the *entire* change before calling a PR
   ready, and **never add commits to a PR awaiting merge** — late commits get
   stranded when the PR merges at an earlier head.
4. **Guardrails over vigilance.** Automated checks (direction/RTL, design tokens,
   accessibility, tests) gate every PR, so quality never depends on memory.
5. **Handoff is first‑class from day one.** Everything faked lives in one isolated,
   documented seam so the next engineer goes live by flipping a flag.
6. **Port, don't paste.** Design‑tool output is a *reference for the look*, not
   code to drop in. Always re‑express it in the project's conventions.

---

## 3. Demo mode — the pattern that makes it backend‑free

The single most important enabler: a flag‑gated **mock layer** so the whole app
runs on sample data with no backend.

- **One seam.** Put *all* fakes in one folder (`src/lib/demo/`) behind one flag
  (`DEMO_MODE`). Wire it in as few places as possible — ideally the data‑client
  boundary and the app bootstrap.
- **Sensible default.** On when there's no backend config (a fresh clone just
  runs); explicit override via env (`VITE_DEMO_MODE=true|false`).
- **Realistic data.** Sample content that mirrors real shapes, so screens look
  populated and design decisions are made against reality.
- **Role switching.** For role‑based apps, a switcher to preview each role's
  screens (and it should *navigate into* that role's view, not just reload).
- **On the host.** Turn the demo flag on in the deploy platform (Vercel env) so
  previews render the full UI without a backend.

---

## 4. The enhancement loop (per screen)

```
Plan ──▶ Export ──▶ Enhance ──▶ Port & wire ──▶ Verify ──▶ PR ──▶ Preview ──▶ Merge
(Claude.ai) (Code)  (Claude.design)  (Code)      (Code)   (GitHub) (Vercel)   (you)
```

1. **Plan (Claude.ai).** Agree the intent/spec for the screen.
2. **Export for design (Claude Code).** I produce a **self‑contained** version of
   the screen — real sample data inlined, design tokens as concrete values,
   correct copy and direction (`dir="rtl"`) — so it renders faithfully in
   Claude.design (not an empty, LTR shell).
3. **Enhance (Claude.design + you).** Screenshot + export → iterate on the look →
   download the new code.
4. **Port & wire (Claude Code).** Translate the design back into our system:
   semantic color **tokens** (never raw hex), **logical** direction utilities,
   the project's component library, accessibility (labels, focus), and the
   **real data/hooks reconnected**.
5. **Verify (Claude Code).** Run guardrails locally — build, tests, direction
   check, lint — plus a screenshot of the result.
6. **PR (GitHub).** Fresh branch off `main`; documented PR with the
   Definition‑of‑Done checklist.
7. **Preview (Vercel).** You test the change on its preview URL (demo mode → no
   backend needed).
8. **Merge → production.** Then repeat for the next screen.

---

## 5. Definition of Done — gate every PR

- [ ] Builds; tests pass; direction/RTL check passes; lint clean on changed code.
- [ ] **Colors via tokens only** (themeable) — no hardcoded palette.
- [ ] **Direction‑correct** — logical utilities (`ps/pe`, `ms/me`, `start/end`);
      nav/drawers on the correct side for RTL; icons/carousels flip.
- [ ] **Accessible** — labels on icon‑only controls; form errors wired
      (`aria-invalid`/`aria-describedby`).
- [ ] **Data through the seam**, not hardcoded in the screen.
- [ ] PR says **what changed and how it was verified** (screenshots welcome).

---

## 6. Branch, PR & deploy discipline

- Branch **off the latest `main`** for each change; name it for the work.
- Open the PR **only when the change is complete**; don't push more to a PR that's
  about to merge.
- Let the **owner merge** (whoever owns the repo). After merge, sync `main` before
  the next branch.
- Each PR gets a **Vercel preview**; production updates on merge.

---

## 7. Handoff to the backend engineer

- All fakes in **one seam** behind **one flag**; nothing else in the app knows it
  exists (every screen reads data the same way in demo and real mode).
- A **`HANDOFF.md`** that states: how to turn demo off, the env to add, and the
  **contracts** — the data shapes / endpoints the frontend expects. *The mock
  definitions are the contract.*
- Going live = turn the flag off + add real backend config. No screen changes.

---

## 8. One‑line summary

> **Claude.ai plans it → Claude Code exports the screen → you reshape it in
> Claude.design → Claude Code ports & wires it in‑convention → PR → Vercel
> preview → you test → you merge** — with demo mode keeping every step
> backend‑free and a single documented seam keeping the eventual backend handoff
> clean.
