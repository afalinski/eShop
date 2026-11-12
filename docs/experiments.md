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
