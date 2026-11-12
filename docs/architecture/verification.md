# Verification of architecture cards and overview

- Commit checked: d9aa12b (working tree, `docs/architecture/**` untracked)
- Method: opened the cited source files and the surrounding code. Checked cross-card consistency with grep over `src/`. Did not modify any file other than this one.
- "Confirmed" means the code shows the claim. A one-or-two line citation drift is noted but does not change the verdict.

## Totals

| Checked | Confirmed | Not confirmed | Wrong |
|---|---|---|---|
| 356 | 347 | 3 | 6 |

Rejection rate = (3 + 6) / 356 = 2.5%.

The claim count is: CAT 39, BAS 27 (incl. BAS-13a), ORD 33, PRC 25, IDN 32, WHK 38, WEB 29, PLT 31, EVT 60, SEC 39, ARCH 3.

The low rejection rate for the cards does not mean the overview is sound. The overview's problems are mostly in the target steps (section "Overview conclusions not supported" below), where the cited claims are true but the proposed change does not follow from them.

## Claims that are not CONFIRMED

| ID | Verdict | What the code shows |
|---|---|---|
| ORD-05 | WRONG | The card says POST `/` "deliberately avoids logging the request". Only one log call carries that comment (`src/Ordering.API/Apis/OrdersApi.cs:126-130`). The same method logs the full request, including the unmasked card number and CVV, when the request ID is missing (`OrdersApi.cs:134`). It logs the command, with `CardSecurityNumber` in clear, at `OrdersApi.cs:148-153`, `src/Ordering.API/Application/Behaviors/LoggingBehavior.cs:9` and `src/Ordering.API/Application/Behaviors/TransactionBehavior.cs:41` (`{@Command}`). `CreateOrderCommand` has no ignore attribute (`src/Ordering.API/Application/Commands/CreateOrderCommand.cs:52-53`). |
| EVT-59 | WRONG | A renamed type does not "deserialise to null". The type lookup returns null (`src/IntegrationEventLogEF/Services/IntegrationEventLogService.cs:28`), and null is then passed to `JsonSerializer.Deserialize(Content, type, ...)` (`src/IntegrationEventLogEF/IntegrationEventLogEntry.cs:37`). That call throws for a null type. One stale row would fail the whole pending-events batch, not yield a null event. |
| WHK-29 | WRONG (partly) | "No retries ... no per-call timeout" ignores the default HttpClient pipeline. `AddServiceDefaults` calls `ConfigureHttpClientDefaults(... AddStandardResilienceHandler())` (`src/eShop.ServiceDefaults/Extensions.cs:22-29`), and Webhooks.API uses it (`src/Webhooks.API/Program.cs:3`). The factory client in `WebhooksSender.cs:7` therefore gets the standard retry, timeout and circuit-breaker handler. Still true: `Task.WhenAll` faults the handler (`WebhooksSender.cs:10`), and status codes are not checked. PLT-18 already states the resilience default, so the cards contradict each other. |
| EVT-38 | WRONG (partly) | Same as WHK-29: "no retry ... no timeout" is contradicted by `src/eShop.ServiceDefaults/Extensions.cs:22-29`. The remaining parts hold (no status check, `Task.WhenAll`). |
| SEC-18 | WRONG | "OrderProcessor, PaymentProcessor call `AddBasicServiceDefaults` only". PaymentProcessor calls `AddServiceDefaults` (`src/PaymentProcessor/Program.cs:3`). Only OrderProcessor uses `AddBasicServiceDefaults` (`src/OrderProcessor/Program.cs:3`). PRC-17 states this correctly. The conclusion "no authentication" still holds for both. |
| IDN-22 | WRONG (partly) | "Other services read this payment data from the token". No backend service does. The only readers of `card_*` claims in `src/` are in the MAUI client (`src/ClientApp/Services/Identity/IdentityService.cs:85-88`). WebApp sends hard-coded card data (`src/WebApp/Services/BasketState.cs:100-103`). The producing side (`ProfileService.cs:70-80`) is confirmed. |
| WHK-37 | NOT CONFIRMED | The cited line only shows the declaration of a non-nullable `[FromHeader]` string (`src/WebhookClient/Endpoints/WebhookEndpoints.cs:16`). The "probably rejected by the framework" behaviour is not shown by the code. |
| IDN-21 | NOT CONFIRMED | The Duende package references are confirmed (`Identity.API.csproj:9-12`). "A commercial licence product" is not shown in the repository. |
| WEB-28 | NOT CONFIRMED | Missing `UseAuthentication` and `UseAuthorization` in `Program.cs` is confirmed (`src/WebApp/Program.cs:12-34`). The explanation "auth wired via Blazor `AuthenticationStateProvider`" is not shown. That provider (`Extensions.cs:90`) only exposes state. Cookie and OIDC handlers need the authentication middleware. The code does not show where it is added. |

## All claims

Notes marked "line" are citation drift only. The claim is true.

### Catalog (CAT)

| ID | Verdict | Note |
|---|---|---|
| CAT-01 | CONFIRMED | |
| CAT-02 | CONFIRMED | |
| CAT-03 | CONFIRMED | |
| CAT-04 | CONFIRMED | |
| CAT-05 | CONFIRMED | |
| CAT-06 | CONFIRMED | No auth anywhere in Catalog.API (grep for Authoriz, Authenticat, Anonymous: no match). |
| CAT-07 | CONFIRMED | True but incomplete. The catch-all at `Extensions.cs:141-143` is the one that matters (see ARCH-01). |
| CAT-08 | CONFIRMED | |
| CAT-09 | CONFIRMED | |
| CAT-10 | CONFIRMED | |
| CAT-11 | CONFIRMED | |
| CAT-12 | CONFIRMED | |
| CAT-13 | CONFIRMED | |
| CAT-14 | CONFIRMED | Line: the wiring is `AppHost.cs:40` (`WithReference(catalogDb)`), not 38. Grep for `catalogdb` finds only AppHost and Catalog. |
| CAT-15 | CONFIRMED | |
| CAT-16 | CONFIRMED | |
| CAT-17 | CONFIRMED | |
| CAT-18 | CONFIRMED | |
| CAT-19 | CONFIRMED | |
| CAT-20 | CONFIRMED | |
| CAT-21 | CONFIRMED | |
| CAT-22 | CONFIRMED | |
| CAT-23 | CONFIRMED | |
| CAT-24 | CONFIRMED | |
| CAT-25 | CONFIRMED | |
| CAT-26 | CONFIRMED | |
| CAT-27 | CONFIRMED | |
| CAT-28 | CONFIRMED | |
| CAT-29 | CONFIRMED | |
| CAT-30 | CONFIRMED | |
| CAT-31 | CONFIRMED | |
| CAT-32 | CONFIRMED | |
| CAT-33 | CONFIRMED | |
| CAT-34 | CONFIRMED | |
| CAT-35 | CONFIRMED | |
| CAT-36 | CONFIRMED | |
| CAT-37 | CONFIRMED | |
| CAT-38 | CONFIRMED | |
| CAT-39 | CONFIRMED | |

