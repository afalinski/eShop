---
paths:
  - "src/Identity.API/**"
---
# Identity rules

- Identity.API is Duende IdentityServer on ASP.NET Core Identity. It publishes and handles no events (IDN-16). Clients, resources and scopes are in memory, built in `Configuration/Config.cs`, with six clients (IDN-09, IDN-13).
- API scopes are `orders`, `basket` and `webhooks`. `maui` and `webapp` are also allowed `mobileshoppingagg` and `webshoppingagg`, which are not registered anywhere (IDN-29). Adding a new API means registering its resource and scope in `Config.cs`.
- The code does not show that issued access tokens carry the `aud` values the APIs expect (ARCH-15). Do not assume audience checks work end to end without a test.
- Card number, CVV and expiration are plain properties on `ApplicationUser` and are emitted as `card_*` claims by `ProfileService` (IDN-12, IDN-23). In the shipped code the values are placeholders, and only the MAUI client reads them (ARCH-08). Do not add new readers of these claims.
- `tempkey.jwk` and `AddDeveloperSigningCredential` are development only, and the code says "TODO: Remove in production" (IDN-25, ARCH-09). Do not extend this pattern.
- Seeded users `alice` and `bob` share one hard-coded password and are seeded on every startup. Client secrets are hard-coded too (IDN-26, IDN-24). Do not reuse them elsewhere.
- Migrations run at startup, and the code comment says that is not recommended for production (IDN-27).
- The login, consent and grants UI is IdentityServer quickstart code with duplicate view models (IDN-31). Leave it unless the task is about it.
