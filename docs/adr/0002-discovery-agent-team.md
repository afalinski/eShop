# ADR-002: Discovery of an unfamiliar system with an agent team

- Status: Accepted
- Date: 2026-11-12

## Context
We need to understand an unfamiliar system (eShop, ~23K lines of C#, ~20 projects) in a fixed time-box (2 days), find weak spots and propose a target architecture.
One agent doing everything is slow, and an agent that wrote a document tends to trust its own conclusions. Exploration is breadth-first and easy to parallelize, and verification works best with a fresh reviewer that has not seen the reasoning. That makes discovery a good fit for a multi-agent setup (most coding tasks are not, and every subagent costs extra tokens).

## Decision

### Team: orchestrator → explorers → architect → critic
- **Orchestrator** (main session, `explore-system` skill): splits the work, launches explorers in parallel, collects file references.
- **explorer**: studies one scope, writes a card with evidence (`path:line`) to a file, returns only the file path and a short summary.
- **architect**: reads the cards (not the whole code), builds the overview, finds weak spots, proposes a target architecture.
- **critic**: fresh context, does not see the architect's reasoning; verifies every claim against the code: confirmed / not confirmed / wrong.

### Work split: hybrid (vertical, then horizontal)
1. Vertical pass — one explorer per bounded context, in parallel:
   catalog · basket · ordering (API + Domain + Infrastructure) · processors (OrderProcessor + PaymentProcessor) · identity · webhooks (Webhooks.API + WebhookClient) · webapp (WebApp + WebAppComponents) · platform (AppHost, ServiceDefaults, EventBus, EventBusRabbitMQ, IntegrationEventLogEF, Shared).
   Out of scope: mobile clients (ClientApp, HybridApp).
2. Horizontal pass — explorers on cross-cutting themes that read the finished cards first and the code only where needed:
   integration events & data consistency · security & identity across services.

### Models per role
| Role | Model | Effort | Reason |
|---|---|---|---|
| explorer | Sonnet 5.5 | medium | Most tokens are spent here (reading code); fact extraction, not deep reasoning |
| architect | Opus 5.5 | high | Highest-value judgment; small input (cards only), so a strong model is cheap |
| critic | Sonnet 5.5 | high | Re-reads code for every claim; high effort to catch subtle errors |

Experiment E3: run the explorer on the same scope (ordering) with Haiku 5.5 and Sonnet 5.5; compare the critic's rejection rate and cost per card. If Haiku holds quality, switch explorers to Haiku (~20× cheaper input).

### Rules
- Every claim has an ID and evidence `path:line`; a claim without evidence counts as unverified.
- Agents exchange files, not retold text (avoids the "game of telephone").
- Agents never modify code. Their `tools:` list has no Edit or Bash, which Claude Code enforces. That they write only under `docs/architecture/` is an instruction, not a guarantee, because `Write` accepts any path; stage 2 adds a `PreToolUse` hook for it.

## Consequences
- Positive: parallel and cheap per scope; hallucinations are measured (critic rejection rate); results become reusable docs.
- Negative: multi-agent runs use many more tokens than one agent; cross-service problems need the second pass.
- Recorded metrics: wall-clock time, tokens and cost per role, number of claims, critic rejection rate.
