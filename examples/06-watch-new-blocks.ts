// Watch the blockchain for new finalized blocks over WebSocket.
import { JanzeerRpcWs } from 'janzeer-sdk';

const url = process.env.JANZEER_WS_URL ?? 'wss://explorer.janzeer.org/rpc/ws';
const seconds = Number(process.env.EXAMPLE_SECONDS ?? 20);

console.log(`Connecting to ${url}...`);
const ws = await JanzeerRpcWs.connect(url, {
  onEvent: (e) => e.type === 'error' && console.error('[ws] error', e),
});

const tip = await ws.getTip();
console.log(`Current height: ${tip.height}. Subscribing to new blocks...`);

await ws.subscribeNewBlocks({ fromHeight: tip.height, includeTransactions: false }, (b) => {
  console.log(
    `Block #${b.height} | Hash: ${b.hash.slice(0, 12)}... | Producer: ${b.producer.slice(0, 12)}... | Txs: ${b.transactionsCount}`
  );
});

console.log(`Listening... (exiting in ${seconds}s)`);

const timer = setTimeout(() => {
  ws.close();
  process.exit(0);
}, seconds * 1000);

process.on('SIGINT', () => {
  clearTimeout(timer);
  ws.close();
  process.exit(0);
});
