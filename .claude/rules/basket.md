---
paths:
  - "src/Basket.API/**"
  - "tests/Basket.*/**"
---
# Basket rules

- The service is gRPC only, with no REST endpoints (BAS-03). The user is the `sub` claim, and no request message carries a user ID (BAS-02, BAS-05).
- `GetBasket` is `[AllowAnonymous]` and returns an empty basket without a user. `UpdateBasket` and `DeleteBasket` check the user ID by hand and throw `Unauthenticated`. The class has no `[Authorize]`, so every new RPC must do its own check (BAS-06, BAS-07, BAS-26).
- Baskets live in Redis under `/basket/{userId}` with no expiry, and an update is a blind overwrite with no concurrency check (BAS-08, BAS-10, BAS-22).
- Basket only consumes events and publishes none (BAS-14).
- `OrderStartedIntegrationEvent` is declared again in Basket and in Ordering. The contract is not shared, so a change needs both sides (BAS-15).
- Never renumber existing fields in `basket.proto`. The numbers are already non-sequential (BAS-25).
