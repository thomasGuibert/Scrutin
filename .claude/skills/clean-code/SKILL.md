---
name: clean-code
description: Clean Code principles (Robert C. Martin). Use when writing new code and the user wants guidance on naming, function size, comments, or formatting, or mentions clean code or Uncle Bob. For diagnosing problems in existing code, use code-smells instead.
---

# Clean Code

Robert Martin's rules for code that reads like it was written by someone who cared whether the next person understood it. These are principles to write *by*; the `code-smells` skill is the companion catalog for diagnosing code that already violates them.

## Naming

- A name should answer why it exists, what it does, and how it's used — if it needs a comment to do that, the name has failed.
- Use one word per concept consistently. If `fetch` retrieves data in one place, don't call it `retrieve` or `get` somewhere else for the same operation.
- Prefer a longer, searchable, pronounceable name over a short cryptic one. `daysUntilExpiry` beats `d`.
- Don't encode type or scope in the name (`strName`, `m_count`) — the type system and the language already say that.

## Functions

- Small. If it doesn't fit on a screen without scrolling, look for the seam to extract.
- Do one thing, at one level of abstraction. A function mixing "parse the request" with "compute the discount" is doing two things wearing one name.
- As few arguments as possible — zero is ideal, one or two is normal, three demands justification, more than three demands a parameter object.
- No flag arguments. A boolean parameter that switches behavior means the function does two things; split it into two functions instead.
- No side effects hiding behind an innocent name. A function called `checkPassword` that also starts a session is lying about what it does.

## Comments

- The best comment is the one you didn't need to write because the code said it. Reach for a better name or a smaller function before reaching for a comment.
- A comment earns its place when it explains *why* — a non-obvious constraint, a workaround, a consequence the reader can't see from the code itself.
- Delete commented-out code. Version control already remembers it; a comment doesn't need to.

## Objects vs. data structures

- An object hides its data behind behavior; a data structure exposes its data and has no behavior. Don't build hybrids that do both halfway — they get the worst of each: hard to extend with new types (object-style) and hard to add new operations to (data-style) at the same time.
- Prefer polymorphism over a conditional that switches on an object's type. If adding a new type means hunting down every `if`/`switch` on a type tag, the type tag should have been a polymorphic method instead.

## Formatting

- Order code top-down, like a newspaper: the high-level function first, its details below it, so the reader can stop reading once they have enough context.
- Keep a variable's declaration close to its first use, and keep related lines dense with no unrelated code between them.

## Error handling

- Use exceptions, not returned error codes, so the caller can't silently ignore failure by forgetting to check a return value.
- Don't return `null`, and don't pass `null` as an argument — both push a null-check obligation onto every caller, forever.
