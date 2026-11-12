# Metrics

Baseline measured before any AI tooling was added. Every later stage appends a column or a section.

## Stage 0 — baseline (2026-11-12, commit 913acea)

| Metric | Value |
|---|---|
| Projects (.csproj) | 28 |
| C# in `src` | 498 files, ~22.7K lines (+40 Razor files) |
| C# in `tests` | 49 files, ~3.6K lines |
| Automated tests | 125 (unit + functional), all passing |
| E2E (Playwright) scenarios | 3 (browse, cart, checkout) |
| Build, incremental | ~11 s |
| Full test run | ~2 min (functional tests use Docker containers) |
| Code coverage | not measured yet |
| Manual task time (one small task, no AI) | **~2–2.5 h — expert estimate, not measured** (see below) |

### Reference task: price-range filter in Catalog.API (`minPrice` / `maxPrice` + functional test)

Estimate for an experienced .NET developer seeing this repo for the first time, working at a calm pace:

| Step | Time |
|---|---|
| Orientation: find the endpoint (`GetAllItems` v2 in `CatalogApi.cs`), filtering pattern, test fixture | 30–40 min |
| Implementation: query parameters, filter, validation (`minPrice <= maxPrice`, non-negative) | 30 min |
| Functional test (Testcontainers fixture, ~2 min per run, 2–3 runs) | 40 min |
| Update checked-in OpenAPI docs (`Catalog.API_v2.json`), self-review, PR description | 20–30 min |
| **Total** | **~2–2.5 h** |

Caveat: an estimate is weaker evidence than a measurement. When comparing agent runs against it, say so explicitly.

## Metric definitions (reference approach)

Based on DORA (current set of five software delivery metrics) plus AI-specific metrics.
Principle: metrics are collected **automatically from systems** (CI/CD, Git, issue tracker), never from manual reports; failure is **defined before** measuring; we look at **trends**, not single numbers.

### Throughput
| Metric | Definition | Source |
|---|---|---|
| Change lead time | First commit → change running in production | Git + deployment events |
| Deployment frequency | Production deployments per day/week | CI/CD |
| Failed deployment recovery time (former MTTR) | Failed deployment detected → service restored | Incident/alert tool + CI/CD |

### Instability
| Metric | Definition | Source |
|---|---|---|
| Change failure rate | Deployments that needed immediate intervention (rollback, hotfix, feature flag turned off, incident) ÷ all deployments | Deployment events linked to incidents/hotfixes by version / commit SHA |
| Deployment rework rate | Unplanned deployments made to fix a user-facing bug ÷ all deployments | CI/CD + issue type |

Context (DORA 2025, State of AI-assisted Software Development): AI adoption is now **positively** related to throughput but **still negatively** related to stability. AI is an **amplifier** of the existing system — this is why stability metrics and cohort comparison are mandatory.

