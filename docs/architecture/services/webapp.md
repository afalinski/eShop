# WebApp — explorer card

- Scope: src/WebApp, src/WebAppComponents
- Claim prefix: WEB
- Verified at commit: d9aa12b

## Responsibility
Blazor Server storefront (AdventureWorks) that renders catalog, item, cart, checkout and orders pages and hosts an optional AI chatbot. It owns no data; it calls Catalog, Basket and Ordering APIs on behalf of the signed-in user and pushes live order-status refreshes to the browser. WebAppComponents is a shared Razor class library with the catalog client and catalog UI components.

## Public interface
- [WEB-01] Interactive-server Razor components app; no controllers or REST API of its own — `src/WebApp/Program.cs:8`, `src/WebApp/Program.cs:30`
- [WEB-02] Pages: `/` (catalog), `/item/{itemId:int}`, `/cart` [Authorize], `/checkout` [Authorize], `/user/login` [Authorize], `/user/logout`, `/user/orders` [Authorize] — `src/WebApp/Components/Pages/Catalog/Catalog.razor:1`, `src/WebApp/Components/Pages/Item/ItemPage.razor:1`, `src/WebApp/Components/Pages/Cart/CartPage.razor:1`, `src/WebApp/Components/Pages/Checkout/Checkout.razor:1`, `src/WebApp/Components/Pages/User/LogIn.razor:1`, `src/WebApp/Components/Pages/User/LogOut.razor:1`, `src/WebApp/Components/Pages/User/Orders.razor:1`
- [WEB-03] `/product-images/{id}` is a reverse-proxy forwarder to catalog-api `/api/catalog/items/{id}/pic` — `src/WebApp/Program.cs:32`
- [WEB-04] Chatbot component renders interactive-server with prerender disabled — `src/WebApp/Components/Chatbot/Chatbot.razor:1`

## Data
- [WEB-05] No database. State is per-circuit: scoped `BasketState` caches the basket items task in memory; the basket itself lives in Basket.API via gRPC — `src/WebApp/Extensions/Extensions.cs:23`, `src/WebApp/Services/BasketState.cs:15`
- [WEB-06] Basket is stored by Basket.API as product id + quantity only; WebApp rehydrates names/prices from Catalog on each fetch — `src/WebApp/Services/BasketService.cs:20`, `src/WebApp/Services/BasketState.cs:123`
- [WEB-07] Auth session is a cookie (default 60 min, `SessionCookieLifetimeMinutes`) with tokens saved (`SaveTokens`) — `src/WebApp/Extensions/Extensions.cs:62`, `src/WebApp/Extensions/Extensions.cs:71`, `src/WebApp/Extensions/Extensions.cs:80`
- [WEB-08] Order-status subscriptions are held in a singleton in-memory dictionary keyed by buyer id (per instance only) — `src/WebApp/Services/OrderStatus/OrderStatusNotificationService.cs:7`

## Integration events
| Event | Published / Handled | Evidence |
|---|---|---|
| OrderStatusChangedToSubmittedIntegrationEvent | Handled | [WEB-09] `src/WebApp/Extensions/Extensions.cs:50` |
| OrderStatusChangedToAwaitingValidationIntegrationEvent | Handled | [WEB-09] `src/WebApp/Extensions/Extensions.cs:45` |
| OrderStatusChangedToStockConfirmedIntegrationEvent | Handled | [WEB-09] `src/WebApp/Extensions/Extensions.cs:47` |
| OrderStatusChangedToPaidIntegrationEvent | Handled | [WEB-09] `src/WebApp/Extensions/Extensions.cs:46` |
| OrderStatusChangedToShippedIntegrationEvent | Handled | [WEB-09] `src/WebApp/Extensions/Extensions.cs:48` |
| OrderStatusChangedToCancelledIntegrationEvent | Handled | [WEB-09] `src/WebApp/Extensions/Extensions.cs:49` |

- [WEB-09] WebApp only subscribes (no publishing found); subscription client name `Ordering.webapp` — `src/WebApp/Extensions/Extensions.cs:17`, `src/WebApp/appsettings.json:10`
- [WEB-10] Handler (Paid shown) logs and calls `NotifyOrderStatusChangedAsync(BuyerIdentityGuid)`; the event types are local copies of the record, not shared with Ordering — `src/WebApp/Services/OrderStatus/IntegrationEvents/EventHandling/OrderStatusChangedToPaidIntegrationEventHandler.cs:10`, `src/WebApp/Services/OrderStatus/IntegrationEvents/Events/OrderStatusChangedToPaidIntegrationEvent.cs:5`
- [WEB-11] The Orders page embeds a component that subscribes per buyer and calls `Nav.Refresh()` on notification — `src/WebApp/Components/Pages/User/OrdersRefreshOnStatusChange.razor:17`, `src/WebApp/Components/Pages/User/OrdersRefreshOnStatusChange.razor:27`