### Basket (BAS)

| ID | Verdict | Note |
|---|---|---|
| BAS-01 | CONFIRMED | |
| BAS-02 | CONFIRMED | |
| BAS-03 | CONFIRMED | |
| BAS-04 | CONFIRMED | |
| BAS-05 | CONFIRMED | |
| BAS-06 | CONFIRMED | |
| BAS-07 | CONFIRMED | |
| BAS-08 | CONFIRMED | |
| BAS-09 | CONFIRMED | |
| BAS-10 | CONFIRMED | |
| BAS-11 | CONFIRMED | |
| BAS-12 | CONFIRMED | Grep shows no other service project uses Redis. |
| BAS-13 | CONFIRMED | |
| BAS-13a | CONFIRMED | |
| BAS-14 | CONFIRMED | |
| BAS-15 | CONFIRMED | |
| BAS-16 | CONFIRMED | |
| BAS-17 | CONFIRMED | |
| BAS-18 | CONFIRMED | |
| BAS-19 | CONFIRMED | |
| BAS-20 | CONFIRMED | |
| BAS-21 | CONFIRMED | |
| BAS-22 | CONFIRMED | |
| BAS-23 | CONFIRMED | |
| BAS-24 | CONFIRMED | |
| BAS-25 | CONFIRMED | |
| BAS-26 | CONFIRMED | |

### Ordering (ORD)

| ID | Verdict | Note |
|---|---|---|
| ORD-01 | CONFIRMED | |
| ORD-02 | CONFIRMED | |
| ORD-03 | CONFIRMED | |
| ORD-04 | CONFIRMED | Missing from the card: `POST /` returns `Ok()` even when the command result is false (`OrdersApi.cs:157-166`). |
| ORD-05 | WRONG | See table above. |
| ORD-06 | CONFIRMED | |
| ORD-07 | CONFIRMED | |
| ORD-08 | CONFIRMED | |
| ORD-09 | CONFIRMED | Migration file `20231026091055_Outbox.cs` exists. |
| ORD-10 | CONFIRMED | |
| ORD-11 | CONFIRMED | |
| ORD-12 | CONFIRMED | |
| ORD-13 | CONFIRMED | |
| ORD-14 | CONFIRMED | All six handler line ranges match. |
| ORD-15 | CONFIRMED | |
| ORD-16 | CONFIRMED | |
| ORD-17 | CONFIRMED | |
| ORD-18 | CONFIRMED | |
| ORD-19 | CONFIRMED | |
| ORD-20 | CONFIRMED | |
| ORD-21 | CONFIRMED | |
| ORD-22 | CONFIRMED | |
| ORD-23 | CONFIRMED | No `HttpClient` or gRPC client in Ordering.API. |
| ORD-24 | CONFIRMED | |
| ORD-25 | CONFIRMED | |
| ORD-26 | CONFIRMED | |
| ORD-27 | CONFIRMED | Effect is right. The mechanism differs from how the overview uses it (see overview section). The ClientRequest row is already in the outer transaction. The row survives because the exception is swallowed (`IdentifiedCommandHandler.cs:99-102`) and the transaction commits. |
| ORD-28 | CONFIRMED | |
| ORD-29 | CONFIRMED | |
| ORD-30 | CONFIRMED | |
| ORD-31 | CONFIRMED | |
| ORD-32 | CONFIRMED | |
| ORD-33 | CONFIRMED | `Order` does not store the card number or CVV. They pass through its constructor into the domain event (`Order.cs:63-64`). `PaymentMethod` maps only the card number (masked by then), not the CVV. |

### Processors (PRC)

| ID | Verdict | Note |
|---|---|---|
| PRC-01 | CONFIRMED | |
| PRC-02 | CONFIRMED | |
| PRC-03 | CONFIRMED | |
| PRC-04 | CONFIRMED | |
| PRC-05 | CONFIRMED | |
| PRC-06 | CONFIRMED | |
| PRC-07 | CONFIRMED | |
| PRC-08 | CONFIRMED | |
| PRC-09 | CONFIRMED | |
| PRC-10 | CONFIRMED | |
| PRC-11 | CONFIRMED | |
| PRC-12 | CONFIRMED | |
| PRC-13 | CONFIRMED | |
| PRC-14 | CONFIRMED | |
| PRC-15 | CONFIRMED | |
| PRC-16 | CONFIRMED | |
| PRC-17 | CONFIRMED | |
| PRC-18 | CONFIRMED | |
| PRC-19 | CONFIRMED | |
| PRC-20 | CONFIRMED | |
| PRC-21 | CONFIRMED | |
| PRC-22 | CONFIRMED | |
| PRC-23 | CONFIRMED | |
| PRC-24 | CONFIRMED | |
| PRC-25 | CONFIRMED | |

### Identity (IDN)

