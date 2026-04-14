(function generatorBridge() {
  const PREFILL_STORAGE_KEY = "quote-generator-prefill";
  const BRANDING_STORAGE_KEY = "quote-generator-branding";
  let lastUrlPrefill = "";
  let lastStoragePrefill = "";
  let scheduledPrefillRunId = 0;
  let lastBrandingStorage = "";
  let activeBrandingPayload = { crewName: "", crewLogoDataUrl: "" };
  let pdfDownloadInterceptionActive = false;
  const brandingLogoExportCache = new Map();

  function normalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
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

  function waitForAnimationFrame() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
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
    const match = labels.find((label) => normalizeLabel(label.textContent) === expected);
    if (!match) return null;
    return match.parentElement?.querySelector("input, textarea, select") || null;
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

  function matchesGeneratorHooks(hooks) {
    return hooks.length >= 16
      && ["edit", "pdf"].includes(String(hooks[0]?.memoizedState || ""))
      && ["cliente", "rivenditore"].includes(String(hooks[1]?.memoizedState || ""))
      && isCustomerState(hooks[2]?.memoizedState)
      && Array.isArray(hooks[4]?.memoizedState)
      && ["fornitura", "posa"].includes(String(hooks[10]?.memoizedState || ""))
      && (typeof hooks[12]?.memoizedState === "string" || typeof hooks[12]?.memoizedState === "number")
      && isDateLike(hooks[13]?.memoizedState)
      && isDateLike(hooks[14]?.memoizedState)
      && ["terra", "pavimentazione"].includes(String(hooks[15]?.memoizedState || ""));
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

  function applyReactStatePrefill(customerPayload, requestedMq, requestedServiceState, requestedSurface) {
    const hooks = findGeneratorHooks();
    if (!hooks) return false;

    let applied = false;

    if (isCustomerState(hooks[2]?.memoizedState)) {
      applied = dispatchHookAction(hooks[2], (previous) => ({
        ...(isCustomerState(previous) ? previous : {}),
        nome: customerPayload.nome || "",
        cognome: customerPayload.cognome || "",
        citta: customerPayload.citta || "",
        telefono: customerPayload.telefono || "",
        email: customerPayload.email || "",
      })) || applied;
    }

    if (requestedServiceState) {
      applied = dispatchHookAction(hooks[10], requestedServiceState) || applied;
    }

    if (requestedMq !== "") {
      applied = dispatchHookAction(hooks[12], String(requestedMq)) || applied;
    }

    if (requestedSurface) {
      applied = dispatchHookAction(hooks[15], requestedSurface) || applied;
    }

    return applied;
  }

  function applyRequestPayloadNow(payload) {
    if (!payload || typeof payload !== "object") return false;

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
      ["Altezza prato", requestedHeight],
      ["MM", requestedHeight],
    ].filter(([, value]) => value !== undefined && value !== null && String(value) !== "");

    assignments.forEach(([label, value]) => {
      const field = findFieldByLabel(label);
      if (!field) return;
      setNativeValue(field, String(value));
      applied = true;
    });

    if (requestedServiceLabel) {
      applied = applyButtonValue("Tipologia", requestedServiceLabel) || applied;
    }

    const surfaceField = findFieldByLabel("Superficie");
    if (requestedSurface && surfaceField) {
      setNativeValue(surfaceField, requestedSurface);
      applied = true;
    }

    return applied;
  }

  function scheduleRequestPayload(payload) {
    const signature = buildPayloadSignature(payload);
    if (!signature) return false;

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
        margin-left: 8px;
        padding: 4px;
        border: 1px solid rgba(47, 70, 49, 0.14);
        border-radius: 10px;
        background: linear-gradient(180deg, rgba(248,250,248,0.98), rgba(237,243,237,0.94));
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65);
      }

      .codex-crew-branding img {
        width: 42px;
        max-width: 42px;
        max-height: 42px;
        object-fit: contain;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  function findQuoteMetaLine() {
    const headerRow = document.querySelector(".pdf-root > div > .pdf-no-break");
    if (!(headerRow instanceof Element)) return null;

    const quoteBlock = Array.from(headerRow.children || []).find((child) => (
      child instanceof Element
      && normalizeLabel(child.textContent).includes("preventivo nr")
    ));
    if (!(quoteBlock instanceof Element)) return null;

    const lines = Array.from(quoteBlock.children || []).filter((child) => child instanceof Element);
    return lines.length ? lines[lines.length - 1] : null;
  }

  function applyBrandingCompanyMeta(payload) {
    const quoteMetaLine = findQuoteMetaLine();
    if (!quoteMetaLine) return false;

    if (!quoteMetaLine.dataset.codexOriginalText) {
      quoteMetaLine.dataset.codexOriginalText = quoteMetaLine.textContent || "";
    }

    if (!payload?.crewName) {
      quoteMetaLine.textContent = quoteMetaLine.dataset.codexOriginalText || quoteMetaLine.textContent || "";
      return false;
    }

    quoteMetaLine.textContent = `${payload.crewName} · Rivenditore autorizzato`;
    return true;
  }

  function applyBrandingPayloadNow(payload) {
    activeBrandingPayload = normalizeBrandingPayload(payload);
    ensureBrandingStyles();

    const pdfImages = Array.from(document.querySelectorAll(".pdf-root img"))
      .filter((img) => !img.closest(".codex-crew-branding"));
    const logoElement = pdfImages.find((img) => normalizeLabel(img.getAttribute("alt")) === "logo")
      || pdfImages[0];
    const host = logoElement?.parentElement;
    if (!host) return false;
    document.querySelectorAll(".pdf-root .codex-crew-branding").forEach((node) => {
      if (node.parentElement !== host) node.remove();
    });
    host.style.display = "flex";
    host.style.alignItems = "center";
    host.style.flexWrap = "wrap";
    host.style.columnGap = "12px";
    host.style.rowGap = "8px";

    const existing = host.querySelector(".codex-crew-branding");
    if (!activeBrandingPayload.crewLogoDataUrl) {
      existing?.remove();
      return false;
    }

    let brandingNode = existing;
    if (!brandingNode) {
      brandingNode = document.createElement("div");
      brandingNode.className = "codex-crew-branding";
      host.appendChild(brandingNode);
    }

    brandingNode.innerHTML = "";
    const logo = document.createElement("img");
    logo.src = activeBrandingPayload.crewLogoDataUrl;
    logo.alt = activeBrandingPayload.crewName
      ? `Logo squadra ${activeBrandingPayload.crewName}`
      : "Logo squadra";
    logo.decoding = "async";
    logo.loading = "eager";

    brandingNode.appendChild(logo);
    applyBrandingCompanyMeta(activeBrandingPayload);
    void applyExportReadyLogoToImage(logo, activeBrandingPayload.crewLogoDataUrl);
    return true;
  }

  async function preparePdfBrandingForExport() {
    if (!activeBrandingPayload.crewLogoDataUrl) return;
    applyBrandingPayloadNow(activeBrandingPayload);
    const brandingImage = document.querySelector(".pdf-root .codex-crew-branding img");
    if (!brandingImage) return;
    await applyExportReadyLogoToImage(brandingImage, activeBrandingPayload.crewLogoDataUrl);
    await waitForAnimationFrame();
    await waitForAnimationFrame();
  }

  async function decoratePdfWithBranding(pdf) {
    if (!pdf || !activeBrandingPayload.crewLogoDataUrl) return false;

    const exportReadySrc = await getExportReadyBrandingLogoDataUrl(activeBrandingPayload.crewLogoDataUrl);
    if (!exportReadySrc) return false;

    let logoImage = null;
    try {
      logoImage = await loadImageFromSource(exportReadySrc);
    } catch (error) {
      console.warn("Logo squadra non caricato per decorazione PDF:", error);
      return false;
    }

    const imageWidth = Math.max(1, Number(logoImage?.naturalWidth || logoImage?.width || 1));
    const imageHeight = Math.max(1, Number(logoImage?.naturalHeight || logoImage?.height || 1));
    const maxWidth = 14;
    const maxHeight = 14;
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
    const width = Math.max(8, Number((imageWidth * scale).toFixed(2)));
    const height = Math.max(8, Number((imageHeight * scale).toFixed(2)));
    const x = 91;
    const y = 14.5;

    try {
      pdf.setPage(1);
      if (typeof pdf.setFillColor === "function" && typeof pdf.roundedRect === "function") {
        pdf.setFillColor(248, 250, 248);
        pdf.setDrawColor(214, 224, 214);
        pdf.roundedRect(x - 1.8, y - 1.4, width + 3.6, height + 2.8, 2, 2, "FD");
      }
      pdf.addImage(exportReadySrc, "PNG", x, y, width, height, undefined, "FAST");
      if (activeBrandingPayload.crewName && typeof pdf.rect === "function" && typeof pdf.text === "function") {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(138, 18.5, 40, 5.8, "F");
        pdf.setTextColor(86, 121, 88);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5.2);
        pdf.text(
          `${activeBrandingPayload.crewName} · Rivenditore autorizzato`,
          158,
          22.1,
          { align: "center", maxWidth: 40 },
        );
      }
      return true;
    } catch (error) {
      console.warn("Decorazione branding PDF fallita:", error);
      return false;
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
      if (!activeBrandingPayload.crewLogoDataUrl) return;
      if (pdfDownloadInterceptionActive) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      pdfDownloadInterceptionActive = true;

      Promise.resolve()
        .then(() => preparePdfBrandingForExport())
        .catch((error) => {
          console.warn("Preparazione branding PDF fallita:", error);
        })
        .finally(() => {
          pdfDownloadInterceptionActive = false;
          button.dataset.codexPdfBypass = "1";
          button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
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
    let syncScheduled = false;

    const scheduleSync = () => {
      if (syncScheduled) return;
      syncScheduled = true;
      window.requestAnimationFrame(() => {
        syncScheduled = false;
        hideInternalImportPanel();
        syncCustomAccessoryPriceEditors();
        const payload = readPrefillFromStorage() || readPrefillFromUrl();
        if (payload) scheduleRequestPayload(payload);
        const brandingPayload = readBrandingFromStorage();
        if (brandingPayload) {
          applyBrandingPayloadNow(brandingPayload);
        } else if (activeBrandingPayload.crewLogoDataUrl) {
          applyBrandingPayloadNow(activeBrandingPayload);
        }
      });
    };

    const observer = new MutationObserver(() => {
      scheduleSync();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    window.setInterval(scheduleSync, 1200);
    scheduleSync();
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type === "quote-generator:prefill-request") {
      scheduleRequestPayload(event.data.payload);
      return;
    }
    if (event.data?.type === "quote-generator:branding") {
      applyBrandingPayloadNow(event.data.payload);
    }
  });

  window.__applyQuoteGeneratorPrefill = (payload) => {
    scheduleRequestPayload(payload);
  };

  window.__prepareQuoteGeneratorPdfBranding = async () => {
    await preparePdfBrandingForExport();
  };

  window.__decorateQuoteGeneratorPdfBranding = async (pdf) => {
    await decoratePdfWithBranding(pdf);
  };

  window.addEventListener("load", () => {
    installPdfDownloadInterceptor();
    startCustomAccessoryPriceBridge();
    const payload = readPrefillFromUrl() || readPrefillFromStorage();
    if (payload) {
      scheduleRequestPayload(payload);
    }
    const brandingPayload = readBrandingFromStorage();
    if (brandingPayload) {
      applyBrandingPayloadNow(brandingPayload);
    }
  }, { once: true });
})();
