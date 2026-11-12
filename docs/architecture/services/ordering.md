# Ordering — explorer card

- Scope: src/Ordering.API, src/Ordering.Domain, src/Ordering.Infrastructure
- Claim prefix: ORD
- Verified at commit: d9aa12b

## Responsibility
Owns the order lifecycle: creating orders from a basket checkout, tracking status (Submitted, AwaitingValidation, StockConfirmed, Paid, Shipped, Cancelled) and exposing order queries to clients. It acts as a participant in an event-driven order saga, reacting to grace-period, stock and payment events from other services and emitting status-change events. Domain model follows DDD (Order and Buyer aggregates) with MediatR commands and domain events.

## Public interface
- [ORD-01] All routes sit under `api/orders`, API version 1.0, and the whole group requires authorization — `src/Ordering.API/Apis/OrdersApi.cs:9`, `src/Ordering.API/Program.cs:21-22`
- [ORD-02] `PUT /cancel` and `PUT /ship` take an `x-requestid` GUID header and a command body; an empty GUID returns 400; a false command result returns 500 — `src/Ordering.API/Apis/OrdersApi.cs:11-12,22-49,51-78`
- [ORD-03] `GET /{orderId:int}` returns the order, with any exception mapped to 404; `GET /` returns the current user's orders; `GET /cardtypes` lists card types — `src/Ordering.API/Apis/OrdersApi.cs:13-15,80-104`
- [ORD-04] `POST /draft` builds a draft order via command; `POST /` creates an order from a `CreateOrderRequest` (includes card number and CVV) with an `x-requestid` header — `src/Ordering.API/Apis/OrdersApi.cs:16-17,106-168,171-185`
- [ORD-05] `POST /` masks the card number before building the command, and deliberately avoids logging the request — `src/Ordering.API/Apis/OrdersApi.cs:126-130,140`
- [ORD-06] No gRPC endpoints were seen in the files read; only the minimal-API group is mapped in `Program.cs` (plus default endpoints) — `src/Ordering.API/Program.cs:17-22`

## Data
- [ORD-07] PostgreSQL via Npgsql, connection string name `orderingdb`, DbContext `OrderingContext`, default schema `ordering` — `src/Ordering.API/Extensions/Extensions.cs:15-19`, `src/Ordering.Infrastructure/OrderingContext.cs:37`
- [ORD-08] Entities: Orders, OrderItems, Payments (PaymentMethod), Buyers, CardTypes, plus idempotency `ClientRequest` and integration event log tables — `src/Ordering.Infrastructure/OrderingContext.cs:12-16,38-44`
- [ORD-09] The integration event log (outbox) shares this DbContext and database through `UseIntegrationEventLogs()` and `IntegrationEventLogService<OrderingContext>`; migration `Outbox` added it — `src/Ordering.Infrastructure/OrderingContext.cs:44`, `src/Ordering.API/Extensions/Extensions.cs:24`, `src/Ordering.Infrastructure/Migrations/20231026091055_Outbox.cs`
- [ORD-10] Migrations and seeding run at startup via `AddMigration<OrderingContext, OrderingContextSeed>()` — `src/Ordering.API/Extensions/Extensions.cs:21`
- [ORD-11] Order is an aggregate root with an owned `Address` value object, private item collection and a status enum; status transitions are guarded in the aggregate — `src/Ordering.Domain/AggregatesModel/OrderAggregate/Order.cs:5-33,99-168`
- [ORD-12] Idempotency records are stored by request ID in `ClientRequest` through `RequestManager` — `src/Ordering.Infrastructure/Idempotency/RequestManager.cs:13-37`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| OrderStartedIntegrationEvent | Published | [ORD-13] `src/Ordering.API/Application/Commands/CreateOrderCommandHandler.cs:32-33` |
| OrderStatusChangedToSubmittedIntegrationEvent | Published | [ORD-14] `src/Ordering.API/Application/DomainEventHandlers/ValidateOrAddBuyerAggregateWhenOrderStartedDomainEventHandler.cs:50-51` |
| OrderStatusChangedToAwaitingValidationIntegrationEvent | Published | [ORD-14] `src/Ordering.API/Application/DomainEventHandlers/OrderStatusChangedToAwaitingValidationDomainEventHandler.cs:33-34` |
| OrderStatusChangedToStockConfirmedIntegrationEvent | Published | [ORD-14] `src/Ordering.API/Application/DomainEventHandlers/OrderStatusChangedToStockConfirmedDomainEventHandler.cs:30-31` |
| OrderStatusChangedToPaidIntegrationEvent | Published | [ORD-14] `src/Ordering.API/Application/DomainEventHandlers/OrderStatusChangedToPaidDomainEventHandler.cs:32-39` |
| OrderStatusChangedToShippedIntegrationEvent | Published | [ORD-14] `src/Ordering.API/Application/DomainEventHandlers/OrderShippedDomainEventHandler.cs:30-31` |
| OrderStatusChangedToCancelledIntegrationEvent | Published | [ORD-14] `src/Ordering.API/Application/DomainEventHandlers/OrderCancelledDomainEventHandler.cs:30-31` |
| GracePeriodConfirmedIntegrationEvent | Handled | [ORD-15] `src/Ordering.API/Extensions/Extensions.cs:55` |
| OrderStockConfirmedIntegrationEvent | Handled | [ORD-15] `src/Ordering.API/Extensions/Extensions.cs:56` |
| OrderStockRejectedIntegrationEvent | Handled | [ORD-15] `src/Ordering.API/Extensions/Extensions.cs:57` |
| OrderPaymentFailedIntegrationEvent | Handled | [ORD-15] `src/Ordering.API/Extensions/Extensions.cs:58` |
| OrderPaymentSucceededIntegrationEvent | Handled | [ORD-15] `src/Ordering.API/Extensions/Extensions.cs:59` |

