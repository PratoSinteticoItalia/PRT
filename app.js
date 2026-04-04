const crews = ["Alpha", "Beta", "Delta"];
const installSteps = ["order", "confirm", "material", "crew", "install", "close"];
const roleViews = {
  office: ["dashboard", "orders", "calendar", "job", "warehouse", "crew", "accounting", "settings"],
  warehouse: ["orders", "job", "warehouse"],
  crew: ["calendar", "job", "crew"],
};

const translations = {
  it: {
    brandEyebrow: "Vertex Ops",
    brandTitle: "Gestione Pose",
    authSubtitle: "Accedi al pannello operativo per ufficio, magazzino e squadre.",
    demoAccess: "Accessi demo",
    authEmail: "Email",
    authPassword: "Password",
    authLogin: "Accedi",
    authError: "Credenziali non valide. Usa un account demo o configura poi quelle reali.",
    loggedAs: "Utente attivo",
    logout: "Esci",
    navDashboard: "Dashboard Ufficio",
    navOrders: "Ordini Shopify",
    navCalendar: "Calendario Pose",
    navJob: "Scheda Commessa",
    navWarehouse: "Vista Magazzino",
    navCrew: "Vista Squadra",
    navAccounting: "Contabilità",
    navSettings: "Impostazioni",
    sidebarFocus: "Focus operativo",
    sidebarFlowTitle: "Un solo flusso",
    sidebarFlowText: "Ogni commessa vive in un unico sistema e aggiorna ufficio, magazzino e squadra senza doppio lavoro.",
    topbarEyebrow: "MVP operativo web",
    newJob: "Nuova commessa",
    seedData: "Ricarica dati",
    opsOfficeLabel: "Ufficio",
    opsOfficeText: "Commesse da completare e assegnare.",
    opsWarehouseLabel: "Magazzino",
    opsWarehouseText: "Ordini da preparare o sbloccare.",
    opsCrewLabel: "Squadre",
    opsCrewText: "Pose confermate e lavori in corso.",
    controlRoom: "Cabina di regia",
    jobsToHandle: "Commesse da gestire",
    refresh: "Aggiorna",
    searchPlaceholder: "Cerca cliente, città, squadra o materiale",
    filterAll: "Tutti",
    filterUrgent: "Urgenti",
    filterMissing: "Manca materiale",
    filterPreparing: "In preparazione",
    priorityNowEyebrow: "Priorità automatica",
    priorityNowTitle: "Le tue 3 azioni adesso",
    priorityNowHint: "Il sistema ordina le prossime azioni in base a blocchi, materiale e pianificazione.",
    quickAlerts: "Alert rapidi",
    today: "Oggi",
    instantActions: "Azioni immediate",
    fastLane: "Fast lane",
    activeWeek: "Settimana attiva",
    installationCalendar: "Calendario pose",
    allTeams: "Tutte le squadre",
    calendarHint: "Vista rapida per saturazione squadre e materiali mancanti",
    fullSheet: "Scheda completa",
    opsNotes: "Note operative",
    preparation: "Preparazione",
    plannedMaterials: "Materiali previsti",
    operations: "Operatività",
    warehouseOrders: "Ordini magazzino",
    warehouseHint: "Filtra per stato, priorità o data posa",
    mobileFirst: "Mobile first",
    crewView: "Vista squadra",
    crewHint: "Azioni rapide per lavoro completato, problema o foto di cantiere",
    accountingEyebrow: "Controllo economico",
    accountingPending: "Saldo aperto",
    accountingInvoiceNeeded: "Da fatturare",
    accountingChecklistTitle: "Checklist amministrativa",
    accountingChecklistLead: "Ogni ordine raccoglie metodo di pagamento, acconti, saldo e stato fattura.",
    accountingChecklistText: "Così l'ufficio vede subito cosa è stato incassato, cosa manca e cosa deve ancora essere fatturato.",
    accountingDeposit: "Acconto",
    accountingBalance: "Saldo",
    accountingInvoiceRequired: "Fattura richiesta",
    accountingInvoiceIssued: "Fattura emessa",
    accountingPaymentMethod: "Metodo pagamento",
    accountingSave: "Salva contabilità",
    accountingOpen: "Apri ordine",
    accountingShopifySettled: "Incasso già registrato da Shopify",
    accountingManualPending: "Contabilità interna da completare",
    accountingFromShopify: "Metodo importato da Shopify",
    accountingPaidLabel: "Pagato",
    accountingFulfilledLabel: "Evaso",
    accountingPendingLabel: "In attesa",
    accountingUnfulfilledLabel: "Da evadere",
    accountingPartialLabel: "Parziale",
    crewToday: "Oggi in cantiere",
    crewNextJob: "Prossimo lavoro",
    crewStartDay: "Naviga",
    crewOpenDetails: "Dettagli",
    crewQuickReport: "Report rapido",
    crewNoJobs: "Nessuna posa assegnata per il filtro attuale.",
    crewBeforePhoto: "Foto prima/dopo e note finali vengono agganciate alla commessa.",
    uploadPhoto: "Carica foto",
    jobAttachments: "Foto e allegati",
    jobAttachmentsHint: "Qui raccogli foto prima/dopo e allegati utili alla commessa.",
    orderAttachmentsHint: "Puoi allegare foto di partenza o documentazione ordine.",
    noAttachments: "Nessun allegato ancora caricato.",
    jobFormEyebrow: "Inserimento operativo",
    close: "Chiudi",
    deleteJob: "Elimina",
    saveJob: "Salva commessa",
    fieldFirstName: "Nome",
    fieldLastName: "Cognome",
    fieldCity: "Città",
    fieldPhone: "Telefono",
    fieldEmail: "Email",
    fieldAddress: "Indirizzo",
    fieldType: "Tipo lavoro",
    fieldSurface: "Superficie",
    fieldProduct: "Prodotto",
    fieldSqm: "Metri quadri",
    fieldInstallDate: "Data posa",
    fieldInstallTime: "Ora",
    fieldCrew: "Squadra",
    fieldPriority: "Priorità",
    fieldWarehouse: "Stato magazzino",
    fieldInstallStatus: "Stato posa",
    fieldMaterials: "Materiali",
    fieldNotes: "Note operative",
    typeSupply: "Fornitura",
    typeSupplyInstall: "Fornitura + posa",
    surfaceGround: "Terra",
    surfacePaving: "Pavimentazione",
    priorityHigh: "Alta",
    priorityMedium: "Media",
    priorityLow: "Bassa",
    warehouseToPrepare: "Da preparare",
    statusPreparing: "In preparazione",
    statusReady: "Pronto",
    statusMissingMaterial: "Manca materiale",
    installToPlan: "Da pianificare",
    statusScheduled: "In agenda",
    statusInProgress: "In corso",
    statBlocked: "Blocchi",
    crewComplete: "Lavoro completato",
    crewProblem: "Problema in cantiere",
    rowAssignCrew: "Assegna squadra",
    rowOpenSheet: "Apri scheda",
    alertResolve: "Risolvi",
    alertGo: "Vai",
    alertPlan: "Pianifica",
    dragHint: "Trascina per ripianificare",
    conflictHint: "Conflitto: materiale incompleto",
    stepOrder: "Ordine",
    stepConfirm: "Conferma",
    stepMaterial: "Materiale",
    stepCrew: "Squadra",
    stepInstall: "Posa",
    stepClose: "Chiusura",
    thJob: "Commessa",
    thClient: "Cliente",
    thInstallDate: "Data posa",
    thStatus: "Stato",
    thPriority: "Priorità",
    thAction: "Azione",
    warehouseMarkReady: "Segna come pronto",
    crewPhoto: "Allega foto",
    shopifyIntake: "Intake ordini",
    loadDemoOrders: "Usa demo ordini",
    syncShopifyOrders: "Sincronizza Shopify",
    importOrders: "Importa ordini",
    clearNonShopify: "Pulisci ordini manuali",
    shopifyJsonLabel: "JSON ordini Shopify",
    shopifyBridge: "Bridge",
    orderToJobTitle: "Ordine → Commessa",
    orderToJobLead: "Ogni ordine può diventare una commessa operativa con un click.",
    orderToJobText: "Il sistema genera cliente, contatti, indirizzo, prodotto iniziale e note, lasciando all’ufficio il completamento tecnico.",
    shopifyStatusTitle: "Stato integrazione",
    shopifyStatusText: "La connessione live usa dominio Shopify, Client ID, Client secret e sincronizzazione ordini. Da qui puoi già creare commesse operative dagli ordini reali.",
    settingsEyebrow: "Configurazione",
    shopDomain: "Dominio Shopify",
    shopClientId: "Client ID",
    shopClientSecret: "Client secret",
    shopLocation: "Location / deposito",
    shopWebhook: "URL pubblico webhook",
    saveSettings: "Salva impostazioni",
    settingsHint: "Salva qui i parametri del ponte Shopify. Client ID e secret servono per sincronizzare gli ordini live.",
    registerWebhook: "Registra webhook",
    webhookReady: "Webhook registrato con successo.",
    webhookFail: "Non sono riuscito a registrare il webhook Shopify.",
    webhookHint: "Serve un URL pubblico HTTPS per ricevere automaticamente gli ordini da Shopify.",
    nextStepEyebrow: "Next step",
    blockingReasons: "Blocchi rilevati",
    noBlockingReasons: "Nessun blocco attivo. La commessa può avanzare.",
    nextActionConfirm: "Completa dati cliente e indirizzo",
    nextActionConfirmText: "Mancano dati essenziali per trasformare la bozza in commessa pronta da pianificare.",
    nextActionPrepare: "Sblocca materiali e preparazione",
    nextActionPrepareText: "Il magazzino deve confermare disponibilità e materiali per rendere pianificabile la posa.",
    nextActionPlan: "Assegna squadra e data posa",
    nextActionPlanText: "Materiale pronto: puoi passare alla programmazione e confermare l'intervento.",
    nextActionStart: "Avvia posa o aggiorna squadra",
    nextActionStartText: "La commessa è programmata e pronta per andare in cantiere.",
    nextActionClose: "Chiudi commessa e consuntivo",
    nextActionCloseText: "Il lavoro è concluso: archivia note, foto e chiusura operativa.",
    reasonMissingAddress: "Indirizzo o città da verificare",
    reasonMissingProduct: "Prodotto o metratura da confermare",
    reasonMissingMaterials: "Materiali non definiti",
    reasonWarehouseBlocked: "Materiale mancante o bloccato in magazzino",
    reasonWarehousePreparing: "Preparazione magazzino ancora in corso",
    reasonMissingCrew: "Squadra non assegnata",
    reasonMissingDate: "Data posa non confermata",
    reasonJobRunning: "Lavoro in corso sul campo",
    reasonJobClosed: "Commessa pronta per chiusura finale",
    draftReady: "Bozza pronta",
    openDraft: "Apri bozza",
    shopifyLiveTitle: "Integrazione live Shopify",
    shopifyLiveItem1Title: "1. Custom app Shopify",
    shopifyLiveItem1Text: "L’app Shopify fornisce Client ID, secret e permessi per leggere ordini, clienti e prodotti.",
    shopifyLiveItem2Title: "2. Webhook ordine",
    shopifyLiveItem2Text: "Ogni nuovo ordine entra qui come inbox operativa senza copia-incolla.",
    shopifyLiveItem3Title: "3. Mapping tecnico",
    shopifyLiveItem3Text: "L’ufficio completa superficie, squadra, data posa e materiali prima di inviare al magazzino.",
    orderInboxTitle: "Ordini in arrivo",
    orderConverted: "Commessa creata",
    orderCreateJob: "Crea commessa",
    orderOpenJob: "Apri commessa",
    orderAutoDraftLead: "Ogni ordine diventa automaticamente una bozza commessa operativa.",
    orderAutoDraftText: "L’ufficio interviene solo per completare i dati mancanti, pianificare e sbloccare il flusso.",
    orderSource: "Fonte",
    orderClient: "Cliente",
    orderLines: "Articoli",
    orderFinancial: "Pagamento",
    orderFulfillment: "Evasione",
    orderNoOrders: "Nessun ordine disponibile. Importa JSON Shopify o usa la demo.",
    orderImportSuccess: "Ordini importati con successo.",
    orderImportError: "JSON non valido. Incolla un payload Shopify con `orders` o un array di ordini.",
    orderCreatedSuccess: "Commessa creata e pronta da completare.",
    orderManualCleared: "Ordini non Shopify rimossi.",
    deleteOrder: "Elimina ordine",
    deleteJobQuick: "Elimina commessa",
    openMaps: "Apri Maps",
    startRoute: "Avvia itinerario",
    openCrewRoute: "Itinerario squadra",
    openJobCard: "Apri commessa",
    editJob: "Modifica commessa",
    callClient: "Chiama cliente",
    mailClient: "Scrivi email",
    mapsMissingAddress: "Indirizzo da completare",
    orderMainProduct: "Prodotto principale",
    orderMaterials: "Materiali",
    orderService: "Servizio",
    orderAddress: "Indirizzo",
    orderNeedsReview: "Da completare",
    orderReadyToPlan: "Pronto da pianificare",
    orderSupplyOnly: "Solo fornitura",
    orderSupplyInstall: "Fornitura + posa",
    orderMissingAddress: "Indirizzo mancante",
    orderSummaryTitle: "Lettura operativa",
    orderSummaryText: "Il sistema separa prato, materiali e servizio posa per aiutarti a creare la commessa più in fretta.",
    googleMapsRouteHint: "Apre Google Maps con le tappe della squadra filtrata.",
    settingsSaved: "Impostazioni salvate.",
    roleOffice: "Ufficio",
    roleWarehouse: "Magazzino",
    roleCrew: "Squadra",
  },
  en: {
    brandEyebrow: "Vertex Ops",
    brandTitle: "Installation Management",
    authSubtitle: "Access the operational panel for office, warehouse and crews.",
    demoAccess: "Demo access",
    authEmail: "Email",
    authPassword: "Password",
    authLogin: "Login",
    authError: "Invalid credentials. Use a demo account or configure the real ones later.",
    loggedAs: "Active user",
    logout: "Logout",
    navDashboard: "Office Dashboard",
    navOrders: "Shopify Orders",
    navCalendar: "Installation Calendar",
    navJob: "Job Sheet",
    navWarehouse: "Warehouse View",
    navCrew: "Crew View",
    navAccounting: "Accounting",
    navSettings: "Settings",
    sidebarFocus: "Operational focus",
    sidebarFlowTitle: "One workflow",
    sidebarFlowText: "Each job lives in a single system and updates office, warehouse and crew without duplicate work.",
    topbarEyebrow: "Web operational MVP",
    newJob: "New job",
    seedData: "Reload data",
    opsOfficeLabel: "Office",
    opsOfficeText: "Jobs to complete and assign.",
    opsWarehouseLabel: "Warehouse",
    opsWarehouseText: "Orders to prepare or unblock.",
    opsCrewLabel: "Crews",
    opsCrewText: "Confirmed installs and jobs in progress.",
    controlRoom: "Control room",
    jobsToHandle: "Jobs to manage",
    refresh: "Refresh",
    searchPlaceholder: "Search client, city, crew or material",
    filterAll: "All",
    filterUrgent: "Urgent",
    filterMissing: "Missing material",
    filterPreparing: "Preparing",
    priorityNowEyebrow: "Automatic priority",
    priorityNowTitle: "Your 3 actions now",
    priorityNowHint: "The system sorts the next actions based on blocks, material and planning readiness.",
    quickAlerts: "Quick alerts",
    today: "Today",
    instantActions: "Immediate actions",
    fastLane: "Fast lane",
    activeWeek: "Active week",
    installationCalendar: "Installation calendar",
    allTeams: "All crews",
    calendarHint: "Quick view for crew load and missing materials",
    fullSheet: "Full sheet",
    opsNotes: "Operational notes",
    preparation: "Preparation",
    plannedMaterials: "Planned materials",
    operations: "Operations",
    warehouseOrders: "Warehouse orders",
    warehouseHint: "Filter by status, priority or install date",
    mobileFirst: "Mobile first",
    crewView: "Crew view",
    crewHint: "Quick actions for completed job, issue or site photos",
    accountingEyebrow: "Financial control",
    accountingPending: "Open balance",
    accountingInvoiceNeeded: "Invoice needed",
    accountingChecklistTitle: "Admin checklist",
    accountingChecklistLead: "Each order tracks payment method, deposits, balance and invoice status.",
    accountingChecklistText: "The office sees immediately what has been collected, what is missing and what still needs invoicing.",
    accountingDeposit: "Deposit",
    accountingBalance: "Balance",
    accountingInvoiceRequired: "Invoice required",
    accountingInvoiceIssued: "Invoice issued",
    accountingPaymentMethod: "Payment method",
    accountingSave: "Save accounting",
    accountingOpen: "Open order",
    accountingShopifySettled: "Already collected on Shopify",
    accountingManualPending: "Internal accounting still to complete",
    accountingFromShopify: "Method imported from Shopify",
    accountingPaidLabel: "Paid",
    accountingFulfilledLabel: "Fulfilled",
    accountingPendingLabel: "Pending",
    accountingUnfulfilledLabel: "Unfulfilled",
    accountingPartialLabel: "Partial",
    crewToday: "Today on site",
    crewNextJob: "Next job",
    crewStartDay: "Navigate",
    crewOpenDetails: "Details",
    crewQuickReport: "Quick report",
    crewNoJobs: "No jobs assigned for the current filter.",
    crewBeforePhoto: "Before/after photos and final notes are attached to the job.",
    uploadPhoto: "Upload photo",
    jobAttachments: "Photos and attachments",
    jobAttachmentsHint: "Collect before/after photos and useful job attachments here.",
    orderAttachmentsHint: "You can attach departure photos or order documentation.",
    noAttachments: "No attachments uploaded yet.",
    jobFormEyebrow: "Operational entry",
    close: "Close",
    deleteJob: "Delete",
    saveJob: "Save job",
    fieldFirstName: "First name",
    fieldLastName: "Last name",
    fieldCity: "City",
    fieldPhone: "Phone",
    fieldEmail: "Email",
    fieldAddress: "Address",
    fieldType: "Job type",
    fieldSurface: "Surface",
    fieldProduct: "Product",
    fieldSqm: "Square meters",
    fieldInstallDate: "Install date",
    fieldInstallTime: "Time",
    fieldCrew: "Crew",
    fieldPriority: "Priority",
    fieldWarehouse: "Warehouse status",
    fieldInstallStatus: "Install status",
    fieldMaterials: "Materials",
    fieldNotes: "Operational notes",
    typeSupply: "Supply only",
    typeSupplyInstall: "Supply + install",
    surfaceGround: "Ground",
    surfacePaving: "Paving",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    warehouseToPrepare: "To prepare",
    statusPreparing: "Preparing",
    statusReady: "Ready",
    statusMissingMaterial: "Missing material",
    installToPlan: "To plan",
    statusScheduled: "Scheduled",
    statusInProgress: "In progress",
    statBlocked: "Blocked",
    crewComplete: "Job completed",
    crewProblem: "Site issue",
    rowAssignCrew: "Assign crew",
    rowOpenSheet: "Open sheet",
    alertResolve: "Resolve",
    alertGo: "Go",
    alertPlan: "Plan",
    dragHint: "Drag to reschedule",
    conflictHint: "Conflict: incomplete material",
    stepOrder: "Order",
    stepConfirm: "Confirm",
    stepMaterial: "Material",
    stepCrew: "Crew",
    stepInstall: "Install",
    stepClose: "Close",
    thJob: "Job",
    thClient: "Client",
    thInstallDate: "Install date",
    thStatus: "Status",
    thPriority: "Priority",
    thAction: "Action",
    warehouseMarkReady: "Mark as ready",
    crewPhoto: "Attach photo",
    shopifyIntake: "Order intake",
    loadDemoOrders: "Use demo orders",
    syncShopifyOrders: "Sync Shopify",
    importOrders: "Import orders",
    clearNonShopify: "Clear manual orders",
    shopifyJsonLabel: "Shopify orders JSON",
    shopifyBridge: "Bridge",
    orderToJobTitle: "Order → Job",
    orderToJobLead: "Each order can become an operational job in one click.",
    orderToJobText: "The system generates client, contacts, address, initial product and notes, leaving technical completion to the office.",
    shopifyStatusTitle: "Integration status",
    shopifyStatusText: "Live connection uses Shopify domain, Client ID, Client secret and order sync. From here you can already convert real orders into jobs.",
    settingsEyebrow: "Configuration",
    shopDomain: "Shopify domain",
    shopClientId: "Client ID",
    shopClientSecret: "Client secret",
    shopLocation: "Location / warehouse",
    shopWebhook: "Public webhook URL",
    saveSettings: "Save settings",
    settingsHint: "Save Shopify bridge parameters here. Client ID and secret are used to sync live orders.",
    registerWebhook: "Register webhook",
    webhookReady: "Webhook registered successfully.",
    webhookFail: "I couldn't register the Shopify webhook.",
    webhookHint: "A public HTTPS URL is required to receive orders automatically from Shopify.",
    nextStepEyebrow: "Next step",
    blockingReasons: "Current blockers",
    noBlockingReasons: "No active blockers. The job can move forward.",
    nextActionConfirm: "Complete client data and address",
    nextActionConfirmText: "Key information is still missing before this draft can become ready to schedule.",
    nextActionPrepare: "Unblock materials and preparation",
    nextActionPrepareText: "Warehouse must confirm availability and preparation before scheduling.",
    nextActionPlan: "Assign crew and install date",
    nextActionPlanText: "Material is ready: you can move to scheduling and confirm the install.",
    nextActionStart: "Start install or update crew",
    nextActionStartText: "The job is scheduled and ready to go on site.",
    nextActionClose: "Close job and final review",
    nextActionCloseText: "The work is finished: archive notes, photos and operational closure.",
    reasonMissingAddress: "Address or city must be verified",
    reasonMissingProduct: "Product or square meters must be confirmed",
    reasonMissingMaterials: "Materials are not defined",
    reasonWarehouseBlocked: "Material missing or blocked in warehouse",
    reasonWarehousePreparing: "Warehouse preparation still in progress",
    reasonMissingCrew: "Crew not assigned",
    reasonMissingDate: "Install date not confirmed",
    reasonJobRunning: "Work currently running on site",
    reasonJobClosed: "Job ready for final closure",
    draftReady: "Draft ready",
    openDraft: "Open draft",
    shopifyLiveTitle: "Live Shopify integration",
    shopifyLiveItem1Title: "1. Shopify custom app",
    shopifyLiveItem1Text: "The Shopify app provides Client ID, secret and scopes to read orders, customers and products.",
    shopifyLiveItem2Title: "2. Order webhook",
    shopifyLiveItem2Text: "Each new order lands here as an operational inbox without copy-paste.",
    shopifyLiveItem3Title: "3. Technical mapping",
    shopifyLiveItem3Text: "The office completes surface, crew, install date and materials before sending to warehouse.",
    orderInboxTitle: "Incoming orders",
    orderConverted: "Job created",
    orderCreateJob: "Create job",
    orderOpenJob: "Open job",
    orderAutoDraftLead: "Every order automatically becomes an operational job draft.",
    orderAutoDraftText: "The office only steps in to complete missing fields, schedule and unblock the workflow.",
    orderSource: "Source",
    orderClient: "Client",
    orderLines: "Items",
    orderFinancial: "Payment",
    orderFulfillment: "Fulfillment",
    orderNoOrders: "No orders available. Import Shopify JSON or use the demo.",
    orderImportSuccess: "Orders imported successfully.",
    orderImportError: "Invalid JSON. Paste a Shopify payload with `orders` or an orders array.",
    orderCreatedSuccess: "Job created and ready to complete.",
    orderManualCleared: "Non-Shopify orders removed.",
    deleteOrder: "Delete order",
    deleteJobQuick: "Delete job",
    openMaps: "Open Maps",
    startRoute: "Start route",
    openCrewRoute: "Crew route",
    openJobCard: "Open job",
    editJob: "Edit job",
    callClient: "Call client",
    mailClient: "Send email",
    mapsMissingAddress: "Address to complete",
    orderMainProduct: "Main product",
    orderMaterials: "Materials",
    orderService: "Service",
    orderAddress: "Address",
    orderNeedsReview: "Needs review",
    orderReadyToPlan: "Ready to plan",
    orderSupplyOnly: "Supply only",
    orderSupplyInstall: "Supply + install",
    orderMissingAddress: "Missing address",
    orderSummaryTitle: "Operational reading",
    orderSummaryText: "The system separates turf, materials and install service so you can create the operational job faster.",
    googleMapsRouteHint: "Opens Google Maps with stops for the filtered crew.",
    settingsSaved: "Settings saved.",
    roleOffice: "Office",
    roleWarehouse: "Warehouse",
    roleCrew: "Crew",
  },
};

