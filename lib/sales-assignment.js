export const DEFAULT_SALES_ASSIGNMENTS = ["Ivan", "Gabriele"];

const UNASSIGNED_ASSIGNMENT_KEYS = new Set([
  "non assegnato",
  "non assegnata",
  "da assegnare",
  "unassigned",
  "none",
  "na",
]);

export function normalizeSalesAssignmentKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCatalogAssignmentLabel(entry = "") {
  if (entry && typeof entry === "object") {
    return String(entry.label || entry.value || "").trim();
  }
  return String(entry || "").trim();
}

export function getSalesAssignmentOptionLabels(catalogAssignments = [], defaults = DEFAULT_SALES_ASSIGNMENTS) {
  const labels = [];
  const seen = new Set();
  const append = (value = "") => {
    const label = getCatalogAssignmentLabel(value);
    const key = normalizeSalesAssignmentKey(label);
    if (!key || seen.has(key) || UNASSIGNED_ASSIGNMENT_KEYS.has(key)) return;
    seen.add(key);
    labels.push(label);
  };
  defaults.forEach(append);
  catalogAssignments.forEach(append);
  return labels;
}

export function normalizeSalesAssignmentValue(value = "", catalogAssignments = []) {
  const raw = String(value || "").trim();
  const key = normalizeSalesAssignmentKey(raw);
  if (!key || UNASSIGNED_ASSIGNMENT_KEYS.has(key)) return "";
  const options = getSalesAssignmentOptionLabels(catalogAssignments);
  const match = options.find((label) => {
    const optionKey = normalizeSalesAssignmentKey(label);
    return optionKey && (key === optionKey || key.includes(optionKey) || optionKey.includes(key));
  });
  return match || "";
}

export function normalizeSalesAssignmentFilterValue(value = "", catalogAssignments = []) {
  const raw = String(value || "").trim();
  const key = normalizeSalesAssignmentKey(raw);
  if (!key || key === "all" || key === "tutte" || key === "tutti") return "all";
  if (UNASSIGNED_ASSIGNMENT_KEYS.has(key)) return "unassigned";
  const canonical = normalizeSalesAssignmentValue(raw, catalogAssignments);
  return normalizeSalesAssignmentKey(canonical || raw) || "all";
}

export function matchesSalesAssignmentFilter(rawAssignment = "", filter = "all", catalogAssignments = []) {
  const filterKey = normalizeSalesAssignmentFilterValue(filter, catalogAssignments);
  if (filterKey === "all") return true;
  const assignment = normalizeSalesAssignmentValue(rawAssignment, catalogAssignments) || String(rawAssignment || "").trim();
  const assignmentKey = normalizeSalesAssignmentKey(assignment);
  if (filterKey === "unassigned") return !assignmentKey || UNASSIGNED_ASSIGNMENT_KEYS.has(assignmentKey);
  if (!assignmentKey) return false;
  return assignmentKey === filterKey || assignmentKey.includes(filterKey) || filterKey.includes(assignmentKey);
}
