<div dir="rtl">

# إرسال المعاملات

تُبنى كل معاملة محليًا، وتُوقَّع محليًا، وتُرسَل بصيغة JSON. تُعيد العقدة التحقق من الهاش (hash) والتوقيع، وتطابق المرسل/المفتاح العام، والرقم التسلسلي (nonce)، والرصيد والرسوم، فإما أن تقبلها في مجمع المعاملات (mempool) (HTTP 201 / عبر RPC ‏`{hash, status: "PENDING"}`) أو ترفضها مع سبب مصنَّف.

```ts
const unsigned = TxBuilder.transfer({ from: me.address, to, amount: '1.25', nonce });
const signed   = me.signTx(unsigned);       // SignedTx: hash, signature, senderPublicKey
await client.submit(signed);                // REST
await rpc.send(signed);                     // or JSON-RPC — same body, same result
```

## الأرقام التسلسلية (nonce)

لكل مرسل رقم تسلسلي (nonce) يجب أن يكون متتاليًا. تُرجع الدالة `client.nonce(address)` (أو `rpc.getAccount(address).nextNonce`) **الرقم التسلسلي المثبت + عدد المعاملات المعلقة**، بحيث يمكنك إرسال عدة معاملات على التوالي قبل نهائية (finality) الأولى: الرقم التسلسلي (nonce) ‏`n`‏، ‏`n+1`‏، ‏`n+2`‏… يُرفَض أي فجوة أو إعادة تشغيل مع `NonceMismatchError { expected, got }` — اقرأ `expected` وأعِد البناء وأعِد الإرسال.

إرسال *المعاملة الموقعة نفسها* مرتين غير ضار: تجيب العقدة `PENDING` مرة أخرى (عدم التكرار حسب الهاش).

## معرّف الشبكة — الشبكة الرئيسية مقابل شبكة اختبار خاصة

تُوقَّع كل معاملة لشبكة واحدة: `consensus.network-id` هو الحقل الأول في الصورة المسبقة (preimage)، لذلك تُرفَض المعاملة المبنية لشبكة `janzeer` (الشبكة الرئيسية) من عقدة شبكة اختبار خاصة (`janzeer-testnet`) والعكس صحيح — لا توجد شبكة اختبار عامة. تستخدم أدوات البناء افتراضيًا `NETWORK_ID` (`"janzeer"`)؛ عندما يتمكن تطبيقك من الاتصال بالشبكات الخاصة، تأكد من مطابقة المعرّف.

</div>