const ui = {
  authScreen: document.getElementById("auth-screen"),
  authForm: document.getElementById("auth-form"),
  authError: document.getElementById("auth-error"),
  appShell: document.getElementById("app-shell"),
  currentUserName: document.getElementById("current-user-name"),
  currentUserRole: document.getElementById("current-user-role"),
  topbarUserName: document.getElementById("topbar-user-name"),
  topbarUserRole: document.getElementById("topbar-user-role"),
  logoutButton: document.getElementById("logout-button"),
  navLinks: document.querySelectorAll(".nav-link"),
  views: document.querySelectorAll(".view"),
  viewTitle: document.getElementById("view-title"),
  langButtons: document.querySelectorAll(".lang-btn"),
  opsStrip: document.querySelector("[data-ops-strip]"),
  statsGrid: document.getElementById("stats-grid"),
  dashboardJobList: document.getElementById("dashboard-job-list"),
  priorityActionList: document.getElementById("priority-action-list"),
  alertStack: document.getElementById("alert-stack"),
  dashboardSearch: document.getElementById("dashboard-search"),
  dashboardRefresh: document.getElementById("dashboard-refresh"),
  dashboardFilterTags: document.querySelectorAll("[data-dashboard-filter]"),
  calendarCrewTags: document.querySelectorAll("[data-crew-filter]"),
  calendarWeekChip: document.getElementById("calendar-week-chip"),
  calendarLoadStrip: document.getElementById("calendar-load-strip"),
  calendarGrid: document.getElementById("calendar-grid"),
  jobTitle: document.getElementById("job-title"),
  jobMainStatus: document.getElementById("job-main-status"),
  jobStepper: document.getElementById("job-stepper"),
  jobNextActionTitle: document.getElementById("job-next-action-title"),
  jobNextActionText: document.getElementById("job-next-action-text"),
  jobNextActionButtons: document.getElementById("job-next-action-buttons"),
  jobBlockerList: document.getElementById("job-blocker-list"),
  jobDetailGrid: document.getElementById("job-detail-grid"),
  jobQuickActions: document.getElementById("job-quick-actions"),
  jobNotes: document.getElementById("job-notes"),
  jobMaterialList: document.getElementById("job-material-list"),
  jobBrowserList: document.getElementById("job-browser-list"),
  jobPrevButton: document.getElementById("job-prev-button"),
  jobNextButton: document.getElementById("job-next-button"),
  warehouseTags: document.querySelectorAll("[data-warehouse-filter]"),
  warehouseTable: document.getElementById("warehouse-table"),
  crewBoardTags: document.querySelectorAll("[data-board-crew]"),
  crewCards: document.getElementById("crew-cards"),
  crewChip: document.getElementById("crew-chip"),
  accountingSearch: document.getElementById("accounting-search"),
  accountingSummary: document.getElementById("accounting-summary"),
  accountingList: document.getElementById("accounting-list"),
  accountingRefresh: document.getElementById("accounting-refresh"),
  accountingFilterTags: document.querySelectorAll("[data-accounting-filter]"),
  ordersSummary: document.getElementById("orders-summary"),
  ordersList: document.getElementById("orders-list"),
  ordersError: document.getElementById("orders-error"),
  orderImportText: document.getElementById("order-import-text"),
  importOrdersButton: document.getElementById("import-orders-button"),
  clearNonShopifyOrdersButton: document.getElementById("clear-non-shopify-orders"),
  loadDemoOrdersButton: document.getElementById("load-demo-orders"),
  syncShopifyOrdersButton: document.getElementById("sync-shopify-orders"),
  shopifySettingsForm: document.getElementById("shopify-settings-form"),
  shopifySettingsStatus: document.getElementById("shopify-settings-status"),
  registerWebhookButton: document.getElementById("register-webhook-button"),
  newJobButtons: [document.getElementById("new-job-button"), document.getElementById("quick-new-job")].filter(Boolean),
  seedButton: document.getElementById("seed-button"),
  quickOrders: document.getElementById("quick-open-orders"),
  quickCalendar: document.getElementById("quick-open-calendar"),
  quickWarehouse: document.getElementById("quick-open-warehouse"),
  calendarRouteButton: document.getElementById("calendar-route-button"),
  crewRouteButton: document.getElementById("crew-route-button"),
  modal: document.getElementById("job-modal"),
  modalTitle: document.getElementById("modal-title"),
  jobForm: document.getElementById("job-form"),
  deleteJobButton: document.getElementById("delete-job-button"),
  closeModalButtons: document.querySelectorAll("[data-close-modal]"),
  attachmentInput: document.getElementById("attachment-input"),
  jobUploadButton: document.getElementById("job-upload-button"),
  jobAttachments: document.getElementById("job-attachments"),
  opsOfficeValue: document.getElementById("ops-office-value"),
  opsWarehouseValue: document.getElementById("ops-warehouse-value"),
  opsCrewValue: document.getElementById("ops-crew-value"),
};