| ID | Verdict | Note |
|---|---|---|
| IDN-01 | CONFIRMED | |
| IDN-02 | CONFIRMED | |
| IDN-03 | CONFIRMED | |
| IDN-04 | CONFIRMED | |
| IDN-05 | CONFIRMED | |
| IDN-06 | CONFIRMED | |
| IDN-07 | CONFIRMED | |
| IDN-08 | CONFIRMED | The `ApiResource` entries have no scopes (`Config.cs:10-12`). See overview step 9. |
| IDN-09 | CONFIRMED | |
| IDN-10 | CONFIRMED | |
| IDN-11 | CONFIRMED | |
| IDN-12 | CONFIRMED | `CardType` is a plain `int`, with no `[Required]`. |
| IDN-13 | CONFIRMED | |
| IDN-14 | CONFIRMED | |
| IDN-15 | CONFIRMED | |
| IDN-16 | CONFIRMED | |
| IDN-17 | CONFIRMED | |
| IDN-18 | CONFIRMED | |
| IDN-19 | CONFIRMED | No `HttpClient` in Identity.API. |
| IDN-20 | CONFIRMED | |
| IDN-21 | NOT CONFIRMED | See table above. |
| IDN-22 | WRONG (partly) | See table above. |
| IDN-23 | CONFIRMED | |
| IDN-24 | CONFIRMED | |
| IDN-25 | CONFIRMED | |
| IDN-26 | CONFIRMED | |
| IDN-27 | CONFIRMED | |
| IDN-28 | CONFIRMED | |
| IDN-29 | CONFIRMED | |
| IDN-30 | CONFIRMED | |
| IDN-31 | CONFIRMED | |
| IDN-32 | CONFIRMED | |

### Webhooks (WHK)

| ID | Verdict | Note |
|---|---|---|
| WHK-01 | CONFIRMED | |
| WHK-02 | CONFIRMED | |
| WHK-03 | CONFIRMED | |
| WHK-04 | CONFIRMED | |
| WHK-05 | CONFIRMED | |
| WHK-06 | CONFIRMED | |
| WHK-07 | CONFIRMED | |
| WHK-08 | CONFIRMED | |
| WHK-09 | CONFIRMED | |
| WHK-10 | CONFIRMED | |
| WHK-11 | CONFIRMED | |
| WHK-12 | CONFIRMED | |
| WHK-13 | CONFIRMED | |
| WHK-14 | CONFIRMED | |
| WHK-15 | CONFIRMED | |
| WHK-16 | CONFIRMED | |
| WHK-17 | CONFIRMED | |
| WHK-18 | CONFIRMED | |
| WHK-19 | CONFIRMED | |
| WHK-20 | CONFIRMED | |
| WHK-21 | CONFIRMED | |
| WHK-22 | CONFIRMED | |
| WHK-23 | CONFIRMED | |
| WHK-24 | CONFIRMED | |
| WHK-25 | CONFIRMED | |
| WHK-26 | CONFIRMED | The handshake is weaker than it reads. With an empty token, `tokenExpected` is null (`GrantUrlTesterService.cs:23`), so any URL that answers OPTIONS with 2xx and no token header passes (`:27`). |
| WHK-27 | CONFIRMED | |
| WHK-28 | CONFIRMED | |
| WHK-29 | WRONG (partly) | See table above. |
| WHK-30 | CONFIRMED | |
| WHK-31 | CONFIRMED | |
| WHK-32 | CONFIRMED | |
| WHK-33 | CONFIRMED | |
| WHK-34 | CONFIRMED | |
| WHK-35 | CONFIRMED | |
| WHK-36 | CONFIRMED | |
| WHK-37 | NOT CONFIRMED | See table above. |
| WHK-38 | CONFIRMED | Rests on `Enum.TryParse` framework behaviour. The two call sites are as cited. |

### WebApp (WEB)

| ID | Verdict | Note |
|---|---|---|
| WEB-01 | CONFIRMED | |
| WEB-02 | CONFIRMED | |
| WEB-03 | CONFIRMED | |
| WEB-04 | CONFIRMED | |
| WEB-05 | CONFIRMED | |
| WEB-06 | CONFIRMED | |
| WEB-07 | CONFIRMED | |
| WEB-08 | CONFIRMED | |
| WEB-09 | CONFIRMED | |
| WEB-10 | CONFIRMED | |
| WEB-11 | CONFIRMED | |
| WEB-12 | CONFIRMED | |
| WEB-13 | CONFIRMED | |
| WEB-14 | CONFIRMED | |
| WEB-15 | CONFIRMED | |
| WEB-16 | CONFIRMED | |
| WEB-17 | CONFIRMED | |
| WEB-18 | CONFIRMED | |
| WEB-19 | CONFIRMED | |
| WEB-20 | CONFIRMED | |
| WEB-21 | CONFIRMED | |
| WEB-22 | CONFIRMED | Line: the basket delete is `BasketState.cs:108`, not 107. |
| WEB-23 | CONFIRMED | |
| WEB-24 | CONFIRMED | |
| WEB-25 | CONFIRMED | |
| WEB-26 | CONFIRMED | |
| WEB-27 | CONFIRMED | |
| WEB-28 | NOT CONFIRMED | See table above. |
| WEB-29 | CONFIRMED | |

### Platform (PLT)

| ID | Verdict | Note |
|---|---|---|
| PLT-01 | CONFIRMED | |
| PLT-02 | CONFIRMED | |
| PLT-03 | CONFIRMED | |
| PLT-04 | CONFIRMED | |
| PLT-05 | CONFIRMED | |
| PLT-06 | CONFIRMED | |
| PLT-07 | CONFIRMED | |
| PLT-08 | CONFIRMED | |
| PLT-09 | CONFIRMED | |
| PLT-10 | CONFIRMED | |
| PLT-11 | CONFIRMED | |
| PLT-12 | CONFIRMED | |
| PLT-13 | CONFIRMED | |
| PLT-14 | CONFIRMED | |
| PLT-15 | CONFIRMED | |
| PLT-16 | CONFIRMED | |
| PLT-17 | CONFIRMED | |
| PLT-18 | CONFIRMED | |
| PLT-19 | CONFIRMED | |
| PLT-20 | CONFIRMED | |
| PLT-21 | CONFIRMED | |
| PLT-22 | CONFIRMED | |
| PLT-23 | CONFIRMED | With a null connection, `await _rabbitMQConnection?.CreateChannelAsync()` throws before the `InvalidOperationException` branch. It still throws. |
| PLT-24 | CONFIRMED | |
| PLT-25 | CONFIRMED | |
| PLT-26 | CONFIRMED | The type lookup yields null. See EVT-59 for what happens next. |
| PLT-27 | CONFIRMED | |
| PLT-28 | CONFIRMED | |
| PLT-29 | CONFIRMED | |
| PLT-30 | CONFIRMED | |
| PLT-31 | CONFIRMED | |

