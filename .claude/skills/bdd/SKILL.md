---
name: bdd
description: Behaviour-Driven Development. Use when writing Given/When/Then scenarios, Gherkin feature files, "should"-style test names, or when the user mentions BDD, Cucumber, or ubiquitous language for tests.
---

# Behaviour-Driven Development

BDD started as Dan North's answer to a specific confusion: developers writing "tests" but arguing about what to test and how much one test should cover. His fix was vocabulary — stop saying test, start saying **behaviour** — and a template that forces every scenario into one shape.

## Given/When/Then

Every scenario is three parts, in order:

- **Given** some initial context — the state of the world before anything happens.
- **When** an event occurs — the one action the scenario is about.
- **Then** ensure some outcomes — what must now be true.

One `When` per scenario. A scenario with two events under `When` is two scenarios wearing one name — split it.

## The "should" naming convention

Name behaviour as "the [thing] should [outcome]," e.g. "the account should be debited when a withdrawal succeeds." If the behaviour doesn't fit that sentence, it doesn't belong in this scenario — it belongs in a different one, or describes a different unit entirely. The name is a design pressure: fighting to phrase it cleanly is fighting to find the right seam.

## Ubiquitous language

Scenarios are written in the domain's own vocabulary, not implementation vocabulary — "withdrawal," not "POST /withdraw." The same words should appear in the scenario, the code, and the conversation with whoever requested the feature. Where the project maintains a domain glossary (see the `ubiquitous-language` or `domain-modeling` skill), scenario wording must match it exactly — a scenario that invents its own synonym for an existing term is a naming bug, not a stylistic choice.

## Relationship to neighboring practices

BDD is a vocabulary and template, not a full lifecycle — `atdd` is the discipline of writing these scenarios before the code and keeping them as regression tests; `example-mapping` is the workshop that produces the rules and examples a scenario formalizes. Reach for BDD's Given/When/Then specifically when the team already writes or reads Gherkin-style scenarios (Cucumber, SpecFlow, Behave); teams that write acceptance tests in plain assertions are still doing ATDD without doing BDD. Once a scenario is drafted, run it through the `brief` skill to check it reads as documentation rather than a UI script.
