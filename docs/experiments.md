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

## E2. Discovery agent team — first run (2026-11-12, commit d9aa12b)
- Hypothesis (ADR-002): a team of cheap parallel explorers, one strong architect and an independent critic can map an unfamiliar system in under 30 min, with under 10 % of claims rejected by the critic.
- What I did: ran `/explore-system`. 8 service explorers ran in parallel, then 2 theme explorers (events and consistency, security and identity). Then the architect (opus) wrote `docs/architecture/overview.md`. Then the critic (sonnet) checked every claim against the code and wrote `docs/architecture/verification.md`. The critic got only file paths, not the architect's reasoning.
- Result: ~17 min wall-clock and 728K subagent tokens. 356 claims; 347 confirmed, 3 not confirmed, 6 wrong, so the rejection rate is 2.5 %. The critic also found 3 major flaws in the architect's target plan:
  - Step 3 misdiagnoses the checkout failure: the request ID survives because `IdentifiedCommandHandler` swallows the exception, and `POST /` always returns 200.
  - Step 2b would silently do nothing: Catalog has no `Identity` config, so `AddDefaultAuthentication()` registers nothing.
  - Step 10 says the readers of the card claims are unknown and misses card data being logged: MAUI reads the claims, and Ordering logs the CVV.
- Conclusion: the hypothesis holds for card accuracy. But a low claim rejection rate does not mean the recommendations are sound: the architect's errors were wrong inferences from true facts. The critic is therefore essential, and it is also the slowest and most expensive role.
- Next step: give the overview a second pass that fixes steps 2b, 3 and 10 from `verification.md`. Add a "plan soundness" metric next to the claim rejection rate. Consider splitting the critic into parallel slices to shorten the critical path.

## E2b. One revision round (2026-11-12)
- Hypothesis: one architect → critic round fixes most unsupported conclusions without a second round.
- What I did: `/revise-architecture`. The architect fixed the overview and wrote a revision log (30 rows, none disputed). The critic re-checked only the log rows and the text they touched.
- Result: plan soundness 23 % → 77 %. 27 of 30 rows fixed; 3 new problems found, 1 of them in text the first critic pass had confirmed.
- Lesson: the verifier is fallible too. Round 2 showed that round 1 overstated the CVV logging issue: with the default logger, `{@Command}` prints the type name; only the `CreateOrderRequest` record logged on the all-zero request-ID branch writes card number and CVV in clear.
- Conclusion: one round gives most of the value; the rest goes to a human. Iteration cap stays at 1.

## E4. Is the repo safe to auto-format? (2026-11-12)
- Hypothesis: a `PostToolUse` hook that runs `dotnet format` after every edit is safe, because the code base is format-clean.
- What I did: `dotnet format eShop.Web.slnf --verify-no-changes` on the unmodified tree, then again with `--include` on single files.
- Result: 215 violations already exist; the visible ones in the sample are import-order errors in test files. `--include` limits the check to one file, but even `src/Ordering.API/Apis/OrdersApi.cs` has 2 old violations.
- Conclusion: the hypothesis is wrong. An auto-format hook would add unrelated changes to every file the agent touches and inflate every PR. The hook is dropped. `CLAUDE.md` tells agents to match the style only in the lines they write and to check one file with `--verify-no-changes --include`.
- Also found while checking the commands for `CLAUDE.md`: with Microsoft.Testing.Platform the filter option depends on the test framework. The MSTest unit projects take `--filter "Name~<test>"` and reject `--filter-method` ("Unknown option"). The xUnit v3 functional projects take `--filter-method "*<test>*"` and silently run nothing with `--filter` ("Zero tests ran"). The first check covered only an MSTest project; the A0/B/C measurement (E8) exposed the xUnit half. Without this line an agent loses runs guessing.

## E5. Do the guard hooks really run? (2026-11-12)
- Hypothesis: if the hook scripts pass their tests, the guardrails work.
- What I did: table tests of `guard.mjs` and `docs-only.mjs` (24 cases, now `hooks.test.mjs`); the Stop hook against a real build (broken file, valid file, repeat); then end-to-end through headless `claude -p`: the guard hook on `echo "DROP TABLE demo"`, the deny rule on a `.env` file, and the `explorer` agent writing outside `docs/architecture/`.
- Result: the guard hook, the deny rule and the Stop hook worked. The agent hook did not: `explorer` wrote a file outside `docs/architecture/`. The first attempt was misleading, because the agent refused both writes by itself, from its own prompt, and never reached the hook. With a proper brief it wrote the file. The debug log said: `Skipping frontmatter hooks for main-thread agent 'explorer': the folder its definition file came from is not trusted`. Settings-level hooks ran in the same headless mode. Through `--agents` (no trust step) the same script blocked the write outside and allowed the write inside.
- Conclusion: tests of a script prove its logic, not that Claude Code calls it. A model that refuses is not a hook that blocks. Wiring has to be tested through the real harness, with a task where the model has no reason to refuse. For a team rollout, frontmatter hooks of project agents are not a safe place for must-hold rules: use settings-level or managed hooks.
- Closed (same day): agreeing to trust in another VS Code window did not set `hasTrustDialogAccepted` for the folder, so the first re-run still failed. After the Claude Code dialog was accepted in a terminal, the real `explorer` file blocked the write outside `docs/architecture/` (hook finished with exit 2 in 69 ms, no "not trusted" line in the log) and allowed the write inside.