### Events and consistency (EVT)

| ID | Verdict | Note |
|---|---|---|
| EVT-01 | CONFIRMED | |
| EVT-02 | CONFIRMED | |
| EVT-03 | CONFIRMED | |
| EVT-04 | CONFIRMED | |
| EVT-05 | CONFIRMED | Grep: `RetrieveEventLogsPendingToPublishAsync` has one caller, `OrderingIntegrationEventService.cs:15`. |
| EVT-06 | CONFIRMED | |
| EVT-07 | CONFIRMED | |
| EVT-08 | CONFIRMED | |
| EVT-09 | CONFIRMED | |
| EVT-10 | CONFIRMED | |
| EVT-11 | CONFIRMED | |
| EVT-12 | CONFIRMED | |
| EVT-13 | CONFIRMED | |
| EVT-14 | CONFIRMED | |
| EVT-15 | CONFIRMED | |
| EVT-16 | CONFIRMED | |
| EVT-17 | CONFIRMED | |
| EVT-18 | CONFIRMED | |
| EVT-19 | CONFIRMED | |
| EVT-20 | CONFIRMED | |
| EVT-21 | CONFIRMED | |
| EVT-22 | CONFIRMED | |
| EVT-23 | CONFIRMED | |
| EVT-24 | CONFIRMED | |
| EVT-25 | CONFIRMED | |
| EVT-26 | CONFIRMED | |
| EVT-27 | CONFIRMED | |
| EVT-28 | CONFIRMED | |
| EVT-29 | CONFIRMED | |
| EVT-30 | CONFIRMED | |
| EVT-31 | CONFIRMED | |
| EVT-32 | CONFIRMED | |
| EVT-33 | CONFIRMED | |
| EVT-34 | CONFIRMED | |
| EVT-35 | CONFIRMED | |
| EVT-36 | CONFIRMED | |
| EVT-37 | CONFIRMED | |
| EVT-38 | WRONG (partly) | See table above. |
| EVT-39 | CONFIRMED | |
| EVT-40 | CONFIRMED | |
| EVT-41 | CONFIRMED | |
| EVT-42 | CONFIRMED | |
| EVT-43 | CONFIRMED | |
| EVT-44 | CONFIRMED | |
| EVT-45 | CONFIRMED | |
| EVT-46 | CONFIRMED | |
| EVT-47 | CONFIRMED | |
| EVT-48 | CONFIRMED | |
| EVT-49 | CONFIRMED | |
| EVT-50 | CONFIRMED | Both handlers have `Task.Delay(10000)`. So does the stock-rejected handler (`SetStockRejectedOrderStatusCommandHandler.cs:22`), which no card mentions. |
| EVT-51 | CONFIRMED | Line: `BasketState.cs:108` for the delete. |
| EVT-52 | CONFIRMED | |
| EVT-53 | CONFIRMED | |
| EVT-54 | CONFIRMED | |
| EVT-55 | CONFIRMED | |
| EVT-56 | CONFIRMED | |
| EVT-57 | CONFIRMED | |
| EVT-58 | CONFIRMED | |
| EVT-59 | WRONG | See table above. |
| EVT-60 | CONFIRMED | |

### Security and identity (SEC)

| ID | Verdict | Note |
|---|---|---|
| SEC-01 | CONFIRMED | |
| SEC-02 | CONFIRMED | |
| SEC-03 | CONFIRMED | |
| SEC-04 | CONFIRMED | |
| SEC-05 | CONFIRMED | |
| SEC-06 | CONFIRMED | |
| SEC-07 | CONFIRMED | |
| SEC-08 | CONFIRMED | |
| SEC-09 | CONFIRMED | |
| SEC-10 | CONFIRMED | |
| SEC-11 | CONFIRMED | |
| SEC-12 | CONFIRMED | |
| SEC-13 | CONFIRMED | |
| SEC-14 | CONFIRMED | |
| SEC-15 | CONFIRMED | Ordering also has `Identity:Audience` (`src/Ordering.API/appsettings.json:30`). |
| SEC-16 | CONFIRMED | |
| SEC-17 | CONFIRMED | |
| SEC-18 | WRONG | See table above. |
| SEC-19 | CONFIRMED | |
| SEC-20 | CONFIRMED | |
| SEC-21 | CONFIRMED | |
| SEC-22 | CONFIRMED | |
| SEC-23 | CONFIRMED | |
| SEC-24 | CONFIRMED | |
| SEC-25 | CONFIRMED | |
| SEC-26 | CONFIRMED | |
| SEC-27 | CONFIRMED | |
| SEC-28 | CONFIRMED | |
| SEC-29 | CONFIRMED | |
| SEC-30 | CONFIRMED | |
| SEC-31 | CONFIRMED | |
| SEC-32 | CONFIRMED | The write endpoints exist (`CatalogApi.cs:100-117`). |
| SEC-33 | CONFIRMED | |
| SEC-34 | CONFIRMED | |
| SEC-35 | CONFIRMED | |
| SEC-36 | CONFIRMED | The URL is user-supplied (`GrantUrlTesterService.cs:14`, `WebhooksSender.cs:17`). WHK-27 settles the "not read for restrictions" caveat. |
| SEC-37 | CONFIRMED | |
| SEC-38 | CONFIRMED | The attribute is applied to the quickstart controllers. |
| SEC-39 | CONFIRMED | |

### Architect claims (ARCH)

| ID | Verdict | Note |
|---|---|---|
| ARCH-01 | CONFIRMED | `Extensions.cs:141-143`: no HTTP method match. `AppHost.cs:62-63` makes the BFF external. A write also needs `api-version` in the query. |
| ARCH-02 | CONFIRMED | |
| ARCH-03 | CONFIRMED | |

