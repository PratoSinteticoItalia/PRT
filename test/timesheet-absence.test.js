import test from "node:test";
import assert from "node:assert/strict";

import {
  listPendingAbsenceRequests,
  reviewAbsenceRequest,
} from "../lib/timesheet-absence.js";

test("timesheet requests: la coda include solo le richieste pendenti", () => {
  const requests = [
    { id: "approved", status: "approved", date: "2026-07-27" },
    { id: "later", status: "pending", date: "2026-08-03", requestedAt: "2026-07-26T10:00:00.000Z" },
    { id: "first", status: "pending", date: "2026-07-30", requestedAt: "2026-07-26T11:00:00.000Z" },
    { id: "cancelled", status: "cancelled", date: "2026-07-28" },
  ];

  assert.deepEqual(
    listPendingAbsenceRequests(requests).map((request) => request.id),
    ["first", "later"],
  );
});

test("timesheet requests: approvare crea l'assenza sul giorno richiesto", () => {
  const reviewedAt = "2026-07-26T13:00:00.000Z";
  const result = reviewAbsenceRequest({
    request: {
      id: "request-1",
      userId: "u2",
      date: "2026-07-30",
      type: "vacation",
      note: "Viaggio",
      status: "pending",
    },
    action: "approve",
    reviewerId: "u1",
    reviewedAt,
  });

  assert.equal(result.request.status, "approved");
  assert.deepEqual(result.absence, {
    userId: "u2",
    date: "2026-07-30",
    type: "vacation",
    startTime: "",
    endTime: "",
    note: "Viaggio",
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
    updatedBy: "u1",
  });
});

test("timesheet requests: approvare un permesso porta con sé l'orario", () => {
  const reviewedAt = "2026-07-26T13:00:00.000Z";
  const result = reviewAbsenceRequest({
    request: {
      id: "request-3",
      userId: "u2",
      date: "2026-07-30",
      type: "permit",
      startTime: "14:00",
      endTime: "16:00",
      note: "Visita medica",
      status: "pending",
    },
    action: "approve",
    reviewerId: "u1",
    reviewedAt,
  });

  assert.equal(result.absence.startTime, "14:00");
  assert.equal(result.absence.endTime, "16:00");
});

test("timesheet requests: rifiutare non crea alcuna assenza", () => {
  const result = reviewAbsenceRequest({
    request: {
      id: "request-2",
      userId: "u2",
      date: "2026-07-31",
      type: "permit",
      status: "pending",
    },
    action: "reject",
    reviewerId: "u1",
    reviewedAt: "2026-07-26T13:00:00.000Z",
  });

  assert.equal(result.request.status, "rejected");
  assert.equal(result.absence, null);
});
