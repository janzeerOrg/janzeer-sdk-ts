# Changelog

All notable changes to `janzeer-sdk` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [SemVer](https://semver.org/).

## [0.1.6] — 2026-11-11

Reliability fixes from a code review. Node pin unchanged (**0.1.12**, REST envelope 1.1.0 / protocol 3.4.0). No API change.

- **`waitForFinality` / `sendAndWait` over REST survives a dropped poll.** One transport error while polling (the transaction was already accepted) used to surface as a network error — which a caller can mistake for a failed send and resend. The REST branch now retries until the deadline, like the JSON-RPC branch.
- **WebSocket, one reconnect chain.** Every failed open scheduled its own endless retry: `JanzeerRpcWs.connect()` to a node that was down threw, yet the object the caller never received kept reconnecting in the background, and each `call()` during an outage added another chain. There is now a single pending attempt, and a failed `connect()` closes the client.
- **WebSocket, resume after a reconnect.** A `newBlocks` stream now resumes right after the last block it delivered. It used to re-send the original `fromHeight`, so the node replayed every block again (thousands of duplicates on a long-lived stream), and a stream without `fromHeight` silently skipped the blocks committed during the outage. Blocks are delivered exactly once by height.
- **WebSocket, a failed resubscribe is retried.** A subscription whose re-creation failed (the socket dropped again, a call timed out) was removed for good with an `error` event as the only trace. It now stays registered and is re-created on the next attempt.
- **WebSocket, no lost first notification.** A notification that arrives before its subscription id is registered is held and delivered once the subscribe call returns.

## [0.1.5] — 2026-11-09

Verified against node **0.1.12** (REST envelope 1.1.0 / protocol 3.4.0). No API change.

- `SPEC_VERSION.node` is **0.1.12** (node critical fix F-058: GraalVM native nodes could not sync across a block carrying a token transaction, fixed in 0.1.12 with a build-time guard; API 1.1.0 / protocol 3.4.0 unchanged).

## [0.1.4] — 2026-11-04

Verified against node **0.1.11** (REST envelope 1.1.0 / protocol 3.4.0). **First release on npm: `npm install janzeer-sdk`.**

- The package is published as **`janzeer-sdk`** (unscoped) — the same name as on PyPI, next to `janzeer_sdk` on pub.dev and `janzeer-sdk-core` on Maven Central. Every import changes from `@janzeer/sdk[/sub]` to `janzeer-sdk[/sub]`; nothing else in the API moved. (The `@janzeer` scope belongs to an npm account that is locked out of its own mailbox; waiting for npm support ended here.)
- No code change otherwise.

## [0.1.3] — 2026-11-01

Verified against node **0.1.11** (REST envelope 1.1.0 / protocol 3.4.0). Not on npm yet: `npm install github:janzeerOrg/janzeer-sdk-ts#v0.1.3`.

- `SPEC_VERSION.node` is **0.1.11** (node maintenance release: the `jz` command-line client ships in the node bundle; `GET /info/version` now returns `version`, `apiVersion` and `protocolVersion` like `/info`). No SDK API change.

## [0.1.2] — 2026-10-28

Verified against node **0.1.10** (REST envelope 1.1.0 / protocol 3.4.0). Not on npm yet: `npm install github:janzeerOrg/janzeer-sdk-ts#v0.1.2`.

- `SPEC_VERSION.protocol` now says **3.4.0**, the wire protocol the node has run since 0.1.0 (it was left at 3.2.0; informational only).
- Add the typed JSON-RPC `getGenesis()` method for `janzeer_getGenesis`.
- Minimum Node.js is now **20**: Node 18 is end-of-life and has no global WebCrypto, which the vault (random salt and IV) needs.
- `npm run typecheck` no longer needs a build first (the examples resolve `janzeer-sdk` to the sources).
- Verified against node **0.1.0** (P2P protocol 3.4.0): `SPEC_VERSION.node` bumped from 0.0.3. No API change for SDK users. New node rule worth knowing: a transaction's `timestamp` must be within 60 s ahead / 6 h behind the node's clock — sign right before you send.

## Versioning policy

- **MAJOR** — a change in the signed preimage, hashing, derivation or the REST envelope that makes older
  releases produce transactions a node rejects, or a breaking TypeScript API change.
- **MINOR** — new node methods, fields or SDK features; existing code keeps working.
- **PATCH** — fixes and documentation.

Each release states the node / API / protocol versions it was tested against (`SPEC_VERSION`).

## [0.1.1] — 2026-09-14

### Added
- `NodeInfo` (REST `info()`) now carries `networkId`, `genesisHash`, `chainSpecDigest`, `version`, `apiVersion`, `protocolVersion`, `syncStatus` and `faucet` (node 0.0.3); older nodes are tolerated (defaults). Read `info().networkId` and pass it as `networkId` to the builders to work on the public testnet (`janzeer-testnet`).

### Changed
- `SPEC_VERSION`: node `0.0.3`, protocol `3.2.0`.

## [0.1.0] — 2026-09-14

First release.

- Keys: BIP39 mnemonics, Janzeer seed + `m/0/0/0` derivation, `Account` (mnemonic / private key / seed),
  canonical + EIP-55 addresses.
- Transactions: `TxBuilder` for transfer, validator registration/exit and all five JZT-1 token operations;
  `UnsignedTx` (preimage, hash) → `SignedTx` (REST body / RPC params). Local validation of amounts, memo size and
  exact validator fees.
- REST: `JanzeerClient` with typed models for every `/api/v1` endpoint, lossless number parsing, envelope
  unwrapping, 404 → empty/`null`, one automatic retry on 429.
- JSON-RPC: `JanzeerRpc` (HTTP, batches) and `JanzeerRpcWs` (WebSocket, auto-reconnect with re-subscription,
  `newBlocks` / `addressActivity` feeds), one typed method per `janzeer_*` method.
- Helpers: `waitForFinality` (server long-poll or REST polling), `sendAndWait`, `nextNonce`.
- Errors: `TxRejectedError` / `NonceMismatchError` shared by both transports, `RateLimitedError`,
  `NotSynchronizedError`, `RpcError` family.
- Vault: PBKDF2-SHA256/250k + AES-256-GCM, cross-SDK fixture.
- Compat: `janzeer-sdk/crypto` re-exports the `janzeerCrypto.js` function API; `toPlainNumbers` converts a lossless tree to `JSON.parse` shapes for migrating code.
- Tested against node 0.0.2 / API 1.1.0 / protocol 3.1.0 / vectors v2.