### AI-specific (aligned with Anthropic's Claude Code analytics)
| Metric | Definition | Source |
|---|---|---|
| PRs with Claude Code (%) | Merged PRs containing at least one line written with Claude Code ÷ all merged PRs | PR label `claude-code-assisted` (same label Anthropic's contribution metrics use) |
| PRs per engineer per day | Merged PRs ÷ active engineers — the headline measure Anthropic reported internally | GitHub |
| Cohort comparison | All DORA metrics split into `claude-code-assisted` vs. other PRs, within the same task type | GitHub labels + deployment/incident data |
| Suggestion accept rate | Accepted Edit/Write decisions ÷ all decisions | Claude Code OpenTelemetry: `claude_code.code_edit_tool.decision` |
| Cost and tokens | USD and tokens per session / per merged PR | OTel: `claude_code.cost.usage`, `claude_code.token.usage` |
| Active time | Human keyboard time + agent processing time | OTel: `claude_code.active_time.total` |
| Autonomy | Tool calls per human turn — how long the agent works without a person | OTel events (`tool_result`, `user_prompt`) |
| Human review time | Time a human spends reviewing / correcting an agent PR | PR review events |
| Agent iterations | Review ↔ implement loops before the PR was ready | Pipeline logs |

Rules:
- Activity metrics (lines of code, commits, PR count) are **proxies, not productivity** — always read them together with DORA stability metrics.
- **Triangulate**: system data + a short developer survey (perceived productivity, review burden, trust). Anthropic's own study combined a survey, interviews and transcript analysis; self-reported +50% matched a measured +67% merged PRs per engineer.
- Telemetry is opt-in (`CLAUDE_CODE_ENABLE_TELEMETRY=1`, OTLP exporter); prompts and code are redacted by default.

### Conditions that make AI pay off (DORA AI Capabilities Model, 2025)
Clear AI stance · healthy data ecosystem · AI access to internal data/docs · strong version control · small batches · user-centric focus · quality internal platform.

In this demo repo, `main` + the local Kubernetes deployment play the role of production.

## Stage 1 — discovery (2026-11-12, commit d9aa12b)

Run of `/explore-system` (ADR-002): 8 service explorers in parallel → 2 theme explorers in parallel → architect → critic.

| Metric | Value |
|---|---|
| Wall-clock time | 10:45:40Z → 11:01:59Z (~17 min), orchestrator start to critic finish |
| Claims written | 356 checked: 254 in service cards, 99 in theme cards (EVT 60, SEC 39), 3 new architect claims (ARCH) |
| Critic: confirmed | 347 |
| Critic: not confirmed | 3 (WHK-37, IDN-21, WEB-28) |
| Critic: wrong | 6 (ORD-05, EVT-38, EVT-59, WHK-29, SEC-18, IDN-22) |
| Rejection rate | 9 / 356 = **2.5 %** |
| Overview target steps with flawed reasoning (not counted in the rate) | 3 major (steps 2b, 3, 10), plus 3 smaller ones |

Per-claim rejection rate measures card accuracy only. The architect's serious errors were wrong inferences from true claims. The claim count does not capture them, so track them separately.

### Tokens and time per role (subagent totals as reported by the harness)

| Role | Calls | Tokens | Tool uses | Duration (longest call) |
|---|---|---|---|---|
| Explorer — services (sonnet) | 8 | 241,023 | 162 | 49 s |
| Explorer — themes (sonnet) | 2 | 131,143 | 66 | 103 s |
| Architect (opus) | 1 | 89,844 | 14 | 289 s |
| Critic (sonnet) | 1 | 266,280 | 160 | 486 s |
| **Total subagents** | 12 | **728,290** | 402 | — |

Orchestrator tokens: not available from inside the session. The critic is the most expensive role (37 % of tokens) and the critical path (~8 of ~17 min).

### Revision round (one round, `/revise-architecture`)

| Metric | Before | After |
|---|---|---|
| Plan soundness (target steps with no open critic finding ÷ all steps) | 3 / 13 = **23 %** | 10 / 13 = **77 %** |
| Revision-log items re-checked | — | 30: 27 fixed, 1 still unsupported, 2 new problems |
| New problems found in touched text | — | 1 (N1: BFF catalog routes forward any HTTP method) |

Open after the round (iteration cap reached → human decision): step 2 (route method restriction), step 6 (duplicate `PaymentFailed` is not idempotent), step 10 (logging claim depends on the logging provider; `PaymentMethod` requires a CVV).
Tokens for this round were not captured.

## Stage 2 — harness (2026-11-12, in progress)

| Metric | Value |
|---|---|
| Always-on instructions (`CLAUDE.md`) | 32 lines |
| Path-scoped rules (`.claude/rules/`, five files) | 76 lines, loaded only on matching paths |
| Stop-hook build, changed code, cold | 10–13 s |
| Stop-hook build, unchanged code | 0 s (cached) |
| Hook logic tests | 5 tests, all passing |
| Reference task in three setups (A0, B, C) | not measured yet |
