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
      // Orario del permesso: passa dalla richiesta all'assenza approvata.
      startTime: String(request.startTime || "").trim(),
      endTime: String(request.endTime || "").trim(),
      note: String(request.note || "").trim(),
      createdAt: existingAbsence?.createdAt || reviewedAt,
      updatedAt: reviewedAt,
      updatedBy: String(reviewerId || "").trim(),
    },
  };
}

export function validateAbsenceInput({ date, type, startTime = '', endTime = '' }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) return 'Data assenza non valida.';
  if (!['none','vacation','permit','sick'].includes(type)) return 'Tipo assenza non valido.';
  if (type === 'permit' && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= startTime)) return 'Per il permesso indica un orario finale successivo a quello iniziale.';
  return '';
}
