# Processors (OrderProcessor, PaymentProcessor) — explorer card

- Scope: src/OrderProcessor, src/PaymentProcessor
- Claim prefix: PRC
- Verified at commit: d9aa12b

## Responsibility
OrderProcessor is a background worker that periodically finds orders still in `Submitted` status past a grace period and publishes an event so Ordering.API can move them on. PaymentProcessor is an event-driven worker that simulates payment: on a stock-confirmed event it publishes a payment succeeded or failed event based on configuration. Neither service has business endpoints or owns a database.

## Public interface
- [PRC-01] OrderProcessor exposes only default service endpoints (`MapDefaultEndpoints`), no business routes — `src/OrderProcessor/Program.cs:8`
- [PRC-02] PaymentProcessor exposes only default service endpoints, no business routes — `src/PaymentProcessor/Program.cs:13`

## Data
- [PRC-03] OrderProcessor reads the Ordering database (`orderingdb`, PostgreSQL via Npgsql data source) — `src/OrderProcessor/Extensions/Extensions.cs:13`
- [PRC-04] It runs a raw SQL SELECT on `ordering.orders` (columns "Id", "OrderDate", "OrderStatus" = 'Submitted'); it is read-only, and the table is owned by Ordering.API — `src/OrderProcessor/Services/GracePeriodOrdersRepository.cs:24-28`
- [PRC-05] AppHost comment states Ordering.API holds the EF migrations, so OrderProcessor waits for it — `src/eShop.AppHost/AppHost.cs:51`
- [PRC-06] PaymentProcessor has no storage; AppHost gives it only a RabbitMQ reference — `src/eShop.AppHost/AppHost.cs:53-54`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| GracePeriodConfirmedIntegrationEvent | Published by OrderProcessor (handled by Ordering.API) | [PRC-07] `src/OrderProcessor/Services/GracePeriodManagerService.cs:56-60`; handler subscription `src/Ordering.API/Extensions/Extensions.cs:55` |
| OrderStatusChangedToStockConfirmedIntegrationEvent | Handled by PaymentProcessor | [PRC-08] `src/PaymentProcessor/Program.cs:5-6` |
| OrderPaymentSucceededIntegrationEvent | Published by PaymentProcessor | [PRC-09] `src/PaymentProcessor/IntegrationEvents/EventHandling/OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs:23` |
| OrderPaymentFailedIntegrationEvent | Published by PaymentProcessor | [PRC-10] `src/PaymentProcessor/IntegrationEvents/EventHandling/OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs:27` |

- [PRC-11] Publishing is direct via `IEventBus.PublishAsync`, with no outbox in either processor — `src/OrderProcessor/Services/GracePeriodManagerService.cs:60`, `src/PaymentProcessor/IntegrationEvents/EventHandling/OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs:32`
- [PRC-12] OrderProcessor registers no subscriptions, it only publishes — `src/OrderProcessor/Extensions/Extensions.cs:10-11`

## Dependencies
- [PRC-13] RabbitMQ event bus in both services (`AddRabbitMqEventBus`); OrderProcessor uses connection name "eventbus", PaymentProcessor "EventBus" — `src/OrderProcessor/Extensions/Extensions.cs:10`, `src/PaymentProcessor/Program.cs:5`
- [PRC-14] PostgreSQL `orderingdb` (OrderProcessor only) — `src/OrderProcessor/Extensions/Extensions.cs:13`
- [PRC-15] Config for OrderProcessor: `BackgroundTaskOptions` GracePeriodTime=1 (minutes) and CheckUpdateTime=30 (seconds) — `src/OrderProcessor/appsettings.json:14-17`, `src/OrderProcessor/Services/GracePeriodManagerService.cs:17,51`
- [PRC-16] Config for PaymentProcessor: `PaymentOptions:PaymentSucceeded` defaults to true — `src/PaymentProcessor/appsettings.json:14-16`
- [PRC-17] OrderProcessor uses `AddBasicServiceDefaults`, PaymentProcessor uses `AddServiceDefaults` — `src/OrderProcessor/Program.cs:3`, `src/PaymentProcessor/Program.cs:3`
- [PRC-18] No identity dependency seen in either processor's startup — `src/OrderProcessor/Program.cs:1-10`, `src/PaymentProcessor/Program.cs:1-15`

## Patterns and risks seen in the code
- [PRC-19] Polling loop: query every CheckUpdateTime seconds and publish one event per matching order — `src/OrderProcessor/Services/GracePeriodManagerService.cs:25-35,54-61`
- [PRC-20] Risk: no marking of published orders, so an order still `Submitted` is re-published on every poll (30s) until Ordering.API changes its status; consumers must be idempotent — `src/OrderProcessor/Services/GracePeriodManagerService.cs:50-60`, `src/OrderProcessor/Services/GracePeriodOrdersRepository.cs:27`
- [PRC-21] Risk: the repository swallows NpgsqlException and returns an empty list, so DB outages are only logged — `src/OrderProcessor/Services/GracePeriodOrdersRepository.cs:41-45`
- [PRC-22] Risk: an exception from `PublishAsync` or the check is not caught in the loop, so it would propagate out of `ExecuteAsync` — `src/OrderProcessor/Services/GracePeriodManagerService.cs:32,60`
- [PRC-23] Cross-service coupling: OrderProcessor queries Ordering's table and column names directly in SQL, and duplicates the event type (separate copy in Ordering.API) — `src/OrderProcessor/Services/GracePeriodOrdersRepository.cs:25-27`, `src/Ordering.API/Application/IntegrationEvents/Events/GracePeriodConfirmedIntegrationEvent.cs:3`
- [PRC-24] Payment is simulated: outcome is purely the `PaymentSucceeded` option, read live through `IOptionsMonitor` — `src/PaymentProcessor/IntegrationEvents/EventHandling/OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs:17-28`
- [PRC-25] OrderProcessor uses source-generated JSON context for the published event — `src/OrderProcessor/Extensions/Extensions.cs:11,23-27`

## Open questions
- Whether Ordering.API's handler is idempotent for repeated GracePeriodConfirmed events (handler body not read).
- Whether the eventbus connection-name casing difference ("eventbus" vs "EventBus") matters at runtime (AppHost resource name not checked).
- Whether the exception in the polling loop crashes the host (depends on host BackgroundServiceExceptionBehavior, not verified).