## Dependencies
- [WEB-12] Basket.API over gRPC at `http://basket-api`, auth token forwarded; proto linked from Basket.API as client — `src/WebApp/Extensions/Extensions.cs:31`, `src/WebApp/WebApp.csproj:31`
- [WEB-13] Catalog.API over HTTP at `https+http://catalog-api`, API version 2.0, auth token forwarded — `src/WebApp/Extensions/Extensions.cs:34`
- [WEB-14] Ordering.API over HTTP at `https+http://ordering-api`, API version 1.0, auth token forwarded; `GET/POST /api/Orders/` — `src/WebApp/Extensions/Extensions.cs:38`, `src/WebApp/Services/OrderingService.cs:5`
- [WEB-15] RabbitMQ event bus via `AddRabbitMqEventBus("EventBus")` — `src/WebApp/Extensions/Extensions.cs:17`
- [WEB-16] Identity provider via OpenID Connect (`IdentityUrl`, `CallBackUrl` required config), client id `webapp`, code flow, scopes openid/profile/orders/basket — `src/WebApp/Extensions/Extensions.cs:60`, `src/WebApp/Extensions/Extensions.cs:77`, `src/WebApp/Extensions/Extensions.cs:79`, `src/WebApp/Extensions/Extensions.cs:83`
- [WEB-17] Optional LLM: Ollama if `OllamaEnabled`, else OpenAI when connection string `chatModel` is set; none configured means no chat client — `src/WebApp/Extensions/Extensions.cs:97`, `src/WebApp/Extensions/Extensions.cs:102`
- [WEB-18] Project references ServiceDefaults, EventBusRabbitMQ, WebAppComponents; targets net10.0 — `src/WebApp/WebApp.csproj:4`, `src/WebApp/WebApp.csproj:14`
- [WEB-19] Catalog calls used: items, items/by, items/withsemanticrelevance, catalogBrands, catalogTypes, items/facets under `api/catalog/` — `src/WebAppComponents/Services/CatalogService.cs:13`, `src/WebAppComponents/Services/CatalogService.cs:26`, `src/WebAppComponents/Services/CatalogService.cs:33`, `src/WebAppComponents/Services/CatalogService.cs:40`, `src/WebAppComponents/Services/CatalogService.cs:47`, `src/WebAppComponents/Services/CatalogService.cs:64`

## Patterns and risks seen in the code
- [WEB-20] OIDC client secret is hard-coded as `"secret"` and `RequireHttpsMetadata = false` — `src/WebApp/Extensions/Extensions.cs:78`, `src/WebApp/Extensions/Extensions.cs:82`
- [WEB-21] Checkout sends hard-coded card data (number, holder, CVV) rather than user input — `src/WebApp/Services/BasketState.cs:100`
- [WEB-22] `OrderingService.CreateOrder` returns `SendAsync` without `EnsureSuccessStatusCode`, so HTTP failures are not surfaced to the caller — `src/WebApp/Services/OrderingService.cs:17`; basket is deleted right after in checkout — `src/WebApp/Services/BasketState.cs:107`
- [WEB-23] Idempotency: checkout generates a `RequestId` and sends it as `x-requestid` header — `src/WebApp/Services/BasketState.cs:80`, `src/WebApp/Services/OrderingService.cs:15`
- [WEB-24] Basket add is read-modify-write from the client (fetch, increment, full replace), so concurrent edits can overwrite each other — `src/WebApp/Services/BasketState.cs:33`
- [WEB-25] Basket item lookup `catalogItems[item.ProductId]` throws if a product vanished from catalog; basket item `Id` is a throwaway GUID (TODO in code) — `src/WebApp/Services/BasketState.cs:135`, `src/WebApp/Services/BasketState.cs:138`
- [WEB-26] Chatbot exposes tools GetUserInfo (returns PII claims: address, email, phone to the LLM), SearchCatalog, AddToCart, GetCartContents; system prompt restricts topics — `src/WebApp/Components/Chatbot/ChatState.cs:43`, `src/WebApp/Components/Chatbot/ChatState.cs:96`, `src/WebApp/Components/Chatbot/ChatState.cs:52`
- [WEB-27] Notification fan-out holds the lock while invoking `Task.WhenAll(... callback())`; callbacks start under lock though they are awaited outside — `src/WebApp/Services/OrderStatus/OrderStatusNotificationService.cs:29`
- [WEB-28] Production pipeline adds exception handler and HSTS; `UseAuthentication`/`UseAuthorization` calls are not visible in Program.cs (auth wired via Blazor `AuthenticationStateProvider`) — `src/WebApp/Program.cs:17`, `src/WebApp/Extensions/Extensions.cs:90`
- [WEB-29] `LogIn` page only redirects after `[Authorize]` forces challenge; it rejects absolute return URLs (open-redirect guard) — `src/WebApp/Components/Pages/User/LogIn.razor:13`

## Open questions
- How `/user/login` and `/user/logout` actually trigger the OIDC challenge and sign-out (LogOutService and Routes/auth middleware not read in detail).
- Whether `UseAuthentication`/`UseAuthorization` are added implicitly by the framework in this setup.
- Which exchange/topic the events arrive on and which service publishes them (publisher side not in scope).
- Whether Checkout.razor handles a failed CreateOrder response (page not read).
