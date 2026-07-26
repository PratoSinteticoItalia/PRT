import test from "node:test";
import assert from "node:assert/strict";

import { resolveMarketingAssetInputs } from "../lib/marketing-assets.js";

test("marketing: un aggiornamento di stato preserva le foto esistenti", () => {
  const existing = {
    assetUrls: [
      "https://cdn.example.test/photo-1.webp",
      "https://cdn.example.test/photo-2.webp",
    ],
  };

  assert.deepEqual(
    resolveMarketingAssetInputs({ id: "post-1", status: "pubblicato" }, existing),
    existing.assetUrls,
  );
});

test("marketing: assetUrls ricevuti dal client restano disponibili", () => {
  const assetUrls = ["https://cdn.example.test/photo.webp"];
  assert.deepEqual(resolveMarketingAssetInputs({ assetUrls }, null), assetUrls);
});

test("marketing: array esplicito vuoto rimuove tutte le foto", () => {
  const existing = { assetUrls: ["https://cdn.example.test/photo.webp"] };
  assert.deepEqual(resolveMarketingAssetInputs({ assetDataUrls: [] }, existing), []);
});
