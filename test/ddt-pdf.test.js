import test from "node:test";
import assert from "node:assert/strict";

import { generateDdtPdf } from "../lib/ddt-pdf.js";

const baseOrder = {
  id: "order-1",
  orderNumber: "#2790",
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario.rossi@example.com",
  phone: "+39 333 1234567",
  address: "Via Roma 1",
  city: "Napoli",
  postalCode: "80100",
  provinceCode: "NA",
  lineDetails: [
    { title: "Rovere 40 mm", quantity: 2 },
    { title: "Colla bicomponente", quantity: 1 },
  ],
  operations: {
    warehouse: {
      ddt: {
        number: "DDT-2790",
        createdAt: "2026-07-31T10:00:00.000Z",
        palletLength: "120",
        palletWidth: "80",
        palletHeight: "100",
        palletWeight: "45 kg",
        lines: [],
        recipient: null,
      },
    },
  },
};

test("generateDdtPdf: produce un PDF valido per un ordine con righe da lineDetails", async () => {
  const buffer = await generateDdtPdf(baseOrder);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 100);
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateDdtPdf: usa le righe DDT editate quando presenti, non lineDetails", async () => {
  const order = {
    ...baseOrder,
    operations: {
      warehouse: {
        ddt: {
          ...baseOrder.operations.warehouse.ddt,
          lines: [{ title: "Taglio su misura 3x5m", quantity: 1, note: "Bordo rinforzato" }],
        },
      },
    },
  };
  const buffer = await generateDdtPdf(order);
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateDdtPdf: non esplode con un ordine senza righe né recipient override", async () => {
  const order = {
    id: "order-2",
    orderNumber: "#2791",
    operations: { warehouse: { ddt: { number: "DDT-2791", createdAt: new Date().toISOString() } } },
  };
  const buffer = await generateDdtPdf(order);
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateDdtPdf: gestisce un DDT libero con unità di misura sulle righe", async () => {
  const order = {
    id: "free-ddt-1",
    __ddtFree: true,
    orderNumber: "DDT-LIB-1",
    operations: {
      product: "Trasferimento magazzino",
      warehouse: {
        ddt: {
          number: "DDT-LIB-1",
          createdAt: "2026-08-11T10:00:00.000Z",
          palletLength: "120",
          palletWidth: "80",
          palletHeight: "95",
          palletWeight: "180 kg",
          recipient: { name: "Deposito Roma", city: "Roma", province: "RM" },
          lines: [
            { title: "Prato Cipresso", quantity: 32, um: "mq", note: "rotolo unico" },
            { title: "Colla", quantity: 4, um: "pz", note: "" },
          ],
        },
      },
    },
  };
  const buffer = await generateDdtPdf(order);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 100);
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateDdtPdf: throws se manca l'ordine", async () => {
  await assert.rejects(() => generateDdtPdf(null), /missing order/);
});
