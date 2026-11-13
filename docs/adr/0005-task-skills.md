# ADR-005: Skills for recurring tasks

- Status: Accepted
- Date: 2026-11-13

## Context
Multi-step procedures do not belong in `CLAUDE.md`: they would cost attention on every task. A skill's description is always in context, and its body loads only when the task matches. Anthropic's guidance (re-read 2026-11-13): write only what Claude cannot find on its own, lead the description with the use case, keep `SKILL.md` under 500 lines, put the most important instructions first because only the start of a skill survives compaction, and check a skill against a baseline without it.

## Decision
Three skills: `add-endpoint`, `add-integration-event` and `add-migration`. Each contains only what the code does not show at a glance and what was checked in the code:
- `add-endpoint`: which versioned group to use, the naming convention, that building Catalog regenerates tracked OpenAPI documents, and which test project, fixture and framework to use.
- `add-integration-event`: the outbox call for each publisher, that the bus routes by class name only (so every consumer's copy must keep the exact class and property names), Basket's source-generated JSON context, and where unit tests live.
- `add-migration`: the project pairs for the four contexts (none has a design-time factory), the drift check before and after, that the first new migration rewrites the snapshot without a schema change, and that services apply migrations at startup.

Both are model-invocable. They change only the working tree, and the result is checked by tests and review. `explore-system` and `revise-architecture` stay manual-only (`disable-model-invocation`), because one run costs hundreds of thousands of tokens.

`dotnet ef` is not part of the repository. The `add-migration` recipe was verified with dotnet-ef 10.0.12 installed outside the repository (E7), and the skill tells the agent to ask before installing it.

## Consequences
- Triggering was checked: 4 of 4 prompts behaved as intended (E6). The sample is one run per prompt.
- Whether a skill makes the result better is not measured yet. That is the stage 2 comparison with and without configuration.
- Skills cite files and patterns that will change. They are audited with `/doctor prompt-audit` together with the rules.