## Overview conclusions not supported by the evidence

Each item below is a statement in `overview.md` whose cited claims are true but whose conclusion does not follow from the code.

1. **Step 2(b), "Call `AddDefaultAuthentication()` in Catalog.API (SEC-03)", would do nothing as written.**
   - `AddDefaultAuthentication` returns silently when there is no `Identity` config section (`src/eShop.ServiceDefaults/AuthenticationExtensions.cs:22-28`). Without it the "anonymous PUT returns 401" check cannot pass.
   - Catalog has no `Identity` section in any appsettings file (grep over `src/**/appsettings*.json`: only Basket, Ordering, Webhooks).
   - The AppHost does not give catalog-api `Identity__Url` (`src/eShop.AppHost/AppHost.cs:38-40`).
   - The helper also needs an `Audience` value (`AuthenticationExtensions.cs:36`).
   - The step must add config and AppHost wiring, and it should fail closed if the section is missing.

2. **Step 3 misdiagnoses idempotency and leaves the real cause in place.**
   - Step 3 says `IdentifiedCommandHandler` should write `ClientRequest` "in the same transaction as the command". It already does.
     - `TransactionBehavior` wraps `IdentifiedCommand` (`Extensions.cs:39-41`, `TransactionBehavior.cs:27-53`).
     - `RequestManager` saves on the same context (`RequestManager.cs:36`).
     - The inner `Send` reuses the open transaction (`TransactionBehavior.cs:27-30`).
   - The ID stays behind because the handler swallows the exception (`IdentifiedCommandHandler.cs:99-102`). The outer transaction then commits. The fix is to stop swallowing, not to move the write.
   - The same swallow defeats step 5 for Ordering. Failures inside the wrapper never reach a dead-letter queue, and step 4's wrapper routing (ARCH-03) inherits the problem.
   - The proposed check "WebApp checks the `CreateOrder` status" detects nothing, because Ordering returns 200 even when the command failed (`OrdersApi.cs:157-166`, always `TypedResults.Ok()`). The verify step "Force Ordering to return 500" cannot happen on a handled failure. No card or step mentions the Ordering side.

3. **Weak spot 4 and step 10: the impact claim "full card data, CVV included" is stronger than the code shows.**
   - Seeded card numbers are masked placeholders (`src/Identity.API/UsersSeed.cs:18,63`).
   - Identity.API has no registration controller (grep: only `RegisterViewModel`).
   - WebApp ignores the claims and sends its own hard-coded card (`BasketState.cs:100-103`).
   - The design risk is real, but "High" rests on data that the shipped code does not put there.
   - Step 10's "readers of `card_*` claims are not known" is answerable. MAUI reads them (`src/ClientApp/Services/Identity/IdentityService.cs:85-88`). Removing the claims breaks that client.
   - Step 10's goal "no card data in logs" is not backed by any card. The CVV is logged in clear in three places (see ORD-05). Weak spot 4 omits this.

4. **Step 13 and the "Webhooks" runner-up say there is no retry or timeout.**
   - The default HttpClient pipeline already adds both (`src/eShop.ServiceDefaults/Extensions.cs:22-29`, used by `Webhooks.API/Program.cs:3`).
   - Step 13's "add a per-call timeout ... retry with backoff" is partly redundant. The standard handler may retry POSTs, so a duplicate hook is a bigger risk than a missing retry. The step should be reframed around dedup (step 4) and a delivery log.
   - The grant handshake "limits" the SSRF (WHK-26) less than stated. With no token it accepts any 2xx OPTIONS response (`GrantUrlTesterService.cs:22-27`).

5. **Step 6's risk "Old rows whose event type was renamed resolve to null (EVT-59)".**
   - A null type makes `JsonSerializer.Deserialize` throw (`IntegrationEventLogEntry.cs:37`). A relay that retrieves a batch would fail on one stale row. "Log and park them" is right, but it must happen at the row level before deserialisation.

6. **Step 6's "the saga re-drive in step 12 covers it" (PaymentProcessor publish gap).**
   - Step 12 re-drives only the Submitted step, and it only "flags" orders stuck in AwaitingValidation or StockConfirmed. It does not re-publish a lost payment event.

7. **Principles section is internally inconsistent.**
   - It says steps 2, 3 and 9 to 11 are independent of steps 4 to 8. Step 3 feeds step 4 in both the diagram edge `s3 --> s4` and the step 4 text ("depends on step 3's fix").
   - Step 12 is referenced as the answer for step 6 but sits outside the dependency chain.

8. **Open questions that the code already answers.**
   - Payment-failed path (sequence diagram note; step 7, second bullet): the handler sends `CancelOrderCommand` (`OrderPaymentFailedIntegrationEventHandler.cs:12`). `SetCancelledStatus` raises `OrderCancelledDomainEvent` (`Order.cs:142-153`), and the Cancelled integration event is published (`OrderCancelledDomainEventHandler.cs:30-31`). Step 7's "confirm" item is already satisfied. Only the stock-rejected path lacks the event.
   - `PUT /ship` caller: nothing in `src/` (all `*.cs`) calls it. It is an unused manual endpoint, which matters for the Shipped webhook and for flow completeness.

9. **Weak spot 5 severity rationale.**
   - "Medium because it requires a failure on the create path first (ORD-27)" ignores the second list item. The basket is deleted on `OrderStarted` and not restored on stock rejection or payment failure (BAS-23, EVT-51). That needs no create-path failure.

10. **Step 4: derive the outgoing event ID from the incoming one (EVT-31).**
    - The outbox key is the event ID (`src/IntegrationEventLogEF/IntegrationLogExtensions.cs:11`). A redelivery would insert the same key again and throw inside `SaveEventAndCatalogContextChangesAsync`. The step needs explicit conflict handling to be idempotent.

11. **Step 9: "enable audience validation using the `Identity:Audience` values the services already have".**
    - The `ApiResource` entries are defined with no scopes (`src/Identity.API/Configuration/Config.cs:10-12`). That Identity may not issue the `aud` values the APIs expect. The risk list covers missing audiences only for unregistered scopes (`mobileshoppingagg`, `webshoppingagg`). The log-only phase is the right mitigation, but "values the services already have" implies a prerequisite that the code does not show is met.

