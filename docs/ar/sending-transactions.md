<div dir="rtl">

# إرسال المعاملات

تُبنى كل معاملة محليًا، وتُوقَّع محليًا، وتُرسَل بصيغة JSON. تُعيد العقدة التحقق من البصمة والتوقيع، وتطابق المرسل/المفتاح العام، والرقم التسلسلي (nonce)، والرصيد والرسوم، فإما أن تقبلها في مجمع المعاملات (mempool) (HTTP 201 / عبر RPC ‏`{hash, status: "PENDING"}`) أو ترفضها مع سبب مصنَّف.

```ts
const unsigned = TxBuilder.transfer({ from: me.address, to, amount: '1.25', nonce });
const signed   = me.signTx(unsigned);       // SignedTx: hash, signature, senderPublicKey
await client.submit(signed);                // REST
await rpc.send(signed);                     // or JSON-RPC — same body, same result
```

## الأرقام التسلسلية (nonce)

لكل مرسل رقم تسلسلي (nonce) يجب أن يكون متتاليًا. تُرجع الدالة `client.nonce(address)` (أو `rpc.getAccount(address).nextNonce`) **الرقم التسلسلي المثبت + عدد المعاملات المعلقة**، بحيث يمكنك إرسال عدة معاملات على التوالي قبل نهائية الأولى: الرقم التسلسلي (nonce) ‏`n`‏، ‏`n+1`‏، ‏`n+2`‏… يُرفَض أي فجوة أو إعادة تشغيل مع `NonceMismatchError { expected, got }` — اقرأ `expected` وأعِد البناء وأعِد الإرسال.

إرسال *المعاملة الموقعة نفسها* مرتين غير ضار: تجيب العقدة `PENDING` مرة أخرى (عدم التكرار حسب البصمة).

## معرّف الشبكة — الشبكة الرئيسية مقابل شبكة اختبار خاصة

تُوقَّع كل معاملة لشبكة واحدة: `consensus.network-id` هو الحقل الأول في الصورة المسبقة، لذلك تُرفَض المعاملة المبنية لشبكة `janzeer` (الشبكة الرئيسية) من عقدة شبكة اختبار خاصة (`janzeer-testnet`) والعكس صحيح — لا توجد شبكة اختبار عامة. تستخدم أدوات البناء افتراضيًا `NETWORK_ID` (`"janzeer"`)؛ وعندما يمكن لتطبيقك الاتصال بشبكة اختبار خاصة، اقرأ المعرّف من العقدة مرة واحدة ومرّره إلى كل أداة بناء:

```ts
const info = await client.info();               // { networkId, genesisHash, version, syncStatus, faucet, … }
const tx = acct.signTx(TxBuilder.transfer({ from: acct.address, to, amount: '1.25', nonce, networkId: info.networkId }));
```

يكون `info.faucet` بقيمة `true` على عقدة شبكة اختبار تشغّل صنبورًا (`POST /api/v1/faucet`).

## الرسوم والحدود

| معاملة | رسوم | قاعدة أخرى |
|---|---|---|
| transfer | ‏≥ `MIN_FEE` (0.01) | المبلغ ‏≥ `MIN_TRANSFER` (0.1) ما لم توجد مذكرة؛ المذكرة ‏≤ 256 بايت UTF-8 |
| registerValidator | ‏تساوي تمامًا `VALIDATOR_FEE` (3) | إيداع يساوي تمامًا `VALIDATOR_DEPOSIT` (2000)، **غير قابل للاسترداد** |
| exitValidator | ‏≥ 0.01 | — |
| token.create | ‏تساوي تمامًا `TOKEN_CREATE_FEE` (5) | يجب أن يكون المرسل محفظة مُصادِق |
| token.mint / burn / setCap / transfer | ‏≥ 0.01 | mint/burn/setCap للمُصدِر فقط |

