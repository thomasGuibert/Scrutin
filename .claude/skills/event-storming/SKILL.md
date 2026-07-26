---
name: event-storming
description: EventStorming. Use when exploring a business domain with stakeholders, running a Big Picture workshop, mapping a business process on a timeline of domain events, or when the user mentions EventStorming, sticky-note workshops, or discovering bounded contexts.
---

# EventStorming

Alberto Brandolini's workshop format for surfacing how a business actually works, fast, by getting the people who know it in a room with a wall of sticky notes and no slides. The output feeds directly into the `domain-modeling` skill: bounded contexts and ubiquitous language get discovered here before they get written down there.

## The core notation

- **Orange sticky = domain event.** Something that happened, named in past tense ("Order Placed," "Payment Declined"). This is the only element every EventStorming session starts with — put a mass of these on the timeline before touching any other color.
- **Blue sticky = command.** The action or decision that triggers an event ("Place Order").
- **Yellow sticky = actor.** Who or what issues the command.
- **Pink sticky = external system.** Something outside the domain the process depends on.
- **Purple sticky = policy.** A rule of the form "whenever this event happens, that command follows" — where automation or business rules chain events together.
- **Red sticky = question or risk.** An unresolved point in the model, same role as example-mapping's red cards: it names what nobody in the room can currently answer.

## Three levels

Run these in order of decreasing scope, only going deeper once the level above is stable:

1. **Big Picture** — the whole domain, timeline of events end to end, no solutioning. Goal is breadth: surface every event stakeholders can name, including the exceptions and the "that never actually happens cleanly" cases.
2. **Process Modelling (Design Level)** — one process at a time, adding commands, actors, and policies to the events from Big Picture. This is where **bounded contexts** start to become visible — clusters of events that share vocabulary and change together.
3. **Software Design Level** — translating a settled process into aggregates, and a system boundary the team could actually build. Don't start here; a Software Design session run before Big Picture is modeling code, not the domain.

## Running the workshop

- Put everyone who touches the process in the room together — not just developers. The point is surfacing tribal knowledge that lives in people's heads, not documents.
- Chaotic exploration first: let the group place events out of order and in duplicate, then converge on a single timeline together. Premature order suppresses disagreement that's more useful surfaced than hidden.
- A cluster of red stickies in one area is a signal, not noise — it's telling you where the real domain complexity (or the real disagreement) lives. Don't smooth it over to finish the timeline; follow up on it, ideally with the `domain-modeling` skill's ADR format once the question is resolved.
