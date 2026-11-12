# Security and identity (cross-cutting) — explorer card

- Scope: theme — authentication of users and services, open endpoints, token validation, scope checks, secrets (src/, excluding src/ClientApp and src/HybridApp)
- Claim prefix: SEC
- Verified at commit: d9aa12b

## Responsibility
Identity.API (Duende IdentityServer) issues tokens. Browser apps sign in with OpenID Connect and a cookie session. Backend APIs validate JWT bearer tokens through one shared ServiceDefaults helper. Service-to-service calls do not use their own credentials. The web apps forward the signed-in user's access token. Validation checks signature and issuer but not audience or scope.

## Public interface
- [SEC-01] Users authenticate against Identity.API; the web apps use cookie sessions plus an OpenID Connect challenge, with `code` flow, `SaveTokens=true` and scopes openid, profile, orders, basket — `src/WebApp/Extensions/Extensions.cs:66-87`
- [SEC-02] WebhookClient uses the same pattern with client `webhooksclient`, scopes openid and webhooks — `src/WebhookClient/Extensions/Extensions.cs:37-60`
- [SEC-03] Backend APIs (Basket, Ordering, Webhooks) validate JWT bearer tokens via `AddDefaultAuthentication()`: Authority = `Identity:Url`, issuer list = `[identityUrl]` — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:33-47`, `src/Basket.API/Extensions/Extensions.cs:12`, `src/Ordering.API/Extensions/Extensions.cs:10`, `src/Webhooks.API/Extensions/Extensions.cs:5`
- [SEC-04] Open: Catalog.API has no authentication or authorization code at all (no matches for Authorize, Authenticat or Anonymous in the project) — search over `src/Catalog.API`, e.g. `src/Catalog.API/Apis/CatalogApi.cs`
- [SEC-05] Protected: the whole Ordering group (`api/orders`) and the whole Webhooks group (`/api/webhooks`) call `.RequireAuthorization()`, which is authenticated-user only with no policy — `src/Ordering.API/Program.cs:21-22`, `src/Webhooks.API/Program.cs:20-21`
- [SEC-06] Basket gRPC: the service class has no `[Authorize]` and the mapping adds no `RequireAuthorization`. `GetBasket` is explicitly `[AllowAnonymous]` and returns an empty basket for an anonymous caller. `UpdateBasket` and the other methods throw gRPC `Unauthenticated` when the `sub` claim is missing — `src/Basket.API/Program.cs:12`, `src/Basket.API/Grpc/BasketService.cs:12-19,36-42,61-64,72`
- [SEC-07] Open on Identity.API: AccountController, ExternalController and HomeController are `[AllowAnonymous]`. Consent, Device, Grants and Diagnostics are `[Authorize]` — `src/Identity.API/Quickstart/Account/AccountController.cs:7`, `src/Identity.API/Quickstart/Account/ExternalController.cs:4`, `src/Identity.API/Quickstart/Home/HomeController.cs:7`, `src/Identity.API/Quickstart/Grants/GrantsController.cs:10`
- [SEC-08] Open on WebhookClient: `OPTIONS /check` and `POST /webhook-received` have no authorization. They are guarded only by the shared header `X-eshop-whtoken`, and only if `ValidateToken` is true — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:13-18,31-37`
- [SEC-09] The mobile BFF (YARP) is externally exposed and forwards `/api/catalog/*`, `/api/orders/*` and `/identity/*`. It does no auth itself in the AppHost definition; ordering still validates the bearer token — `src/eShop.AppHost/AppHost.cs:62-64`, `src/eShop.AppHost/Extensions.cs:88-152` (per platform card PLT-02)
- [SEC-10] Health endpoints (`/health`, `/alive`) are mapped by ServiceDefaults only in Development and have no authorization — `src/eShop.ServiceDefaults/Extensions.cs:108-125` (per platform card PLT-01)

