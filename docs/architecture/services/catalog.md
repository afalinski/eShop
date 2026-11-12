# Catalog.API — explorer card

- Scope: src/Catalog.API
- Claim prefix: CAT
- Verified at commit: d9aa12b

## Responsibility
Owns the product catalog: items, brands and types, item pictures, and per-item stock levels. It serves catalog browsing, filtering, facet counts and optional AI semantic search, and it reacts to order events to confirm or reject stock and to decrement stock after payment.

## Public interface
- [CAT-01] Versioned minimal API group `api/catalog`, versions 1.0 and 2.0 — `src/Catalog.API/Apis/CatalogApi.cs:16-19`
- [CAT-02] GET `/items` (v1: paged; v2: adds `name`, repeated `type`, repeated `brand` filters), GET `/items/by` (batch by ids), GET `/items/{id:int}`, GET `/items/by/{name}` (v1), GET `/items/{id}/pic`, GET `/items/facets` — `src/Catalog.API/Apis/CatalogApi.cs:22-57`
- [CAT-03] Semantic search: GET `/items/withsemanticrelevance/{text}` (v1) and `/items/withsemanticrelevance?text=` (v2) — `src/Catalog.API/Apis/CatalogApi.cs:60-71`
- [CAT-04] GET `/items/type/{typeId}/brand/{brandId?}`, `/items/type/all/brand/{brandId?}`, `/catalogtypes`, `/catalogbrands` — `src/Catalog.API/Apis/CatalogApi.cs:74-97`
- [CAT-05] Write endpoints: PUT `/items` (v1, id in body), PUT `/items/{id}` (v2), POST `/items`, DELETE `/items/{id}` — `src/Catalog.API/Apis/CatalogApi.cs:100-117`
- [CAT-06] Program registers API versioning with `ReportApiVersions`, ProblemDetails, OpenAPI, default endpoints; no `UseAuthentication`/`UseAuthorization` and no `RequireAuthorization` seen — `src/Catalog.API/Program.cs:10-29`
- [CAT-07] The gateway (YARP in AppHost) forwards `/catalog-api/api/catalog/...` routes to the catalog cluster, stripping the prefix — `src/eShop.AppHost/Extensions.cs:97-139`

## Data
- [CAT-08] PostgreSQL database `catalogdb` via Npgsql EF Core, with pgvector (`UseVector`) — `src/Catalog.API/Extensions/Extensions.cs:15-21`
- [CAT-09] `CatalogContext` holds `CatalogItems`, `CatalogBrands`, `CatalogTypes`, enables the `vector` extension, and adds the integration event log (outbox) table — `src/Catalog.API/Infrastructure/CatalogContext.cs:14-26`
- [CAT-10] `CatalogItem` fields: Name, Description, Price, PictureFileName, brand/type FKs, AvailableStock, RestockThreshold, MaxStockThreshold, OnReorder, and optional `Embedding` (JSON-ignored) — `src/Catalog.API/Model/CatalogItem.cs:9-45`
- [CAT-11] Stock rules live in the entity: `RemoveStock` throws `CatalogDomainException` if stock is 0 or the quantity is <= 0, and otherwise removes at most what is available — `src/Catalog.API/Model/CatalogItem.cs:62-79`
- [CAT-12] EF migrations run at startup and seed from `Setup/catalog.json` when the table is empty; seed uses stock 100 / max 200 / restock 10 — `src/Catalog.API/Extensions/Extensions.cs:23-24`, `src/Catalog.API/Infrastructure/CatalogContextSeed.cs:23-59`
- [CAT-13] Pictures are read from a physical `Pics` folder in the content root through a keyed `IFileProvider` ("pics") — `src/Catalog.API/Program.cs:7-9`
- [CAT-14] Other services' use of `catalogdb`: the AppHost wires the database to the catalog-api project at `src/eShop.AppHost/AppHost.cs:17,38`. No other project referencing `catalogdb` was found in the grep over `src/` (cs/csproj files). The WebApp reaches the catalog over HTTP only — `src/WebApp/Extensions/Extensions.cs:34`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| ProductPriceChangedIntegrationEvent | Published (on price change in update) | [CAT-15] `src/Catalog.API/Apis/CatalogApi.cs:394-405` |
| OrderStockConfirmedIntegrationEvent | Published (all items have stock) | [CAT-16] `src/Catalog.API/IntegrationEvents/EventHandling/OrderStatusChangedToAwaitingValidationIntegrationEventHandler.cs:27-32` |
| OrderStockRejectedIntegrationEvent | Published (some item lacks stock) | [CAT-16] same lines |
| OrderStatusChangedToAwaitingValidationIntegrationEvent | Handled | [CAT-17] `src/Catalog.API/Extensions/Extensions.cs:32` |
| OrderStatusChangedToPaidIntegrationEvent | Handled (decrements stock) | [CAT-18] `src/Catalog.API/IntegrationEvents/EventHandling/OrderStatusChangedToPaidIntegrationEventHandler.cs:13-20` |

