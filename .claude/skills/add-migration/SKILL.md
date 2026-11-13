---
name: add-migration
description: Add an EF Core migration after changing an entity or DbContext in eShop (Ordering, Catalog, Webhooks, Identity), or check whether the model and its migrations have drifted apart. Use when asked to add, change or remove a column, table, index or entity mapping, or to create or check a migration.
---

# Add an EF Core migration

Keep to these steps for the whole task. Judge a migration by its `Up()` and `Down()`, never by the snapshot diff (step 4).

## 1. The tool
- Check `dotnet ef --version`. It is not part of the repository. If it is missing, ask the user before installing anything; install the version that `Directory.Packages.props` sets for `Microsoft.EntityFrameworkCore.Tools` (`dotnet tool install dotnet-ef --version <that version>`, global or `--tool-path`).

## 2. Project pairs
No context has a design-time factory, so always pass both projects. No database or connection string is needed to add or check a migration.

| Context | `--project` | `--startup-project` | Migrations folder |
|---|---|---|---|
| `OrderingContext` | `src/Ordering.Infrastructure` | `src/Ordering.API` | `src/Ordering.Infrastructure/Migrations` |
| `CatalogContext` | `src/Catalog.API` | `src/Catalog.API` | `src/Catalog.API/Infrastructure/Migrations` |
| `WebhooksContext` | `src/Webhooks.API` | `src/Webhooks.API` | `src/Webhooks.API/Migrations` |
| `ApplicationDbContext` (Identity) | `src/Identity.API` | `src/Identity.API` | `src/Identity.API/Data/Migrations` |

New files land next to the existing snapshot, so `--output-dir` is not needed.

## 3. Before and after
- Before the change: `dotnet ef migrations has-pending-model-changes --project <p> --startup-project <s>` must report no changes. If it does, stop and tell the user: the model has already drifted.
- Make the entity or mapping change, then: `dotnet ef migrations add <PascalCaseName> --project <p> --startup-project <s>`.
- After adding, the same check must report no changes again.

## 4. Read what was generated
- Read `Up()` and `Down()`. They must contain your change and nothing else, and `Down()` must undo it.
- The first new migration in a context rewrites the snapshot even when nothing changed in the schema: `ProductVersion` moves from an 8.0 value to the current EF Core version, a byte order mark can go, and EF 10 lays parts of the Ordering snapshot out differently. That churn is expected; commit the snapshot as generated, and do not hand-edit it.
- A data-losing operation (drop column, drop table, type change that narrows) needs the user's explicit approval before you continue.

## 5. How it gets applied
- Every service applies pending migrations at startup through a hosted service (`AddMigration<...>` in `src/Shared/MigrateDbContextExtensions.cs`). Do not run `dotnet ef database update`: the next start of the service applies it.
- Prove it with the service's functional tests (`tests/<Service>.FunctionalTests`, Docker required). They start the service on a fresh database, so the migration runs there. Identity has no functional test project: say that the migration is not proven by a test.

## 6. Done when
- `has-pending-model-changes` reports no changes, `Up()`/`Down()` contain only your change, and the functional tests of that service pass.
- You commit the migration, its `.Designer.cs` and the snapshot together, staged by name.