- [ORD-16] Publishing uses the outbox: handlers call `AddAndSaveEventAsync`, which writes to the event log inside the current DB transaction — `src/Ordering.API/Application/IntegrationEvents/OrderingIntegrationEventService.cs:36-41`
- [ORD-17] After commit, `TransactionBehavior` calls `PublishEventsThroughEventBusAsync(transactionId)`, which marks each pending event in-progress, publishes it to the bus, then marks it published or failed — `src/Ordering.API/Application/Behaviors/TransactionBehavior.cs:47-52`, `src/Ordering.API/Application/IntegrationEvents/OrderingIntegrationEventService.cs:13-34`
- [ORD-18] Handled events are turned into MediatR commands, for example grace period confirmed to `SetAwaitingValidationOrderStatusCommand` — `src/Ordering.API/Application/IntegrationEvents/EventHandling/GracePeriodConfirmedIntegrationEventHandler.cs:15-28`

## Dependencies
- [ORD-19] RabbitMQ event bus, resource name `eventbus` — `src/Ordering.API/Extensions/Extensions.cs:28-29`
- [ORD-20] PostgreSQL database `orderingdb` — `src/Ordering.API/Extensions/Extensions.cs:17`
- [ORD-21] Authentication through shared `AddDefaultAuthentication`; the user ID comes from `IIdentityService` backed by `IHttpContextAccessor` — `src/Ordering.API/Extensions/Extensions.cs:10,31-32`, `src/Ordering.API/Apis/OrdersApi.cs:95`
- [ORD-22] Shared service defaults, OpenAPI and API versioning — `src/Ordering.API/Program.cs:3,7-13`
- [ORD-23] No direct HTTP or gRPC calls to other services were seen; collaboration is only through events — `src/Ordering.API/Extensions/Extensions.cs:28-60`

## Patterns and risks seen in the code
- [ORD-24] MediatR pipeline order: Logging, Validator, Transaction. Each command runs in a DB transaction with an execution strategy — `src/Ordering.API/Extensions/Extensions.cs:39-41`, `src/Ordering.API/Application/Behaviors/TransactionBehavior.cs:32-53`
- [ORD-25] Domain events are dispatched before `SaveChanges`, so domain event handlers share one transaction with the command — `src/Ordering.Infrastructure/OrderingContext.cs:47-59`, `src/Ordering.Infrastructure/MediatorExtension.cs:5-20`
- [ORD-26] Risk: the bus publish happens after commit and a publish failure is only logged and marked failed. No retry loop is in this scope, so redelivery depends on something outside it — `src/Ordering.API/Application/IntegrationEvents/OrderingIntegrationEventService.cs:27-32`
- [ORD-27] Risk: `IdentifiedCommandHandler` catches every exception and returns `default` (false), hiding failures. The request ID is saved before the command runs, so a failed request cannot be retried with the same ID (it is treated as a duplicate and returns true for create, cancel and ship) — `src/Ordering.API/Application/Commands/IdentifiedCommandHandler.cs:48-102`, `src/Ordering.API/Application/Commands/CancelOrderCommandHandler.cs:44-47`, `src/Ordering.Infrastructure/Idempotency/RequestManager.cs:21-36`
- [ORD-28] Risk: `GET /{orderId}` loads by ID only, with no check that the order belongs to the caller, and catches all exceptions as 404 — `src/Ordering.API/Application/Queries/OrderQueries.cs:6-13`, `src/Ordering.API/Apis/OrdersApi.cs:80-91`
- [ORD-29] The stock-confirmed command handler has an artificial 10 second delay before processing — `src/Ordering.API/Application/Commands/SetStockConfirmedOrderStatusCommandHandler.cs:22`
- [ORD-30] `SetCancelledStatusWhenStockIsRejected` sets Cancelled without raising a domain event, so no cancelled integration event is emitted on that path; other transitions raise events — `src/Ordering.Domain/AggregatesModel/OrderAggregate/Order.cs:155-168` versus `142-153`
- [ORD-31] Out-of-state transitions are silent no-ops for AwaitingValidation, StockConfirmed and Paid but throw `OrderingDomainException` for Shipped and Cancelled — `src/Ordering.Domain/AggregatesModel/OrderAggregate/Order.cs:99-153`
- [ORD-32] DbContext pooling is disabled because of its two constructors; the one without `IMediator` leaves `_mediator` null, which would break `SaveEntitiesAsync` if used — `src/Ordering.API/Extensions/Extensions.cs:12-18`, `src/Ordering.Infrastructure/OrderingContext.cs:18,21,27-30,55`
- [ORD-33] Card number and security number flow through `CreateOrderCommand` into the Order constructor and the `OrderStartedDomainEvent`; only the number is masked in the API layer — `src/Ordering.API/Apis/OrdersApi.cs:140-144`, `src/Ordering.Domain/AggregatesModel/OrderAggregate/Order.cs:63-64`

## Open questions
- What redelivers integration events left in a failed or in-progress state in the event log? Only the shared IntegrationEventLogEF project would show it (outside this scope).
- Who calls `PUT /ship` and `POST /draft` (other services or the web app)? Not visible from this scope.
- How the stock and payment events are produced, and the grace period timing, live in other services (not read).
- Whether the integration event types are shared by contract or copied per service was not checked.
