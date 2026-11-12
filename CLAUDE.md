# eShop

.NET 10 / Aspire reference app: microservices, RabbitMQ event bus, PostgreSQL, Redis. Mobile clients (`src/ClientApp`, `src/HybridApp`) are out of scope and not in `eShop.Web.slnf`.

# Commands
- Build: `dotnet build eShop.Web.slnf` (incremental ~11 s)
- All tests: `dotnet test --solution eShop.Web.slnf` (~2 min; `*.FunctionalTests` need Docker running)
- One unit test (MSTest, no Docker): `dotnet test --project tests/Basket.UnitTests --filter "Name~GetBasketReturnsEmptyForNoUser"`
- One functional test (xUnit v3, Docker): `dotnet test --project tests/Catalog.FunctionalTests --filter-method "*GetCatalogItemRejectsInvalidId*"`
- Format check for one file: `dotnet format eShop.Web.slnf --verify-no-changes --include <file>`. The baseline already has hundreds of violations (215 on 2026-11-12), so never run `dotnet format` over the whole solution and never commit unrelated reformatting.
- Run the app: `aspire run` (needs Docker). E2E: `npm run test:e2e`
- The test runner is Microsoft.Testing.Platform, and the filter option depends on the framework: MSTest unit projects take `--filter`, xUnit v3 functional projects take `--filter-method` or `--filter-class`. The wrong one prints "Unknown option" or "Zero tests ran".

# Where the map is
Verified architecture notes with `path:line` evidence: `docs/architecture/overview.md` (claim IDs like `ARCH-06`, checked by `docs/architecture/verification.md`). Read the part you need, not the whole file. If the code contradicts a note, trust the code and say so.

# Gotchas (code that misleads)
- Catalog.API has no authentication, and `AddDefaultAuthentication()` silently registers nothing when the `Identity` config section is missing. Adding `RequireAuthorization()` to Catalog does nothing until `Identity:Url` and `Identity:Audience` are configured (ARCH-04).
- The mobile BFF route `/api/catalog/{*any}` has no HTTP method restriction, so writes reach Catalog through it (ARCH-01).
- `POST /api/orders` returns 200 even when the command failed. Do not use the status code to judge success (ARCH-06).
- `IdentifiedCommandHandler` swallows every exception, so a failed command still stores its request ID (ARCH-05).
- The Paid and StockConfirmed handlers in Ordering wait 10 s (`Task.Delay`) on purpose. Tests that wait for an order status need the delay (ARCH-02).
- The outbox primary key is the event ID, and one outbox row with an unknown event type fails the whole pending batch (ARCH-11, ARCH-12).
- `src/Identity.API/tempkey.jwk` is a developer signing key. Do not copy this pattern (ARCH-09).
- Building Catalog.API regenerates `src/Catalog.API/Catalog.API.json` and `Catalog.API_v2.json` (OpenAPI). With no API change only line endings differ, yet git lists them as modified: restore them. After an endpoint change their content changes and they belong in the commit. Stage files by name, never `git add -A`.

# Rules
- Match the existing code style (`.editorconfig`) in the lines you write; leave existing lines alone.
- Prove a change with a test run, not by reading the diff. Say which command you ran.
- Integration events from Ordering and Catalog go through the outbox (`IntegrationEventLogEF`), never straight to the bus.
- Stay inside the task: no drive-by refactors, no dependency upgrades.

<!-- Maintainer notes (stripped from context): keep this file under ~60 lines. Service-specific rules live in .claude/rules/ with `paths:`. Procedures live in .claude/skills/. Rules with no exceptions are hooks, not lines here. -->
