---
paths:
  - "src/Catalog.API/**"
  - "tests/Catalog.*/**"
---
# Catalog rules

- Catalog.API has no authentication, and `AddDefaultAuthentication()` registers nothing without an `Identity` config section (ARCH-04). The write endpoints (POST, PUT, DELETE) are anonymous (CAT-27) and also reachable through the mobile BFF (ARCH-01).
- The API group `api/catalog` has versions 1.0 and 2.0. v2 adds the `name`, `type` and `brand` filters on `GET /items`; v1 is paged only (CAT-02).
- Publish integration events through the outbox: `SaveEventAndCatalogContextChangesAsync` saves the data and the event row in one transaction, then `PublishThroughEventBusAsync` publishes. A failed publish is marked failed and nothing here resends it (CAT-19, CAT-28).
- Stock is not reserved. The AwaitingValidation handler only reads stock, and the decrement happens on the Paid event, so two concurrent orders can both be confirmed (CAT-29). Items missing from the catalog are skipped, so an order with unknown products can be confirmed (CAT-31). `RemoveStock` throws at zero stock, which fails the whole Paid handler (CAT-30, CAT-11).
- The name filter uses `StartsWith`, not contains (CAT-36).
- Semantic search is optional. Without an embedding provider it falls back to name prefix search (CAT-35). Embeddings are cut to 384 dimensions (CAT-24).
- Functional tests start containers, so Docker must be running.
- Migrations and seeding run at startup, and the code marks them dev-only (CAT-33).