Conclusions that the evidence does support: weak spots 1, 2 and 3 as stated, including ARCH-01 through ARCH-03, the sequence diagram, and the container diagram.

## Re-check (round 2)

- Commit: dde18d6 (overview revised in the working tree; `overview.md` shows as modified).
- Scope: the 30 rows of the overview's "Revision log", the new claims ARCH-04 to ARCH-15, and the text those changes touch (steps 2, 3, 4, 6, 10, 13 and the sections around them). Unchanged parts were not re-verified.
- Verdicts: FIXED = the original finding is gone and the new text is supported by the code. STILL UNSUPPORTED = the new text again states something the code does not show. NEW PROBLEM = the change introduces, or exposes in the touched text, a statement the code contradicts or a step that would not work.
- The revision log says "No finding was disputed". Nothing in the code needed a dispute ruling.
- Limit of this check: I cannot run the application. Statements that rest on framework behaviour (Duende `aud` handling, `Microsoft.Extensions.Logging` formatting, minimal-API header binding) are marked as such.

### Revision log items

| Row | Verdict | Evidence and note |
|---|---|---|
| 1 | FIXED | ARCH-04 holds. `AuthenticationExtensions.cs:22-28` returns silently without an `Identity` section. `:35-36` need `Url` and `Audience` (inside the `AddJwtBearer` options lambda, so they fail on first use, not at registration). `AppHost.cs:38-40` gives catalog-api no `Identity__Url`; `:35,46,59` give it to basket, ordering, webhooks. The grep over `src/**/appsettings*.json` for `"Identity"` finds only `Basket.API:17`, `Ordering.API:29`, `Webhooks.API:29`. Step 2(b) now adds config, wiring and a fail-closed rule. But see N1: step 2(a) does not work. |
| 2 | FIXED | `Config.cs:10-12` (`ApiResource` with no scopes) and `:22-24` (scopes `orders`, `basket`, `webhooks` only). No admin role or catalog scope exists. Leaving the policy claim open is correct. |
| 3 | FIXED | ARCH-05 holds. `Extensions.cs:39-41` registers Logging, Validator, Transaction in that order. `TransactionBehavior.cs:27-30` reuses an open transaction; `:38-47` commits it. `RequestManager.cs:34-36` adds and saves on the same context. `IdentifiedCommandHandler.cs:48` writes the row, `:87` sends the inner command, `:99-102` swallows. `ValidatorBehavior.cs:32` throws `OrderingDomainException` inside the inner `Send`, so it is swallowed too. `OrdersApi.cs:155-166` returns `Ok()` on both branches; `:41-46` and `:70-75` return 500 on `false`. Step 3's fix (remove the swallow) matches the code. A propagating exception skips `CommitTransactionAsync` (`TransactionBehavior.cs:47`), so the outer transaction is disposed without commit. |
| 4 | FIXED | A command that fails validation reaches `ValidatorBehavior.cs:32`, is swallowed, and `OrdersApi.cs:157-166` returns 200. The new verify item can be run. |
| 5 | FIXED | Wrappers exist for every event-driven command: `SetAwaitingValidation...`, `SetStockConfirmed...`, `SetStockRejected...`, `SetPaid...` (`Commands/*Handler.cs`), and `CancelOrderIdentifiedCommandHandler` (`CancelOrderCommandHandler.cs:34`). The five event handlers send plain commands (`OrderStockConfirmedIntegrationEventHandler.cs:21` and the others), so ARCH-03 and EVT-41 hold. Minor imprecision: the principles say that until step 3, "step 5's dead-letter queue cannot see Ordering failures". Today the event handlers send plain commands, so their failures do reach the consumer. It is true only after step 4 routes them through the wrapper. The order 3, 4, 5 makes this harmless. |
| 6 | FIXED | ARCH-08: `UsersSeed.cs:18,63` masked numbers, `:30,75` CVV `"123"`/`"456"`, `:33,78` the `CreateAsync` calls. `ExternalController.cs:200-204` creates a user with only `UserName`. The grep for `CardNumber` and `SecurityNumber` finds no other writer in Identity.API. `ProfileService.cs:70-80` is the producer. Readers of `card_*`: only `ClientApp/Services/Identity/IdentityService.cs:85-88`. `BasketState.cs:100-103` sends a hard-coded card. ARCH-09: `src/Identity.API/tempkey.jwk` exists, `Identity.API.csproj:50` copies it, `Program.cs:29,37` match. Neither `.gitignore` (root, `src/Identity.API/.gitignore`) has a matching pattern. Token claims for `maui`, `webapp`, `webhooksclient` go into the ID token (`Config.cs:72,89,125`). The conditional wording about the signing key is right: no repository code shows that `AddDeveloperSigningCredential` loads this file. |
| 7 | FIXED | `IdentityService.cs:85-88` reads `card_number`, `card_holder`, `card_security_number`. Step 10 orders the changes correctly. |
| 8 | STILL UNSUPPORTED (partly) | ARCH-07 says the CVV is logged "in clear" by four `{@Command}` log calls. The code does not show that. The repository has no Serilog or other destructuring logger (grep for `Serilog|Destructur` over `*.cs`, `*.csproj`, `*.props`: no match). Logging is `Microsoft.Extensions.Logging` plus OpenTelemetry with only `IncludeFormattedMessage` and `IncludeScopes` (`ServiceDefaults/Extensions.cs:52-56`). `IdentifiedCommand` (`IdentifiedCommand.cs:3`) and `CreateOrderCommand` (`CreateOrderCommand.cs:16`) are plain classes with no `ToString` override. With the default logger, `{@Command}` is formatted with `ToString()`, so the message shows a type name, not `CardSecurityNumber`. This is framework behaviour that I did not run; the overview and round 1 (the ORD-05 verdict) both assumed the opposite without showing a serializer. What does hold: line `OrdersApi.cs:134` logs `CreateOrderRequest`, which is a `record` (`OrdersApi.cs:171-185`), so its generated `ToString` prints `CardNumber` and `CardSecurityNumber` in clear. Two further defects: (1) `[FromHeader] Guid requestId` is non-nullable (`OrdersApi.cs:119`), so a missing header is normally rejected by the framework before the handler runs; the `Guid.Empty` branch at `:132-136` fires when the header is the all-zero GUID, not when it is "missing" (framework behaviour, not run). (2) The log list is incomplete: `ValidatorBehavior.cs:30` also logs `{@Command}` on a validation failure, and `IdentifiedCommandHandler.cs:89-95` logs it again after the command. Step 10's list of places to fix omits `ValidatorBehavior`. The claim "CVV in clear on the normal create path" and step 10's framing should be rewritten as "the code passes the command object to the logger; whether the fields are written depends on the logging provider, which is not configured here". |
| 9 | FIXED | ARCH-10: `ServiceDefaults/Extensions.cs:22-29` adds `AddStandardResilienceHandler`; `Webhooks.API/Program.cs:3` calls `AddServiceDefaults`; `WebhooksSender.cs:7` uses `CreateClient()`, `:10` `Task.WhenAll`, `:32` returns `SendAsync` without a status check. `GrantUrlTesterService.cs:22-27` as described. The runner-up also keeps the same-origin check (`:7`, `:37-45`), so "any URL" means any URL on the hook's origin; the overview states that. |
| 10 | FIXED | No options are passed to `AddStandardResilienceHandler()` (`Extensions.cs:25`). "Can replay a POST" is hedged and the decision is left to the step. |
| 11 | FIXED | `GrantUrlTesterService.cs:23` (`tokenExpected` null for an empty token) and `:27`. Step 13 requires a token. |
| 12 | FIXED | ARCH-11: `IntegrationEventLogService.cs:27-28` (lazy `Select`, `FirstOrDefault` returns null), `IntegrationEventLogEntry.cs:35-37` passes the null `Type` to `JsonSerializer.Deserialize`, which throws; the batch is filtered by `TransactionId` and `NotPublished` (`:22`). The step 6 plan (resolve first, park) matches. |
| 13 | NEW PROBLEM | The gap is no longer claimed as closed (`PaymentProcessor` publishes with `eventBus.PublishAsync` directly, `OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs:32`; no storage, `AppHost.cs:53-54`). But option 2 in step 6 says Ordering's "status guard drops the extra result (EVT-47)". That is true only for a duplicate `PaymentSucceeded`: `Order.SetPaidStatus` does nothing unless the status is StockConfirmed (`Order.cs:119-128`). For a duplicate `PaymentFailed`, the handler sends the plain `CancelOrderCommand` (`OrderPaymentFailedIntegrationEventHandler.cs:12,21`, no wrapper), and `SetCancelledStatus` has no guard against Cancelled (`Order.cs:142-153`: it throws only for Paid and Shipped). It sets Cancelled again and raises `OrderCancelledDomainEvent`, so a second `OrderStatusChangedToCancelledIntegrationEvent` is saved and published (`OrderCancelledDomainEventHandler.cs:30-31`). After a Paid order, a late `PaymentFailed` throws. The outcome can also change between the two sends, because `PaymentSucceeded` is read live from `IOptionsMonitor` (`OrderStatusChangedToStockConfirmedIntegrationEventHandler.cs:21`). The precondition "safe only while the guard drops the extra result" therefore does not hold for the failure outcome. |
| 14 | FIXED | The principles now match the diagram edges (`s1 --> s4 --> s5 --> s6 --> s7 --> s8`, `s3 --> s4`, `s4 --> s13`). Note: no step text says why 5 precedes 6 or 6 precedes 7. Step 6 says only step 4 must come first, and step 7 is needed by step 8 only. The chain over-constrains, which is a design choice and not a code error. "Step 1 comes first" is drawn only as an edge to step 4. |
| 15 | FIXED | ARCH-13: `OrderPaymentFailedIntegrationEventHandler.cs:12,21`; `CancelOrderCommandHandler.cs:27-28`; `Order.cs:142-153`; `OrderCancelledDomainEventHandler.cs:30-31`. `Order.cs:155-168` raises no event for stock rejection, so "no Cancelled event" in the diagram is right. |
| 16 | FIXED | ARCH-14: no caller in `src/`. Grep for `/ship` and `ShipOrder` over `*.cs`, `*.razor`, `*.cshtml`, `*.ts`, `*.js`, `*.json` finds only Ordering.API's own endpoint, command, validator and handlers in `src/`; `SetShippedStatus` is called only from `ShipOrderCommandHandler.cs:27`. Note: the same grep over the whole repository also matches tests (`tests/Ordering.FunctionalTests/OrderingApiTests.cs:76,91`, `tests/Ordering.UnitTests/Application/OrdersWebApiTest.cs`). The claim is stated for `src/`, so it holds, but the log-row wording "a grep of `*.cs`" should say `src/**/*.cs`. |
| 17 | FIXED | The new rationale rests on BAS-23 and EVT-51 (confirmed in round 1) and on ARCH-06 (`OrdersApi.cs:166`). Severity is a judgement; the reasoning is no longer inconsistent with the code. |
| 18 | FIXED | ARCH-12: `IntegrationLogExtensions.cs:11` (`HasKey(e => e.EventId)`); `OrderStatusChangedToAwaitingValidationIntegrationEventHandler.cs:31` calls `SaveEventAndCatalogContextChangesAsync`, which adds the row (`CatalogIntegrationEventService.cs:28-39`). `IntegrationEvent.Id` has a public setter (`EventBus/Events/IntegrationEvent.cs:12`), so a deterministic ID is possible. The conflict handling in step 4 is needed and correct. |
| 19 | FIXED | ARCH-15: `Config.cs:10-12` and `:22-24`; audiences at `Ordering.API/appsettings.json:30`, `Basket.API/appsettings.json:18`, `Webhooks.API/appsettings.json:31`. The overview does not claim whether tokens carry `aud`. `AuthenticationExtensions.cs:49` sets `ValidateAudience = false`, so the log-only gate is the right order. |
| 20 | FIXED | Hedged; no claim either way. |
| 21 | FIXED | ORD-05 appears in the overview only in the reconciliation list and the revision log (grep). The replacement claim (ARCH-07) is assessed in row 8. |
| 22 | FIXED | EVT-59 appears only in the reconciliation list and the log. Step 6 and the event-contracts runner-up use ARCH-11. |
| 23 | FIXED | WHK-29 and EVT-38 are cited only for `Task.WhenAll` and the missing status check (overview lines 313, 520). |
| 24 | FIXED | `OrderProcessor/Program.cs:3` uses `AddBasicServiceDefaults`; `PaymentProcessor/Program.cs:3` uses `AddServiceDefaults`. Neither calls `AddDefaultAuthentication` (grep of `src/**/*.cs`: callers are Ordering, Webhooks, Basket only). |
| 25 | FIXED | Only the producing side of IDN-22 is cited (lines 285, 480). |
| 26 | FIXED | WHK-37, IDN-21 and WEB-28 appear only in the reconciliation list (grep). |
| 27 | NEW PROBLEM (minor) | The claim holds: `Order.cs:52-65` passes the card data to `AddOrderStartedDomainEvent`, and `Order` has no card fields (`Order.cs:8-35`). But step 10 now says "Stop passing the CVV into `OrderStartedDomainEvent`" with no mention of the consequence. The handler passes it on to `Buyer.VerifyOrAddPaymentMethod` (`ValidateOrAddBuyerAggregateWhenOrderStartedDomainEventHandler.cs:34-40`), and the `PaymentMethod` constructor throws `OrderingDomainException` when the CVV is empty (`PaymentMethod.cs:24`). The step must also change that constructor and the buyer method, or order creation will fail. |
| 28 | FIXED | `Identity.API.csproj:50` is the only reference to the file (grep for `tempkey` outside `*.md`). Removing it from the project and the repository is a valid step. |
| 29 | FIXED | See row 6. The conditional wording in 3.4 matches the code. |
| 30 | FIXED | `OrdersApi.cs:166` returns `TypedResults.Ok()` after both branches. |