const state = {
  lang: "it",
  currentUser: null,
  jobs: [],
  orders: [],
  shopifySettings: {},
  view: "dashboard",
  selectedJobId: null,
  dashboardFilter: "all",
  dashboardSearch: "",
  calendarCrew: "all",
  warehouseFilter: "all",
  crewBoard: "all",
  accountingFilter: "all",
  accountingSearch: "",
  editingJobId: null,
  pendingAttachmentTarget: null,
};

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "request_failed");
  }
  return data;
}

function t(key) {
  return translations[state.lang][key] || key;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function prettifyNamePart(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(" ");
}

function formatClientName(firstName, lastName) {
  return [prettifyNamePart(firstName), prettifyNamePart(lastName)].filter(Boolean).join(" ").trim() || "—";
}

function normalizeNumber(value) {
  const parsed = Number(String(value || "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function composeAddress(address, city) {
  return [String(address || "").trim(), String(city || "").trim()].filter(Boolean).join(", ");
}

function buildMapsDirectionsUrl(destination) {
  if (!destination) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function buildMapsSearchUrl(query) {
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildCrewRouteUrl(jobs) {
  const stops = jobs
    .map((job) => composeAddress(job.address, job.city))
    .filter(Boolean)
    .slice(0, 9);
  if (!stops.length) return "";
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1);
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function openExternalUrl(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildPhoneUrl(phone) {
  const normalized = String(phone || "").replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

function buildMailtoUrl(email) {
  const normalized = String(email || "").trim();
  return normalized ? `mailto:${normalized}` : "";
}

function parseSquareMetersFromTitle(title, quantity = 1) {
  const normalized = String(title || "").replace(",", ".");
  const slashMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m\s*\/\s*(\d+(?:\.\d+)?)\s*m/i);
  if (slashMatch) return normalizeNumber(slashMatch[1]) * normalizeNumber(slashMatch[2]) * quantity;

  const xMatch = normalized.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*m/i);
  if (xMatch) return normalizeNumber(xMatch[1]) * normalizeNumber(xMatch[2]) * quantity;

  const mqMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mq/i);
  if (mqMatch) return normalizeNumber(mqMatch[1]) * quantity;

  return 0;
}

function normalizeLineDetails(order) {
  if (Array.isArray(order.lineDetails) && order.lineDetails.length) {
    return order.lineDetails.map((item) => ({
      title: String(item.title || item.name || ""),
      quantity: Number(item.quantity || 1),
    }));
  }

  return (order.lineItems || []).map((line) => {
    const text = String(line || "");
    const qtyMatch = text.match(/·\s*(\d+(?:[.,]\d+)?)\s*pz/i);
    return {
      title: text.replace(/\s*·\s*\d+(?:[.,]\d+)?\s*pz/i, "").trim(),
      quantity: qtyMatch ? normalizeNumber(qtyMatch[1]) : 1,
    };
  });
}

function deriveOrderInsights(order) {
  const materialMatcher = /(banda|giunzione|telo|colla|picchetti|pietrisco|bordura|ciottol|lapillo|sabbia|kit|profumo|detergente|spazzolatrice|spazzola|mattonella)/i;
  const installMatcher = /(installazione|posa)/i;
  const details = normalizeLineDetails(order);
  const products = [];
  const materials = [];
  const services = [];
  let inferredSqm = 0;

  details.forEach((detail) => {
    const title = detail.title;
    if (!title) return;
    if (installMatcher.test(title)) {
      services.push(title);
      if (!inferredSqm) inferredSqm = detail.quantity || inferredSqm;
      return;
    }
    if (materialMatcher.test(title)) {
      materials.push(title);
      return;
    }
    const sqm = parseSquareMetersFromTitle(title, detail.quantity || 1);
    products.push({ title, sqm });
    inferredSqm += sqm;
  });

  const topProduct = [...products].sort((a, b) => b.sqm - a.sqm)[0] || null;
  const mainProduct = topProduct?.title?.split(" - ")[0]?.trim() || products[0]?.title || "Da definire";
  const serviceType = services.length ? t("orderSupplyInstall") : t("orderSupplyOnly");
  const inferredSurface = materials.some((item) => /(pietrisco|picchetti|telo)/i.test(item)) ? t("surfaceGround") : t("surfacePaving");
  const address = composeAddress(order.address, order.city);

  return {
    mainProduct,
    productLines: products.map((item) => item.title),
    materials,
    services,
    inferredSqm: Math.round(inferredSqm),
    serviceType,
    inferredSurface,
    address,
    hasAddress: Boolean(address),
    isReadyToPlan: Boolean(mainProduct && inferredSqm > 0),
  };
}

function getRoleLabel(role) {
  if (role === "office") return t("roleOffice");
  if (role === "warehouse") return t("roleWarehouse");
  return t("roleCrew");
}

function getAllowedViews() {
  if (!state.currentUser) return [];
  return roleViews[state.currentUser.role] || ["dashboard"];
}

function ensureAccessibleView() {
  const allowed = getAllowedViews();
  if (!allowed.includes(state.view)) state.view = allowed[0] || "dashboard";
}

function updateAuthVisibility() {
  const loggedIn = Boolean(state.currentUser);
  ui.authScreen.classList.toggle("hidden", loggedIn);
  ui.appShell.classList.toggle("hidden", !loggedIn);
}

function updateCurrentUserUi() {
  if (!state.currentUser) return;
  const role = getRoleLabel(state.currentUser.role);
  ui.currentUserName.textContent = state.currentUser.name;
  ui.currentUserRole.textContent = role;
  ui.topbarUserName.textContent = state.currentUser.name;
  ui.topbarUserRole.textContent = role;
}

function setView(view) {
  const allowed = getAllowedViews();
  if (allowed.length && !allowed.includes(view)) return;
  state.view = view;
  ui.navLinks.forEach((item) => {
    const enabled = allowed.includes(item.dataset.view);
    item.classList.toggle("is-hidden", !enabled);
    item.classList.toggle("is-active", enabled && item.dataset.view === view);
  });
  ui.views.forEach((panel) => panel.classList.toggle("is-active", panel.id === view));
  ui.viewTitle.textContent = t(`nav${view.charAt(0).toUpperCase()}${view.slice(1)}`);
  ui.opsStrip.classList.toggle("is-compact", view !== "dashboard");
}

function setLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  ui.dashboardSearch.placeholder = t("searchPlaceholder");
  ui.langButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.lang === lang));
  updateCurrentUserUi();
  render();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString(state.lang === "it" ? "it-IT" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString(state.lang === "it" ? "it-IT" : "en-US", {
    day: "2-digit",
    month: "short",
  });
}

function getSelectedJob() {
  return state.jobs.find((job) => job.id === state.selectedJobId) || state.jobs[0] || null;
}

function getSelectedJobIndex() {
  return state.jobs.findIndex((job) => job.id === state.selectedJobId);
}

function getSourceOrderForJob(job) {
  return state.orders.find((order) => order.id === job.sourceOrderId) || null;
}

function getJobDisplayTitle(job) {
  const clientName = formatClientName(job.firstName, job.lastName);
  const sourceOrder = getSourceOrderForJob(job);
  if (sourceOrder?.orderNumber) return `${clientName} · ${sourceOrder.orderNumber}`;
  if (/^\d+$/.test(String(job.id || ""))) return `${clientName} · #${job.id}`;
  return clientName;
}

function getJobDisplaySubtitle(job) {
  const sourceOrder = getSourceOrderForJob(job);
  if (sourceOrder?.orderNumber) return `Ordine ${sourceOrder.orderNumber}`;
  if (/^\d+$/.test(String(job.id || ""))) return `Commessa #${job.id}`;
  return `Commessa interna`;
}

function getJobStatusBadge(job) {
  if (job.installStatus === "completata") return { label: t("crewComplete"), className: "tag-green" };
  if (job.installStatus === "problema" || job.warehouseStatus === "manca-materiale") return { label: t("filterMissing"), className: "tag-red" };
  if (job.installStatus === "in-corso") return { label: t("statusInProgress"), className: "tag-blue" };
  if (job.warehouseStatus === "pronto") return { label: t("statusReady"), className: "tag-green" };
  if (job.warehouseStatus === "in-preparazione") return { label: t("statusPreparing"), className: "tag-amber" };
  return { label: t("statusScheduled"), className: "tag-blue" };
}

function getOrderStatusBadge(order) {
  if (order.convertedJobId) return { label: t("orderConverted"), className: "tag-green" };
  if (String(order.financialStatus || "").toLowerCase() === "pending") return { label: t("orderFinancial"), className: "tag-amber" };
  return { label: t("orderSource"), className: "tag-blue" };
}

function formatMoney(value) {
  const amount = normalizeNumber(value);
  return amount.toLocaleString(state.lang === "it" ? "it-IT" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getFinancialStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("paid")) return t("accountingPaidLabel");
  if (normalized.includes("pending")) return t("accountingPendingLabel");
  if (normalized.includes("partially")) return t("accountingPartialLabel");
  return String(status || "—");
}

function getFulfillmentStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("fulfilled")) return t("accountingFulfilledLabel");
  if (normalized.includes("unfulfilled")) return t("accountingUnfulfilledLabel");
  if (normalized.includes("partial")) return t("accountingPartialLabel");
  return String(status || "—");
}