## Data
- [SEC-11] User credentials and claims live in PostgreSQL `identitydb`, owned only by Identity.API — `src/eShop.AppHost/AppHost.cs:18,25-27`
- [SEC-12] Webhook subscription tokens are stored in plain text in `WebhookSubscription.Token` (text column) and sent to the subscriber in `X-eshop-whtoken` — `src/Webhooks.API/Model/WebhookSubscription.cs:11`, `src/Webhooks.API/Migrations/20230925222606_Initial.cs:24`, `src/Webhooks.API/Services/WebhooksSender.cs:22-24`
- [SEC-13] Ownership of data is scoped by the `sub` claim: Webhooks queries filter on `UserId`. Ordering `GET /{orderId}` does not filter by user (see ORD-28 in the Ordering card) — `src/Webhooks.API/Apis/WebHooksApi.cs:15-16,25-27,71-72`, `src/Ordering.API/Infrastructure/Services/IdentityService.cs:5-6`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| none | Neither | [SEC-14] Integration events carry no auth context in what was read. RabbitMQ connection strings are plain `amqp://localhost` in appsettings, and AppHost injects the broker via `WithReference(rabbitMq)` — `src/Basket.API/appsettings.json:13-16`, `src/Webhooks.API/appsettings.json:23-25`, `src/eShop.AppHost/AppHost.cs:34` |

## Dependencies
- [SEC-15] Services learn the issuer URL from `Identity__Url` (APIs) or `IdentityUrl` (web apps), both set by the AppHost; `Identity:Audience` comes from each service's appsettings (basket, webhooks) — `src/eShop.AppHost/AppHost.cs:35,46,59,69,79`, `src/Basket.API/appsettings.json:17-19`, `src/Webhooks.API/appsettings.json:29-35`
- [SEC-16] Service-to-service: WebApp's gRPC client to basket and HTTP clients to catalog and ordering add the signed-in user's `access_token` (from the HTTP context) as a Bearer header through `AddAuthToken()`. No client-credentials or other service-level identity is used — `src/WebApp/Extensions/Extensions.cs:31-40`, `src/eShop.ServiceDefaults/HttpClientExtensions.cs:36-49`
- [SEC-17] The WebhookClient attaches the same user token handler when calling Webhooks.API — `src/WebhookClient/Extensions/Extensions.cs:21`
- [SEC-18] Background workers (OrderProcessor, PaymentProcessor) call `AddBasicServiceDefaults` only, with no authentication. They communicate through RabbitMQ and the database — `src/OrderProcessor/Program.cs:3`, `src/eShop.ServiceDefaults/Extensions.cs:18,40`
- [SEC-19] Swagger UI sign-in: OpenAPI config builds an OAuth2 Implicit flow from `Identity:Scopes`, and `OpenApi:Auth:ClientId` (e.g. `webhooksswaggerui`) — `src/eShop.ServiceDefaults/OpenApiOptionsExtensions.cs:170-181`, `src/Webhooks.API/appsettings.json:18-21,32-34`

## Token validation and scopes
- [SEC-20] Validation: signature through Authority discovery, issuer must equal the identity URL, `RequireHttpsMetadata=false`, `ValidateAudience=false` (so the `Audience` setting is not enforced). A DEBUG build also accepts the issuer `https://10.0.2.2:5243` — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:38-49`
- [SEC-21] The `sub` claim is read raw (default inbound mapping removed) in all services and is the user ID — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:31`, `src/eShop.ServiceDefaults/ClaimsPrincipalExtensions.cs:8`, `src/Basket.API/Extensions/ServerCallContextIdentityExtensions.cs:7`, `src/WebApp/Extensions/Extensions.cs:58,115`
- [SEC-22] Scope checks: none found. No policy, `RequireClaim`, or scope-claim check exists in the APIs; `AddAuthorization()` is called with no options. Scopes act only at token issuance time, where IdentityServer limits what a client can request — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:52`, `src/Identity.API/Configuration/Config.cs:59-68,99-108`
- [SEC-23] Token lifetimes: access and identity tokens are 2 hours for maui and webapp; web app cookie session is `SessionCookieLifetimeMinutes` (default 60); Identity cookie is 2 hours — `src/Identity.API/Configuration/Config.cs:73-74,109-110`, `src/WebApp/Extensions/Extensions.cs:62,71`, `src/Identity.API/Program.cs:21`
- [SEC-24] If the `Identity` config section is missing, `AddDefaultAuthentication` returns without registering authentication, silently. A service then fails at `RequireAuthorization` time rather than at startup (inference) — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:22-28`

