/**
 * lib/preventivo-pricing.js — Motore di calcolo del preventivo (PURO, no DOM).
 *
 * Fase 1 della riscrittura nativa del generatore (vedi piano): consolida in un
 * unico punto TESTABILE la logica di prezzo che oggi vive nel bundle React e
 * viene replicata a mano in app.js. Funzione PURA → importabile sia da node
 * (test/preventivo-pricing.test.js) sia dal browser (app.js) come lib/geo.js.
 *
 * Fonti: ~/preventivi/src/App.jsx (formule storiche) + comportamento del
 * generatore ONLINE verificato in sessione. Differenza chiave rispetto al
 * sorgente locale di aprile: il PIETRISCO (fondo drenante) è incluso nei
 * materiali SOLO in "Fornitura + Posa", non in "Solo Fornitura" (verificato:
 * 60 mq solo fornitura → materiali auto 270 €, non 360 €).
 */

export const IVA_RATE = 0.22;

export const MATERIAL_PRICES = {
  bandPrice: 30, // €/pz banda di giunzione
  glueBucketPrice: 45, // €/secchio colla bicomponente
  glueBucketKg: 6, // kg per secchio
  teloPricePerMq: 1, // €/mq telo isolante
  stakePrice: 0.3, // €/pz picchetto a U
  pietriscoPricePerMc: 50, // €/mc pietrisco
  pietriscoDepthMeters: 0.03, // spessore fondo drenante
};

/**
 * Listino prodotti — prezzi €/mq verificati contro il generatore online (2026).
 * Nella riscrittura completa arriveranno dal catalogo (preventivo_products);
 * qui restano come default/seed e per i test.
 */
export const PRODUCTS = [
  { id: "tasso", slug: "tasso-12mm", name: "Tasso 12 mm", desc: "Ultra compatto", priceCliente: 5.9, priceRivenditore: 3.9 },
  { id: "bonsai", slug: "bonsai-18mm", name: "Bonsai 18 mm", desc: "Compatto", priceCliente: 7.9, priceRivenditore: 6.5 },
  { id: "faggio", slug: "faggio-25mm", name: "Faggio 25 mm", desc: "Resistente", priceCliente: 10.9, priceRivenditore: 8.9 },
  { id: "betulla", slug: "betulla-30mm", name: "Betulla 30 mm", desc: "Vivace elegante", priceCliente: 11.5, priceRivenditore: 9.9 },
  { id: "gelso", slug: "gelso-30mm", name: "Gelso 30 mm", desc: "Morbido brillante", priceCliente: 16.0, priceRivenditore: 10.4 },
  { id: "cedro", slug: "cedro-30mm", name: "Cedro 30 mm", desc: "Versatile", priceCliente: 13.9, priceRivenditore: 10.9 },
  { id: "frassino", slug: "frassino-35mm", name: "Frassino 35 mm", desc: "Ultra realistico", priceCliente: 16.0, priceRivenditore: 10.4 },
  { id: "ginepro35", slug: "ginepro-35mm", name: "Ginepro 35 mm", desc: "Equilibrato", priceCliente: 14.5, priceRivenditore: 11.9 },
  { id: "sequoia", slug: "sequoia-40mm", name: "Sequoia 40 mm", desc: "Denso resistente", priceCliente: 18.0, priceRivenditore: 11.7 },
  { id: "rovere", slug: "rovere-40mm", name: "Rovere 40 mm", desc: "Naturale", priceCliente: 13.9, priceRivenditore: 11.9 },
  { id: "palma", slug: "palma-40mm", name: "Palma 40 mm", desc: "Morbidezza", priceCliente: 18.9, priceRivenditore: 13.9 },
  { id: "cipresso", slug: "cipresso-40mm", name: "Cipresso 40 mm", desc: "Multidirezionale", priceCliente: 16.9, priceRivenditore: 12.9 },
  { id: "ginepro45", slug: "ginepro-45mm", name: "Ginepro 45 mm", desc: "Soffice equilibrato", priceCliente: 19.5, priceRivenditore: 13.9 },
  { id: "abete", slug: "abete-45mm", name: "Abete 45 mm", desc: "Multidirezionale", priceCliente: 20.0, priceRivenditore: 13.0 },
  { id: "mogano", slug: "mogano-50mm", name: "Mogano 50 mm", desc: "Multidirezionale", priceCliente: 22.0, priceRivenditore: 14.3 },
];

