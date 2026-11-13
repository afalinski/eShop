# ADR-006: Layers against prompt injection

- Status: Accepted
- Date: 2026-11-13

## Context
An agent reads text that someone else wrote: seed data, issues, web pages, documents a customer uploads. That text can contain instructions. If the agent follows them, it acts with the developer's rights. Anthropic's guidance (re-read 2026-11-13: security, permissions and sandboxing pages): the model's own judgement and the auto mode classifier help, but the controls that hold are permissions and OS isolation. A deny rule matches the command as written, so it misses a program called inside `sh -c` and a script that opens a file or a socket itself. Only the sandbox enforces at the OS level, and it runs on macOS, Linux and WSL2, not on native Windows.

The threat this repo cares about: an injected instruction that makes the agent send a secret (`.env`, a certificate) out over the network, or rewrite shared history.

## Decision
Four layers, each with the gap it leaves:

| Layer | What it stops | Gap |
|---|---|---|
| Model and auto mode classifier | Most obvious injections (E9: the model reported the planted text and ran nothing) | Probabilistic, not a control |
| `permissions.deny` in `.claude/settings.json`: Read/Edit of `.env`, `.env.local`, `*.pfx`; `curl`, `wget`, `Invoke-WebRequest`, `Invoke-RestMethod`, `Start-BitsTransfer` | Built-in file tools, `cat`/`head`/`sed`/redirections on secret files, the network tools by name or path | A command inside `bash -c` (E9), a script that opens files or sockets itself |
| `guard.mjs` PreToolUse hook on Bash and PowerShell | Any command whose text names a secret file or a network tool, including inside `bash -c`; force push; destructive SQL | A script that reaches the network without naming a tool (`node -e "fetch(...)"`) |
| OS sandbox (`sandbox.enabled`, `network.allowedDomains`) | Every process and child process, by host and path | Not available on native Windows, so not enabled here |

The repository keeps layers 2 and 3. For a team, sessions that read untrusted input run where the sandbox works (WSL2 or a dev container) with a network allowlist (NuGet, GitHub, the container registry), and the deny rules move to managed settings so a project file cannot remove them.

## Consequences
- The network tools are blocked for every agent session in this repo, including `localhost`. Nothing in `CLAUDE.md` or the skills uses them; a task that needs one asks the user.
- On this Windows machine one gap stays open: a script can still reach the network. Closing it needs the sandbox, not another regex.
- The demo's checks are in `docs/experiments.md` (E9) and `.claude/hooks/hooks.test.mjs`.
