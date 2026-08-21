import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function loadBuildPlannerQuotePrefill() {
  const source = await readFile(new URL("../garden-planner-page.js", import.meta.url), "utf8");
  const start = source.indexOf("function buildPlannerQuotePrefill(");
  const end = source.indexOf("\nfunction normalizeRegionName", start);
  assert.ok(start >= 0, "buildPlannerQuotePrefill not found");
  assert.ok(end > start, "buildPlannerQuotePrefill end marker not found");

  const materialItemsCalls = [];
  const materialReferenceCalls = [];
  const context = {
    Date,
    DECO_CATALOG: [],
    fmt: (value, decimals = 1) => Number(value || 0).toFixed(decimals),
    buildPlannerMaterialReferenceModel: (input) => {
      materialReferenceCalls.push(input);
      return {
        canViewMaterialCosts: false,
        pricingRegionLabel: "",
        stabilizedPerTon: 0,
        sandPerTon: 0,
        materialCostTotal: 0,
        materialSections: [],
      };
    },
    buildPlannerMaterialItems: (...args) => {
      materialItemsCalls.push(args);
      return [
        { key: "telo", label: "Telo isolante", qty: 25, unit: "mq", unitPrice: 1, total: 25 },
      ];
    },
  };
  const buildPlannerQuotePrefill = vm.runInNewContext(
    `${source.slice(start, end)}\nbuildPlannerQuotePrefill;`,
    context,
  );
  return { buildPlannerQuotePrefill, materialItemsCalls, materialReferenceCalls };
}

function basePrefillInput(overrides = {}) {
  return {
    projectInfo: { client: "Mario Rossi", address: "Roma", notes: "" },
    area: 25,
    substrate: { scavoCm: 0, drenateCm: 3, sabbiaCm: 0 },
    travel: {},
    installNeeds: { geo: 25, tapeRolls: 1, glueBuckets: 1, jointMeters: 10 },
    borderType: "nessuna",
    borderMeters: 0,
    decoItems: {},
    regionalPricing: null,
    viewerRole: "office",
    pavingNeedsByArea: [],
    ...overrides,
  };
}

test("Garden Planner prefill usa solo i mq prato per il preventivo quando ci sono aree WPC", async () => {
  const { buildPlannerQuotePrefill, materialItemsCalls, materialReferenceCalls } = await loadBuildPlannerQuotePrefill();
  const prefill = buildPlannerQuotePrefill(basePrefillInput({
    area: 31,
    turfArea: 25,
    pavingNeedsByArea: [
      { tilesNeeded: 72, areaM2: 6, tileSizeCm: { w: 30, h: 30 }, wasteFactor: 0.08 },
    ],
  }));

  assert.equal(prefill.payload.mq, "25.0");
  assert.match(prefill.sqmLabel, /Prato 25\.0/);
  assert.match(prefill.sqmLabel, /Totale 31\.0/);
  assert.ok(prefill.materialHighlights.includes("Prato 25.0 m²"));
  assert.ok(prefill.materialHighlights.includes("Totale progetto 31.0 m²"));
  assert.ok(prefill.materialHighlights.includes("Pavimentazione WPC 72 pz"));

  assert.equal(materialItemsCalls.length, 1);
  assert.equal(Number(materialItemsCalls[0][5]), 31);
  assert.equal(materialReferenceCalls.length, 1);
  assert.equal(Number(materialReferenceCalls[0].area), 31);
  assert.equal(Number(materialReferenceCalls[0].turfArea), 25);
});

test("Garden Planner prefill mantiene il comportamento precedente se turfArea non e' passato", async () => {
  const { buildPlannerQuotePrefill } = await loadBuildPlannerQuotePrefill();
  const prefill = buildPlannerQuotePrefill(basePrefillInput({ area: 25 }));

  assert.equal(prefill.payload.mq, "25.0");
  assert.equal(prefill.sqmLabel, "25.0 m²");
});
