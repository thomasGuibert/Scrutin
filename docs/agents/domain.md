# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: single-context

This repo uses a single context — one `CONTEXT.md` at the repo root, no `CONTEXT-MAP.md`.

```
/
├── CONTEXT.md
├── docs/adr/
└── (src/ once the technical architecture resumes)
```

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If either doesn't exist yet, proceed silently — don't flag their absence, don't suggest creating them upfront. `/domain-modeling` creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md` (e.g. Thème racine, Branche, Sous-thème, Dossier législatif, Scrutin, Position, Tag d'impact, Votants). Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-000X (…) — but worth reopening because…_
