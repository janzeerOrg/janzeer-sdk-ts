# Changelog

All notable changes to `janzeer-sdk` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [SemVer](https://semver.org/).

## [0.1.11] — 2026-11-17

### Added
- **Arabic translation of the "Sending transactions" guide**: [`docs/ar/sending-transactions.md`](docs/ar/sending-transactions.md) with right-to-left layout and localized technical terminology. Contributed by @genda-benjamin (#7). No code change.

## [0.1.10] — 2026-11-17

Verified against node **0.1.14** (REST envelope 1.1.0 / protocol 3.4.0).

### Added
- Example `examples/07-accept-payment.ts`: accept a payment. It watches an address over the WebSocket, accepts only the
  transfer whose memo and amount match the invoice, confirms it is `FINAL`, and exits non-zero on a timeout.
  Contributed by @telas929 (#6, #8).
- `JanzeerClient.close()`: a no-op (the REST client holds no connection), so code written against the Dart or Kotlin
  SDK, where `close()` matters, reads the same here.
