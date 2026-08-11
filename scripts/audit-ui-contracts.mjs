import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readText(fileName) {
  return readFile(resolve(ROOT, fileName), "utf8");
}

function assertIncludes(source, needle, message, failures) {
  if (!source.includes(needle)) failures.push(message);
}

function assertMatches(source, regex, message, failures) {
  if (!regex.test(source)) failures.push(message);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const bodyStart = source.indexOf("{", start);
  if (bodyStart < 0) return "";
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return "";
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addLiteralMatches(source, regex, targetSet) {
  let match;
  while ((match = regex.exec(source))) {
    const value = String(match[1] || match[2] || "").trim();
    if (/^[a-z][a-z0-9-]*$/i.test(value)) targetSet.add(value);
  }
}

function extractStaticDataActions(...sources) {
  const actions = new Set();
  sources.forEach((source) => {
    addLiteralMatches(source, /data-action="([^"]+)"/g, actions);
    addLiteralMatches(source, /data-action='([^']+)'/g, actions);
    addLiteralMatches(source, /\.dataset\.action\s*=\s*"([^"]+)"/g, actions);
    addLiteralMatches(source, /\.dataset\.action\s*=\s*'([^']+)'/g, actions);
  });
  return actions;
}

function isActionExplicitlyHandled(appJs, action) {
  const escaped = escapeRegExp(action);
  const patterns = [
    new RegExp(`\\baction\\s*(?:={2,3}|!={1,2})\\s*["']${escaped}["']`),
    new RegExp(`\\.dataset\\.action\\s*(?:={2,3}|!={1,2})\\s*["']${escaped}["']`),
    new RegExp(`\\[data-action=["']${escaped}["']\\]`),
    new RegExp(`case\\s+["']${escaped}["']\\s*:`),
  ];
  return patterns.some((pattern) => pattern.test(appJs));
}

