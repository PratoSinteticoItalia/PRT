export function resolveMarketingAssetInputs(item = {}, existing = null) {
  if (Array.isArray(item.assetDataUrls)) return item.assetDataUrls;
  if (Array.isArray(item.assetUrls)) return item.assetUrls;
  if (String(item.assetDataUrl || "").trim()) return [item.assetDataUrl];
  if (Array.isArray(existing?.assetUrls)) return existing.assetUrls;
  if (String(existing?.assetUrl || "").trim()) return [existing.assetUrl];
  return [];
}