function getOrderAccounting(order) {
  const total = normalizeNumber(order.total);
  const rawDeposit = normalizeNumber(order.accounting?.depositPaid);
  const rawBalance = normalizeNumber(order.accounting?.balancePaid);
  const isPaidOnShopify = String(order.financialStatus || "").toLowerCase().includes("paid");
  const hasManualAccounting = rawDeposit > 0 || rawBalance > 0;
  const effectiveBalance = !hasManualAccounting && isPaidOnShopify ? total : rawBalance;
  const effectiveDeposit = !hasManualAccounting && isPaidOnShopify ? 0 : rawDeposit;

  return {
    paymentMethod: order.accounting?.paymentMethod || order.paymentMethod || "—",
    depositPaid: effectiveDeposit,
    balancePaid: effectiveBalance,
    invoiceRequired: Boolean(order.accounting?.invoiceRequired),
    invoiceIssued: Boolean(order.accounting?.invoiceIssued),
    accountingNote: order.accounting?.accountingNote || "",
    sourcedFromShopify: !hasManualAccounting && isPaidOnShopify,
  };
}

function renderAttachmentGrid(items) {
  const attachments = Array.isArray(items) ? items : [];
  if (!attachments.length) return `<div class="empty-state attachment-empty">${t("noAttachments")}</div>`;
  return attachments.map((item) => `
    <a class="attachment-tile" href="${escapeHtml(item.dataUrl || "#")}" target="_blank" rel="noopener noreferrer">
      <img src="${escapeHtml(item.dataUrl || "")}" alt="${escapeHtml(item.name || "attachment")}" />
      <span>${escapeHtml(item.name || "attachment")}</span>
    </a>
  `).join("");
}

function getJobWorkflow(job) {
  const blockers = [];
  const hasAddress = Boolean(String(job.address || "").trim() && String(job.city || "").trim());
  const hasCommercialCore = Boolean(String(job.product || "").trim() && Number(job.sqm || 0) > 0);
  const hasMaterials = Array.isArray(job.materials) && job.materials.length > 0;
  const warehouseReady = job.warehouseStatus === "pronto";
  const warehouseBlocked = job.warehouseStatus === "manca-materiale";
  const warehousePreparing = job.warehouseStatus === "in-preparazione" || job.warehouseStatus === "da-preparare";
  const hasCrew = Boolean(String(job.crew || "").trim());
  const hasInstallDate = Boolean(String(job.installDate || "").trim());
  const installStarted = job.installStatus === "in-corso";
  const installClosed = job.installStatus === "completata";

  if (!hasAddress) blockers.push(t("reasonMissingAddress"));
  if (!hasCommercialCore) blockers.push(t("reasonMissingProduct"));
  if (!hasMaterials) blockers.push(t("reasonMissingMaterials"));
  if (warehouseBlocked) blockers.push(t("reasonWarehouseBlocked"));
  else if (warehousePreparing) blockers.push(t("reasonWarehousePreparing"));
  if (!hasCrew) blockers.push(t("reasonMissingCrew"));
  if (!hasInstallDate) blockers.push(t("reasonMissingDate"));
  if (installStarted) blockers.push(t("reasonJobRunning"));
  if (installClosed) blockers.push(t("reasonJobClosed"));

  let currentStep = 1;
  if (hasAddress && hasCommercialCore) currentStep = 2;
  if (hasAddress && hasCommercialCore && hasMaterials) currentStep = 3;
  if (hasAddress && hasCommercialCore && hasMaterials && warehouseReady && hasCrew) currentStep = 4;
  if (hasAddress && hasCommercialCore && hasMaterials && warehouseReady && hasCrew && hasInstallDate) currentStep = 5;
  if (installClosed) currentStep = 6;

  let nextAction = {
    title: t("nextActionConfirm"),
    text: t("nextActionConfirmText"),
    actions: [{ label: t("editJob"), action: "edit-job" }],
    reason: blockers[0] || t("draftReady"),
    score: 60,
  };

  if (hasAddress && hasCommercialCore && (!hasMaterials || warehouseBlocked || warehousePreparing)) {
    nextAction = {
      title: t("nextActionPrepare"),
      text: t("nextActionPrepareText"),
      actions: [
        { label: t("navWarehouse"), action: "open-warehouse" },
        { label: t("editJob"), action: "edit-job" },
      ],
      reason: warehouseBlocked ? t("reasonWarehouseBlocked") : t("reasonWarehousePreparing"),
      score: warehouseBlocked ? 98 : 88,
    };
  } else if (hasAddress && hasCommercialCore && hasMaterials && warehouseReady && (!hasCrew || !hasInstallDate || job.installStatus === "da-pianificare")) {
    nextAction = {
      title: t("nextActionPlan"),
      text: t("nextActionPlanText"),
      actions: [{ label: t("rowAssignCrew"), action: "assign-crew" }],
      reason: !hasCrew ? t("reasonMissingCrew") : t("reasonMissingDate"),
      score: 92,
    };
  } else if (hasAddress && hasCommercialCore && hasMaterials && warehouseReady && hasCrew && hasInstallDate && !installClosed) {
    nextAction = {
      title: t("nextActionStart"),
      text: t("nextActionStartText"),
      actions: [
        { label: t("openMaps"), action: "open-job-maps" },
        { label: t("openCrewRoute"), action: "open-job-route" },
      ],
      reason: installStarted ? t("reasonJobRunning") : t("statusScheduled"),
      score: installStarted ? 78 : 85,
    };
  } else if (installClosed) {
    nextAction = {
      title: t("nextActionClose"),
      text: t("nextActionCloseText"),
      actions: [{ label: t("editJob"), action: "edit-job" }],
      reason: t("reasonJobClosed"),
      score: 70,
    };
  }

  return { blockers, currentStep, nextAction };
}

