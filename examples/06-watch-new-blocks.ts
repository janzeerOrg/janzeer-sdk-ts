import { JanzeerRpcWs } from 'janzeer-sdk';

const ws = await JanzeerRpcWs.connect(process.env.JANZEER_WS_URL ?? 'ws://localhost:7019/rpc/ws');

console.log('Subscribing to new blocks...');

await ws.subscribeNewBlocks({ fromHeight: 0, includeTransactions: false }, (b) => {
  console.log(`New block: height=${b.height}, hash=${b.hash}, producer=${b.producer}, txs=${b.transactionsCount}`);
});

const duration = Number(process.env.EXAMPLE_SECONDS ?? 40);
console.log(`Listening for ${duration} seconds...`);

setTimeout(() => {
  ws.close();
  process.exit(0);
}, duration * 1000);