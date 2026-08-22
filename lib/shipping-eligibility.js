/**
 * lib/shipping-eligibility.js — "questo ordine ha ancora bisogno di azione
 * logistica?" (FUNZIONI PURE).
 *
 * Estratto da app.js: in passato il badge sidebar "Spedizioni" (orderNeedsShippingAction)
 * e le colonne della bacheca (getShippingStageLane) erano due implementazioni
 * indipendenti della stessa domanda, e sono divergute silenziosamente (bug reale
 * trovato dall'utente il 9 lug 2026 — badge "3" con 1 sola card in "Da preparare").
 * Qui vive l'UNICA copia, così badge e bacheca non possono più disallinearsi, ed
 * è testabile in Node (node --test, vedi test/shipping-eligibility.test.js).
 *
 * REGOLA: nessuna dipendenza da `state`, `t()`/i18n o dal DOM. Le label testuali
 * (che dipendono dalla lingua corrente) restano in app.js, che usa `key`/`tone`
 * da qui per scegliere il testo giusto.
 */

import { getOpenBalance } from "./order-money.js";

export function isShopifyBackedOrder(order) {
  return Boolean(
    String(order?.source || "").toLowerCase().startsWith("shopify")
    || String(order?.shopifyNumericId || "").trim()
    || String(order?.shopifyGraphqlId || "").trim(),
  );
}

export function isShopifyFulfillmentComplete(order) {
  if (!isShopifyBackedOrder(order)) return false;
  return String(order?.fulfillmentStatus || "").toLowerCase().trim() === "fulfilled";
}

export function isShopifyFullyDone(order) {
  const financial = String(order.financialStatus || "").toLowerCase().trim();
  if (financial === "refunded" || financial === "voided") return true;
  const paidLike = financial === "paid" || financial === "partially_refunded";
  return isShopifyFulfillmentComplete(order) && paidLike;
}

export function isLogisticsOrderCompleted(order) {
  const warehouse = order.operations?.warehouse || {};
  const status = String(warehouse.status || "").trim();
  const mode = String(warehouse.fulfillmentMode || "").trim();
  return Boolean(
    warehouse.shipped
    || status === "ritirato"
    || (mode === "corriere" && warehouse.carrierPassed)
    || isShopifyFulfillmentComplete(order),
  );
}

export function isInstallationOrderCompleted(order) {
  return String(order.operations?.installation?.status || "").trim() === "completata";
}

export function isOrderFulfilledOrClosed(order) {
  if (isShopifyFullyDone(order)) return true;
  const installRequired = Boolean(order.operations?.installation?.required);
  if (installRequired) return isInstallationOrderCompleted(order) || isOrderClosed(order);
  return isLogisticsOrderCompleted(order) || isOrderClosed(order);
}

export function isOrderClosed(order) {
  const installRequired = Boolean(order.operations?.installation?.required);
  const installCompleted = isInstallationOrderCompleted(order);
  const logisticsCompleted = isLogisticsOrderCompleted(order);
  const financiallyClosed = getOpenBalance(order) <= 0 && (!order.accounting?.invoiceRequired || order.accounting?.invoiceIssued);
  const operationallyClosed = installRequired ? installCompleted : logisticsCompleted;
  return Boolean(operationallyClosed && financiallyClosed);
}

export function isRoutedToWarehouse(order) {
  const warehouse = order.operations?.warehouse || {};
  const warehouseStatus = String(warehouse.status || "").trim();
  return Boolean(
    warehouse.selected
    || (warehouse.fulfillmentMode && warehouse.fulfillmentMode !== "da-definire")
    || (warehouse.preparationDate && String(warehouse.preparationDate).trim())
    || (warehouseStatus && !["da-preparare", "da-definire"].includes(warehouseStatus))
    || warehouse.readyToShip
    || warehouse.carrierPassed
    || warehouse.shipped
    || (warehouse.trackingNumber && String(warehouse.trackingNumber).trim()),
  );
}

export function isRoutedToInstallation(order) {
  const installation = order.operations?.installation || {};
  return Boolean(
    installation.required
    || installation.selected
    || (installation.installDate && String(installation.installDate).trim())
    || (installation.installTime && String(installation.installTime).trim())
    || (installation.crew && String(installation.crew).trim())
    || installation.clientConfirmed
    || (installation.reportNote && String(installation.reportNote).trim())
    || (installation.status && !["", "da-pianificare"].includes(String(installation.status).trim())),
  );
}

