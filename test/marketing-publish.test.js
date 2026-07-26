import test from "node:test";
import assert from "node:assert/strict";

import {
  buildInstagramSingleImageParams,
  validateMarketingStoryPublish,
} from "../lib/marketing-publish.js";

test("marketing story: la caption non viene inviata a Instagram", () => {
  assert.deepEqual(
    buildInstagramSingleImageParams({
      item: { format: "story" },
      imageUrl: "https://cdn.example.test/story.jpg",
      caption: "Testo che non deve finire nel payload",
    }),
    {
      image_url: "https://cdn.example.test/story.jpg",
      media_type: "STORIES",
    },
  );
});

test("marketing post: la caption resta nel payload del feed", () => {
  assert.deepEqual(
    buildInstagramSingleImageParams({
      item: { format: "post" },
      imageUrl: "https://cdn.example.test/post.jpg",
      caption: "Caption del post",
    }),
    {
      image_url: "https://cdn.example.test/post.jpg",
      caption: "Caption del post",
      published: undefined,
      scheduled_publish_time: undefined,
    },
  );
});

test("marketing story: richiede Instagram e una sola immagine", () => {
  assert.deepEqual(
    validateMarketingStoryPublish({ format: "story", channel: "Facebook" }, 1),
    { ok: false, reason: "story_channel_not_supported" },
  );
  assert.deepEqual(
    validateMarketingStoryPublish({ format: "story", channel: "Instagram" }, 2),
    { ok: false, reason: "story_single_asset_required" },
  );
  assert.deepEqual(
    validateMarketingStoryPublish({ format: "story", channel: "Instagram" }, 1),
    { ok: true },
  );
});
