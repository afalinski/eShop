# Platform (AppHost, ServiceDefaults, EventBus, EventBusRabbitMQ, IntegrationEventLogEF, Shared) — explorer card

- Scope: src/eShop.AppHost, src/eShop.ServiceDefaults, src/EventBus, src/EventBusRabbitMQ, src/IntegrationEventLogEF, src/Shared
- Claim prefix: PLT
- Verified at commit: d9aa12b

## Responsibility
Shared infrastructure rather than a business service. The AppHost (.NET Aspire) composes and wires every service, database, Redis and RabbitMQ. ServiceDefaults gives each service telemetry, health checks, resilience and JWT auth. EventBus, EventBusRabbitMQ and IntegrationEventLogEF provide integration-event publishing and consuming, plus the transactional event log. Shared holds source files linked into several services.

## Public interface
- [PLT-01] No business HTTP/gRPC endpoints. ServiceDefaults maps `/health` and `/alive` only when the environment is Development — `src/eShop.ServiceDefaults/Extensions.cs:108-125`
- [PLT-02] AppHost exposes a YARP "mobile-bff" with external endpoints. It routes `/api/catalog/*` and `/catalog-api/api/catalog/*` (api-version query-matched) to catalog-api, `/api/orders/*` to ordering-api, and `/identity/*` to identity-api — `src/eShop.AppHost/Extensions.cs:88-152`, `src/eShop.AppHost/AppHost.cs:62-64`
- [PLT-03] Library contract: `IEventBus.PublishAsync(IntegrationEvent)`, registered via `AddRabbitMqEventBus(connectionName)` and `AddSubscription<T,TH>()` — `src/EventBusRabbitMQ/RabbitMQEventBus.cs:31`, `src/EventBusRabbitMQ/RabbitMqDependencyInjectionExtensions.cs:17`, `src/EventBus/Extensions/EventBusBuilderExtensions.cs:20`
- [PLT-04] Library contract: `AddDefaultAuthentication()` and `AddAuthToken()` (forwards the caller's access_token as Bearer on outgoing HttpClient calls) — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:10`, `src/eShop.ServiceDefaults/HttpClientExtensions.cs:11-48`

## Data
- [PLT-05] AppHost provisions one Postgres container (image `ankane/pgvector:latest`, persistent lifetime) with databases catalogdb, identitydb, orderingdb, webhooksdb — `src/eShop.AppHost/AppHost.cs:12-20`
- [PLT-06] Redis is provisioned and referenced only by basket-api — `src/eShop.AppHost/AppHost.cs:9,32-36`
- [PLT-07] The integration event log is a per-service table "IntegrationEventLog" (key EventId) with fields EventTypeName, State, TimesSent, CreationTime, Content (JSON) and TransactionId. Each owning service adds it to its own DbContext via `UseIntegrationEventLogs()` — `src/IntegrationEventLogEF/IntegrationLogExtensions.cs:5-13`, `src/IntegrationEventLogEF/IntegrationEventLogEntry.cs:21-33`
- [PLT-08] Shared `AddMigration<TContext>` runs `Database.MigrateAsync()` plus an optional seeder in a hosted service at startup. It is linked by source into Catalog.API, Ordering.API, Identity.API and Webhooks.API — `src/Shared/MigrateDbContextExtensions.cs:14-21,58-66`, `src/Catalog.API/Catalog.API.csproj:11`, `src/Ordering.API/Ordering.API.csproj:11`, `src/Identity.API/Identity.API.csproj:54`, `src/Webhooks.API/Webhooks.API.csproj:9`
- [PLT-09] order-processor shares orderingdb with ordering-api — `src/eShop.AppHost/AppHost.cs:42-51`

## Integration events
No concrete events are defined in this scope. It supplies the mechanism.

| Event | Published / Handled | Evidence |
|---|---|---|
| (any IntegrationEvent subtype) | Published directly to the RabbitMQ exchange `eshop_event_bus` (direct type), routing key = type name, persistent delivery. Services also use the outbox log service. | [PLT-10] `src/EventBusRabbitMQ/RabbitMQEventBus.cs:20,33,47-49,75-77,97-102` |
| (types registered with AddSubscription) | Handled: queue named by `EventBus:SubscriptionClientName`, bound per event name, handlers resolved as keyed transient services by event type | [PLT-11] `src/EventBusRabbitMQ/RabbitMQEventBus.cs:258-285`, `src/EventBus/Extensions/EventBusBuilderExtensions.cs:27-35` |

- [PLT-12] Outbox pattern support: `SaveEventAsync` writes the event row in the caller's DB transaction with state NotPublished. States are NotPublished, InProgress, Published and PublishedFailed. `ResilientTransaction` wraps the work in an EF execution strategy — `src/IntegrationEventLogEF/Services/IntegrationEventLogService.cs:34-70`, `src/IntegrationEventLogEF/Utilities/ResilientTransaction.cs:11-22`
- [PLT-13] The library only stores and marks events. The caller must publish after commit (the pending-events retrieval is keyed by TransactionId). No background relay exists in this scope — `src/IntegrationEventLogEF/Services/IntegrationEventLogService.cs:19-32`

## Dependencies
- [PLT-14] AppHost topology: identity-api, basket-api, catalog-api, ordering-api, order-processor, payment-processor, webhooks-api, webhooksclient, webapp, mobile-bff; RabbitMQ resource "eventbus" with persistent lifetime — `src/eShop.AppHost/AppHost.cs:10-11,25-79`
- [PLT-15] Optional AI back ends: Foundry when `UseFoundry=true` (gpt-4.1-mini chat, text-embedding-3-small); Ollama is wired but hard-coded off — `src/eShop.AppHost/AppHost.cs:82-92`, `src/eShop.AppHost/Extensions.cs:50-86`
- [PLT-16] The AppHost targets an Azure Container Apps environment ("aca") and sets `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` on all projects — `src/eShop.AppHost/AppHost.cs:7`, `src/eShop.AppHost/Extensions.cs:30-38`
- [PLT-17] Identity is consumed through the `Identity` config section (Url, Audience). If the section is absent, authentication is silently not configured — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:22-28`
- [PLT-18] Observability: OpenTelemetry logs, metrics and traces, with an OTLP exporter only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. The standard resilience handler and service discovery are the HttpClient defaults — `src/eShop.ServiceDefaults/Extensions.cs:22-29,50-97`
- [PLT-19] RabbitMQ client is added through `AddRabbitMQClient`. Config section `EventBus` has SubscriptionClientName and RetryCount — `src/EventBusRabbitMQ/RabbitMqDependencyInjectionExtensions.cs:8-31`
- [PLT-20] Trace context is propagated through message headers (OpenTelemetry propagator inject and extract) — `src/EventBusRabbitMQ/RabbitMQEventBus.cs:86,145`

## Patterns and risks seen in the code
- [PLT-21] Risk: consumer errors are swallowed and the message is acked anyway, so failed handling loses the event. The code comment says a dead-letter exchange is needed in a real app — `src/EventBusRabbitMQ/RabbitMQEventBus.cs:170-180`
- [PLT-22] Risk: a message containing "throw-fake-exception" triggers a deliberate exception in the production consumer path — `src/EventBusRabbitMQ/RabbitMQEventBus.cs:163-166`
- [PLT-23] Risk: the connection and consumer are set up on a background task started from StartAsync. Failures are only logged, and if the connection is not open it returns silently, so the host starts without a consumer. `PublishAsync` throws if `_rabbitMQConnection` is null — `src/EventBusRabbitMQ/RabbitMQEventBus.cs:226-290,40`
- [PLT-24] Publish retries only on BrokerUnreachableException and SocketException, with exponential backoff 2^attempt seconds. Handlers for one event run sequentially (a REVIEW comment notes this) — `src/EventBusRabbitMQ/RabbitMQEventBus.cs:302-319,201-207`
- [PLT-25] At-least-once semantics: `TimesSent` is incremented on InProgress and there is no dedup in this library, so handlers must be idempotent (inference from the code) — `src/IntegrationEventLogEF/Services/IntegrationEventLogService.cs:66-67`
- [PLT-26] Risk: event-log type resolution scans the entry assembly for type names ending in "IntegrationEvent" and matches by short name. Namespace collisions or a type name not ending in that suffix yield null — `src/IntegrationEventLogEF/Services/IntegrationEventLogService.cs:13-16,28`
- [PLT-27] Risk: JWT validation sets `RequireHttpsMetadata=false` and `ValidateAudience=false`. A DEBUG build also accepts the issuer `https://10.0.2.2:5243` — `src/eShop.ServiceDefaults/AuthenticationExtensions.cs:39-49`
- [PLT-28] The Postgres image uses the floating tag `latest` (`ankane/pgvector`) — `src/eShop.AppHost/AppHost.cs:13-14`
- [PLT-29] The cyclic Identity-to-apps client URL wiring is done through environment variables — `src/eShop.AppHost/AppHost.cs:98-103`
- [PLT-30] Shared code is reused by source-file linking (`Compile Include`), not a package. Each service gets its own copy at compile time — `src/EventBusRabbitMQ/EventBusRabbitMQ.csproj:11`, `src/Catalog.API/Catalog.API.csproj:10-11`
- [PLT-31] Health endpoints are mapped only in Development, so the AppHost health check on identity-api and ordering-api (`/health`) depends on that environment — `src/eShop.ServiceDefaults/Extensions.cs:115-118`, `src/eShop.AppHost/AppHost.cs:28,45`

## Open questions
- Which services actually call `SaveEventAsync` and publish after commit (the outbox flow end to end)? This was not checked in this scope.
- Is there a background retry for events stuck in NotPublished or InProgress? None is seen here.
- The AppHost does not reference postgres for basket-api or payment-processor. Whether they use a database is not confirmed.