/**
 * Stage unificato dell'ordine, SOLO key/tone/warehouseStatus (niente label:
 * dipendono dalla lingua, restano in app.js). Stessa cascata di condizioni
 * di getUnifiedOrderStage originale — non riordinare i rami, l'ordine è
 * significativo (il primo che matcha vince).
 */
export function getUnifiedOrderStageKey(order) {
  const ops = order.operations || {};
  const officeStatus = String(ops.officeStatus || "").trim();
  const warehouse = ops.warehouse || {};
  const install = ops.installation || {};
  const warehouseStatus = String(warehouse.status || "").trim();
  const fulfillmentMode = String(warehouse.fulfillmentMode || "").trim();
  const installStatus = String(install.status || "").trim();
  const installRequired = Boolean(install.required);
  const logisticsCompleted = isLogisticsOrderCompleted(order);
  const routedToWarehouse = isRoutedToWarehouse(order);

  if (isOrderClosed(order)) return { key: "closed", tone: "green", warehouseStatus };
  if (installStatus === "completata") return { key: "install-completed", tone: "green", warehouseStatus };
  if (installStatus === "in-corso") return { key: "install-progress", tone: "blue", warehouseStatus };
  if (installRequired && install.installDate) return { key: "install-planned", tone: "amber", warehouseStatus };
  if (fulfillmentMode === "furgone" && logisticsCompleted) return { key: "van-loaded", tone: "green", warehouseStatus };
  if (logisticsCompleted) return { key: "goods-collected", tone: "green", warehouseStatus };
  if (warehouse.readyToShip || ["pronto", "da-ritirare", "in-attesa-di-ritiro"].includes(warehouseStatus)) {
    return { key: "warehouse-ready", tone: "green", warehouseStatus };
  }
  const explicitWarehouseWorkStatus = ["in-preparazione", "bloccato"].includes(warehouseStatus)
    || (warehouseStatus === "da-preparare" && routedToWarehouse);
  if (explicitWarehouseWorkStatus || routedToWarehouse) {
    return {
      key: "warehouse-work",
      tone: warehouseStatus === "bloccato" ? "red" : warehouseStatus === "in-preparazione" ? "blue" : "amber",
      warehouseStatus,
    };
  }
  if (officeStatus === "bozza" || !routedToWarehouse) return { key: "office-review", tone: "blue", warehouseStatus };
  return { key: "operational", tone: "amber", warehouseStatus };
}

// Corsia della pipeline Spedizioni (FASE, non modalità): da preparare →
// pronti per uscita/ritiro → usciti/ritirati.
export function getShippingStageLane(order) {
  const wh = order.operations?.warehouse || {};
  const logisticsHandled = Boolean(
    wh.shipped
    || String(wh.status || "").trim() === "ritirato"
    || (String(wh.fulfillmentMode || "").trim() === "corriere" && wh.carrierPassed),
  );
  if (logisticsHandled) return "done";
  const status = String(wh.status || "").trim();
  if (status === "in-preparazione") return "ready";
  const stage = getUnifiedOrderStageKey(order);
  const doneKeys = ["goods-collected", "van-loaded", "install-progress", "install-completed", "closed"];
  if (doneKeys.includes(stage.key)) return "done";
  if (stage.key === "warehouse-ready") return "ready";
  return "prepare";
}

// Stessa idoneità della vista Spedizioni ("Tutti" senza filtro): il badge
// sidebar conta esattamente gli ordini che risultano in "Da preparare" +
// "Pronti per uscita/ritiro" nella bacheca — mai una domanda diversa.
export function orderNeedsShippingAction(order) {
  if (!order || isOrderClosed(order)) return false;
  const warehouse = order.operations?.warehouse || {};
  const explicit = warehouse.selected === true;
  if (!explicit && isOrderFulfilledOrClosed(order)) return false;
  // Una posa programmata da sola NON deve far entrare l'ordine in Spedizioni:
  // getUnifiedOrderStageKey ritorna "install-planned" appena c'è una data di
  // posa, PRIMA di controllare se il magazzino è mai stato coinvolto — senza
  // questo guard un ordine con solo la posa pianificata finiva comunque in
  // "Da preparare" (via getShippingStageLane, che non riconosce
  // "install-planned" come "fatto"), gonfiando anche il badge sidebar, senza
  // che nessuno l'avesse instradato al magazzino (segnalato dall'utente il
  // 17 ago 2026, ordine di Vito Attanasio).
  if (!isRoutedToWarehouse(order)) return false;
  return getShippingStageLane(order) !== "done";
}

export function ddtOrderHasNumber(order) {
  return Boolean(String(order?.operations?.warehouse?.ddt?.number || "").trim());
}
