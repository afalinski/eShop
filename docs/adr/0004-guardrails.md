# ADR-004: Guardrails: deny rules, scoped hooks and a build check on Stop

- Status: Accepted
- Date: 2026-11-12

## Context
`CLAUDE.md` and rules are guidance: Claude usually follows them, but may decide not to. Some rules must hold every time. Anthropic's guidance (re-read 2026-11-12) puts those in deterministic controls that Claude Code applies itself: deny rules, hooks and managed settings. It also warns to keep that set small, because every hook and deny rule sometimes fires when it should not, and someone has to maintain each one.

ADR-002 left one debt: it says agents write only under `docs/architecture/`, but the `Write` tool accepts any path, so that was a request, not a guarantee.

## Decision
Four controls, each with the simplest mechanism that can do the job.

| Rule | Mechanism | Why this one |
|---|---|---|
| Never read or edit `.env`, `.env.local`, `*.pfx` | `permissions.deny` in `.claude/settings.json` | A path rule needs no code |
| No force push, no destructive SQL, no database drop | `PreToolUse` hook, `guard.mjs`, matcher `Bash\|PowerShell` | Needs regex over the command text |
| Discovery agents write only under `docs/architecture/` | `PreToolUse` hook, `docs-only.mjs`, in each agent's frontmatter | Scoped to those agents, so it does not limit anyone else |
| The solution must build before a turn ends | `Stop` hook, `stop-build.mjs` | See below |

**Build on Stop, not after every edit.** The incremental build takes 10 to 13 s here (baseline: about 11 s). After every `Edit` an agent making ten edits would wait two minutes, and would be told about errors in half-finished code. On Stop the check runs once on the finished result. It runs only when C# or project files changed, and a build that already passed for the same file contents is skipped. A failed build exits with code 2, so the errors go back to Claude and it keeps working. Claude Code stops blocking after eight stops in a row.

Auto-format is not a guardrail here: the code base already has 215 format violations (E4).

## Consequences
- The guard scripts fail closed: any internal error exits with 2 and blocks the call. `onFailure: "block"` would do this in configuration, but it needs Claude Code 2.1.295 or later, and the command-line version first used here was 2.1.273 (the VS Code extension bundles 2.1.322). Failing closed in code works on every version, so the configuration field is not relied on.
- **Frontmatter hooks of project agents do not run until the folder is trusted** in an interactive session. Without that, Claude Code skips them silently (E5). One-time action per developer, and what worked here was the Claude Code dialog in a terminal: agreeing to trust in another VS Code window did not set the flag. After accepting it, the real `explorer` file blocks a write outside `docs/architecture/` and allows one inside (E5). For a team rollout, rules that must always hold go in settings-level or managed hooks.
- Hooks run with the developer's full permissions and need Node, which the repository already requires for the e2e tests.
- What is verified through a real session: the guard hook, the `.env` deny rule, the Stop hook's logic and the agent hook on the real agent files. Not verified: reading `.env` through a shell command rather than the Read tool.
- The hook logic has tests: `node --test .claude/hooks/hooks.test.mjs`. They prove the logic, not that Claude Code calls the hook.
