## Agent skills

### Issue tracker

Issues and specs live as GitHub Issues on `thomasGuibert/Scrutin`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Pipeline quotidien de données AN

A scheduled Routine fires a fresh session daily to fetch, curate, and publish new Assemblée nationale data with no human prompt. See `docs/agents/pipeline-quotidien-an.md` — run it in full for every firing, it does not assume any prior conversation.
