function normalizeRequestStatus(value = "") {
  return String(value || "").trim().toLowerCase() || "pending";
}

export function listPendingAbsenceRequests(requests = []) {
  return (Array.isArray(requests) ? requests : [])
    .filter((request) => normalizeRequestStatus(request?.status) === "pending")
    .sort((a, b) => (
      String(a?.date || "").localeCompare(String(b?.date || ""))
      || String(a?.requestedAt || "").localeCompare(String(b?.requestedAt || ""))
    ));
}

export function reviewAbsenceRequest({
  request,
  action,
  reviewerId,
  reviewedAt = new Date().toISOString(),
  existingAbsence = null,
} = {}) {
  if (!request || normalizeRequestStatus(request.status) !== "pending") {
    throw new Error("absence_request_not_pending");
  }
  if (!["approve", "reject"].includes(action)) {
    throw new Error("invalid_review_action");
  }

  const reviewedRequest = {
    ...request,
    status: action === "approve" ? "approved" : "rejected",
    updatedAt: reviewedAt,
    reviewedAt,
    reviewedBy: String(reviewerId || "").trim(),
  };

  if (action === "reject") {
    return { request: reviewedRequest, absence: null };
  }

  return {
    request: reviewedRequest,
    absence: {
      ...(existingAbsence || {}),
      userId: String(request.userId || "").trim(),
      date: String(request.date || "").trim(),
      type: String(request.type || "").trim(),
      note: String(request.note || "").trim(),
      createdAt: existingAbsence?.createdAt || reviewedAt,
      updatedAt: reviewedAt,
      updatedBy: String(reviewerId || "").trim(),
    },
  };
}