## E6. Do the task skills trigger when they should? (2026-11-13)
- Hypothesis: descriptions that lead with the task make the skills trigger on natural requests and stay quiet on unrelated ones.
- What I did: `claude plugin validate .claude/skills` (passed). Then three headless prompts with Sonnet, asking for a plan only, and recorded the `Skill` tool calls from the `stream-json` output rather than asking the model which skill it would use.
- Result: 4 of 4. "Add a GET endpoint to the Catalog API ..." invoked `add-endpoint`. "When a catalog item goes out of stock, Ordering should be told about it ..." invoked `add-integration-event`, although the prompt never says "event". "Orders need a nullable delivery note column ..." invoked `add-migration`, although the prompt never says "migration". "Explain how the Basket service stores a user's basket" invoked none.
- Conclusion: triggering works on this small sample (one run per prompt). It says nothing yet about whether the skills improve the result; that is the with/without comparison.
- Also found while writing them: a `CLAUDE.md` line said the regenerated OpenAPI files differ only in line endings. After an endpoint change their content changes, so an agent following that line could have thrown away the new contract. The line was corrected.

## E7. Does the migration recipe work as written? (2026-11-13)
- Hypothesis: `dotnet ef migrations add` works with the API project as startup project, without a design-time factory or a database.
- What I did: installed dotnet-ef 10.0.12 (the EF Core version of the repository) into a temporary tool path, outside the repository. Ran `migrations has-pending-model-changes` for all four contexts, then added an empty probe migration to Ordering and Catalog, read what it produced, and removed it.
- Result: the check needs no database or connection string, and all four contexts report no pending changes. New files land next to the existing snapshot, also in Catalog's non-default `Infrastructure/Migrations` folder. The probe's `Up()` was empty, yet both snapshots changed: `ProductVersion` moved from an 8.0 value to 10.0.12, a byte order mark went, and EF 10 laid out parts of the Ordering snapshot differently.
- Conclusion: the recipe holds. The snapshot churn would make an agent, or a reviewer, think the schema changed, so the skill says to judge a migration by `Up()`/`Down()` and the drift check, not by the snapshot diff.

## E8. Does the configuration make the agent better? A0 / B / C (2026-11-13)
- Hypothesis: on the reference task (price-range filter in Catalog v2 + functional test), the short `CLAUDE.md` with rules and skills (B) gives a better result than no configuration (A0) and a cheaper one than one thick `CLAUDE.md` (C).
- Setup: each run in its own fresh clone (not a git worktree: in a worktree Claude Code also loaded the skills and agents of the main checkout, so A0 would not have been clean). Headless `claude -p`, model Sonnet, `--setting-sources project,local` so that the operator's own plugins did not leak in, the same prompt, runs one after another. A0 = upstream commit `913acea`; B = this branch; C = this branch with rules and task skills removed and one 663-line `CLAUDE.md` (B's file + all rules + the architecture overview). Pass criteria and a hidden acceptance test were written before the first run. `/doctor prompt-audit` ran first: one finding in the project (hard-coded tool version in `add-migration`), fixed.
- Result: every valid run passed every criterion, including the hidden test (6/6). Differences were in cost and in how ready the change was to commit (table in `metrics.md`).
  - The measurement found a bug in our own configuration: `CLAUDE.md` and `add-endpoint` gave `--filter "Name~..."`, which runs nothing in the xUnit v3 functional projects. B and C spent 6 and 8 commands on it. After the fix (E4 corrected), B cost $0.24–0.26 instead of $0.41.
  - With the fix, B still cost about 35 % more than A0 ($0.25 vs $0.19 on average) and took longer (151–188 s vs 104–141 s): it loads the skill, runs the format check and cleans the OpenAPI files.
  - What B and C did that A0 did not, in every run: restore the v1 OpenAPI file, whose only change was line endings. A0 left it in the diff both times. That is the `CLAUDE.md` gotcha working.
  - C was the most expensive run ($0.49) and the only one that returned a plain string as the 400 body. Its 663 lines cost about 26K extra input tokens on every request.
  - Two runs were discarded for environment reasons, not agent reasons: the system drive filled up (bench clones moved to another drive), and a test host failed to start. They were re-run.
- Conclusion: on a local task that the code already explains well, configuration does not change correctness. It made the result cleaner to commit and cost more. The thick file is worse than the short one on both counts. A wrong command in `CLAUDE.md` is more expensive than no command at all. The next comparison needs a task that crosses the traps the configuration encodes (outbox, Ordering's 200 on failure, event names between services), and more than 1–2 runs per setup.
