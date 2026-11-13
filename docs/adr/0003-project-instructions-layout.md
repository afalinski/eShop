# ADR-003: Project instructions: a short CLAUDE.md plus path-scoped rules

- Status: Accepted
- Date: 2026-11-12

## Context
Stage 1 left about 1,200 lines of verified architecture notes in `docs/architecture/`. Agents working on the code should use them without paying for all of it on every task.

Claude Code loads `CLAUDE.md` into every session, so each line takes some attention on every task, relevant or not. Anthropic's guidance, re-read on 2026-11-12:
- Put in `CLAUDE.md` only what Claude cannot work out from the code: commands, places where the code misleads, team decisions, things corrected twice. Describing architecture and file layout there is listed as advice to stop following.
- Aim for under 200 lines. An `@import` does not reduce cost, because the imported file loads with its parent.
- Rules that matter for one part of the code go in `.claude/rules/` with a `paths:` filter and load only when Claude works with matching files.
- Procedures go in skills. Rules with no exceptions go in hooks or deny rules, because `CLAUDE.md` is guidance that Claude may decide not to follow.

## Options
- **A. Minimal root file.** Commands, gotchas, team rules, a path to the overview. Per-service traps either bloat it or are left out.
- **B. A plus `.claude/rules/` with `paths:` for Ordering, Catalog, Basket, Webhooks and Identity.**
- **C. A thick file that includes the overview.** Kept only as a control branch for the measurement below.

## Decision
**B.**

Why:
1. Most of what an agent needs is specific to one service. With B it loads when the agent opens files of that service and costs nothing during work on another one.
2. The overview mostly repeats what the code says. What an agent cannot see in the code are the traps, such as the anonymous Catalog writes, the 200 response on a failed order, or the exception swallowing in `IdentifiedCommandHandler`. Those are what the files contain.
3. Every gotcha cites a claim ID that the independent critic checked. A claim the critic left unsupported (ARCH-07) was not used.
4. B keeps the layers apart: `CLAUDE.md` for guidance, rules for scoped guidance, skills for procedures, hooks for guarantees.

Why not A: it has no good place for service traps. Why not C: it goes against the current guidance and puts the whole overview in front of every task.

## Consequences
- Always-on context is 33 lines. The five rule files add 76 lines, loaded only on matching paths.
- Rules go stale as the code changes. Claim IDs make an audit possible, and `/doctor prompt-audit` runs before every measurement.
- Rules are guidance, not enforcement. Anything with zero exceptions becomes a hook in the next step.
- Measured (E8): on the reference task all three setups were correct. B produced a diff ready to commit where A0 did not, at about 35 % more cost; the thick file (C) cost the most and gave the weakest error response. The measurement also found a wrong test command in this file. The sample is small and the task easy: the next comparison uses a task that crosses the documented traps.