function getPriorityActions() {
  return [...state.jobs]
    .map((job) => {
      const workflow = getJobWorkflow(job);
      return { job, workflow, score: workflow.nextAction.score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getJobPriorityLabel(priority) {
  if (priority === "alta") return t("priorityHigh");
  if (priority === "media") return t("priorityMedium");
  return t("priorityLow");
}

function getPriorityDot(priority) {
  if (priority === "alta") return "high";
  if (priority === "media") return "medium";
  return "low";
}

function showOrdersMessage(text, kind = "success") {
  ui.ordersError.textContent = text;
  ui.ordersError.classList.remove("hidden", "success", "error");
  ui.ordersError.classList.add(kind);
}

function setSettingsStatus(text, kind = "success") {
  ui.shopifySettingsStatus.textContent = text;
  ui.shopifySettingsStatus.classList.remove("success", "error");
  if (kind === "success" || kind === "error") {
    ui.shopifySettingsStatus.classList.add(kind);
  }
}

function openJobModal(job = null) {
  state.editingJobId = job?.id || null;
  ui.modal.classList.remove("hidden");
  ui.modalTitle.textContent = job ? `${t("navJob")} #${job.id}` : t("newJob");
  ui.deleteJobButton.style.visibility = job ? "visible" : "hidden";

  const form = ui.jobForm;
  form.id.value = job?.id || "";
  form.firstName.value = job?.firstName || "";
  form.lastName.value = job?.lastName || "";
  form.city.value = job?.city || "";
  form.phone.value = job?.phone || "";
  form.email.value = job?.email || "";
  form.address.value = job?.address || "";
  form.jobType.value = job?.jobType || "fornitura";
  form.surface.value = job?.surface || "terra";
  form.product.value = job?.product || "";
  form.sqm.value = job?.sqm || "";
  form.installDate.value = job?.installDate || "";
  form.installTime.value = job?.installTime || "";
  form.crew.value = job?.crew || "Alpha";
  form.priority.value = job?.priority || "media";
  form.warehouseStatus.value = job?.warehouseStatus || "da-preparare";
  form.installStatus.value = job?.installStatus || "da-pianificare";
  form.materials.value = (job?.materials || []).join("\n");
  form.notes.value = job?.notes || "";
}

function closeJobModal() {
  ui.modal.classList.add("hidden");
  state.editingJobId = null;
  ui.jobForm.reset();
}

async function saveJobFromForm(event) {
  event.preventDefault();
  const form = new FormData(ui.jobForm);
  const payload = {
    id: form.get("id") || `${Date.now()}`,
    firstName: String(form.get("firstName") || "").trim(),
    lastName: String(form.get("lastName") || "").trim(),
    city: String(form.get("city") || "").trim(),
    phone: String(form.get("phone") || "").trim(),
    email: String(form.get("email") || "").trim(),
    address: String(form.get("address") || "").trim(),
    jobType: form.get("jobType"),
    surface: form.get("surface"),
    product: String(form.get("product") || "").trim(),
    sqm: Number(form.get("sqm") || 0),
    installDate: form.get("installDate"),
    installTime: form.get("installTime"),
    crew: form.get("crew"),
    priority: form.get("priority"),
    warehouseStatus: form.get("warehouseStatus"),
    installStatus: form.get("installStatus"),
    materials: String(form.get("materials") || "").split("\n").map((item) => item.trim()).filter(Boolean),
    notes: String(form.get("notes") || "").trim(),
    sourceOrderId: state.jobs.find((job) => job.id === form.get("id"))?.sourceOrderId || null,
  };
  const saved = await apiFetch("/api/jobs", { method: "POST", body: JSON.stringify(payload) });
  const existing = state.jobs.findIndex((job) => job.id === saved.id);
  if (existing >= 0) state.jobs[existing] = saved;
  else state.jobs.unshift(saved);
  state.selectedJobId = saved.id;
  closeJobModal();
  render();
}

async function deleteCurrentJob() {
  if (!state.editingJobId) return;
  await apiFetch(`/api/jobs/${state.editingJobId}`, { method: "DELETE" });
  state.jobs = state.jobs.filter((job) => job.id !== state.editingJobId);
  state.selectedJobId = state.jobs[0]?.id || null;
  closeJobModal();
  render();
}

function getDashboardJobs() {
  return state.jobs.filter((job) => {
    const text = `${job.firstName} ${job.lastName} ${job.city} ${job.crew} ${job.product}`.toLowerCase();
    const matchesSearch = text.includes(state.dashboardSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (state.dashboardFilter === "urgent") return job.priority === "alta";
    if (state.dashboardFilter === "blocked") return job.warehouseStatus === "manca-materiale" || job.installStatus === "problema";
    return true;
  });
}

function renderStats() {
  const blocked = state.jobs.filter((job) => job.warehouseStatus === "manca-materiale" || job.installStatus === "problema").length;
  const warehouseOpen = state.jobs.filter((job) => job.warehouseStatus === "da-preparare" || job.warehouseStatus === "in-preparazione").length;
  const scheduled = state.jobs.filter((job) => job.installStatus === "programmata" || job.installStatus === "in-corso").length;
  const orderInbox = state.orders.filter((order) => !order.convertedJobId).length;

  ui.opsOfficeValue.textContent = `${state.jobs.filter((job) => job.installStatus === "da-pianificare").length}`;
  ui.opsWarehouseValue.textContent = `${warehouseOpen}`;
  ui.opsCrewValue.textContent = `${scheduled}`;

  ui.statsGrid.innerHTML = [
    { label: t("navDashboard"), value: state.jobs.length, desc: `${state.jobs.length} ${t("jobsToHandle").toLowerCase()}`, accent: "accent-green" },
    { label: t("navOrders"), value: orderInbox, desc: t("orderInboxTitle"), accent: "accent-blue" },
    { label: t("warehouseOrders"), value: warehouseOpen, desc: t("warehouseHint"), accent: "accent-amber" },
    { label: t("statBlocked"), value: blocked, desc: t("filterMissing"), accent: "accent-red" },
  ].map((item) => `
    <article class="stat-card ${item.accent}">
      <span class="stat-label">${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.desc}</p>
    </article>
  `).join("");
}

function renderDashboard() {
  const jobs = getDashboardJobs();
  const priorityActions = getPriorityActions();
  ui.priorityActionList.innerHTML = priorityActions.map(({ job, workflow }) => `
    <article class="priority-card">
      <div class="priority-card-copy">
        <span class="tag ${getJobStatusBadge(job).className}">${workflow.nextAction.reason || t("draftReady")}</span>
        <strong>${workflow.nextAction.title}</strong>
        <p>${getJobDisplayTitle(job)} · ${workflow.nextAction.text}</p>
      </div>
      <div class="priority-card-actions">
        ${workflow.nextAction.actions.map((item) => `
          <button class="mini-action ${item.action === "assign-crew" ? "primary-mini" : ""}" data-action="${item.action}" data-id="${job.id}">${item.label}</button>
        `).join("")}
      </div>
    </article>
  `).join("") || `<div class="empty-state">${t("orderNoOrders")}</div>`;

  ui.dashboardJobList.innerHTML = jobs.map((job) => {
    const badge = getJobStatusBadge(job);
    const workflow = getJobWorkflow(job);
    const mapsReady = Boolean(composeAddress(job.address, job.city));
    return `
      <article class="job-row">
        <div class="job-row-main">
          <strong>${getJobDisplayTitle(job)}</strong>
          <p>${getJobDisplaySubtitle(job)} · ${job.city} · ${job.sqm} mq · ${job.product}</p>
          <small class="job-row-hint">${workflow.nextAction.title} · ${workflow.nextAction.reason || t("draftReady")}</small>
        </div>
        <div class="job-row-side">
          <div class="row-actions job-row-actions">
            <button class="mini-action primary-mini" data-action="${workflow.nextAction.actions[0]?.action || "edit-job"}" data-id="${job.id}">${workflow.nextAction.actions[0]?.label || t("editJob")}</button>
            <div class="secondary-actions">
              <button class="mini-action" data-action="open-job-maps" data-id="${job.id}" ${mapsReady ? "" : "disabled"}>${t("openMaps")}</button>
              <button class="mini-action" data-action="edit-job" data-id="${job.id}">${t("rowOpenSheet")}</button>
            </div>
          </div>
          <div class="row-tags job-row-tags">
            <span class="tag ${badge.className}">${badge.label}</span>
            <span class="tag">${job.surface === "terra" ? t("surfaceGround") : t("surfacePaving")}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const blockedJobs = state.jobs.filter((job) => job.warehouseStatus === "manca-materiale" || job.installStatus === "problema").slice(0, 3);
  ui.alertStack.innerHTML = blockedJobs.map((job, index) => `
    <div class="alert-item">
      <div class="alert-row-head">
        <strong>${getJobDisplayTitle(job)}</strong>
        <button class="mini-action primary-mini" data-action="edit-job" data-id="${job.id}">${index === 0 ? t("alertResolve") : index === 1 ? t("alertGo") : t("alertPlan")}</button>
      </div>
      <p>${getJobDisplaySubtitle(job)} · ${job.notes || job.product}</p>
    </div>
  `).join("") || `<div class="empty-state">${t("orderNoOrders")}</div>`;
}

function getWeekRange() {
  const dates = state.jobs.map((job) => job.installDate).filter(Boolean).sort();
  if (!dates.length) return "—";
  return `${formatShortDate(dates[0])} - ${formatShortDate(dates[dates.length - 1])}`;
}

function renderCalendar() {
  ui.calendarWeekChip.textContent = getWeekRange();
  const jobs = state.jobs.filter((job) => state.calendarCrew === "all" || job.crew === state.calendarCrew);
  const grouped = {};
  jobs.forEach((job) => {
    const key = job.installDate || "senza-data";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(job);
  });
  const sortedKeys = Object.keys(grouped).sort();
  ui.calendarLoadStrip.innerHTML = sortedKeys.slice(0, 3).map((dateKey) => {
    const dayJobs = grouped[dateKey];
    const busyCrews = new Set(dayJobs.map((job) => job.crew)).size;
    const freeCrews = Math.max(crews.length - busyCrews, 0);
    const warning = dayJobs.some((job) => job.warehouseStatus === "manca-materiale" || job.installStatus === "problema");
    return `
      <div class="load-card ${warning ? "warning" : ""}">
        <span>${formatShortDate(dateKey)}</span>
        <strong>${busyCrews} ${state.lang === "it" ? "squadre occupate" : "crews busy"} · ${freeCrews} ${state.lang === "it" ? "libere" : "free"}</strong>
      </div>
    `;
  }).join("");

  ui.calendarGrid.innerHTML = sortedKeys.map((dateKey) => `
    <div class="calendar-column">
      <h4>${formatDate(dateKey)}</h4>
      ${grouped[dateKey].map((job) => {
        const conflict = job.warehouseStatus === "manca-materiale" || job.installStatus === "problema";
        const mapsUrl = buildMapsDirectionsUrl(composeAddress(job.address, job.city));
        return `
          <div class="calendar-card draggable ${conflict ? "conflict attention" : ""}" data-action="select-job" data-id="${job.id}">
            <strong>${job.firstName} ${job.lastName}</strong>
            <p>${job.sqm} mq · ${job.surface === "terra" ? t("surfaceGround") : t("surfacePaving")}</p>
            <span>${job.crew}</span>
            <div class="card-inline-actions">
              <button class="mini-action" data-action="open-job-card" data-id="${job.id}">${t("openJobCard")}</button>
              <button class="mini-action" data-action="open-job-maps" data-id="${job.id}" ${mapsUrl ? "" : "disabled"}>${t("openMaps")}</button>
            </div>
            <small>${conflict ? t("conflictHint") : t("dragHint")}</small>
          </div>
        `;
      }).join("")}
    </div>
  `).join("");
}

function renderJobView() {
  const job = getSelectedJob();
  if (!job) return;
  const badge = getJobStatusBadge(job);
  const workflow = getJobWorkflow(job);
  const fullAddress = composeAddress(job.address, job.city);
  const mapsUrl = buildMapsDirectionsUrl(fullAddress);
  const phoneUrl = buildPhoneUrl(job.phone);
  const mailUrl = buildMailtoUrl(job.email);
  ui.jobTitle.textContent = getJobDisplayTitle(job);
  ui.jobMainStatus.textContent = badge.label;
  ui.jobMainStatus.className = `tag ${badge.className}`;

  ui.jobStepper.innerHTML = installSteps.map((step, index) => {
    const className = index + 1 < workflow.currentStep ? "is-complete" : index + 1 === workflow.currentStep ? "is-active" : "";
    return `<div class="step ${className}"><span>${index + 1}</span><label>${t(`step${step.charAt(0).toUpperCase()}${step.slice(1)}`)}</label></div>`;
  }).join("");

  ui.jobNextActionTitle.textContent = workflow.nextAction.title;
  ui.jobNextActionText.textContent = workflow.nextAction.text;
  ui.jobNextActionButtons.innerHTML = workflow.nextAction.actions.map((item) => `
    <button class="mini-action ${item.action === "assign-crew" ? "primary-mini" : ""}" data-action="${item.action}" data-id="${job.id}">${item.label}</button>
  `).join("");
  ui.jobBlockerList.innerHTML = workflow.blockers.length
    ? workflow.blockers.map((item) => `<li>${item}</li>`).join("")
    : `<li>${t("noBlockingReasons")}</li>`;

  ui.jobDetailGrid.innerHTML = [
    { label: t("fieldFirstName"), value: formatClientName(job.firstName, job.lastName), meta: `${job.city} · ${job.phone || "—"} · ${job.email || "—"}` },
    { label: t("fieldType"), value: job.jobType === "fornitura" ? t("typeSupply") : t("typeSupplyInstall"), meta: `${job.sqm} mq · ${job.surface === "terra" ? t("surfaceGround") : t("surfacePaving")} · ${job.product}` },
    { label: t("fieldInstallDate"), value: formatDate(job.installDate), meta: `${job.crew} · ${job.installTime || "—"}` },
    { label: t("fieldWarehouse"), value: badge.label, meta: `${t("fieldPriority")}: ${getJobPriorityLabel(job.priority)}` },
    { label: t("orderAddress"), value: fullAddress || t("mapsMissingAddress"), meta: fullAddress ? t("googleMapsRouteHint") : t("orderMissingAddress") },
  ].map((item) => `
    <div class="detail-card">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.meta}</p>
    </div>
  `).join("");

  ui.jobQuickActions.innerHTML = `
    <button class="primary-button small-button" data-action="edit-job" data-id="${job.id}">${t("editJob")}</button>
    <button class="ghost-button small" data-action="open-job-maps" data-id="${job.id}" ${mapsUrl ? "" : "disabled"}>${t("openMaps")}</button>
    <button class="ghost-button small" data-action="open-job-route" data-id="${job.id}" ${mapsUrl ? "" : "disabled"}>${t("startRoute")}</button>
    <button class="ghost-button small" data-action="call-client" data-id="${job.id}" ${phoneUrl ? "" : "disabled"}>${t("callClient")}</button>
    <button class="ghost-button small" data-action="mail-client" data-id="${job.id}" ${mailUrl ? "" : "disabled"}>${t("mailClient")}</button>
    <button class="ghost-button small danger-button" data-action="delete-job-direct" data-id="${job.id}">${t("deleteJobQuick")}</button>
  `;
  ui.jobNotes.textContent = job.notes || "—";
  ui.jobMaterialList.innerHTML = (job.materials || []).map((item) => `<li><span>${item}</span><strong></strong></li>`).join("");
  ui.jobAttachments.innerHTML = renderAttachmentGrid(job.attachments);

  const selectedIndex = getSelectedJobIndex();
  ui.jobBrowserList.innerHTML = state.jobs.length
    ? state.jobs.map((item, index) => {
        const isActive = item.id === job.id;
        const badge = getJobStatusBadge(item);
        return `
          <button class="job-browser-item ${isActive ? "is-active" : ""}" data-action="select-job" data-id="${item.id}">
            <div>
              <strong>${getJobDisplayTitle(item)}</strong>
              <small>${getJobDisplaySubtitle(item)}</small>
              <p>${formatClientName(item.firstName, item.lastName)} · ${item.city || "—"}</p>
            </div>
            <div class="job-browser-meta">
              <span class="tag ${badge.className}">${badge.label}</span>
              <small>${index + 1}/${state.jobs.length}</small>
            </div>
          </button>
        `;
      }).join("")
    : `<div class="empty-state">${t("jobsToHandle")}</div>`;

  if (ui.jobPrevButton) ui.jobPrevButton.disabled = selectedIndex <= 0;
  if (ui.jobNextButton) ui.jobNextButton.disabled = selectedIndex < 0 || selectedIndex >= state.jobs.length - 1;
}

function renderWarehouse() {
  const jobs = state.jobs.filter((job) => {
    if (state.warehouseFilter === "all") return true;
    if (state.warehouseFilter === "blocked") return job.warehouseStatus === "manca-materiale";
    if (state.warehouseFilter === "ready") return job.warehouseStatus === "pronto";
    if (state.warehouseFilter === "preparing") return job.warehouseStatus === "in-preparazione";
    return true;
  });

  ui.warehouseTable.innerHTML = `
    <div class="table-row table-head">
      <span>${t("thJob")}</span>
      <span>${t("thClient")}</span>
      <span>${t("thInstallDate")}</span>
      <span>${t("thStatus")}</span>
      <span>${t("thPriority")}</span>
      <span>${t("thAction")}</span>
    </div>
    ${jobs.map((job) => {
      const badge = getJobStatusBadge(job);
      return `
        <div class="table-row">
          <span>#${job.id}</span>
          <span>${job.firstName} ${job.lastName}</span>
          <span>${formatShortDate(job.installDate)}</span>
          <span class="tag ${badge.className}">${badge.label}</span>
          <span><span class="priority-dot ${getPriorityDot(job.priority)}"></span>${getJobPriorityLabel(job.priority)}</span>
          <button class="mini-action ${job.warehouseStatus === "pronto" ? "" : "primary-mini"}" data-action="${job.warehouseStatus === "pronto" ? "edit-job" : "warehouse-ready"}" data-id="${job.id}">
            ${job.warehouseStatus === "pronto" ? t("rowOpenSheet") : t("warehouseMarkReady")}
          </button>
        </div>
      `;
    }).join("")}
  `;
}

function renderCrew() {
  const jobs = state.jobs
    .filter((job) => (state.crewBoard === "all" ? true : job.crew === state.crewBoard))
    .sort((a, b) => `${a.installDate || "9999-12-31"} ${a.installTime || "23:59"}`.localeCompare(`${b.installDate || "9999-12-31"} ${b.installTime || "23:59"}`));
  ui.crewChip.textContent = state.crewBoard === "all" ? t("allTeams") : state.crewBoard;
  ui.crewCards.innerHTML = jobs.length ? jobs.map((job, index) => {
    const badge = getJobStatusBadge(job);
    const mapsUrl = buildMapsDirectionsUrl(composeAddress(job.address, job.city));
    const isToday = String(job.installDate || "") === new Date().toISOString().slice(0, 10);
    return `
      <article class="crew-card">
        <div class="crew-card-top crew-card-top-hero">
          <div>
            <span class="panel-eyebrow">${index === 0 ? t("crewToday") : t("crewNextJob")}</span>
            <strong>${formatDate(job.installDate)} · ${job.installTime || "—"}</strong>
          </div>
          <span class="tag ${isToday ? "tag-green" : badge.className}">${isToday ? t("crewToday") : badge.label}</span>
        </div>
        <h4>${formatClientName(job.firstName, job.lastName)}</h4>
        <p>${composeAddress(job.address, job.city) || t("mapsMissingAddress")}</p>
        <div class="crew-primary-actions">
          <button class="mini-action primary-mini crew-primary-button" data-action="open-job-maps" data-id="${job.id}" ${mapsUrl ? "" : "disabled"}>${t("crewStartDay")}</button>
          <button class="mini-action" data-action="select-job" data-id="${job.id}">${t("crewOpenDetails")}</button>
        </div>
        <div class="crew-metrics">
          <span>${job.product}</span>
          <strong>${job.sqm} mq</strong>
        </div>
        <small>${job.notes || t("crewBeforePhoto")}</small>
        <div class="crew-actions crew-actions-compact">
          <button class="mini-action primary-mini" data-action="mark-complete" data-id="${job.id}">${t("crewComplete")}</button>
          <button class="mini-action" data-action="mark-problem" data-id="${job.id}">${t("crewProblem")}</button>
          <button class="mini-action" data-action="upload-job-photo" data-id="${job.id}">${t("uploadPhoto")}</button>
          <button class="mini-action" data-action="edit-job" data-id="${job.id}">${t("crewQuickReport")}</button>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">${t("crewNoJobs")}</div>`;
}

function getAccountingOrders() {
  return state.orders.filter((order) => {
    const accounting = getOrderAccounting(order);
    const text = `${formatClientName(order.firstName, order.lastName)} ${order.orderNumber} ${order.city} ${accounting.paymentMethod}`.toLowerCase();
    if (!text.includes(state.accountingSearch.toLowerCase())) return false;
    const total = normalizeNumber(order.total);
    const paid = accounting.depositPaid + accounting.balancePaid;
    const balanceOpen = Math.max(total - paid, 0.01);
    if (state.accountingFilter === "pending") return balanceOpen > 0;
    if (state.accountingFilter === "invoice") return accounting.invoiceRequired && !accounting.invoiceIssued;
    return true;
  });
}

function renderAccounting() {
  const orders = getAccountingOrders();
  const summary = orders.reduce((acc, order) => {
    const accounting = getOrderAccounting(order);
    const total = normalizeNumber(order.total);
    acc.total += total;
    acc.deposit += accounting.depositPaid;
    acc.balance += accounting.balancePaid;
    if (accounting.invoiceRequired && !accounting.invoiceIssued) acc.toInvoice += 1;
    return acc;
  }, { total: 0, deposit: 0, balance: 0, toInvoice: 0 });

  ui.accountingSummary.innerHTML = [
    { label: t("orderSource"), value: orders.length, desc: t("navOrders"), accent: "accent-blue" },
    { label: t("accountingDeposit"), value: formatMoney(summary.deposit), desc: "Incassato come acconto", accent: "accent-green" },
    { label: t("accountingBalance"), value: formatMoney(summary.balance), desc: "Incassato come saldo", accent: "accent-amber" },
    { label: t("accountingInvoiceNeeded"), value: summary.toInvoice, desc: "Ordini ancora da fatturare", accent: "accent-red" },
  ].map((item) => `
    <article class="stat-card ${item.accent}">
      <span class="stat-label">${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.desc}</p>
    </article>
  `).join("");

  ui.accountingList.innerHTML = orders.length ? orders.map((order) => {
    const accounting = getOrderAccounting(order);
    const total = normalizeNumber(order.total);
    const residual = Math.max(total - accounting.depositPaid - accounting.balancePaid, 0);
    return `
      <article class="accounting-card">
        <div class="order-card-head">
          <div>
            <strong>${formatClientName(order.firstName, order.lastName)} · ${order.orderNumber}</strong>
            <p>${order.city || "—"} · ${escapeHtml(getFinancialStatusLabel(order.financialStatus))} · ${escapeHtml(getFulfillmentStatusLabel(order.fulfillmentStatus))}</p>
          </div>
          <span class="tag ${residual > 0 ? "tag-amber" : "tag-green"}">${residual > 0 ? `${t("accountingPending")} ${formatMoney(residual)}` : t("accountingPaidLabel")}</span>
        </div>
        <div class="accounting-status-note ${accounting.sourcedFromShopify ? "is-shopify" : ""}">
          ${accounting.sourcedFromShopify ? t("accountingShopifySettled") : t("accountingManualPending")}
        </div>
        <div class="accounting-grid">
          <label class="field">
            <span>${t("accountingPaymentMethod")}</span>
            <input class="text-input accounting-input" data-accounting-field="paymentMethod" data-order-id="${order.id}" value="${escapeHtml(accounting.paymentMethod === "—" ? "" : accounting.paymentMethod)}" placeholder="${escapeHtml(order.paymentMethod || t("accountingFromShopify"))}" />
          </label>
          <label class="field">
            <span>${t("accountingDeposit")}</span>
            <input class="text-input accounting-input" data-accounting-field="depositPaid" data-order-id="${order.id}" type="number" min="0" step="0.01" value="${accounting.depositPaid || ""}" />
          </label>
          <label class="field">
            <span>${t("accountingBalance")}</span>
            <input class="text-input accounting-input" data-accounting-field="balancePaid" data-order-id="${order.id}" type="number" min="0" step="0.01" value="${accounting.balancePaid || ""}" />
          </label>
          <div class="accounting-total-box">
            <span>Totale</span>
            <strong>${formatMoney(total)}</strong>
          </div>
        </div>
        <div class="accounting-flags">
          <label><input type="checkbox" data-accounting-field="invoiceRequired" data-order-id="${order.id}" ${accounting.invoiceRequired ? "checked" : ""} /> ${t("accountingInvoiceRequired")}</label>
          <label><input type="checkbox" data-accounting-field="invoiceIssued" data-order-id="${order.id}" ${accounting.invoiceIssued ? "checked" : ""} /> ${t("accountingInvoiceIssued")}</label>
        </div>
        <div class="order-actions">
          <button class="mini-action primary-mini" data-action="save-accounting" data-id="${order.id}">${t("accountingSave")}</button>
          <button class="mini-action" data-action="open-job-from-order" data-id="${order.id}" ${order.convertedJobId ? "" : "disabled"}>${t("openDraft")}</button>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">${t("orderNoOrders")}</div>`;
}

function renderOrders() {
  const openOrders = state.orders.filter((order) => !order.convertedJobId).length;
  const converted = state.orders.filter((order) => order.convertedJobId).length;
  ui.ordersSummary.innerHTML = `
    <article class="stat-card accent-blue">
      <span class="stat-label">${t("orderInboxTitle")}</span>
      <strong>${openOrders}</strong>
      <p>${t("navOrders")}</p>
    </article>
    <article class="stat-card accent-green">
      <span class="stat-label">${t("orderConverted")}</span>
      <strong>${converted}</strong>
      <p>${t("jobsToHandle")}</p>
    </article>
  `;
  ui.ordersList.innerHTML = state.orders.length
    ? state.orders.map((order) => {
      const badge = getOrderStatusBadge(order);
      const insights = deriveOrderInsights(order);
      const mapsUrl = buildMapsDirectionsUrl(insights.address);
      return `
          <article class="order-card ${order.convertedJobId ? "is-converted" : ""}">
            <div class="order-card-head">
              <div>
                <strong>${order.orderNumber}</strong>
                <p>${formatClientName(order.firstName, order.lastName)} · ${order.city || t("orderMissingAddress")}</p>
              </div>
              <span class="tag ${badge.className}">${badge.label}</span>
            </div>
            <div class="order-highlight">
              <div class="order-highlight-main">
                <span>${t("orderMainProduct")}</span>
                <strong>${escapeHtml(insights.mainProduct)}</strong>
                <p>${insights.inferredSqm || "—"} mq · ${escapeHtml(insights.serviceType)} · ${escapeHtml(insights.inferredSurface)}</p>
              </div>
              <div class="order-highlight-side">
                <span>${t("orderAddress")}</span>
                <strong>${escapeHtml(insights.address || t("orderMissingAddress"))}</strong>
                <p>${insights.hasAddress ? t("orderReadyToPlan") : t("orderNeedsReview")}</p>
              </div>
            </div>
            <div class="order-meta-grid">
              <div><span>${t("orderFinancial")}</span><strong>${escapeHtml(getFinancialStatusLabel(order.financialStatus))}</strong></div>
              <div><span>${t("orderFulfillment")}</span><strong>${escapeHtml(getFulfillmentStatusLabel(order.fulfillmentStatus))}</strong></div>
              <div><span>${t("orderSource")}</span><strong>${order.source}</strong></div>
              <div><span>Totale</span><strong>${formatMoney(order.total)}</strong></div>
            </div>
            <div class="insight-grid">
              <div class="info-card compact-card">
                <span>${t("orderMaterials")}</span>
                <strong>${insights.materials.length || 0}</strong>
                <p>${escapeHtml(insights.materials.slice(0, 2).join(" · ") || "—")}</p>
              </div>
              <div class="info-card compact-card">
                <span>${t("orderService")}</span>
                <strong>${escapeHtml(insights.services[0] || insights.serviceType)}</strong>
                <p>${escapeHtml(order.note || "—")}</p>
              </div>
            </div>
            <details class="order-lines">
              <summary>${t("orderSummaryTitle")}</summary>
              <p>${t("orderSummaryText")}</p>
              <ul>${order.lineItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </details>
            <div class="order-actions">
              <button class="mini-action" data-action="open-order-maps" data-id="${order.id}" ${mapsUrl ? "" : "disabled"}>${t("openMaps")}</button>
              <button class="mini-action" data-action="upload-order-photo" data-id="${order.id}">${t("uploadPhoto")}</button>
              <button class="mini-action primary-mini" data-action="${order.convertedJobId ? "open-job-from-order" : "create-job-from-order"}" data-id="${order.id}">${order.convertedJobId ? t("openDraft") : t("orderCreateJob")}</button>
              ${order.source !== "shopify-live" ? `<button class="mini-action danger-button" data-action="delete-order" data-id="${order.id}">${t("deleteOrder")}</button>` : ""}
            </div>
            <div class="order-attachment-strip">
              <span class="panel-eyebrow">${t("orderAttachmentsHint")}</span>
              <div class="attachment-strip-list">${renderAttachmentGrid(order.attachments)}</div>
            </div>
          </article>
        `;
      }).join("")
    : `<div class="empty-state">${t("orderNoOrders")}</div>`;
}

function renderSettings() {
  ui.shopifySettingsForm.storeDomain.value = state.shopifySettings.storeDomain || "";
  ui.shopifySettingsForm.clientId.value = state.shopifySettings.clientId || "";
  ui.shopifySettingsForm.clientSecret.value = state.shopifySettings.clientSecret || "";
  ui.shopifySettingsForm.locationName.value = state.shopifySettings.locationName || "";
  ui.shopifySettingsForm.webhookBaseUrl.value = state.shopifySettings.webhookBaseUrl || "";
}

function renderDashboardFilters() {
  ui.dashboardFilterTags.forEach((button) => button.classList.toggle("is-active", button.dataset.dashboardFilter === state.dashboardFilter));
  ui.calendarCrewTags.forEach((button) => button.classList.toggle("is-active", button.dataset.crewFilter === state.calendarCrew));
  ui.warehouseTags.forEach((button) => button.classList.toggle("is-active", button.dataset.warehouseFilter === state.warehouseFilter));
  ui.crewBoardTags.forEach((button) => button.classList.toggle("is-active", button.dataset.boardCrew === state.crewBoard));
  ui.accountingFilterTags.forEach((button) => button.classList.toggle("is-active", button.dataset.accountingFilter === state.accountingFilter));
}

function render() {
  if (!state.currentUser) return;
  ensureAccessibleView();
  renderStats();
  renderDashboard();
  renderOrders();
  renderCalendar();
  renderJobView();
  renderWarehouse();
  renderCrew();
  renderAccounting();
  renderSettings();
  renderDashboardFilters();
  setView(state.view);
}

async function bootstrapApp() {
  const session = await apiFetch("/api/session");
  if (!session.user) {
    state.currentUser = null;
    updateAuthVisibility();
    return;
  }
  state.currentUser = session.user;
  state.jobs = session.jobs || [];
  state.orders = session.orders || [];
  state.shopifySettings = session.shopifySettings || {};
  state.selectedJobId = state.jobs[0]?.id || null;
  ensureAccessibleView();
  updateAuthVisibility();
  updateCurrentUserUi();
  render();
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(ui.authForm);
  try {
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    ui.authError.classList.add("hidden");
    state.currentUser = data.user;
    state.jobs = data.jobs || [];
    state.orders = data.orders || [];
    state.shopifySettings = data.shopifySettings || {};
    state.selectedJobId = state.jobs[0]?.id || null;
    ensureAccessibleView();
    updateAuthVisibility();
    updateCurrentUserUi();
    render();
  } catch {
    ui.authError.textContent = t("authError");
    ui.authError.classList.remove("hidden");
  }
}

async function handleLogout() {
  await apiFetch("/api/logout", { method: "POST" });
  state.currentUser = null;
  state.jobs = [];
  state.orders = [];
  state.shopifySettings = {};
  ui.authForm.reset();
  updateAuthVisibility();
}

async function importOrdersFromJson() {
  const raw = String(ui.orderImportText.value || "").trim();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.orders = await apiFetch("/api/orders/import", { method: "POST", body: JSON.stringify(parsed) });
    showOrdersMessage(t("orderImportSuccess"), "success");
    ui.orderImportText.value = "";
    render();
  } catch {
    showOrdersMessage(t("orderImportError"), "error");
  }
}

async function loadDemoOrders() {
  const session = await apiFetch("/api/session");
  state.orders = session.orders || [];
  showOrdersMessage(t("orderImportSuccess"), "success");
  render();
}

async function clearNonShopifyOrders() {
  state.orders = await apiFetch("/api/orders/non-shopify", { method: "DELETE" });
  showOrdersMessage(t("orderManualCleared"), "success");
  render();
}

async function syncShopifyOrders() {
  try {
    state.orders = await apiFetch("/api/orders/sync-shopify", { method: "POST" });
    showOrdersMessage(t("orderImportSuccess"), "success");
    render();
  } catch (error) {
    const message = error?.message === "missing_shopify_credentials"
      ? "Inserisci prima dominio Shopify, Client ID e Client secret nelle impostazioni."
      : error?.message === "shopify_sync_failed"
        ? "Sync Shopify fallito. Verifica dominio, credenziali app e permessi read_orders."
        : "Non sono riuscito a sincronizzare gli ordini Shopify.";
    showOrdersMessage(message, "error");
  }
}

async function saveShopifySettings(event) {
  event.preventDefault();
  const payload = {
    storeDomain: ui.shopifySettingsForm.storeDomain.value.trim(),
    clientId: ui.shopifySettingsForm.clientId.value.trim(),
    clientSecret: ui.shopifySettingsForm.clientSecret.value.trim(),
    locationName: ui.shopifySettingsForm.locationName.value.trim(),
    webhookBaseUrl: ui.shopifySettingsForm.webhookBaseUrl.value.trim(),
  };
  state.shopifySettings = await apiFetch("/api/settings/shopify", { method: "POST", body: JSON.stringify(payload) });
  setSettingsStatus(t("settingsSaved"), "success");
}

async function registerShopifyWebhook() {
  try {
    const data = await apiFetch("/api/webhooks/register-shopify", { method: "POST" });
    setSettingsStatus(`${t("webhookReady")} ${data.endpoint || ""}`.trim(), "success");
  } catch (error) {
    const key = error?.message === "missing_webhook_base_url" ? t("webhookHint") : t("webhookFail");
    setSettingsStatus(key, "error");
  }
}

async function saveAccountingForOrder(orderId) {
  const card = document.querySelector(`[data-order-id="${CSS.escape(orderId)}"]`)?.closest(".accounting-card");
  if (!card) return;
  const payload = {
    paymentMethod: card.querySelector('[data-accounting-field="paymentMethod"]')?.value?.trim() || "",
    depositPaid: normalizeNumber(card.querySelector('[data-accounting-field="depositPaid"]')?.value || 0),
    balancePaid: normalizeNumber(card.querySelector('[data-accounting-field="balancePaid"]')?.value || 0),
    invoiceRequired: Boolean(card.querySelector('[data-accounting-field="invoiceRequired"]')?.checked),
    invoiceIssued: Boolean(card.querySelector('[data-accounting-field="invoiceIssued"]')?.checked),
  };
  const order = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/accounting`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.orders = state.orders.map((item) => (item.id === order.id ? order : item));
  renderAccounting();
}

async function uploadAttachment(target, files) {
  if (!files?.length || !target?.id || !target?.type) return;
  const encoded = await Promise.all(
    [...files].map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result || ""),
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })),
  );

  const path = target.type === "job"
    ? `/api/jobs/${encodeURIComponent(target.id)}/attachments`
    : `/api/orders/${encodeURIComponent(target.id)}/attachments`;
  const updated = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify({ attachments: encoded }),
  });

  if (target.type === "job") {
    state.jobs = state.jobs.map((item) => (item.id === updated.id ? updated : item));
    if (state.selectedJobId === updated.id) renderJobView();
    renderCrew();
  } else {
    state.orders = state.orders.map((item) => (item.id === updated.id ? updated : item));
    renderOrders();
  }
}

async function deleteOrder(orderId) {
  await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });
  state.orders = state.orders.filter((item) => item.id !== orderId);
  render();
}

async function deleteJobDirect(jobId) {
  await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });
  state.jobs = state.jobs.filter((job) => job.id !== jobId);
  state.orders = state.orders.map((order) => order.convertedJobId === jobId ? { ...order, convertedJobId: null } : order);
  state.selectedJobId = state.jobs[0]?.id || null;
  render();
}

async function createJobFromOrder(orderId) {
  const data = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/create-job`, { method: "POST" });
  const existingJobIndex = state.jobs.findIndex((job) => job.id === data.job.id);
  if (existingJobIndex >= 0) state.jobs[existingJobIndex] = data.job;
  else state.jobs.unshift(data.job);
  state.orders = state.orders.map((order) => (order.id === data.order.id ? data.order : order));
  state.selectedJobId = data.job.id;
  showOrdersMessage(t("orderCreatedSuccess"), "success");
  setView("job");
  render();
  openJobModal(data.job);
}

function openCrewRouteForFilter(source) {
  const activeCrew = source === "calendar" ? state.calendarCrew : state.crewBoard;
  const jobs = state.jobs
    .filter((job) => (activeCrew === "all" ? true : job.crew === activeCrew))
    .filter((job) => composeAddress(job.address, job.city))
    .sort((a, b) => `${a.installDate || ""} ${a.installTime || ""}`.localeCompare(`${b.installDate || ""} ${b.installTime || ""}`));
  const url = buildCrewRouteUrl(jobs);
  if (url) openExternalUrl(url);
}

async function markWarehouseReady(jobId) {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  job.warehouseStatus = "pronto";
  const saved = await apiFetch("/api/jobs", { method: "POST", body: JSON.stringify(job) });
  state.jobs = state.jobs.map((item) => (item.id === saved.id ? saved : item));
  render();
}

async function markInstallStatus(jobId, status) {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  job.installStatus = status;
  const saved = await apiFetch("/api/jobs", { method: "POST", body: JSON.stringify(job) });
  state.jobs = state.jobs.map((item) => (item.id === saved.id ? saved : item));
  render();
}

async function handleActionClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === "create-job-from-order" && id) {
    await createJobFromOrder(id);
    return;
  }

  if (action === "open-job-from-order" && id) {
    const order = state.orders.find((item) => item.id === id);
    if (order?.convertedJobId) {
      state.selectedJobId = order.convertedJobId;
      setView("job");
      render();
    }
    return;
  }

  if (action === "open-order-maps" && id) {
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;
    const insights = deriveOrderInsights(order);
    openExternalUrl(buildMapsDirectionsUrl(insights.address));
    return;
  }

  if (action === "upload-order-photo" && id) {
    state.pendingAttachmentTarget = { type: "order", id };
    ui.attachmentInput.value = "";
    ui.attachmentInput.click();
    return;
  }

  if (action === "delete-order" && id) {
    await deleteOrder(id);
    return;
  }

  if (!action || !id) return;
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return;

  if (action === "edit-job" || action === "select-job") {
    state.selectedJobId = id;
    setView("job");
    render();
    if (action === "edit-job") openJobModal(job);
    return;
  }

  if (action === "assign-crew") {
    state.selectedJobId = id;
    openJobModal(job);
    return;
  }

  if (action === "open-warehouse") {
    state.selectedJobId = id;
    setView("warehouse");
    render();
    return;
  }

  if (action === "save-accounting") {
    await saveAccountingForOrder(id);
    return;
  }

  if (action === "open-job-card") {
    state.selectedJobId = id;
    setView("job");
    render();
    return;
  }

  if (action === "open-job-maps") {
    openExternalUrl(buildMapsDirectionsUrl(composeAddress(job.address, job.city)));
    return;
  }

  if (action === "open-job-route") {
    openExternalUrl(buildMapsDirectionsUrl(composeAddress(job.address, job.city)));
    return;
  }

  if (action === "call-client") {
    openExternalUrl(buildPhoneUrl(job.phone));
    return;
  }

  if (action === "mail-client") {
    openExternalUrl(buildMailtoUrl(job.email));
    return;
  }

  if (action === "upload-job-photo") {
    state.pendingAttachmentTarget = { type: "job", id };
    ui.attachmentInput.value = "";
    ui.attachmentInput.click();
    return;
  }

  if (action === "delete-job-direct") {
    await deleteJobDirect(id);
    return;
  }

  if (action === "warehouse-ready") {
    await markWarehouseReady(id);
    return;
  }

  if (action === "mark-complete") {
    await markInstallStatus(id, "completata");
    return;
  }

  if (action === "mark-problem") {
    await markInstallStatus(id, "problema");
    return;
  }
}

ui.authForm.addEventListener("submit", handleLogin);
ui.logoutButton.addEventListener("click", handleLogout);
ui.navLinks.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
ui.langButtons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
ui.newJobButtons.forEach((button) => button.addEventListener("click", () => openJobModal()));
ui.quickOrders?.addEventListener("click", () => setView("orders"));
ui.quickCalendar?.addEventListener("click", () => setView("calendar"));
ui.quickWarehouse?.addEventListener("click", () => setView("warehouse"));
ui.calendarRouteButton?.addEventListener("click", () => openCrewRouteForFilter("calendar"));
ui.crewRouteButton?.addEventListener("click", () => openCrewRouteForFilter("crew"));
ui.jobPrevButton?.addEventListener("click", () => {
  const index = getSelectedJobIndex();
  if (index > 0) {
    state.selectedJobId = state.jobs[index - 1].id;
    render();
  }
});
ui.jobNextButton?.addEventListener("click", () => {
  const index = getSelectedJobIndex();
  if (index >= 0 && index < state.jobs.length - 1) {
    state.selectedJobId = state.jobs[index + 1].id;
    render();
  }
});
ui.seedButton?.addEventListener("click", bootstrapApp);
ui.dashboardSearch.addEventListener("input", (event) => {
  state.dashboardSearch = event.target.value;
  renderDashboard();
});
ui.dashboardRefresh?.addEventListener("click", render);
ui.dashboardFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.dashboardFilter = button.dataset.dashboardFilter;
  render();
}));
ui.calendarCrewTags.forEach((button) => button.addEventListener("click", () => {
  state.calendarCrew = button.dataset.crewFilter;
  render();
}));
ui.warehouseTags.forEach((button) => button.addEventListener("click", () => {
  state.warehouseFilter = button.dataset.warehouseFilter;
  render();
}));
ui.crewBoardTags.forEach((button) => button.addEventListener("click", () => {
  state.crewBoard = button.dataset.boardCrew;
  render();
}));
ui.accountingFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.accountingFilter = button.dataset.accountingFilter;
  render();
}));
ui.accountingSearch?.addEventListener("input", (event) => {
  state.accountingSearch = event.target.value;
  renderAccounting();
  renderDashboardFilters();
});
ui.accountingRefresh?.addEventListener("click", renderAccounting);
ui.importOrdersButton.addEventListener("click", importOrdersFromJson);
ui.clearNonShopifyOrdersButton?.addEventListener("click", clearNonShopifyOrders);
ui.loadDemoOrdersButton.addEventListener("click", loadDemoOrders);
ui.syncShopifyOrdersButton.addEventListener("click", syncShopifyOrders);
ui.shopifySettingsForm.addEventListener("submit", saveShopifySettings);
ui.registerWebhookButton?.addEventListener("click", registerShopifyWebhook);
document.body.addEventListener("click", (event) => {
  handleActionClick(event);
});
ui.jobForm.addEventListener("submit", saveJobFromForm);
ui.deleteJobButton.addEventListener("click", deleteCurrentJob);
ui.closeModalButtons.forEach((button) => button.addEventListener("click", closeJobModal));
ui.jobUploadButton?.addEventListener("click", () => {
  const job = getSelectedJob();
  if (!job) return;
  state.pendingAttachmentTarget = { type: "job", id: job.id };
  ui.attachmentInput.value = "";
  ui.attachmentInput.click();
});
ui.attachmentInput?.addEventListener("change", async (event) => {
  if (!state.pendingAttachmentTarget) return;
  await uploadAttachment(state.pendingAttachmentTarget, event.target.files);
  state.pendingAttachmentTarget = null;
  event.target.value = "";
});

setLanguage("it");
bootstrapApp();
