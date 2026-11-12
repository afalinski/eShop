---
paths:
  - "src/Webhooks.API/**"
  - "src/WebhookClient/**"
  - "tests/Webhooks.*/**"
---
# Webhooks rules

- Webhooks.API only subscribes to events and publishes none (WHK-18). OrderShipped and OrderPaid subscriptions get hooks. The price-change type can be subscribed to, but its handler does nothing (WHK-32).
- Every query on subscriptions must filter by `UserId`. Isolation between users is done in the endpoints, not in the database (WHK-34). Dispatch reads by event type across all users (WHK-13).
- Delivery: `SendAll` uses `Task.WhenAll` and never checks status codes, so one failing receiver faults the event handler (ARCH-10). The standard resilience handler from ServiceDefaults does apply. There is no outbox or delivery log, so delivery is not durable (WHK-30).
- The API makes server-side requests to user-supplied URLs, with no host or IP allow or deny list (WHK-27). Do not add outbound calls to user-controlled hosts without a restriction.
- The grant handshake accepts any URL that answers OPTIONS with 2xx when the subscriber gave no token (ARCH-10, WHK-26). Authenticity is a static token header, not an HMAC signature (WHK-31).
- Do not log subscriber tokens. The current code does, at Information level (WHK-28).
- WebhookClient is a sample app. It hard-codes the OIDC secret `"secret"` and turns off HTTPS metadata checks (WHK-35). Do not copy that into other code.
