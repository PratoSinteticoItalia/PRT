import test from "node:test";
import assert from "node:assert/strict";

import {
  getSalesAssignmentOptionLabels,
  matchesSalesAssignmentFilter,
  normalizeSalesAssignmentFilterValue,
  normalizeSalesAssignmentKey,
  normalizeSalesAssignmentValue,
} from "../lib/sales-assignment.js";

test("normalizeSalesAssignmentValue recognises default operators inside noisy labels", () => {
  assert.equal(normalizeSalesAssignmentValue("Gabriele Todaro"), "Gabriele");
  assert.equal(normalizeSalesAssignmentValue("commerciale: ivan"), "Ivan");
  assert.equal(normalizeSalesAssignmentValue("gabriele@example.it"), "Gabriele");
});

test("normalizeSalesAssignmentFilterValue returns stable filter keys", () => {
  assert.equal(normalizeSalesAssignmentFilterValue("Tutte"), "all");
  assert.equal(normalizeSalesAssignmentFilterValue("non assegnato"), "unassigned");
  assert.equal(normalizeSalesAssignmentFilterValue("Gabriele Todaro"), "gabriele");
  assert.equal(normalizeSalesAssignmentFilterValue("Mario Rossi"), "mario rossi");
});

test("matchesSalesAssignmentFilter accepts canonical and partial operator values", () => {
  assert.equal(matchesSalesAssignmentFilter("Gabriele Todaro", "gabriele"), true);
  assert.equal(matchesSalesAssignmentFilter("commerciale Ivan", "Ivan"), true);
  assert.equal(matchesSalesAssignmentFilter("Gabriele Todaro", "ivan"), false);
  assert.equal(matchesSalesAssignmentFilter("", "unassigned"), true);
  assert.equal(matchesSalesAssignmentFilter("non assegnato", "unassigned"), true);
});

test("catalog assignment labels are deduplicated and keep defaults", () => {
  const labels = getSalesAssignmentOptionLabels([
    { value: "gabriele", label: "Gabriele" },
    { value: "mario", label: "Mario Rossi" },
  ]);
  assert.deepEqual(labels, ["Ivan", "Gabriele", "Mario Rossi"]);
});

test("normalizeSalesAssignmentKey strips accents and punctuation", () => {
  assert.equal(normalizeSalesAssignmentKey("Gàbrièle / Todaro"), "gabriele todaro");
});