const SUBMIT_ACTION_CONTRACTS = {
  "communications-send-message": [
    /id="communications-message-form"/,
    /messageForm\.addEventListener\("submit"/,
    /sendCommunicationMessage\(messageForm\)/,
  ],
};

function auditDataActionCoverage(appJs, indexHtml, failures) {
  const actions = [...extractStaticDataActions(appJs, indexHtml)].sort();
  const unhandled = actions.filter((action) => {
    if (isActionExplicitlyHandled(appJs, action)) return false;
    const submitContract = SUBMIT_ACTION_CONTRACTS[action];
    if (!submitContract) return true;
    const contractSource = `${appJs}\n${indexHtml}`;
    const missing = submitContract.filter((pattern) => !pattern.test(contractSource));
    if (missing.length) {
      failures.push(`Submit data-action ${action} is missing its form submit contract`);
      return false;
    }
    return false;
  });
  if (unhandled.length) {
    failures.push(`Unhandled data-action values: ${unhandled.join(", ")}`);
  }
}

async function main() {
  const [appJs, indexHtml, stylesCss] = await Promise.all([
    readText("app.js"),
    readText("index.html"),
    readText("styles.css"),
  ]);
  const failures = [];

  // Generic click coverage: every static data-action rendered by the app must
  // be referenced by a handler or an explicit delegated selector.
  auditDataActionCoverage(appJs, indexHtml, failures);

  // Topbar search: the visible anchor must be wired to the Cmd+K overlay.
  assertMatches(
    indexHtml,
    /id="topbar-search-input"[^>]+data-action="open-global-search"/,
    "Topbar search is missing data-action=\"open-global-search\"",
    failures,
  );
  ["cmd-k-overlay", "cmd-k-input", "cmd-k-results", "cmd-k-empty"].forEach((id) => {
    assertIncludes(indexHtml, `id="${id}"`, `Global search DOM is missing #${id}`, failures);
  });
  assertIncludes(appJs, 'if (action === "open-global-search")', "Global click handler does not handle open-global-search", failures);
  assertIncludes(appJs, "showGlobalSearchDialog();", "open-global-search does not call showGlobalSearchDialog()", failures);

  // Mobile filter sheet: the floating control must have matching open/close/apply wiring.
  ["mobile-filter-sheet", "mobile-filter-fab", "mobile-filter-sheet-close", "mobile-filter-sheet-apply"].forEach((id) => {
    assertIncludes(indexHtml, `id="${id}"`, `Mobile filter DOM is missing #${id}`, failures);
  });
  ["openMobileFilterSheet", "closeMobileFilterSheet"].forEach((fnName) => {
    assertIncludes(appJs, `function ${fnName}`, `Mobile filter function ${fnName} is missing`, failures);
  });
  assertIncludes(appJs, 'bindEvent(ui.mobileFilterFab, "click", () => openMobileFilterSheet())', "Mobile filter FAB is not bound to openMobileFilterSheet()", failures);
  assertIncludes(appJs, 'bindEvent(ui.mobileFilterSheetApply, "click", () => closeMobileFilterSheet())', "Mobile filter apply button is not bound to closeMobileFilterSheet()", failures);
  assertMatches(
    stylesCss,
    /body\.mobile-safe-mode\.mobile-bottom-nav-visible \.main-content\s*{[^}]+overflow-y:\s*auto/i,
    "Mobile bottom-nav layout must keep .main-content as the scroll container",
    failures,
  );

  // Mobile "Altro" sheet: it must be reachable from bottom nav and close on navigation.
  assertIncludes(indexHtml, 'id="mobile-more-sheet"', "Mobile more sheet DOM is missing", failures);
  assertIncludes(appJs, 'data-action="open-more-sheet"', "Mobile bottom nav does not render open-more-sheet", failures);
  assertIncludes(appJs, 'if (action === "open-more-sheet")', "Mobile more sheet open handler is missing", failures);
  assertIncludes(appJs, 'else if (action === "close-more-sheet")', "Mobile more sheet close handler is missing", failures);
  assertIncludes(appJs, "closeMoreSheet();", "Mobile more sheet does not close through closeMoreSheet()", failures);

  // DDT libero: the entry point must set the free-DDT state and reveal the editor on mobile.
  assertIncludes(indexHtml, 'data-action="ddt-new-free"', "DDT libero button is missing", failures);
  const ddtFreeHandler = appJs.slice(appJs.indexOf('if (action === "ddt-new-free")'), appJs.indexOf('if (action === "ddt-select-free")'));
  assertIncludes(ddtFreeHandler, 'state.selectedDdtKind = "free"', "DDT libero handler does not select the free DDT kind", failures);
  assertIncludes(ddtFreeHandler, "revealDdtEditorOnMobile()", "DDT libero handler does not reveal the editor on mobile", failures);

  // Order-based mobile drill: selecting an item should open a fullscreen detail on narrow screens.
  const selectOrderHandler = appJs.slice(appJs.indexOf('if (action === "select-order")'), appJs.indexOf('if (action === "open-modal")'));
  assertIncludes(selectOrderHandler, "openMobileDrillDetail(nextView, id)", "select-order handler no longer opens mobile drill detail", failures);
  ["orders", "warehouse", "installations", "accounting"].forEach((view) => {
    assertIncludes(selectOrderHandler, `nextView === "${view}"`, `select-order mobile drill no longer covers ${view}`, failures);
  });

  // Pose subviews: rows in Programmate/Completate must open the same mobile detail
  // contract as the main Pose board, preserving the correct mobile lane.
  assertIncludes(appJs, 'data-action="select-order-install"', "Pose subview rows are missing select-order-install", failures);
  const subViewFunction = extractFunction(appJs, "openInstallationOrderFromSubView");
  assertIncludes(subViewFunction, "state.installMobileLane = getInstallationLane(order)", "Pose subview open does not select the target lane", failures);
  assertIncludes(subViewFunction, 'setView("installations")', "Pose subview open does not navigate to the main Pose board", failures);
  assertIncludes(subViewFunction, 'openMobileDrillDetail("installations", orderId)', "Pose subview open does not open mobile drill detail", failures);
  assertIncludes(appJs, "openInstallationOrderFromSubView(orderId)", "select-order-install listener does not call openInstallationOrderFromSubView()", failures);

  if (failures.length) {
    console.error("UI contract audit failed:");
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log("UI contract audit passed");
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
