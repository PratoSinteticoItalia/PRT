(function shellApp() {
  const REQUIRED_ALIAS_MAP = {
    nome: ["nome", "name", "nominativo"],
    cognome: ["cognome", "surname"],
    citta: ["citta", "città", "city"],
    telefono: ["telefono", "telefono cliente", "phone", "tel"],
    email: ["email", "e-mail"],
    mq: ["mq", "met", "metriq", "metri q", "metri quadri", "metriquadrati", "metri quadri richiesti"],
    servizio: ["servizio", "tipologia servizio", "tipo servizio", "fornitura posa", "richiesta servizio"],
    fondo: ["fondo", "superficie", "tipo fondo", "fondo posa", "supporto"],
  };
  const EDITABLE_ALIAS_MAP = {
    assignment: ["assegnazione", "assegnato a", "assegnato", "assegnazione preventivo"],
    status: ["stato", "status", "stato preventivo"],
  };
  const PREFILL_STORAGE_KEY = "quote-generator-prefill";

  const state = {
    config: null,
    pendingServiceAccountJson: "",
    pendingServiceAccountEmail: "",
    rows: [],
    headers: [],
    selectedRowNumber: null,
    draftValues: [],
    search: "",
    dirty: false,
    loadingRows: false,
    activeView: "requests",
    generatorReady: false,
    pendingPrefill: null,
    prefillRunId: 0,
    lastLoadedAt: null,
    lastRowsSignature: "",
    editableColumns: {
      assignment: null,
      status: null,
    },
  };

  const elements = {};

  function normalizeKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function formatMq(value) {
    const amount = parseMq(value);
    if (!amount) return "—";
    return amount.toLocaleString("it-IT", {
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 1,
      maximumFractionDigits: 1,
    });
  }

  function parseMq(value) {
    if (typeof value === "number") return value;
    const match = String(value ?? "").replace(",", ".").match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function getRowByNumber(rowNumber) {
    return state.rows.find((row) => row.rowNumber === rowNumber) || null;
  }

  function getCurrentRowValues() {
    const selectedRow = getRowByNumber(state.selectedRowNumber);
    if (!selectedRow) return null;
    return state.dirty ? state.draftValues : selectedRow.values;
  }

  function getCellValue(values, aliases) {
    const normalizedAliases = aliases.map(normalizeKey);
    const index = state.headers.findIndex((header) => normalizedAliases.includes(normalizeKey(header)));
    return index >= 0 ? String(values[index] ?? "") : "";
  }

  function findEditableColumn(aliases) {
    const normalizedAliases = aliases.map(normalizeKey);
    const index = state.headers.findIndex((header) => normalizedAliases.includes(normalizeKey(header)));
    if (index < 0) return null;
    return {
      index,
      header: state.headers[index],
    };
  }

  function getEditableColumns() {
    const fromPayload = state.editableColumns || {};
    return {
      assignment: fromPayload.assignment?.header
        ? fromPayload.assignment
        : findEditableColumn(EDITABLE_ALIAS_MAP.assignment),
      status: fromPayload.status?.header
        ? fromPayload.status
        : findEditableColumn(EDITABLE_ALIAS_MAP.status),
    };
  }

  function extractRequestData(values) {
    return {
      nome: getCellValue(values, REQUIRED_ALIAS_MAP.nome),
      cognome: getCellValue(values, REQUIRED_ALIAS_MAP.cognome),
      citta: getCellValue(values, REQUIRED_ALIAS_MAP.citta),
      telefono: getCellValue(values, REQUIRED_ALIAS_MAP.telefono),
      email: getCellValue(values, REQUIRED_ALIAS_MAP.email),
      mq: parseMq(getCellValue(values, REQUIRED_ALIAS_MAP.mq)),
      servizio: getCellValue(values, REQUIRED_ALIAS_MAP.servizio),
      fondo: getCellValue(values, REQUIRED_ALIAS_MAP.fondo),
      assignment: getCellValue(values, EDITABLE_ALIAS_MAP.assignment),
      status: getCellValue(values, EDITABLE_ALIAS_MAP.status),
    };
  }

  function getDistinctColumnValues(columnIndex) {
    if (typeof columnIndex !== "number" || columnIndex < 0) return [];

    const seen = new Set();
    const output = [];
    state.rows.forEach((row) => {
      const value = String(row?.values?.[columnIndex] ?? "").trim();
      if (!value) return;
      const key = normalizeKey(value);
      if (seen.has(key)) return;
      seen.add(key);
      output.push(value);
    });

    return output;
  }

  function getDisplayName(values) {
    const data = extractRequestData(values);
    const joined = [data.nome, data.cognome].filter(Boolean).join(" ").trim();
    return joined || "Richiesta senza nome";
  }

  function getFilteredRows() {
    const query = normalizeKey(state.search);
    if (!query) return state.rows;
    return state.rows.filter((row) => row.values.some((value) => normalizeKey(value).includes(query)));
  }

  function buildRowsSignature(headers, rows, selectedRowNumber) {
    const selectedRow = rows.find((row) => row.rowNumber === selectedRowNumber) || null;
    const sampleRows = rows.slice(0, 3).map((row) => `${row.rowNumber}:${row.values.join("|")}`);
    const selectedSignature = selectedRow ? `${selectedRow.rowNumber}:${selectedRow.values.join("|")}` : "";
    return [
      headers.join("|"),
      rows.length,
      sampleRows.join("||"),
      selectedSignature,
    ].join("###");
  }

  function buildGeneratorFrameUrl(prefillPayload) {
    const url = new URL("./generator.html", window.location.href);
    url.searchParams.set("embedded", "1");
    if (prefillPayload) {
      url.searchParams.set("prefill", JSON.stringify(prefillPayload));
      url.searchParams.set("prefillRun", String(Date.now()));
    }
    return url.toString();
  }

  function persistPrefillForGenerator(data) {
    try {
      window.localStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify({
        runId: Date.now(),
        payload: data,
      }));
    } catch (error) {
      console.warn("Persistenza prefill non riuscita:", error);
    }
  }

  function setMessage(message, type = "neutral") {
    elements.requestsMessage.textContent = message;
    elements.requestsMessage.classList.toggle("is-danger", type === "danger");
  }

  function updateConnectionCard() {
    const isReady = Boolean(state.config?.hasServiceAccount && state.config?.spreadsheetInput);
    elements.connectionStatus.textContent = isReady ? "Collegato" : "Da configurare";
    elements.connectionCopy.textContent = isReady
      ? `Service account ${state.config.serviceAccountEmail || "attivo"} collegato allo spreadsheet corrente.`
      : "Importa le credenziali del service account per leggere e modificare lo spreadsheet reale.";

    elements.connectionStatus.style.background = isReady ? "rgba(187, 247, 208, 0.15)" : "rgba(254, 226, 226, 0.15)";
    elements.connectionStatus.style.color = isReady ? "#dcfce7" : "#fecaca";
  }

  function updateConfigSummary() {
    const pendingEmail = state.pendingServiceAccountEmail || "";
    const savedEmail = state.config?.serviceAccountEmail || "";
    const effectiveEmail = pendingEmail || savedEmail;
    const summary = effectiveEmail
      ? `Service account pronto: ${effectiveEmail}${pendingEmail ? " (da salvare)" : ""}.`
      : "Nessuna credenziale caricata.";

    elements.serviceAccountSummary.textContent = summary;
    elements.serviceAccountSummary.classList.toggle("is-ready", Boolean(effectiveEmail));
  }

  function updateViewChrome() {
    const isRequestsView = state.activeView === "requests";
    elements.navRequests.classList.toggle("is-active", isRequestsView);
    elements.navGenerator.classList.toggle("is-active", !isRequestsView);
    elements.requestsView.classList.toggle("is-hidden", !isRequestsView);
    elements.generatorView.classList.toggle("is-hidden", isRequestsView);
    elements.viewTitle.textContent = isRequestsView ? "Richieste" : "Generatore";
    elements.viewSubtitle.textContent = isRequestsView
      ? "Leggi, assegna e aggiorna le richieste arrivate dal form web."
      : "Precompila il preventivo dalla richiesta selezionata e genera il PDF.";
    elements.viewEyebrow.textContent = isRequestsView ? "Dashboard" : "Preventivatore";
    elements.refreshNote.textContent = state.lastLoadedAt
      ? `Ultimo sync ${state.lastLoadedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
      : "Aggiornamento manuale";
  }

  function selectRow(rowNumber, force = false) {
    if (!force && state.dirty && state.selectedRowNumber !== rowNumber) {
      const proceed = window.confirm("Hai modifiche non salvate sulla riga corrente. Vuoi scartarle e cambiare selezione?");
      if (!proceed) return;
    }

    const selectedRow = getRowByNumber(rowNumber);
    if (!selectedRow) return;

    state.selectedRowNumber = rowNumber;
    state.draftValues = [...selectedRow.values];
    state.dirty = false;
    renderRequestsTable();
    renderDetailPanel();
    if (elements.detailFields) elements.detailFields.scrollTop = 0;
    if (window.innerWidth <= 1200 && elements.detailPanel) {
      elements.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderRequestsTable() {
    const filteredRows = getFilteredRows();
    elements.requestsCount.textContent = `${filteredRows.length} richieste`;
    elements.requestsBody.innerHTML = "";

    if (!state.rows.length && !state.loadingRows) {
      setMessage("Nessuna riga utile trovata nel foglio.");
    } else if (!filteredRows.length && state.search) {
      setMessage("Nessuna richiesta corrisponde alla ricerca corrente.");
    } else if (!state.loadingRows) {
      setMessage("Seleziona una riga per modificarla o usarla nel generatore.");
    }

    filteredRows.forEach((row) => {
      const request = extractRequestData(row.values);
      const rowElement = document.createElement("tr");
      rowElement.classList.toggle("is-selected", row.rowNumber === state.selectedRowNumber);
      rowElement.addEventListener("click", () => selectRow(row.rowNumber));

      const requestName = getDisplayName(row.values);
      const assignmentValue = request.assignment || "Non assegnata";
      const assignmentClass = request.assignment ? "assignment-badge" : "assignment-badge is-empty";
      const statusValue = request.status || "Senza stato";
      const statusClass = request.status ? "status-badge" : "status-badge is-empty";
      rowElement.innerHTML = `
        <td>${row.rowNumber}</td>
        <td>
          <div class="row-title">${escapeHtml(requestName)}</div>
          <div class="row-subtitle">${escapeHtml(request.email || "Nessuna email")}</div>
        </td>
        <td>${escapeHtml(request.citta || "—")}</td>
        <td><span class="${assignmentClass}">${escapeHtml(assignmentValue)}</span></td>
        <td><span class="${statusClass}">${escapeHtml(statusValue)}</span></td>
        <td>${escapeHtml(formatMq(request.mq))}</td>
        <td>${escapeHtml(request.telefono || "—")}</td>
        <td><button class="inline-button" type="button">Preventivo</button></td>
      `;

      rowElement.querySelector("button").addEventListener("click", (event) => {
        event.stopPropagation();
        selectRow(row.rowNumber);
        useCurrentRowInGenerator();
      });

      elements.requestsBody.appendChild(rowElement);
    });
  }

  function renderDetailPanel() {
    const selectedRow = getRowByNumber(state.selectedRowNumber);
    const values = getCurrentRowValues();
    elements.detailFields.innerHTML = "";

    if (!selectedRow || !values) {
      elements.detailTitle.textContent = "Nessuna richiesta selezionata";
      elements.detailMeta.textContent = "Seleziona una riga per modificare solo assegnazione e stato.";
      elements.saveRowButton.disabled = true;
      elements.resetRowButton.disabled = true;
      elements.useInGeneratorButton.disabled = true;
      return;
    }

    const editableColumns = getEditableColumns();
    const editableFieldEntries = [
      { key: "assignment", label: "Assegnazione", meta: editableColumns.assignment },
      { key: "status", label: "Stato", meta: editableColumns.status },
    ];

    elements.detailTitle.textContent = getDisplayName(values);
    elements.useInGeneratorButton.disabled = false;
    const editableCount = editableFieldEntries.filter((entry) => entry.meta).length;

    if (!editableCount) {
      elements.detailMeta.textContent = "Non trovo nel foglio colonne chiamate assegnazione o stato. Le formule restano protette, ma prima dobbiamo collegare i nomi corretti di quelle due colonne.";
      elements.saveRowButton.disabled = true;
      elements.resetRowButton.disabled = true;
    } else {
      const mappedLabels = editableFieldEntries
        .filter((entry) => entry.meta)
        .map((entry) => `${entry.label} -> ${entry.meta.header}`)
        .join(" · ");
      elements.detailMeta.textContent = `Riga Google Sheets ${selectedRow.rowNumber} · modificabili solo campi operativi (${mappedLabels})${state.dirty ? " · modifiche non salvate" : ""}`;
      elements.saveRowButton.disabled = !state.dirty;
      elements.resetRowButton.disabled = !state.dirty;
    }

    const request = extractRequestData(values);
    [
      { label: "Richiesta", value: getDisplayName(values) },
      { label: "Città", value: request.citta || "—" },
      { label: "Telefono", value: request.telefono || "—" },
      { label: "MQ", value: formatMq(request.mq) },
      { label: "Email", value: request.email || "—" },
      { label: "Servizio", value: request.servizio || "—" },
      { label: "Fondo", value: request.fondo || "—" },
    ].forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "detail-row";
      const label = document.createElement("span");
      label.className = "detail-label";
      label.textContent = item.label;
      const field = document.createElement("div");
      field.className = "detail-meta";
      field.textContent = item.value;
      wrapper.appendChild(label);
      wrapper.appendChild(field);
      elements.detailFields.appendChild(wrapper);
    });

    editableFieldEntries.forEach((entry) => {
      if (!entry.meta) return;
      const wrapper = document.createElement("label");
      wrapper.className = "detail-row";
      const handleDraftChange = (nextValue) => {
        state.draftValues[entry.meta.index] = nextValue;
        state.dirty = true;
        elements.detailMeta.textContent = `Riga Google Sheets ${selectedRow.rowNumber} · modifiche non salvate`;
        elements.saveRowButton.disabled = false;
        elements.resetRowButton.disabled = false;
      };

      let field;
      if (entry.key === "status" || entry.key === "assignment") {
        field = document.createElement("select");
        field.className = "detail-input";

        const options = getDistinctColumnValues(entry.meta.index);
        const currentValue = String(values[entry.meta.index] ?? "").trim();
        if (currentValue && !options.some((option) => normalizeKey(option) === normalizeKey(currentValue))) {
          options.unshift(currentValue);
        }

        const placeholder = entry.key === "status" ? "Seleziona stato" : "Seleziona assegnazione";
        [{ value: "", label: placeholder }, ...options.map((option) => ({ value: option, label: option }))].forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          field.appendChild(optionElement);
        });

        field.value = currentValue;
        field.addEventListener("change", (event) => {
          handleDraftChange(event.target.value);
        });
      } else {
        field = document.createElement("input");
        field.className = "detail-input";
        field.value = values[entry.meta.index] ?? "";
        field.addEventListener("input", (event) => {
          handleDraftChange(event.target.value);
        });
      }

      const label = document.createElement("span");
      label.className = "detail-label";
      label.textContent = `${entry.label} · colonna ${entry.meta.header}`;
      wrapper.appendChild(label);
      wrapper.appendChild(field);
      elements.detailFields.appendChild(wrapper);
    });
  }

  async function loadRows({ preserveSelection = true, silent = false } = {}) {
    if (!window.desktopApp?.googleSheets) {
      setMessage("Bridge desktop non disponibile.", "danger");
      return;
    }

    state.loadingRows = true;
    if (!silent) elements.requestsView.classList.add("is-loading");
    if (!silent) setMessage("Caricamento richieste dal foglio...");

    try {
      const payload = await window.desktopApp.googleSheets.loadRows();
      const nextHeaders = Array.isArray(payload.headers) ? payload.headers : [];
      const nextRows = Array.isArray(payload.rows) ? payload.rows : [];
      const nextSignature = buildRowsSignature(nextHeaders, nextRows, state.selectedRowNumber);
      const shouldSkipRender = Boolean(silent && state.lastRowsSignature && nextSignature === state.lastRowsSignature);

      state.headers = nextHeaders;
      state.rows = nextRows;
      state.editableColumns = payload?.editableColumns || {
        assignment: null,
        status: null,
      };
      state.lastLoadedAt = new Date();
      state.lastRowsSignature = nextSignature;

      if (payload.editUrl) {
        state.config = { ...(state.config || {}), editUrl: payload.editUrl };
      }

      if (preserveSelection && state.selectedRowNumber && getRowByNumber(state.selectedRowNumber)) {
        const refreshedRow = getRowByNumber(state.selectedRowNumber);
        if (refreshedRow && !state.dirty) state.draftValues = [...refreshedRow.values];
      } else if (state.rows.length) {
        const firstRow = state.rows[0];
        state.selectedRowNumber = firstRow.rowNumber;
        state.draftValues = [...firstRow.values];
        state.dirty = false;
      } else {
        state.selectedRowNumber = null;
        state.draftValues = [];
        state.dirty = false;
      }

      if (!shouldSkipRender) {
        renderRequestsTable();
        renderDetailPanel();
      }
      updateViewChrome();
    } catch (error) {
      console.error("Errore caricamento richieste:", error);
      state.rows = [];
      state.headers = [];
      state.editableColumns = {
        assignment: null,
        status: null,
      };
      state.selectedRowNumber = null;
      state.draftValues = [];
      renderRequestsTable();
      renderDetailPanel();
      setMessage(error.message || "Non sono riuscito a leggere lo spreadsheet.", "danger");
    } finally {
      state.loadingRows = false;
      if (!silent) elements.requestsView.classList.remove("is-loading");
    }
  }

  async function saveRow() {
    const selectedRow = getRowByNumber(state.selectedRowNumber);
    if (!selectedRow || !state.dirty) return;
    const editableColumns = getEditableColumns();
    const updates = {};

    if (editableColumns.assignment) {
      updates.assignment = state.draftValues[editableColumns.assignment.index] ?? "";
    }
    if (editableColumns.status) {
      updates.status = state.draftValues[editableColumns.status.index] ?? "";
    }

    if (!Object.keys(updates).length) {
      setMessage("Non ho trovato colonne modificabili per assegnazione o stato.", "danger");
      return;
    }

    elements.saveRowButton.disabled = true;
    try {
      const payload = await window.desktopApp.googleSheets.updateRow({
        rowNumber: selectedRow.rowNumber,
        updates,
      });

      state.headers = Array.isArray(payload.headers) ? payload.headers : state.headers;
      state.rows = Array.isArray(payload.rows) ? payload.rows : state.rows;
      state.editableColumns = payload?.editableColumns || state.editableColumns;
      state.lastLoadedAt = new Date();
      state.dirty = false;

      const updatedRow = getRowByNumber(selectedRow.rowNumber);
      if (updatedRow) {
        state.selectedRowNumber = updatedRow.rowNumber;
        state.draftValues = [...updatedRow.values];
      }

      renderRequestsTable();
      renderDetailPanel();
      updateViewChrome();
      setMessage("Assegnazione e stato aggiornati sullo spreadsheet reale. Le colonne formula non sono state toccate.");
    } catch (error) {
      console.error("Errore salvataggio riga:", error);
      setMessage(error.message === "missing_editable_columns"
        ? "Non ho trovato nel foglio colonne compatibili con assegnazione o stato."
        : error.message || "Non sono riuscito a salvare i campi operativi sul foglio.", "danger");
      elements.saveRowButton.disabled = false;
    }
  }

  async function saveConfig() {
    const payload = {
      spreadsheetInput: elements.spreadsheetInput.value.trim(),
      sheetName: elements.sheetNameInput.value.trim(),
      serviceAccountJson: state.pendingServiceAccountJson,
    };

    try {
      state.config = await window.desktopApp.googleSheets.saveConfig(payload);
      state.pendingServiceAccountJson = "";
      state.pendingServiceAccountEmail = "";
      updateConnectionCard();
      updateConfigSummary();
      setMessage("Collegamento Google Sheets salvato.");
      await loadRows({ preserveSelection: false });
    } catch (error) {
      console.error("Errore salvataggio configurazione:", error);
      setMessage(error.message || "Non sono riuscito a salvare la configurazione.", "danger");
    }
  }

  async function importServiceAccountFile() {
    try {
      const result = await window.desktopApp.googleSheets.pickServiceAccountFile();
      if (!result || result.canceled) return;
      state.pendingServiceAccountJson = String(result.content || "");
      state.pendingServiceAccountEmail = String(result.serviceAccountEmail || "");
      updateConfigSummary();
      setMessage(state.pendingServiceAccountEmail
        ? `Credenziali caricate per ${state.pendingServiceAccountEmail}. Ora puoi salvarle.`
        : "File JSON importato. Ora puoi salvare la configurazione.");
    } catch (error) {
      console.error("Errore import credenziali:", error);
      setMessage(error.message || "Non sono riuscito a importare il file JSON.", "danger");
    }
  }

  async function clearCredentials() {
    const confirmed = window.confirm("Vuoi rimuovere le credenziali del service account salvate in questa app?");
    if (!confirmed) return;

    try {
      state.config = await window.desktopApp.googleSheets.saveConfig({
        spreadsheetInput: elements.spreadsheetInput.value.trim(),
        sheetName: elements.sheetNameInput.value.trim(),
        clearServiceAccount: true,
      });
      state.pendingServiceAccountJson = "";
      state.pendingServiceAccountEmail = "";
      updateConnectionCard();
      updateConfigSummary();
      setMessage("Credenziali rimosse. Il foglio non è più modificabile finché non ne importi di nuove.");
    } catch (error) {
      console.error("Errore rimozione credenziali:", error);
      setMessage(error.message || "Non sono riuscito a rimuovere le credenziali.", "danger");
    }
  }

  function switchView(nextView) {
    state.activeView = nextView;
    updateViewChrome();
  }

  function focusSearchField() {
    if (state.activeView !== "requests" || !elements.searchInput) return;
    elements.searchInput.focus();
    elements.searchInput.select();
  }

  function postPrefillToGenerator(data) {
    persistPrefillForGenerator(data);
    const iframeWindow = elements.generatorFrame.contentWindow;
    if (!iframeWindow) {
      state.pendingPrefill = data;
      return false;
    }

    let delivered = false;
    try {
      if (typeof iframeWindow.__applyQuoteGeneratorPrefill === "function") {
        iframeWindow.__applyQuoteGeneratorPrefill(data);
        delivered = true;
      }
    } catch (error) {
      console.warn("Prefill diretto non riuscito:", error);
    }

    try {
      iframeWindow.postMessage({ type: "quote-generator:prefill-request", payload: data }, "*");
      delivered = true;
    } catch (error) {
      console.warn("PostMessage prefill non riuscito:", error);
    }

    return delivered;
  }

  function flushPendingPrefill() {
    if (!state.pendingPrefill || !state.generatorReady) return;
    const payload = state.pendingPrefill;
    const runId = ++state.prefillRunId;
    const delays = [0, 120, 320, 700, 1200];

    delays.forEach((delay, index) => {
      window.setTimeout(() => {
        if (runId !== state.prefillRunId) return;
        postPrefillToGenerator(payload);
        if (index === delays.length - 1 && runId === state.prefillRunId) {
          state.pendingPrefill = null;
        }
      }, delay);
    });
  }

  function useCurrentRowInGenerator() {
    const values = getCurrentRowValues();
    if (!values) return;

    const requestData = extractRequestData(values);
    persistPrefillForGenerator(requestData);
    state.pendingPrefill = requestData;
    state.generatorReady = false;
    const summaryBits = [
      requestData.mq ? `${formatMq(requestData.mq)} mq` : "",
      requestData.servizio || "",
      requestData.fondo || "",
    ].filter(Boolean);
    state.generatorCopy.textContent = `Precompilazione attiva: ${getDisplayName(values)}${summaryBits.length ? ` · ${summaryBits.join(" · ")}` : ""}`;
    elements.generatorFrame.src = buildGeneratorFrameUrl(requestData);
    switchView("generator");
  }

  function resetDraft() {
    const selectedRow = getRowByNumber(state.selectedRowNumber);
    if (!selectedRow) return;
    state.draftValues = [...selectedRow.values];
    state.dirty = false;
    renderDetailPanel();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function openSheetInBrowser() {
    const target = state.config?.editUrl || "";
    if (!target) {
      setMessage("Salva prima uno spreadsheet valido per aprirlo nel browser.", "danger");
      return;
    }
    try {
      await window.desktopApp.openExternal(target);
    } catch (error) {
      console.error("Errore apertura browser:", error);
      setMessage(error.message || "Non sono riuscito ad aprire il foglio nel browser.", "danger");
    }
  }

  function bindElements() {
    elements.navRequests = document.getElementById("nav-requests");
    elements.navGenerator = document.getElementById("nav-generator");
    elements.requestsView = document.getElementById("requests-view");
    elements.generatorView = document.getElementById("generator-view");
    elements.viewEyebrow = document.getElementById("view-eyebrow");
    elements.viewTitle = document.getElementById("view-title");
    elements.viewSubtitle = document.getElementById("view-subtitle");
    elements.refreshNote = document.getElementById("refresh-note");
    elements.connectionStatus = document.getElementById("connection-status");
    elements.connectionCopy = document.getElementById("connection-copy");
    elements.openSheetButton = document.getElementById("open-sheet-button");
    elements.spreadsheetInput = document.getElementById("spreadsheet-input");
    elements.sheetNameInput = document.getElementById("sheet-name-input");
    elements.serviceAccountSummary = document.getElementById("service-account-summary");
    elements.importServiceAccountButton = document.getElementById("import-service-account-button");
    elements.clearServiceAccountButton = document.getElementById("clear-service-account-button");
    elements.saveConfigButton = document.getElementById("save-config-button");
    elements.refreshButton = document.getElementById("refresh-button");
    elements.searchInput = document.getElementById("search-input");
    elements.requestsCount = document.getElementById("requests-count");
    elements.requestsMessage = document.getElementById("requests-message");
    elements.requestsBody = document.getElementById("requests-body");
    elements.detailTitle = document.getElementById("detail-title");
    elements.detailMeta = document.getElementById("detail-meta");
    elements.detailFields = document.getElementById("detail-fields");
    elements.detailPanel = document.querySelector(".detail-panel");
    elements.resetRowButton = document.getElementById("reset-row-button");
    elements.saveRowButton = document.getElementById("save-row-button");
    elements.useInGeneratorButton = document.getElementById("use-in-generator-button");
    elements.generatorFrame = document.getElementById("generator-frame");
    elements.generatorCopy = document.getElementById("generator-copy");
  }

  function bindEvents() {
    elements.navRequests.addEventListener("click", () => switchView("requests"));
    elements.navGenerator.addEventListener("click", () => switchView("generator"));
    elements.refreshButton.addEventListener("click", () => loadRows());
    elements.saveConfigButton.addEventListener("click", saveConfig);
    elements.importServiceAccountButton.addEventListener("click", importServiceAccountFile);
    elements.clearServiceAccountButton.addEventListener("click", clearCredentials);
    elements.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderRequestsTable();
    });
    elements.saveRowButton.addEventListener("click", saveRow);
    elements.resetRowButton.addEventListener("click", resetDraft);
    elements.useInGeneratorButton.addEventListener("click", useCurrentRowInGenerator);
    elements.openSheetButton.addEventListener("click", openSheetInBrowser);
    elements.generatorFrame.addEventListener("load", () => {
      state.generatorReady = true;
      flushPendingPrefill();
    });

    window.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        focusSearchField();
      }
    });

    window.setInterval(() => {
      if (state.activeView !== "requests" || state.dirty || !state.config?.hasServiceAccount) return;
      loadRows({ preserveSelection: true, silent: true });
    }, 30000);
  }

  async function initialize() {
    bindElements();
    bindEvents();
    elements.generatorFrame.src = buildGeneratorFrameUrl();

    try {
      state.config = await window.desktopApp.googleSheets.getConfig();
    } catch (error) {
      console.error("Errore lettura configurazione:", error);
      state.config = {
        spreadsheetInput: "",
        sheetName: "",
        hasServiceAccount: false,
        serviceAccountEmail: "",
        editUrl: "",
      };
    }

    elements.spreadsheetInput.value = state.config.spreadsheetInput || "";
    elements.sheetNameInput.value = state.config.sheetName || "";
    updateConnectionCard();
    updateConfigSummary();
    updateViewChrome();
    renderRequestsTable();
    renderDetailPanel();

    if (state.config.hasServiceAccount) {
      await loadRows({ preserveSelection: false });
    } else {
      setMessage("Importa un service account e salva il collegamento per rendere il foglio modificabile da qui.");
    }
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
