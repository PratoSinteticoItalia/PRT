// Valore della merce in magazzino al costo d'acquisto (ottobre 2026).
// Conta quello che è ancora fisicamente in magazzino (disponibile e impegnato,
// non evaso), al costo effettivo dell'ultima fattura fornitore collegata in
// Impostazioni → "Costi per la barra dell'utile". Senza un costo compatibile
// l'articolo resta senza valore: meglio un "da collegare" che un numero a caso.

const SQM_UNITS = ["mq", "m2", "m²", "metri quadri"];
// Unità che non si possono contare a pezzi: un sacco non vale "1 mc".
const NOT_PER_PIECE_UNITS = [...SQM_UNITS, "mc", "m3", "m³", "m", "ml", "metri", "metri lineari", "lt", "l", "litri"];

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Chili scritti nella variante: "Secchio 6 kg", "Sacco 25 kg".
export function kgFromLabel(label = "") {
  const match = String(label || "").match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

/**
 * @param {{ measured: boolean, totalSqm?: number, pieces?: Array<{ units: number, variantLabel?: string }> }} stock
 * @param {{ unitPrice: number, unit?: string, factor?: number|null }} supplier
 *   factor: 1 unità di magazzino (mq o pezzo) = factor unità della fattura.
 * @returns {{ value: number|null, perUnit?: number|null, unitLabel?: string, quantity?: number, reason?: string }}
 */
export function inventoryStockValue(stock = {}, supplier = null) {
  const price = Number(supplier?.unitPrice);
  if (!supplier || !Number.isFinite(price) || price < 0) return { value: null, reason: "missing" };
  const unit = String(supplier.unit || "").trim().toLowerCase();
  const factor = Number(supplier.factor) > 0 ? Number(supplier.factor) : null;

  if (stock.measured) {
    const perSqm = factor ? price * factor : SQM_UNITS.includes(unit) ? price : null;
    if (perSqm == null) return { value: null, reason: "unit" };
    const sqm = Math.max(0, Number(stock.totalSqm) || 0);
    return { value: round2(sqm * perSqm), perUnit: round2(perSqm), unitLabel: "mq", quantity: round2(sqm) };
  }

  const pieces = Array.isArray(stock.pieces) ? stock.pieces : [];
  const units = pieces.reduce((sum, piece) => sum + Math.max(0, Number(piece.units) || 0), 0);
  if (unit === "kg") {
    let total = 0;
    for (const piece of pieces) {
      const kg = kgFromLabel(piece.variantLabel) ?? factor;
      if (kg == null) return { value: null, reason: "unit" };
      total += Math.max(0, Number(piece.units) || 0) * kg * price;
    }
    const perUnit = units ? round2(total / units) : null;
    return { value: round2(total), perUnit, unitLabel: "u", quantity: units };
  }
  if (factor) return { value: round2(units * factor * price), perUnit: round2(factor * price), unitLabel: "u", quantity: units };
  if (NOT_PER_PIECE_UNITS.includes(unit)) return { value: null, reason: "unit" };
  return { value: round2(units * price), perUnit: round2(price), unitLabel: "u", quantity: units };
}
