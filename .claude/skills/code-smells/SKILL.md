---
name: code-smells
description: Code smell catalog (Fowler & Beck's Refactoring). Use when reviewing or refactoring existing code, deciding what's wrong with a piece of code, or when the user mentions code smells, duplicated code, long methods, or wants to know what to refactor and why.
---

# Code Smells

A **code smell** is a surface symptom, quick to spot by inspection, that usually points to a deeper design problem — not a certainty of one. Coined by Kent Beck, cataloged by Martin Fowler in *Refactoring*. Use this catalog to name what's wrong before reaching for a fix; the `simplify` skill is where the fix itself happens.

## Bloaters — grown too large to reason about

- **Long Function** — does more than its name suggests because it's never been split. Extract until each piece does one thing.
- **Large Class** — same growth, at the class level; usually means it has more than one responsibility.
- **Long Parameter List** — three or more parameters that keep growing. Bundle related ones into a parameter object.
- **Data Clumps** — the same group of fields or parameters shows up together, repeatedly, without ever being named as a thing.
- **Primitive Obsession** — a domain concept (money, a date range, an email) represented as a raw string or number instead of a small type of its own.

## Object-orientation abusers — OO mechanisms used against their purpose

- **Switch Statements / Repeated Switches** — the same type-check conditional copy-pasted at multiple call sites. Usually wants to be polymorphism instead (see `clean-code`).
- **Temporary Field** — an instance field that's only ever set and used inside one method, empty the rest of the object's life.
- **Refused Bequest** — a subclass that inherits methods it doesn't want or overrides to do nothing — the inheritance relationship doesn't actually hold.
- **Alternative Classes with Different Interfaces** — two classes doing the same job with differently-named methods, so they can't be swapped behind one seam.

## Change preventers — one change forces edits in many places

- **Divergent Change** — one class keeps getting modified for many unrelated reasons — a sign it has more than one responsibility.
- **Shotgun Surgery** — one conceptual change requires small edits scattered across many classes — the opposite failure mode from Divergent Change, and just as costly.
- **Parallel Inheritance Hierarchies** — creating a subclass in one hierarchy always forces creating a matching subclass in another.

## Dispensables — things worth removing outright

- **Comments** (as a smell) — a comment compensating for code that isn't clear on its own. Fix the code first; see `clean-code`.
- **Duplicated Code** — the same structure repeated instead of extracted and reused.
- **Lazy Element** — a class or function that no longer earns its overhead (a single-line wrapper with no other purpose).
- **Data Class** — a class with fields and getters/setters but no behavior — a data structure wearing a class's clothes (see `clean-code`'s objects-vs-data-structures rule).
- **Dead Code** — reachable by nothing; delete it, don't comment it out.
- **Speculative Generality** — abstraction (a parameter, a subclass hook, a config flag) built for a future need that hasn't arrived. Remove it until a second real case justifies it.

## Couplers — classes too entangled with each other

- **Feature Envy** — a method more interested in another object's data than its own; it calls that object's getters repeatedly and would be simpler living there instead.
- **Inappropriate Intimacy** — two classes reaching into each other's internals routinely, rather than talking through a small interface.
- **Message Chains** — `a.getB().getC().getD()` — a caller reaching through several objects to get to a fourth. Couples the caller to the whole chain's structure.
- **Middle Man** — the opposite extreme: a class whose methods mostly just delegate to another object, earning nothing for the indirection.
- **Insider Trading** — modules that know too much about each other's internals, trading data back and forth in ways their public interface was supposed to prevent.

## Using the catalog

- Name the smell before proposing a fix — "this is Feature Envy" is a sharper starting point for a review comment than "this looks off."
- A smell is a prompt to look closer, not an automatic verdict. Some — a Data Class used as a DTO at a system boundary, a Middle Man used deliberately as an adapter (see `hexagonal-architecture`) — are the right shape for their context. Check the context before refactoring on reflex.
