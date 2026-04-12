(function generatorBridge() {
  const PREFILL_STORAGE_KEY = "quote-generator-prefill";
  let lastUrlPrefill = "";
  let lastStoragePrefill = "";
  let scheduledPrefillRunId = 0;

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
      servizio: normalizeServiceStateValue(payload?.servizio || payload?.service || payload?.tipologia || ""),
      fondo: normalizeSurfaceValue(payload?.fondo || payload?.superficie || payload?.surface || ""),
    });
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
    if (event.data?.type !== "quote-generator:prefill-request") return;
    scheduleRequestPayload(event.data.payload);
  });

  window.__applyQuoteGeneratorPrefill = (payload) => {
    scheduleRequestPayload(payload);
  };

  window.addEventListener("load", () => {
    startCustomAccessoryPriceBridge();
    const payload = readPrefillFromUrl() || readPrefillFromStorage();
    if (payload) {
      scheduleRequestPayload(payload);
    }
  }, { once: true });
})();
