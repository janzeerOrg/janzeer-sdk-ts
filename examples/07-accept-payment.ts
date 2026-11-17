// Accept a payment: watch an address over WebSocket, match invoice memo and amount, confirm finality.
import { randomBytes } from 'node:crypto';
import {
  Account,
  JanzeerClient,
  JanzeerRpcWs,
  TxBuilder,
  compareAmounts,
  waitForFinality,
} from 'janzeer-sdk';

const wsUrl = process.env.JANZEER_WS_URL ?? 'ws://localhost:7019/rpc/ws';
const nodeUrl = process.env.JANZEER_NODE_URL ?? 'http://localhost:7019';
const recipient = process.env.JANZEER_E2E_RECIPIENT ?? '0x598b1301acef3baba6ce25e38dd17b723f7b98b1';
const invoiceAmount = '0.5';
const reference = `inv-${randomBytes(3).toString('hex')}`;
const timeoutSeconds = Number(process.env.EXAMPLE_SECONDS ?? 90);

console.log(`waiting for payment: ${reference} ${invoiceAmount} JNZ to ${recipient} (timeout ${timeoutSeconds}s)`);

const ws = await JanzeerRpcWs.connect(wsUrl);
let handled = false;

const timeout = setTimeout(() => {
  if (!handled) {
    console.error(`timeout: no matching payment received within ${timeoutSeconds} seconds`);
    ws.close();
    process.exit(1);
  }
}, timeoutSeconds * 1000);

const sub = await ws.subscribeAddressActivity([recipient], async (ev) => {
  const tx = ev.transaction;
  if (
    tx.type === 'transfer' &&
    tx.recipientAddress?.toLowerCase() === recipient.toLowerCase() &&
    tx.data === reference &&
    tx.amount &&
    compareAmounts(tx.amount, invoiceAmount) >= 0
  ) {
    handled = true;
    try {
      const final = await waitForFinality(ws, tx.hash);
      if (final.status === 'FINAL') {
        clearTimeout(timeout);
        console.log(`paid: ${reference} ${invoiceAmount} JNZ in block ${final.blockHeight}`);
        await sub.unsubscribe();
        ws.close();
        process.exit(0);
      } else {
        clearTimeout(timeout);
        console.error(`payment transaction ${tx.hash} ended with non-final status: ${final.status}`);
        await sub.unsubscribe();
        ws.close();
        process.exit(1);
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error(`waitForFinality failed: ${err}`);
      await sub.unsubscribe();
      ws.close();
      process.exit(1);
    }
  }
});

// Pay invoice from test wallet so the example runs unattended
const payer = Account.fromMnemonic(
  process.env.JANZEER_E2E_MNEMONIC ??
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
);
const client = new JanzeerClient(nodeUrl);
const nonce = await client.nonce(payer.address);
const tx = payer.signTx(
  TxBuilder.transfer({
    from: payer.address,
    to: recipient,
    amount: invoiceAmount,
    data: reference,
    nonce,
  }),
);
await client.submit(tx);
client.close();
console.log(`invoice payment submitted: tx ${tx.hash}`);