### Items found in text that the revision touched

| ID | Verdict | Evidence and note |
|---|---|---|
| N1 | NEW PROBLEM | Step 2(a), "Restrict the BFF catch-all `/api/catalog/{*any}` to GET", and its verify item "An anonymous PUT through the BFF gets no route match". No route in `Extensions.cs:93-152` has a method restriction (grep for `WithMatchMethods|Methods` in `src/eShop.AppHost`: no match). The earlier routes `/catalog-api/api/catalog/items` (`:97`) and `/catalog-api/api/catalog/items/{id}` (`:105`) strip the prefix and forward any method. Catalog's writes are `v1.MapPut("/items")` (`CatalogApi.cs:100`), `v2.MapPut("/items/{id:int}")` (`:105`), `MapPost("/items")` (`:110`) and `MapDelete("/items/{id:int}")` (`:114`). So `PUT`, `POST` and `DELETE` on `/catalog-api/api/catalog/items[/{id}]?api-version=...` still reach Catalog after the catch-all is restricted, and the verify step would fail. ARCH-01 and CAT-07 call the `/catalog-api/...` routes "read routes"; the code does not restrict them to reads. The fix is to add a method match to every catalog route, or to remove the unneeded routes. Round 1 confirmed ARCH-01 and missed this; the text predates the revision, but it is in step 2, which the revision changed. |