/** Accessori a catalogo (prezzo €, modificabile in fase preventivo). */
export const ACCESSORIES = [
  { id: "detergente_profumato", name: "Detergente profumato singolo", unit: "pz", price: 17.5 },
  { id: "scopa_manuale", name: "Scopa manuale 45 cm", unit: "pz", price: 30.0 },
  { id: "picchetti_u", name: "Picchetti a U", unit: "pz", price: 0.3 },
  { id: "colla_bicomponente", name: "Colla bi-componente (A+B)", unit: "conf", price: 45.0 },
  { id: "banda_giunzione", name: "Banda di giunzione", unit: "rotolo", price: 30.0 },
  { id: "telo_pacciamatura", name: "Telo da pacciamatura", unit: "mq", price: 1.0 },
];

/** IVA per-componente: on → +22%, off → netto (identico ad applyIva del sorgente). */
export function applyIva(amount, enabled) {
  return Number(amount || 0) * (enabled === false ? 1 : 1 + IVA_RATE);
}

export function getProductPrice(product, customerType = "cliente") {
  if (!product) return 0;
  return customerType === "rivenditore" ? Number(product.priceRivenditore || 0) : Number(product.priceCliente || 0);
}

/**
 * Applica override di prezzo (da Impostazioni → Dati tecnici prodotti) sopra
 * il listino di default. Override assente/non numerico/≤0 → resta il default
 * (mai un prodotto a prezzo 0 o rotto). Pura: nessuna chiamata di rete/DB qui,
 * il chiamante passa la mappa già risolta.
 */
export function applyProductPriceOverrides(products, overridesBySlug = {}) {
  return products.map((p) => {
    const o = overridesBySlug?.[p.slug];
    if (!o) return p;
    const priceCliente = Number(o.priceCliente);
    const priceRivenditore = Number(o.priceRivenditore);
    return {
      ...p,
      priceCliente: Number.isFinite(priceCliente) && priceCliente > 0 ? priceCliente : p.priceCliente,
      priceRivenditore: Number.isFinite(priceRivenditore) && priceRivenditore > 0 ? priceRivenditore : p.priceRivenditore,
    };
  });
}

const ceilPos = (value, divisor) => (value > 0 ? Math.ceil(value / divisor) : 0);

/**
 * Distinta materiali automatici. quoteType decide il pietrisco (solo posa).
 * surface: "terra" | "pavimentazione".
 * excludeKeys: key materiale che il cliente ha già (es. ["telo"]) → la voce resta
 *   nella distinta ma marcata `excluded: true` e NON conta nel `total`. Serve per
 *   escludere singoli materiali dal preventivo senza toglierli tutti in blocco.
 */
export function getMaterialBreakdown(surface, mq, quoteType = "fornitura", excludeKeys = []) {
  const cleanMq = Number(mq) || 0;
  const bande = ceilPos(cleanMq, 50);
  const glueBuckets = ceilPos(cleanMq, 50);
  const glueKg = glueBuckets * MATERIAL_PRICES.glueBucketKg;
  const excluded = new Set(excludeKeys || []);
  const items = [];

  if (surface === "terra") {
    // Pietrisco = fondo drenante: serve solo quando si POSA.
    if (quoteType === "posa") {
      const pietriscoMc = cleanMq > 0 ? cleanMq * MATERIAL_PRICES.pietriscoDepthMeters : 0;
      items.push({ key: "pietrisco", label: "Pietrisco", qty: pietriscoMc, unit: "mc", unitPrice: MATERIAL_PRICES.pietriscoPricePerMc, total: pietriscoMc * MATERIAL_PRICES.pietriscoPricePerMc });
    }
    const teloMq = cleanMq > 0 ? cleanMq : 0;
    const stakes = ceilPos(cleanMq, 0.3);
    items.push({ key: "telo", label: "Telo isolante", qty: teloMq, unit: "mq", unitPrice: MATERIAL_PRICES.teloPricePerMq, total: teloMq * MATERIAL_PRICES.teloPricePerMq });
    items.push({ key: "bande", label: "Bande di giunzione", qty: bande, unit: "pz", unitPrice: MATERIAL_PRICES.bandPrice, total: bande * MATERIAL_PRICES.bandPrice });
    items.push({ key: "colla", label: "Colla bicomponente", qty: glueBuckets, glueKg, unit: "secchi", unitPrice: MATERIAL_PRICES.glueBucketPrice, total: glueBuckets * MATERIAL_PRICES.glueBucketPrice });
    items.push({ key: "picchetti", label: "Picchetti a U", qty: stakes, unit: "pz", unitPrice: MATERIAL_PRICES.stakePrice, total: stakes * MATERIAL_PRICES.stakePrice });
  } else {
    items.push({ key: "bande", label: "Bande di giunzione", qty: bande, unit: "pz", unitPrice: MATERIAL_PRICES.bandPrice, total: bande * MATERIAL_PRICES.bandPrice });
    items.push({ key: "colla", label: "Colla bicomponente", qty: glueBuckets, glueKg, unit: "secchi", unitPrice: MATERIAL_PRICES.glueBucketPrice, total: glueBuckets * MATERIAL_PRICES.glueBucketPrice });
  }

  const marked = items.map((item) => ({ ...item, excluded: excluded.has(item.key) }));
  const total = marked.reduce((sum, item) => sum + (item.excluded ? 0 : item.total), 0);
  return { items: marked, total };
}

