/**
 * Test di "questo ordine ha ancora bisogno di azione logistica?" (lib/shipping-eligibility.js).
 * Esegui con: `npm test` (node --test, zero dipendenze).
 *
 * Rete di sicurezza contro l'incidente del 9 lug 2026: il badge sidebar
 * "Spedizioni" (orderNeedsShippingAction) e le colonne della bacheca
 * (getShippingStageLane) erano due implementazioni indipendenti che sono
 * divergute (badge "3" con 1 sola card in "Da preparare"). Ora condividono
 * la stessa logica — questi test fissano i due scenari esatti dell'incidente
 * e l'invariante generale che deve restare vera per qualunque ordine.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isOrderClosed,
  isRoutedToWarehouse,
  isRoutedToInstallation,
  getShippingStageLane,
  orderNeedsShippingAction,
  getUnifiedOrderStageKey,
  ddtOrderHasNumber,
} from "../lib/shipping-eligibility.js";

function makeOrder(overrides = {}) {
  return {
    total: 100,
    financialStatus: "paid",
    accounting: { invoiceRequired: false, invoiceIssued: false },
    operations: { officeStatus: "", warehouse: {}, installation: {} },
    ...overrides,
  };
}

test("incidente 9 lug (1/2): wh.shipped=true ma status non è letteralmente 'ritirato' → considerato evaso da entrambe le funzioni", () => {
  const order = makeOrder({
    operations: {
      officeStatus: "confermato",
      warehouse: { selected: true, shipped: true, status: "in transito", fulfillmentMode: "corriere" },
      installation: {},
    },
  });
  assert.equal(getShippingStageLane(order), "done");
  assert.equal(orderNeedsShippingAction(order), false, "il vecchio bug lo contava ancora come 'da preparare' perché status non era letteralmente 'ritirato'");
});

test("incidente 9 lug (2/2): fulfillmentMode ancora 'da-definire' ma ordine instradato in magazzino → resta 'da preparare', non escluso a priori", () => {
  const order = makeOrder({
    operations: {
      officeStatus: "confermato",
      warehouse: { selected: true, status: "da-preparare", fulfillmentMode: "da-definire" },
      installation: {},
    },
  });
  assert.equal(getShippingStageLane(order), "prepare");
  assert.equal(orderNeedsShippingAction(order), true, "il vecchio bug escludeva a priori gli ordini con fulfillmentMode non ancora scelto");
});

test("ordine chiuso (finanziariamente + operativamente) non richiede mai azione logistica", () => {
  const order = makeOrder({
    accounting: { invoiceRequired: false, invoiceIssued: false },
    operations: {
      warehouse: { shipped: true, status: "ritirato" },
      installation: {},
    },
  });
  assert.equal(isOrderClosed(order), true);
  assert.equal(orderNeedsShippingAction(order), false);
});

test("ordine non instradato né in magazzino né in posa non richiede azione logistica", () => {
  const order = makeOrder();
  assert.equal(isRoutedToWarehouse(order), false);
  assert.equal(isRoutedToInstallation(order), false);
  assert.equal(orderNeedsShippingAction(order), false);
});

test("invariante badge/bacheca: per qualunque ordine instradato al magazzino e non chiuso, orderNeedsShippingAction concorda sempre con getShippingStageLane !== 'done'", () => {
  // Nota: l'invariante è scoped a isRoutedToWarehouse, non più a
  // "instradato al magazzino O in posa" — vedi il test dedicato sotto
  // sull'incidente del 17 ago 2026 per il perché.
  const fixtures = [
    makeOrder({ operations: { warehouse: { selected: true, status: "da-preparare" }, installation: {} } }),
    makeOrder({ operations: { warehouse: { selected: true, status: "in-preparazione" }, installation: {} } }),
    makeOrder({ operations: { warehouse: { selected: true, readyToShip: true, status: "pronto" }, installation: {} } }),
    makeOrder({ operations: { warehouse: { selected: true, status: "ritirato" }, installation: {} } }),
    makeOrder({ operations: { warehouse: { selected: true, carrierPassed: true, fulfillmentMode: "corriere" }, installation: {} } }),
  ];
  for (const order of fixtures) {
    if (!isRoutedToWarehouse(order) || isOrderClosed(order)) continue;
    const laneDone = getShippingStageLane(order) === "done";
    assert.equal(orderNeedsShippingAction(order), !laneDone, `disallineati per fixture: ${JSON.stringify(order.operations)}`);
  }
});

test("incidente 17 ago 2026 (Vito Attanasio): posa programmata ma magazzino MAI instradato → non deve comparire in Spedizioni", () => {
  const order = makeOrder({
    operations: { warehouse: {}, installation: { required: true, installDate: "2026-08-10", crew: "Alpha", clientConfirmed: true } },
  });
  assert.equal(isRoutedToWarehouse(order), false);
  assert.equal(isRoutedToInstallation(order), true);
  // Prima del fix: getShippingStageLane tornava "prepare" (via lo stage
  // "install-planned", che ha priorità sul controllo isRoutedToWarehouse in
  // getUnifiedOrderStageKey) e orderNeedsShippingAction usava un OR con
  // isRoutedToInstallation — l'ordine finiva in "Da preparare" senza che
  // nessuno l'avesse instradato al magazzino.
  assert.equal(orderNeedsShippingAction(order), false, "la sola posa programmata non deve far comparire l'ordine in Spedizioni");

  // Stati di posa più avanzati (in corso/completata) senza magazzino instradato:
  // stessa cosa, non deve mai comparire.
  const inProgress = makeOrder({ operations: { warehouse: {}, installation: { required: true, status: "in-corso" } } });
  const completed = makeOrder({ operations: { warehouse: {}, installation: { required: true, status: "completata" } } });
  assert.equal(orderNeedsShippingAction(inProgress), false);
  assert.equal(orderNeedsShippingAction(completed), false);
});

test("getUnifiedOrderStageKey: la posa pianificata ha priorità sullo stato magazzino", () => {
  const order = makeOrder({
    operations: {
      warehouse: { readyToShip: true, status: "pronto" },
      installation: { required: true, installDate: "2026-08-10" },
    },
  });
  assert.equal(getUnifiedOrderStageKey(order).key, "install-planned");
});

test("ddtOrderHasNumber: vero solo con numero DDT non vuoto", () => {
  assert.equal(ddtOrderHasNumber(makeOrder()), false);
  assert.equal(ddtOrderHasNumber(makeOrder({ operations: { warehouse: { ddt: { number: "" } } } })), false);
  assert.equal(ddtOrderHasNumber(makeOrder({ operations: { warehouse: { ddt: { number: "DDT-2767" } } } })), true);
});
