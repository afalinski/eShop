# Basket — explorer card

- Scope: src/Basket.API
- Claim prefix: BAS
- Verified at commit: d9aa12b

## Responsibility
Basket owns the shopping basket of each authenticated buyer. It stores one basket per user in Redis and exposes get, update and delete operations over gRPC. It clears a user's basket when Ordering announces that an order has started.

## Public interface
- [BAS-01] gRPC service `BasketApi.Basket` with three RPCs: GetBasket, UpdateBasket, DeleteBasket — `src/Basket.API/Proto/basket.proto:5-11`
- [BAS-02] Messages carry only product_id and quantity per item. The request has no user id, so the user comes from the token — `src/Basket.API/Proto/basket.proto:13-33`
- [BAS-03] The service is mapped with MapGrpcService, and no REST controllers or minimal APIs are mapped. Only the default endpoints from service defaults are added — `src/Basket.API/Program.cs:6-12`
- [BAS-04] Kestrel is configured for HTTP/2 only — `src/Basket.API/appsettings.json:8-12`
- [BAS-05] The user id is the `sub` claim, read from the HttpContext — `src/Basket.API/Extensions/ServerCallContextIdentityExtensions.cs:7`
- [BAS-06] GetBasket is marked `[AllowAnonymous]` and returns an empty basket if there is no user id — `src/Basket.API/Grpc/BasketService.cs:12-19`
- [BAS-07] UpdateBasket and DeleteBasket throw RpcException Unauthenticated when there is no user id. UpdateBasket throws NotFound if the repository returns null — `src/Basket.API/Grpc/BasketService.cs:36-69`

## Data
- [BAS-08] Storage is Redis. Each basket is a single string value under the key `/basket/{userId}` — `src/Basket.API/Repositories/RedisBasketRepository.cs:12-16`
- [BAS-09] The value is JSON (source-generated System.Text.Json) of CustomerBasket, which has BuyerId and a list of BasketItem — `src/Basket.API/Repositories/RedisBasketRepository.cs:31,36,51-54`, `src/Basket.API/Model/CustomerBasket.cs:3-7`
- [BAS-10] StringSetAsync is called with no expiry, so baskets do not expire — `src/Basket.API/Repositories/RedisBasketRepository.cs:37`
- [BAS-11] Update writes and then re-reads the basket. A Redis write that returns false makes it return null — `src/Basket.API/Repositories/RedisBasketRepository.cs:34-47`
- [BAS-12] Basket is the only service that uses the "redis" resource in the Basket.API code. I did not check other projects for it, see Open questions — `src/Basket.API/Extensions/Extensions.cs:14`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| OrderStartedIntegrationEvent | Handled | [BAS-13] `src/Basket.API/Extensions/Extensions.cs:19`, `src/Basket.API/IntegrationEvents/EventHandling/OrderStartedIntegrationEventHandler.cs:10-15` |
| (none) | Published | [BAS-14] Basket.API contains no event publishing code. Ordering publishes the event — `src/Ordering.API/Application/Commands/CreateOrderCommandHandler.cs:32` |

- [BAS-13a] The handler deletes the basket for `event.UserId` — `src/Basket.API/IntegrationEvents/EventHandling/OrderStartedIntegrationEventHandler.cs:14`
- [BAS-15] The event contract is declared again locally as `record OrderStartedIntegrationEvent(string UserId)`. It is not shared with Ordering, which has its own class — `src/Basket.API/IntegrationEvents/Events/OrderStartedIntegrationEvent.cs:6`, `src/Ordering.API/Application/IntegrationEvents/Events/OrderStartedIntegrationEvent.cs:10`

## Dependencies
- [BAS-16] Redis, via `AddRedisClient("redis")`. The connection string is `localhost` by default — `src/Basket.API/Extensions/Extensions.cs:14`, `src/Basket.API/appsettings.json:13-16`
- [BAS-17] RabbitMQ event bus "eventbus" with subscription client name "Basket" — `src/Basket.API/Extensions/Extensions.cs:18`, `src/Basket.API/appsettings.json:15,20-22`
- [BAS-18] Identity: `AddDefaultAuthentication()` with audience "basket" — `src/Basket.API/Extensions/Extensions.cs:12`, `src/Basket.API/appsettings.json:17-19`
- [BAS-19] Ordering is a producer of the events Basket consumes — `src/Ordering.API/Application/Commands/CreateOrderCommandHandler.cs:32`

## Patterns and risks seen in the code
- [BAS-20] The repository is registered as a singleton and holds an IDatabase taken once from the multiplexer — `src/Basket.API/Extensions/Extensions.cs:16`, `src/Basket.API/Repositories/RedisBasketRepository.cs:8`
- [BAS-21] Source-generated JSON contexts are used for both Redis storage and event serialization (AOT-friendly) — `src/Basket.API/Extensions/Extensions.cs:20,24-28`
- [BAS-22] Risk: update is a blind overwrite with no versioning or concurrency check, so concurrent updates from two clients lose one update — `src/Basket.API/Repositories/RedisBasketRepository.cs:37`
- [BAS-23] Risk: the order-started handler only deletes the basket. It does not check that the basket matches the order, and the basket is lost if the order later fails — `src/Basket.API/IntegrationEvents/EventHandling/OrderStartedIntegrationEventHandler.cs:14`
- [BAS-24] Risk: the handler logs the whole event with `{@IntegrationEvent}`, so the user id is written to logs — `src/Basket.API/IntegrationEvents/EventHandling/OrderStartedIntegrationEventHandler.cs:12`
- [BAS-25] The proto field numbers are non-sequential (product_id = 2, quantity = 6, items = 2 in the update request). This looks like leftover fields from an older contract — `src/Basket.API/Proto/basket.proto:21-22,26`
- [BAS-26] The BasketService class has no class-level `[Authorize]`. Only GetBasket has an explicit `[AllowAnonymous]`, and the other two RPCs check for a user id by hand — `src/Basket.API/Grpc/BasketService.cs:8-12,36-41`

## Open questions
- Whether a fallback authorization policy is set inside `AddDefaultAuthentication` (in ServiceDefaults). I did not read it, so I can't say whether `[AllowAnonymous]` has any effect.
- How the AppHost wires the "redis" and "eventbus" resources. I found no AppHost Program.cs by the glob I used.
- Whether any other service reads the `/basket/` Redis keys directly.
- How the event bus publishes (outbox or direct) and its retry behaviour. That sits in the EventBus projects, which are out of scope.
