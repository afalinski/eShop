---
name: explore-system
description: Run the discovery agent team on this repository — parallel explorers per bounded context, cross-cutting theme pass, architect, critic — and record metrics. Use when asked to explore, map or review the architecture of the system.
model: sonnet
disable-model-invocation: true
---

# Explore the system (ADR-002)

You are the orchestrator. Do not read the code yourself; delegate and pass file paths.

## 1. Prepare
- Record the start time and the current commit SHA (`git rev-parse --short HEAD`).
- Output folders: `docs/architecture/services/`, `docs/architecture/themes/`.

## 2. Vertical pass — launch all explorers in parallel (one message, several `explorer` calls)

| Scope | Folders | Prefix | Output |
|---|---|---|---|
| catalog | `src/Catalog.API` | CAT | `services/catalog.md` |
| basket | `src/Basket.API` | BAS | `services/basket.md` |
| ordering | `src/Ordering.API`, `src/Ordering.Domain`, `src/Ordering.Infrastructure` | ORD | `services/ordering.md` |
| processors | `src/OrderProcessor`, `src/PaymentProcessor` | PRC | `services/processors.md` |
| identity | `src/Identity.API` | IDN | `services/identity.md` |
| webhooks | `src/Webhooks.API`, `src/WebhookClient` | WHK | `services/webhooks.md` |
| webapp | `src/WebApp`, `src/WebAppComponents` | WEB | `services/webapp.md` |
| platform | `src/eShop.AppHost`, `src/eShop.ServiceDefaults`, `src/EventBus`, `src/EventBusRabbitMQ`, `src/IntegrationEventLogEF`, `src/Shared` | PLT | `services/platform.md` |

Out of scope: `src/ClientApp`, `src/HybridApp` (mobile clients).

Each brief contains: scope folders, claim prefix, output path (under `docs/architecture/`), commit SHA, and the instruction to follow `docs/architecture/_card-template.md`.

## 3. Horizontal pass — two explorers in parallel, after step 2

| Theme | Questions | Prefix | Output |
|---|---|---|---|
| events & consistency | Which events connect which services? How is publishing made reliable (outbox, transactions)? What happens on duplicates, failures, out-of-order delivery? Where can data become inconsistent? | EVT | `themes/events-consistency.md` |
| security & identity | How do services authenticate users and each other? Which endpoints are open? How are tokens validated and scopes checked? Where are secrets configured? | SEC | `themes/security-identity.md` |

Each theme brief lists all service cards to read first.

## 4. Architect
One `architect` call with the list of all card files.

## 5. Critic
One `critic` call with all card files and `overview.md`. Do not pass the architect's reply or any reasoning — only file paths.

## 5b. Revision round
Run the `revise-architecture` skill once. It is the only revision round (iteration cap = 1); anything still unsupported after it goes to a human.

## 6. Record
- Append to `docs/metrics.md` (section "Stage 1 — discovery"): wall-clock time, number of claims, critic totals and rejection rate, and token usage per role if available.
- Append an entry to `docs/experiments.md` (hypothesis → what we did → result → conclusion).
- Report to the user: links to `overview.md` and `verification.md`, the top 5 weak spots, the rejection rate.
