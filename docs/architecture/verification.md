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
