---
name: atdd
description: Acceptance Test-Driven Development. Use when the user wants to write acceptance criteria before building a story, turn a story into executable acceptance tests, mentions ATDD or specification by example, or asks how a feature will be verified as "done."
---

# Acceptance Test-Driven Development

ATDD turns a story's acceptance criteria into acceptance tests, written and agreed *before* implementation starts, then automated so they stay the executable definition of "done." The criteria come from a real conversation between whoever wants the feature, whoever builds it, and whoever tests it — not from one person guessing at the other two's intent.

## The cycle

1. **Discuss** — customer, developer, and tester talk through the story until they agree what "done" means. Use the `example-mapping` skill to run this conversation: it produces the rules and concrete examples ATDD needs as raw material.
2. **Distill** — turn each example into a concrete acceptance test: inputs, action, expected outcome. Use the `bdd` skill's Given/When/Then template if the team writes scenarios in that vocabulary; a plain input/output table works just as well when it doesn't. If writing Gherkin, check the draft against the `brief` skill before moving on — a scenario that's too long or too UI-specific here stays that way through Develop.
3. **Develop** — write the acceptance test first, watch it fail, then implement until it passes. This is the same red-before-green discipline as the `tdd` skill, one level up: acceptance tests bound the story, unit tests (from `tdd`) drive the internals underneath.
4. **Demo** — the passing acceptance test *is* the demo. If a stakeholder needs to see something the test doesn't check, the test is incomplete — extend it rather than demoing around it.

## Rules

- **One acceptance test per rule, not per example.** Multiple examples under one rule (see `example-mapping`) usually collapse into one parameterized test — write it once, feed it every example as a case.
- **Acceptance tests are written before the story is picked up for implementation**, not alongside or after. If the team is coding first and writing acceptance tests to match, it isn't ATDD.
- **Acceptance tests survive the story.** Once green, keep them running as regression tests — they're the specification, and specifications don't get deleted when the feature ships.
- **A story with no acceptance test isn't ready.** If Discuss produced no testable rule, the story needs another pass at Discuss, not a shortcut to Develop.

## Relationship to neighboring practices

ATDD is the discipline (write the test before the code, at the acceptance level); `bdd` is one vocabulary for writing that test (Given/When/Then, "should"-named behaviour); `example-mapping` is the workshop that surfaces the rules and examples ATDD turns into tests. A team can do ATDD with plain assertions and no Gherkin at all — BDD's vocabulary is optional, the acceptance-test-first discipline is not.
