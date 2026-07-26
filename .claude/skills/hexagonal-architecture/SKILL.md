---
name: hexagonal-architecture
description: Ports and Adapters / Hexagonal Architecture. Use when designing how business logic should be isolated from frameworks, databases, UI, or external services, deciding where an adapter belongs, or when the user mentions hexagonal architecture, ports and adapters, or testing the domain without infrastructure.
---

# Hexagonal Architecture (Ports & Adapters)

Alistair Cockburn's pattern for one purpose: let the application be driven by a user, a script, or a test with zero code changes, and let it be developed and tested with no real database, UI, or external service in the loop.

## The inside/outside rule

The only distinction that matters is **inside the application** versus **outside it** — not "which layer," not "left vs right." Business logic is inside. Everything that talks to the world outside the process — HTTP, a database driver, a message queue, a UI framework — is outside. Code belonging to the outside must never leak into the inside: no ORM entity in a domain rule, no HTTP status code in a use case.

This is the same **seam** discipline as the `codebase-design` skill, applied at the scale of a whole application: the domain is a deep module, its port is the seam, and every adapter is interchangeable behind that seam.

## Ports and adapters

- A **port** is a conversation the application needs to have with the outside world, expressed as an interface the domain owns — not the technology that will eventually implement it. "Persist an order" is a port; "call this SQL" is not.
- An **adapter** translates between a port's interface and one specific technology. Multiple adapters can satisfy the same port (a Postgres adapter and an in-memory fake both satisfy "persist an order"), and swapping one for another never touches the domain.
- **Driving (primary) ports** are entry points — something outside calls into the application (a controller calling a use case). **Driven (secondary) ports** are exit points — the application calls out (a repository interface implemented by a database adapter). Every port is one or the other; naming it correctly clarifies which side owns the interface (the application always owns both).

## Why it earns its keep

- **Test the domain with no infrastructure.** Swap every driven port for an in-memory or fake adapter and the domain's tests run with no database, no network, no filesystem.
- **Defer technology decisions.** The domain can be built and proven correct before a database or framework is chosen, because nothing about the domain depends on either.
- **One reason to change per side.** A UI redesign touches only driving adapters; a database migration touches only driven adapters; neither touches the domain.

## Applying it

- Before adding a dependency to domain code, ask: does this belong to the conversation the domain needs to have, or to one specific technology's way of having it? If the latter, it's an adapter concern — define a port and push the dependency behind it.
- Don't create a port for a technology that will never be swapped. A second adapter is what makes a seam real (see `codebase-design`'s "two adapters" rule) — a port with permanently one adapter is speculative generality, not architecture.
