---
name: brief
description: Keep BDD/Gherkin scenarios short and readable using the BRIEF principles (Cucumber). Use when writing or reviewing a Given/When/Then scenario that feels too long, too UI-detailed, or hard to follow, or when the user mentions BRIEF, scenario brevity, or five-line scenarios.
---

# BRIEF Scenarios

Six principles for scenarios that stay useful as documentation instead of rotting into brittle UI scripts. Five spell the acronym; the sixth is the rule of thumb that names the whole thing.

## Business language

Write in the vocabulary of the domain, not the vocabulary of one specific screen or database. If two people from the business would use different words for the same thing, settle on one term — see `bdd`'s ubiquitous-language rule — before writing the scenario, not after.

## Real data

Use concrete, plausible values, not `foo`/`bar` placeholders — a real name, a real amount, a real date exposes edge cases a placeholder hides. Never wire the scenario to data that only exists in one particular environment; the values are illustrative, not a fixture.

## Intention revealing

State what the actor wants, not the clicks that get them there. "Given a signed-in customer" survives a redesign of the login screen; "Given the customer clicks 'Login', enters a username, enters a password, and clicks 'Submit'" doesn't. If the UI changes and the scenario breaks even though the rule didn't change, this principle was the one violated.

## Essential

Every line should support the one rule the scenario illustrates. A detail that's true but irrelevant to that rule doesn't earn a line — cut it, even if it's "realistic."

## Focused

One scenario, one rule. A scenario proving two rules at once is two scenarios wearing one name — split it. This is usually a sign the scenario wasn't `example-mapping`'s output carried through faithfully: one green card should become one scenario.

## Brief

Five lines or fewer, as a working ceiling, not a hard limit. A scenario that won't fit is usually failing Essential or Focused above it — the length is the symptom, not the disease. Fix the cause before trimming words to hit the line count.

## Why it matters

A verbose scenario fails twice: as documentation, because stakeholders stop reading it; and as a test, because it now breaks on unrelated implementation changes (a button renamed, a field reordered) instead of on the rule actually changing. Both failures trace back to the same root — describing *how* instead of *what*.

## Relationship to neighboring practices

BRIEF is a quality lens on scenarios already following `bdd`'s Given/When/Then template — it doesn't replace that template, it judges how well a scenario written in it reads. Apply it right after `example-mapping` turns a green card into a draft scenario, and again during `atdd`'s Distill step before the scenario is automated.
