# Webhooks — explorer card

- Scope: src/Webhooks.API, src/WebhookClient
- Claim prefix: WHK
- Verified at commit: d9aa12b

## Responsibility
Webhooks.API lets authenticated users register HTTP callback subscriptions for three event types (price change, order shipped, order paid). It consumes integration events from RabbitMQ and POSTs them to the registered URLs. WebhookClient is a Blazor Server sample app that registers hooks through the API and receives and displays callbacks.

## Public interface
- [WHK-01] Webhooks.API group `/api/webhooks`, API version 1.0, whole group `.RequireAuthorization()` — `src/Webhooks.API/Apis/WebHooksApi.cs:11`, `src/Webhooks.API/Program.cs:20-21`
- [WHK-02] `GET /api/webhooks/` lists the caller's subscriptions, filtered by UserId — `src/Webhooks.API/Apis/WebHooksApi.cs:13-18`
- [WHK-03] `GET /api/webhooks/{id:int}` returns 200 or 404, scoped to the caller's UserId — `src/Webhooks.API/Apis/WebHooksApi.cs:20-33`
- [WHK-04] `POST /api/webhooks/` returns 201 or 400. It first runs the grant-URL check, then stores the subscription — `src/Webhooks.API/Apis/WebHooksApi.cs:35-63`
- [WHK-05] `POST` is guarded by an endpoint filter that validates the request: GrantUrl and Url must be well-formed absolute URIs, and Event must parse as a WebhookType — `src/Webhooks.API/Extensions/RouteHandlerBuilderExtensions.cs:5-24`, `src/Webhooks.API/Model/WebhookSubscriptionRequest.cs:10-27`
- [WHK-06] `DELETE /api/webhooks/{id:int}` returns 202 or 404, scoped to the caller's UserId — `src/Webhooks.API/Apis/WebHooksApi.cs:66-82`
- [WHK-07] WebhookClient exposes `OPTIONS /check` (grant handshake). It echoes the `X-eshop-whtoken` header and returns 400 if token validation is on and the token mismatches — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:16-29`
- [WHK-08] WebhookClient exposes `POST /webhook-received`. It validates the token header when `ValidateToken` is set, stores the hook in memory and returns 200 or 400 — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:31-53`
- [WHK-09] Webhook payload sent to subscribers is `WebhookData {When, Payload (JSON string), Type}`, with header `X-eshop-whtoken` when a token is set — `src/Webhooks.API/Model/WebhookData.cs:5-16`, `src/Webhooks.API/Services/WebhooksSender.cs:22-25`
- [WHK-10] Webhook types are CatalogItemPriceChange=1, OrderShipped=2 and OrderPaid=3 — `src/Webhooks.API/Model/WebhookType.cs:3-8`

## Data
- [WHK-11] PostgreSQL via `AddNpgsqlDbContext<WebhooksContext>("webhooksdb")`, with migrations applied at startup by `AddMigration` — `src/Webhooks.API/Extensions/Extensions.cs:10-12`
- [WHK-12] The only entity is `WebhookSubscription` (Id, Type, Date, DestUrl, Token, UserId), with indexes on UserId and Type — `src/Webhooks.API/Model/WebhookSubscription.cs:5-13`, `src/Webhooks.API/Infrastructure/WebhooksContext.cs:10-18`
- [WHK-13] Subscriptions are read for dispatch by event type, across all users — `src/Webhooks.API/Services/WebhooksRetriever.cs:5-8`
- [WHK-14] WebhookClient keeps received hooks only in an in-memory singleton queue, with no persistence — `src/WebhookClient/Services/HooksRepository.cs:5-12`, `src/WebhookClient/Extensions/Extensions.cs:16`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| ProductPriceChangedIntegrationEvent | Handled (handler is a no-op) | [WHK-15] `src/Webhooks.API/IntegrationEvents/ProductPriceChangedIntegrationEventHandler.cs:5-8` |
| OrderStatusChangedToShippedIntegrationEvent | Handled (sends OrderShipped hooks) | [WHK-16] `src/Webhooks.API/IntegrationEvents/OrderStatusChangedToShippedIntegrationEventHandler.cs:8-17` |
| OrderStatusChangedToPaidIntegrationEvent | Handled (sends OrderPaid hooks) | [WHK-17] `src/Webhooks.API/IntegrationEvents/OrderStatusChangedToPaidIntegrationEventHandler.cs:8-17` |

- [WHK-18] The service only subscribes and publishes nothing. Subscriptions are registered via `AddRabbitMqEventBus("eventbus").AddEventBusSubscriptions()`, and the subscription client name is "Webhooks" — `src/Webhooks.API/Extensions/Extensions.cs:7-8,19-24`, `src/Webhooks.API/appsettings.json:26-28`

