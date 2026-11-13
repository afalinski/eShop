---
name: add-integration-event
description: Add a new integration event between eShop services over the RabbitMQ event bus (publish through the outbox, subscribe with a handler), or add a new subscriber to an existing event. Use when asked to publish, emit, consume or react to an event between Catalog, Ordering, Basket, Webhooks, OrderProcessor or PaymentProcessor.
---

# Add an integration event

Keep to these steps for the whole task. The most common silent failure is a name mismatch between publisher and subscriber (step 3).

## 1. Declare the event in the publisher
- A record deriving from `IntegrationEvent` (`src/EventBus/Events/IntegrationEvent.cs`), named `<Something>IntegrationEvent`, in `<Service>/IntegrationEvents/Events/` (Ordering: `src/Ordering.API/Application/IntegrationEvents/Events/`).
- `IntegrationEvent` sets `Id` and `CreationDate`. Create a new event object for every publish: the event ID is the outbox primary key, so reusing one fails the save.

## 2. Publish through the outbox, never straight to the bus
- **Ordering**: call `IOrderingIntegrationEventService.AddAndSaveEventAsync(evt)` from a command or domain event handler. It joins the command's transaction, and `TransactionBehavior` publishes after commit.
- **Catalog**: call `SaveEventAndCatalogContextChangesAsync(evt)` (data and event row in one transaction), then `PublishThroughEventBusAsync(evt)`, as `UpdateItem` does for the price change.
- `OrderProcessor` and `PaymentProcessor` publish directly with `IEventBus.PublishAsync` and have no outbox. Do not copy that into Ordering or Catalog.
- A failed publish is marked failed and nothing resends it. Say so if the task depends on delivery.

## 3. Subscribe in each consumer
- Contracts are not shared: each consumer declares its own copy of the event. The bus routes by the **class name only** (`routingKey = @event.GetType().Name`; subscriptions are keyed by `typeof(T).Name`). The copy must have exactly the same class name and the same JSON property names as the publisher's; the namespace may differ. A mismatch does not fail the build. At runtime the consumer logs `Unable to resolve event type for event name ...` and drops the message.
- Handler: a class implementing `IIntegrationEventHandler<TEvent>` in `<Service>/IntegrationEvents/EventHandling/`.
- Register it in the service's `Extensions.cs` with `.AddSubscription<TEvent, THandler>()` (Ordering: inside `AddEventBusSubscriptions`).
- **Basket only**: also add `[JsonSerializable(typeof(TEvent))]` to `IntegrationEventContext` in `src/Basket.API/Extensions/Extensions.cs`. Basket deserializes events through that source-generated context.
- Do not log a whole event that carries card data or other personal data.

## 4. Do not break the outbox
- Never rename or delete an event class that the publisher may still have in its outbox table: a row whose type no longer resolves fails the whole pending batch.

## 5. Test
- Unit-test the handler. Ordering and Basket have `tests/Ordering.UnitTests` and `tests/Basket.UnitTests`. Catalog, Webhooks, Identity and the processors have no project of their own: their unit tests live in `tests/Application.UnitTests`. All unit test projects use MSTest with NSubstitute for fakes; the functional ones use xUnit v3. Use the framework of the project you add to.
- Run the narrowest test first: `dotnet test --project tests/<Project> --filter "Name~<YourTestName>"` (the unit projects are MSTest; an xUnit v3 functional project takes `--filter-method "*<YourTestName>*"` instead).

## 6. Done when
- The publisher saves the event through the outbox, every consumer has a same-named copy, a handler and a subscription, and the handler test passes.
- You list each service you touched and say which test command you ran.
