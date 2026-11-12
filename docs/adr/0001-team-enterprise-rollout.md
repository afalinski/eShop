# ADR-001: Design the AI workflow as a Claude Code Team/Enterprise rollout

- Status: Accepted
- Date: 2026-11-12

## Context
The goal is not "one developer using an AI assistant", but a team of engineers working together with agents.
Individual setups (personal settings, personal MCP, personal prompts) do not scale: every engineer gets a different agent, there is no shared policy, no cost control, and no way to measure impact.
Claude Code Team/Enterprise provides organization-level tools for exactly this.

## Decision
Every part of the workflow is designed from the team/organization point of view and mapped to the Team/Enterprise toolset:

| Need | Tool |
|---|---|
| Same rules and guardrails for everyone (permissions, deny list, hooks, allowed MCP servers) | Managed settings (server-managed or file-based), managed MCP |
| Share agents, skills, hooks and commands across teams | Internal plugin marketplace + org plugin allowlist |
| Shared, versioned project context | `CLAUDE.md` / `.claude/` / `.mcp.json` committed to the repo |
| Agent pipeline in CI (issue → PR, @claude) | Claude Code GitHub Actions |
| Automated PR review | Claude Code Code Review (+ `REVIEW.md`) |
| Measure adoption and impact | Analytics dashboard + contribution metrics (`claude-code-assisted` PR label) + OpenTelemetry |
| Cost control | Spend limits, cost/token telemetry |
| Safety | Permission modes, sandboxed Bash, least-privilege tokens |
| Adoption in people's heads | Champion kit, communications kit |

## Consequences
- Positive: one standard for all engineers; impact is measurable from day one; rollout is repeatable for any team.
- Negative: some features need a paid Team/Enterprise plan (contribution metrics, Code Review, server-managed settings).
- In this demo, plan-only features are **emulated** with equivalents that work on any plan, and each emulation is marked:
  - file-based managed settings instead of server-managed settings;
  - the agent pipeline sets the `claude-code-assisted` label instead of contribution metrics;
  - a review agent in GitHub Actions instead of managed Code Review;
  - OpenTelemetry → local Grafana/Aspire dashboard instead of the analytics dashboard.