## Dependencies
- [WHK-19] RabbitMQ (connection name `eventbus`) — `src/Webhooks.API/Extensions/Extensions.cs:7`
- [WHK-20] PostgreSQL (`webhooksdb`) — `src/Webhooks.API/Extensions/Extensions.cs:10`
- [WHK-21] Identity service for JWT authentication (`AddDefaultAuthentication`). Config: Identity Url, Audience "webhooks", scope "webhooks" — `src/Webhooks.API/Extensions/Extensions.cs:5`, `src/Webhooks.API/appsettings.json:29-35`
- [WHK-22] Outbound HTTP to arbitrary subscriber URLs via the default `IHttpClientFactory` client — `src/Webhooks.API/Services/WebhooksSender.cs:7`, `src/Webhooks.API/Services/GrantUrlTesterService.cs:13`
- [WHK-23] WebhookClient calls Webhooks.API at `http://webhooks-api` with API version 1.0 and a forwarded auth token — `src/WebhookClient/Extensions/Extensions.cs:19-21`
- [WHK-24] WebhookClient authenticates with Identity through OpenID Connect (code flow, cookie session, scopes openid and webhooks), using config `IdentityUrl` and `CallBackUrl` — `src/WebhookClient/Extensions/Extensions.cs:29-61`
- [WHK-25] WebhookClient reads `ValidateToken` and `WebhookClientOptions:Token` from configuration — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:13-14`, `src/WebhookClient/appsettings.json:9-11`

## Patterns and risks seen in the code
- [WHK-26] Grant handshake: at registration the API sends OPTIONS to GrantUrl with the token header and requires a 2xx response that echoes the same token. The GrantUrl must share scheme, host and port with the hook URL — `src/Webhooks.API/Services/GrantUrlTesterService.cs:5-27,37-45`
- [WHK-27] Risk (SSRF): the API makes server-side requests to user-supplied URLs (OPTIONS at registration, POST at dispatch). The code has no host or IP allow or deny list, so internal addresses are not blocked — `src/Webhooks.API/Services/GrantUrlTesterService.cs:13-21`, `src/Webhooks.API/Services/WebhooksSender.cs:15-32`
- [WHK-28] Risk (secret logging): the subscriber token is logged at Information level — `src/Webhooks.API/Services/GrantUrlTesterService.cs:17`. WebhookClient also logs its own expected token — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:35`
- [WHK-29] Risk (delivery): `SendAll` fires all POSTs with `Task.WhenAll`. It does no retries, does not check response status codes, and has no per-call timeout. One failing receiver throws and faults the event handler (an exception from `Task.WhenAll`) — `src/Webhooks.API/Services/WebhooksSender.cs:5-11,32`
- [WHK-30] Delivery is not durable. There is no outbox or delivery log, so hooks are sent only while the event is being handled — `src/Webhooks.API/IntegrationEvents/OrderStatusChangedToShippedIntegrationEventHandler.cs:8-17`
- [WHK-31] Risk (unsigned payloads): authenticity relies on a static shared token header, not on a signature (HMAC) — `src/Webhooks.API/Services/WebhooksSender.cs:22-25`
- [WHK-32] Price-change webhook type can be subscribed to (CatalogItemPriceChange) but its handler does nothing, so such subscribers never receive hooks — `src/Webhooks.API/IntegrationEvents/ProductPriceChangedIntegrationEventHandler.cs:5-8`, `src/Webhooks.API/Model/WebhookType.cs:5`
- [WHK-33] Copy-paste defects in the Paid handler: it injects `ILogger<OrderStatusChangedToShippedIntegrationEventHandler>` and logs "Received OrderStatusChangedToShippedIntegrationEvent" — `src/Webhooks.API/IntegrationEvents/OrderStatusChangedToPaidIntegrationEventHandler.cs:6,12`
- [WHK-34] Per-user data isolation is enforced in the HTTP endpoints by filtering on `UserId` — `src/Webhooks.API/Apis/WebHooksApi.cs:16,27,72`
- [WHK-35] WebhookClient hardcodes the OIDC client secret `"secret"` and sets `RequireHttpsMetadata = false` — `src/WebhookClient/Extensions/Extensions.cs:53-54,58`
- [WHK-36] WebhookClient has a committed default token in appsettings, and token validation is off unless `ValidateToken` is true — `src/WebhookClient/appsettings.json:9-11`, `src/WebhookClient/Endpoints/WebhookEndpoints.cs:13,18,37`
- [WHK-37] The `/check` endpoint declares a non-nullable `[FromHeader]` string. A missing header is probably rejected by the framework before the handler runs — `src/WebhookClient/Endpoints/WebhookEndpoints.cs:16`
- [WHK-38] `Enum.Parse` in POST is called after validation, which already uses `TryParse`. Note that numeric strings such as "99" also parse as valid enum values — `src/Webhooks.API/Apis/WebHooksApi.cs:50`, `src/Webhooks.API/Model/WebhookSubscriptionRequest.cs:22`

## Open questions
- Where the three consumed events are published (Catalog and Ordering presumably) is not verified in this scope.
- How `AddDefaultAuthentication`, `AddRabbitMqEventBus` and `AddMigration` behave (retry, inbox or dedup) lives in shared projects and was not read.
- Whether `UseCustomizationData` in appsettings.json is used by Webhooks.API was not checked.
- The `webhooks-api` and `webhooksdb` resource wiring (AppHost) was not read.