- [CAT-19] Publishing uses an outbox: `SaveEventAndCatalogContextChangesAsync` saves catalog changes and the event log row in one resilient local transaction; `PublishThroughEventBusAsync` then marks in-progress, publishes, marks published, and on exception marks failed — `src/Catalog.API/IntegrationEvents/CatalogIntegrationEventService.cs:11-40`
- [CAT-20] Event bus is RabbitMQ (`eventbus`) with the two subscriptions above — `src/Catalog.API/Extensions/Extensions.cs:31-33`

## Dependencies
- [CAT-21] PostgreSQL (`catalogdb`) with pgvector — `src/Catalog.API/Extensions/Extensions.cs:15-21`
- [CAT-22] RabbitMQ event bus (`eventbus`) — `src/Catalog.API/Extensions/Extensions.cs:31`
- [CAT-23] Optional embedding provider: Ollama (`embedding`) if `OllamaEnabled` is true, else OpenAI-style client from connection string `textEmbeddingModel`, else none — `src/Catalog.API/Extensions/Extensions.cs:38-47`
- [CAT-24] Embeddings are truncated to 384 dimensions; text embedded is `"{Name} {Description}"` — `src/Catalog.API/Services/CatalogAI.cs:9,41,62,75`
- [CAT-25] Configuration section `CatalogOptions` (used for `UseCustomizationData` in seeding) — `src/Catalog.API/Extensions/Extensions.cs:35-36`, `src/Catalog.API/Infrastructure/CatalogContextSeed.cs:15`
- [CAT-26] Build-time OpenAPI generation path skips the real DB and migrations — `src/Catalog.API/Extensions/Extensions.cs:9-13`

## Patterns and risks seen in the code
- [CAT-27] Write endpoints (POST, PUT, DELETE) have no authorization attribute or policy visible in this project — `src/Catalog.API/Apis/CatalogApi.cs:100-117`, `src/Catalog.API/Program.cs:20-29`
- [CAT-28] Outbox is only half-reliable: publish failure is caught and marked failed, with no retry/background dispatcher visible in this project; a lost publish after commit is not re-sent here — `src/Catalog.API/IntegrationEvents/CatalogIntegrationEventService.cs:21-25`
- [CAT-29] Stock confirmation handler reads stock but does not reserve it; the decrement happens only on the Paid event ("we're not blocking stock"), so concurrent orders can both be confirmed — `src/Catalog.API/IntegrationEvents/EventHandling/OrderStatusChangedToAwaitingValidationIntegrationEventHandler.cs:17-20`, `src/Catalog.API/IntegrationEvents/EventHandling/OrderStatusChangedToPaidIntegrationEventHandler.cs:12`
- [CAT-30] Paid handler calls `RemoveStock`, which throws when stock is 0, so the handler can fail for the whole order and nothing is saved — `src/Catalog.API/IntegrationEvents/EventHandling/OrderStatusChangedToPaidIntegrationEventHandler.cs:17`, `src/Catalog.API/Model/CatalogItem.cs:64-67`
- [CAT-31] In the awaiting-validation handler, items not found in the catalog are silently skipped, so an order with unknown products can be confirmed — `src/Catalog.API/IntegrationEvents/EventHandling/OrderStatusChangedToAwaitingValidationIntegrationEventHandler.cs:17-25`
- [CAT-32] Price-change event is computed by `priceEntry.IsModified`, but `SetValues` from the request body is used; `NewPrice` comes from the request, `OldPrice` from the tracked original — `src/Catalog.API/Apis/CatalogApi.cs:389-399`
- [CAT-33] Migrations and seeding run on startup, flagged by the code itself as dev-only ("REVIEW") — `src/Catalog.API/Extensions/Extensions.cs:23-24`
- [CAT-34] Semantic search computes `totalItems` over all items, including those without an embedding, so pagination totals can overstate results — `src/Catalog.API/Apis/CatalogApi.cs:308-309,315-317`
- [CAT-35] Search falls back to name prefix search when AI is disabled or the embedding is null — `src/Catalog.API/Apis/CatalogApi.cs:294-305`
- [CAT-36] Name filter uses `StartsWith`, not contains — `src/Catalog.API/Apis/CatalogApi.cs:145`
- [CAT-37] `CreateItem` copies `product.Id` from the request body into the new entity — `src/Catalog.API/Apis/CatalogApi.cs:421`
- [CAT-38] Facets endpoint runs two GroupBy queries computing counts in the database, not client-side — `src/Catalog.API/Apis/CatalogApi.cs:180-204`
- [CAT-39] `DeleteItemById` uses synchronous `SingleOrDefault` before the async save — `src/Catalog.API/Apis/CatalogApi.cs:443`

## Open questions
- Whether authentication/authorization is applied by a gateway or by `AddServiceDefaults` (not read) for the write endpoints.
- Whether Ordering or another service reads `catalogdb` directly (grep over cs/csproj found none; other file types not checked).
- Whether the IntegrationEventLog has any retry/republish worker elsewhere in the repo.
- Exact semantics of the CatalogItem entity configuration (indexes, vector column) — configuration files were not read.