## Secrets and configuration
- [SEC-25] OIDC client secret `"secret"` is hard-coded on both sides: in the Identity client list (SHA-256 hashed) and in WebApp and WebhookClient source — `src/Identity.API/Configuration/Config.cs:52,82,118`, `src/WebApp/Extensions/Extensions.cs:77-78`, `src/WebhookClient/Extensions/Extensions.cs:53-54`
- [SEC-26] Development DB passwords are in committed `appsettings.Development.json` (`yourWeak(!)Password`) for Identity, Catalog, Ordering, Webhooks and OrderProcessor — `src/Identity.API/appsettings.Development.json:3`, `src/Catalog.API/appsettings.Development.json:3`, `src/Ordering.API/appsettings.Development.json:3`, `src/Webhooks.API/appsettings.Development.json:10`, `src/OrderProcessor/appsettings.Development.json:10`
- [SEC-27] Under the AppHost, connection strings and the identity URL are injected as environment variables by Aspire (`WithReference`, `WithEnvironment`). The AppHost defines no `AddParameter` secret, no Key Vault or other secret store — `src/eShop.AppHost/AppHost.cs:25-79` (no `AddParameter` match in the file)
- [SEC-28] Identity signing key is the developer credential with `tempkey.jwk` (see IDN-25); seeded users share a hard-coded password (see IDN-26) — `src/Identity.API/Program.cs:28-37`, `src/Identity.API/UsersSeed.cs:33,78`
- [SEC-29] The webhook check token for WebhookClient comes from `WebhookClientOptions:Token` and `ValidateToken` configuration — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:13-14`

## Patterns and risks seen in the code
- [SEC-30] Pattern: one shared helper for JWT setup, and the claims reading via `sub` is consistent across services — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:10`
- [SEC-31] Risk: no audience validation and no scope policies means any valid token from the identity server, for any client (for example a Swagger UI token), is accepted by every API — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:49,52`
- [SEC-32] Risk: Catalog.API is fully anonymous, including write endpoints if any exist in `CatalogApi.cs` (not checked method by method) — `src/Catalog.API/Apis/CatalogApi.cs`
- [SEC-33] Risk: `RequireHttpsMetadata=false` on JWT bearer and OIDC clients, so the metadata may be fetched over HTTP — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:39`, `src/WebApp/Extensions/Extensions.cs:82`
- [SEC-34] Risk: the webhook subscriber token is logged in clear at Information level in Webhooks.API and in WebhookClient — `src/Webhooks.API/Services/GrantUrlTesterService.cs:17,25`, `src/WebhookClient/Endpoints/WebhookEndpoints.cs:35`
- [SEC-35] Risk: WebhookClient `/webhook-received` accepts any request when `ValidateToken` is not true, and the comparison uses ordinary string equality — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:18,37`
- [SEC-36] Risk: webhook sending posts to a user-supplied URL (`DestUrl`) after a grant check, an SSRF-shaped surface. The code was not read for URL restrictions — `src/Webhooks.API/Apis/WebHooksApi.cs:41,48`, `src/Webhooks.API/Services/GrantUrlTesterService.cs:15`
- [SEC-37] Risk: card data goes into token claims (see IDN-22, IDN-23), widening the blast radius of any stolen token — `src/Identity.API/Services/ProfileService.cs:70-80`
- [SEC-38] Pattern: Identity.API sets security headers (`X-Frame-Options`, CSP, Referrer-Policy and others) through a filter attribute on the quickstart UI — `src/Identity.API/Quickstart/SecurityHeadersAttribute.cs:15-48`
- [SEC-39] Pattern: the Basket `UserId` comes only from the token, never from the request, so the basket is bound to the caller — `src/Basket.API/Grpc/BasketService.cs:38,49`

## Open questions
- Whether Basket's `Identity:Url` and the JWT middleware actually run for gRPC (no explicit `UseAuthentication` call was found in any API; this relies on the implicit middleware of WebApplication, not confirmed).
- Which Catalog endpoints write data, and whether any gateway protects them in a real deployment.
- Whether `webshoppingagg` and `mobileshoppingagg` scopes (IDN-29) are used anywhere.
- How secrets are provided in the Azure Container Apps deployment; only the AppHost code was read.
- Whether the mobile BFF applies any authentication beyond pass-through.
- Whether URL restrictions exist for webhook destinations (`ValidateWebhookSubscriptionRequest` was not read).
