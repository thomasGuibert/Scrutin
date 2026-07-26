---
name: impact-mapping
description: Impact Mapping (Gojko Adzic). Use when deciding which deliverables actually earn a place in scope, tracing a feature back to the business goal it's meant to serve, prioritizing or pruning a backlog against a measurable goal, or when the user mentions impact mapping or wants to prevent scope creep.
---

# Impact Mapping

Gojko Adzic's technique for keeping "what we're building" honestly connected to "why we're building it." A map has four levels, read as why → who → how → what, and nothing on it is a commitment — it's a set of assumptions to test.

## The four levels

1. **Goal (Why)** — one specific business problem, framed **SMART**: specific, measurable, action-oriented, realistic, timely. Put a number on it ("increase renewal rate by 15% this quarter"), not a feature ("add a renewal reminder"). Without a measurable goal, nothing downstream can be judged against it — every later prioritization call traces back to this line.
2. **Actors (Who)** — the specific people or groups who can move the needle on the goal, named precisely (a persona or role, never a generic "users"). Four categories, and it's worth sorting into them rather than one flat list:
   - **Primary** — actors who directly benefit from reaching the goal.
   - **Secondary** — actors who provide a service in the process (support staff, an admin, a partner system's operator).
   - **Off-stage** — actors with an indirect stake (a regulator, a finance team watching the metric).
   - **Obstructing** — actors whose behavior actively works against the goal.
3. **Impacts (How)** — the behavior change each actor needs to make, described as a change in what they *do*, never as a feature. "Renew five days before expiry instead of letting it lapse," not "add a renewal button." Map both **positive impacts** (behavior that helps the goal) and **negative impacts** (behavior that hinders it) — preventing a negative impact is as valid a branch as encouraging a positive one.
4. **Deliverables (What)** — the features or activities that might produce an impact. Treat every deliverable as an **unproven assumption, not a commitment**: it's a bet that building this will cause that behavior change in that actor, nothing more certain than that until it's tried.

## Building the map

Work top-down: fix the goal first, then ask "who can affect this?", then for each actor "what would they need to do differently?", then for each impact "what could we build or do that might cause that?". A deliverable with no impact above it, or an impact with no actor above it, doesn't belong on the map — trace back up before adding it.

## Using it to prioritize

- **A deliverable earns its place only if it traces to an impact that traces to the goal.** If a proposed feature can't be connected up the tree, that's the signal to cut it — not evidence the map is incomplete.
- **Compare deliverables by the strength of the impact they target, not by how easy they are to build.** A cheap deliverable pointed at a weak impact is still weak.
- **The map is disposable once tested.** When a deliverable ships and the actor's behavior didn't change as assumed, that branch was falsified — redraw it, don't defend it.

## Relationship to neighboring practices

Impact Mapping runs early — right after a `grilling` session has sharpened the raw idea into a real goal, and *before* `to-spec` or `wayfinder` write up any deliverable in detail. Its job is deciding what's worth specifying at all; theirs is specifying it once chosen. Don't run it on a deliverable already mid-spec — by then the scoping decision it exists to make has already been taken elsewhere.
