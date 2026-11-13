---
name: add-endpoint
description: Add or change an HTTP endpoint (Catalog, Ordering, Webhooks minimal APIs) or a gRPC method (Basket) in eShop, with its functional test and the regenerated OpenAPI document. Use when asked to add, extend or change an API endpoint, route, query parameter or RPC.
---

# Add or change an endpoint

Keep to these steps for the whole task. The service's `.claude/rules/<service>.md` loads when you open its files; follow it too.

## 1. Where the endpoint goes
- **Catalog** (`src/Catalog.API/Apis/CatalogApi.cs`): three groups on `api/catalog` from `NewVersionedApi("Catalog")`: `v1`, `v2` and `api` (both versions). Put new behaviour on `v2` unless the task names a version. Changing a v1 route changes a published contract, so ask first.
- **Ordering** (`src/Ordering.API/Apis/OrdersApi.cs`): group `api/orders`, v1, and the whole group requires authorization. A command endpoint takes the `x-requestid` header and wraps the command in `IdentifiedCommand<,>`, like `cancel` and `ship`.
- **Webhooks** (`src/Webhooks.API/Apis/WebHooksApi.cs`): group `api/webhooks`, v1, requires authorization. Every query filters by the caller's `UserId`.
- **Basket** is gRPC only: add the RPC to `Proto/basket.proto` without renumbering existing fields, implement it in `Grpc/BasketService.cs`, and check the user ID by hand like `UpdateBasket` does.

## 2. Conventions seen in this code
- Chain `.WithName(...)`, `.WithSummary(...)`, `.WithDescription(...)`, `.WithTags(...)` on every route. Names are unique; a v2 variant of an existing name gets the suffix `-V2` (`ListItems-V2`).
- Return the real outcome. Do not copy `POST /api/orders`, which returns 200 even when the command failed.

## 3. OpenAPI documents (Catalog only)
Building Catalog.API regenerates `src/Catalog.API/Catalog.API.json` and `Catalog.API_v2.json`. They are tracked in git and are the published contract.
- Check with `git diff --ignore-cr-at-eol --stat -- src/Catalog.API/*.json`.
- If the content changed because of your endpoint, commit both files with the code.
- If only line endings changed, restore them with `git checkout -- src/Catalog.API/Catalog.API.json src/Catalog.API/Catalog.API_v2.json`.

## 4. Test
- Add a functional test in `tests/<Service>.FunctionalTests/` next to the existing ones. They use xUnit v3 and a fixture (`CatalogApiFixture`, `OrderingApiFixture`) that starts containers, so Docker must run.
- Versioned calls use `new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(2.0))` with the fixture's `CreateDefaultClient`, as `CatalogApiTests.CreateHttpClient` does. Ordering tests authenticate through `AutoAuthorizeMiddleware`.
- Run only your test first: `dotnet test --project tests/Catalog.FunctionalTests --filter-method "*<YourTestName>*"` (xUnit v3 takes `--filter-method`, not `--filter`), then the whole project.

## 5. Done when
- The new test passes, and the existing tests in that project still pass.
- For Catalog, the OpenAPI files are committed if their content changed.
- You stage files by name and say which test command you ran.