### Totals for the re-check

| Revision-log rows checked | FIXED | STILL UNSUPPORTED | NEW PROBLEM |
|---|---|---|---|
| 30 | 27 | 1 (row 8) | 2 (rows 13, 27) |

Extra item outside the log rows: N1, NEW PROBLEM (1). New problems in total: 3.

Rows 8, 13, 27 and item N1 are the open ones. Rejection rate for the 31 items = 4 / 31 = 12.9%.

### Per-step table (overview target steps 1 to 13)

"Before" is taken from the "Overview conclusions not supported by the evidence" section of the original verification: findings 1 to 11, mapped to the step each one names. "After" is this re-check.

| Step | Open finding before revision | Open finding after revision | Basis |
|---|---|---|---|
| 1. Make event loss visible | no | no | Not named in any original finding; unchanged. |
| 2. Close Catalog writes | yes (finding 1) | yes | Finding 1 fixed (row 1). N1: restricting only the catch-all leaves the `/catalog-api/...` routes open. |
| 3. Honest checkout | yes (findings 2, 7) | no | Rows 3, 4, 14 fixed. |
| 4. Idempotent consumers | yes (findings 2, 10) | no | Rows 5, 18 fixed. |
| 5. Dead-letter and retry | yes (finding 2) | no | Row 5 fixed. |
| 6. Outbox relay and confirms | yes (findings 5, 6) | yes | Rows 12 fixed. Row 13: option 2's "status guard drops the extra result" is wrong for `PaymentFailed`. |
| 7. Publish Cancelled on stock-rejected path | yes (finding 8) | no | Row 15 fixed. |
| 8. Stock reservation in Catalog | no | no | Not named in any original finding; unchanged. |
| 9. Audience, scope, ownership | yes (finding 11) | no | Rows 19, 20 fixed. |
| 10. Card data out of logs, tokens, events | yes (finding 3) | yes | Rows 6, 7 fixed. Row 8: CVV-in-clear via `{@Command}` not shown, `ValidatorBehavior` omitted. Row 27: `PaymentMethod.cs:24` blocks dropping the CVV. |
| 11. Production identity configuration | no | no | Row 28 fixed; hedged correctly. |
| 12. Own the grace period in Ordering | yes (findings 6, 7) | no | Rows 13 (gap claim removed), 14 fixed. |
| 13. Webhooks hardening | yes (finding 4) | no | Rows 9 to 11, 23 fixed. |

Steps with no open finding before and after: 1, 8, 11 (3 steps). Steps open before: 10 (2, 3, 4, 5, 6, 7, 9, 10, 12, 13). Steps open after: 3 (2, 6, 10). Steps closed by the revision: 7 (3, 4, 5, 7, 9, 12, 13).
