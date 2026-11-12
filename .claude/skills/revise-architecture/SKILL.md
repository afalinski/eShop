---
name: revise-architecture
description: One revision round for the architecture overview — the architect fixes the conclusions the critic rejected, then the critic re-checks only the changed parts. Use after explore-system has produced overview.md and verification.md.
model: sonnet
disable-model-invocation: true
---

# Revise the architecture (feedback loop, ADR-002)

You are the orchestrator. Do not read or edit the documents yourself; pass file paths only.
This is one round. Do not start a second round — report what is still unsupported instead.

## 1. Architect — revision mode
One `architect` call. Brief:
- Mode: revision.
- Inputs: `docs/architecture/overview.md`, `docs/architecture/verification.md`, and the card files.
- Task: fix every item in "Overview conclusions not supported by the evidence" and every place in the overview that relies on a claim marked WRONG or NOT CONFIRMED.

## 2. Critic — re-check mode
One `critic` call. Brief:
- Mode: re-check.
- Inputs: `docs/architecture/overview.md` (its "Revision log" section lists what changed) and `docs/architecture/verification.md`.
- Task: verify only the items in the revision log.

Pass only file paths. Do not pass the architect's reply.

## 3. Record
- Append to `docs/metrics.md`, under the Stage 1 section, a "Revision round" table: items fixed, items still unsupported, new problems introduced, tokens and time per role.
- Plan soundness = target steps with no open critic finding ÷ all target steps. Record it before and after the round.
- Append a short entry to `docs/experiments.md`.
- Report to the user: plan soundness before → after, and what still needs a human decision.
