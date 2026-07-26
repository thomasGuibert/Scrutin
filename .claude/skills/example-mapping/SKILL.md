---
name: example-mapping
description: Example Mapping. Use when breaking a user story down before it enters a sprint, running a three-amigos conversation, or when the user mentions example mapping, three amigos, or wants to check whether a story is ready to build.
---

# Example Mapping

Matt Wynne's technique for making story-clarification conversations short and productive: four colors of index card, one conversation, 25 minutes.

## The four cards

- **Yellow — story.** One card, at the top. The story under discussion.
- **Blue — rule.** An acceptance criterion. Each rule gets its own card, laid out under the story.
- **Green — example.** A concrete illustration of one rule — a specific scenario with specific values, named informally ("the one where the customer forgot his receipt"). Goes under the rule it illustrates.
- **Red — question.** Something nobody in the room can currently answer. Captured the moment it comes up, not smoothed over to keep the conversation moving.

## Running it

Three amigos minimum — one voice for the business, one for development, one for testing — talk through the story while someone lays cards out live: story on top, rules underneath, examples under their rule, questions wherever they land. The map is the artifact; the conversation is the point.

Timebox to **25 minutes**. At the end, thumb-vote on readiness rather than letting the clock decide by exhaustion.

## Reading the map

- **Many red cards** → too much unknown. Don't build yet — the story needs research or a decision from someone not in the room.
- **Many blue cards** → the story is doing too much. Split it: a rule with its own examples is usually a story of its own.
- **A rule with no green cards under it** → not actually understood yet, just asserted. Push for at least one concrete example before calling the rule settled.
- **Every rule has examples, no unresolved red cards, thumbs up** → the story is ready, and every green card is raw material for an acceptance test — hand the map to the `atdd` or `bdd` skill to turn examples into executable scenarios.
