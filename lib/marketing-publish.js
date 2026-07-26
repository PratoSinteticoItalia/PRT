export function isMarketingStoryFormat(item = {}) {
  return String(item?.format || "").trim().toLowerCase() === "story";
}

export function validateMarketingStoryPublish(item = {}, assetCount = 0) {
  if (!isMarketingStoryFormat(item)) return { ok: true };
  if (String(item?.channel || "").trim() !== "Instagram") {
    return { ok: false, reason: "story_channel_not_supported" };
  }
  if (Number(assetCount || 0) < 1) {
    return { ok: false, reason: "missing_public_asset_url" };
  }
  if (Number(assetCount || 0) !== 1) {
    return { ok: false, reason: "story_single_asset_required" };
  }
  return { ok: true };
}

export function buildInstagramSingleImageParams({
  item = {},
  imageUrl = "",
  caption = "",
  mode = "publish",
  scheduledUnix = 0,
} = {}) {
  if (isMarketingStoryFormat(item)) {
    return {
      image_url: imageUrl,
      media_type: "STORIES",
    };
  }
  return {
    image_url: imageUrl,
    caption,
    published: mode === "schedule" ? "false" : undefined,
    scheduled_publish_time: scheduledUnix || undefined,
  };
}
