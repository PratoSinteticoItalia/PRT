import test from "node:test";
import assert from "node:assert/strict";

import { generateSiteSheetPdf } from "../lib/site-sheet-pdf.js";

const baseOrder = {
  id: "order-1",
  orderNumber: "#2790",
  firstName: "Mario",
  lastName: "Rossi",
  phone: "+39 333 1234567",
  address: "Via Roma 1",
  city: "Napoli",
  postalCode: "80100",
  provinceCode: "NA",
  operations: {
    product: "Rovere 40 mm",
    sqm: 60,
    installation: {
      crew: "Alpha",
      installDate: "2026-08-10",
      installTime: "09:00",
      reportNote: "Accesso da retro, cancello sul lato sinistro.",
    },
  },
};

test("generateSiteSheetPdf: produce un PDF valido con dati completi", async () => {
  const buffer = await generateSiteSheetPdf(baseOrder);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 100);
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateSiteSheetPdf: usa sqm esplicito se passato, non order.operations.sqm", async () => {
  const buffer = await generateSiteSheetPdf(baseOrder, { sqm: 75 });
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateSiteSheetPdf: non esplode con un ordine minimale senza installation/note", async () => {
  const order = {
    id: "order-2",
    orderNumber: "#2791",
    operations: {},
  };
  const buffer = await generateSiteSheetPdf(order);
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateSiteSheetPdf: throws se manca l'ordine", async () => {
  await assert.rejects(() => generateSiteSheetPdf(null), /missing order/);
});