يملأ `TxBuilder` الرسم الافتراضي ويرفض محليًا أي شيء سترفضه العقدة لهذه الأسباب، فتحصل على `RangeError` مع رسالة واضحة بدلًا من خطأ 400. تُرجع الدالة `rpc.estimateFee(kind)` الأرقام نفسها من العقدة (`rule: "minimum" | "exact"`). لا توجد سوق رسوم.

## المبالغ

مبالغ العملة هي **سلاسل عشرية** (`'1.25'`). داخليًا تُضخَّم بمقدار 10^8 إلى عدد صحيح (`toScaledLong('1.25') === 125_000_000n`)، وهو ما يُوقَّع. الدوال المساعدة:

```ts
formatJnz('1.50000000')                  // '1.5 JNZ'
formatJnz('1234.5', { group: true })     // '1,234.5 JNZ'
parseJnz('1,234.5 JNZ')                  // '1234.5'
addAmounts('1.25', '0.01')               // '1.26000000'
compareAmounts('0.1', '0.10')            // 0
```

لا تُجرِ أبدًا عمليات حسابية بأعداد عشرية عائمة على المبالغ؛ أي `number` بأكثر من 15 رقمًا معنويًا هو خطأ أصلًا.

## التحويل

```ts
TxBuilder.transfer({ from, to, amount: '1.25', data: 'invoice 42', nonce, fee: '0.01', timestamp: Date.now() });
```

`data` مذكرة اختيارية (≤ 256 بايت). مع وجود مذكرة قد يكون المبلغ أقل من 0.1، وحتى `'0'`، مما يجعل التحويل ملاحظة رخيصة على السلسلة.

## تسجيل المُصادِق وخروجه

```ts
const validatorKey = (await client.info()).nodeKey;              // the node's public key
TxBuilder.registerValidator({ from, validatorKey, nonce });       // fee 3, deposit 2000 (non-refundable)
TxBuilder.exitValidator({ from, validatorKey, nonce: nonce + 1 }); // removed at the next epoch
```

تصبح المحفظة التي تسجّل عقدةً هي *محفظة المُصادِق* الخاصة بها (تذهب المكافآت إليها؛ وهي وحدها التي يمكنها إنشاء الرموز).

## الرموز (JZT-1)

مبالغ الرموز هي **وحدات أساسية صحيحة** (`bigint` أو سلسلة أرقام) — أما `decimals` الخاص بالرمز فهو للعرض فقط.

```ts
const create = TxBuilder.token.create({ from, symbol: 'DEMO', name: 'Demo', decimals: 2, cap: 1_000_000n, amount: 500_000n, nonce });
const tokenId = me.signTx(create).hash;                            // for CREATE the tokenId IS the tx hash
TxBuilder.token.mint({ from, tokenId, amount: 100n, recipient, nonce });
TxBuilder.token.burn({ from, tokenId, amount: 100n, nonce });
TxBuilder.token.setCap({ from, tokenId, cap: 2_000_000n, nonce });
TxBuilder.token.transfer({ from, tokenId, amount: 12_345n, recipient, nonce });
```

## انتظار النهائية

```ts
const view = await waitForFinality(rpc, signed.hash);       // FINAL TxView with blockHeight and receipt
const view = await sendAndWait(rpc, signed, { submitVia: client }); // submit + wait in one call
```

المعاملة في كتلة مثبتة هي نهائية؛ ولا يوجد ما تنتظره بعد ذلك. انظر [json-rpc-and-subscriptions](../json-rpc-and-subscriptions.md#finality) لمعرفة كيفية عمل الانتظار وحدوده.

## التوقيع في مكان آخر (محفظة عتادية، KMS)

```ts
const unsigned = TxBuilder.transfer({ … });
const digest   = unsigned.hash();                        // 32-byte hex to sign (RFC-6979 low-S DER expected)
const signed   = unsigned.withSignature(base64Der, publicKeyHex);
```

</div>
