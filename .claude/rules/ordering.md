---
paths:
  - "src/Ordering.API/**"
  - "src/Ordering.Domain/**"
  - "src/Ordering.Infrastructure/**"
  - "tests/Ordering.*/**"
---
# Ordering rules

- Every command runs through the MediatR pipeline Logging, Validator, Transaction, in one DB transaction (ORD-24).
- Publish integration events through the outbox: handlers call `AddAndSaveEventAsync`, and `TransactionBehavior` publishes after commit (ORD-16, ORD-17). A failed publish is only logged and marked failed, nothing retries it here (ORD-26).
- Failures are hidden. `IdentifiedCommandHandler` catches every exception and returns false, the request ID stays stored, and validation errors of the inner command are swallowed too (ARCH-05). `POST /api/orders` returns 200 either way (ARCH-06). In tests, assert on the stored order state, never on the HTTP status.
- Idempotent wrappers exist for event-driven commands, but the Paid integration-event path sends the plain command (ARCH-03).
- Status changes live in the `Order` aggregate. A transition from a wrong state is a silent no-op for AwaitingValidation, StockConfirmed and Paid, and throws `OrderingDomainException` for Shipped and Cancelled (ORD-31). Cancelling because stock was rejected raises no domain event, so no Cancelled integration event goes out on that path (ORD-30).
- The StockConfirmed and Paid handlers wait 10 s on purpose (ORD-29, ARCH-02). Tests that wait for a status must allow for it.
- Only the card number is masked, in the API layer. The CVV travels unmasked through `CreateOrderCommand` (ORD-33): never log a command or request that carries card data.
- `GET /{orderId}` loads by ID with no check that the order belongs to the caller (ORD-28). Do not copy that pattern into new queries.
- DbContext pooling is off. Use the `OrderingContext` constructor that takes `IMediator`, or `SaveEntitiesAsync` breaks (ORD-32).
- Migrations and seeding run at startup (ORD-10).