/**
 * Calcolo completo del preventivo. Replica esattamente applyIva()/grandGross del
 * generatore. Ritorna i totali per opzione + distinta materiali + accessori/lavori.
 *
 * input: {
 *   mq, quoteType ("fornitura"|"posa"), surface ("terra"|"pavimentazione"),
 *   customerType ("cliente"|"rivenditore"),
 *   options: [{ pricePerSqm, discount, applyIva }],
 *   materials: { include, discountPct, applyIva, autoTotal?, exclude? (key[]) },
 *   shipping: { cost, applyIva },
 *   posa: { pricePerSqm, applyIva },
 *   accessories: [{ price, discount, qty, applyIva }],
 *   extraWorks: [{ cost, applyIva }],
 * }
 */
export function computeQuote(input = {}) {
  const {
    mq = 0,
    quoteType = "fornitura",
    surface = "terra",
    customerType = "cliente",
    options = [],
    materials = {},
    shipping = {},
    posa = {},
    accessories = [],
    extraWorks = [],
  } = input;

  const mqNum = Number(mq) || 0;
  const isPosa = quoteType === "posa";

  const includeMaterials = materials.include !== false;
  const autoBreakdown = getMaterialBreakdown(surface, mqNum, quoteType, materials.exclude || []);
  const materialsAutoTotal = materials.autoTotal != null ? Number(materials.autoTotal) : autoBreakdown.total;
  const materialsBaseNet = includeMaterials ? materialsAutoTotal : 0;
  const materialsNet = materialsBaseNet * (1 - (Number(materials.discountPct) || 0) / 100);
  const materialsIva = materials.applyIva !== false;

  const shippingNet = Number(shipping.cost) || 0;
  const shippingIva = shipping.applyIva !== false;

  const posaNet = isPosa ? (Number(posa.pricePerSqm) || 0) * mqNum : 0;
  const posaIva = posa.applyIva !== false;

  const accessoriesDetailed = (accessories || []).map((a) => {
    const net = (Number(a.price) || 0) * (1 - (Number(a.discount) || 0) / 100) * (Number(a.qty) || 1);
    return { ...a, net, gross: applyIva(net, a.applyIva) };
  });
  const accessoriesNet = accessoriesDetailed.reduce((sum, a) => sum + a.net, 0);
  const accessoriesGross = accessoriesDetailed.reduce((sum, a) => sum + a.gross, 0);

  const extraWorksDetailed = (extraWorks || []).map((w) => {
    const net = Number(w.cost) || 0;
    return { ...w, net, gross: applyIva(net, w.applyIva) };
  });
  const extraWorksNet = extraWorksDetailed.reduce((sum, w) => sum + w.net, 0);
  const extraWorksGross = extraWorksDetailed.reduce((sum, w) => sum + w.gross, 0);

  const computedOptions = (options || []).map((opt) => {
    const pricePerSqm = Number(opt.pricePerSqm) || 0;
    const discount = Number(opt.discount) || 0;
    const optIva = opt.applyIva !== false;
    const pratoNet = pricePerSqm * (1 - discount / 100) * mqNum;

    const totalNet = pratoNet + materialsNet + posaNet + shippingNet;
    const totalGross =
      applyIva(pratoNet, optIva) +
      applyIva(materialsNet, materialsIva) +
      applyIva(posaNet, posaIva) +
      applyIva(shippingNet, shippingIva);
    const grandNet = totalNet + accessoriesNet + extraWorksNet;
    const grandGross = totalGross + accessoriesGross + extraWorksGross;

    return {
      ...opt,
      pricePerSqm,
      discount,
      pratoNet,
      materialsNet,
      posaNet,
      shippingNet,
      totalNet,
      totalGross,
      grandNet,
      grandGross,
      perMqGross: mqNum > 0 ? grandGross / mqNum : 0,
      installment5: grandGross > 0 ? grandGross / 5 : 0,
    };
  });

  return {
    mq: mqNum,
    quoteType,
    surface,
    customerType,
    materials: {
      items: autoBreakdown.items,
      autoTotal: materialsAutoTotal,
      net: materialsNet,
      discountPct: Number(materials.discountPct) || 0,
      include: includeMaterials,
      applyIva: materialsIva,
    },
    accessories: accessoriesDetailed,
    accessoriesNet,
    accessoriesGross,
    extraWorks: extraWorksDetailed,
    extraWorksNet,
    extraWorksGross,
    options: computedOptions,
  };
}
