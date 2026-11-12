# Identity — explorer card

- Scope: src/Identity.API
- Claim prefix: IDN
- Verified at commit: d9aa12b

## Responsibility
Identity.API is the OpenID Connect / OAuth2 token server for eShop. It runs Duende IdentityServer on top of ASP.NET Core Identity, stores users in PostgreSQL, serves the login, logout, consent and grants UI, and issues tokens for the web app, MAUI app, webhooks client and Swagger UIs. It also holds each user's profile, address and payment card data and puts that data into token claims.

## Public interface
- [IDN-01] IdentityServer protocol endpoints (authorize, token, discovery and so on) are provided by `app.UseIdentityServer()`. No hand-written controllers for them exist in the project — `src/Identity.API/Program.cs:52`
- [IDN-02] MVC UI uses the default route `{controller=Home}/{action=Index}/{id?}` — `src/Identity.API/Program.cs:55`
- [IDN-03] AccountController (`[AllowAnonymous]`) serves GET/POST Login, GET/POST Logout and GET AccessDenied; POSTs use anti-forgery validation — `src/Identity.API/Quickstart/Account/AccountController.cs:7,39,59,146,165,196`
- [IDN-04] ExternalController (`[AllowAnonymous]`) serves two GET actions for external-provider challenge and callback — `src/Identity.API/Quickstart/Account/ExternalController.cs:4,33,63`
- [IDN-05] Consent, Device, Grants and Diagnostics controllers are `[Authorize]`d — `src/Identity.API/Quickstart/Consent/ConsentController.cs:10`, `src/Identity.API/Quickstart/Device/DeviceController.cs:6`, `src/Identity.API/Quickstart/Grants/GrantsController.cs:10`, `src/Identity.API/Quickstart/Diagnostics/DiagnosticsController.cs:8`
- [IDN-06] Health and other default endpoints are mapped through ServiceDefaults; the AppHost uses `/health` as the health check — `src/Identity.API/Program.cs:45`, `src/eShop.AppHost/AppHost.cs:28`
- [IDN-07] The mobile BFF (YARP) proxies `/identity/{*any}` to Identity.API, stripping the `/identity` prefix — `src/eShop.AppHost/Extensions.cs:150-151`
- [IDN-08] Registered API resources and scopes are `orders`, `basket` and `webhooks`; identity resources are `openid` and `profile` — `src/Identity.API/Configuration/Config.cs:10-12,22-24,34-35`
- [IDN-09] Six clients are defined in code: `maui` (code + PKCE), `webapp` and `webhooksclient` (code), and the Implicit-flow `basketswaggerui`, `orderingswaggerui` and `webhooksswaggerui` — `src/Identity.API/Configuration/Config.cs:46,78,114,146,161,176`

## Data
- [IDN-10] Storage is PostgreSQL, database `identitydb`, registered with `AddNpgsqlDbContext<ApplicationDbContext>("identitydb")` — `src/Identity.API/Program.cs:7`, `src/eShop.AppHost/AppHost.cs:18`
- [IDN-11] `ApplicationDbContext` is a plain `IdentityDbContext<ApplicationUser>` with no custom entities. It has one EF migration, `InitialMigration` — `src/Identity.API/Data/ApplicationDbContext.cs:8`, `src/Identity.API/Data/Migrations/20230925223402_InitialMigration.cs`
- [IDN-12] `ApplicationUser` extends `IdentityUser` with required card fields (CardNumber, SecurityNumber, Expiration, CardHolderName, CardType), address fields and Name/LastName — `src/Identity.API/Models/ApplicationUser.cs:4-29`
- [IDN-13] The IdentityServer configuration (clients, resources, scopes) is in memory and built from code and configuration. It is not stored in the DB — `src/Identity.API/Program.cs:31-34`
- [IDN-14] Only the identity-api project references `identitydb` in the AppHost; no other service is wired to it there — `src/eShop.AppHost/AppHost.cs:25-27`
- [IDN-15] Migrations run automatically at startup and seed two users, `alice` and `bob` — `src/Identity.API/Program.cs:12`, `src/Identity.API/UsersSeed.cs:8,53`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| none | Neither | [IDN-16] The project references no event bus or RabbitMQ package and AppHost gives it no RabbitMQ reference — `src/Identity.API/Identity.API.csproj:8-21`, `src/eShop.AppHost/AppHost.cs:25-28` |

