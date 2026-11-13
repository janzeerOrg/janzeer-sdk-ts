# janzeer-sdk

Official TypeScript SDK for the [Janzeer](https://janzeer.org) blockchain — a stake-free, permissionless
Layer-1 with instant finality. Wallet keys and signing, transaction builders, a typed REST client, JSON-RPC over
HTTP and WebSocket subscriptions. Non-custodial by construction: keys never leave your process, the node only
verifies.

[![npm](https://img.shields.io/npm/v/janzeer-sdk)](https://www.npmjs.com/package/janzeer-sdk)
![license](https://img.shields.io/badge/license-Apache--2.0-blue)

```bash
npm install janzeer-sdk
```

> The package is unscoped on purpose: `janzeer-sdk` is the same name as on PyPI, next to `janzeer_sdk` on pub.dev and
> `org.janzeer:janzeer-sdk-core` on Maven Central. Installing a tag straight from GitHub also works (the `prepare`
> script builds `dist/`): `npm install github:janzeerOrg/janzeer-sdk-ts#v0.1.8`.

## 60-second quickstart

```ts
import { Account, JanzeerClient, JanzeerRpc, TxBuilder, formatJnz, waitForFinality } from 'janzeer-sdk';

const client = new JanzeerClient('http://localhost:7019');          // REST  (/api/v1)
const rpc    = new JanzeerRpc('http://localhost:7019');             // JSON-RPC (/rpc)
const me     = Account.fromMnemonic('abandon abandon … about');    // 12/24-word BIP39 phrase

console.log(me.checksumAddress, formatJnz(await client.balance(me.address)));

const tx = me.signTx(TxBuilder.transfer({
  from: me.address, to: '0x598b1301acef3baba6ce25e38dd17b723f7b98b1',
  amount: '1.25', data: 'hello', nonce: await rpc.getNonce(me.address)
}));
const hash = await rpc.send(tx);
await waitForFinality(client, hash);
```

## Examples

The `examples/` directory contains ready-to-run scripts:

* [Quickstart Transfer](./examples/01-quickstart-transfer.ts): The 60-second quickstart above.
* [Address Activity](./examples/02-subscribe-address-activity.ts): Watch an address for incoming/outgoing transactions.
* [Token Lifecycle](./examples/03-token-create-and-transfer.ts): Create a new token and transfer it.
* [Validator Registration](./examples/04-register-validator.ts): Register a new validator on the network.
* [Vault Roundtrip](./examples/05-vault-roundtrip.ts): Deposit and withdraw from a vault.
* [Watch New Blocks](./examples/06-watch-new-blocks.ts): Subscribe to the blockchain feed and print finalized blocks.

Run them with:
```bash
JANZEER_NODE_URL=http://localhost:7019 npm run examples
```

## JSON-RPC and subscriptions

The node serves JSON-RPC 2.0 at `POST /rpc` and over WebSocket at `/rpc/ws` (same methods, plus
subscriptions). `JanzeerRpc` and `JanzeerRpcWs` expose **one typed method per `janzeer_*` method**; `call()`
sends anything else.
