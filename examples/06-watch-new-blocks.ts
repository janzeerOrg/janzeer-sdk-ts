// Watch the blockchain for new finalized blocks over WebSocket.
import { JanzeerRpcWs } from 'janzeer-sdk';

const url = process.env.JANZEER_WS_URL ?? 'wss://explorer.janzeer.org/rpc/ws';
const seconds = Number(process.env.EXAMPLE_SECONDS ?? 20);
const maxBlocks = Number(process.env.EXAMPLE_BLOCKS ?? 0);

const ws = await JanzeerRpcWs.connect(url, {
  onEvent: (e) => e.type === 'error' && console.error('[ws] error', e),
});

const tip = await ws.getTip();
let seen = 0;

const stop = () => {
  clearTimeout(timer);
  ws.close();
  process.exit(0);
};

const timer = setTimeout(stop, seconds * 1000);
process.on('SIGINT', stop);

await ws.subscribeNewBlocks({ fromHeight: tip.height, includeTransactions: false }, (b) => {
  console.log(`block #${b.height} | hash ${b.hash.slice(0, 12)} | producer ${b.producer.slice(0, 12)} | txs ${b.transactionsCount}`);
  seen += 1;
  if (maxBlocks > 0 && seen >= maxBlocks) {
    stop();
  }
});

console.log(`listening on ${url} from #${tip.height} (maxBlocks=${maxBlocks || 'unlimited'}, timeout=${seconds}s)...`);
