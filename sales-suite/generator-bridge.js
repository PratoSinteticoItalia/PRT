(function generatorBridge() {
  const PREFILL_STORAGE_KEY = "quote-generator-prefill";
  const BRANDING_STORAGE_KEY = "quote-generator-branding";
  const PLANNER_REPORT_STORAGE_KEY = "quote-generator-planner-report";
  const PLANNER_BRIDGE_STORAGE_KEY = "garden-planner-quote-bridge-v1";
  const QUOTE_RECOMMENDATION_STORAGE_KEY = "quote-generator-recommendation-v1";
  const URL_PARAMS = new URLSearchParams(window.location.search);
  let lastUrlPrefill = "";
  let lastStoragePrefill = "";
  let scheduledPrefillRunId = 0;
  let lastAppliedPrefillSignature = "";
  let lastBrandingStorage = "";
  let lastPlannerReportStorage = "";
  let activeBrandingPayload = { crewName: "", crewLogoDataUrl: "" };
  let activePlannerReport = { title: "", client: "", address: "", sqmLabel: "", reportHtml: "" };
  let pdfDownloadInterceptionActive = false;
  let pdfCompactExportCleanupTimer = 0;
  let plannerReportCleanupTimer = 0;
  let scheduledScrollTop = 0;
  let scheduledHeightReport = 0;
  let scheduledBridgeSync = 0;
  let scheduledEnsureEditTimer = 0;
  let bridgeSyncQueued = false;
  let bridgeSyncBurstRuns = 0;
  const brandingLogoExportCache = new Map();
  let plannerBridgeReadEnabled = URL_PARAMS.get("planner") === "1";
  const originalLocalStorageGetItem = window.localStorage?.getItem?.bind(window.localStorage);
  const ENABLE_PREVIEW_POLISH = false;
  const ENABLE_BRANDING_EXPORT = true;
  const ENABLE_PLANNER_REPORT_EXPORT = false;

  function notifyPortalUsage(eventType, meta = {}) {
    try {
      window.parent?.postMessage({
        type: "quote-generator:usage-event",
        eventType,
        meta,
      }, "*");
    } catch {}
  }

  function readJsonStorage(key, fallback = null) {
    try {
      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) return fallback;
      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function setPlannerBridgeReadEnabled(enabled) {
    plannerBridgeReadEnabled = Boolean(enabled);
    document.documentElement.dataset.generatorPlannerBridgeMode = plannerBridgeReadEnabled ? "planner" : "standard";
  }

  if (originalLocalStorageGetItem && window.localStorage) {
    window.localStorage.getItem = function patchedGetItem(key) {
      const normalizedKey = String(key || "");
      if (
        !plannerBridgeReadEnabled
        && (normalizedKey === PLANNER_BRIDGE_STORAGE_KEY || normalizedKey === PLANNER_REPORT_STORAGE_KEY)
      ) {
        return null;
      }
      return originalLocalStorageGetItem(key);
    };
  }

  function normalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function labelMatchesField(labelValue, expectedValue) {
    const label = normalizeLabel(labelValue);
    const expected = normalizeLabel(expectedValue);
    if (!label || !expected) return false;
    if (label === expected) return true;
    if (!label.includes(" ") && !expected.includes(" ")) return false;
    return label.includes(expected) || expected.includes(label);
  }

  function splitFullName(fullName) {
    const value = String(fullName || "").trim().replace(/\s+/g, " ");
    if (!value) return { nome: "", cognome: "" };

    const parts = value.split(" ");
    if (parts.length === 1) {
      return { nome: value, cognome: "" };
    }

    return {
      nome: parts.slice(0, -1).join(" "),
      cognome: parts.slice(-1).join(" "),
    };
  }

  function buildCustomerPayload(request) {
    const explicitNome = String(request?.nome || "").trim();
    const explicitCognome = String(request?.cognome || "").trim();
    const splitName = explicitCognome ? { nome: explicitNome, cognome: explicitCognome } : splitFullName(explicitNome);

    return {
      nome: splitName.nome,
      cognome: splitName.cognome,
      citta: String(request?.citta || "").trim(),
      telefono: String(request?.telefono || "").trim(),
      email: String(request?.email || "").trim(),
    };
  }

  function buildPayloadSignature(payload) {
    if (!payload || typeof payload !== "object") return "";

    const customer = buildCustomerPayload(payload);
    return JSON.stringify({
      nome: customer.nome,
      cognome: customer.cognome,
      citta: customer.citta,
      telefono: customer.telefono,
      email: customer.email,
      mq: payload?.mq != null && payload?.mq !== "" ? String(payload.mq).replace(",", ".") : "",
      altezza: String(payload?.altezza || payload?.height || payload?.requestedHeight || "").trim(),
      servizio: normalizeServiceStateValue(payload?.servizio || payload?.service || payload?.tipologia || ""),
      fondo: normalizeSurfaceValue(payload?.fondo || payload?.superficie || payload?.surface || ""),
    });
  }

  function normalizeBrandingPayload(payload) {
    return {
      crewName: String(payload?.crewName || "").trim(),
      crewLogoDataUrl: String(payload?.crewLogoDataUrl || "").trim(),
    };
  }

  function buildBrandingSignature(payload) {
    const normalized = normalizeBrandingPayload(payload);
    return JSON.stringify(normalized);
  }

  function normalizePlannerReportPayload(payload) {
    return {
      title: String(payload?.title || "").trim(),
      client: String(payload?.client || "").trim(),
      address: String(payload?.address || "").trim(),
      sqmLabel: String(payload?.sqmLabel || "").trim(),
      reportHtml: sanitizePlannerReportHtml(payload?.reportHtml),
    };
  }

  function isPdfArtifactText(text = "") {
    const value = String(text || "").trim();
    if (!value) return false;
    return (
      value.includes("@media print")
      || value.includes(".pdf-root")
      || value.includes(".pdf-no-break")
      || value.includes("print-color-adjust")
      || value.includes("page-break-inside")
      || value.includes("break-inside")
      || value.includes("@page")
    );
  }

  function removePdfArtifactTextNodes(rootNode) {
    if (!(rootNode instanceof Node)) return;
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
    const staleNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (isPdfArtifactText(node.textContent || "")) {
        staleNodes.push(node);
      }
    }
    staleNodes.forEach((node) => node.remove());
  }

  function sanitizePlannerReportHtml(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const shell = document.createElement("div");
    shell.innerHTML = raw;
    shell.querySelectorAll("script, style, link[rel='stylesheet'], #codex-pdf-export-style").forEach((node) => node.remove());
    removePdfArtifactTextNodes(shell);
    return shell.innerHTML.trim();
  }

  const PDF_EXPORT_STYLE_TEXT = `
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }

      .print\\:hidden {
        display: none !important;
      }

      @page {
        size: A4;
        margin: 3mm;
      }
    }

    .pdf-root {
      background: #fff;
      overflow: hidden;
    }

    .pdf-no-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-root.codex-pdf-export-compact {
      overflow: hidden !important;
      width: 204mm !important;
      max-width: 204mm !important;
      margin: 0 auto !important;
      transform: none !important;
    }

    .pdf-root.codex-pdf-export-compact > div {
      padding: 10px 18px 4px !important;
    }

    .pdf-root.codex-pdf-export-compact .pdf-no-break {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-header-grid {
      gap: 6px !important;
      margin-bottom: 6px !important;
      align-items: stretch !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-header-panel {
      padding: 7px 10px !important;
      border-radius: 8px !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .pdf-root .codex-pdf-offer-heading-wrap {
      margin-top: 10px !important;
      margin-bottom: 10px !important;
      text-align: center !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-offer-heading {
      color: #ffffff !important;
      padding: 6px 14px !important;
      font-size: 16px !important;
      font-weight: 900 !important;
      line-height: 1.1 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .pdf-root .codex-pdf-offer-heading .codex-offer-heading-text {
      color: #ffffff !important;
      display: inline-block !important;
      font: inherit !important;
      font-weight: 900 !important;
      letter-spacing: inherit !important;
      line-height: inherit !important;
      opacity: 1 !important;
      visibility: visible !important;
      white-space: nowrap !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-pricing-table th {
      padding-top: 8px !important;
      padding-bottom: 8px !important;
      vertical-align: middle !important;
      text-align: center !important;
      line-height: 1.2 !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-pricing-table th > * {
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-pricing-table td {
      padding-top: 5px !important;
      padding-bottom: 5px !important;
      vertical-align: middle !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-pricing-table tbody td:first-child {
      padding-top: 6px !important;
      padding-bottom: 7px !important;
      vertical-align: middle !important;
    }

    .pdf-root .codex-pdf-pricing-table td,
    .pdf-root .codex-pdf-pricing-table th {
      vertical-align: middle !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-material-panel {
      padding: 7px 10px !important;
      margin-bottom: 6px !important;
      line-height: 1.34 !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-material-panel p {
      margin-top: 0 !important;
      margin-bottom: 3px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-material-panel [style*="margin-top"] {
      margin-top: 4px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-feature-grid {
      gap: 5px !important;
      margin-bottom: 7px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-feature-grid > * {
      min-height: 58px !important;
      padding: 7px 8px !important;
      gap: 3px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-feature-grid > * > *:first-child {
      min-height: 14px !important;
      font-size: 13px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-feature-grid > * > * {
      line-height: 1.18 !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-permq-grid {
      gap: 5px !important;
      margin-bottom: 10px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-permq-grid > * {
      padding: 7px 5px !important;
      border-radius: 8px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-permq-grid > * [style*="font-size: 20"] {
      font-size: 18px !important;
      margin-top: 2px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-payment-panel {
      padding: 8px 10px !important;
      margin-bottom: 5px !important;
      border-radius: 8px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-heylight-heading {
      margin-top: 6px !important;
      margin-bottom: 8px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-heylight-grid {
      gap: 5px !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-heylight-grid > * {
      min-height: 55px !important;
      padding: 8px 9px !important;
      gap: 4px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-heylight-grid > * > * {
      line-height: 1.18 !important;
      min-height: 0 !important;
      text-align: center !important;
    }

    .pdf-root.codex-pdf-export-compact .codex-pdf-signature-row {
      margin-top: 2px !important;
    }
  `;

  function ensurePdfExportStyles() {
    if (document.getElementById("codex-pdf-export-style")) return;
    const style = document.createElement("style");
    style.id = "codex-pdf-export-style";
    style.textContent = PDF_EXPORT_STYLE_TEXT;
    document.head.appendChild(style);
  }

  function addExportClass(element, className, cleanup) {
    if (!(element instanceof HTMLElement) || element.classList.contains(className)) return;
    element.classList.add(className);
    cleanup.push(() => element.classList.remove(className));
  }

  function findGridAncestor(element, stopAt) {
    let current = element;
    while (current && current !== stopAt && current !== document.body) {
      if (current instanceof HTMLElement) {
        const display = window.getComputedStyle(current).display;
        if (display.includes("grid")) return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function findPanelAncestor(element, stopAt, maxDepth = 6) {
    let current = element;
    let depth = 0;
    while (current && current !== stopAt && current !== document.body && depth < maxDepth) {
      if (current instanceof HTMLElement) {
        const style = window.getComputedStyle(current);
        const hasPanelShape = parseFloat(style.borderRadius || "0") >= 6
          || style.borderStyle !== "none"
          || normalizeLabel(current.getAttribute("class") || "").includes("pdf no break");
        if (hasPanelShape) return current;
      }
      current = current.parentElement;
      depth += 1;
    }
    return null;
  }

  function prepareCompactQuoteForPdfExport(pdfRoot) {
    ensurePdfExportStyles();
    const cleanup = [];
    addExportClass(pdfRoot, "codex-pdf-export-compact", cleanup);

    const offerHeading = findElementByTextWithin(pdfRoot, "div, span, p", "OFFERTA PER");
    if (offerHeading instanceof HTMLElement) {
      addExportClass(offerHeading, "codex-pdf-offer-heading", cleanup);
      addExportClass(offerHeading.parentElement, "codex-pdf-offer-heading-wrap", cleanup);
    }

    const pricingTable = findPricingTable(pdfRoot);
    if (pricingTable instanceof HTMLElement) {
      addExportClass(pricingTable, "codex-pdf-pricing-table", cleanup);
    }

    const clientLabel = findElementByTextWithin(pdfRoot, "div, span, p", "Cliente")
      || findElementByTextWithin(pdfRoot, "div, span, p", "Rivenditore");
    const validityLabel = findElementByTextWithin(pdfRoot, "div, span, p", "Validità");
    const clientPanel = clientLabel instanceof HTMLElement ? findPanelAncestor(clientLabel, pdfRoot, 5) : null;
    const validityPanel = validityLabel instanceof HTMLElement ? findPanelAncestor(validityLabel, pdfRoot, 5) : null;
    const headerGrid = clientPanel ? findGridAncestor(clientPanel, pdfRoot) : null;
    addExportClass(headerGrid, "codex-pdf-header-grid", cleanup);
    addExportClass(clientPanel, "codex-pdf-header-panel", cleanup);
    addExportClass(validityPanel, "codex-pdf-header-panel", cleanup);

    const materialMarker = findElementByTextWithin(pdfRoot, "strong, p, div, span", "Dettagli materiali")
      || findElementByTextWithin(pdfRoot, "p, div, span", "La posa")
      || findElementByTextWithin(pdfRoot, "p, div, span", "La fornitura");
    const materialPanel = materialMarker instanceof HTMLElement ? findPanelAncestor(materialMarker, pdfRoot, 5) : null;
    addExportClass(materialPanel, "codex-pdf-material-panel", cleanup);

    const featureMarker = findElementByTextWithin(pdfRoot, "div, span, p", "4,8 su Google");
    const featureGrid = featureMarker instanceof HTMLElement ? findGridAncestor(featureMarker, pdfRoot) : null;
    addExportClass(featureGrid, "codex-pdf-feature-grid", cleanup);

    const perMqMarker = findElementByTextWithin(pdfRoot, "div, span, p", "al mq finale");
    const perMqGrid = perMqMarker instanceof HTMLElement ? findGridAncestor(perMqMarker, pdfRoot) : null;
    addExportClass(perMqGrid, "codex-pdf-permq-grid", cleanup);

    const paymentMarker = findElementByTextWithin(pdfRoot, "div, span, p", "Metodi di pagamento");
    const paymentPanel = paymentMarker instanceof HTMLElement ? findPanelAncestor(paymentMarker, pdfRoot, 5) : null;
    addExportClass(paymentPanel, "codex-pdf-payment-panel", cleanup);

    const heylightHeading = findElementByTextWithin(pdfRoot, "div, span, p", "Simulazione 5 rate HeyLight");
    if (heylightHeading instanceof HTMLElement) {
      addExportClass(heylightHeading, "codex-pdf-heylight-heading", cleanup);
      const heylightGrid = findGridAncestor(heylightHeading.nextElementSibling, pdfRoot)
        || findGridAncestor(heylightHeading, pdfRoot);
      addExportClass(heylightGrid, "codex-pdf-heylight-grid", cleanup);
    }

    const signatureMarker = findElementByTextWithin(pdfRoot, "div, span, p", "Firma per accettazione");
    const signatureRow = signatureMarker instanceof HTMLElement ? signatureMarker.closest(".pdf-no-break") : null;
    addExportClass(signatureRow, "codex-pdf-signature-row", cleanup);

    fixHeylightReadability(pdfRoot);
    fixPerMqCardsReadability(pdfRoot);
    polishOfferHeading(pdfRoot);
    polishAccessoriesTable(pdfRoot);
    injectMaterialsDiscount(pdfRoot);

    return () => {
      while (cleanup.length) {
        const removeClass = cleanup.pop();
        try {
          removeClass();
        } catch {
          // Best-effort cleanup: the PDF clone may already have been removed.
        }
      }
    };
  }

  function scheduleCompactQuoteExportCleanup(cleanup) {
    if (pdfCompactExportCleanupTimer) {
      window.clearTimeout(pdfCompactExportCleanupTimer);
    }
    pdfCompactExportCleanupTimer = window.setTimeout(() => {
      pdfCompactExportCleanupTimer = 0;
      cleanup?.();
    }, 9000);
  }

  function stripPdfStyleArtifacts(rootNode) {
    const artifactRoots = rootNode instanceof Element && rootNode.matches(".codex-planner-report-appendix")
      ? [rootNode]
      : Array.from(document.querySelectorAll(".codex-planner-report-appendix"));
    artifactRoots.forEach((root) => {
      root.querySelectorAll("style").forEach((styleNode) => {
        const cssText = String(styleNode.textContent || "");
        if (cssText.includes("@media print") || cssText.includes(".pdf-root")) {
          styleNode.remove();
        }
      });
      removePdfArtifactTextNodes(root);
    });
  }

  function waitForAnimationFrame() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  function ensureEmbeddedLayoutStyles() {
    if (document.getElementById("codex-embedded-generator-style")) return;
    const style = document.createElement("style");
    style.id = "codex-embedded-generator-style";
    style.textContent = `
      html,
      body,
      #root {
        min-height: 0 !important;
        height: auto !important;
        overflow: hidden !important;
      }

      body {
        margin: 0 !important;
        background: transparent !important;
      }

      #root > .min-h-screen {
        min-height: 0 !important;
        height: auto !important;
        overflow: visible !important;
        padding: 10px 10px 14px !important;
      }

      #root > .min-h-screen > .max-w-4xl.mx-auto {
        width: min(100%, 1560px) !important;
        max-width: min(100%, 1560px) !important;
      }

      @media (max-width: 980px) {
        #root > .min-h-screen {
          padding: 10px 8px 14px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureRecommendationStyles() {
    if (document.getElementById("codex-recommended-quote-style")) return;
    const style = document.createElement("style");
    style.id = "codex-recommended-quote-style";
    style.textContent = `
      .codex-quote-recommendation-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        margin-right: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
      }

      .codex-quote-recommendation-toolbar label {
        color: #e2e8f0;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }

      .codex-quote-recommendation-toolbar select {
        min-width: 220px;
        border: 1px solid rgba(226,232,240,0.16);
        border-radius: 10px;
        background: rgba(15,23,42,0.28);
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 10px;
        outline: none;
      }

      .codex-quote-recommendation-toolbar option {
        color: #0f172a;
      }

      .pdf-root .codex-recommended-row {
        background: linear-gradient(90deg, rgba(238,243,237,0.96) 0%, rgba(255,255,255,1) 100%);
      }

      .pdf-root .codex-recommended-row td:first-child {
        box-shadow: inset 4px 0 0 #3d5a3f;
      }

      .pdf-root .codex-recommended-row td:first-child::after,
      .pdf-root .codex-recommended-card::after {
        content: none !important;
        display: none !important;
      }

      .pdf-root .codex-recommended-card {
        border-color: #2f4631 !important;
        box-shadow: 0 4px 12px rgba(47,70,49,0.14) !important;
        transform: translateY(-1px);
        background: linear-gradient(180deg, #ffffff 0%, #f4f8f4 100%) !important;
      }

      @media (max-width: 1280px) {
        .codex-quote-recommendation-toolbar {
          margin-right: 0;
        }

        .codex-quote-recommendation-toolbar select {
          min-width: 180px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isVisibleMeasureNode(node, { allowFixed = false } = {}) {
    if (!(node instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (!allowFixed && (style.position === "fixed" || style.position === "absolute")) return false;
    return node.getClientRects().length > 0;
  }

  function measureElementHeight(node) {
    if (!isVisibleMeasureNode(node, { allowFixed: true })) return 0;
    const rect = node.getBoundingClientRect();
    return Math.max(
      Math.ceil(rect.height || 0),
      Math.ceil(node.scrollHeight || 0),
      Math.ceil(node.offsetHeight || 0),
    );
  }

  function isEmbeddedEditModeActive(rootNode = document) {
    return Array.from(rootNode.querySelectorAll("input, select, textarea"))
      .some((node) => isVisibleMeasureNode(node, { allowFixed: true }));
  }

  function measureVisibleContentHeight(rootNode, { ignorePdfRoot = false } = {}) {
    if (!(rootNode instanceof HTMLElement)) return 0;
    const rootRect = rootNode.getBoundingClientRect();
    const visibleNodes = Array.from(rootNode.querySelectorAll("*"))
      .filter((node) => isVisibleMeasureNode(node))
      .filter((node) => !(ignorePdfRoot && node.closest(".pdf-root")))
      .filter((node) => {
        const style = window.getComputedStyle(node);
        return style.position !== "sticky" && style.opacity !== "0";
      });
    return visibleNodes.reduce((maxHeight, node) => {
      const rect = node.getBoundingClientRect();
      return Math.max(maxHeight, Math.ceil(rect.bottom - rootRect.top));
    }, Math.ceil(rootRect.height || 0));
  }

  function isHtml2PdfArtifactNode(node) {
    return node instanceof Element
      && Boolean(node.closest(".html2pdf__overlay, .html2pdf__container"));
  }

  function getLivePdfRoot(rootNode = document) {
    if (rootNode instanceof Element && rootNode.matches(".pdf-root") && !isHtml2PdfArtifactNode(rootNode)) {
      return rootNode;
    }
    return Array.from(rootNode.querySelectorAll?.(".pdf-root") || [])
      .find((node) => node instanceof Element && !isHtml2PdfArtifactNode(node)) || null;
  }

  function reportEmbeddedContentHeight() {
    if (scheduledHeightReport) {
      window.cancelAnimationFrame(scheduledHeightReport);
    }
    scheduledHeightReport = window.requestAnimationFrame(() => {
      scheduledHeightReport = 0;
      ensureEmbeddedLayoutStyles();
      const rootHost = document.getElementById("root");
      const shell = rootHost?.firstElementChild;
      const pdfRoot = getLivePdfRoot(document);
      const contentRoot = document.querySelector("#root > .min-h-screen > .max-w-4xl.mx-auto") || shell || rootHost;
      const editModeActive = isEmbeddedEditModeActive(document);
      const visibleContentHeight = measureVisibleContentHeight(contentRoot, { ignorePdfRoot: editModeActive });
      const pdfHeight = measureElementHeight(pdfRoot);
      const documentHeight = editModeActive
        ? visibleContentHeight
        : Math.max(
          measureElementHeight(contentRoot),
          measureElementHeight(shell),
          measureElementHeight(rootHost),
          pdfHeight,
          visibleContentHeight,
        );
      const preferredHeight = Math.min(5200, Math.max(520, Number(documentHeight || 0) + 18));
      try {
        window.parent?.postMessage({ type: "quote-generator:content-height", height: preferredHeight }, "*");
      } catch {}
    });
  }

  function scrollGeneratorViewportToTop() {
    if (scheduledScrollTop) {
      window.cancelAnimationFrame(scheduledScrollTop);
    }
    scheduledScrollTop = window.requestAnimationFrame(() => {
      scheduledScrollTop = 0;
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      reportEmbeddedContentHeight();
    });
  }

  function requestBridgeSyncBurst(runs = 1) {
    bridgeSyncBurstRuns = Math.max(bridgeSyncBurstRuns, Number(runs) || 0);
    scheduleBridgeSync();
  }

  function scheduleBridgeSync() {
    if (bridgeSyncQueued) return;
    bridgeSyncQueued = true;
    window.requestAnimationFrame(() => {
      bridgeSyncQueued = false;
      ensureEmbeddedLayoutStyles();
      hideInternalImportPanel();
      syncCustomAccessoryPriceEditors();
      syncRecommendedQuoteLayout();
      tryInjectTeNow();
      const payload = readPrefillFromStorage() || readPrefillFromUrl();
      if (payload) scheduleRequestPayload(payload);
      {
        const brandingPayload = readBrandingFromStorage();
        if (brandingPayload) {
          applyBrandingPayloadNow(brandingPayload);
        } else if (activeBrandingPayload.crewLogoDataUrl) {
          applyBrandingPayloadNow(activeBrandingPayload);
        }
      }
      if (ENABLE_PLANNER_REPORT_EXPORT) {
        const plannerReportPayload = readPlannerReportFromStorage();
        if (plannerReportPayload) {
          applyPlannerReportPayloadNow(plannerReportPayload);
        }
      } else {
        clearInjectedPlannerReport();
      }
      fixHeylightReadability(document.body);
      fixPerMqCardsReadability(document.body);
      polishOfferHeading(document.body);
      polishAccessoriesTable(document.body);
      injectMaterialsDiscount(document.body);
      polishGeneratorToolbar();
      applyLivePreviewNorm(document.body);
      if (ENABLE_PREVIEW_POLISH) polishQuotePreviewLayout(document.body);
      reportEmbeddedContentHeight();
      if (scheduledBridgeSync) {
        window.clearTimeout(scheduledBridgeSync);
        scheduledBridgeSync = 0;
      }
      if (bridgeSyncBurstRuns > 1) {
        bridgeSyncBurstRuns -= 1;
        scheduledBridgeSync = window.setTimeout(() => {
          scheduledBridgeSync = 0;
          scheduleBridgeSync();
        }, 220);
      } else {
        bridgeSyncBurstRuns = 0;
      }
    });
  }

  function waitForImageElementComplete(image) {
    if (!image) return Promise.resolve();
    if (image.complete && Number(image.naturalWidth || 0) > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const cleanup = () => {
        image.removeEventListener("load", handleDone);
        image.removeEventListener("error", handleDone);
      };
      const handleDone = () => {
        cleanup();
        resolve();
      };
      image.addEventListener("load", handleDone, { once: true });
      image.addEventListener("error", handleDone, { once: true });
    });
  }

  function loadImageFromSource(src) {
    if (!src) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "sync";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
      if (image.complete && Number(image.naturalWidth || 0) > 0) {
        resolve(image);
      }
    });
  }

  async function getExportReadyBrandingLogoDataUrl(src) {
    const normalizedSrc = String(src || "").trim();
    if (!normalizedSrc) return "";
    if (brandingLogoExportCache.has(normalizedSrc)) {
      return brandingLogoExportCache.get(normalizedSrc);
    }

    const pending = (async () => {
      try {
        const sourceImage = await loadImageFromSource(normalizedSrc);
        if (!sourceImage) return normalizedSrc;

        const sourceWidth = Math.max(1, Number(sourceImage.naturalWidth || sourceImage.width || 256));
        const sourceHeight = Math.max(1, Number(sourceImage.naturalHeight || sourceImage.height || 256));
        const maxSide = Math.max(sourceWidth, sourceHeight);
        const targetMaxSide = 512;
        const scale = targetMaxSide / maxSide;
        const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
        const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d");
        if (!context) return normalizedSrc;

        context.clearRect(0, 0, targetWidth, targetHeight);
        context.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);
        return canvas.toDataURL("image/png", 1);
      } catch (error) {
        console.warn("Logo squadra non rasterizzato per export PDF:", error);
        return normalizedSrc;
      }
    })();

    brandingLogoExportCache.set(normalizedSrc, pending);
    return pending;
  }

  async function applyExportReadyLogoToImage(image, source) {
    if (!image || !source) return;
    const exportReadySrc = await getExportReadyBrandingLogoDataUrl(source);
    if (!exportReadySrc || !image.isConnected) return;
    if (image.getAttribute("src") !== exportReadySrc) {
      image.setAttribute("src", exportReadySrc);
    }
    await waitForImageElementComplete(image);
  }

  function findFieldByLabel(labelText) {
    const expected = normalizeLabel(labelText);
    const labels = Array.from(document.querySelectorAll("label"));
    const match = labels.find((label) => {
      return labelMatchesField(label.textContent, expected);
    });
    if (!match) return null;
    return match.parentElement?.querySelector("input, textarea, select") || null;
  }

  function findHeightField() {
    const targets = Array.from(document.querySelectorAll("input, textarea, select"));
    const finder = /(altezza|spessore|\bmm\b)/i;
    return targets.find((field) => {
      const label = field.closest("label");
      const labelText = normalizeLabel(label?.textContent || "");
      const name = normalizeLabel(field.getAttribute("name") || "");
      const placeholder = normalizeLabel(field.getAttribute("placeholder") || "");
      const ariaLabel = normalizeLabel(field.getAttribute("aria-label") || "");
      const title = normalizeLabel(field.getAttribute("title") || "");
      return finder.test(labelText)
        || finder.test(name)
        || finder.test(placeholder)
        || finder.test(ariaLabel)
        || finder.test(title);
    }) || null;
  }

  function findFieldGroupByLabel(labelText) {
    const expected = normalizeLabel(labelText);
    const labels = Array.from(document.querySelectorAll("label"));
    const match = labels.find((label) => normalizeLabel(label.textContent) === expected);
    return match?.parentElement || null;
  }

  function setNativeValue(element, value) {
    if (!element) return;
    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) descriptor.set.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clickButton(button) {
    if (!button) return false;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return true;
  }

  function applyButtonValue(groupLabel, expectedButtonLabel) {
    const group = findFieldGroupByLabel(groupLabel);
    if (!group) return false;
    const expected = normalizeLabel(expectedButtonLabel);
    const buttons = Array.from(group.querySelectorAll("button"));
    const match = buttons.find((button) => normalizeLabel(button.textContent) === expected);
    return clickButton(match);
  }

  function normalizeServiceLabel(value) {
    const normalized = normalizeLabel(value);
    if (!normalized) return "";
    if (normalized.includes("posa")) return "Fornitura + Posa";
    if (normalized.includes("fornitura")) return "Solo Fornitura";
    return "";
  }

  function normalizeServiceStateValue(value) {
    const normalized = normalizeLabel(value);
    if (!normalized) return "";
    if (normalized.includes("posa")) return "posa";
    if (normalized.includes("fornitura")) return "fornitura";
    return "";
  }

  function normalizeSurfaceValue(value) {
    const normalized = normalizeLabel(value);
    if (!normalized || normalized.includes("seleziona")) return "";
    if (normalized.includes("terra")) return "terra";
    if (normalized.includes("mattonell") || normalized.includes("cement") || normalized.includes("paviment")) return "pavimentazione";
    return "";
  }

  function findElementByText(selector, text) {
    const expected = normalizeLabel(text);
    return Array.from(document.querySelectorAll(selector)).find((element) => normalizeLabel(element.textContent).includes(expected)) || null;
  }

  function findElementByTextWithin(root, selector, text) {
    if (!(root instanceof Element)) return null;
    const expected = normalizeLabel(text);
    const candidates = Array.from(root.querySelectorAll(selector)).filter(
      (element) => normalizeLabel(element.textContent).includes(expected),
    );
    if (!candidates.length) return null;
    // querySelectorAll returns DOM tree order (outermost first) — pick innermost (shortest textContent)
    // so we target the actual text node rather than a section wrapper containing many elements.
    return candidates.reduce((best, el) => el.textContent.length < best.textContent.length ? el : best);
  }

  function buildSvgDataUrl(svgMarkup) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(String(svgMarkup || "").trim())}`;
  }

  function getPaymentLogoDefinitions() {
    return [
      {
        key: "visa",
        alt: "Visa",
        width: 56,
        src: buildSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="112" height="36" viewBox="0 0 112 36">
            <rect width="112" height="36" rx="9" fill="#ffffff"/>
            <path d="M29 9h8l-5 18h-8l5-18Zm35 0-7 12-1-9c-.1-1.2-1-2-2.2-2h-13l-.2.9c2.7.6 5.8 1.6 7.7 2.7 1.2.7 1.5 1.3 1.9 2.7l5.9 10.7h8.3L77 9h-13Zm20.5 0c-2.8 0-4.9 1.4-6.1 3.6-2.4 4.5 1.6 7 4.5 8.4 3 .5 4.1 1.5 4.1 2.4 0 1.3-1.6 1.9-3.1 1.9-2.6 0-4-.4-6.1-1.3l-.9-.4-.9 6c1.5.6 4.3 1.2 7.2 1.2 3 0 5.6-1.4 6.8-3.8 2.5-4.7-1.5-7.3-4.4-8.6-1.8-.8-2.9-1.3-2.9-2.1 0-.7.8-1.4 2.6-1.4 1.5 0 2.7.3 3.5.7l.4.2.8-5.8c-1.1-.4-2.9-.9-5.4-.9Z" fill="#1a1f71"/>
          </svg>
        `),
      },
      {
        key: "mastercard",
        alt: "Mastercard",
        width: 64,
        src: buildSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="128" height="36" viewBox="0 0 128 36">
            <rect width="128" height="36" rx="9" fill="#ffffff"/>
            <circle cx="49" cy="18" r="10" fill="#eb001b"/>
            <circle cx="63" cy="18" r="10" fill="#f79e1b"/>
            <path d="M56 10a10 10 0 0 1 0 16 10 10 0 0 1 0-16Z" fill="#ff5f00"/>
            <text x="79" y="22" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="700" fill="#1f2937">mastercard</text>
          </svg>
        `),
      },
      {
        key: "paypal",
        alt: "PayPal",
        width: 62,
        src: buildSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="124" height="36" viewBox="0 0 124 36">
            <rect width="124" height="36" rx="9" fill="#ffffff"/>
            <path d="M34 8h11.5c4.4 0 7.5 2.6 6.8 7-.7 4.3-4.3 6.8-8.8 6.8h-3.6L38.7 28H32L34 8Z" fill="#003087"/>
            <path d="M42 8h9.8c4.2 0 6.7 2.7 6.1 6.6-.8 4.5-4 7.3-8.5 7.3h-3.1L45 28h-6.4L42 8Z" fill="#009cde" fill-opacity=".85"/>
            <text x="61" y="22" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#003087">PayPal</text>
          </svg>
        `),
      },
      {
        key: "bonifico",
        alt: "Bonifico bancario",
        width: 74,
        src: buildSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="148" height="36" viewBox="0 0 148 36">
            <rect width="148" height="36" rx="9" fill="#ffffff"/>
            <path d="M16 24h20v3H16Zm2-3h4v-7l8-4 8 4v7h4v2H18v-2Zm6 0h8v-5h-8v5Z" fill="#2f4631"/>
            <text x="48" y="22" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="700" fill="#1f2937">Bonifico</text>
          </svg>
        `),
      },
      {
        key: "scalapay",
        alt: "Scalapay",
        width: 72,
        src: buildSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="144" height="36" viewBox="0 0 144 36">
            <rect width="144" height="36" rx="9" fill="#ffffff"/>
            <text x="18" y="22" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#111827">SCALAPAY</text>
            <circle cx="126" cy="18" r="5" fill="#7cf3e3"/>
          </svg>
        `),
      },
      {
        key: "heylight",
        alt: "HeyLight",
        width: 70,
        src: buildSvgDataUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="36" viewBox="0 0 140 36">
            <rect width="140" height="36" rx="9" fill="#ffffff"/>
            <path d="M27 8h12l-7 8h8l-15 12 5-9h-8l5-11Z" fill="#8bc53f"/>
            <text x="51" y="22" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#243726">HeyLight</text>
          </svg>
        `),
      },
    ];
  }

  function findPricingTable(root) {
    if (!(root instanceof Element)) return null;
    return Array.from(root.querySelectorAll("table")).find((table) => {
      const headerText = normalizeLabel(table.querySelector("thead")?.textContent || "");
      return headerText.includes("modello") && headerText.includes("sconto") && headerText.includes("materiali");
    }) || null;
  }

  function getNodeText(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getDirectNodeText(node) {
    if (!(node instanceof HTMLElement)) return "";
    return Array.from(node.childNodes || [])
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => String(child.textContent || ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeModelName(value) {
    return normalizeLabel(String(value || "").replace(/\s+/g, " ").trim());
  }

  function getQuoteNumberFromPreview(root) {
    const match = String(root?.textContent || "").match(/\bF[P]?-?\d{3,5}-\d{2,3}\b/);
    return match ? match[0] : "";
  }

  function getCustomerNameFromPreview(root) {
    const labels = Array.from(root.querySelectorAll("div, span, p"));
    for (const label of labels) {
      const text = getNodeText(label);
      if (!/^nome:/i.test(text)) continue;
      return text.replace(/^nome:\s*/i, "").trim();
    }
    return "";
  }

  function buildRecommendationKey(root, modelNames = []) {
    const quoteNumber = getQuoteNumberFromPreview(root);
    const customerName = getCustomerNameFromPreview(root);
    const models = modelNames.map((item) => normalizeModelName(item)).filter(Boolean).join("|");
    return [quoteNumber, normalizeModelName(customerName), models].filter(Boolean).join("::");
  }

  function readRecommendedModel(root, modelNames = []) {
    const key = buildRecommendationKey(root, modelNames);
    if (!key) return "";
    const store = readJsonStorage(QUOTE_RECOMMENDATION_STORAGE_KEY, {});
    return typeof store[key] === "string" ? store[key] : "";
  }

  function writeRecommendedModel(root, modelNames, value) {
    const key = buildRecommendationKey(root, modelNames);
    if (!key) return false;
    const store = readJsonStorage(QUOTE_RECOMMENDATION_STORAGE_KEY, {});
    const nextValue = String(value || "").trim();
    if (nextValue) store[key] = nextValue;
    else delete store[key];
    return writeJsonStorage(QUOTE_RECOMMENDATION_STORAGE_KEY, store);
  }

  function collectQuoteModels(root) {
    const pricingTable = findPricingTable(root);
    if (!(pricingTable instanceof HTMLTableElement)) return [];
    return Array.from(pricingTable.querySelectorAll("tbody tr"))
      .map((row) => {
        const cells = Array.from(row.children || []);
        if (!cells.length) return null;
        const titleNode = cells[0].querySelector("div");
        const name = getDirectNodeText(titleNode) || getNodeText(titleNode);
        if (!name) return null;
        return {
          row,
          name,
          normalizedName: normalizeModelName(name),
        };
      })
      .filter(Boolean);
  }

  function findPerMqCards(root) {
    const cards = [];
    Array.from(root.querySelectorAll("div")).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const text = getNodeText(node);
      if (!text || !normalizeLabel(text).includes("al mq finale")) return;
      const titleNode = Array.from(node.querySelectorAll("div, span, p")).find((child) => {
        const childText = getNodeText(child);
        return /mm/i.test(childText) && !normalizeLabel(childText).includes("al mq finale");
      });
      const name = getNodeText(titleNode);
      if (!name) return;
      cards.push({ card: node, normalizedName: normalizeModelName(name) });
    });
    return cards;
  }

  function findHeylightCards(root) {
    const heading = findElementByTextWithin(root, "div, span, p", "Simulazione 5 rate HeyLight");
    if (!(heading instanceof HTMLElement)) return [];
    const section = heading.parentElement;
    const grid = Array.from(section?.children || []).find((child) => (
      child instanceof HTMLElement
      && child !== heading
      && child.style.display === "grid"
    ));
    if (!(grid instanceof HTMLElement)) return [];
    return Array.from(grid.children || [])
      .map((node) => {
        const titleNode = Array.from(node.querySelectorAll("div, span, p")).find((child) => /mm/i.test(getNodeText(child)));
        const name = getNodeText(titleNode);
        if (!name) return null;
        return { card: node, normalizedName: normalizeModelName(name) };
      })
      .filter(Boolean);
  }

  function clearRecommendationClasses(root) {
    collectQuoteModels(root).forEach((model) => {
      const node = model?.row;
      if (!(node instanceof HTMLElement)) return;
      node.classList.remove("codex-recommended-row");
      node.style.background = "";
      const firstCell = node.children?.[0];
      if (firstCell instanceof HTMLElement) {
        firstCell.style.boxShadow = "";
      }
    });
    const resetCard = (node, isHeylight = false) => {
      if (!(node instanceof HTMLElement)) return;
      node.classList.remove("codex-recommended-card");
      node.style.borderColor = "";
      node.style.boxShadow = "";
      node.style.transform = "";
      node.style.background = isHeylight ? "" : "";
    };
    findPerMqCards(root).forEach((item) => resetCard(item.card, false));
    findHeylightCards(root).forEach((item) => resetCard(item.card, true));
  }

  function applyRecommendedModelClasses(root, selectedName) {
    if (!(root instanceof HTMLElement)) return false;
    clearRecommendationClasses(root);
    if (!selectedName) return false;
    const normalizedSelected = normalizeModelName(selectedName);
    let applied = false;
    collectQuoteModels(root).forEach((model) => {
      if (model.normalizedName !== normalizedSelected) return;
      model.row.classList.add("codex-recommended-row");
      if (model.row instanceof HTMLElement) {
        model.row.style.background = "linear-gradient(90deg, rgba(238,243,237,0.96) 0%, rgba(255,255,255,1) 100%)";
      }
      const firstCell = model.row.children?.[0];
      if (firstCell instanceof HTMLElement) {
        firstCell.style.boxShadow = "inset 4px 0 0 #3d5a3f";
      }
      applied = true;
    });
    findPerMqCards(root).forEach((item) => {
      if (item.normalizedName === normalizedSelected) {
        item.card.classList.add("codex-recommended-card");
        if (item.card instanceof HTMLElement) {
          item.card.style.borderColor = "#2f4631";
          item.card.style.boxShadow = "0 4px 12px rgba(47,70,49,0.14)";
          item.card.style.transform = "translateY(-1px)";
          item.card.style.background = "linear-gradient(180deg, #ffffff 0%, #f4f8f4 100%)";
        }
        applied = true;
      }
    });
    findHeylightCards(root).forEach((item) => {
      if (item.normalizedName === normalizedSelected) {
        item.card.classList.add("codex-recommended-card");
        if (item.card instanceof HTMLElement) {
          item.card.style.borderColor = "#2f4631";
          item.card.style.boxShadow = "0 4px 12px rgba(47,70,49,0.14)";
          item.card.style.transform = "translateY(-1px)";
          item.card.style.background = "linear-gradient(180deg, #324d35 0%, #243726 100%)";
        }
        applied = true;
      }
    });
    return applied;
  }

  function renderRecommendationToolbar(root, models) {
    const previewButton = Array.from(document.querySelectorAll("button"))
      .find((button) => normalizeLabel(button.textContent).includes("scarica pdf"));
    const toolbarHost = previewButton?.parentElement;
    if (!(toolbarHost instanceof HTMLElement)) return;

    let toolbar = toolbarHost.querySelector(".codex-quote-recommendation-toolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "codex-quote-recommendation-toolbar";
      toolbar.innerHTML = `
        <label for="codex-quote-recommendation-select">Modello consigliato</label>
        <select id="codex-quote-recommendation-select"></select>
      `;
      toolbarHost.insertBefore(toolbar, previewButton);
      previewButton.style.marginLeft = "10px";
    }

    const select = toolbar.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) return;
    const names = models.map((item) => item.name);
    const signature = names.join("|");
    if (select.dataset.optionsSignature !== signature) {
      select.innerHTML = "";
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Nessun consigliato";
      select.appendChild(blank);
      names.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
      select.dataset.optionsSignature = signature;
    }

    const currentValue = readRecommendedModel(root, names);
    select.value = names.includes(currentValue) ? currentValue : "";
    if (!select.dataset.bound) {
      select.addEventListener("change", () => {
        writeRecommendedModel(root, names, select.value);
        applyRecommendedModelClasses(root, select.value);
        reportEmbeddedContentHeight();
      });
      select.dataset.bound = "1";
    }
  }

  function syncRecommendedQuoteLayout() {
    ensureRecommendationStyles();
    const pdfRoot = getLivePdfRoot(document);
    const toolbar = document.querySelector(".codex-quote-recommendation-toolbar");

    syncCustomTurfEditModeUI();

    if (!(pdfRoot instanceof HTMLElement) || !isPreviewModeVisible()) {
      toolbar?.remove();
      document.querySelector(".codex-custom-turf-panel")?.remove();
      return false;
    }

    syncCustomTurfModelUI(pdfRoot);
    injectCustomTurfModelRow(pdfRoot);

    const models = collectQuoteModels(pdfRoot);
    if (!models.length) {
      toolbar?.remove();
      clearRecommendationClasses(pdfRoot);
      return false;
    }

    renderRecommendationToolbar(pdfRoot, models);
    const selectedName = readRecommendedModel(pdfRoot, models.map((item) => item.name));
    return applyRecommendedModelClasses(pdfRoot, selectedName);
  }

  function findModelDropdownContainer() {
    const allNodes = Array.from(document.querySelectorAll("li, div, label, span"))
      .filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (el.querySelector(".codex-custom-turf-edit-option")) return false;
        const text = el.textContent || "";
        return /\d+\s*mm\b/i.test(text) && /€\/mq/i.test(text) && el.children.length <= 5;
      });
    if (allNodes.length < 3) return null;
    const parent = allNodes[0].parentElement;
    if (!parent) return null;
    const inSameParent = allNodes.filter((el) => el.parentElement === parent);
    return inSameParent.length >= 3 ? parent : null;
  }

  function syncCustomTurfEditModeUI() {
    const container = findModelDropdownContainer();

    const stale = document.querySelector(".codex-custom-turf-edit-option");
    if (!container) {
      stale?.remove();
      return;
    }
    if (stale && stale.parentElement !== container) stale.remove();
    if (container.querySelector(".codex-custom-turf-edit-option")) return;

    const row = document.createElement("div");
    row.className = "codex-custom-turf-edit-option";
    row.style.cssText = "display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid rgba(255,255,255,0.1);";

    const label = document.createElement("span");
    label.textContent = "Altro:";
    label.style.cssText = "font-size:13px;white-space:nowrap;opacity:0.7;min-width:38px;";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Modello personalizzato…";
    nameInput.className = "codex-custom-turf-name";
    nameInput.style.cssText = "flex:1;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:6px;padding:5px 8px;font-size:13px;color:inherit;outline:none;min-width:0;";

    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.min = "0";
    priceInput.step = "0.01";
    priceInput.placeholder = "€/mq";
    priceInput.className = "codex-custom-turf-price";
    priceInput.style.cssText = "width:76px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:6px;padding:5px 8px;font-size:13px;color:inherit;text-align:center;outline:none;";

    const current = readCustomTurfModel();
    if (current?.name) nameInput.value = current.name;
    if (current?.price) priceInput.value = formatPriceInputValue(current.price);

    const commit = () => {
      writeCustomTurfModel(nameInput.value.trim(), priceInput.value);
      requestBridgeSyncBurst(2);
    };
    nameInput.addEventListener("change", commit);
    nameInput.addEventListener("blur", commit);
    priceInput.addEventListener("change", commit);
    priceInput.addEventListener("blur", commit);

    row.appendChild(label);
    row.appendChild(nameInput);
    row.appendChild(priceInput);
    container.appendChild(row);
  }

  function readCustomTurfModel() {
    try {
      const raw = localStorage.getItem("codex_custom_turf_v1");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.name === "string" ? parsed : null;
    } catch { return null; }
  }

  function writeCustomTurfModel(name, price) {
    try {
      if (!name) {
        localStorage.removeItem("codex_custom_turf_v1");
      } else {
        localStorage.setItem("codex_custom_turf_v1", JSON.stringify({ name: String(name), price: Number(price) || 0 }));
      }
    } catch {}
  }

  function syncCustomTurfModelUI(pdfRoot) {
    const previewButton = Array.from(document.querySelectorAll("button"))
      .find((button) => normalizeLabel(button.textContent).includes("scarica pdf"));
    const toolbarHost = previewButton?.parentElement;
    if (!(toolbarHost instanceof HTMLElement)) return;

    let panel = toolbarHost.querySelector(".codex-custom-turf-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "codex-custom-turf-panel";
      panel.style.cssText = "display:flex;align-items:flex-end;gap:8px;margin-right:6px;";

      const nameWrap = document.createElement("label");
      nameWrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";
      const nameLabel = document.createElement("span");
      nameLabel.textContent = "Modello libero";
      nameLabel.style.cssText = "font-size:10px;color:#9ca3af;font-weight:600;white-space:nowrap;";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Es. Sportgreen Plus 45mm";
      nameInput.className = "codex-custom-turf-name";
      nameInput.style.cssText = "width:180px;border:1px solid #d1d5db;border-radius:8px;padding:6px 8px;font-size:13px;outline:none;background:#fff;color:#1f2937;";
      nameWrap.appendChild(nameLabel);
      nameWrap.appendChild(nameInput);

      const priceWrap = document.createElement("label");
      priceWrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";
      const priceLabel = document.createElement("span");
      priceLabel.textContent = "Prezzo €/mq";
      priceLabel.style.cssText = "font-size:10px;color:#9ca3af;font-weight:600;white-space:nowrap;";
      const priceInput = document.createElement("input");
      priceInput.type = "number";
      priceInput.min = "0";
      priceInput.step = "0.01";
      priceInput.placeholder = "0";
      priceInput.className = "codex-custom-turf-price";
      priceInput.style.cssText = "width:84px;border:1px solid #d1d5db;border-radius:8px;padding:6px 8px;font-size:13px;outline:none;background:#fff;color:#1f2937;text-align:center;";
      priceWrap.appendChild(priceLabel);
      priceWrap.appendChild(priceInput);

      panel.appendChild(nameWrap);
      panel.appendChild(priceWrap);

      const commit = () => {
        writeCustomTurfModel(nameInput.value.trim(), priceInput.value);
        injectCustomTurfModelRow(pdfRoot);
        requestBridgeSyncBurst(2);
      };
      nameInput.addEventListener("change", commit);
      nameInput.addEventListener("blur", commit);
      priceInput.addEventListener("change", commit);
      priceInput.addEventListener("blur", commit);

      const recToolbar = toolbarHost.querySelector(".codex-quote-recommendation-toolbar");
      toolbarHost.insertBefore(panel, recToolbar || previewButton);
    }

    const nameInput = panel.querySelector(".codex-custom-turf-name");
    const priceInput = panel.querySelector(".codex-custom-turf-price");
    const current = readCustomTurfModel();
    if (nameInput instanceof HTMLInputElement && document.activeElement !== nameInput) {
      nameInput.value = current?.name || "";
    }
    if (priceInput instanceof HTMLInputElement && document.activeElement !== priceInput) {
      priceInput.value = current?.price ? formatPriceInputValue(current.price) : "";
    }
  }

  function injectCustomTurfModelRow(root) {
    const pricingTable = findPricingTable(root);
    if (!(pricingTable instanceof HTMLTableElement)) return;
    const tbody = pricingTable.querySelector("tbody");
    if (!(tbody instanceof HTMLElement)) return;

    const existing = tbody.querySelector("tr[data-codex-custom='1']");
    const customModel = readCustomTurfModel();

    if (!customModel?.name) {
      existing?.remove();
      return;
    }

    if (existing) {
      const nameDiv = existing.querySelector("div");
      if (nameDiv) nameDiv.textContent = customModel.name;
      const cells = Array.from(existing.children);
      const lastCell = cells[cells.length - 1];
      if (lastCell instanceof HTMLElement && customModel.price > 0) {
        lastCell.textContent = `€ ${customModel.price.toFixed(2)}`;
      }
      return;
    }

    const colCount = Math.max(pricingTable.querySelectorAll("thead tr th").length || 0, 4);
    const firstRow = tbody.querySelector("tr:not([data-codex-custom])");

    const tr = document.createElement("tr");
    tr.setAttribute("data-codex-custom", "1");

    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      const refCell = firstRow?.children?.[i];
      if (refCell instanceof HTMLElement) {
        td.style.padding = refCell.style.padding || "5px 6px";
        td.style.fontSize = refCell.style.fontSize || "inherit";
      } else {
        td.style.padding = "5px 6px";
      }

      if (i === 0) {
        const nameDiv = document.createElement("div");
        nameDiv.textContent = customModel.name;
        nameDiv.style.fontWeight = "600";
        const descDiv = document.createElement("div");
        descDiv.textContent = "Modello personalizzato";
        descDiv.style.cssText = "font-size:11px;color:#6b7280;margin-top:2px;";
        td.appendChild(nameDiv);
        td.appendChild(descDiv);
      } else if (i === colCount - 1 && customModel.price > 0) {
        td.textContent = `€ ${customModel.price.toFixed(2)}`;
        td.style.textAlign = "center";
      } else {
        td.textContent = "—";
        td.style.cssText += ";text-align:center;color:#9ca3af;";
      }
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  function appendDiscountLabelToProductDescriptions(root) {
    const pricingTable = findPricingTable(root);
    if (!pricingTable) return;
    Array.from(pricingTable.querySelectorAll("tbody tr")).forEach((row) => {
      const cells = Array.from(row.children || []);
      if (cells.length < 3) return;
      const firstCell = cells[0];
      const descriptionNode = firstCell.querySelector("div:last-child");
      const rawDiscount = String(cells[2]?.textContent || "").trim();
      if (firstCell instanceof HTMLElement) {
        firstCell.style.padding = "8px 6px 11px";
        firstCell.style.verticalAlign = "top";
      }
      if (!(descriptionNode instanceof HTMLElement)) return;
      descriptionNode.style.marginTop = "3px";
      descriptionNode.style.lineHeight = "1.42";
      descriptionNode.style.paddingBottom = "2px";
      const hasDiscount = /\d/.test(rawDiscount);
      if (!hasDiscount) return;
      if (normalizeLabel(descriptionNode.textContent).includes("sconto")) return;
      descriptionNode.textContent = `${String(descriptionNode.textContent || "").trim()} · sconto ${rawDiscount}`;
    });
  }

  function centerFeatureCards(root) {
    const labelNode = findElementByTextWithin(root, "div, span, p", "4,8 su Google");
    const card = labelNode?.parentElement;
    const grid = card?.parentElement;
    if (!(grid instanceof HTMLElement) || !(card instanceof HTMLElement)) return;
    Array.from(grid.children).forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      item.style.minHeight = "86px";
      item.style.padding = "12px 10px";
      item.style.display = "flex";
      item.style.flexDirection = "column";
      item.style.alignItems = "center";
      item.style.justifyContent = "center";
      item.style.gap = "6px";
      const parts = Array.from(item.children);
      if (parts[0] instanceof HTMLElement) {
        parts[0].style.fontSize = "16px";
        parts[0].style.lineHeight = "1";
        parts[0].style.display = "flex";
        parts[0].style.alignItems = "center";
        parts[0].style.justifyContent = "center";
        parts[0].style.minHeight = "18px";
      }
      if (parts[1] instanceof HTMLElement) {
        parts[1].style.fontSize = "10px";
        parts[1].style.lineHeight = "1.26";
      }
      if (parts[2] instanceof HTMLElement) {
        parts[2].style.fontSize = "8.6px";
        parts[2].style.lineHeight = "1.28";
      }
    });
  }

  function ensureHeylightLiveStyle() {
    const id = "codex-heylight-color-fix";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    // Minimal white: card bianca, bordo verde a sinistra come accent, testo scuro
    style.textContent = `
      [data-chl="1"] > * {
        background: #ffffff !important;
        border: 1.5px solid #d8e4da !important;
        border-left: 3px solid #1c4229 !important;
        box-shadow: 0 1px 4px rgba(28,66,41,0.06) !important;
        color: #1e2820 !important;
      }
      [data-chl="1"] > * > *:first-child {
        color: #1c4229 !important;
      }
      [data-chl="1"] > * > *:not(:first-child) {
        color: #1e2820 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePerMqCardsLiveStyle() {
    const id = "codex-permq-cards-fix";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    // Minimal white per price cards "al mq finale": bianco uniforme con accent solo
    // sotto il nome modello (sottile underline 28px) — niente barra continua in cima
    style.textContent = `
      [data-cpermq="1"] {
        background: #ffffff !important;
        border: 1.5px solid #d8e4da !important;
        border-radius: 10px !important;
        box-shadow: 0 2px 8px rgba(28,66,41,0.07) !important;
        overflow: hidden !important;
      }
      [data-cpermq-name="1"] {
        color: #1c4229 !important;
        position: relative !important;
        padding-bottom: 7px !important;
        margin-bottom: 6px !important;
      }
      [data-cpermq-name="1"]::after {
        content: "" !important;
        position: absolute !important;
        bottom: 0 !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 28px !important;
        height: 2px !important;
        background: #3db554 !important;
        border-radius: 2px !important;
      }
      [data-cpermq-price="1"] {
        color: #1c4229 !important;
      }
      [data-cpermq-muted="1"] {
        color: #4a5c4e !important;
      }
    `;
    document.head.appendChild(style);
  }

  function polishGeneratorToolbar() {
    // L'header che contiene "← Modifica / Modello consigliato / Scarica PDF" è
    // il parent del bottone "Scarica PDF" renderizzato dal React. Per default ha
    // uno sfondo verde piatto poco elegante: lo trasformiamo in un ribbon con
    // gradient verticale più profondo e sottile bordo inferiore lucido.
    const previewButton = Array.from(document.querySelectorAll("button"))
      .find((btn) => normalizeLabel(btn.textContent).includes("scarica pdf"));
    const host = previewButton?.parentElement;
    if (!(host instanceof HTMLElement)) return;
    if (host.dataset.cpsiPolishedToolbar === "1") return;
    host.dataset.cpsiPolishedToolbar = "1";
    host.style.setProperty(
      "background",
      "linear-gradient(180deg, #1c4229 0%, #122e1c 100%)",
      "important",
    );
    host.style.setProperty(
      "box-shadow",
      "inset 0 -1px 0 rgba(255,255,255,0.10), 0 2px 10px rgba(28,66,41,0.20)",
      "important",
    );
    host.style.setProperty("border-bottom", "1px solid rgba(0,0,0,0.18)", "important");
  }

  function ensureLivePreviewNormStyle() {
    const id = "codex-live-preview-norm";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      [data-cpanel="1"] {
        padding: 7px 10px !important;
        border-radius: 8px !important;
      }
      [data-cofferwrap="1"] {
        margin-top: 8px !important;
        margin-bottom: 8px !important;
        text-align: center !important;
      }
      [data-coffer="1"] {
        padding: 5px 14px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      [data-chlhead="1"] {
        margin-top: 6px !important;
        margin-bottom: 10px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function applyLivePreviewNorm(root) {
    if (!(root instanceof Element)) return;
    ensureLivePreviewNormStyle();

    const clientLabel = findElementByTextWithin(root, "div, span, p", "Cliente")
      || findElementByTextWithin(root, "div, span, p", "Rivenditore");
    const validityLabel = findElementByTextWithin(root, "div, span, p", "Validità");
    const clientPanel = clientLabel instanceof HTMLElement ? findPanelAncestor(clientLabel, root, 5) : null;
    const validityPanel = validityLabel instanceof HTMLElement ? findPanelAncestor(validityLabel, root, 5) : null;
    if (clientPanel instanceof HTMLElement) clientPanel.dataset.cpanel = "1";
    if (validityPanel instanceof HTMLElement) validityPanel.dataset.cpanel = "1";

    const offerHeading = findElementByTextWithin(root, "div, span, p", "OFFERTA PER");
    if (offerHeading instanceof HTMLElement) {
      offerHeading.dataset.coffer = "1";
      if (offerHeading.parentElement instanceof HTMLElement) {
        offerHeading.parentElement.dataset.cofferwrap = "1";
      }
    }

    const hlHeading = findElementByTextWithin(root, "div, span, p", "Simulazione 5 rate HeyLight");
    if (hlHeading instanceof HTMLElement) hlHeading.dataset.chlhead = "1";
  }

  function fixHeylightReadability(root) {
    const heading = findElementByTextWithin(root, "div, span, p", "Simulazione 5 rate HeyLight");
    if (!(heading instanceof HTMLElement)) return;
    const section = heading.parentElement;
    if (!(section instanceof HTMLElement)) return;
    const grid = Array.from(section.children).find((child) => (
      child instanceof HTMLElement
      && child !== heading
      && (child.style.display === "grid" || window.getComputedStyle(child).display === "grid")
    ));
    if (!(grid instanceof HTMLElement)) return;
    // Mark the grid so the persistent <style> can target it
    grid.dataset.chl = "1";
    ensureHeylightLiveStyle();
    // Apply minimal white inline styles with !important for PDF export context
    Array.from(grid.children).forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.style.setProperty("background", "#ffffff", "important");
      card.style.setProperty("border", "1.5px solid #d8e4da", "important");
      card.style.setProperty("border-left", "3px solid #1c4229", "important");
      card.style.setProperty("box-shadow", "0 1px 4px rgba(28,66,41,0.06)", "important");
      card.style.setProperty("color", "#1e2820", "important");
      const kids = Array.from(card.children);
      kids.forEach((el, idx) => {
        if (!(el instanceof HTMLElement)) return;
        // primo figlio = nome modello (verde scuro), gli altri = scuro neutro
        const color = idx === 0 ? "#1c4229" : "#1e2820";
        el.style.setProperty("color", color, "important");
        Array.from(el.querySelectorAll("*")).forEach((nested) => {
          if (nested instanceof HTMLElement) nested.style.setProperty("color", color, "important");
        });
      });
    });
  }

  function fixPerMqCardsReadability(root) {
    if (!(root instanceof Element)) return;
    ensurePerMqCardsLiveStyle();
    // Reuse findPerMqCards which already locates the "al mq finale" cards
    findPerMqCards(root).forEach((item) => {
      const card = item.card;
      if (!(card instanceof HTMLElement)) return;
      // Override del background (in alcune varianti React lo applica verde scuro)
      card.dataset.cpermq = "1";
      card.style.setProperty("background", "#ffffff", "important");
      card.style.setProperty("border", "1.5px solid #d8e4da", "important");
      card.style.setProperty("border-radius", "10px", "important");
      card.style.setProperty("box-shadow", "0 2px 8px rgba(28,66,41,0.07)", "important");
      card.style.setProperty("overflow", "hidden", "important");
      // I figli: cerco nome modello, subline, prezzo, "al mq finale", e il top-strip
      const children = Array.from(card.children).filter((c) => c instanceof HTMLElement);
      children.forEach((el) => {
        // Top-strip React (position:absolute, height:3, sopra ogni card): lo nascondo
        // per evitare l'effetto "linea continua" sopra le 3 card affiancate
        const cs = window.getComputedStyle(el);
        const elH = parseFloat(cs.height || "0");
        if (cs.position === "absolute" && elH > 0 && elH <= 6) {
          el.style.setProperty("display", "none", "important");
          return;
        }
        const text = (el.textContent || "").trim();
        if (!text) return;
        if (/mm/i.test(text) && text.length < 30) {
          // nome modello (es. "FAGGIO 25 MM")
          el.dataset.cpermqName = "1";
          el.style.setProperty("color", "#1c4229", "important");
        } else if (/€/.test(text) && text.length < 20) {
          // prezzo
          el.dataset.cpermqPrice = "1";
          el.style.setProperty("color", "#1c4229", "important");
        } else {
          // subline o "al mq finale"
          el.dataset.cpermqMuted = "1";
          el.style.setProperty("color", "#4a5c4e", "important");
        }
      });
    });
  }

  function polishOfferHeading(root) {
    // "OFFERTA PER X MQ" — il React lo renderizza scuro su sfondo trasparente con
    // bordo superiore/inferiore. Lo trasformo in pill verde scuro con testo bianco.
    if (!(root instanceof Element)) return;
    const heading = findElementByTextWithin(root, "div, span, p", "OFFERTA PER");
    if (!(heading instanceof HTMLElement)) return;
    const label = normalizeLabel(heading.textContent || "");
    let textSpan = heading.querySelector(":scope > .codex-offer-heading-text");
    if (!(textSpan instanceof HTMLElement) && label.includes("offerta per")) {
      heading.textContent = "";
      textSpan = document.createElement("span");
      textSpan.className = "codex-offer-heading-text";
      textSpan.textContent = label.toUpperCase();
      heading.appendChild(textSpan);
    }
    heading.dataset.cpsiOffer = "1";
    heading.style.setProperty(
      "background",
      "linear-gradient(180deg, #1c4229 0%, #163823 100%)",
      "important",
    );
    heading.style.setProperty("color", "#ffffff", "important");
    heading.style.setProperty("border-top", "none", "important");
    heading.style.setProperty("border-bottom", "none", "important");
    heading.style.setProperty("border-radius", "8px", "important");
    heading.style.setProperty("padding", "9px 22px 11px", "important");
    heading.style.setProperty("letter-spacing", "1.8px", "important");
    heading.style.setProperty("box-shadow", "0 2px 6px rgba(28,66,41,0.18)", "important");
    heading.style.setProperty("opacity", "1", "important");
    heading.style.setProperty("visibility", "visible", "important");
    // Tutti i child eredita il bianco
    Array.from(heading.querySelectorAll("*")).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.setProperty("color", "#ffffff", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("visibility", "visible", "important");
    });
  }

  function ensureAccessoriesLiveStyle() {
    const id = "codex-accessories-table-fix";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    // CSS persistente: vince anche se React re-renderizza l'inline style senza
    // important (un selettore [data-attr] con !important supera lo style inline
    // non-important del bundle). Doppio sicurezza inline + CSS rule.
    style.textContent = `
      [data-cpsi-acc-section="1"] {
        background: #ffffff !important;
        background-image: none !important;
        border: 1.5px solid #d8e4da !important;
        border-radius: 10px !important;
        box-shadow: 0 2px 8px rgba(28,66,41,0.07) !important;
        overflow: hidden !important;
      }
      [data-cpsi-acc-heading="1"] {
        background: #eef7f0 !important;
        background-image: none !important;
        color: #1c4229 !important;
        border-bottom: 1px solid #d8e4da !important;
      }
      [data-cpsi-acc-subtitle="1"] {
        background: #ffffff !important;
        background-image: none !important;
        color: #4a5c4e !important;
        border-bottom: 1px solid #ebefe9 !important;
      }
      [data-cpsi-acc-section="1"] thead th,
      [data-cpsi-acc-section="1"] thead td {
        background: #f6faf6 !important;
        background-image: none !important;
        color: #1c4229 !important;
        border-bottom: 1px solid #d8e4da !important;
      }
      [data-cpsi-acc-section="1"] tbody td {
        background: #ffffff !important;
        background-image: none !important;
        color: #1e2820 !important;
        border-bottom: 1px solid #ebefe9 !important;
      }
      [data-cpsi-acc-section="1"] tfoot td {
        background: #eef7f0 !important;
        background-image: none !important;
        color: #1c4229 !important;
        border-top: 1.5px solid #d8e4da !important;
        font-weight: 800 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function polishAccessoriesTable(root) {
    // La tabella "ACCESSORI E PRODOTTI EXTRA" va integrata nello stesso linguaggio
    // visivo del resto del documento (box materiali, badges, price cards):
    // container bianco con bordo grigio chiaro + bordo radius, banner header chiaro
    // off-white con testo verde scuro, righe bianche, totale highlight verde chiaro.
    if (!(root instanceof Element)) return;
    ensureAccessoriesLiveStyle();
    const heading = findElementByTextWithin(root, "div, span, p", "Accessori e Prodotti Extra")
      || findElementByTextWithin(root, "div, span, p", "ACCESSORI E PRODOTTI EXTRA");
    if (!(heading instanceof HTMLElement)) return;
    const section = heading.closest("[class*='pdf-no-break']")
      || heading.parentElement?.parentElement
      || heading.parentElement;
    if (!(section instanceof HTMLElement)) return;
    section.dataset.cpsiAcc = "1";
    section.dataset.cpsiAccSection = "1";
    heading.dataset.cpsiAccHeading = "1";

    // Container: stile coerente con altri box (bianco, bordo grigio, radius, shadow)
    section.style.setProperty("background", "#ffffff", "important");
    section.style.setProperty("border", "1.5px solid #d8e4da", "important");
    section.style.setProperty("border-radius", "10px", "important");
    section.style.setProperty("box-shadow", "0 2px 8px rgba(28,66,41,0.07)", "important");
    section.style.setProperty("overflow", "hidden", "important");

    // Banner heading "Accessori e Prodotti Extra" — off-white con testo verde brand
    heading.style.setProperty(
      "background",
      "linear-gradient(90deg, #f6faf6 0%, #eef7f0 100%)",
      "important",
    );
    heading.style.setProperty("background-image", "none", "important");
    heading.style.setProperty("background-color", "#eef7f0", "important");
    heading.style.setProperty("color", "#1c4229", "important");
    heading.style.setProperty("border-bottom", "1px solid #d8e4da", "important");

    // Subtitle "Queste voci sono già incluse..." — bianco con testo grigio neutro
    // È il sibling immediato successivo del banner heading
    const subtitle = heading.nextElementSibling;
    if (subtitle instanceof HTMLElement && /queste voci/i.test(subtitle.textContent || "")) {
      subtitle.dataset.cpsiAccSubtitle = "1";
      subtitle.style.setProperty("background-color", "#ffffff", "important");
      subtitle.style.setProperty("background-image", "none", "important");
      subtitle.style.setProperty("color", "#4a5c4e", "important");
      subtitle.style.setProperty("border-bottom", "1px solid #ebefe9", "important");
    }

    // Tabella interna
    const table = section.querySelector("table");
    if (table instanceof HTMLElement) {
      table.style.setProperty("background", "#ffffff", "important");
      // THEAD: header celle con sfondo off-white verde + testo verde brand
      table.querySelectorAll("thead th, thead td").forEach((th) => {
        if (!(th instanceof HTMLElement)) return;
        th.style.setProperty("background-color", "#f6faf6", "important");
        th.style.setProperty("background-image", "none", "important");
        th.style.setProperty("color", "#1c4229", "important");
        th.style.setProperty("border-bottom", "1px solid #d8e4da", "important");
      });
      // TBODY: righe prodotto bianche, testo scuro neutro
      table.querySelectorAll("tbody td").forEach((td) => {
        if (!(td instanceof HTMLElement)) return;
        td.style.setProperty("background-color", "#ffffff", "important");
        td.style.setProperty("background-image", "none", "important");
        td.style.setProperty("color", "#1e2820", "important");
        td.style.setProperty("border-bottom", "1px solid #ebefe9", "important");
      });
      // TFOOT: riga "TOTALE ACCESSORI" — highlight verde chiaro (palette brand)
      table.querySelectorAll("tfoot td").forEach((td) => {
        if (!(td instanceof HTMLElement)) return;
        td.style.setProperty("background-color", "#eef7f0", "important");
        td.style.setProperty("background-image", "none", "important");
        td.style.setProperty("color", "#1c4229", "important");
        td.style.setProperty("border-top", "1.5px solid #d8e4da", "important");
        td.style.setProperty("font-weight", "800", "important");
      });
    }
  }

  function readMaterialsDiscountPercent() {
    // Cerca nel form di editor il campo "Sconto materiali %" e ne legge il valore.
    // L'input rimane nel DOM anche in modalità preview (è solo nascosto via display).
    const labels = Array.from(document.querySelectorAll("label"));
    const lbl = labels.find((l) => {
      const t = normalizeLabel(l.textContent || "");
      return t.includes("sconto materiali") && t.includes("%");
    });
    if (!(lbl instanceof HTMLElement)) return 0;
    // L'input è solitamente sibling del label, entrambi figli di un wrapper div
    const wrapper = lbl.parentElement;
    if (!(wrapper instanceof HTMLElement)) return 0;
    const input = wrapper.querySelector('input[type="number"]');
    if (!(input instanceof HTMLInputElement)) return 0;
    const value = parseFloat((input.value || "0").replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function injectMaterialsDiscount(root) {
    // Inietta nel preview una riga "Sconto materiali applicato: −X%" dentro il box
    // dei materiali, sopra "Dettagli materiali:". Idempotente.
    if (!(root instanceof Element)) return;
    const discount = readMaterialsDiscountPercent();
    // Cerco il marker "Dettagli materiali" (è in <strong> all'inizio della riga note)
    const marker = findElementByTextWithin(root, "strong, p, div, span", "Dettagli materiali");
    if (!(marker instanceof HTMLElement)) return;
    // Risalgo al box contenitore (un livello sopra il paragrafo del marker)
    const detailLine = marker.closest("p, div") || marker.parentElement;
    if (!(detailLine instanceof HTMLElement) || !(detailLine.parentElement instanceof HTMLElement)) return;
    const parent = detailLine.parentElement;
    // Rimuovi eventuale riga precedente (così aggiorna il valore se cambia)
    const existing = parent.querySelector("[data-cpsi-mat-discount='1']");
    if (existing) existing.remove();
    if (discount <= 0) return;
    const row = document.createElement("div");
    row.dataset.cpsiMatDiscount = "1";
    row.style.cssText = [
      "display: flex",
      "align-items: center",
      "justify-content: space-between",
      "gap: 12px",
      "margin: 6px 0 4px",
      "padding: 6px 12px",
      "background: linear-gradient(90deg, #fef5e8 0%, #fff8eb 100%)",
      "border-top: 1px solid #f3d99c",
      "border-bottom: 1px solid #f3d99c",
      "border-radius: 4px",
      "font-size: 10px",
    ].join("; ");
    const discTxt = String(discount).replace(".", ",");
    row.innerHTML = `
      <span style="color: #4a5c4e; font-weight: 600; letter-spacing: .2px;">Sconto materiali applicato</span>
      <span style="color: #c0392b; font-weight: 800; font-size: 11.5px; background: #fef2f1; border: 1px solid #f5c0bb; padding: 1px 8px; border-radius: 10px;">−${discTxt}%</span>
    `;
    parent.insertBefore(row, detailLine);
  }

  function centerHeylightCards(root) {
    const heading = findElementByTextWithin(root, "div, span, p", "Simulazione 5 rate HeyLight");
    if (!(heading instanceof HTMLElement)) return;
    heading.style.marginTop = "8px";
    heading.style.marginBottom = "14px";
    heading.style.lineHeight = "1.2";
    const section = heading.parentElement;
    const grid = Array.from(section?.children || []).find((child) => (
      child instanceof HTMLElement
      && child !== heading
      && (child.style.display === "grid" || window.getComputedStyle(child).display === "grid")
    ));
    if (!(grid instanceof HTMLElement)) return;
    Array.from(grid.children).forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      item.style.minHeight = "84px";
      item.style.padding = "13px 12px";
      item.style.display = "flex";
      item.style.flexDirection = "column";
      item.style.alignItems = "center";
      item.style.justifyContent = "center";
      item.style.textAlign = "center";
      item.style.gap = "6px";
      const parts = Array.from(item.children);
      if (parts[0] instanceof HTMLElement) {
        parts[0].style.fontSize = "10px";
        parts[0].style.lineHeight = "1.24";
      }
      if (parts[1] instanceof HTMLElement) {
        parts[1].style.fontSize = "11.2px";
        parts[1].style.lineHeight = "1.34";
        parts[1].style.display = "flex";
        parts[1].style.alignItems = "center";
        parts[1].style.justifyContent = "center";
        parts[1].style.minHeight = "28px";
      }
    });
  }

  function replacePaymentBadgesWithLogos(root) {
    const logoHost = Array.from(root.querySelectorAll("div")).find((element) => {
      const text = normalizeLabel(element.textContent || "");
      return text.includes("visa")
        && text.includes("paypal")
        && text.includes("scalapay")
        && text.includes("heylight");
    });
    if (!(logoHost instanceof HTMLElement) || logoHost.dataset.codexPaymentLogos === "1") return;
    logoHost.dataset.codexPaymentLogos = "1";
    logoHost.innerHTML = "";
    logoHost.style.display = "flex";
    logoHost.style.alignItems = "center";
    logoHost.style.justifyContent = "flex-end";
    logoHost.style.flexWrap = "wrap";
    logoHost.style.gap = "6px";
    logoHost.style.opacity = "1";
    getPaymentLogoDefinitions().forEach((definition) => {
      const image = document.createElement("img");
      image.src = definition.src;
      image.alt = definition.alt;
      image.width = definition.width;
      image.height = 18;
      image.decoding = "sync";
      image.loading = "eager";
      image.style.display = "block";
      image.style.height = "18px";
      image.style.width = "auto";
      image.style.objectFit = "contain";
      logoHost.appendChild(image);
    });
  }

  function polishQuoteHeaderPanels(root) {
    const clientLabel = findElementByTextWithin(root, "div, span, p", "Cliente")
      || findElementByTextWithin(root, "div, span, p", "Rivenditore");
    const validityLabel = findElementByTextWithin(root, "div, span, p", "Validità");
    const clientPanel = clientLabel?.parentElement;
    const validityPanel = validityLabel?.parentElement;
    const panelGrid = clientPanel?.parentElement;

    if (panelGrid instanceof HTMLElement) {
      panelGrid.style.alignItems = "stretch";
      panelGrid.style.gap = "10px";
      panelGrid.style.marginBottom = "12px";
    }

    if (clientPanel instanceof HTMLElement) {
      clientPanel.style.minHeight = "96px";
      clientPanel.style.padding = "12px 16px 12px 18px";
      clientPanel.style.display = "flex";
      clientPanel.style.flexDirection = "column";
      clientPanel.style.justifyContent = "center";
      clientPanel.style.boxSizing = "border-box";

      if (clientLabel instanceof HTMLElement) {
        clientLabel.style.marginBottom = "8px";
        clientLabel.style.paddingLeft = "4px";
        clientLabel.style.lineHeight = "1";
      }

      const content = Array.from(clientPanel.children).find((child) => child !== clientLabel);
      if (content instanceof HTMLElement) {
        content.style.display = "grid";
        content.style.gridTemplateColumns = "1fr 1fr";
        content.style.gap = "4px 18px";
        content.style.alignContent = "center";
        content.style.fontSize = "10.2px";
        content.style.lineHeight = "1.48";
        Array.from(content.children).forEach((item) => {
          if (!(item instanceof HTMLElement)) return;
          item.style.lineHeight = "1.48";
        });
      }
    }

    if (validityPanel instanceof HTMLElement) {
      validityPanel.style.minHeight = "96px";
      validityPanel.style.padding = "12px 18px";
      validityPanel.style.display = "flex";
      validityPanel.style.flexDirection = "column";
      validityPanel.style.justifyContent = "center";
      validityPanel.style.alignItems = "center";
      validityPanel.style.textAlign = "center";
      validityPanel.style.boxSizing = "border-box";

      if (validityLabel instanceof HTMLElement) {
        validityLabel.style.marginBottom = "8px";
        validityLabel.style.lineHeight = "1";
      }

      Array.from(validityPanel.children).forEach((item) => {
        if (!(item instanceof HTMLElement) || item === validityLabel) return;
        item.style.lineHeight = "1.42";
        item.style.margin = "0";
      });
    }
  }

  function polishQuotePreviewLayout(root = document) {
    if (!ENABLE_PREVIEW_POLISH) return false;
    const pdfRoot = getLivePdfRoot(root);
    if (!(pdfRoot instanceof HTMLElement)) return false;
    const offerHeading = findElementByTextWithin(pdfRoot, "div, span, p", "OFFERTA PER");
    if (offerHeading instanceof HTMLElement) {
      offerHeading.style.display = "inline-flex";
      offerHeading.style.alignItems = "center";
      offerHeading.style.justifyContent = "center";
      offerHeading.style.minHeight = "44px";
      offerHeading.style.padding = "8px 22px 9px";
      offerHeading.style.lineHeight = "1";
      if (offerHeading.parentElement instanceof HTMLElement) {
        offerHeading.parentElement.style.marginBottom = "16px";
        offerHeading.parentElement.style.display = "flex";
        offerHeading.parentElement.style.alignItems = "center";
        offerHeading.parentElement.style.justifyContent = "center";
      }
    }
    polishQuoteHeaderPanels(pdfRoot);
    appendDiscountLabelToProductDescriptions(pdfRoot);
    centerFeatureCards(pdfRoot);
    centerHeylightCards(pdfRoot);
    return true;
  }

  function hideInternalImportPanel() {
    const markerSelectors = "div, span, p, h1, h2, h3, h4, label, button";
    const titleMarker = findElementByText(markerSelectors, "Importa richiesta da Google Sheets");
    const urlMarker = findElementByText(markerSelectors, "URL sorgente lettura");
    const csvMarker = findElementByText(markerSelectors, "Importa CSV");
    const refreshMarker = findElementByText(markerSelectors, "Aggiorna elenco");
    const allMarkers = [titleMarker, urlMarker, csvMarker, refreshMarker].filter(Boolean);
    if (!allMarkers.length) return;

    const candidateSelector = ".rounded-2xl, .shadow-sm, .border, [class*='rounded'], [class*='shadow']";
    const hiddenMarkers = [
      "importa richiesta da google sheets",
      "url sorgente lettura",
      "aggiorna elenco",
      "importa csv",
    ];

    const candidates = [];
    allMarkers.forEach((marker) => {
      let current = marker;
      while (current && current !== document.body) {
        if (current.matches?.(candidateSelector) && current.querySelector?.("button, input, label")) {
          candidates.push(current);
        }
        current = current.parentElement;
      }
    });

    const panel = [...new Set(candidates)]
      .sort((left, right) => left.textContent.length - right.textContent.length)
      .find((candidate) => {
        const text = normalizeLabel(candidate.textContent);
        const hits = hiddenMarkers.filter((marker) => text.includes(marker)).length;
        return text.includes("importa richiesta da google sheets") || hits >= 2;
      });

    if (!panel || panel.dataset.codexEmbeddedHidden === "1") return;
    panel.dataset.codexEmbeddedHidden = "1";
    panel.style.display = "none";
  }

  function readPrefillFromUrl() {
    const rawValue = new URLSearchParams(window.location.search).get("prefill");
    if (!rawValue || rawValue === lastUrlPrefill) return null;

    try {
      const parsed = JSON.parse(rawValue);
      lastUrlPrefill = rawValue;
      return parsed;
    } catch (error) {
      console.warn("Prefill URL non valido:", error);
      return null;
    }
  }

  function readPrefillFromStorage() {
    try {
      const rawValue = window.localStorage.getItem(PREFILL_STORAGE_KEY);
      if (!rawValue || rawValue === lastStoragePrefill) return null;
      const parsed = JSON.parse(rawValue);
      lastStoragePrefill = rawValue;
      return parsed?.payload || parsed;
    } catch (error) {
      console.warn("Prefill storage non valido:", error);
      return null;
    }
  }

  function readBrandingFromStorage() {
    try {
      const rawValue = window.localStorage.getItem(BRANDING_STORAGE_KEY);
      if (!rawValue || rawValue === lastBrandingStorage) return null;
      const parsed = JSON.parse(rawValue);
      lastBrandingStorage = rawValue;
      return normalizeBrandingPayload(parsed?.payload || parsed);
    } catch (error) {
      console.warn("Branding storage non valido:", error);
      return null;
    }
  }

  function readPlannerReportFromStorage() {
    try {
      const rawValue = window.localStorage.getItem(PLANNER_REPORT_STORAGE_KEY);
      if (!rawValue || rawValue === lastPlannerReportStorage) return null;
      const parsed = JSON.parse(rawValue);
      lastPlannerReportStorage = rawValue;
      return normalizePlannerReportPayload(parsed);
    } catch (error) {
      console.warn("Planner report storage non valido:", error);
      return null;
    }
  }

  function getReactRootFiber() {
    const root = document.getElementById("root");
    if (!root) return null;
    const fiberKey = Object.keys(root).find((key) => key.startsWith("__reactContainer$"));
    return fiberKey ? root[fiberKey] : null;
  }

  function walkFiberTree(fiber, visit) {
    if (!fiber) return;
    visit(fiber);
    if (fiber.child) walkFiberTree(fiber.child, visit);
    if (fiber.sibling) walkFiberTree(fiber.sibling, visit);
  }

  function collectHooks(fiber) {
    const hooks = [];
    let hook = fiber?.memoizedState || null;
    while (hook) {
      hooks.push(hook);
      hook = hook.next;
    }
    return hooks;
  }

  function isCustomerState(value) {
    return Boolean(
      value
      && typeof value === "object"
      && "nome" in value
      && "cognome" in value
      && "citta" in value
      && "telefono" in value
      && "email" in value
    );
  }

  function isDateLike(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  // Hook index mapping for the main generator component (React 19, as of build index-CelZjrUy.js):
  //   hooks[0]  = useRef (ref1) — memoizedState = {current: null}
  //   hooks[1]  = useRef (ref2) — memoizedState = {current: null}
  //   hooks[2]  = useState("edit")        — mode: "edit"|"pdf"
  //   hooks[3]  = useState("cliente")     — tipo: "cliente"|"rivenditore"
  //   hooks[4]  = useState(customerObj)   — customer state object
  //   hooks[5]  = useState(false)
  //   hooks[6]  = useState([])            — products array
  //   hooks[7]  = useState(null)
  //   hooks[8]  = useState(false)
  //   hooks[9]  = useState("")
  //   hooks[10] = useState(false)
  //   hooks[11] = useState(sheetsUrl)     — Google Sheets URL (lazy init)
  //   hooks[12] = useState("fornitura")   — service type: "fornitura"|"posa"
  //   hooks[13] = useState(quoteNumber)   — preventivo number
  //   hooks[14] = useState("")            — mq (string)
  //   hooks[15] = useState(dateStr)       — date start (YYYY-MM-DD)
  //   hooks[16] = useState(dateStr)       — date end   (YYYY-MM-DD)
  //   hooks[17] = useState("terra")       — surface: "terra"|"pavimentazione"
  //   hooks[18] = useState(productsConfig)
  //   hooks[19] = useState(25)            — posa price €/mq
  //   hooks[20] = useState(0)             — shipping
  //   hooks[21] = useState(true)          — IVA prato
  //   hooks[22] = useState(0)             — materials discount
  function matchesGeneratorHooks(hooks) {
    // NOTE: the real mode values in this build are "edit" and "preview"  (not "pdf").
    // "pdf" is kept for safety in case future builds change the value back.
    return hooks.length >= 18
      && ["edit", "pdf", "preview"].includes(String(hooks[2]?.memoizedState || ""))
      && ["cliente", "rivenditore"].includes(String(hooks[3]?.memoizedState || ""))
      && isCustomerState(hooks[4]?.memoizedState)
      && Array.isArray(hooks[6]?.memoizedState)
      && ["fornitura", "posa"].includes(String(hooks[12]?.memoizedState || ""))
      && (typeof hooks[14]?.memoizedState === "string" || typeof hooks[14]?.memoizedState === "number")
      && isDateLike(hooks[15]?.memoizedState)
      && isDateLike(hooks[16]?.memoizedState)
      && ["terra", "pavimentazione"].includes(String(hooks[17]?.memoizedState || ""));
  }

  function findGeneratorHooks() {
    const rootFiber = getReactRootFiber();
    if (!rootFiber) return null;

    let match = null;
    walkFiberTree(rootFiber, (fiber) => {
      const isFunctionComponent = fiber && (fiber.tag === 0 || fiber.tag === 15);
      if (!isFunctionComponent || match) return;

      const hooks = collectHooks(fiber);
      if (matchesGeneratorHooks(hooks)) {
        match = hooks;
      }
    });

    return match;
  }

  function dispatchHookAction(hook, action) {
    if (!hook?.queue?.dispatch) return false;
    try {
      hook.queue.dispatch(action);
      return true;
    } catch (error) {
      console.warn("Dispatch hook non riuscito:", error);
      return false;
    }
  }

  function isPreviewModeVisible() {
    const modifyButton = findElementByText("button, a, div, span", "Modifica");
    const downloadButton = findElementByText("button, a, div, span", "Scarica PDF");
    return Boolean(modifyButton && downloadButton);
  }

  function forceGeneratorEditState() {
    const hooks = findGeneratorHooks();
    let applied = false;
    // hooks[2] = mode state: actual values are "edit" and "preview"
    if (hooks?.[2]) {
      applied = dispatchHookAction(hooks[2], "edit") || applied;
    }
    const modifyButton = Array.from(document.querySelectorAll("button"))
      .find((button) => normalizeLabel(button.textContent).includes("modifica"));
    if (modifyButton) {
      applied = clickButton(modifyButton) || applied;
    }
    if (applied) {
      scrollGeneratorViewportToTop();
      reportEmbeddedContentHeight();
    }
    return applied;
  }

  function ensureEditModeActive(attempt = 0) {
    if (scheduledEnsureEditTimer) {
      window.clearTimeout(scheduledEnsureEditTimer);
      scheduledEnsureEditTimer = 0;
    }
    if (isEmbeddedEditModeActive(document)) {
      reportEmbeddedContentHeight();
      return true;
    }
    if (!isPreviewModeVisible()) {
      if (attempt < 8) {
        scheduledEnsureEditTimer = window.setTimeout(() => {
          ensureEditModeActive(attempt + 1);
        }, attempt < 2 ? 80 : 160);
      }
      return false;
    }
    forceGeneratorEditState();
    if (attempt < 10) {
      scheduledEnsureEditTimer = window.setTimeout(() => {
        ensureEditModeActive(attempt + 1);
      }, attempt < 3 ? 90 : 180);
    }
    return false;
  }

  function applyReactStatePrefill(customerPayload, requestedMq, requestedServiceState, requestedSurface) {
    const hooks = findGeneratorHooks();
    if (!hooks) return false;

    // When the component is in "preview" mode (user already clicked "Genera Preventivo"),
    // we must NOT dispatch mq / service / surface / posa-price because that would alter
    // the PDF layout the user is looking at.  We still inject Te (materials description)
    // if it is empty so the "Dettagli materiali:" line appears even when the user
    // generated the PDF before the bridge had a chance to set it in edit mode.
    const currentMode = String(hooks[2]?.memoizedState || "");
    const inPreviewMode = currentMode === "preview";

    let applied = false;

    if (!inPreviewMode) {
      // hooks[4] = customer state object
      if (isCustomerState(hooks[4]?.memoizedState)) {
        applied = dispatchHookAction(hooks[4], (previous) => ({
          ...(isCustomerState(previous) ? previous : {}),
          nome: customerPayload.nome || "",
          cognome: customerPayload.cognome || "",
          citta: customerPayload.citta || "",
          telefono: customerPayload.telefono || "",
          email: customerPayload.email || "",
        })) || applied;
      }

      // hooks[12] = service type: "fornitura"|"posa"
      if (requestedServiceState) {
        applied = dispatchHookAction(hooks[12], requestedServiceState) || applied;
      }

      // hooks[14] = mq string
      if (requestedMq !== "") {
        applied = dispatchHookAction(hooks[14], String(requestedMq)) || applied;
      }

      // hooks[17] = surface: "terra"|"pavimentazione"
      if (requestedSurface) {
        applied = dispatchHookAction(hooks[17], requestedSurface) || applied;
      }

      // hooks[19] = posa price €/mq (default 25).
      // When the service is "posa" and the current value is 0 (or falsy), reset it to the
      // default of 25 so that the "Posa/mq" column is never left at 0,00€.
      if (requestedServiceState === "posa" && hooks[19]) {
        const currentPosaPrice = hooks[19].memoizedState;
        if (!currentPosaPrice || Number(currentPosaPrice) === 0) {
          applied = dispatchHookAction(hooks[19], 25) || applied;
        }
      }
    } else if (requestedMq && String(hooks[14]?.memoizedState ?? "") === "") {
      // Preview mode AND mq was never dispatched in edit mode.  Bootstrap the core
      // state now so Ne (useMemo hooks[34]) recomputes with the correct je value,
      // enabling tryInjectTeNow() to generate Te on the very next DOM-change sync.
      if (requestedServiceState) {
        applied = dispatchHookAction(hooks[12], requestedServiceState) || applied;
      }
      applied = dispatchHookAction(hooks[14], String(requestedMq)) || applied;
      if (requestedSurface) {
        applied = dispatchHookAction(hooks[17], requestedSurface) || applied;
      }
      if (requestedServiceState === "posa" && hooks[19]) {
        const currentPosaPrice = hooks[19].memoizedState;
        if (!currentPosaPrice || Number(currentPosaPrice) === 0) {
          applied = dispatchHookAction(hooks[19], 25) || applied;
        }
      }
    }

    // hooks[25] = Ce (materials toggle, default true).
    // Ensure it is always ON so the materials grid and description are rendered.
    if (hooks[25] && hooks[25].memoizedState === false) {
      applied = dispatchHookAction(hooks[25], true) || applied;
    }

    // hooks[27] = Te (materials description auto-generated by a useEffect that calls re()).
    // The useEffect depends on [Ce, P, le, je, codexPietriscoPrice].  If it ran before mq
    // was dispatched (je was still 0), all quantities show as "0" and the description is
    // useless.  On retry calls (delays 200ms+) the correct Ne.items are already computed
    // in hooks[34] (useMemo Ne).  If Te is empty or stale-zero, regenerate it here from
    // Ne.items so the "Dettagli materiali:" section always shows correct unit prices.
    const currentTe = hooks[27]?.memoizedState;
    const neHook = hooks[34];  // useMemo Ne = [value, deps]
    const neValue = Array.isArray(neHook?.memoizedState) ? neHook.memoizedState[0] : null;

    // Only inject Te when it is empty AND Ne has at least one item with a real (>0) quantity.
    // This avoids interfering when the React useEffect already generated the correct text.
    const hasRealQty = neValue && Array.isArray(neValue.items)
      && neValue.items.some((e) => {
        const q = String(e.qtyDisplay || "");
        return q && q !== "0" && !q.startsWith("0,00") && !q.startsWith("0 ");
      });
    const teNeedsRefresh = (!currentTe || !String(currentTe).trim()) && hasRealQty;

    if (teNeedsRefresh && neValue && Array.isArray(neValue.items) && neValue.items.length > 0) {
      const fmtIt = (n) => Number(n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const currentService = requestedServiceState || String(hooks[12]?.memoizedState || "fornitura");
      const eligibleItems = currentService === "fornitura"
        ? neValue.items.filter((e) => e.key !== "pietrisco")
        : neValue.items;
      const teText = eligibleItems
        .filter((e) => {
          const qty = String(e.qtyDisplay || "");
          return qty && qty !== "0" && qty !== "0,00" && !qty.startsWith("0 ") && !qty.startsWith("0,00 ");
        })
        .map((e) => e.unitPrice > 0
          ? `${e.label}: ${e.qtyDisplay} × ${fmtIt(e.unitPrice)} €/${e.unit}`
          : `${e.label}: ${e.qtyDisplay}`)
        .join("; ");
      if (teText) {
        applied = dispatchHookAction(hooks[27], teText) || applied;
      }
    }

    return applied;
  }

  // Inject Te (hooks[27]) whenever it is empty but Ne (useMemo hooks[34]) already
  // holds items with real (> 0) quantities.  Called from scheduleBridgeSync on every
  // DOM change so it fires regardless of the timed-retry window — this is the main
  // guard that ensures "Dettagli materiali:" always appears in the PDF view.
  function tryInjectTeNow() {
    const hooks = findGeneratorHooks();  // accepts "edit", "pdf", "preview"
    if (!hooks) return false;

    const currentTe = hooks[27]?.memoizedState;
    if (currentTe && String(currentTe).trim()) return false;  // Te already populated

    const ce = hooks[25]?.memoizedState;
    if (!ce) return false;  // materials section is toggled OFF

    const neHook = hooks[34];
    const neValue = Array.isArray(neHook?.memoizedState) ? neHook.memoizedState[0] : null;
    const hasRealQty = neValue && Array.isArray(neValue.items)
      && neValue.items.some((e) => {
        const q = String(e.qtyDisplay || "");
        return q && q !== "0" && !q.startsWith("0,00") && !q.startsWith("0 ");
      });
    if (!hasRealQty) return false;

    const fmtIt = (n) => Number(n || 0).toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const currentService = String(hooks[12]?.memoizedState || "fornitura");
    const eligibleItems = currentService === "fornitura"
      ? neValue.items.filter((e) => e.key !== "pietrisco")
      : neValue.items;

    const teText = eligibleItems
      .filter((e) => {
        const qty = String(e.qtyDisplay || "");
        return qty && qty !== "0" && qty !== "0,00"
          && !qty.startsWith("0 ") && !qty.startsWith("0,00 ");
      })
      .map((e) => e.unitPrice > 0
        ? `${e.label}: ${e.qtyDisplay} × ${fmtIt(e.unitPrice)} €/${e.unit}`
        : `${e.label}: ${e.qtyDisplay}`)
      .join("; ");

    if (teText && hooks[27]?.queue?.dispatch) {
      dispatchHookAction(hooks[27], teText);
      return true;
    }
    return false;
  }

  function applyRequestPayloadNow(payload) {
    if (!payload || typeof payload !== "object") return false;

    if (isPreviewModeVisible()) {
      forceGeneratorEditState();
    }

    const customer = buildCustomerPayload(payload);
    const requestedMq = payload.mq != null && payload.mq !== "" ? String(payload.mq).replace(",", ".") : "";
    const requestedHeight = String(payload.altezza || payload.height || payload.requestedHeight || "").trim();
    const requestedServiceLabel = normalizeServiceLabel(payload.servizio || payload.service || payload.tipologia || "");
    const requestedServiceState = normalizeServiceStateValue(payload.servizio || payload.service || payload.tipologia || "");
    const requestedSurface = normalizeSurfaceValue(payload.fondo || payload.superficie || payload.surface || "");

    hideInternalImportPanel();

    let applied = applyReactStatePrefill(customer, requestedMq, requestedServiceState, requestedSurface);

    const assignments = [
      ["Nome", customer.nome],
      ["Cognome", customer.cognome],
      ["Città", customer.citta],
      ["Telefono", customer.telefono],
      ["Email", customer.email],
      ["Metri Quadri", requestedMq],
      ["Altezza", requestedHeight],
      ["Altezza da preventivare", requestedHeight],
      ["Altezza da preventivare mm", requestedHeight],
      ["Altezza prato", requestedHeight],
      ["Spessore", requestedHeight],
      ["MM", requestedHeight],
    ].filter(([, value]) => value !== undefined && value !== null && String(value) !== "");

    let heightApplied = false;
    assignments.forEach(([label, value]) => {
      const field = findFieldByLabel(label);
      if (!field) return;
      setNativeValue(field, String(value));
      applied = true;
      const normalizedLabel = normalizeLabel(label);
      if (normalizedLabel.includes("altezza") || normalizedLabel.includes("spessore") || normalizedLabel === "mm") {
        heightApplied = true;
      }
    });

    if (requestedHeight && !heightApplied) {
      const heightField = findHeightField();
      if (heightField) {
        setNativeValue(heightField, String(requestedHeight));
        applied = true;
      }
    }

    if (requestedServiceLabel) {
      applied = applyButtonValue("Tipologia", requestedServiceLabel) || applied;
    }

    const surfaceField = findFieldByLabel("Superficie");
    if (requestedSurface && surfaceField) {
      setNativeValue(surfaceField, requestedSurface);
      applied = true;
    }

    // DOM fallback for posa price: when service is "posa" and the price input shows 0
    // (or is empty), reset it to 25 €/mq.  The input is only rendered by React after
    // the service type re-renders as "posa", so this may only succeed on a later retry
    // (scheduleRequestPayload calls us multiple times with increasing delays).
    if (requestedServiceState === "posa") {
      const posaPriceField = findFieldByLabel("Posa") || findFieldByLabel("Posa €/mq") || findFieldByLabel("Posa/mq");
      if (posaPriceField) {
        const currentVal = parseFloat(posaPriceField.value);
        if (!currentVal || currentVal === 0) {
          setNativeValue(posaPriceField, "25");
          applied = true;
        }
      }
    }

    return applied;
  }

  function clearRequestPayloadNow() {
    scheduledPrefillRunId += 1;
    lastAppliedPrefillSignature = "";
    hideInternalImportPanel();

    if (isPreviewModeVisible()) {
      forceGeneratorEditState();
    }

    const emptyCustomer = {
      nome: "",
      cognome: "",
      citta: "",
      telefono: "",
      email: "",
    };
    applyReactStatePrefill(emptyCustomer, "", "", "");

    // applyReactStatePrefill() skips mq/service/surface/Te when they are passed as "".
    // Dispatch explicit defaults so a "preventivo libero" does not inherit stale React
    // state from the previous prefill.
    const hooksForClear = findGeneratorHooks();
    if (hooksForClear) {
      // hooks[12] = service type — reset to default "fornitura"
      if (hooksForClear[12]?.queue?.dispatch) dispatchHookAction(hooksForClear[12], "fornitura");
      // hooks[14] = mq string — clear to ""
      if (hooksForClear[14]?.queue?.dispatch) dispatchHookAction(hooksForClear[14], "");
      // hooks[17] = surface — reset to default "terra"
      if (hooksForClear[17]?.queue?.dispatch) dispatchHookAction(hooksForClear[17], "terra");
      // hooks[27] = Te (materials description) — clear
      if (hooksForClear[27]?.queue?.dispatch) dispatchHookAction(hooksForClear[27], "");
    }

    const clearLabels = [
      "Nome",
      "Cognome",
      "Città",
      "Telefono",
      "Email",
      "Metri Quadri",
      "Altezza",
      "Altezza da preventivare",
      "Altezza da preventivare mm",
      "Altezza prato",
      "Spessore",
      "MM",
      "Superficie",
    ];

    clearLabels.forEach((label) => {
      const field = findFieldByLabel(label);
      if (!field) return;
      setNativeValue(field, "");
    });
    const heightField = findHeightField();
    if (heightField) {
      setNativeValue(heightField, "");
    }
    reportEmbeddedContentHeight();
  }

  function scheduleRequestPayload(payload, { force = false } = {}) {
    const signature = buildPayloadSignature(payload);
    if (!signature) return false;
    if (!force && signature === lastAppliedPrefillSignature) return false;
    lastAppliedPrefillSignature = signature;

    const runId = ++scheduledPrefillRunId;
    const delays = [0, 80, 200, 420, 760, 1200, 1800, 2600];

    delays.forEach((delay) => {
      window.setTimeout(() => {
        if (runId !== scheduledPrefillRunId) return;
        applyRequestPayloadNow(payload);
      }, delay);
    });

    return true;
  }

  function ensureBrandingStyles() {
    if (document.getElementById("codex-crew-brand-style")) return;
    const style = document.createElement("style");
    style.id = "codex-crew-brand-style";
    style.textContent = `
      .codex-crew-branding {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        align-self: flex-start;
        margin-left: auto;
        margin-right: -2px;
        margin-top: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      .codex-crew-branding img {
        width: 58px;
        max-width: 58px;
        max-height: 58px;
        object-fit: contain;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  function getPdfRoots() {
    return Array.from(document.querySelectorAll(".pdf-root"))
      .filter((root) => root instanceof Element);
  }

  function getPdfRootContent(root) {
    if (!(root instanceof Element)) return null;
    return Array.from(root.children || []).find((child) => child instanceof Element) || null;
  }

  function ensurePlannerReportStyles() {
    if (document.getElementById("codex-planner-report-style")) return;
    const style = document.createElement("style");
    style.id = "codex-planner-report-style";
    style.textContent = `
      .codex-planner-report-appendix {
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1.5px solid #d4ddd7;
      }

      .codex-planner-report-head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 8px 16px;
        margin-bottom: 10px;
      }

      .codex-planner-report-title {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #315c48;
      }

      .codex-planner-report-meta {
        font-size: 8.5px;
        line-height: 1.45;
        color: #627284;
      }

      .codex-planner-report-body {
        border-radius: 12px;
        background: #ffffff;
      }
    `;
    document.head.appendChild(style);
  }

  function clearInjectedPlannerReport() {
    if (plannerReportCleanupTimer) {
      window.clearTimeout(plannerReportCleanupTimer);
      plannerReportCleanupTimer = 0;
    }
    document.querySelectorAll(".codex-planner-report-appendix").forEach((node) => node.remove());
  }

  function mountPlannerReportForExport() {
    if (!ENABLE_PLANNER_REPORT_EXPORT) return false;
    clearInjectedPlannerReport();
    const normalized = normalizePlannerReportPayload(activePlannerReport);
    if (!normalized.reportHtml) return false;
    ensurePlannerReportStyles();
    ensurePdfExportStyles();
    const pdfRoots = getPdfRoots();
    if (!pdfRoots.length) return false;

    pdfRoots.forEach((root) => {
      const mount = getPdfRootContent(root) || root;
      if (!(mount instanceof Element)) return;
      const appendix = document.createElement("section");
      appendix.className = "codex-planner-report-appendix";
      appendix.innerHTML = `
        <div class="codex-planner-report-head">
          <div class="codex-planner-report-title">${normalized.title || "Allegato materiali Garden Planner"}</div>
          <div class="codex-planner-report-meta">
            ${(normalized.client || normalized.address || normalized.sqmLabel)
              ? [normalized.client, normalized.address, normalized.sqmLabel].filter(Boolean).join(" · ")
              : ""}
          </div>
        </div>
        <div class="codex-planner-report-body">${normalized.reportHtml}</div>
      `;
      stripPdfStyleArtifacts(appendix);
      mount.appendChild(appendix);
    });

    reportEmbeddedContentHeight();
    plannerReportCleanupTimer = window.setTimeout(() => {
      clearInjectedPlannerReport();
      reportEmbeddedContentHeight();
    }, 1800);
    return true;
  }

  function applyPlannerReportPayloadNow(payload) {
    if (!ENABLE_PLANNER_REPORT_EXPORT) {
      activePlannerReport = { title: "", client: "", address: "", sqmLabel: "", reportHtml: "" };
      clearInjectedPlannerReport();
      reportEmbeddedContentHeight();
      return false;
    }
    activePlannerReport = normalizePlannerReportPayload(payload);
    if (!activePlannerReport.reportHtml) {
      clearInjectedPlannerReport();
      reportEmbeddedContentHeight();
    }
    return Boolean(activePlannerReport.reportHtml);
  }

  function findQuoteHeaderBlocks(root) {
    if (!(root instanceof Element)) return null;

    const rows = Array.from(root.querySelectorAll(".pdf-no-break")).filter((row) => {
      if (!row.querySelector("img")) return false;
      const label = normalizeLabel(row.textContent || "");
      return label.includes("preventivo nr") || label.includes("preventivo n.");
    });
    const headerRow = rows[0] || null;
    if (!(headerRow instanceof Element)) return null;

    const collectColumns = (row) => {
      let cols = Array.from(row.children || []).filter((child) => child instanceof Element);
      if (cols.length === 1) {
        const only = cols[0];
        const inner = Array.from(only.children || []).filter((child) => child instanceof Element);
        const looksSplit = inner.some((c) => c.querySelector?.("img"))
          && inner.some((c) => normalizeLabel(c.textContent || "").includes("preventivo nr"));
        if (looksSplit) cols = inner;
      }
      return cols;
    };

    const columns = collectColumns(headerRow);
    let quoteBlock = columns.find((child) => normalizeLabel(child.textContent || "").includes("preventivo nr")) || null;
    if (!quoteBlock) {
      const hits = Array.from(headerRow.querySelectorAll("*")).filter((el) => (
        el instanceof Element && normalizeLabel(el.textContent || "").includes("preventivo nr")
      ));
      hits.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);
      quoteBlock = hits[0] || null;
    }

    let brandAnchor = columns.find((child) => (
      child !== quoteBlock
      && child.querySelector("img")
      && !normalizeLabel(child.textContent || "").includes("preventivo nr")
    )) || null;

    if (!brandAnchor) {
      const imgs = Array.from(headerRow.querySelectorAll("img"));
      const preferred = imgs.find((img) => (
        !(quoteBlock instanceof Element) || !quoteBlock.contains(img)
      ));
      const anchorImg = preferred || imgs[0];
      brandAnchor = anchorImg instanceof Element ? anchorImg.parentElement : null;
    }

    if (!(quoteBlock instanceof Element) || !(brandAnchor instanceof Element)) return null;
    if (quoteBlock === brandAnchor) return null;

    return { headerRow, quoteBlock, brandAnchor };
  }

  function findQuoteMetaLine(root) {
    const headerBlocks = findQuoteHeaderBlocks(root);
    const quoteBlock = headerBlocks?.quoteBlock;
    if (!(quoteBlock instanceof Element)) return null;

    const lines = Array.from(quoteBlock.children || []).filter((child) => child instanceof Element);
    return lines.length ? lines[lines.length - 1] : null;
  }

  function applyBrandingCompanyMeta(root, payload) {
    const quoteMetaLine = findQuoteMetaLine(root);
    if (!quoteMetaLine) return false;
    const quoteMetaBlock = quoteMetaLine.parentElement;

    if (!quoteMetaLine.dataset.codexOriginalText) {
      quoteMetaLine.dataset.codexOriginalText = quoteMetaLine.textContent || "";
    }
    if (!quoteMetaLine.dataset.codexOriginalColor) {
      quoteMetaLine.dataset.codexOriginalColor = quoteMetaLine.style.color || "";
      quoteMetaLine.dataset.codexOriginalFontWeight = quoteMetaLine.style.fontWeight || "";
      quoteMetaLine.dataset.codexOriginalFontSize = quoteMetaLine.style.fontSize || "";
      quoteMetaLine.dataset.codexOriginalWhiteSpace = quoteMetaLine.style.whiteSpace || "";
      quoteMetaLine.dataset.codexOriginalDisplay = quoteMetaLine.style.display || "";
      quoteMetaLine.dataset.codexOriginalMarginTop = quoteMetaLine.style.marginTop || "";
      quoteMetaLine.dataset.codexOriginalLineHeight = quoteMetaLine.style.lineHeight || "";
      quoteMetaLine.dataset.codexOriginalLetterSpacing = quoteMetaLine.style.letterSpacing || "";
      quoteMetaLine.dataset.codexOriginalTextAlign = quoteMetaLine.style.textAlign || "";
    }
    if (quoteMetaBlock && !quoteMetaBlock.dataset.codexOriginalMinWidth) {
      quoteMetaBlock.dataset.codexOriginalMinWidth = quoteMetaBlock.style.minWidth || "";
      quoteMetaBlock.dataset.codexOriginalWidth = quoteMetaBlock.style.width || "";
      quoteMetaBlock.dataset.codexOriginalDisplay = quoteMetaBlock.style.display || "";
      quoteMetaBlock.dataset.codexOriginalFlexDirection = quoteMetaBlock.style.flexDirection || "";
      quoteMetaBlock.dataset.codexOriginalAlignItems = quoteMetaBlock.style.alignItems || "";
      quoteMetaBlock.dataset.codexOriginalJustifyContent = quoteMetaBlock.style.justifyContent || "";
      quoteMetaBlock.dataset.codexOriginalGap = quoteMetaBlock.style.gap || "";
    }

    if (!payload?.crewName) {
      quoteMetaLine.textContent = quoteMetaLine.dataset.codexOriginalText || quoteMetaLine.textContent || "";
      quoteMetaLine.style.color = quoteMetaLine.dataset.codexOriginalColor || "";
      quoteMetaLine.style.fontWeight = quoteMetaLine.dataset.codexOriginalFontWeight || "";
      quoteMetaLine.style.fontSize = quoteMetaLine.dataset.codexOriginalFontSize || "";
      quoteMetaLine.style.whiteSpace = quoteMetaLine.dataset.codexOriginalWhiteSpace || "";
      quoteMetaLine.style.display = quoteMetaLine.dataset.codexOriginalDisplay || "";
      quoteMetaLine.style.marginTop = quoteMetaLine.dataset.codexOriginalMarginTop || "";
      quoteMetaLine.style.lineHeight = quoteMetaLine.dataset.codexOriginalLineHeight || "";
      quoteMetaLine.style.letterSpacing = quoteMetaLine.dataset.codexOriginalLetterSpacing || "";
      quoteMetaLine.style.textAlign = quoteMetaLine.dataset.codexOriginalTextAlign || "";
      if (quoteMetaBlock) {
        quoteMetaBlock.style.minWidth = quoteMetaBlock.dataset.codexOriginalMinWidth || "";
        quoteMetaBlock.style.width = quoteMetaBlock.dataset.codexOriginalWidth || "";
        quoteMetaBlock.style.display = quoteMetaBlock.dataset.codexOriginalDisplay || "";
        quoteMetaBlock.style.flexDirection = quoteMetaBlock.dataset.codexOriginalFlexDirection || "";
        quoteMetaBlock.style.alignItems = quoteMetaBlock.dataset.codexOriginalAlignItems || "";
        quoteMetaBlock.style.justifyContent = quoteMetaBlock.dataset.codexOriginalJustifyContent || "";
        quoteMetaBlock.style.gap = quoteMetaBlock.dataset.codexOriginalGap || "";
      }
      return false;
    }

    quoteMetaLine.textContent = `${payload.crewName} · Rivenditore autorizzato`;
    quoteMetaLine.style.color = "#567958";
    quoteMetaLine.style.fontWeight = "700";
    quoteMetaLine.style.fontSize = "7.2px";
    quoteMetaLine.style.whiteSpace = "nowrap";
    quoteMetaLine.style.display = "block";
    quoteMetaLine.style.marginTop = "2px";
    quoteMetaLine.style.lineHeight = "1.14";
    quoteMetaLine.style.letterSpacing = "0";
    quoteMetaLine.style.textAlign = "right";
    if (quoteMetaBlock) {
      quoteMetaBlock.style.minWidth = "204px";
      quoteMetaBlock.style.width = "204px";
      quoteMetaBlock.style.display = "flex";
      quoteMetaBlock.style.flexDirection = "column";
      quoteMetaBlock.style.alignItems = "flex-end";
      quoteMetaBlock.style.justifyContent = "flex-start";
      quoteMetaBlock.style.gap = "3px";
    }
    return true;
  }

  function findFooterMetaLine(root) {
    const rootContent = getPdfRootContent(root);
    if (!(rootContent instanceof Element)) return null;
    const divChildren = Array.from(rootContent.children || []).filter((child) => child instanceof HTMLDivElement);
    return divChildren.length ? divChildren[divChildren.length - 1] : null;
  }

  function applyBrandingFooterMeta(root, payload) {
    const footerMetaLine = findFooterMetaLine(root);
    if (!footerMetaLine) return false;

    if (!footerMetaLine.dataset.codexOriginalText) {
      footerMetaLine.dataset.codexOriginalText = footerMetaLine.textContent || "";
      footerMetaLine.dataset.codexOriginalColor = footerMetaLine.style.color || "";
      footerMetaLine.dataset.codexOriginalFontWeight = footerMetaLine.style.fontWeight || "";
      footerMetaLine.dataset.codexOriginalLetterSpacing = footerMetaLine.style.letterSpacing || "";
      footerMetaLine.dataset.codexOriginalFontSize = footerMetaLine.style.fontSize || "";
      footerMetaLine.dataset.codexOriginalLineHeight = footerMetaLine.style.lineHeight || "";
      footerMetaLine.dataset.codexOriginalTextAlign = footerMetaLine.style.textAlign || "";
    }

    if (!payload?.crewName) {
      footerMetaLine.textContent = footerMetaLine.dataset.codexOriginalText || footerMetaLine.textContent || "";
      footerMetaLine.style.color = footerMetaLine.dataset.codexOriginalColor || "";
      footerMetaLine.style.fontWeight = footerMetaLine.dataset.codexOriginalFontWeight || "";
      footerMetaLine.style.letterSpacing = footerMetaLine.dataset.codexOriginalLetterSpacing || "";
      footerMetaLine.style.fontSize = footerMetaLine.dataset.codexOriginalFontSize || "";
      footerMetaLine.style.lineHeight = footerMetaLine.dataset.codexOriginalLineHeight || "";
      footerMetaLine.style.textAlign = footerMetaLine.dataset.codexOriginalTextAlign || "";
      return false;
    }

    footerMetaLine.textContent = `${payload.crewName} · Rivenditore autorizzato`;
    footerMetaLine.style.color = "#567958";
    footerMetaLine.style.fontWeight = "700";
    footerMetaLine.style.letterSpacing = "0";
    footerMetaLine.style.fontSize = "7.1px";
    footerMetaLine.style.lineHeight = "1.2";
    footerMetaLine.style.textAlign = "center";
    return true;
  }

  function applyBrandingPayloadNow(payload) {
    activeBrandingPayload = normalizeBrandingPayload(payload);
    ensureBrandingStyles();

    const pdfRoots = getPdfRoots();
    if (!pdfRoots.length) return false;

    let applied = false;

    pdfRoots.forEach((root) => {
      const headerBlocks = findQuoteHeaderBlocks(root);
      const headerRow = headerBlocks?.headerRow;
      const quoteBlock = headerBlocks?.quoteBlock;
      const brandAnchor = headerBlocks?.brandAnchor;

      if (!(headerRow instanceof Element) || !(quoteBlock instanceof Element) || !(brandAnchor instanceof Element)) {
        applied = applyBrandingCompanyMeta(root, activeBrandingPayload) || applied;
        applied = applyBrandingFooterMeta(root, activeBrandingPayload) || applied;
        return;
      }

      if (!headerRow.dataset.codexOriginalJustifyContent) {
        headerRow.dataset.codexOriginalJustifyContent = headerRow.style.justifyContent || "";
        headerRow.dataset.codexOriginalAlignItems = headerRow.style.alignItems || "";
        headerRow.dataset.codexOriginalGap = headerRow.style.gap || "";
        headerRow.dataset.codexOriginalColumnGap = headerRow.style.columnGap || "";
      }
      if (!quoteBlock.dataset.codexOriginalMarginLeft) {
        quoteBlock.dataset.codexOriginalMarginLeft = quoteBlock.style.marginLeft || "";
      }

      root.querySelectorAll(".codex-crew-branding").forEach((node) => node.remove());

      if (!activeBrandingPayload.crewLogoDataUrl) {
        headerRow.style.justifyContent = headerRow.dataset.codexOriginalJustifyContent || "";
        headerRow.style.alignItems = headerRow.dataset.codexOriginalAlignItems || "";
        headerRow.style.gap = headerRow.dataset.codexOriginalGap || "";
        headerRow.style.columnGap = headerRow.dataset.codexOriginalColumnGap || "";
        quoteBlock.style.marginLeft = quoteBlock.dataset.codexOriginalMarginLeft || "";
        applied = applyBrandingCompanyMeta(root, activeBrandingPayload) || applied;
        applied = applyBrandingFooterMeta(root, activeBrandingPayload) || applied;
        return;
      }

      headerRow.style.justifyContent = "flex-start";
      headerRow.style.alignItems = "flex-start";
      headerRow.style.gap = "0";
      headerRow.style.columnGap = "0";
      quoteBlock.style.marginLeft = "0";

      const brandingNode = document.createElement("div");
      brandingNode.className = "codex-crew-branding";

      brandingNode.innerHTML = "";
      const logo = document.createElement("img");
      logo.src = activeBrandingPayload.crewLogoDataUrl;
      logo.alt = activeBrandingPayload.crewName
        ? `Logo squadra ${activeBrandingPayload.crewName}`
        : "Logo squadra";
      logo.decoding = "async";
      logo.loading = "eager";

      brandingNode.appendChild(logo);
      headerRow.insertBefore(brandingNode, quoteBlock);
      applied = applyBrandingCompanyMeta(root, activeBrandingPayload) || applied;
      applied = applyBrandingFooterMeta(root, activeBrandingPayload) || applied;
      void applyExportReadyLogoToImage(logo, activeBrandingPayload.crewLogoDataUrl);
      applied = true;
    });

    return applied;
  }

  async function preparePdfBrandingForExport() {
    if (!ENABLE_BRANDING_EXPORT && !ENABLE_PLANNER_REPORT_EXPORT) return;
    fixHeylightReadability(document.body);
    fixPerMqCardsReadability(document.body);
    polishOfferHeading(document.body);
    polishAccessoriesTable(document.body);
    injectMaterialsDiscount(document.body);
    if (ENABLE_PREVIEW_POLISH) polishQuotePreviewLayout(document.body);
    ensurePdfExportStyles();
    stripPdfStyleArtifacts();
    if (!ENABLE_BRANDING_EXPORT || !activeBrandingPayload.crewLogoDataUrl) return;
    applyBrandingPayloadNow(activeBrandingPayload);
    const brandingImages = Array.from(document.querySelectorAll(".pdf-root .codex-crew-branding img"));
    if (!brandingImages.length) return;
    await Promise.all(brandingImages.map((brandingImage) => (
      applyExportReadyLogoToImage(brandingImage, activeBrandingPayload.crewLogoDataUrl)
    )));
    await waitForAnimationFrame();
    await waitForAnimationFrame();
  }

  function decorateOfferHeadingText(pdf, sourceElement) {
    if (!pdf) return false;
    const sourceRoot = sourceElement instanceof Element ? sourceElement : null;
    if (!sourceRoot) return false;
    const offerHeading = findElementByTextWithin(sourceRoot, "div, span, p", "OFFERTA PER");
    if (!(offerHeading instanceof HTMLElement)) return false;
    const label = String(offerHeading.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();
    if (!label) return false;

    const rootRect = sourceRoot.getBoundingClientRect();
    const headingRect = offerHeading.getBoundingClientRect();
    if (!rootRect.width || !headingRect.width || !headingRect.height) return false;

    const pageWidth = Number(pdf.internal?.pageSize?.getWidth?.() || 210);
    const contentMargin = 3;
    const contentWidth = Math.max(1, pageWidth - (contentMargin * 2));
    const scale = contentWidth / rootRect.width;
    const x = contentMargin + ((headingRect.left - rootRect.left) + (headingRect.width / 2)) * scale;
    const y = contentMargin + ((headingRect.top - rootRect.top) + (headingRect.height / 2)) * scale;

    try {
      pdf.setPage(1);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11.2);
      pdf.setTextColor(255, 255, 255);
      pdf.text(label, x, y, { align: "center", baseline: "middle" });
      pdf.setTextColor(0, 0, 0);
      return true;
    } catch (error) {
      console.warn("Decorazione testo offerta PDF fallita:", error);
      return false;
    }
  }

  async function decoratePdfWithBranding(pdf, sourceElement) {
    if (!pdf) return false;

    let decorated = decorateOfferHeadingText(pdf, sourceElement);
    if (!ENABLE_BRANDING_EXPORT || !activeBrandingPayload.crewLogoDataUrl) return decorated;

    const sourceRoot = sourceElement instanceof Element ? sourceElement : null;
    if (sourceRoot?.querySelector(".codex-crew-branding img")) {
      return true;
    }

    const exportReadySrc = await getExportReadyBrandingLogoDataUrl(activeBrandingPayload.crewLogoDataUrl);
    if (!exportReadySrc) return decorated;

    let logoImage = null;
    try {
      logoImage = await loadImageFromSource(exportReadySrc);
    } catch (error) {
      console.warn("Logo squadra non caricato per decorazione PDF:", error);
      return decorated;
    }

    const imageWidth = Math.max(1, Number(logoImage?.naturalWidth || logoImage?.width || 1));
    const imageHeight = Math.max(1, Number(logoImage?.naturalHeight || logoImage?.height || 1));
    const maxWidth = 15.4;
    const maxHeight = 15.4;
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
    const width = Math.max(8.6, Number((imageWidth * scale).toFixed(2)));
    const height = Math.max(8.6, Number((imageHeight * scale).toFixed(2)));
    const x = 101.8;
    const y = 12.4;

    try {
      pdf.setPage(1);
      pdf.addImage(exportReadySrc, "PNG", x, y, width, height, undefined, "FAST");
      decorated = true;
      return decorated;
    } catch (error) {
      console.warn("Decorazione branding PDF fallita:", error);
      return decorated;
    }
  }

  function installPdfDownloadInterceptor() {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!button) return;
      if (button.dataset.codexPdfBypass === "1") {
        button.removeAttribute("data-codex-pdf-bypass");
        return;
      }
      if (!normalizeLabel(button.textContent).includes("scarica pdf")) return;
      const shouldDecorateBranding = Boolean(activeBrandingPayload.crewLogoDataUrl);
      const shouldAttachPlannerReport = Boolean(activePlannerReport?.reportHtml);
      const pdfRoot = getLivePdfRoot(document);
      const recommendationModels = pdfRoot ? collectQuoteModels(pdfRoot).map((item) => item.name) : [];
      const selectedRecommendation = pdfRoot ? readRecommendedModel(pdfRoot, recommendationModels) : "";
      const shouldApplyRecommendation = Boolean(pdfRoot && selectedRecommendation);
      const shouldCompactQuoteExport = Boolean(pdfRoot);
      if (!shouldDecorateBranding && !shouldAttachPlannerReport && !shouldApplyRecommendation && !shouldCompactQuoteExport) return;
      if (pdfDownloadInterceptionActive) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      pdfDownloadInterceptionActive = true;
      let compactExportCleanup = null;
      notifyPortalUsage("quote_pdf_exported", {
        recommendedModel: selectedRecommendation || "",
        compactExport: shouldCompactQuoteExport,
        plannerReport: shouldAttachPlannerReport,
      });

      Promise.resolve()
        .then(() => {
          if (shouldAttachPlannerReport) {
            mountPlannerReportForExport();
          } else {
            clearInjectedPlannerReport();
          }
        })
        .then(async () => {
          if (shouldApplyRecommendation && pdfRoot) {
            applyRecommendedModelClasses(pdfRoot, selectedRecommendation);
            await waitForAnimationFrame();
            await waitForAnimationFrame();
          }
        })
        .then(async () => {
          if (shouldCompactQuoteExport && pdfRoot) {
            compactExportCleanup = prepareCompactQuoteForPdfExport(pdfRoot);
            await waitForAnimationFrame();
            await waitForAnimationFrame();
          }
        })
        .then(() => (shouldDecorateBranding ? preparePdfBrandingForExport() : undefined))
        .catch((error) => {
          console.warn("Preparazione export PDF fallita:", error);
          notifyPortalUsage("quote_export_failed", { stage: "prepare_pdf_export" });
        })
        .finally(() => {
          pdfDownloadInterceptionActive = false;
          button.dataset.codexPdfBypass = "1";
          button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          if (compactExportCleanup) {
            scheduleCompactQuoteExportCleanup(compactExportCleanup);
          }
        });
    }, true);
  }

  function parsePriceValue(rawValue) {
    const normalized = String(rawValue ?? "")
      .trim()
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function formatPriceInputValue(value) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) return "0";
    return String(Number(amount.toFixed(2)));
  }

  function isAccessoryItem(item) {
    return Boolean(
      item
      && typeof item === "object"
      && "id" in item
      && "name" in item
      && "unit" in item
      && "price" in item
      && "qty" in item
      && "discount" in item
      && "applyIva" in item
    );
  }

  function isAccessoriesState(value) {
    return Array.isArray(value) && value.length > 0 && value.every(isAccessoryItem);
  }

  function findAccessoriesHook() {
    const rootFiber = getReactRootFiber();
    if (!rootFiber) return null;

    let match = null;
    walkFiberTree(rootFiber, (fiber) => {
      const isFunctionComponent = fiber && (fiber.tag === 0 || fiber.tag === 15);
      if (!isFunctionComponent || match) return;

      let hook = fiber.memoizedState || null;
      while (hook) {
        if (hook.queue?.dispatch && isAccessoriesState(hook.memoizedState)) {
          match = hook;
          return;
        }
        hook = hook.next;
      }
    });

    return match;
  }

  function getAccessoriesState() {
    const hook = findAccessoriesHook();
    return Array.isArray(hook?.memoizedState) ? hook.memoizedState : [];
  }

  function updateAccessoryPrice(accessoryId, nextValue) {
    const hook = findAccessoriesHook();
    if (!hook?.queue?.dispatch) return false;
    const parsedPrice = parsePriceValue(nextValue);
    hook.queue.dispatch((previous) => {
      if (!Array.isArray(previous)) return previous;
      return previous.map((item) => {
        if (!item || item.id !== accessoryId) return item;
        return { ...item, price: parsedPrice };
      });
    });
    return true;
  }

  function buildPriceEditor(item) {
    const wrapper = document.createElement("label");
    wrapper.className = "codex-custom-price";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "4px";
    wrapper.style.width = "96px";
    wrapper.style.minWidth = "96px";

    const label = document.createElement("span");
    label.textContent = "Prezzo €";
    label.style.fontSize = "10px";
    label.style.color = "#9ca3af";
    label.style.fontWeight = "600";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.placeholder = "0";
    input.value = formatPriceInputValue(item?.price);
    input.dataset.accessoryId = String(item?.id || "");
    input.className = "codex-custom-price-input";
    input.style.width = "100%";
    input.style.textAlign = "center";
    input.style.border = "1px solid #d1d5db";
    input.style.borderRadius = "8px";
    input.style.padding = "6px 8px";
    input.style.fontSize = "14px";
    input.style.outline = "none";
    input.style.backgroundColor = "#ffffff";
    input.style.color = "#1f2937";

    const commit = () => {
      updateAccessoryPrice(item?.id, input.value);
    };

    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
        input.blur();
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function syncCustomAccessoryPriceEditors() {
    const customAccessories = getAccessoriesState().filter((item) => item && item.isCustom);
    const customNameInputs = Array.from(document.querySelectorAll('input[placeholder="Nome prodotto o servizio"]'));

    customNameInputs.forEach((nameInput, index) => {
      const accessory = customAccessories[index];
      const row = nameInput.closest(".flex-1")?.parentElement;
      if (!accessory || !row) return;

      const currentEditor = row.querySelector(".codex-custom-price");
      if (currentEditor?.querySelector("input")?.dataset.accessoryId !== String(accessory.id)) {
        currentEditor?.remove();
      }

      let priceEditor = row.querySelector(".codex-custom-price");
      if (!priceEditor) {
        priceEditor = buildPriceEditor(accessory);
        row.insertBefore(priceEditor, row.children[1] || null);
      }

      const priceInput = priceEditor.querySelector("input");
      if (priceInput && document.activeElement !== priceInput) {
        priceInput.value = formatPriceInputValue(accessory.price);
      }
    });
  }

  function startCustomAccessoryPriceBridge() {
    const observer = new MutationObserver(() => {
      requestBridgeSyncBurst(2);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    requestBridgeSyncBurst(6);
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type === "quote-generator:prefill-request") {
      setPlannerBridgeReadEnabled(String(event.data?.source || "").trim() === "garden-planner");
      scheduleRequestPayload(event.data.payload, { force: Boolean(event.data?.force) });
      ensureEditModeActive(0);
      requestBridgeSyncBurst(4);
      return;
    }
    if (event.data?.type === "quote-generator:clear-prefill") {
      setPlannerBridgeReadEnabled(false);
      clearRequestPayloadNow();
      ensureEditModeActive(0);
      requestBridgeSyncBurst(2);
      return;
    }
    if (event.data?.type === "quote-generator:branding") {
      const payload = event.data.payload;
      const run = () => {
        applyBrandingPayloadNow(payload);
        requestBridgeSyncBurst(3);
      };
      run();
      window.setTimeout(run, 320);
      window.setTimeout(run, 900);
      return;
    }
    if (event.data?.type === "quote-generator:planner-report") {
      if (ENABLE_PLANNER_REPORT_EXPORT) {
        applyPlannerReportPayloadNow(event.data.payload);
        requestBridgeSyncBurst(2);
      } else {
        clearInjectedPlannerReport();
      }
      return;
    }
    if (event.data?.type === "quote-generator:ensure-edit-mode") {
      ensureEditModeActive(0);
    }
  });

  window.__applyQuoteGeneratorPrefill = (payload) => {
    scheduleRequestPayload(payload);
  };

  window.__prepareQuoteGeneratorPdfBranding = async () => {
    await preparePdfBrandingForExport();
  };

  window.__decorateQuoteGeneratorPdfBranding = async (pdf, sourceElement) => {
    await decoratePdfWithBranding(pdf, sourceElement);
  };

  window.addEventListener("load", () => {
    installPdfDownloadInterceptor();
    startCustomAccessoryPriceBridge();
    ensureEmbeddedLayoutStyles();
    const payload = readPrefillFromUrl() || readPrefillFromStorage();
    if (payload) {
      scheduleRequestPayload(payload);
    }
    {
      const brandingPayload = readBrandingFromStorage();
      if (brandingPayload) {
        applyBrandingPayloadNow(brandingPayload);
      }
    }
    if (ENABLE_PLANNER_REPORT_EXPORT) {
      const plannerReportPayload = readPlannerReportFromStorage();
      if (plannerReportPayload) {
        applyPlannerReportPayloadNow(plannerReportPayload);
      }
    } else {
      clearInjectedPlannerReport();
    }
    requestBridgeSyncBurst(4);
    window.setTimeout(() => {
      ensureEditModeActive(0);
    }, 120);
    reportEmbeddedContentHeight();
  }, { once: true });

  window.addEventListener("resize", () => {
    reportEmbeddedContentHeight();
  });

  // ── API pubblica per app.js (stesso dominio, accesso diretto a contentWindow) ──
  // Restituisce accessori (Z), servizi extra (ke) e testo materiali (Te) correnti.
  // Usato da extractGeneratorPayloadFromIframe() per popolare il preventivo-v2.html.
  window.__codexGetGeneratorState = function () {
    try {
      // Z — accessori/prodotti extra: walk del fiber tree, robusto a cambi di indice
      const accessories = getAccessoriesState();

      // hooks[30] = ke (servizi/lavori extra), hooks[27] = Te (testo materiali calcolato)
      const hooks = findGeneratorHooks();
      const keRaw = Array.isArray(hooks?.[30]?.memoizedState) ? hooks[30].memoizedState : [];
      const extraServices = keRaw.filter((e) => String(e?.description || "").trim());
      const materialsText = String(hooks?.[27]?.memoizedState || "");

      return { accessories, extraServices, materialsText };
    } catch (_) {
      return { accessories: [], extraServices: [], materialsText: "" };
    }
  };
})();
