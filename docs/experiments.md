# Experiment log

One entry per experiment, failures included.

Format: **Hypothesis → What I did → Result (numbers) → Conclusion / next step**

---

## E0. Environment setup (2026-11-12)
- Hypothesis: the reference app builds and tests pass on a fresh Windows machine.
- What I did: installed .NET 10 SDK, started Docker, built `eShop.Web.slnf`, ran all tests.
- Result: first build failed — Aspire CLI bundle download hit the 120 s timeout; installed it manually (`dnx aspire.cli setup`), after that build OK, 125/125 tests green.
- Conclusion: setup has a hidden network dependency; worth documenting for agents in CLAUDE.md.

## E1. GitHub MCP server (2026-11-12)
- Hypothesis: agents need GitHub access (issues, PRs, CI) to run the delivery pipeline.
- What I did: added the remote GitHub MCP server in `.mcp.json` (project scope, shared with the team). Token comes from the `GITHUB_PAT` environment variable — never stored in the repo.
- Least privilege: only 4 toolsets enabled (repos, issues, pull_requests, actions); fine-grained PAT limited to this one repository.
- Result: TODO after first use.