## Dependencies
- [IDN-17] PostgreSQL (`identitydb`) through Aspire Npgsql EF Core — `src/Identity.API/Identity.API.csproj:19`, `src/Identity.API/Program.cs:7`
- [IDN-18] eShop.ServiceDefaults (`AddServiceDefaults`, `MapDefaultEndpoints`) and shared source files `MigrateDbContextExtensions.cs` and `ActivityExtensions.cs` — `src/Identity.API/Identity.API.csproj:45,54-55`, `src/Identity.API/Program.cs:3`
- [IDN-19] No outbound service calls were found. Consumers (basket, ordering, webhooks, webhooksclient and webapp) get the identity URL through `Identity__Url` or `IdentityUrl` — `src/eShop.AppHost/AppHost.cs:35,46,59,69,79`
- [IDN-20] Client redirect URIs come from environment variables set by the AppHost: BasketApiClient, OrderingApiClient, WebhooksApiClient, WebhooksWebClient and WebAppClient. `MauiCallback` comes from appsettings — `src/eShop.AppHost/AppHost.cs:99-103`, `src/Identity.API/appsettings.json:8`
- [IDN-21] Duende IdentityServer packages (a commercial licence product) — `src/Identity.API/Identity.API.csproj:9-12`

## Patterns and risks seen in the code
- [IDN-22] Pattern: `ProfileService` copies user data into issued claims, including `card_number`, `card_security_number`, `card_holder` and `card_expiration`, plus the address. Other services read this payment data from the token — `src/Identity.API/Services/ProfileService.cs:70-80`
- [IDN-23] Risk: card number, CVV and expiration are stored on the user record as plain properties and are emitted as claims. `AlwaysIncludeUserClaimsInIdToken` is true for the maui, webapp and webhooksclient clients, so they land in the ID token — `src/Identity.API/Models/ApplicationUser.cs:6-12`, `src/Identity.API/Configuration/Config.cs:72,89,125`
- [IDN-24] Risk: the client secret `"secret"` is hard-coded for maui, webapp and webhooksclient — `src/Identity.API/Configuration/Config.cs:52,82,118`
- [IDN-25] Risk: the signing key is a developer credential (`AddDeveloperSigningCredential`), automatic key management is disabled, and `tempkey.jwk` is copied to the output. The code carries a "TODO: Remove in production" comment — `src/Identity.API/Program.cs:28-29,36-37`, `src/Identity.API/Identity.API.csproj:50`
- [IDN-26] Risk: seeded users `alice` and `bob` share the hard-coded password `Pass123$`, and seeding runs on every startup — `src/Identity.API/UsersSeed.cs:33,78`
- [IDN-27] Risk: migrations are applied at startup. The code comment itself says this is not recommended for production — `src/Identity.API/Program.cs:9-12`
- [IDN-28] Risk: `webapp` has `RequirePkce = false`, and the Swagger UI clients use the Implicit flow with access tokens via the browser — `src/Identity.API/Configuration/Config.cs:90,148-149`
- [IDN-29] Risk: `maui` is allowed the scope `mobileshoppingagg` and `webapp` is allowed `webshoppingagg`. Neither is registered in `GetApiScopes`, which lists only orders, basket and webhooks — `src/Identity.API/Configuration/Config.cs:66,106,22-24`
- [IDN-30] Pattern: `RedirectService` extracts `redirect_uri` from a return URL with regex splitting and manual `%3A`/`%2F` replacement — `src/Identity.API/Services/RedirectService.cs:5-27`
- [IDN-31] Pattern: UI code is the IdentityServer quickstart sample (Apache-licensed header), and the project keeps duplicate view-model classes under both `Models/` and `Quickstart/` — `src/Identity.API/Quickstart/Account/AccountOptions.cs:1-4`, `src/Identity.API/Models/AccountViewModels/LoginViewModel.cs`, `src/Identity.API/Quickstart/Account/LoginViewModel.cs`
- [IDN-32] Pattern: `IsActiveAsync` rejects a token when the security stamp does not match, and treats the user as inactive during lockout — `src/Identity.API/Services/ProfileService.cs:37-51`

## Open questions
- Whether the seeded users and the dev signing key are replaced in a real deployment; only the development setup was seen.
- Which services actually read the `card_*` claims. Only the producing side was read.
- Whether `mobileshoppingagg` and `webshoppingagg` scopes are enforced anywhere. No definition was found in this project.
- `appsettings.json` has `TokenLifetimeMinutes` and `PermanentTokenLifetimeDays`; no reader of them was found in this project.
