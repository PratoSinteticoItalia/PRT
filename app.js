const APP_SHELL_VERSION = "20260430-generator-page-scroll-71";
const APP_SHELL_VERSION_STORAGE_KEY = "psi-shell-version";
const RDF_PORTAL_URL = "https://rdf.spedisci.online/login";
const crews = ["Alpha", "Beta", "Delta"];
const DEFAULT_CREW_DAILY_CAPACITY = 120;
const COVERAGE_STORAGE_KEY = "pose-installation-coverage-v1";
const PROFIT_SPLIT_STORAGE_KEY = "pose-profit-split-v1";
const SESSION_KEEPALIVE_INTERVAL_MS = 1000 * 20;
const SESSION_REVISION_ENDPOINT = "/api/session/revision";
const SESSION_EVENTS_ENDPOINT = "/api/events";
const SESSION_EVENTS_RECONNECT_BASE_MS = 1200;
const SESSION_EVENTS_RECONNECT_MAX_MS = 20_000;
const SESSION_EVENTS_REFRESH_DEBOUNCE_MS = 900;
const SHOPIFY_AUTO_SYNC_INTERVAL_MS = 1000 * 60 * 5;
const SALES_REQUEST_AUTO_SYNC_INTERVAL_MS = 1000 * 60 * 60;
const COVERAGE_SYNC_DEBOUNCE_MS = 900;
const SALES_PREFILL_STORAGE_KEY = "quote-generator-prefill";
const SALES_BRANDING_STORAGE_KEY = "quote-generator-branding";
const GARDEN_PLANNER_PREFILL_STORAGE_KEY = "garden-planner-quote-bridge-v1";
const SALES_GENERATOR_PLANNER_REPORT_KEY = "quote-generator-planner-report";
const SALES_GENERATOR_FRAME_MIN_HEIGHT = 680;
const SALES_GENERATOR_FRAME_DEFAULT_HEIGHT = 920;
const SALES_GENERATOR_FRAME_MAX_HEIGHT = 24000;
const SW_UPDATE_CHECK_INTERVAL_MS = 1000 * 60 * 10;
const SHELL_PENDING_FAILSAFE_MS = 1000 * 15;
const COVERAGE_MAP_SIZE = { width: 1558, height: 1420 };
const COVERAGE_BOUNDS = { minLon: 2.3, maxLon: 26.3, minLat: 34.2, maxLat: 47.8 };
const COVERAGE_DEFAULT_COLORS = ["#2d6a4f", "#c26c2d", "#3e74d8", "#a74b4b", "#7c5cc4", "#1f7a8c"];
const COVERAGE_REGIONS = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
];
const COVERAGE_CITY_COORDINATES = {
  alessandria: { lat: 44.912, lng: 8.615 },
  ancona: { lat: 43.6158, lng: 13.5189 },
  arezzo: { lat: 43.4633, lng: 11.8796 },
  asti: { lat: 44.9008, lng: 8.2064 },
  aosta: { lat: 45.737, lng: 7.3201 },
  avellino: { lat: 40.9149, lng: 14.7924 },
  bari: { lat: 41.1171, lng: 16.8719 },
  benevento: { lat: 41.1298, lng: 14.7826 },
  bergamo: { lat: 45.6983, lng: 9.6773 },
  bologna: { lat: 44.4949, lng: 11.3426 },
  bolzano: { lat: 46.4983, lng: 11.3548 },
  brindisi: { lat: 40.6327, lng: 17.9418 },
  cagliari: { lat: 39.2238, lng: 9.1217 },
  campobasso: { lat: 41.5595, lng: 14.6688 },
  caserta: { lat: 41.0732, lng: 14.3348 },
  catania: { lat: 37.5079, lng: 15.083 },
  catanzaro: { lat: 38.9098, lng: 16.5877 },
  chiavari: { lat: 44.3173, lng: 9.3224 },
  cosenza: { lat: 39.2983, lng: 16.2537 },
  cuneo: { lat: 44.3845, lng: 7.5427 },
  firenze: { lat: 43.7696, lng: 11.2558 },
  foggia: { lat: 41.4622, lng: 15.5446 },
  forlì: { lat: 44.2226, lng: 12.0408 },
  forli: { lat: 44.2226, lng: 12.0408 },
  frosinone: { lat: 41.6396, lng: 13.3512 },
  genova: { lat: 44.4056, lng: 8.9463 },
  imperia: { lat: 43.889, lng: 8.0393 },
  "la spezia": { lat: 44.1025, lng: 9.8241 },
  "l'aquila": { lat: 42.3498, lng: 13.3995 },
  laquila: { lat: 42.3498, lng: 13.3995 },
  latina: { lat: 41.4676, lng: 12.9037 },
  lecce: { lat: 40.3515, lng: 18.175 },
  livorno: { lat: 43.5485, lng: 10.3106 },
  lucca: { lat: 43.8429, lng: 10.5027 },
  matera: { lat: 40.6663, lng: 16.6043 },
  messina: { lat: 38.1938, lng: 15.554 },
  milano: { lat: 45.4642, lng: 9.19 },
  modena: { lat: 44.6471, lng: 10.9252 },
  monza: { lat: 45.5845, lng: 9.2744 },
  napoli: { lat: 40.8518, lng: 14.2681 },
  novara: { lat: 45.446, lng: 8.621 },
  "novi ligure": { lat: 44.7604, lng: 8.7876 },
  olbia: { lat: 40.9235, lng: 9.4964 },
  padova: { lat: 45.4064, lng: 11.8768 },
  palermo: { lat: 38.1157, lng: 13.3615 },
  parma: { lat: 44.8015, lng: 10.3279 },
  perugia: { lat: 43.1107, lng: 12.3908 },
  pescara: { lat: 42.4618, lng: 14.2161 },
  piacenza: { lat: 45.0526, lng: 9.693 },
  pisa: { lat: 43.7228, lng: 10.4017 },
  potenza: { lat: 40.6401, lng: 15.8051 },
  ragusa: { lat: 36.9269, lng: 14.7255 },
  ravenna: { lat: 44.4184, lng: 12.2035 },
  "reggio calabria": { lat: 38.1113, lng: 15.6473 },
  "reggio emilia": { lat: 44.6983, lng: 10.6312 },
  rimini: { lat: 44.0678, lng: 12.5695 },
  roma: { lat: 41.9028, lng: 12.4964 },
  salerno: { lat: 40.6824, lng: 14.7681 },
  sassari: { lat: 40.7259, lng: 8.5557 },
  savona: { lat: 44.3089, lng: 8.4772 },
  siena: { lat: 43.3188, lng: 11.3308 },
  siracusa: { lat: 37.0755, lng: 15.2866 },
  taranto: { lat: 40.4644, lng: 17.247 },
  tortona: { lat: 44.8976, lng: 8.8637 },
  trapani: { lat: 38.0176, lng: 12.5365 },
  trento: { lat: 46.0748, lng: 11.1217 },
  trieste: { lat: 45.6495, lng: 13.7768 },
  torino: { lat: 45.0703, lng: 7.6869 },
  udine: { lat: 46.0711, lng: 13.2346 },
  varese: { lat: 45.82, lng: 8.8251 },
  venezia: { lat: 45.4408, lng: 12.3155 },
  verona: { lat: 45.4384, lng: 10.9916 },
  vicenza: { lat: 45.5455, lng: 11.5354 },
};
const INVENTORY_CATALOG = [
  { key: "tasso", label: "Tasso", type: "turf", grossPricePerSqm: 2.321 },
  { key: "bonsai", label: "Bonsai", type: "turf", grossPricePerSqm: 3.177 },
  { key: "faggio", label: "Faggio", type: "turf", grossPricePerSqm: 4.113 },
  { key: "betulla", label: "Betulla", type: "turf", grossPricePerSqm: 4.113 },
  { key: "acero", label: "Acero", type: "turf" },
  { key: "cedro", label: "Cedro", type: "turf", grossPricePerSqm: 5.72 },
  { key: "rovere", label: "Rovere", type: "turf", grossPricePerSqm: 5.628 },
  { key: "palma", label: "Palma", type: "turf", grossPricePerSqm: 8.171 },
  { key: "cipresso", label: "Cipresso", type: "turf", grossPricePerSqm: 7.815 },
  { key: "abete", label: "Abete", type: "turf" },
  { key: "ginepro-35", label: "Ginepro 35 mm", type: "turf", grossPricePerSqm: 6.708 },
  { key: "ginepro-45", label: "Ginepro 45 mm", type: "turf", grossPricePerSqm: 7.947 },
  { key: "mogano", label: "Mogano", type: "turf" },
  {
    key: "banda",
    label: "Banda di giunzione",
    type: "material",
    stockMode: "piece",
    unitLabel: "rotoli",
    variantLabel: "Rotolo 0,30 x 25 m",
    preset: { width: 0.3, length: 25 },
  },
  {
    key: "colla",
    label: "Colla",
    type: "material",
    stockMode: "piece",
    unitLabel: "secchi",
    variants: [
      { value: "secchio-6", label: "Secchio 6 kg" },
      { value: "secchio-12", label: "Secchio 12 kg" },
    ],
    defaultVariant: "secchio-6",
  },
  {
    key: "telo",
    label: "Telo isolante",
    type: "material",
    stockMode: "piece",
    unitLabel: "rotoli",
    variantLabel: "Rotolo 2 x 50 m",
    preset: { width: 2, length: 50 },
  },
  {
    key: "picchetti",
    label: "Picchetti",
    type: "material",
    stockMode: "piece",
    unitLabel: "pezzi",
    variantLabel: "Pezzo singolo",
  },
  { key: "decorativi", label: "Elementi decorativi", type: "material" },
];
const ONE_EXPRESS_TARIFFS = window.ONE_EXPRESS_TARIFFS || {
  carrier: "One Express",
  provinces: {},
  provinceNames: {},
  classes: {},
  baselineAreaCm2: 12000,
  standardFootprintCm: { shortSide: 100, longSide: 120 },
  absoluteLimits: { maxShortSide: 160, maxLongSide: 240, maxHeight: 240, maxWeightKg: 1800 },
};
const PALLET_CLASS_ORDER = ["P150", "P300", "P550", "PS550", "P1000"];
const TRAVEL_EXPENSE_TYPES = {
  hotel: { it: "Albergo", en: "Hotel" },
  fuel: { it: "Carburante", en: "Fuel" },
  meal: { it: "Pasto", en: "Meal" },
  toll: { it: "Pedaggio", en: "Toll" },
  other: { it: "Altro", en: "Other" },
};
const roleViews = {
  office: ["dashboard", "orders", "warehouse", "installations", "sales-requests", "sales-generator", "sales-content", "accounting", "profit-split", "shipping", "settings"],
  warehouse: ["warehouse", "shipping"],
  crew: ["installations", "sales-generator"],
};
const NAV_BADGE_DISABLED_VIEWS = new Set(["dashboard", "sales-generator", "profit-split", "settings"]);
const SALES_REQUEST_STATUS_REFERENCE = [
  "follow up eseguito",
  "nuovo contatto",
  "1° contatto",
  "preventivo confermato",
  "ordine eseguito",
  "fare follow up",
  "declinata",
  "campione acquistato",
  "Preventivo inviato",
  "preventivo da inviare",
  "Lead non qualificato",
  "In attesa di risposta",
  "NESSUNA RISPOSTA",
  "RICONTATTATO",
  "da richiamare",
  "Chiamare",
  "Email",
  "email inviata",
];
const SALES_REQUEST_ASSIGNMENT_REFERENCE = ["Ivan", "Gabriele"];
const SALES_REQUEST_FIRST_CONTACT_START_HOUR = 8;
const SALES_REQUEST_FIRST_CONTACT_END_HOUR = 20;
const SALES_REQUEST_FIRST_CONTACT_SENT_STATUS = "1° contatto";
const SALES_REQUEST_FIRST_CONTACT_QUEUED_STATUS = "da richiamare";

const translations = {
  it: {
    dashboard: "Dashboard",
    orders: "Inbox Ordini",
    warehouse: "Inventario",
    installations: "Pose",
    accounting: "Contabilità",
    "profit-split": "Conti posa",
    shipping: "Logistica",
    settings: "Impostazioni",
    office: "Ufficio",
    warehouseRole: "Inventario",
    crewRole: "Squadra",
    paid: "Pagato",
    pending: "In attesa",
    fulfilled: "Evaso",
    unfulfilled: "Da evadere",
    partial: "Parziale",
    toPrepare: "Da preparare",
    preparing: "In preparazione",
    ready: "Pronto",
    blocked: "Bloccato",
    toPlan: "Da pianificare",
    scheduled: "Programmato",
    inProgress: "In corso",
    completed: "Completato",
    issue: "Problema",
    pickup: "Ritiro",
    courier: "Corriere",
    van: "Furgone",
    undefined: "Da definire",
    supply: "Solo fornitura",
    supplyInstall: "Fornitura + posa",
    noSelection: "Seleziona un ordine",
    activeUser: "Utente attivo",
    localPortal: "Prato Sintetico Italia",
    newOrder: "Nuovo ordine",
    reloadData: "Ricarica dati",
    logout: "Esci",
    focusOperational: "Focus operativo",
    singleOrder: "Ordine unico",
    focusCopy: "Inbox, inventario, squadra, contabilità e logistica lavorano sullo stesso ordine senza doppi inserimenti.",
    actionsNow: "Le tue 3 azioni adesso",
    quickAlerts: "Alert rapidi",
    priorityOrders: "Ordini prioritari",
    immediateActions: "Azioni immediate",
    openOrders: "Apri ordini",
    openWarehouse: "Apri inventario",
    openInstallations: "Apri pose",
    openAccounting: "Apri contabilità",
    shopifyOffice: "Shopify + ufficio",
    routeOffice: "Instradamento ufficio",
    routeOfficeCopy: "Trascina gli ordini nelle colonne giuste oppure usa i pulsanti rapidi sulle card.",
    newFlow: "Da valutare",
    warehouseFlow: "Inventario",
    installationFlow: "Posa confermata",
    dragOrdersHere: "Trascina qui gli ordini da inviare a questo flusso.",
    noOrdersHere: "Nessun ordine in questa colonna.",
    savePreparation: "Salva preparazione",
    sendToWarehouse: "Invia a magazzino",
    sendToInstall: "Invia a posa",
    removeFromFlow: "Rimuovi dal flusso",
    routeWarehouseShort: "Inventario",
    routeInstallShort: "Posa",
    routeClearShort: "Togli",
    allCrews: "Tutte le squadre",
    crewViewCopy: "Vista operativa per ufficio e squadra, senza installazione obbligatoria su PC.",
    prepareBy: "Preparare entro",
    routeWarehouseStatusOn: "Inviato al magazzino",
    routeWarehouseStatusOff: "Non ancora inviato",
    routeInstallStatusOn: "Inviato alla posa",
    routeInstallStatusOff: "Non ancora inviato",
    uploadAttachment: "Carica allegato",
    uploadPhoto: "Carica foto",
    syncShopify: "Sincronizza Shopify",
    importJson: "Importa JSON",
    clearManual: "Pulisci manuali",
    all: "Tutti",
    complete: "Da completare",
    installationShort: "Posa",
    orderItems: "Articoli ordine",
    officePreparation: "Preparazione ufficio",
    officePreparationCopy: "Seleziona cosa il magazzino deve davvero preparare per questo ordine.",
    officeOperations: "Operatività ufficio",
    orderAttachments: "Allegati ordine",
    edit: "Modifica",
    customer: "Cliente",
    product: "Prodotto",
    payment: "Pagamento",
    fulfillment: "Evasione",
    officeStatus: "Stato ufficio",
    jobType: "Tipo lavoro",
    materials: "Materiali",
    paymentMethod: "Metodo pagamento",
    officeNote: "Nota ufficio",
    nextStep: "Prossimo passo",
    shippingFlow: "Flusso magazzino",
    installFlow: "Flusso posa",
    included: "Da preparare",
    excluded: "Escluso",
    prepQty: "Quantità da preparare",
    warehouseNoteLabel: "Nota per il magazzino",
    noPhysicalPrep: "Nessuna riga fisica disponibile da preparare.",
    noOrdersAvailable: "Nessun ordine disponibile.",
    accountingSummary: "Riepilogo economico",
    shopifyCollected: "Incassato su Shopify",
    internalRegistered: "Registrato internamente",
    realResidual: "Residuo reale",
    accountingRead: "Lettura contabile",
    accountingOpen: "Saldo aperto",
    accountingOk: "Regolare",
    paidOnShopify: "Pagato online su Shopify",
    toRegisterInternally: "Da registrare internamente",
    openBalanceOrders: "ordini con residuo aperto",
    invoiceOrders: "ordini con fattura ancora da emettere",
    settledOrders: "ordini già chiusi contabilmente",
    orderSnapshot: "Colpo d'occhio ordine",
    officeChecklist: "Checklist ufficio",
    selectedLines: "Righe selezionate",
    routeStatus: "Instradamento",
    shippingData: "Dati spedizione",
    actionGuide: "Guida rapida",
    shopifyMethodFallback: "Checkout Shopify",
    methodUnavailable: "Metodo non disponibile",
    shopifyPaymentCaptured: "Pagamento già incassato su Shopify",
    internalAccountingPending: "Registrazione interna facoltativa o da completare",
    accountingListTitle: "Ordini da seguire",
    accountingDetailTitle: "Lettura economica ordine",
    paymentOverview: "Riepilogo pagamenti",
    realOpenBalance: "Residuo effettivo",
    shopifyStatus: "Stato Shopify",
    officeRouting: "Flusso ufficio",
    orderSummary: "Sintesi ordine",
    readyForWarehouse: "Pronto per magazzino",
    readyForInstall: "Pronto per posa",
    needsAddress: "Indirizzo da completare",
    needsPrepSelection: "Seleziona cosa preparare",
    needsCrewAndDate: "Assegna squadra e data",
    noActionRequired: "Ordine allineato",
    collectedOnline: "Incassato online",
    registeredManual: "Registrato a mano",
    invoiceState: "Stato fattura",
    invoiceRequested: "Fattura richiesta",
    invoiceNotRequested: "Fattura non richiesta",
    invoiceIssued: "Fattura emessa",
    invoiceNotIssued: "Fattura non emessa",
    fullySettled: "Saldato",
    toBeCollected: "Da incassare",
    piecesInOrder: "Pezzi ordine",
    officePanelCopy: "Qui l'ufficio decide rapidamente cosa fare con l'ordine, cosa preparare e dove instradarlo.",
    searchOrderPayment: "Cerca cliente, ordine o pagamento",
    carrierEstimate: "Stima vettore",
    volumetricWeight: "Peso volumetrico",
    realWeight: "Peso reale",
    billableWeight: "Peso tassabile",
    estimatedCost: "Costo stimato",
    noRateConfigured: "Inserisci i noli del vettore nelle impostazioni per ottenere la stima.",
    pricingSettingsHint: "Configura il vettore e le fasce nolo nelle impostazioni.",
    shipmentReadiness: "Lettura logistica",
    ddtReady: "DDT pronto",
    fillPalletData: "Compila bancale e peso per la stima.",
    carrierConfigured: "Vettore configurato",
    carrierToConfigure: "Vettore da configurare",
    shippingAddress: "Indirizzo di spedizione",
    shipmentState: "Stato spedizione",
    goodsReady: "Merce pronta",
    shipped: "Evaso",
    carrierPassed: "Ritiro / affidamento completato",
    trackingNumber: "Tracking",
    saveShipping: "Salva spedizione",
    trackingHint: "Inserisci il tracking generato dal portale del corriere",
    markReady: "Pronto al ritiro/spedizione",
    waitingCarrier: "In attesa del corriere",
    demoAccess: "Accessi demo",
    authTitle: "Portale Operativo",
    authSubtitle: "Ordini Shopify, magazzino, squadre di posa e contabilità in un unico pannello.",
    emailLabel: "Email",
    passwordLabel: "Password",
    login: "Accedi",
    physicalStock: "Inventario fisico",
    stockFlowTitle: "Giacenze, residui e fabbisogni",
    warehouseGuideTitle: "Come caricare le giacenze iniziali",
    warehouseGuideCopy: "Seleziona un modello o un articolo, inserisci quanti pezzi fisici hai in magazzino e, per i prati, indica larghezza e lunghezza del rotolo o del residuo. Gli ordini Shopify scaleranno il fabbisogno aperto per aiutarti a capire cosa manca.",
    shippingTitle: "Logistica, DDT e bancali",
    shippingSearch: "Cerca ordine, cliente, vettore o tipo spedizione",
    salesRequestsTitle: "Richieste Preventivo",
    salesRequestsSubtitle: "Gestisci richieste commerciali e prepara il passaggio verso il generatore.",
    salesGeneratorTitle: "Generatore Preventivi",
    salesGeneratorSubtitle: "Usa il preventivatore integrato e precompila i dati partendo da una richiesta selezionata.",
    salesGeneratorFreeQuote: "Preventivo libero",
    salesGeneratorUseSelectedRequest: "Usa richiesta selezionata",
    salesGeneratorFreeModeTitle: "Preventivo libero attivo",
    salesGeneratorFreeModeCopy: "Compila il preventivo senza prefill automatico. Puoi riattivare in qualsiasi momento la richiesta selezionata.",
    salesContentTitle: "Contenuti e Documentazione",
    salesContentSubtitle: "Raccogli materiali utili per vendita, preventivi e documentazione commerciale.",
    orderRadar: "Radar ordine",
    customerData: "Dati cliente",
    fulfillmentRoute: "Percorso ordine",
    prepIncluded: "Preparazione selezionata",
    attachmentsCount: "Allegati",
    officeActionsCopy: "Qui l'ufficio decide in modo rapido cosa manca, dove instradare l'ordine e cosa il magazzino deve davvero preparare.",
    importedFromShopify: "Importato da Shopify",
    importShopifyPayment: "Importa pagamento Shopify",
    shopifyImportedSuccess: "Pagamento Shopify importato nella contabilità interna.",
    noShopifyPaymentToImport: "Questo ordine non risulta ancora pagato completamente su Shopify.",
    accountingDetailSubtitle: "Qui controlli incassi, fattura e residuo reale senza perdere il collegamento con Shopify.",
    orderNotes: "Note ordine",
    noOrderNotes: "Nessuna nota cliente o interna.",
    portalSubtitle: "Portale operativo",
    mobileMenuTitle: "Menu operativo",
    operationsSection: "Operativo",
    salesSection: "Vendite",
    adminSection: "Amministrazione",
    "sales-requests": "Richieste",
    "sales-generator": "Generatore",
    "sales-content": "Contenuti",
    topbarSearch: "Cerca ordini, clienti, prodotti...",
    ordersSubtitle: "Ordini Shopify sincronizzati e in lavorazione",
    installationsCalendarTitle: "Calendario Pose",
    installationsWeekSubtitle: "Settimana operativa squadre",
    previousWeek: "← Sett. prec.",
    nextWeek: "Sett. succ. →",
    travelExpensesTitle: "Costi trasferta squadra",
    travelExpensesCopy: "Registra spese vive di cantiere collegate a questo ordine.",
    expenseCategory: "Categoria",
    expenseAmount: "Importo",
    expenseDate: "Data spesa",
    expenseNote: "Nota spesa",
    addExpense: "Aggiungi spesa",
    syncing: "Sincronizzo...",
    syncingShopify: "Sincronizzo Shopify...",
    shopifySynced: "Ordini Shopify sincronizzati.",
    addressIncomplete: "Indirizzo da completare",
    provinceIncomplete: "Provincia da completare",
    phoneIncomplete: "Telefono da completare",
    phoneNotice: "Preavviso telefonico",
    selectedOrder: "Ordine selezionato",
    primaryProduct: "Prodotto principale",
    gettingStarted: "Come partire",
    loadStartingStock: "Carica le giacenze iniziali",
    startingStockExample: "Esempio: Betulla 30 mm · 4 pezzi da 2x25 oppure 12 colli di colla",
    installationPlanningDetail: "Dettaglio pianificazione ordine",
    installationDatePending: "Data da definire",
    timePending: "Ora da definire",
    updateNeeded: "Da aggiornare",
    palletLabel: "Bancale",
  },
  en: {
    dashboard: "Dashboard",
    orders: "Order Inbox",
    warehouse: "Inventory",
    installations: "Installations",
    accounting: "Accounting",
    "profit-split": "Install splits",
    shipping: "Shipping",
    settings: "Settings",
    office: "Office",
    warehouseRole: "Inventory",
    crewRole: "Crew",
    paid: "Paid",
    pending: "Pending",
    fulfilled: "Fulfilled",
    unfulfilled: "Unfulfilled",
    partial: "Partial",
    toPrepare: "To prepare",
    preparing: "Preparing",
    ready: "Ready",
    blocked: "Blocked",
    toPlan: "To plan",
    scheduled: "Scheduled",
    inProgress: "In progress",
    completed: "Completed",
    issue: "Issue",
    pickup: "Pickup",
    courier: "Courier",
    van: "Van",
    undefined: "To define",
    supply: "Supply only",
    supplyInstall: "Supply + install",
    noSelection: "Select an order",
    activeUser: "Active user",
    localPortal: "Prato Sintetico Italia",
    newOrder: "New order",
    reloadData: "Reload data",
    logout: "Log out",
    focusOperational: "Operational focus",
    singleOrder: "Single order flow",
    focusCopy: "Inbox, warehouse, crew, accounting and shipping all work on the same order without duplicate entries.",
    actionsNow: "Your 3 actions now",
    quickAlerts: "Quick alerts",
    priorityOrders: "Priority orders",
    immediateActions: "Immediate actions",
    openOrders: "Open orders",
    openWarehouse: "Open warehouse",
    openInstallations: "Open installations",
    openAccounting: "Open accounting",
    shopifyOffice: "Shopify + office",
    routeOffice: "Office routing",
    routeOfficeCopy: "Drag orders into the right columns or use quick actions on the cards.",
    newFlow: "To review",
    warehouseFlow: "Warehouse",
    installationFlow: "Confirmed install",
    dragOrdersHere: "Drag orders here to send them to this workflow.",
    noOrdersHere: "No orders in this column.",
    savePreparation: "Save prep",
    sendToWarehouse: "Send to warehouse",
    sendToInstall: "Send to install",
    removeFromFlow: "Remove from flow",
    routeWarehouseShort: "Warehouse",
    routeInstallShort: "Install",
    routeClearShort: "Remove",
    allCrews: "All crews",
    crewViewCopy: "Operational view for office and crew, without mandatory PC installation.",
    prepareBy: "Prepare by",
    routeWarehouseStatusOn: "Sent to warehouse",
    routeWarehouseStatusOff: "Not sent yet",
    routeInstallStatusOn: "Sent to install",
    routeInstallStatusOff: "Not sent yet",
    uploadAttachment: "Upload attachment",
    uploadPhoto: "Upload photo",
    syncShopify: "Sync Shopify",
    importJson: "Import JSON",
    clearManual: "Clear manual",
    all: "All",
    complete: "To complete",
    installationShort: "Install",
    orderItems: "Order items",
    officePreparation: "Office preparation",
    officePreparationCopy: "Choose exactly what warehouse must prepare for this order.",
    officeOperations: "Office operations",
    orderAttachments: "Order attachments",
    edit: "Edit",
    customer: "Customer",
    product: "Product",
    payment: "Payment",
    fulfillment: "Fulfillment",
    officeStatus: "Office status",
    jobType: "Job type",
    materials: "Materials",
    paymentMethod: "Payment method",
    officeNote: "Office note",
    nextStep: "Next step",
    shippingFlow: "Warehouse flow",
    installFlow: "Install flow",
    included: "To prepare",
    excluded: "Excluded",
    prepQty: "Qty to prepare",
    warehouseNoteLabel: "Warehouse note",
    noPhysicalPrep: "No physical line available for preparation.",
    noOrdersAvailable: "No orders available.",
    accountingSummary: "Accounting summary",
    shopifyCollected: "Collected on Shopify",
    internalRegistered: "Registered internally",
    realResidual: "Actual residual",
    accountingRead: "Accounting reading",
    accountingOpen: "Open balance",
    accountingOk: "In order",
    paidOnShopify: "Paid online on Shopify",
    toRegisterInternally: "To register internally",
    openBalanceOrders: "orders with open residual",
    invoiceOrders: "orders still waiting for invoice",
    settledOrders: "orders already closed in accounting",
    orderSnapshot: "Order snapshot",
    officeChecklist: "Office checklist",
    selectedLines: "Selected lines",
    routeStatus: "Routing",
    shippingData: "Shipping data",
    actionGuide: "Quick guide",
    shopifyMethodFallback: "Shopify checkout",
    methodUnavailable: "Method unavailable",
    shopifyPaymentCaptured: "Payment already collected on Shopify",
    internalAccountingPending: "Internal accounting optional or still to complete",
    accountingListTitle: "Orders to follow",
    accountingDetailTitle: "Order financial readout",
    paymentOverview: "Payment overview",
    realOpenBalance: "Actual open balance",
    shopifyStatus: "Shopify status",
    officeRouting: "Office routing",
    orderSummary: "Order summary",
    readyForWarehouse: "Ready for warehouse",
    readyForInstall: "Ready for installation",
    needsAddress: "Address must be completed",
    needsPrepSelection: "Select what must be prepared",
    needsCrewAndDate: "Assign crew and date",
    noActionRequired: "Order aligned",
    collectedOnline: "Collected online",
    registeredManual: "Registered manually",
    invoiceState: "Invoice status",
    invoiceRequested: "Invoice requested",
    invoiceNotRequested: "Invoice not requested",
    invoiceIssued: "Invoice issued",
    invoiceNotIssued: "Invoice not issued",
    fullySettled: "Settled",
    toBeCollected: "To be collected",
    piecesInOrder: "Order pieces",
    officePanelCopy: "Office decides here what happens next, what warehouse must prepare, and where the order goes.",
    searchOrderPayment: "Search customer, order or payment",
    carrierEstimate: "Carrier estimate",
    volumetricWeight: "Volumetric weight",
    realWeight: "Actual weight",
    billableWeight: "Billable weight",
    estimatedCost: "Estimated cost",
    noRateConfigured: "Enter your carrier rates in settings to get an estimate.",
    pricingSettingsHint: "Configure carrier and freight bands in settings.",
    shipmentReadiness: "Shipping readiness",
    ddtReady: "DDT ready",
    fillPalletData: "Fill pallet data and weight to get an estimate.",
    carrierConfigured: "Configured carrier",
    carrierToConfigure: "Carrier to configure",
    shippingAddress: "Shipping address",
    shipmentState: "Shipping state",
    goodsReady: "Goods ready",
    shipped: "Shipped",
    carrierPassed: "Pickup / handoff completed",
    trackingNumber: "Tracking",
    saveShipping: "Save shipping",
    trackingHint: "Enter the tracking generated in the carrier portal",
    markReady: "Ready for pickup/shipment",
    waitingCarrier: "Waiting for carrier",
    demoAccess: "Demo access",
    authTitle: "Operations portal",
    authSubtitle: "Shopify orders, warehouse, install crews and accounting in one panel.",
    emailLabel: "Email",
    passwordLabel: "Password",
    login: "Log in",
    physicalStock: "Physical stock",
    stockFlowTitle: "Stock, offcuts and demand",
    warehouseGuideTitle: "How to load starting stock",
    warehouseGuideCopy: "Select a model or item, enter how many physical pieces are in stock and, for turf, specify roll or offcut width and length. Shopify orders will subtract open demand so you can understand what is missing.",
    shippingTitle: "Logistics, DDT and pallets",
    shippingSearch: "Search order, customer, carrier or shipment type",
    salesRequestsTitle: "Quote Requests",
    salesRequestsSubtitle: "Manage sales requests and move them into the quote generator.",
    salesGeneratorTitle: "Quote Generator",
    salesGeneratorSubtitle: "Use the integrated quote tool and prefill it from a selected request.",
    salesGeneratorFreeQuote: "Free quote",
    salesGeneratorUseSelectedRequest: "Use selected request",
    salesGeneratorFreeModeTitle: "Free quote mode active",
    salesGeneratorFreeModeCopy: "Build the quote without automatic prefill. You can re-enable the selected request at any time.",
    salesContentTitle: "Content and Documentation",
    salesContentSubtitle: "Collect useful sales documents, resources, and shared material.",
    orderRadar: "Order radar",
    customerData: "Customer details",
    fulfillmentRoute: "Order route",
    prepIncluded: "Selected prep",
    attachmentsCount: "Attachments",
    officeActionsCopy: "Here the office decides quickly what is missing, where the order goes and what the warehouse must actually prepare.",
    importedFromShopify: "Imported from Shopify",
    importShopifyPayment: "Import Shopify payment",
    shopifyImportedSuccess: "Shopify payment imported into internal accounting.",
    noShopifyPaymentToImport: "This order is not fully paid on Shopify yet.",
    accountingDetailSubtitle: "Control collections, invoice and real balance without losing the Shopify link.",
    orderNotes: "Order notes",
    noOrderNotes: "No customer or internal note.",
    portalSubtitle: "Operations portal",
    mobileMenuTitle: "Operations menu",
    operationsSection: "Operations",
    salesSection: "Sales",
    adminSection: "Administration",
    "sales-requests": "Requests",
    "sales-generator": "Generator",
    "sales-content": "Content",
    topbarSearch: "Search orders, customers, products...",
    ordersSubtitle: "Shopify orders synced and in progress",
    installationsCalendarTitle: "Installation calendar",
    installationsWeekSubtitle: "Crew operating week",
    previousWeek: "← Prev. week",
    nextWeek: "Next week →",
    travelExpensesTitle: "Crew travel expenses",
    travelExpensesCopy: "Log travel costs associated with this order.",
    expenseCategory: "Category",
    expenseAmount: "Amount",
    expenseDate: "Expense date",
    expenseNote: "Expense note",
    addExpense: "Add expense",
    syncing: "Syncing...",
    syncingShopify: "Syncing Shopify...",
    shopifySynced: "Shopify orders synced.",
    addressIncomplete: "Address to complete",
    provinceIncomplete: "Province missing",
    phoneIncomplete: "Phone missing",
    phoneNotice: "Phone notice",
    selectedOrder: "Selected order",
    primaryProduct: "Main product",
    gettingStarted: "How to start",
    loadStartingStock: "Load starting stock",
    startingStockExample: "Example: Betulla 30 mm · 4 pieces 2x25 or 12 glue buckets",
    installationPlanningDetail: "Installation planning detail",
    installationDatePending: "Date to define",
    timePending: "Time to define",
    updateNeeded: "To update",
    palletLabel: "Pallet",
  },
};

function getDefaultProfitSplitExpenseLine(overrides = {}) {
  const payer = ["owner", "partner", "shared"].includes(String(overrides.payer || "").trim())
    ? String(overrides.payer || "").trim()
    : "owner";
  return {
    id: String(overrides.id || crypto.randomUUID()),
    label: String(overrides.label ?? ""),
    amount: String(overrides.amount ?? ""),
    payer,
  };
}

function getProfitSplitLegacyExpenseLines(input = {}) {
  const lines = [];
  const legacyRows = [
    {
      amount: input.ownerPaidExpenses,
      payer: "owner",
      label: "Spesa pagata da te",
    },
    {
      amount: input.partnerPaidExpenses,
      payer: "partner",
      label: "Spesa pagata dal collaboratore",
    },
    {
      amount: input.sharedJobCosts,
      payer: "shared",
      label: "Costo condiviso",
    },
  ];
  legacyRows.forEach((row) => {
    const rawAmount = String(row.amount ?? "").trim();
    if (!rawAmount || Math.abs(toNumber(rawAmount || 0)) <= 0) return;
    lines.push(getDefaultProfitSplitExpenseLine(row));
  });
  return lines;
}

function normalizeProfitSplitExpenseLines(lines = [], legacyInput = {}) {
  const sourceLines = Array.isArray(lines) && lines.length
    ? lines
    : getProfitSplitLegacyExpenseLines(legacyInput);
  const normalizedLines = sourceLines.map((line) => getDefaultProfitSplitExpenseLine(line));
  return normalizedLines.length ? normalizedLines : [getDefaultProfitSplitExpenseLine()];
}

function isProfitSplitExpenseLineBlank(line = {}) {
  const label = String(line.label || "").trim();
  const amount = Number(toNumber(line.amount || 0).toFixed(2));
  return !label && Math.abs(amount) <= 0;
}

function addProfitSplitExpenseLine(lines = [], overrides = {}) {
  const normalizedLines = normalizeProfitSplitExpenseLines(lines);
  const nextLine = getDefaultProfitSplitExpenseLine(overrides);
  const blankIndex = normalizedLines.findLastIndex
    ? normalizedLines.findLastIndex((line) => isProfitSplitExpenseLineBlank(line))
    : (() => {
        for (let index = normalizedLines.length - 1; index >= 0; index -= 1) {
          if (isProfitSplitExpenseLineBlank(normalizedLines[index])) return index;
        }
        return -1;
      })();
  if (blankIndex >= 0) {
    normalizedLines[blankIndex] = {
      ...normalizedLines[blankIndex],
      ...nextLine,
      id: normalizedLines[blankIndex].id,
      amount: overrides.amount ?? normalizedLines[blankIndex].amount,
    };
    return normalizedLines;
  }
  return [...normalizedLines, nextLine];
}

function getDefaultProfitSplitDraft() {
  return {
    linkedOrderId: "",
    savedAt: "",
    updatedBy: "",
    jobLabel: "",
    partnerName: "",
    revenue: "",
    partnerDailyFixed: "100",
    partnerDays: "1",
    partnerSharePct: "50",
    expenseLines: [getDefaultProfitSplitExpenseLine()],
    ownerRecovery: "",
    partnerRecovery: "",
    note: "",
  };
}

function normalizeProfitSplitDraft(input = {}) {
  const defaults = getDefaultProfitSplitDraft();
  return {
    linkedOrderId: String(input.linkedOrderId ?? defaults.linkedOrderId),
    savedAt: String(input.savedAt ?? defaults.savedAt),
    updatedBy: String(input.updatedBy ?? defaults.updatedBy),
    jobLabel: String(input.jobLabel ?? defaults.jobLabel),
    partnerName: String(input.partnerName ?? defaults.partnerName),
    revenue: String(input.revenue ?? defaults.revenue),
    partnerDailyFixed: String(input.partnerDailyFixed ?? defaults.partnerDailyFixed),
    partnerDays: String(input.partnerDays ?? defaults.partnerDays),
    partnerSharePct: String(input.partnerSharePct ?? defaults.partnerSharePct),
    expenseLines: normalizeProfitSplitExpenseLines(input.expenseLines, input),
    ownerRecovery: String(input.ownerRecovery ?? defaults.ownerRecovery),
    partnerRecovery: String(input.partnerRecovery ?? defaults.partnerRecovery),
    note: String(input.note ?? defaults.note),
  };
}

function loadProfitSplitDraft() {
  try {
    const raw = window.localStorage.getItem(PROFIT_SPLIT_STORAGE_KEY);
    if (!raw) return normalizeProfitSplitDraft();
    return normalizeProfitSplitDraft(JSON.parse(raw));
  } catch {
    return normalizeProfitSplitDraft();
  }
}

function saveProfitSplitDraft(draft = state?.profitSplitLocalDraft || state?.profitSplitDraft) {
  try {
    window.localStorage.setItem(PROFIT_SPLIT_STORAGE_KEY, JSON.stringify(normalizeProfitSplitDraft(draft)));
  } catch {}
}

function normalizeGardenPlannerMaterialsReference(input = {}) {
  const normalizeString = (value = "") => String(value ?? "").trim();
  const toAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const sections = Array.isArray(input.sections)
    ? input.sections.map((section, index) => ({
        key: normalizeString(section.key) || `planner-materials-${index}`,
        title: normalizeString(section.title || section.cat || section.label),
        subtotal: toAmount(section.subtotal ?? section.sub),
        items: Array.isArray(section.items)
          ? section.items.map((item, itemIndex) => ({
              id: normalizeString(item.id) || `planner-material-${index}-${itemIndex}`,
              name: normalizeString(item.name),
              qty: normalizeString(item.qty || item.qtyLabel || item.quantity),
              cost: toAmount(item.cost),
            })).filter((item) => item.name)
          : [],
      })).filter((section) => section.title && section.items.length)
    : [];
  return {
    showCosts: Boolean(input.showCosts),
    region: normalizeString(input.region || input.pricingRegionLabel),
    totalCost: toAmount(input.totalCost ?? input.materialCostTotal),
    sections,
  };
}

function normalizeGardenPlannerQuoteBridge(input = {}) {
  const payload = input && typeof input.payload === "object" ? input.payload : {};
  const reportHtml = input && typeof input.reportHtml === "object" ? input.reportHtml : {};
  const normalizeString = (value = "") => String(value ?? "").trim();
  return {
    runId: Number(input.runId || Date.now()),
    createdAt: normalizeString(input.createdAt),
    client: normalizeString(input.client || payload.nome),
    address: normalizeString(input.address),
    city: normalizeString(input.city || payload.citta),
    sqmLabel: normalizeString(input.sqmLabel),
    serviceLabel: normalizeString(input.serviceLabel || payload.servizio),
    surfaceLabel: normalizeString(input.surfaceLabel || payload.fondo),
    note: normalizeString(input.note),
    materialHighlights: Array.isArray(input.materialHighlights)
      ? input.materialHighlights.map((item) => normalizeString(item)).filter(Boolean).slice(0, 8)
      : [],
    reportHtml: {
      technical: normalizeString(reportHtml.technical || input.technicalReportHtml),
      client: normalizeString(reportHtml.client || input.clientReportHtml),
    },
    materialsReference: normalizeGardenPlannerMaterialsReference(input.materialsReference),
    payload: {
      nome: normalizeString(payload.nome),
      cognome: normalizeString(payload.cognome),
      citta: normalizeString(payload.citta),
      telefono: normalizeString(payload.telefono),
      email: normalizeString(payload.email),
      mq: payload.mq != null && payload.mq !== "" ? String(payload.mq).trim() : "",
      altezza: normalizeString(payload.altezza),
      servizio: normalizeString(payload.servizio),
      fondo: normalizeString(payload.fondo),
      whatsappTemplate: normalizeString(payload.whatsappTemplate),
    },
  };
}

function loadGardenPlannerQuoteBridge() {
  try {
    const raw = window.localStorage.getItem(GARDEN_PLANNER_PREFILL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeGardenPlannerQuoteBridge(JSON.parse(raw));
  } catch {
    return null;
  }
}

function getGardenPlannerQuoteBridge() {
  const bridge = loadGardenPlannerQuoteBridge();
  const payload = bridge?.payload || {};
  if (!bridge) return null;
  if (!Object.values(payload).some((value) => String(value || "").trim())) return null;
  return bridge;
}

function buildSalesGeneratorPlannerReport(bridge = getGardenPlannerQuoteBridge()) {
  if (!bridge) return null;
  const reportHtml = String(bridge?.reportHtml?.client || bridge?.reportHtml?.technical || "").trim();
  if (!reportHtml) return null;
  return {
    source: "garden-planner",
    runId: Number(bridge.runId || Date.now()),
    title: state.lang === "it" ? "Allegato materiali Garden Planner" : "Garden Planner materials attachment",
    client: String(bridge.client || "").trim(),
    address: String(bridge.address || "").trim(),
    sqmLabel: String(bridge.sqmLabel || "").trim(),
    materialsReference: bridge.materialsReference,
    reportHtml,
  };
}

function readLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const requestedView = String(params.get("view") || "").trim();
  const plannerFlag = String(params.get("planner") || params.get("prefill") || "").trim().toLowerCase();
  return {
    requestedView,
    usePlannerPrefill: plannerFlag === "1" || plannerFlag === "true" || plannerFlag === "garden-planner",
  };
}

const launchParams = readLaunchParams();
let launchParamsApplied = false;

function clearHandledLaunchParams() {
  const url = new URL(window.location.href);
  let changed = false;
  ["view", "planner", "prefill"].forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });
  if (changed) {
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

const state = {
  currentUser: null,
  orders: [],
  inventory: [],
  salesRequests: [],
  salesContents: [],
  salesRequestSourceConfig: null,
  users: [],
  securityEvents: [],
  securityPolicy: {},
  settings: {},
  currentView: "dashboard",
  selectedOrderId: null,
  selectedSalesRequestId: "",
  selectedSalesContentId: "",
  pendingSalesRequestServiceAccountJson: "",
  pendingSalesRequestServiceAccountEmail: "",
  creatingSalesRequest: false,
  creatingSalesContent: false,
  accountingMobilePane: "summary",
  installationMobilePane: "summary",
  lastSalesGeneratorSignature: "",
  lastSalesGeneratorBrandingSignature: "",
  salesGeneratorFreeMode: false,
  salesGeneratorPlannerMode: false,
  lastAccountsManagerSignature: "",
  lang: "it",
  filters: {
    order: "all",
    warehouse: "all",
    installation: "all",
    accounting: "all",
    shipping: "all",
  },
  search: {
    orders: "",
    warehouse: "",
    accounting: "",
    shipping: "",
    salesRequests: "",
    salesContent: "",
  },
  pendingAttachmentTarget: null,
  showOrderImport: false,
  showSalesRequestImport: false,
  shellPending: true,
  syncInProgress: false,
  navCounts: {},
  orderPage: 1,
  salesRequestPage: 1,
  salesContentPage: 1,
  salesContentCategory: "all",
  sessionRevision: "",
  mobileMenuOpen: false,
  installationWeekOffset: 0,
  selectedInstallationCrew: "",
  coveragePlanner: loadCoveragePlannerState(),
  coverageDrawing: { active: false, points: [] },
  profitSplitLocalDraft: loadProfitSplitDraft(),
  profitSplitDraft: loadProfitSplitDraft(),
  profitSplitContextOrderId: "",
  pendingCurrentViewRefresh: false,
};

let sessionKeepaliveTimer = 0;
let sessionKeepaliveInFlight = false;
let sessionKeepaliveForceQueued = false;
let shellPendingFailsafeTimer = 0;
let sessionEventsSource = null;
let sessionEventsReconnectTimer = 0;
let sessionEventsReconnectBackoffMs = SESSION_EVENTS_RECONNECT_BASE_MS;
let sessionEventsStopped = false;
let sessionEventsRefreshTimer = 0;
let sessionEventsLastRefreshAt = 0;
let shopifyAutoSyncTimer = 0;
let shopifyAutoSyncInFlight = false;
let salesRequestAutoSyncTimer = 0;
let salesRequestSyncInFlight = false;
let salesContentDeleteInFlightId = "";
const salesContentAttachmentDeleteInFlight = new Set();
let reloadAllInFlight = false;
let coverageSyncTimer = 0;
let coverageSyncInFlight = false;
let currentViewRenderFrame = 0;
const searchRenderTimers = Object.create(null);
const shopifyOrderRefreshInFlight = new Set();
const shopifyOrderRefreshAttempted = new Set();
const shopifyOrderRefreshErrors = new Map();
const mobilePillLinkMap = new Map();
let responsiveResizeFrame = 0;
let lastResponsiveIsMobile = window.innerWidth <= 980;

const ui = {
  authScreen: document.getElementById("auth-screen"),
  authForm: document.getElementById("auth-form"),
  authError: document.getElementById("auth-error"),
  appShell: document.getElementById("app-shell"),
  sidebar: document.querySelector(".sidebar"),
  sidebarMobileHead: document.querySelector(".sidebar-mobile-head"),
  sidebarBrandBlock: document.querySelector(".sidebar-brand-block"),
  userCard: document.querySelector(".user-card"),
  mainContent: document.querySelector(".main-content"),
  sidebarOperationalLabel: document.getElementById("sidebar-operational-label"),
  sidebarOperationalNav: document.getElementById("sidebar-operational-nav"),
  sidebarSalesDivider: document.getElementById("sidebar-sales-divider"),
  sidebarSalesLabel: document.getElementById("sidebar-sales-label"),
  sidebarSalesNav: document.getElementById("sidebar-sales-nav"),
  sidebarAdminDivider: document.getElementById("sidebar-admin-divider"),
  sidebarAdminLabel: document.getElementById("sidebar-admin-label"),
  sidebarAdminNav: document.getElementById("sidebar-admin-nav"),
  navLinks: Array.from(document.querySelectorAll(".nav-link")),
  views: Array.from(document.querySelectorAll(".view")),
  viewTitle: document.getElementById("view-title"),
  currentUserName: document.getElementById("current-user-name"),
  currentUserRole: document.getElementById("current-user-role"),
  topbarUserName: document.getElementById("topbar-user-name"),
  topbarUserRole: document.getElementById("topbar-user-role"),
  topbarAvatar: document.querySelector(".topbar-avatar"),
  mobilePillShell: document.getElementById("mobile-pill-shell"),
  mobilePillNav: document.getElementById("mobile-pill-nav"),
  mobilePillTools: document.querySelector(".mobile-pill-tools"),
  mobilePillActions: document.querySelector(".mobile-pill-actions"),
  mobilePillMeta: document.querySelector(".mobile-pill-meta"),
  mobilePillNewOrderButton: document.getElementById("mobile-pill-new-order-button"),
  mobilePillGardenPlannerLink: document.getElementById("mobile-pill-garden-planner-link"),
  mobilePillReloadButton: document.getElementById("mobile-pill-reload-button"),
  mobilePillLogoutButton: document.getElementById("mobile-pill-logout-button"),
  mobileMenuButton: document.getElementById("mobile-menu-button"),
  mobileMenuClose: document.getElementById("mobile-menu-close"),
  mobileLogoutButton: document.getElementById("mobile-logout-button"),
  mobileLogoutInlineButton: document.getElementById("mobile-logout-inline-button"),
  mobileReloadButton: document.getElementById("mobile-reload-button"),
  mobileSidebarBackdrop: document.getElementById("mobile-sidebar-backdrop"),
  langButtons: Array.from(document.querySelectorAll(".lang-btn")),
  logoutButton: document.getElementById("logout-button"),
  reloadButton: document.getElementById("reload-button"),
  newOrderButton: document.getElementById("new-order-button"),
  opsOrdersValue: document.getElementById("ops-orders-value"),
  opsSoldSqmValue: document.getElementById("ops-sold-sqm-value"),
  opsWarehouseValue: document.getElementById("ops-warehouse-value"),
  opsStockValue: document.getElementById("ops-stock-value"),
  opsInstallationsValue: document.getElementById("ops-installations-value"),
  opsAccountingValue: document.getElementById("ops-accounting-value"),
  opsShippingValue: document.getElementById("ops-shipping-value"),
  dashboardActions: document.getElementById("dashboard-actions"),
  dashboardAlerts: document.getElementById("dashboard-alerts"),
  dashboardActivity: document.getElementById("dashboard-activity"),
  dashboardWeekSummary: document.getElementById("dashboard-week-summary"),
  dashboardAccountingSnapshot: document.getElementById("dashboard-accounting-snapshot"),
  dashboardInventorySnapshot: document.getElementById("dashboard-inventory-snapshot"),
  quickViewButtons: Array.from(document.querySelectorAll("[data-quick-view]")),
  ordersSearch: document.getElementById("orders-search"),
  orderFilterTags: Array.from(document.querySelectorAll(".order-filter-tag")),
  orderImportWrap: document.getElementById("order-import-wrap"),
  orderImportText: document.getElementById("order-import-text"),
  orderImportConfirmButton: document.getElementById("confirm-order-import-button"),
  orderImportClearButton: document.getElementById("clear-order-import-button"),
  ordersImportButton: document.getElementById("orders-import-button"),
  ordersSyncButton: document.getElementById("orders-sync-button"),
  ordersClearManualButton: document.getElementById("orders-clear-manual-button"),
  ordersList: document.getElementById("orders-list"),
  ordersPagination: document.getElementById("orders-pagination"),
  ordersStatus: document.getElementById("orders-status"),
  salesRequestsSearch: document.getElementById("sales-requests-search"),
  salesRequestImportButton: document.getElementById("sales-request-import-button"),
  salesRequestImportWrap: document.getElementById("sales-request-import-wrap"),
  salesRequestImportText: document.getElementById("sales-request-import-text"),
  salesRequestImportConfirmButton: document.getElementById("confirm-sales-request-import-button"),
  salesRequestImportClearButton: document.getElementById("clear-sales-request-import-button"),
  salesRequestSpreadsheetInput: document.getElementById("sales-request-spreadsheet-input"),
  salesRequestSheetNameInput: document.getElementById("sales-request-sheet-name-input"),
  salesRequestSourceSummary: document.getElementById("sales-request-source-summary"),
  salesRequestSourceStatus: document.getElementById("sales-request-source-status"),
  salesRequestSourceSaveButton: document.getElementById("sales-request-source-save-button"),
  salesRequestSourceSyncButton: document.getElementById("sales-request-source-sync-button"),
  salesRequestServiceAccountButton: document.getElementById("sales-request-service-account-button"),
  salesRequestClearServiceAccountButton: document.getElementById("sales-request-clear-service-account-button"),
  salesRequestOpenSheetButton: document.getElementById("sales-request-open-sheet-button"),
  salesRequestsStatus: document.getElementById("sales-requests-status"),
  salesRequestsList: document.getElementById("sales-requests-list"),
  salesRequestsPagination: document.getElementById("sales-requests-pagination"),
  salesRequestForm: document.getElementById("sales-request-form"),
  salesRequestNewButton: document.getElementById("sales-request-new-button"),
  salesRequestDeleteButton: document.getElementById("sales-request-delete-button"),
  salesRequestUseGeneratorButton: document.getElementById("sales-request-use-generator-button"),
  salesRequestDetailTitle: document.getElementById("sales-request-detail-title"),
  salesRequestWhatsAppButton: document.getElementById("sales-request-whatsapp-button"),
  salesRequestWhatsAppHint: document.getElementById("sales-request-whatsapp-hint"),
  salesGeneratorContextPanel: document.getElementById("sales-generator-context-panel"),
  salesGeneratorFrame: document.getElementById("sales-generator-frame"),
  salesGeneratorRequestCard: document.getElementById("sales-generator-request-card"),
  salesGeneratorOpenRequestButton: document.getElementById("sales-generator-open-request-button"),
  salesGeneratorPrefillButton: document.getElementById("sales-generator-prefill-button"),
  salesGeneratorFreeQuoteButton: document.getElementById("sales-generator-free-quote-button"),
  salesGeneratorContactPanel: document.getElementById("sales-generator-contact-panel"),
  salesGeneratorContactSummary: document.getElementById("sales-generator-contact-summary"),
  salesGeneratorWhatsAppButton: document.getElementById("sales-generator-whatsapp-button"),
  salesGeneratorEmailButton: document.getElementById("sales-generator-email-button"),
  salesContentSearch: document.getElementById("sales-content-search"),
  salesContentSearchClear: document.getElementById("sales-content-search-clear"),
  salesContentStatus: document.getElementById("sales-content-status"),
  salesContentCategoryFilters: document.getElementById("sales-content-category-filters"),
  salesContentInsights: document.getElementById("sales-content-insights"),
  salesContentList: document.getElementById("sales-content-list"),
  salesContentPagination: document.getElementById("sales-content-pagination"),
  salesContentForm: document.getElementById("sales-content-form"),
  salesContentNewButton: document.getElementById("sales-content-new-button"),
  salesContentDeleteButton: document.getElementById("sales-content-delete-button"),
  salesContentAttachmentButton: document.getElementById("sales-content-attachment-button"),
  salesContentDetailTitle: document.getElementById("sales-content-detail-title"),
  salesContentAttachments: document.getElementById("sales-content-attachments"),
  orderDetailTitle: document.getElementById("order-detail-title"),
  orderDetailBadge: document.getElementById("order-detail-badge"),
  orderDetailSummary: document.getElementById("order-detail-summary"),
  orderDetailSections: Array.from(document.querySelectorAll("#orders .order-detail-panel > .panel-subsection")),
  orderJobHub: document.getElementById("order-job-hub"),
  orderOfficeSummary: document.getElementById("order-office-summary"),
  orderLineList: document.getElementById("order-line-list"),
  orderPrepList: document.getElementById("order-prep-list"),
  savePrepListButton: document.getElementById("save-prep-list-button"),
  orderAttachmentButton: document.getElementById("order-attachment-button"),
  orderAttachments: document.getElementById("order-attachments"),
  warehouseSearch: document.getElementById("warehouse-search"),
  warehouseFilterTags: Array.from(document.querySelectorAll(".warehouse-filter-tag")),
  warehouseList: document.getElementById("warehouse-list"),
  warehouseDetailTitle: document.getElementById("warehouse-detail-title"),
  warehouseDetailFields: document.getElementById("warehouse-detail-fields"),
  inventorySummary: document.getElementById("inventory-summary"),
  inventoryForm: document.getElementById("inventory-form"),
  inventoryJumpButton: document.getElementById("inventory-jump-button"),
  inventoryProductOptions: document.getElementById("inventory-product-options"),
  ddtForm: document.getElementById("ddt-form"),
  ddtItemsPreview: document.getElementById("ddt-items-preview"),
  createDdtButton: document.getElementById("create-ddt-button"),
  warehouseDdtStatus: document.getElementById("warehouse-ddt-status"),
  installationFilterTags: Array.from(document.querySelectorAll(".installation-filter-tag")),
  coveragePanel: document.querySelector("#installations .coverage-panel"),
  coverageTeamList: document.getElementById("coverage-team-list"),
  coverageRegionGrid: document.getElementById("coverage-region-grid"),
  coverageRegionCount: document.getElementById("coverage-region-count"),
  coverageTeamForm: document.getElementById("coverage-team-form"),
  coverageAddTeamButton: document.getElementById("coverage-add-team-button"),
  coverageRemoveTeamButton: document.getElementById("coverage-remove-team-button"),
  coverageActiveTitle: document.getElementById("coverage-active-title"),
  coverageActiveSubtitle: document.getElementById("coverage-active-subtitle"),
  coverageDrawButton: document.getElementById("coverage-draw-button"),
  coverageUndoPointButton: document.getElementById("coverage-undo-point-button"),
  coverageClosePolygonButton: document.getElementById("coverage-close-polygon-button"),
  coverageClearPolygonsButton: document.getElementById("coverage-clear-polygons-button"),
  coverageMapStage: document.getElementById("coverage-map-stage"),
  coverageMapOverlay: document.getElementById("coverage-map-overlay"),
  coverageJobsList: document.getElementById("coverage-jobs-list"),
  coverageJobCount: document.getElementById("coverage-job-count"),
  installationCalendar: document.getElementById("installation-calendar"),
  installationCrewFilters: document.getElementById("installation-crew-filters"),
  installationCapacityHint: document.getElementById("installation-capacity-hint"),
  installationList: document.getElementById("installation-list"),
  installationPrevWeekButton: document.getElementById("installation-prev-week-button"),
  installationNextWeekButton: document.getElementById("installation-next-week-button"),
  installationDetailTitle: document.getElementById("installation-detail-title"),
  installationDetailMeta: document.querySelector("#installations .detail-header .detail-id"),
  installationMobileTabs: Array.from(document.querySelectorAll("#installation-mobile-tabs [data-action='set-installation-pane']")),
  installationDetailSummary: document.getElementById("installation-detail-summary"),
  installationForm: document.getElementById("installation-form"),
  installationCrew: document.querySelector("#installation-form [name='crew']"),
  installationCrewField: document.querySelector("#installation-form [name='crew']")?.closest("label"),
  installationStatusField: document.querySelector("#installation-form [name='status']")?.closest("label"),
  installationSubmitButton: document.querySelector("#installation-form button[type='submit']"),
  installationStatus: document.getElementById("installation-status"),
  installationMapsButton: document.getElementById("installation-maps-button"),
  installationRouteButton: document.getElementById("installation-route-button"),
  installationCallButton: document.getElementById("installation-call-button"),
  installationEmailButton: document.getElementById("installation-email-button"),
  installationAttachmentButton: document.getElementById("installation-attachment-button"),
  installationAttachments: document.getElementById("installation-attachments"),
  installationExpenseForm: document.getElementById("installation-expense-form"),
  installationExpenseStatus: document.getElementById("installation-expense-status"),
  installationExpenseSummary: document.getElementById("installation-expense-summary"),
  installationExpenseList: document.getElementById("installation-expense-list"),
  accountingSearch: document.getElementById("accounting-search"),
  accountingFilterTags: Array.from(document.querySelectorAll(".accounting-filter-tag")),
  accountingList: document.getElementById("accounting-list"),
  accountingModelsOverview: document.getElementById("accounting-models-overview"),
  accountingAnalysis: document.getElementById("accounting-analysis"),
  accountingDetailTitle: document.getElementById("accounting-detail-title"),
  accountingForm: document.getElementById("accounting-form"),
  accountingMeta: document.getElementById("accounting-meta"),
  accountingMobileTabs: Array.from(document.querySelectorAll("#accounting-mobile-tabs [data-action='set-accounting-pane']")),
  accountingPaymentsEditor: document.getElementById("accounting-payments-editor"),
  accountingAddPaymentButton: document.getElementById("accounting-add-payment-button"),
  importShopifyPaymentButton: document.getElementById("import-shopify-payment-button"),
  shippingSearch: document.getElementById("shipping-search"),
  shippingFilterTags: Array.from(document.querySelectorAll(".shipping-filter-tag")),
  shippingList: document.getElementById("shipping-list"),
  shippingStandardDetailPanel: document.getElementById("shipping-standard-detail-panel"),
  shippingDetailTitle: document.getElementById("shipping-detail-title"),
  shippingDetailFields: document.getElementById("shipping-detail-fields"),
  shippingMaterialPreview: document.getElementById("shipping-material-preview"),
  shippingEstimate: document.getElementById("shipping-estimate"),
  shippingForm: document.getElementById("shipping-form"),
  shippingStatus: document.getElementById("shipping-status"),
  shippingAttachmentButton: document.getElementById("shipping-attachment-button"),
  shippingAttachments: document.getElementById("shipping-attachments"),
  sampleDetailPanel: document.getElementById("sample-detail-panel"),
  sampleDetailTitle: document.getElementById("sample-detail-title"),
  sampleDetailFields: document.getElementById("sample-detail-fields"),
  sampleForm: document.getElementById("sample-form"),
  sampleStatus: document.getElementById("sample-status"),
  sampleAttachments: document.getElementById("sample-attachments"),
  sampleOpenRdfButton: document.getElementById("sample-open-rdf-button"),
  sampleUploadLdvButton: document.getElementById("sample-upload-ldv-button"),
  settingsForm: document.getElementById("shopify-settings-form"),
  settingsStatus: document.getElementById("settings-status"),
  topbarGardenPlannerLink: document.getElementById("topbar-garden-planner-link"),
  connectShopifyButton: document.getElementById("connect-shopify-button"),
  mobileGardenPlannerLink: document.getElementById("mobile-garden-planner-link"),
  sidebarMobileTools: document.querySelector(".sidebar-mobile-tools"),
  sidebarCard: document.querySelector(".sidebar-card"),
  securityForm: document.getElementById("security-form"),
  securityStatus: document.getElementById("security-status"),
  securityPolicyNote: document.getElementById("security-policy-note"),
  securityEvents: document.getElementById("security-events"),
  accountsList: document.getElementById("accounts-list"),
  accountCreateForm: document.getElementById("account-create-form"),
  accountsStatus: document.getElementById("accounts-status"),
  crewExpenseMonthlyReport: document.getElementById("crew-expense-monthly-report"),
  profitSplitContextCard: document.getElementById("profit-split-context-card"),
  profitSplitContextStatus: document.getElementById("profit-split-context-status"),
  profitSplitUseSelectedOrderButton: document.getElementById("profit-split-use-selected-order-button"),
  profitSplitSaveOrderButton: document.getElementById("profit-split-save-order-button"),
  profitSplitDetachOrderButton: document.getElementById("profit-split-detach-order-button"),
  profitSplitOpenOrderButton: document.getElementById("profit-split-open-order-button"),
  profitSplitForm: document.getElementById("profit-split-form"),
  profitSplitCrewOptions: document.getElementById("profit-split-crew-options"),
  profitSplitExpenseLines: document.getElementById("profit-split-expense-lines"),
  profitSplitSummary: document.getElementById("profit-split-summary"),
  profitSplitBreakdown: document.getElementById("profit-split-breakdown"),
  profitSplitResetButton: document.getElementById("profit-split-reset-button"),
  authDemo: document.getElementById("auth-demo"),
  orderModal: document.getElementById("order-modal"),
  orderModalTitle: document.getElementById("order-modal-title"),
  orderForm: document.getElementById("order-form"),
  deleteOrderButton: document.getElementById("delete-order-button"),
  closeModalTriggers: Array.from(document.querySelectorAll("[data-close-modal]")),
  attachmentInput: document.getElementById("attachment-input"),
  salesRequestServiceAccountInput: document.getElementById("sales-request-service-account-input"),
  dashboardSubtitle: document.getElementById("dashboard-subtitle"),
};

function t(key) {
  return translations[state.lang]?.[key] || translations.it[key] || key;
}

function undefinedText() {
  return t("undefined");
}

function addressIncompleteText() {
  return t("addressIncomplete");
}

function provinceIncompleteText() {
  return t("provinceIncomplete");
}

function phoneIncompleteText() {
  return t("phoneIncomplete");
}

function phoneNoticeText() {
  return t("phoneNotice");
}

function customerPendingText() {
  return state.lang === "it" ? "Cliente da definire" : "Customer to define";
}

function noPhysicalGoodsText() {
  return state.lang === "it" ? "Nessuna merce fisica" : "No physical goods";
}

function roleLabel(role) {
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole === "warehouse") return t("warehouseRole");
  if (normalizedRole === "crew") return t("crewRole");
  return t("office");
}

function normalizeUserRole(role = "") {
  const normalized = String(role || "").trim().toLowerCase();
  const compact = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!compact) return "office";
  if (/(^|\s)(crew|squadra|team|posa|posatore|posatori|installer|installatori)(\s|$)/.test(compact)) return "crew";
  if (/(^|\s)(warehouse|magazzino|inventory|logistica)(\s|$)/.test(compact)) return "warehouse";
  if (/(^|\s)(office|ufficio|admin|amministrazione|commerciale)(\s|$)/.test(compact)) return "office";
  return "office";
}

function normalizeUserRecord(user = null) {
  if (!user) return null;
  return {
    ...user,
    role: normalizeUserRole(user.role),
    crewName: String(user.crewName || "").trim(),
    crewLogoDataUrl: String(user.crewLogoDataUrl || "").trim(),
  };
}

function staticLabels() {
  return [
    [".auth-brand h1", t("authTitle")],
    [".auth-subtitle", t("authSubtitle")],
    [".auth-demo-label", t("demoAccess")],
    ["#auth-form label:nth-of-type(1) span", t("emailLabel")],
    ["#auth-form label:nth-of-type(2) span", t("passwordLabel")],
    ["#auth-form button[type='submit']", t("login")],
    [".user-card .card-label", t("activeUser")],
    [".topbar-eyebrow", t("localPortal")],
    [".topbar-logo-copy small", t("portalSubtitle")],
    [".sidebar-brand-title", t("portalSubtitle")],
    [".sidebar-mobile-head strong", t("mobileMenuTitle")],
    [".topbar-search input", null, t("topbarSearch")],
    ["#new-order-button", t("newOrder")],
    ["#reload-button", t("reloadData")],
    ["#logout-button", t("logout")],
    ["#mobile-reload-button", t("reloadData")],
    ["#mobile-logout-inline-button", t("logout")],
    ["#mobile-pill-new-order-button", t("newOrder")],
    ["#mobile-pill-reload-button", t("reloadData")],
    ["#mobile-pill-logout-button", t("logout")],
    [".sidebar-card .card-label", t("focusOperational")],
    [".sidebar-card h3", t("singleOrder")],
    [".sidebar-card > p:not(.card-label)", t("focusCopy")],
    ["#dashboard .panel-large .panel-head h3", t("actionsNow")],
    ["#dashboard .panel .panel-head h3", t("quickAlerts")],
    ["#dashboard .dashboard-grid + .dashboard-grid .panel-large .panel-head h3", t("priorityOrders")],
    ["#dashboard .side-stack .panel .panel-head h3", t("immediateActions")],
    ["[data-quick-view='orders']", t("openOrders")],
    ["[data-quick-view='warehouse']", t("openWarehouse")],
    ["[data-quick-view='installations']", t("openInstallations")],
    ["[data-quick-view='accounting']", t("openAccounting")],
    ["#orders .panel-head .panel-eyebrow", t("shopifyOffice")],
    ["#orders .panel-head h3", t("orders")],
    ["#orders .page-header .page-header-sub", t("ordersSubtitle")],
    ["#orders-sync-button", t("syncShopify")],
    ["#orders-import-button", t("importJson")],
    ["#orders-clear-manual-button", t("clearManual")],
    ["#orders-search", null, state.lang === "it" ? "Cerca cliente, ordine, città o prodotto" : "Search customer, order, city or product"],
    ["[data-order-filter='all']", t("all")],
    ["[data-order-filter='attention']", t("complete")],
    ["[data-order-filter='warehouse']", t("warehouse")],
    ["[data-order-filter='installation']", t("installationShort")],
    ["[data-order-filter='fulfilled']", state.lang === "it" ? "Evasi / chiusi" : "Completed / closed"],
    ["#orders .route-subsection h4", t("routeOffice")],
    ["#orders .route-subsection .subsection-copy", t("routeOfficeCopy")],
    ["#orders .panel-subsection h4", t("officeOperations")],
    ["#save-prep-list-button", t("savePreparation")],
    ["#order-attachment-button", t("uploadAttachment")],
    ["#installations .toolbar-row .search-pill", t("crewViewCopy")],
    ["#installations .page-header h1", t("installationsCalendarTitle")],
    ["#installations .page-header .page-header-sub", t("installationsWeekSubtitle")],
    ["#installation-prev-week-button", t("previousWeek")],
    ["#installation-next-week-button", t("nextWeek")],
    ["#installations .installation-expenses-section h4", t("travelExpensesTitle")],
    ["#installations .installation-expenses-section .section-copy", t("travelExpensesCopy")],
    ["#installation-expense-form button[type='submit']", t("addExpense")],
    ["[data-installation-filter='all']", t("allCrews")],
    ["#installation-attachment-button", t("uploadPhoto")],
    ["#warehouse .panel-head .panel-eyebrow", t("physicalStock")],
    ["#warehouse-search", null, state.lang === "it" ? "Cerca prodotto, misura o residuo" : "Search product, size or offcut"],
    ["#warehouse .info-card strong", t("warehouseGuideTitle")],
    ["#warehouse .info-card p", t("warehouseGuideCopy")],
    ["#shipping .panel-head .panel-eyebrow", state.lang === "it" ? "Spedizioni e trasporto" : "Shipping and transport"],
    ["#shipping-search", null, t("shippingSearch")],
    ["[data-shipping-filter='all']", t("all")],
    ["[data-shipping-filter='courier']", state.lang === "it" ? "Corriere" : "Courier"],
    ["[data-shipping-filter='pickup']", state.lang === "it" ? "Ritiro" : "Pickup"],
    ["[data-shipping-filter='van']", state.lang === "it" ? "Furgone" : "Van"],
    ["[data-shipping-filter='sample']", state.lang === "it" ? "Box campioni" : "Sample boxes"],
    ["[data-shipping-filter='completed']", state.lang === "it" ? "Evasi / chiusi" : "Completed / closed"],
    ["#accounting .panel-head .panel-eyebrow", state.lang === "it" ? "Controllo economico" : "Financial control"],
    ["#accounting-search", null, t("searchOrderPayment")],
    ["#import-shopify-payment-button", t("importShopifyPayment")],
  ];
}

function setFieldLabel(form, name, text) {
  const label = form?.querySelector(`[name="${name}"]`)?.closest("label")?.querySelector("span");
  if (label) label.textContent = text;
}

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function setSubheading(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function waitMs(ms = 0) {
  return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function apiFetch(path, options = {}) {
  return fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.message || "request_failed");
      error.status = Number(response.status || 0);
      error.payload = data;
      throw error;
    }
    return data;
  }).catch((error) => {
    if (typeof error?.status === "number") throw error;
    const networkError = new Error("network_error");
    networkError.status = 0;
    networkError.cause = error;
    throw networkError;
  });
}

function buildVersionedUrl(pathname = window.location.pathname, version = APP_SHELL_VERSION) {
  const url = new URL(window.location.href);
  url.pathname = pathname;
  url.searchParams.set("shell", version);
  return `${url.pathname}${url.search}${url.hash}`;
}

async function ensureFreshShellVersion() {
  const currentUrl = new URL(window.location.href);
  const currentShellVersion = String(currentUrl.searchParams.get("shell") || "").trim();
  const storedShellVersion = String(window.localStorage.getItem(APP_SHELL_VERSION_STORAGE_KEY) || "").trim();
  const needsCacheReset = storedShellVersion !== APP_SHELL_VERSION;

  if (needsCacheReset) {
    window.localStorage.setItem(APP_SHELL_VERSION_STORAGE_KEY, APP_SHELL_VERSION);
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
      }
      if ("caches" in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key).catch(() => false)));
      }
    } catch {}
    window.location.replace(buildVersionedUrl(currentUrl.pathname));
    return true;
  }

  if (currentShellVersion !== APP_SHELL_VERSION) {
    window.history.replaceState({}, "", buildVersionedUrl(currentUrl.pathname));
  }
  return false;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const swUrl = `./sw.js?v=${APP_SHELL_VERSION}`;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl).then((registration) => {
      let lastUpdateCheckAt = 0;
      const refreshRegistration = () => {
        const now = Date.now();
        if (now - lastUpdateCheckAt < SW_UPDATE_CHECK_INTERVAL_MS) return;
        lastUpdateCheckAt = now;
        registration.update().catch(() => {});
      };
      window.setTimeout(refreshRegistration, 1200);
      window.addEventListener("focus", refreshRegistration);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") refreshRegistration();
      });
    }).catch((error) => {
      console.error("service_worker_register_failed", error);
    });
  });
}

function setShellPending(active) {
  const next = Boolean(active);
  if (next && state.currentUser) {
    // Never block active operators behind the launch overlay during live usage.
    state.shellPending = false;
    document.body.classList.remove("shell-loading");
    ui.authScreen?.classList.remove("shell-pending");
    ui.appShell?.classList.remove("shell-pending");
    return;
  }
  state.shellPending = next;
  document.body.classList.toggle("shell-loading", next);
  ui.authScreen?.classList.toggle("shell-pending", next);
  ui.appShell?.classList.toggle("shell-pending", next);

  if (shellPendingFailsafeTimer) {
    window.clearTimeout(shellPendingFailsafeTimer);
    shellPendingFailsafeTimer = 0;
  }
  if (!next) return;

  // Failsafe: never leave the app blocked behind launch overlay during active usage.
  shellPendingFailsafeTimer = window.setTimeout(() => {
    shellPendingFailsafeTimer = 0;
    if (!state.shellPending) return;
    if (!state.currentUser) return;
    console.warn("shell_pending_failsafe_released");
    state.shellPending = false;
    document.body.classList.remove("shell-loading");
    ui.authScreen?.classList.remove("shell-pending");
    ui.appShell?.classList.remove("shell-pending");
  }, SHELL_PENDING_FAILSAFE_MS);
}

function updateMobileMenu() {
  state.mobileMenuOpen = false;
  const open = false;
  document.body.classList.toggle("mobile-menu-open", open);
  if (ui.mobileSidebarBackdrop) ui.mobileSidebarBackdrop.classList.toggle("is-visible", open);
  if (ui.mobileMenuButton) {
    ui.mobileMenuButton.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (ui.mobileSidebarBackdrop) {
    ui.mobileSidebarBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }
}

function applyMobileSafeMode() {
  const mobileSafe = window.innerWidth <= 980;
  document.body.classList.toggle("mobile-safe-mode", mobileSafe);
  state.mobileMenuOpen = false;
  updateMobileMenu();
}

function getAllowedViewsForRole(role = state.currentUser?.role || "office") {
  return roleViews[normalizeUserRole(role)] || roleViews.office;
}

function forceMobileVisibility(node, visible, displayValue = "block") {
  if (!node) return;
  if (window.innerWidth <= 980) {
    node.style.setProperty("display", visible ? displayValue : "none", "important");
    node.style.setProperty("visibility", visible ? "visible" : "hidden", "important");
    node.style.setProperty("opacity", visible ? "1" : "0", "important");
    return;
  }
  node.style.removeProperty("display");
  node.style.removeProperty("visibility");
  node.style.removeProperty("opacity");
}

function buildMobilePillButton(sourceButton) {
  const button = document.createElement("button");
  const label = sourceButton.querySelector(".nav-label")?.textContent?.trim() || t(sourceButton.dataset.view);
  const iconMarkup = sourceButton.querySelector(".nav-icon")?.innerHTML || "";
  button.type = "button";
  button.className = "mobile-pill-link";
  button.dataset.view = sourceButton.dataset.view || "";
  if (iconMarkup) {
    const icon = document.createElement("span");
    icon.className = "mobile-pill-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = iconMarkup;
    button.appendChild(icon);
  }
  const copy = document.createElement("span");
  copy.className = "mobile-pill-label";
  copy.textContent = label;
  button.appendChild(copy);
  const badge = document.createElement("span");
  badge.className = "mobile-pill-count-badge";
  badge.hidden = true;
  badge.setAttribute("aria-hidden", "true");
  button.appendChild(badge);
  button.addEventListener("click", () => setView(button.dataset.view));
  return button;
}

function ensureMobilePillShell() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  if (!ui.mobilePillShell) {
    const shell = document.createElement("div");
    shell.id = "mobile-pill-shell";
    shell.className = "mobile-pill-shell hidden";
    shell.setAttribute("aria-hidden", "true");
    topbar.insertAdjacentElement("afterend", shell);
    ui.mobilePillShell = shell;
  }

  if (!ui.mobilePillNav) {
    const nav = document.createElement("nav");
    nav.id = "mobile-pill-nav";
    nav.className = "mobile-pill-nav";
    nav.setAttribute("aria-label", "Navigazione mobile");
    ui.mobilePillShell.appendChild(nav);
    ui.mobilePillNav = nav;
  }

  let tools = ui.mobilePillShell.querySelector(".mobile-pill-tools");
  if (!tools) {
    tools = document.createElement("div");
    tools.className = "mobile-pill-tools mobile-pill-utility";
    ui.mobilePillShell.appendChild(tools);
  }
  ui.mobilePillTools = tools;

  let actions = ui.mobilePillShell.querySelector(".mobile-pill-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "mobile-pill-actions";
    tools.appendChild(actions);
  }
  ui.mobilePillActions = actions;

  let meta = ui.mobilePillShell.querySelector(".mobile-pill-meta");
  if (!meta) {
    meta = document.createElement("div");
    meta.className = "mobile-pill-meta";
    tools.appendChild(meta);
  }
  ui.mobilePillMeta = meta;

  const ensureTool = ({ id, label, type = "button", href = "", className = "mobile-pill-tool", parent = tools }) => {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement(type === "link" ? "a" : "button");
      node.id = id;
      node.className = className;
      if (type === "link") {
        node.href = href;
        node.style.textDecoration = "none";
      } else {
        node.type = "button";
      }
      node.textContent = label;
    }
    if (parent && node.parentElement !== parent) parent.appendChild(node);
    return node;
  };

  ui.mobilePillNewOrderButton ||= ensureTool({
    id: "mobile-pill-new-order-button",
    label: t("newOrder"),
    parent: actions,
  });
  ui.mobilePillGardenPlannerLink ||= ensureTool({
    id: "mobile-pill-garden-planner-link",
    label: "Garden Planner",
    type: "link",
    href: `./garden-planner.html?v=${APP_SHELL_VERSION}&shell=${APP_SHELL_VERSION}`,
    parent: actions,
  });
  ui.mobilePillReloadButton ||= ensureTool({
    id: "mobile-pill-reload-button",
    label: t("reloadData"),
    parent: actions,
  });
  ui.mobilePillLogoutButton ||= ensureTool({
    id: "mobile-pill-logout-button",
    label: t("logout"),
    className: "mobile-pill-tool is-danger",
    parent: meta,
  });

  let langSwitch = ui.mobilePillShell.querySelector(".mobile-pill-lang-switch");
  if (!langSwitch) {
    langSwitch = document.createElement("div");
    langSwitch.className = "lang-switch mobile-pill-lang-switch";
    langSwitch.setAttribute("aria-label", "Language switcher");
    langSwitch.innerHTML = `
      <button class="lang-btn is-active" data-lang="it">IT</button>
      <button class="lang-btn" data-lang="en">EN</button>
    `;
    meta.prepend(langSwitch);
  } else if (langSwitch.parentElement !== meta) {
    meta.prepend(langSwitch);
  }

  if (ui.mobilePillReloadButton && !ui.mobilePillReloadButton.dataset.bound) {
    ui.mobilePillReloadButton.addEventListener("click", reloadAll);
    ui.mobilePillReloadButton.dataset.bound = "true";
  }
  if (ui.mobilePillNewOrderButton && !ui.mobilePillNewOrderButton.dataset.bound) {
    ui.mobilePillNewOrderButton.addEventListener("click", () => openOrderModal(null));
    ui.mobilePillNewOrderButton.dataset.bound = "true";
  }
  if (ui.mobilePillLogoutButton && !ui.mobilePillLogoutButton.dataset.bound) {
    ui.mobilePillLogoutButton.addEventListener("click", async () => {
      await apiFetch("/api/logout", { method: "POST" });
      applySessionPayload({});
      showAuth();
    });
    ui.mobilePillLogoutButton.dataset.bound = "true";
  }

  ui.langButtons = Array.from(document.querySelectorAll(".lang-btn"));
  ui.langButtons.forEach((button) => {
    if (button.dataset.boundLang === "true") return;
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang;
      ui.langButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.lang === state.lang));
      renderCurrentViewOnly(state.currentView);
    });
    button.dataset.boundLang = "true";
  });
}

function ensureMobilePillNav() {
  ensureMobilePillShell();
  if (!ui.mobilePillNav || mobilePillLinkMap.size) return;
  ui.navLinks.forEach((sourceButton) => {
    const view = sourceButton.dataset.view;
    if (!view) return;
    const button = buildMobilePillButton(sourceButton);
    ui.mobilePillNav.appendChild(button);
    mobilePillLinkMap.set(view, button);
  });
}

function getMobilePillButton(view = "") {
  return mobilePillLinkMap.get(view) || null;
}

function syncMobilePillNav() {
  ensureMobilePillNav();
  const mobileSafe = window.innerWidth <= 980;
  if (ui.mobilePillShell) {
    ui.mobilePillShell.hidden = !mobileSafe;
    ui.mobilePillShell.classList.toggle("hidden", !mobileSafe);
    ui.mobilePillShell.setAttribute("aria-hidden", mobileSafe ? "false" : "true");
    ui.mobilePillShell.style.setProperty("display", mobileSafe ? "grid" : "none", "important");
    if (mobileSafe) {
      ui.mobilePillShell.style.setProperty("gap", "6px");
      ui.mobilePillShell.style.setProperty("padding", "0 12px 8px");
      ui.mobilePillShell.style.setProperty("grid-column", "1 / -1", "important");
      ui.mobilePillShell.style.setProperty("grid-row", "2", "important");
      ui.mobilePillShell.style.setProperty("grid-area", "mobile-nav", "important");
      ui.mobilePillShell.style.setProperty("position", "relative");
      ui.mobilePillShell.style.setProperty("z-index", "2");
    } else {
      ui.mobilePillShell.style.removeProperty("gap");
      ui.mobilePillShell.style.removeProperty("padding");
      ui.mobilePillShell.style.removeProperty("grid-column");
      ui.mobilePillShell.style.removeProperty("grid-row");
      ui.mobilePillShell.style.removeProperty("grid-area");
      ui.mobilePillShell.style.removeProperty("position");
      ui.mobilePillShell.style.removeProperty("z-index");
    }
  }
  if (ui.mobilePillNav) {
    ui.mobilePillNav.style.setProperty("display", mobileSafe ? "flex" : "none", "important");
    ui.mobilePillNav.style.setProperty("align-items", "center");
    ui.mobilePillNav.style.setProperty("gap", "8px");
    ui.mobilePillNav.style.setProperty("overflow-x", "auto");
    ui.mobilePillNav.style.setProperty("padding-bottom", mobileSafe ? "2px" : "0");
    if (!mobileSafe) ui.mobilePillNav.scrollLeft = 0;
  }
  if (ui.mobilePillTools) {
    ui.mobilePillTools.style.setProperty("display", mobileSafe ? "grid" : "none", "important");
    ui.mobilePillTools.style.setProperty("gap", mobileSafe ? "6px" : "0");
    ui.mobilePillTools.style.setProperty("padding-top", mobileSafe ? "4px" : "0");
  }
  if (ui.mobilePillActions) {
    ui.mobilePillActions.style.setProperty("display", mobileSafe ? "flex" : "none", "important");
    ui.mobilePillActions.style.setProperty("align-items", "center");
    ui.mobilePillActions.style.setProperty("gap", mobileSafe ? "6px" : "8px");
    ui.mobilePillActions.style.setProperty("flex-wrap", mobileSafe ? "wrap" : "nowrap");
  }
  if (ui.mobilePillMeta) {
    ui.mobilePillMeta.style.setProperty("display", "none", "important");
  }
  ui.navLinks.forEach((sourceButton) => {
    const view = sourceButton.dataset.view;
    const button = getMobilePillButton(view);
    if (!button) return;
    const label = sourceButton.querySelector(".nav-label")?.textContent?.trim() || t(view);
    const copy = button.querySelector(".mobile-pill-label");
    const visible = !sourceButton.hidden && !sourceButton.classList.contains("hidden");
    const count = state.navCounts[view]
      ?? sourceButton.getAttribute("data-count")
      ?? button.getAttribute("data-count")
      ?? "";
    if (copy) copy.textContent = label;
    button.hidden = !visible;
    button.classList.toggle("hidden", !visible);
    button.classList.toggle("is-active", state.currentView === view);
    button.setAttribute("aria-hidden", visible ? "false" : "true");
    button.toggleAttribute("aria-current", state.currentView === view);
    button.setAttribute("data-count", count);
    button.tabIndex = visible ? 0 : -1;
    button.style.setProperty("display", mobileSafe && visible ? "inline-flex" : "none", "important");
    button.style.setProperty("align-items", "center");
    const badge = ensureCountBadge(button, "mobile-pill-count-badge");
    if (badge) {
      badge.hidden = !count;
      badge.textContent = count || "";
    }
  });

  [
    ui.mobilePillNewOrderButton,
    ui.mobilePillGardenPlannerLink,
    ui.mobilePillReloadButton,
    ui.mobilePillLogoutButton,
  ].forEach((node) => {
    if (!node) return;
    const visible = mobileSafe && !node.hidden && !node.classList.contains("hidden");
    node.style.setProperty("display", visible ? "inline-flex" : "none", "important");
    node.style.setProperty("align-items", "center");
    node.style.setProperty("justify-content", "center");
  });

  if (ui.mobileMenuButton) {
    if (mobileSafe) {
      ui.mobileMenuButton.style.setProperty("display", "none", "important");
    } else {
      ui.mobileMenuButton.style.removeProperty("display");
    }
  }
  if (ui.mainContent) {
    if (mobileSafe) {
      ui.mainContent.style.setProperty("grid-column", "1 / -1", "important");
      ui.mainContent.style.setProperty("grid-row", "3", "important");
      ui.mainContent.style.setProperty("grid-area", "main", "important");
    } else {
      ui.mainContent.style.removeProperty("grid-column");
      ui.mainContent.style.removeProperty("grid-row");
      ui.mainContent.style.removeProperty("grid-area");
    }
  }
  if (mobileSafe) {
    const activeButton = getMobilePillButton(state.currentView);
    if (activeButton instanceof HTMLElement) {
      activeButton.scrollIntoView({ block: "nearest", inline: "center", behavior: "auto" });
    }
  }
}

function handleResponsiveResize() {
  const isMobile = window.innerWidth <= 980;
  applyMobileSafeMode();
  updateAccountingPaneVisibility();
  syncMobilePillNav();
  if (isMobile !== lastResponsiveIsMobile && state.currentUser) {
    renderCurrentViewOnly(state.currentView);
  }
  if (!isMobile && state.mobileMenuOpen) {
    state.mobileMenuOpen = false;
    updateMobileMenu();
  }
  lastResponsiveIsMobile = isMobile;
}

function syncSidebarLayout(role = state.currentUser?.role || "office") {
  if (!ui.sidebar) return;
  const normalizedRole = normalizeUserRole(role);
  const mobileSafe = window.innerWidth <= 980;
  const defaultSequence = [
    ui.sidebarMobileHead,
    ui.sidebarBrandBlock,
    ui.userCard,
    ui.sidebarOperationalLabel,
    ui.sidebarOperationalNav,
    ui.sidebarSalesDivider,
    ui.sidebarSalesLabel,
    ui.sidebarSalesNav,
    ui.sidebarAdminDivider,
    ui.sidebarAdminLabel,
    ui.sidebarAdminNav,
    ui.sidebarMobileTools,
    ui.sidebarCard,
  ];
  const officeMobileSequence = [
    ui.sidebarMobileHead,
    ui.sidebarBrandBlock,
    ui.userCard,
    ui.sidebarOperationalLabel,
    ui.sidebarOperationalNav,
    ui.sidebarSalesDivider,
    ui.sidebarSalesLabel,
    ui.sidebarSalesNav,
    ui.sidebarAdminDivider,
    ui.sidebarAdminLabel,
    ui.sidebarAdminNav,
    ui.sidebarMobileTools,
    ui.sidebarCard,
  ];
  const sequence = mobileSafe && normalizedRole === "office" ? officeMobileSequence : defaultSequence;
  sequence.forEach((node) => {
    if (node && node.parentElement === ui.sidebar) {
      ui.sidebar.appendChild(node);
    }
  });
  if (!(mobileSafe && normalizedRole === "office")) return;
  if (ui.sidebar && ui.sidebarAdminDivider) {
    [ui.sidebarSalesDivider, ui.sidebarSalesLabel, ui.sidebarSalesNav].forEach((node) => {
      if (node && node.parentElement === ui.sidebar) {
        ui.sidebar.insertBefore(node, ui.sidebarAdminDivider);
      }
    });
  }
  const officeViews = new Set(roleViews.office);
  ui.navLinks.forEach((button) => {
    if (!officeViews.has(button.dataset.view)) return;
    button.hidden = false;
    button.classList.remove("hidden");
    button.setAttribute("aria-hidden", "false");
    forceMobileVisibility(button, true, "grid");
  });
  [
    [ui.sidebarOperationalLabel, "block"],
    [ui.sidebarOperationalNav, "grid"],
    [ui.sidebarAdminDivider, "block"],
    [ui.sidebarAdminLabel, "block"],
    [ui.sidebarAdminNav, "grid"],
    [ui.sidebarSalesDivider, "block"],
    [ui.sidebarSalesLabel, "block"],
    [ui.sidebarSalesNav, "grid"],
    [ui.sidebarMobileTools, "grid"],
  ].forEach(([node, displayValue]) => {
    if (!node) return;
    node.hidden = false;
    node.classList.remove("hidden");
    forceMobileVisibility(node, true, displayValue);
  });
}

function toNumber(value) {
  const parsed = Number(String(value || "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  const amount = toNumber(value);
  return new Intl.NumberFormat(state.lang === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.lang === "it" ? "it-IT" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthKey(monthKey) {
  if (!monthKey) return "—";
  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) return monthKey;
  const label = new Intl.DateTimeFormat(state.lang === "it" ? "it-IT" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isProfitSplitOrderLinked() {
  return Boolean(String(state.profitSplitContextOrderId || "").trim());
}

function getProfitSplitContextOrder() {
  if (!isProfitSplitOrderLinked()) return null;
  return state.orders.find((order) => order.id === state.profitSplitContextOrderId) || null;
}

function buildProfitSplitOrderLabel(order) {
  if (!order) return "";
  const parts = [getOrderNumber(order), composeClientName(order), order.city].filter((item) => String(item || "").trim());
  return parts.join(" · ");
}

function getStoredProfitSplitForOrder(order) {
  const raw = order?.operations?.installation?.profitSplit;
  if (!raw || typeof raw !== "object") return null;
  return normalizeProfitSplitDraft({
    ...raw,
    linkedOrderId: order.id,
  });
}

function buildProfitSplitDraftForOrder(order, { preferStored = true } = {}) {
  const stored = preferStored ? getStoredProfitSplitForOrder(order) : null;
  if (stored) return stored;
  const localDefaults = normalizeProfitSplitDraft(state.profitSplitLocalDraft);
  return normalizeProfitSplitDraft({
    linkedOrderId: order?.id || "",
    jobLabel: buildProfitSplitOrderLabel(order),
    partnerName: String(order?.operations?.installation?.crew || "").trim(),
    partnerDailyFixed: localDefaults.partnerDailyFixed,
    partnerSharePct: localDefaults.partnerSharePct,
    partnerDays: localDefaults.partnerDays,
  });
}

function persistProfitSplitDraftLocally(draft = state.profitSplitDraft) {
  const normalized = normalizeProfitSplitDraft({
    ...draft,
    linkedOrderId: "",
    savedAt: "",
    updatedBy: "",
  });
  state.profitSplitLocalDraft = normalized;
  saveProfitSplitDraft(normalized);
}

function setProfitSplitContextOrder(orderId, { preferStored = true } = {}) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return false;
  state.selectedOrderId = order.id;
  state.profitSplitContextOrderId = order.id;
  state.profitSplitDraft = buildProfitSplitDraftForOrder(order, { preferStored });
  return true;
}

function restoreProfitSplitLocalDraft() {
  state.profitSplitContextOrderId = "";
  state.profitSplitDraft = normalizeProfitSplitDraft({
    ...state.profitSplitLocalDraft,
    linkedOrderId: "",
    savedAt: "",
    updatedBy: "",
  });
}

function syncProfitSplitDraftAfterInput(nextDraft) {
  state.profitSplitDraft = normalizeProfitSplitDraft(nextDraft);
  if (!isProfitSplitOrderLinked()) {
    persistProfitSplitDraftLocally(state.profitSplitDraft);
  }
}

function getProfitSplitComparablePayload(draft = {}) {
  const normalized = normalizeProfitSplitDraft(draft);
  return JSON.stringify({
    jobLabel: normalized.jobLabel,
    partnerName: normalized.partnerName,
    revenue: normalized.revenue,
    partnerDailyFixed: normalized.partnerDailyFixed,
    partnerDays: normalized.partnerDays,
    partnerSharePct: normalized.partnerSharePct,
    expenseLines: normalizeProfitSplitExpenseLines(normalized.expenseLines).map((line) => ({
      label: String(line.label || ""),
      amount: String(line.amount || ""),
      payer: String(line.payer || "owner"),
    })),
    ownerRecovery: normalized.ownerRecovery,
    partnerRecovery: normalized.partnerRecovery,
    note: normalized.note,
  });
}

function isProfitSplitContextDirty() {
  const order = getProfitSplitContextOrder();
  if (!order) return false;
  const stored = getStoredProfitSplitForOrder(order);
  const baseline = stored || buildProfitSplitDraftForOrder(order, { preferStored: false });
  return getProfitSplitComparablePayload(state.profitSplitDraft) !== getProfitSplitComparablePayload(baseline);
}

function computeProfitSplitScenario(draft = {}) {
  const partnerName = String(draft.partnerName || "").trim();
  const revenue = Number(toNumber(draft.revenue || 0).toFixed(2));
  const partnerDailyFixed = Number(toNumber(draft.partnerDailyFixed || 0).toFixed(2));
  const partnerDays = Math.max(0, Number(toNumber(draft.partnerDays || 0).toFixed(2)));
  const partnerSharePct = Math.min(100, Math.max(0, Number(toNumber(draft.partnerSharePct || 50).toFixed(2))));
  const ownerSharePct = Number((100 - partnerSharePct).toFixed(2));
  const expenseLines = normalizeProfitSplitExpenseLines(draft.expenseLines, draft)
    .map((line) => {
      const payer = ["owner", "partner", "shared"].includes(String(line.payer || "").trim())
        ? String(line.payer || "").trim()
        : "owner";
      const label = String(line.label || "").trim();
      const amountValue = Number(toNumber(line.amount || 0).toFixed(2));
      const fallbackLabel = payer === "partner"
        ? (state.lang === "it" ? "Spesa collaboratore" : "Partner expense")
        : payer === "shared"
          ? (state.lang === "it" ? "Costo condiviso" : "Shared cost")
          : (state.lang === "it" ? "Spesa tua" : "Your expense");
      const isFilled = Boolean(label) || Math.abs(amountValue) > 0;
      return {
        ...line,
        payer,
        label,
        amountValue,
        displayLabel: label || fallbackLabel,
        isFilled,
      };
    });
  const ownerExpenseLines = expenseLines.filter((line) => line.payer === "owner" && line.isFilled);
  const partnerExpenseLines = expenseLines.filter((line) => line.payer === "partner" && line.isFilled);
  const sharedExpenseLines = expenseLines.filter((line) => line.payer === "shared" && line.isFilled);
  const sumExpenseLines = (lines) => Number(lines.reduce((sum, line) => sum + line.amountValue, 0).toFixed(2));
  const ownerPaidExpenses = sumExpenseLines(ownerExpenseLines);
  const partnerPaidExpenses = sumExpenseLines(partnerExpenseLines);
  const sharedJobCosts = sumExpenseLines(sharedExpenseLines);
  const ownerRecovery = Number(toNumber(draft.ownerRecovery || 0).toFixed(2));
  const partnerRecovery = Number(toNumber(draft.partnerRecovery || 0).toFixed(2));
  const partnerFixedTotal = Number((partnerDailyFixed * partnerDays).toFixed(2));
  const deductibleCosts = Number((
    ownerPaidExpenses
    + partnerPaidExpenses
    + sharedJobCosts
    + ownerRecovery
    + partnerRecovery
    + partnerFixedTotal
  ).toFixed(2));
  const divisibleProfit = Number((revenue - deductibleCosts).toFixed(2));
  const partnerProfitShare = Number(((divisibleProfit * partnerSharePct) / 100).toFixed(2));
  const ownerProfitShare = Number((divisibleProfit - partnerProfitShare).toFixed(2));
  const partnerDue = Number((partnerPaidExpenses + partnerRecovery + partnerFixedTotal + partnerProfitShare).toFixed(2));
  const ownerDue = Number((ownerPaidExpenses + ownerRecovery + ownerProfitShare).toFixed(2));
  const reconciliationGap = Number((revenue - sharedJobCosts - partnerDue - ownerDue).toFixed(2));

  return {
    partnerName,
    expenseLines,
    ownerExpenseLines,
    partnerExpenseLines,
    sharedExpenseLines,
    expenseLineCount: expenseLines.filter((line) => line.isFilled).length,
    revenue,
    partnerDailyFixed,
    partnerDays,
    partnerSharePct,
    ownerSharePct,
    ownerPaidExpenses,
    partnerPaidExpenses,
    sharedJobCosts,
    ownerRecovery,
    partnerRecovery,
    partnerFixedTotal,
    deductibleCosts,
    divisibleProfit,
    partnerProfitShare,
    ownerProfitShare,
    partnerDue,
    ownerDue,
    reconciliationGap,
  };
}

function renderProfitSplitExpenseRows(lines = []) {
  return normalizeProfitSplitExpenseLines(lines).map((line, index) => `
    <div class="profit-split-expense-row" data-profit-split-expense-row data-expense-id="${escapeHtml(line.id)}">
      <div class="profit-split-expense-row-index">${index + 1}</div>
      <input
        class="text-input"
        data-expense-field="label"
        list="profit-split-expense-label-options"
        placeholder="${escapeHtml(state.lang === "it" ? "Es. benzina, caselli, vitto, dipendenti..." : "Fuel, tolls, meals, wages...")}"
        value="${escapeHtml(line.label)}"
      />
      <input
        class="text-input"
        data-expense-field="amount"
        type="text"
        inputmode="decimal"
        placeholder="0,00"
        value="${escapeHtml(line.amount)}"
      />
      <select class="text-input" data-expense-field="payer">
        <option value="owner" ${line.payer === "owner" ? "selected" : ""}>${escapeHtml(state.lang === "it" ? "Pagata da te" : "Paid by you")}</option>
        <option value="partner" ${line.payer === "partner" ? "selected" : ""}>${escapeHtml(state.lang === "it" ? "Pagata dal collaboratore" : "Paid by partner")}</option>
        <option value="shared" ${line.payer === "shared" ? "selected" : ""}>${escapeHtml(state.lang === "it" ? "Costo condiviso" : "Shared cost")}</option>
      </select>
      <button type="button" class="ghost-button small-button" data-profit-split-remove-expense="${escapeHtml(line.id)}">${escapeHtml(state.lang === "it" ? "Rimuovi" : "Remove")}</button>
    </div>
  `).join("");
}

function renderProfitSplitExpenseList(lines = [], emptyText = "") {
  if (!lines.length) return `<p class="profit-split-expense-empty">${escapeHtml(emptyText || "—")}</p>`;
  return `
    <div class="crew-expense-order-list">
      ${lines.map((line) => `
        <div class="crew-expense-order-line">
          <span>${escapeHtml(line.displayLabel)}</span>
          <strong>${escapeHtml(formatCurrency(line.amountValue))}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function readProfitSplitDraftFromForm() {
  if (!ui.profitSplitForm) return normalizeProfitSplitDraft(state.profitSplitDraft);
  const form = ui.profitSplitForm;
  const currentDraft = normalizeProfitSplitDraft(state.profitSplitDraft);
  const expenseLines = Array.from(form.querySelectorAll("[data-profit-split-expense-row]")).map((row) => ({
    id: row.getAttribute("data-expense-id") || crypto.randomUUID(),
    label: row.querySelector('[data-expense-field="label"]')?.value || "",
    amount: row.querySelector('[data-expense-field="amount"]')?.value || "",
    payer: row.querySelector('[data-expense-field="payer"]')?.value || "owner",
  }));
  return normalizeProfitSplitDraft({
    linkedOrderId: state.profitSplitContextOrderId || currentDraft.linkedOrderId || "",
    savedAt: currentDraft.savedAt || "",
    updatedBy: currentDraft.updatedBy || "",
    jobLabel: form.jobLabel?.value || "",
    partnerName: form.partnerName?.value || "",
    revenue: form.revenue?.value || "",
    partnerDailyFixed: form.partnerDailyFixed?.value || "",
    partnerDays: form.partnerDays?.value || "",
    partnerSharePct: form.partnerSharePct?.value || "",
    expenseLines,
    ownerRecovery: form.ownerRecovery?.value || "",
    partnerRecovery: form.partnerRecovery?.value || "",
    note: form.note?.value || "",
  });
}

function syncProfitSplitDraftFromState() {
  if (!ui.profitSplitForm) return;
  const draft = normalizeProfitSplitDraft(state.profitSplitDraft);
  [
    "jobLabel",
    "partnerName",
    "revenue",
    "partnerDailyFixed",
    "partnerDays",
    "partnerSharePct",
    "ownerRecovery",
    "partnerRecovery",
    "note",
  ].forEach((key) => {
    if (ui.profitSplitForm[key]) ui.profitSplitForm[key].value = draft[key] || "";
  });
  if (ui.profitSplitExpenseLines) ui.profitSplitExpenseLines.innerHTML = renderProfitSplitExpenseRows(draft.expenseLines);
}

function renderProfitSplitContextCard() {
  if (!ui.profitSplitContextCard) return;
  const linkedOrder = getProfitSplitContextOrder();
  const selectedOrder = getSelectedOrder();
  const orderLabel = linkedOrder
    ? buildProfitSplitOrderLabel(linkedOrder)
    : selectedOrder
      ? buildProfitSplitOrderLabel(selectedOrder)
      : "";
  const linkedSaved = linkedOrder ? getStoredProfitSplitForOrder(linkedOrder) : null;
  const dirty = linkedOrder ? isProfitSplitContextDirty() : false;
  const savedLabel = linkedSaved?.savedAt
    ? `${state.lang === "it" ? "Ultimo salvataggio" : "Last saved"} ${formatDate(linkedSaved.savedAt)}${linkedSaved.updatedBy ? ` · ${escapeHtml(linkedSaved.updatedBy)}` : ""}`
    : (state.lang === "it" ? "Nessun conto posa ancora salvato su questa commessa." : "No profit split saved on this job yet.");

  ui.profitSplitContextCard.innerHTML = linkedOrder
    ? `
      <strong>${state.lang === "it" ? "Commessa collegata" : "Linked job"}</strong>
      <p>${escapeHtml(orderLabel || (state.lang === "it" ? "Ordine selezionato" : "Selected order"))}</p>
      <small>${escapeHtml(savedLabel)}</small>
    `
    : selectedOrder
      ? `
        <strong>${state.lang === "it" ? "Bozza locale attiva" : "Local draft active"}</strong>
        <p>${state.lang === "it"
          ? `Puoi collegare questo conto all'ordine selezionato: ${escapeHtml(orderLabel)}.`
          : `You can link this split to the selected order: ${escapeHtml(orderLabel)}.`}</p>
        <small>${state.lang === "it"
          ? "Il tool resta indipendente finche non lo salvi sulla commessa."
          : "The tool stays independent until you save it to the job."}</small>
      `
      : `
        <strong>${state.lang === "it" ? "Bozza locale attiva" : "Local draft active"}</strong>
        <p>${state.lang === "it"
          ? "Apri un ordine e poi torna qui per collegare il conto posa a una commessa reale."
          : "Open an order and come back here to link this split to a real job."}</p>
        <small>${state.lang === "it"
          ? "La vista dedicata resta disponibile anche senza commessa collegata."
          : "The dedicated workspace is still available without a linked job."}</small>
      `;

  if (ui.profitSplitContextStatus) {
    ui.profitSplitContextStatus.classList.remove("hidden", "success", "error");
    if (linkedOrder) {
      ui.profitSplitContextStatus.classList.add(dirty ? "error" : "success");
      ui.profitSplitContextStatus.textContent = dirty
        ? (state.lang === "it" ? "Bozza collegata modificata: premi Salva su commessa per condividere gli ultimi cambi." : "Linked draft changed: save it to the job to share the latest changes.")
        : (state.lang === "it" ? "Conto posa allineato alla commessa selezionata." : "Profit split is aligned with the selected job.");
    } else {
      ui.profitSplitContextStatus.classList.add("hidden");
      ui.profitSplitContextStatus.textContent = "";
    }
  }

  if (ui.profitSplitUseSelectedOrderButton) {
    ui.profitSplitUseSelectedOrderButton.disabled = !selectedOrder;
    ui.profitSplitUseSelectedOrderButton.textContent = linkedOrder && selectedOrder?.id === linkedOrder.id
      ? (state.lang === "it" ? "Ricarica commessa" : "Reload job")
      : (state.lang === "it" ? "Usa ordine selezionato" : "Use selected order");
  }
  if (ui.profitSplitSaveOrderButton) ui.profitSplitSaveOrderButton.disabled = !linkedOrder;
  if (ui.profitSplitDetachOrderButton) ui.profitSplitDetachOrderButton.disabled = !linkedOrder;
  if (ui.profitSplitOpenOrderButton) ui.profitSplitOpenOrderButton.disabled = !linkedOrder;
}

async function saveProfitSplitToLinkedOrder() {
  const order = getProfitSplitContextOrder();
  if (!order) return;
  const nextDraft = readProfitSplitDraftFromForm();
  const storedDraft = getStoredProfitSplitForOrder(order);
  const baselineDraft = storedDraft || buildProfitSplitDraftForOrder(order, { preferStored: false });
  const onlyPrefillValues = !storedDraft
    && getProfitSplitComparablePayload(nextDraft) === getProfitSplitComparablePayload(baselineDraft);
  if (onlyPrefillValues) {
    if (ui.profitSplitContextStatus) {
      setStatus(
        ui.profitSplitContextStatus,
        "error",
        state.lang === "it" ? "Completa almeno ricavo, spese, recuperi o note prima di collegare questo conto alla commessa." : "Add revenue, expenses, recoveries, or notes before linking this split to the job.",
      );
    }
    return;
  }
  const result = computeProfitSplitScenario(nextDraft);
  const hasValues = [
    result.revenue,
    result.ownerPaidExpenses,
    result.partnerPaidExpenses,
    result.sharedJobCosts,
    result.ownerRecovery,
    result.partnerRecovery,
    result.partnerFixedTotal,
    result.expenseLineCount,
  ].some((value) => Math.abs(value) > 0);
  if (!hasValues) {
    if (ui.profitSplitContextStatus) {
      setStatus(
        ui.profitSplitContextStatus,
        "error",
        state.lang === "it" ? "Inserisci almeno ricavo, spese o recuperi prima di salvare la commessa." : "Enter revenue, expenses, or recoveries before saving this job.",
      );
    }
    return;
  }
  const savedAt = new Date().toISOString();
  const updatedBy = state.currentUser?.name || state.currentUser?.email || "";
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      installation: {
        profitSplit: {
          ...normalizeProfitSplitDraft(nextDraft),
          linkedOrderId: order.id,
          savedAt,
          updatedBy,
        },
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  state.selectedOrderId = saved.id;
  state.profitSplitContextOrderId = saved.id;
  state.profitSplitDraft = buildProfitSplitDraftForOrder(saved, { preferStored: true });
  renderCurrentViewOnly(state.currentView);
}

function renderProfitSplitCalculator({ syncForm = true } = {}) {
  if (!ui.profitSplitSummary || !ui.profitSplitBreakdown) return;
  if (ui.profitSplitCrewOptions) {
    const crewOptionsMarkup = getCrewAccounts()
      .map((user) => getCrewLabelForUser(user))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "it"))
      .map((label) => `<option value="${escapeHtml(label)}"></option>`)
      .join("");
    if (ui.profitSplitCrewOptions.dataset.signature !== crewOptionsMarkup) {
      ui.profitSplitCrewOptions.innerHTML = crewOptionsMarkup;
      ui.profitSplitCrewOptions.dataset.signature = crewOptionsMarkup;
    }
  }

  if (syncForm) syncProfitSplitDraftFromState();
  renderProfitSplitContextCard();
  const draft = normalizeProfitSplitDraft(state.profitSplitDraft);
  const result = computeProfitSplitScenario(draft);
  const partnerLabel = result.partnerName || (state.lang === "it" ? "Collaboratore" : "Partner");
  const hasValues = [
    result.revenue,
    result.ownerPaidExpenses,
    result.partnerPaidExpenses,
    result.sharedJobCosts,
    result.ownerRecovery,
    result.partnerRecovery,
    result.partnerFixedTotal,
    result.expenseLineCount,
  ].some((value) => Math.abs(value) > 0);

  if (!hasValues) {
    ui.profitSplitSummary.innerHTML = [
      {
        label: state.lang === "it" ? "Pronto per il conto" : "Ready to calculate",
        value: state.lang === "it" ? "Inserisci i numeri" : "Enter values",
        meta: state.lang === "it"
          ? "Aggiungi le spese una riga per volta, poi il tool trasforma tutto nel saldo finale per te e per il collaboratore."
          : "Add expenses line by line and the tool will turn everything into the final split.",
      },
    ].map(renderDetailBox).join("");
    ui.profitSplitBreakdown.innerHTML = "";
    return;
  }

  const summaryItems = [
    {
      label: state.lang === "it" ? "Ricavo posa" : "Install revenue",
      value: formatCurrency(result.revenue),
      meta: draft.jobLabel || (draft.note ? draft.note : (state.lang === "it" ? "Commessa senza nota" : "Job without note")),
    },
    {
      label: state.lang === "it" ? "Costi dedotti" : "Deducted costs",
      value: formatCurrency(result.deductibleCosts),
      meta: `${result.expenseLineCount} ${state.lang === "it" ? "voci spesa" : "expense items"} · ${state.lang === "it" ? "Fisso" : "Fixed"} ${formatCurrency(result.partnerFixedTotal)}`,
    },
    {
      label: state.lang === "it" ? "Utile da dividere" : "Profit to split",
      value: formatCurrency(result.divisibleProfit),
      meta: `${partnerLabel} ${result.partnerSharePct}% · ${state.lang === "it" ? "Tu" : "You"} ${result.ownerSharePct}%`,
    },
    {
      label: state.lang === "it" ? `Totale ${partnerLabel}` : `${partnerLabel} total`,
      value: formatCurrency(result.partnerDue),
      meta: `${state.lang === "it" ? "Rimborsi + fisso + quota utile" : "Reimbursements + fixed + profit share"}`,
    },
    {
      label: state.lang === "it" ? "Totale tuo" : "Your total",
      value: formatCurrency(result.ownerDue),
      meta: `${state.lang === "it" ? "Rimborsi + recuperi + quota utile" : "Reimbursements + recoveries + profit share"}`,
    },
    {
      label: state.lang === "it" ? "Quadratura" : "Reconciliation",
      value: formatCurrency(result.reconciliationGap),
      meta: Math.abs(result.reconciliationGap) <= 0.02
        ? (state.lang === "it" ? "Formula chiusa correttamente." : "Formula closes correctly.")
        : (state.lang === "it" ? "Controlla i campi: qualcosa non torna." : "Check the fields: something is off."),
    },
  ];
  ui.profitSplitSummary.innerHTML = summaryItems.map(renderDetailBox).join("");

  const warning = result.divisibleProfit < 0
    ? `<div class="info-card profit-split-warning">${state.lang === "it"
      ? "Attenzione: l'utile divisibile è negativo. Stai distribuendo una commessa in perdita."
      : "Warning: the distributable profit is negative. This job is running at a loss."}</div>`
    : "";

  ui.profitSplitBreakdown.innerHTML = `
    ${warning}
    <div class="crew-expense-report-grid">
      <section class="crew-expense-panel">
        <div class="crew-expense-panel-head">
          <p class="panel-eyebrow">${state.lang === "it" ? "Collaboratore" : "Partner"}</p>
          <h4>${escapeHtml(partnerLabel)}</h4>
        </div>
        <div class="detail-stack">
          ${[
            { label: state.lang === "it" ? "Spese pagate da lui" : "Expenses paid by partner", value: formatCurrency(result.partnerPaidExpenses) },
            { label: state.lang === "it" ? "Recuperi collaboratore" : "Partner recoveries", value: formatCurrency(result.partnerRecovery) },
            { label: state.lang === "it" ? "Fisso collaboratore" : "Partner fixed pay", value: formatCurrency(result.partnerFixedTotal), meta: `${result.partnerDays} ${state.lang === "it" ? "giorni" : "days"} × ${formatCurrency(result.partnerDailyFixed)}` },
            { label: state.lang === "it" ? "Quota utile" : "Profit share", value: formatCurrency(result.partnerProfitShare), meta: `${result.partnerSharePct}%` },
            { label: state.lang === "it" ? "Totale da riconoscere" : "Total due", value: formatCurrency(result.partnerDue), meta: state.lang === "it" ? "Se hai incassato tutto tu, questo è il saldo da riconoscere al collaboratore." : "If you collected everything, this is the amount due to the partner." },
          ].map((item) => `
            <article class="detail-box crew-expense-report-card">
              <span class="panel-eyebrow">${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
              <p>${escapeHtml(item.meta || "—")}</p>
            </article>
          `).join("")}
        </div>
        ${renderProfitSplitExpenseList(
          result.partnerExpenseLines,
          state.lang === "it" ? "Nessuna spesa registrata a carico del collaboratore." : "No partner-paid expenses yet.",
        )}
      </section>
      <section class="crew-expense-panel">
        <div class="crew-expense-panel-head">
          <p class="panel-eyebrow">${state.lang === "it" ? "Tua quota" : "Your side"}</p>
          <h4>${state.lang === "it" ? "Saldo titolare" : "Owner settlement"}</h4>
        </div>
        <div class="detail-stack">
          ${[
            { label: state.lang === "it" ? "Spese pagate da te" : "Expenses paid by you", value: formatCurrency(result.ownerPaidExpenses) },
            { label: state.lang === "it" ? "Recuperi tuoi" : "Your recoveries", value: formatCurrency(result.ownerRecovery) },
            { label: state.lang === "it" ? "Quota utile" : "Profit share", value: formatCurrency(result.ownerProfitShare), meta: `${result.ownerSharePct}%` },
            { label: state.lang === "it" ? "Altri costi condivisi" : "Shared costs", value: formatCurrency(result.sharedJobCosts), meta: state.lang === "it" ? "Detratti dalla commessa ma non assegnati a uno dei due." : "Deducted from the job without reimbursing either side." },
            { label: state.lang === "it" ? "Totale che ti spetta" : "Your total due", value: formatCurrency(result.ownerDue), meta: state.lang === "it" ? "Quanto resta a te dopo aver chiuso la parte collaboratore." : "What remains to you after settling the partner side." },
          ].map((item) => `
            <article class="detail-box crew-expense-report-card">
              <span class="panel-eyebrow">${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
              <p>${escapeHtml(item.meta || "—")}</p>
            </article>
          `).join("")}
        </div>
        ${renderProfitSplitExpenseList(
          result.ownerExpenseLines,
          state.lang === "it" ? "Nessuna spesa registrata a tuo carico." : "No owner-paid expenses yet.",
        )}
        ${result.sharedExpenseLines.length ? `
          <div class="crew-expense-panel-subhead">
            <p class="panel-eyebrow">${state.lang === "it" ? "Costi condivisi" : "Shared costs"}</p>
          </div>
          ${renderProfitSplitExpenseList(result.sharedExpenseLines)}
        ` : ""}
      </section>
    </div>
  `;
}

function composeClientName(order) {
  return `${order.firstName || ""} ${order.lastName || ""}`.trim() || customerPendingText();
}

function getUserInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "VO";
}

function ensureCountBadge(node, className) {
  if (!(node instanceof HTMLElement) || !className) return null;
  let badge = node.querySelector(`.${className}`);
  if (!badge) {
    badge = document.createElement("span");
    badge.className = className;
    badge.setAttribute("aria-hidden", "true");
    node.appendChild(badge);
  }
  return badge;
}

function setNavCount(view, count) {
  const node = ui.navLinks.find((link) => link.dataset.view === view);
  if (!node) return;
  const normalized = !NAV_BADGE_DISABLED_VIEWS.has(view) && Number(count) > 0 ? String(count) : "";
  state.navCounts[view] = normalized;
  node.setAttribute("data-count", normalized);
  const desktopBadge = ensureCountBadge(node, "nav-count-badge");
  if (desktopBadge) {
    desktopBadge.hidden = !normalized;
    desktopBadge.textContent = normalized || "";
  }
  const mobileNode = getMobilePillButton(view);
  if (mobileNode) {
    mobileNode.setAttribute("data-count", normalized);
    const mobileBadge = ensureCountBadge(mobileNode, "mobile-pill-count-badge");
    if (mobileBadge) {
      mobileBadge.hidden = !normalized;
      mobileBadge.textContent = normalized || "";
    }
  }
}

function normalizeSalesRequestStatus(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "new";
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return "new";
  if ([
    "new",
    "nuova",
    "nuovo",
    "lead",
    "richiesta nuova",
    "nuova richiesta",
  ].includes(normalized)) return "new";
  if ([
    "quoted",
    "quote",
    "preventivo",
    "in preventivo",
    "preventivo inviato",
    "offerta",
    "offerta inviata",
    "quotato",
  ].includes(normalized)) return "quoted";
  if ([
    "followup",
    "follow up",
    "follow-up",
    "da richiamare",
    "richiamare",
    "richiamata",
    "recall",
    "attesa",
    "in lavorazione",
    "da seguire",
  ].includes(normalized)) return "followup";
  if ([
    "closed",
    "chiusa",
    "chiuso",
    "vinta",
    "vinto",
    "persa",
    "perso",
    "completata",
    "completato",
    "archiviata",
    "archiviato",
  ].includes(normalized)) return "closed";
  return raw;
}

function normalizeSalesRequestHeight(value = "") {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  const numericOnly = compact.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numericOnly) {
    const amount = numericOnly[1].replace(/\.0+$/, "").replace(",", ".");
    return `${Number(amount)} mm`;
  }
  const millimeterMatch = compact.match(/^(\d+(?:[.,]\d+)?)(mm|millimetri?|millimeters?)$/i);
  if (millimeterMatch) {
    const amount = millimeterMatch[1].replace(/\.0+$/, "").replace(",", ".");
    return `${Number(amount)} mm`;
  }
  const centimeterMatch = compact.match(/^(\d+(?:[.,]\d+)?)(cm|centimetri?|centimeters?)$/i);
  if (centimeterMatch) {
    const amount = centimeterMatch[1].replace(/\.0+$/, "").replace(",", ".");
    return `${Number(amount)} cm`;
  }
  return raw;
}

function getSalesRequestRawHeightValue(item = {}) {
  const directValue = (
    item.requestedHeight
    ?? item.altezza
    ?? item.height
    ?? item.mm
    ?? item.spessore
    ?? item.altezzaDaPreventivare
    ?? item.altezza_richiesta
    ?? ""
  );
  const directText = String(directValue ?? "").trim();
  if (directText) return directText;
  const dynamicEntry = Object.entries(item || {}).find(([key, raw]) => {
    const keyText = normalizeImportHeader(key || "");
    if (!isSalesRequestHeightHeader(keyText)) return false;
    return String(raw ?? "").trim() !== "";
  });
  return dynamicEntry ? String(dynamicEntry[1] ?? "").trim() : "";
}

function normalizeSalesRequestAssignment(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = normalizeLooseString(raw);
  if (!normalized || ["non assegnato", "non assegnata", "unassigned", "none", "na"].includes(normalized)) return "";
  if (normalized.includes("ivan")) return "Ivan";
  if (normalized.includes("gabriele")) return "Gabriele";
  return "";
}

function normalizeIsoDateTime(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeSalesRequestFirstContactState(value = "") {
  const normalized = normalizeLooseString(value);
  if (!normalized) return "";
  if (["sent", "inviato", "inviata", "sent-now"].includes(normalized)) return "sent";
  if (["queued", "coda", "in coda", "scheduled", "pending"].includes(normalized)) return "queued";
  return "";
}

function isSalesRequestWithinFirstContactWindow(now = new Date()) {
  const hour = Number(now.getHours());
  return hour >= SALES_REQUEST_FIRST_CONTACT_START_HOUR && hour < SALES_REQUEST_FIRST_CONTACT_END_HOUR;
}

function getSalesRequestNextMorningAt(now = new Date()) {
  const next = new Date(now);
  const hour = Number(now.getHours());
  if (hour >= SALES_REQUEST_FIRST_CONTACT_END_HOUR) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(SALES_REQUEST_FIRST_CONTACT_START_HOUR, 0, 0, 0);
  return next.toISOString();
}

function getSalesRequestOperatorFromCurrentUser() {
  const direct = normalizeSalesRequestAssignment(state.currentUser?.name || "");
  if (direct) return direct;
  const fallback = normalizeSalesRequestAssignment(state.currentUser?.email || "");
  return fallback || "";
}

function isSalesRequestFirstContactDue(item = {}, now = new Date()) {
  const scheduledAt = normalizeIsoDateTime(item.firstContactScheduledAt || "");
  if (!scheduledAt) return false;
  const scheduledTime = new Date(scheduledAt).getTime();
  return Number.isFinite(scheduledTime) && scheduledTime <= now.getTime();
}

function shouldPromoteSalesRequestToFirstContact(status = "") {
  const code = getSalesRequestStatusCode(status);
  if (code === "new" || !String(status || "").trim()) return true;
  const normalized = normalizeLooseString(status);
  return [
    "followup",
    "follow up",
    "follow-up",
    "da richiamare",
    "richiamare",
    "in attesa di risposta",
    "nessuna risposta",
  ].includes(normalized);
}

function buildSalesRequestPayloadFromRecord(record = {}, patch = {}) {
  const merged = { ...record, ...patch };
  return {
    id: String(merged.id || "").trim() || undefined,
    name: merged.name,
    surname: merged.surname,
    city: merged.city,
    phone: merged.phone,
    email: merged.email,
    sqm: merged.sqm,
    requestedHeight: merged.requestedHeight,
    service: merged.service,
    surface: merged.surface,
    assignment: normalizeSalesRequestAssignment(merged.assignment),
    status: merged.status,
    note: merged.note,
    whatsappTemplate: merged.whatsappTemplate,
    whatsappUrl: merged.whatsappUrl,
    firstContactState: normalizeSalesRequestFirstContactState(merged.firstContactState),
    firstContactScheduledAt: normalizeIsoDateTime(merged.firstContactScheduledAt),
    firstContactSentAt: normalizeIsoDateTime(merged.firstContactSentAt),
    firstContactBy: normalizeSalesRequestAssignment(merged.firstContactBy || merged.assignment),
    source: String(merged.source || "manual").trim() || "manual",
    sourceSpreadsheetId: String(merged.sourceSpreadsheetId || "").trim(),
    sourceSheetName: String(merged.sourceSheetName || "").trim(),
    sourceRowNumber: Number(merged.sourceRowNumber || 0),
    createdAt: String(merged.createdAt || "").trim() || undefined,
  };
}

function getSalesRequestFirstContactAutomationDecision({
  existingRequest = null,
  nextAssignment = "",
  nextStatus = "",
  canOpenWhatsAppNow = false,
  now = new Date(),
} = {}) {
  const normalizedAssignment = normalizeSalesRequestAssignment(nextAssignment);
  const previousAssignment = normalizeSalesRequestAssignment(existingRequest?.assignment || "");
  const assignmentChanged = Boolean(normalizedAssignment && normalizedAssignment !== previousAssignment);
  const currentOperator = getSalesRequestOperatorFromCurrentUser();
  const canSendNow = Boolean(
    assignmentChanged
    && normalizedAssignment
    && currentOperator
    && normalizedAssignment === currentOperator
    && isSalesRequestWithinFirstContactWindow(now)
    && canOpenWhatsAppNow,
  );
  const queued = Boolean(assignmentChanged && normalizedAssignment && !canSendNow);
  const queuedAt = queued
    ? (isSalesRequestWithinFirstContactWindow(now) ? now.toISOString() : getSalesRequestNextMorningAt(now))
    : "";
  const nextState = canSendNow
    ? "sent"
    : queued
      ? "queued"
      : normalizeSalesRequestFirstContactState(existingRequest?.firstContactState || "");
  const statusOverride = assignmentChanged && shouldPromoteSalesRequestToFirstContact(nextStatus)
    ? (canSendNow ? SALES_REQUEST_FIRST_CONTACT_SENT_STATUS : SALES_REQUEST_FIRST_CONTACT_QUEUED_STATUS)
    : String(nextStatus || "").trim();
  return {
    action: canSendNow ? "send-now" : queued ? "queued" : "none",
    firstContactState: nextState,
    firstContactScheduledAt: canSendNow
      ? now.toISOString()
      : queued
        ? queuedAt
        : normalizeIsoDateTime(existingRequest?.firstContactScheduledAt || ""),
    firstContactSentAt: canSendNow
      ? now.toISOString()
      : normalizeIsoDateTime(existingRequest?.firstContactSentAt || ""),
    firstContactBy: normalizedAssignment || normalizeSalesRequestAssignment(existingRequest?.firstContactBy || ""),
    status: statusOverride || String(nextStatus || "").trim() || "new",
  };
}

function getSalesRequestFirstContactHint(item = {}) {
  const stateValue = normalizeSalesRequestFirstContactState(item.firstContactState || "");
  const by = normalizeSalesRequestAssignment(item.firstContactBy || item.assignment || "");
  const scheduledAt = normalizeIsoDateTime(item.firstContactScheduledAt || "");
  const sentAt = normalizeIsoDateTime(item.firstContactSentAt || "");
  const isDue = stateValue === "queued" && isSalesRequestFirstContactDue(item) && isSalesRequestWithinFirstContactWindow();
  if (stateValue === "sent" && sentAt) {
    return state.lang === "it"
      ? `Primo contatto inviato${by ? ` da ${by}` : ""} il ${formatDate(sentAt)}.`
      : `First contact sent${by ? ` by ${by}` : ""} on ${formatDate(sentAt)}.`;
  }
  if (stateValue === "queued" && scheduledAt) {
    if (isDue) {
      return state.lang === "it"
        ? `Contatto in coda pronto all'invio${by ? ` per ${by}` : ""}.`
        : `Queued contact ready to send${by ? ` for ${by}` : ""}.`;
    }
    return state.lang === "it"
      ? `Contatto in coda${by ? ` per ${by}` : ""} · pianificato ${formatDate(scheduledAt)}.`
      : `Queued contact${by ? ` for ${by}` : ""} · scheduled ${formatDate(scheduledAt)}.`;
  }
  return state.lang === "it"
    ? "Assegna il contatto e salva per avviare l'automazione del primo contatto."
    : "Assign the contact and save to trigger first-contact automation.";
}

function getSalesRequestAutomationBadge(item = {}) {
  const stateValue = normalizeSalesRequestFirstContactState(item.firstContactState || "");
  const scheduledAt = normalizeIsoDateTime(item.firstContactScheduledAt || "");
  if (stateValue === "queued") {
    const label = state.lang === "it" ? "✓ In programmazione" : "✓ Scheduled";
    const title = scheduledAt
      ? (state.lang === "it" ? `Primo contatto pianificato ${formatDate(scheduledAt)}` : `First contact scheduled ${formatDate(scheduledAt)}`)
      : (state.lang === "it" ? "Primo contatto in programmazione" : "First contact scheduled");
    return {
      label,
      title,
      tone: "queued",
    };
  }
  if (stateValue === "sent") {
    return {
      label: state.lang === "it" ? "✓ Contattato" : "✓ Contacted",
      title: state.lang === "it" ? "Primo contatto inviato automaticamente" : "First contact sent automatically",
      tone: "sent",
    };
  }
  return null;
}

function getSalesRequestStatusCode(status = "") {
  const normalized = normalizeSalesRequestStatus(status);
  if (["new", "quoted", "followup", "closed"].includes(normalized)) return normalized;
  return normalized ? "custom" : "new";
}

function normalizeSalesRequestRecord(item = {}) {
  const status = String(item.status ?? item.stato ?? "").trim() || "new";
  return {
    id: String(item.id || crypto.randomUUID()),
    name: String(item.name || item.nome || "").trim(),
    surname: String(item.surname || item.cognome || "").trim(),
    city: String(item.city || item.citta || "").trim(),
    phone: String(item.phone || item.telefono || "").trim(),
    email: String(item.email || "").trim(),
    sqm: Number(toNumber(item.sqm ?? item.mq ?? 0).toFixed(2)),
    requestedHeight: normalizeSalesRequestHeight(getSalesRequestRawHeightValue(item)),
    service: String(item.service || item.servizio || "").trim().toLowerCase(),
    surface: String(item.surface || item.fondo || "").trim().toLowerCase(),
    assignment: normalizeSalesRequestAssignment(item.assignment || item.assegnazione || ""),
    status,
    note: String(item.note || "").trim(),
    whatsappTemplate: String(
      item.whatsappTemplate
      || item.whatsappMessage
      || item.whatsappAutomationMessage
      || item.whatsapp
      || "",
    ).trim(),
    whatsappUrl: normalizeSalesRequestWhatsAppUrl(
      item.whatsappUrl
      || item.whatsappLink
      || item.whatsappHref
      || item.whatsappTemplate
      || item.whatsappMessage
      || "",
    ),
    source: String(item.source || "manual").trim() || "manual",
    sourceSpreadsheetId: String(item.sourceSpreadsheetId || "").trim(),
    sourceSheetName: String(item.sourceSheetName || "").trim(),
    sourceRowNumber: Number(item.sourceRowNumber || 0),
    firstContactState: normalizeSalesRequestFirstContactState(item.firstContactState || item.firstContact?.state || ""),
    firstContactScheduledAt: normalizeIsoDateTime(item.firstContactScheduledAt || item.firstContact?.scheduledAt || ""),
    firstContactSentAt: normalizeIsoDateTime(item.firstContactSentAt || item.firstContact?.sentAt || ""),
    firstContactBy: normalizeSalesRequestAssignment(item.firstContactBy || item.firstContact?.by || ""),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
  };
}

function normalizeSalesRequestSourceConfig(config = {}) {
  return {
    spreadsheetInput: String(config.spreadsheetInput || "").trim(),
    sheetName: String(config.sheetName || "").trim(),
    hasServiceAccount: Boolean(config.hasServiceAccount || (config.serviceAccountEmail && config.privateKey)),
    serviceAccountEmail: String(config.serviceAccountEmail || "").trim(),
    editUrl: String(config.editUrl || "").trim(),
  };
}

function normalizeSalesContentRecord(item = {}) {
  return {
    id: String(item.id || crypto.randomUUID()),
    title: String(item.title || "").trim(),
    category: String(item.category || "documentazione").trim().toLowerCase() || "documentazione",
    description: String(item.description || "").trim(),
    link: String(item.link || "").trim(),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
  };
}

function getSalesContentAttachmentPendingKey(contentId = "", attachmentId = "", fallbackIndex = -1) {
  const safeContentId = String(contentId || "").trim();
  const safeAttachmentId = String(attachmentId || "").trim() || `index-${Number(fallbackIndex)}`;
  return `${safeContentId}::${safeAttachmentId}`;
}

function getSalesRequestDisplayName(item = {}) {
  return `${item.name || ""} ${item.surname || ""}`.trim() || (state.lang === "it" ? "Richiesta senza nome" : "Unnamed request");
}

function getSalesRequestStatusLabel(status = "") {
  const raw = String(status || "").trim();
  if (raw && !["new", "quoted", "followup", "closed"].includes(raw)) {
    return raw;
  }
  const code = getSalesRequestStatusCode(raw);
  if (code === "quoted") return state.lang === "it" ? "In preventivo" : "Quoted";
  if (code === "followup") return state.lang === "it" ? "Follow-up" : "Follow-up";
  if (code === "closed") return state.lang === "it" ? "Chiusa" : "Closed";
  if (code === "custom") return raw || (state.lang === "it" ? "Senza stato" : "No status");
  return state.lang === "it" ? "Nuova" : "New";
}

function isSalesRequestClosedStatus(status = "") {
  return getSalesRequestStatusCode(status) === "closed";
}

function getSalesRequestStatusesFromSheet() {
  const rows = state.salesRequests
    .filter((item) => String(item.source || "").trim() === "google-sheets")
    .sort((left, right) => {
      const leftRow = Number(left.sourceRowNumber || 0);
      const rightRow = Number(right.sourceRowNumber || 0);
      if (leftRow && rightRow && leftRow !== rightRow) return leftRow - rightRow;
      const leftCreated = new Date(left.createdAt || 0).getTime();
      const rightCreated = new Date(right.createdAt || 0).getTime();
      return leftCreated - rightCreated;
    });
  const values = [];
  const seen = new Set();
  rows.forEach((item) => {
    const value = String(item.status || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    values.push(value);
  });
  return values;
}

function getSalesRequestStatusOptions() {
  const options = [];
  const seen = new Set();
  const append = (value) => {
    const next = String(value || "").trim();
    if (!next) return;
    const key = next.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push(next);
  };
  SALES_REQUEST_STATUS_REFERENCE.forEach(append);
  getSalesRequestStatusesFromSheet().forEach(append);
  if (!options.length) {
    [
      state.lang === "it" ? "Nuova" : "New",
      state.lang === "it" ? "In preventivo" : "Quoted",
      state.lang === "it" ? "Follow-up" : "Follow-up",
      state.lang === "it" ? "Chiusa" : "Closed",
    ].forEach(append);
  }
  return options;
}

function getSalesRequestAssignmentOptions() {
  return [...SALES_REQUEST_ASSIGNMENT_REFERENCE];
}

function getSalesRequestHeightLabel(value = "") {
  return String(value || "").trim() || (state.lang === "it" ? "Altezza da definire" : "Height pending");
}

function getSalesRequestServiceLabel(service = "") {
  const value = String(service || "").trim().toLowerCase();
  if (value === "posa") return state.lang === "it" ? "Fornitura + posa" : "Supply + install";
  if (value === "fornitura") return state.lang === "it" ? "Solo fornitura" : "Supply only";
  return state.lang === "it" ? "Da definire" : "To define";
}

function getSalesRequestSurfaceLabel(surface = "") {
  const value = String(surface || "").trim().toLowerCase();
  if (value === "terra") return state.lang === "it" ? "Terra" : "Soil";
  if (value === "pavimentazione") return state.lang === "it" ? "Pavimentazione" : "Paving";
  return state.lang === "it" ? "Da definire" : "To define";
}

function getSalesContentCategoryLabel(category = "") {
  const value = String(category || "").trim().toLowerCase();
  if (value === "marketing") return state.lang === "it" ? "Marketing" : "Marketing";
  if (value === "listino") return state.lang === "it" ? "Listino" : "Price list";
  if (value === "template") return state.lang === "it" ? "Template" : "Template";
  if (value === "altro") return state.lang === "it" ? "Altro" : "Other";
  if (value) return value.charAt(0).toUpperCase() + value.slice(1);
  return state.lang === "it" ? "Documentazione" : "Documentation";
}

function normalizeSalesContentCategoryFilter(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "all";
}

function getSalesContentCategoryOptions(items = []) {
  const base = ["documentazione", "marketing", "listino", "template", "altro"];
  const seen = new Set(base);
  items.forEach((item) => {
    const category = normalizeSalesContentCategoryFilter(item?.category || "");
    if (!category || category === "all" || seen.has(category)) return;
    seen.add(category);
    base.push(category);
  });
  return base;
}

function getSelectedSalesRequest() {
  return state.salesRequests.find((item) => item.id === state.selectedSalesRequestId) || null;
}

function getSelectedSalesContent() {
  return state.salesContents.find((item) => item.id === state.selectedSalesContentId) || null;
}

function ensureSelectedSalesRequest() {
  if (state.creatingSalesRequest) {
    state.selectedSalesRequestId = "";
    return null;
  }
  if (!state.salesRequests.length) {
    state.selectedSalesRequestId = "";
    return null;
  }
  if (!state.selectedSalesRequestId || !state.salesRequests.some((item) => item.id === state.selectedSalesRequestId)) {
    state.selectedSalesRequestId = state.salesRequests[0].id;
  }
  return getSelectedSalesRequest();
}

function syncSalesRequestStatusField(value = "") {
  const field = ui.salesRequestForm?.status;
  if (!field) return;
  const options = getSalesRequestStatusOptions();
  const nextValue = String(value || "").trim() || options[0] || "new";
  const fragment = document.createDocumentFragment();
  const seen = new Set();
  const appendOption = (optionValue, optionLabel, dynamic = false) => {
    const normalizedKey = String(optionValue || "").trim().toLowerCase();
    if (!normalizedKey || seen.has(normalizedKey)) return;
    seen.add(normalizedKey);
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionLabel;
    if (dynamic) option.dataset.dynamicStatus = "true";
    fragment.append(option);
  };
  options.forEach((status) => appendOption(status, status, true));
  if (!seen.has(nextValue.toLowerCase())) {
    appendOption(nextValue, nextValue, true);
  }
  field.replaceChildren(fragment);
  const fallbackValue = options[0] || String(field.options[0]?.value || "new");
  field.value = seen.has(nextValue.toLowerCase()) ? nextValue : fallbackValue;
}

function syncSalesRequestAssignmentField(value = "") {
  const field = ui.salesRequestForm?.assignment;
  if (!field || field.tagName !== "SELECT") return;
  const nextValue = normalizeSalesRequestAssignment(value);
  const options = getSalesRequestAssignmentOptions();
  const fragment = document.createDocumentFragment();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.lang === "it" ? "non assegnato" : "Unassigned";
  fragment.append(placeholder);
  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    fragment.append(option);
  });
  field.replaceChildren(fragment);
  field.value = nextValue;
}

function getSalesRequestsPageSize() {
  return window.innerWidth <= 980 ? 12 : 18;
}

function paginateSalesRequests(items = []) {
  const pageSize = getSalesRequestsPageSize();
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  state.salesRequestPage = Math.min(Math.max(1, Number(state.salesRequestPage || 1)), totalPages);
  const start = (state.salesRequestPage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalItems,
    totalPages,
  };
}

function getSalesContentPageSize() {
  return window.innerWidth <= 980 ? 10 : 18;
}

function paginateSalesContents(items = []) {
  const pageSize = getSalesContentPageSize();
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  state.salesContentPage = Math.min(Math.max(1, Number(state.salesContentPage || 1)), totalPages);
  const start = (state.salesContentPage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalItems,
    totalPages,
  };
}

function ensureSelectedSalesContent() {
  if (state.creatingSalesContent) {
    state.selectedSalesContentId = "";
    return null;
  }
  if (!state.salesContents.length) {
    state.selectedSalesContentId = "";
    return null;
  }
  if (!state.selectedSalesContentId || !state.salesContents.some((item) => item.id === state.selectedSalesContentId)) {
    state.selectedSalesContentId = state.salesContents[0].id;
  }
  return getSelectedSalesContent();
}

function buildSalesRequestPrefill(item = {}) {
  return {
    nome: item.name || "",
    cognome: item.surname || "",
    citta: item.city || "",
    telefono: item.phone || "",
    email: item.email || "",
    mq: item.sqm || "",
    altezza: item.requestedHeight || "",
    servizio: item.service || "",
    fondo: item.surface || "",
    whatsappTemplate: item.whatsappTemplate || "",
  };
}

function pushPlannerPrefillToGenerator(force = false) {
  const bridge = getGardenPlannerQuoteBridge();
  const payload = bridge?.payload;
  if (!payload) return false;
  const plannerReport = buildSalesGeneratorPlannerReport(bridge);
  const signature = JSON.stringify({ source: "garden-planner", runId: Number(bridge?.runId || 0), payload });
  if (!force && state.lastSalesGeneratorSignature === signature) return true;
  state.salesGeneratorPlannerMode = true;
  state.salesGeneratorFreeMode = false;
  state.lastSalesGeneratorSignature = signature;
  try {
    window.localStorage.setItem(SALES_PREFILL_STORAGE_KEY, JSON.stringify({
      runId: Date.now(),
      source: "garden-planner",
      payload,
    }));
  } catch {}
  try {
    if (plannerReport) {
      window.localStorage.setItem(SALES_GENERATOR_PLANNER_REPORT_KEY, JSON.stringify(plannerReport));
    } else {
      window.localStorage.removeItem(SALES_GENERATOR_PLANNER_REPORT_KEY);
    }
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:prefill-request",
      payload,
      force,
    }, "*");
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:planner-report",
      payload: plannerReport,
      force,
    }, "*");
  } catch {}
  return true;
}

function activatePlannerPrefill({ force = false, openView = false } = {}) {
  const applied = pushPlannerPrefillToGenerator(force);
  if (!applied) return false;
  if (openView) {
    setView("sales-generator");
  } else if (state.currentView === "sales-generator") {
    renderSalesGenerator();
  }
  return true;
}

function openPlannerReportPreview(variant = "technical") {
  const bridge = getGardenPlannerQuoteBridge();
  const reportHtml = variant === "client" ? bridge?.reportHtml?.client : bridge?.reportHtml?.technical;
  if (!reportHtml) return false;
  const reportTitle = variant === "client"
    ? (state.lang === "it" ? "Report materiali Garden Planner" : "Garden Planner materials report")
    : (state.lang === "it" ? "Report tecnico Garden Planner" : "Garden Planner technical report");
  const printLabel = state.lang === "it" ? "Stampa report" : "Print report";
  const preview = window.open("", "_blank");
  if (!preview) return false;
  preview.document.open();
  preview.document.write(`<!DOCTYPE html>
<html lang="${state.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(reportTitle)}</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #f4f6f5;
        color: #182230;
      }
      .planner-report-shell {
        max-width: 1100px;
        margin: 0 auto;
        padding: 26px 20px 40px;
      }
      .planner-report-toolbar {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        justify-content: flex-end;
        padding: 16px 0 18px;
        background: linear-gradient(180deg, rgba(244, 246, 245, 0.98), rgba(244, 246, 245, 0.9), rgba(244, 246, 245, 0));
        backdrop-filter: blur(10px);
      }
      .planner-report-toolbar button {
        border: 1px solid rgba(23, 51, 37, 0.14);
        border-radius: 999px;
        background: linear-gradient(180deg, #315c48, #1d3b2f);
        color: #ffffff;
        padding: 11px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(22, 46, 35, 0.16);
      }
      .planner-report-card {
        border-radius: 28px;
        background: #ffffff;
        padding: 20px;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
      }
      @media print {
        body {
          background: #ffffff;
        }
        .planner-report-shell {
          max-width: none;
          padding: 0;
        }
        .planner-report-toolbar {
          display: none;
        }
        .planner-report-card {
          box-shadow: none;
          padding: 0;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="planner-report-shell">
      <div class="planner-report-toolbar">
        <button type="button" onclick="window.print()">${escapeHtml(printLabel)}</button>
      </div>
      <div class="planner-report-card">${reportHtml}</div>
    </div>
  </body>
</html>`);
  preview.document.close();
  return true;
}

function parseWhatsAppHyperlinkFormulaUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^=?\s*HYPERLINK\(\s*"([^"]+)"/i);
  return match ? String(match[1] || "").trim() : "";
}

function normalizeSalesRequestWhatsAppUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const formulaUrl = parseWhatsAppHyperlinkFormulaUrl(raw);
  const candidate = String(formulaUrl || raw).trim();
  if (!candidate) return "";
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : candidate.startsWith("www.")
      ? `https://${candidate}`
      : "";
  if (!withProtocol) return "";
  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "wa.me"
      || host === "api.whatsapp.com"
      || host === "web.whatsapp.com"
      || host === "whatsapp.com"
      || host.endsWith(".whatsapp.com")
    ) {
      return parsed.toString();
    }
  } catch {}
  return "";
}

function normalizePhoneForWhatsApp(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) {
    const cleaned = raw.replace(/[^\d+]/g, "");
    return cleaned.startsWith("+") ? cleaned : "";
  }
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("39")) return `+${digits}`;
  return `+39${digits}`;
}

function getSalesRequestServiceIntent(value = "") {
  const normalized = normalizeLooseString(value);
  if (!normalized) return "";
  const hasSupply = normalized.includes("fornitura") || normalized.includes("supply");
  const hasInstall = normalized.includes("posa") || normalized.includes("install");
  if (hasInstall) return "supply-install";
  if (hasSupply) return "supply-only";
  return "";
}

function isGenericSalesRequestWhatsAppTemplate(value = "") {
  const normalized = normalizeLooseString(value);
  if (!normalized) return false;
  return (
    normalized === "messaggio whatsapp"
    || normalized === "whatsapp message"
    || normalized === "primo contatto whatsapp"
    || normalized === "first whatsapp contact"
    || normalized.includes("messaggio preimpostato")
    || normalized.includes("template whatsapp")
  );
}

function getSalesRequestTemplateText(item = {}) {
  const raw = String(item.whatsappTemplate || "").trim();
  if (!raw) return "";
  return isGenericSalesRequestWhatsAppTemplate(raw) ? "" : raw;
}

function buildSalesRequestDefaultWhatsAppMessage(item = {}) {
  const recipient = getSalesRequestDisplayName(item);
  const serviceIntent = getSalesRequestServiceIntent(item.service);
  if (state.lang === "it") {
    if (serviceIntent === "supply-only") {
      return `Ciao ${recipient}, grazie per la richiesta. Ti confermiamo disponibilita per la sola fornitura del prato sintetico. Se vuoi ti inviamo subito proposta e tempi di consegna.`;
    }
    if (serviceIntent === "supply-install") {
      return `Ciao ${recipient}, grazie per la richiesta. Ti confermiamo disponibilita per fornitura e posa completa. Se vuoi ti inviamo proposta con materiali, posa e tempistiche.`;
    }
    return `Ciao ${recipient}, ti contattiamo in merito al tuo preventivo.`;
  }
  if (serviceIntent === "supply-only") {
    return `Hello ${recipient}, thank you for your request. We can support supply-only and share quote details with delivery timing.`;
  }
  if (serviceIntent === "supply-install") {
    return `Hello ${recipient}, thank you for your request. We can support full supply and installation and share the complete quote details.`;
  }
  return `Hello ${recipient}, we are contacting you about your quote.`;
}

function buildSalesRequestWhatsAppUrl(item = {}) {
  const explicitUrl = normalizeSalesRequestWhatsAppUrl(item.whatsappUrl || item.whatsappTemplate || "");
  if (explicitUrl) return explicitUrl;
  const phone = normalizePhoneForWhatsApp(item.phone);
  if (!phone) return "";
  const message = getSalesRequestTemplateText(item) || buildSalesRequestDefaultWhatsAppMessage(item);
  const waPhone = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
}

async function persistSalesRequestRecordPatch(record = {}, patch = {}) {
  const saved = await apiFetch("/api/sales/requests", {
    method: "POST",
    body: JSON.stringify(buildSalesRequestPayloadFromRecord(record, patch)),
  });
  upsertSalesRequest(saved, { skipOpsRender: true });
  renderSalesRequests();
  if (state.currentView === "sales-generator") renderSalesGenerator();
  return saved;
}

async function openSalesRequestWhatsAppContact(record = {}, { markAsSent = true } = {}) {
  const request = normalizeSalesRequestRecord(record || {});
  const url = buildSalesRequestWhatsAppUrl(request);
  if (!url) {
    setStatus(
      ui.salesRequestsStatus,
      "error",
      state.lang === "it"
        ? "Numero cliente non disponibile: impossibile aprire WhatsApp."
        : "Customer phone is missing: unable to open WhatsApp.",
    );
    return null;
  }

  window.open(url, "_blank", "noopener,noreferrer");

  if (!markAsSent) return request;

  const nowIso = new Date().toISOString();
  const shouldPersistSent = normalizeSalesRequestFirstContactState(request.firstContactState || "") !== "sent"
    || String(request.status || "").trim() !== SALES_REQUEST_FIRST_CONTACT_SENT_STATUS;
  if (!shouldPersistSent) return request;

  return persistSalesRequestRecordPatch(request, {
    firstContactState: "sent",
    firstContactScheduledAt: request.firstContactScheduledAt || nowIso,
    firstContactSentAt: nowIso,
    firstContactBy: normalizeSalesRequestAssignment(request.assignment || request.firstContactBy || ""),
    status: shouldPromoteSalesRequestToFirstContact(request.status)
      ? SALES_REQUEST_FIRST_CONTACT_SENT_STATUS
      : request.status,
  });
}

function buildSalesRequestMailtoUrl(item = {}) {
  const email = String(item.email || "").trim();
  if (!email) return "";
  const subject = state.lang === "it" ? "Aggiornamento preventivo" : "Quote update";
  const body = getSalesRequestTemplateText(item)
    || `${state.lang === "it" ? "Ciao" : "Hello"} ${getSalesRequestDisplayName(item)},`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function ensureSalesRequestWhatsAppActionUi() {
  const form = ui.salesRequestForm;
  if (!form) return;

  if (!form.querySelector('input[name="whatsappUrl"]')) {
    const hiddenUrlInput = document.createElement("input");
    hiddenUrlInput.type = "hidden";
    hiddenUrlInput.name = "whatsappUrl";
    form.append(hiddenUrlInput);
  }

  if (!ui.salesRequestWhatsAppHint) {
    ui.salesRequestWhatsAppHint = form.querySelector("#sales-request-whatsapp-hint") || form.querySelector(".field-hint");
  }

  if (ui.salesRequestWhatsAppButton) return;

  const legacyTemplateField = form.querySelector('textarea[name="whatsappTemplate"]');
  if (!legacyTemplateField) return;

  const fieldWrap = legacyTemplateField.closest(".field");
  if (!fieldWrap) return;

  const legacyLabel = fieldWrap.querySelector("span");
  if (legacyLabel) {
    legacyLabel.textContent = state.lang === "it" ? "Primo contatto WhatsApp" : "First WhatsApp contact";
  }

  const actionsRow = document.createElement("div");
  actionsRow.className = "inline-actions";
  const actionButton = document.createElement("a");
  actionButton.id = "sales-request-whatsapp-button";
  actionButton.className = "primary-button small-button hidden";
  actionButton.href = "#";
  actionButton.target = "_blank";
  actionButton.rel = "noreferrer";
  actionButton.textContent = state.lang === "it" ? "Primo contatto WhatsApp" : "First WhatsApp contact";
  actionsRow.append(actionButton);

  legacyTemplateField.classList.add("hidden");
  legacyTemplateField.setAttribute("aria-hidden", "true");
  legacyTemplateField.tabIndex = -1;

  legacyTemplateField.insertAdjacentElement("beforebegin", actionsRow);
  ui.salesRequestWhatsAppButton = actionButton;
  const hint = fieldWrap.querySelector(".field-hint");
  if (hint && !hint.id) hint.id = "sales-request-whatsapp-hint";
  if (!ui.salesRequestWhatsAppHint) ui.salesRequestWhatsAppHint = hint;
}

function buildSalesGeneratorBrandingPayload() {
  const currentRole = normalizeUserRole(state.currentUser?.role || "");
  if (currentRole !== "crew") {
    return { crewName: "", crewLogoDataUrl: "" };
  }
  const crewName = getCrewLabelForUser(state.currentUser) || getCrewForCurrentUser();
  const crewProfile = crewName ? getCrewProfile(crewName) : null;
  return {
    crewName: crewName || "",
    crewLogoDataUrl: String(state.currentUser?.crewLogoDataUrl || crewProfile?.crewLogoDataUrl || "").trim(),
  };
}

function pushSalesGeneratorBranding(force = false) {
  const payload = buildSalesGeneratorBrandingPayload();
  const signature = JSON.stringify(payload);
  if (!force && state.lastSalesGeneratorBrandingSignature === signature) return;
  state.lastSalesGeneratorBrandingSignature = signature;
  try {
    window.localStorage.setItem(SALES_BRANDING_STORAGE_KEY, JSON.stringify({
      runId: Date.now(),
      payload,
    }));
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:branding",
      payload,
    }, "*");
  } catch {}
}

function clearSalesRequestPrefillInGenerator({ keepFreeMode = true } = {}) {
  if (keepFreeMode) state.salesGeneratorFreeMode = true;
  state.salesGeneratorPlannerMode = false;
  state.lastSalesGeneratorSignature = "";
  try {
    window.localStorage.removeItem(SALES_PREFILL_STORAGE_KEY);
  } catch {}
  try {
    window.localStorage.removeItem(SALES_GENERATOR_PLANNER_REPORT_KEY);
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:clear-prefill",
    }, "*");
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:planner-report",
      payload: null,
    }, "*");
  } catch {}
}

function pushSalesRequestToGenerator(force = false) {
  if ((state.salesGeneratorFreeMode || state.salesGeneratorPlannerMode) && !force) return;
  const request = getSelectedSalesRequest();
  if (!request) return;
  const payload = buildSalesRequestPrefill(request);
  const signature = JSON.stringify(payload);
  if (!force && state.lastSalesGeneratorSignature === signature) return;
  state.salesGeneratorFreeMode = false;
  state.salesGeneratorPlannerMode = false;
  state.lastSalesGeneratorSignature = signature;
  try {
    window.localStorage.setItem(SALES_PREFILL_STORAGE_KEY, JSON.stringify({
      runId: Date.now(),
      source: "sales-request",
      payload,
    }));
  } catch {}
  try {
    window.localStorage.removeItem(SALES_GENERATOR_PLANNER_REPORT_KEY);
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:prefill-request",
      payload,
      force,
    }, "*");
  } catch {}
  try {
    ui.salesGeneratorFrame?.contentWindow?.postMessage({
      type: "quote-generator:planner-report",
      payload: null,
    }, "*");
  } catch {}
}

function applySalesGeneratorFrameHeight(rawHeight) {
  if (!ui.salesGeneratorFrame) return;
  const next = Math.max(
    SALES_GENERATOR_FRAME_MIN_HEIGHT,
    Math.min(SALES_GENERATOR_FRAME_MAX_HEIGHT, Number(rawHeight) || SALES_GENERATOR_FRAME_DEFAULT_HEIGHT),
  );
  ui.salesGeneratorFrame.style.height = `${next}px`;
}

window.addEventListener("message", (event) => {
  if (event.data?.type === "quote-generator:scroll-top") {
    if (state.currentView !== "sales-generator") return;
    scrollCurrentViewToTop();
    requestAnimationFrame(() => focusViewTarget("sales-generator"));
    return;
  }
  if (event.data?.type === "quote-generator:content-height") {
    applySalesGeneratorFrameHeight(event.data?.height);
  }
});

function getDashboardSubtitle() {
  const locale = state.lang === "it" ? "it-IT" : "en-GB";
  const now = new Date();
  const firstName = String(state.currentUser?.name || "").trim().split(/\s+/)[0] || "Team";
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const greeting = state.lang === "it"
    ? now.getHours() < 12 ? "Buongiorno" : now.getHours() < 18 ? "Buon pomeriggio" : "Buonasera"
    : now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  return `${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)} · ${greeting} ${firstName}`;
}

function normalizeLooseString(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function normalizeCrewAlias(value) {
  return normalizeLooseString(value)
    .replace(/\b(squadra|team|crew)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameCrewName(left, right) {
  const normalizedLeft = normalizeCrewAlias(left);
  const normalizedRight = normalizeCrewAlias(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight
    || normalizedLeft.includes(normalizedRight)
    || normalizedRight.includes(normalizedLeft);
}

function orderBelongsToCrew(order, crewName) {
  return isSameCrewName(order.operations?.installation?.crew || "", crewName);
}

function floorTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

function getProvinceAliasMap() {
  const aliases = {};
  Object.entries(ONE_EXPRESS_TARIFFS.provinceNames || {}).forEach(([code, name]) => {
    aliases[normalizeLooseString(code)] = code;
    aliases[normalizeLooseString(name)] = code;
  });
  aliases[normalizeLooseString("Valle d'Aosta")] = "AO";
  aliases[normalizeLooseString("Monza Brianza")] = "MB";
  aliases[normalizeLooseString("Verbano Cusio Ossola")] = "VB";
  aliases[normalizeLooseString("Forli Cesena")] = "FC";
  aliases[normalizeLooseString("Massa Carrara")] = "MS";
  aliases[normalizeLooseString("Barletta Andria Trani")] = "BT";
  aliases[normalizeLooseString("Pesaro Urbino")] = "PU";
  aliases[normalizeLooseString("Laquila")] = "AQ";
  aliases[normalizeLooseString("Olbia Tempio")] = "OT";
  aliases[normalizeLooseString("Carbonia Iglesias")] = "CI";
  aliases[normalizeLooseString("Medio Campidano")] = "VS";
  return aliases;
}

const PROVINCE_ALIAS_MAP = getProvinceAliasMap();
const CITY_PROVINCE_MAP = {
  "anguillara sabazia": "RM",
  anzio: "RM",
  bardolino: "VR",
  casalmaggiore: "CR",
  caserta: "CE",
  feltre: "BL",
  fosso: "VE",
  "la serra": "PO",
  "lavinio lido di enea": "RM",
  napoli: "NA",
  "novi ligure": "AL",
  pescasseroli: "AQ",
  pontedera: "PI",
  roma: "RM",
  saltrio: "VA",
  "zola predosa": "BO",
};
const SEARCHABLE_PROVINCE_ENTRIES = Object.entries(PROVINCE_ALIAS_MAP)
  .filter(([alias]) => alias.length > 2)
  .sort((left, right) => right[0].length - left[0].length);

function normalizeProvinceCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const compact = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (ONE_EXPRESS_TARIFFS.provinces?.[compact]) return compact;
  const alias = PROVINCE_ALIAS_MAP[normalizeLooseString(raw)];
  return alias || "";
}

function findProvinceCodeInNormalizedText(value) {
  const normalizedValue = normalizeLooseString(value);
  if (!normalizedValue) return "";
  const exactCityMatch = CITY_PROVINCE_MAP[normalizedValue];
  if (exactCityMatch) return exactCityMatch;
  const exactProvinceMatch = PROVINCE_ALIAS_MAP[normalizedValue];
  if (exactProvinceMatch) return exactProvinceMatch;
  for (const [cityAlias, code] of Object.entries(CITY_PROVINCE_MAP)) {
    if (normalizedValue.includes(cityAlias)) return code;
  }
  for (const [provinceAlias, code] of SEARCHABLE_PROVINCE_ENTRIES) {
    if (normalizedValue.includes(provinceAlias)) return code;
  }
  return "";
}

function extractProvinceCodeFromText(value) {
  const raw = String(value || "");
  if (!raw) return "";
  const directMatches = raw.match(/\b[A-Z]{2,3}\b/g) || [];
  for (const match of directMatches) {
    const normalized = normalizeProvinceCode(match);
    if (normalized) return normalized;
  }
  const bracketMatches = raw.match(/\(([A-Za-z]{2,3})\)/g) || [];
  for (const match of bracketMatches) {
    const normalized = normalizeProvinceCode(match);
    if (normalized) return normalized;
  }
  return findProvinceCodeInNormalizedText(raw) || normalizeProvinceCode(raw);
}

function getProvinceRecord(code) {
  return ONE_EXPRESS_TARIFFS.provinces?.[normalizeProvinceCode(code)] || null;
}

function getShippingRateMode() {
  return getShippingPricing().shippingRateMode === "manual-weight" ? "manual-weight" : "oneexpress-auto";
}

function getShippingTariffProfile() {
  return getShippingPricing().shippingTariffProfile === "gold" ? "gold" : "silver";
}

function getAccountingFilterLabel(filter = state.filters.accounting) {
  if (filter === "open") return t("accountingOpen");
  if (filter === "invoice") return state.lang === "it" ? "Da fatturare" : "To invoice";
  if (filter === "thisMonth") return state.lang === "it" ? "Questo mese" : "This month";
  if (filter === "lastMonth") return state.lang === "it" ? "Mese scorso" : "Last month";
  return t("all");
}

function updateOrderImportPanel() {
  if (ui.orderImportWrap) {
    ui.orderImportWrap.classList.toggle("hidden", !state.showOrderImport);
  }
  if (ui.ordersImportButton) {
    ui.ordersImportButton.textContent = state.showOrderImport
      ? (state.lang === "it" ? "Nascondi JSON" : "Hide JSON")
      : t("importJson");
    ui.ordersImportButton.setAttribute("aria-expanded", String(state.showOrderImport));
  }
  if (ui.orderImportConfirmButton) {
    ui.orderImportConfirmButton.textContent = state.lang === "it" ? "Importa adesso" : "Import now";
  }
  if (ui.orderImportClearButton) {
    ui.orderImportClearButton.textContent = state.lang === "it" ? "Svuota" : "Clear";
  }
}

function normalizeImportHeader(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitImportedFullName(value = "") {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { name: "", surname: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { name: cleaned, surname: "" };
  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts.slice(-1).join(" "),
  };
}

function parseDelimitedImportLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values.map((item) => item.replace(/^"(.*)"$/, "$1").trim());
}

function isSalesRequestHeightHeader(normalizedHeader = "") {
  const header = String(normalizedHeader || "").trim().replace(/\s+/g, " ");
  if (!header) return false;
  if ([
    "altezza",
    "altezza prato",
    "altezza da preventivare",
    "altezza preventivo",
    "altezza da preventivare mm",
    "altezza mm",
    "mm",
    "spessore",
    "spessore prato",
    "spessore mm",
    "h",
    "h mm",
    "h prato",
  ].includes(header)) return true;
  return header.includes("altezza") || header.includes("spessore");
}

function mapImportedSalesRequestField(target, header, rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return;
  const normalizedHeader = normalizeImportHeader(header);
  if (!normalizedHeader) return;

  if (["nome", "name", "first name", "firstname"].includes(normalizedHeader)) {
    target.name = value;
    return;
  }
  if (["cognome", "surname", "last name", "lastname"].includes(normalizedHeader)) {
    target.surname = value;
    return;
  }
  if (["cliente", "customer", "full name", "nome completo"].includes(normalizedHeader)) {
    const split = splitImportedFullName(value);
    target.name = split.name;
    target.surname = split.surname;
    return;
  }
  if (["citta", "city", "comune"].includes(normalizedHeader)) {
    target.city = value;
    return;
  }
  if (["telefono", "phone", "tel", "mobile", "cellulare"].includes(normalizedHeader)) {
    target.phone = value;
    return;
  }
  if (["email", "mail"].includes(normalizedHeader)) {
    target.email = value;
    return;
  }
  if (["mq", "sqm", "metri quadri", "metriquadrati"].includes(normalizedHeader)) {
    target.sqm = value;
    return;
  }
  if (isSalesRequestHeightHeader(normalizedHeader)) {
    target.requestedHeight = value;
    return;
  }
  if (["servizio", "service", "tipologia"].includes(normalizedHeader)) {
    target.service = value;
    return;
  }
  if (["fondo", "surface", "superficie"].includes(normalizedHeader)) {
    target.surface = value;
    return;
  }
  if (["assegnazione", "assignment", "owner", "commerciale", "team", "assegnato a", "assegnato", "assegnazione preventivo"].includes(normalizedHeader)) {
    target.assignment = value;
    return;
  }
  if (["stato", "status", "stato preventivo"].includes(normalizedHeader)) {
    target.status = value;
    return;
  }
  if ([
    "messaggio whatsapp",
    "template whatsapp",
    "testo whatsapp",
    "messaggio preimpostato whatsapp",
    "messaggio automatico whatsapp",
    "whatsapp message",
    "whatsapp automation message",
  ].includes(normalizedHeader)) {
    const maybeWhatsAppUrl = normalizeSalesRequestWhatsAppUrl(value);
    if (maybeWhatsAppUrl) {
      target.whatsappUrl = maybeWhatsAppUrl;
      return;
    }
    target.whatsappTemplate = value;
    return;
  }
  if (["note", "nota", "notes"].includes(normalizedHeader)) {
    target.note = value;
  }
}

function parseSalesRequestImport(raw = "") {
  const text = String(raw || "").trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.requests) ? parsed.requests : [parsed];
    return items
      .map((item) => normalizeSalesRequestRecord({ ...item, source: item?.source || "import" }))
      .filter((item) => item.name || item.surname || item.city || item.phone || item.email);
  } catch {}

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = [";", "\t", ","]
    .map((candidate) => ({ candidate, count: (lines[0].match(new RegExp(`\\${candidate}`, "g")) || []).length }))
    .sort((left, right) => right.count - left.count)[0]?.candidate || ";";

  const headers = parseDelimitedImportLine(lines[0], delimiter);
  return lines.slice(1)
    .map((line) => {
      const values = parseDelimitedImportLine(line, delimiter);
      const draft = { source: "import" };
      headers.forEach((header, index) => mapImportedSalesRequestField(draft, header, values[index] || ""));
      return normalizeSalesRequestRecord(draft);
    })
    .filter((item) => item.name || item.surname || item.city || item.phone || item.email);
}

function updateSalesRequestImportPanel() {
  if (ui.salesRequestImportWrap) {
    ui.salesRequestImportWrap.classList.toggle("hidden", !state.showSalesRequestImport);
  }
  if (ui.salesRequestImportButton) {
    ui.salesRequestImportButton.textContent = state.showSalesRequestImport
      ? (state.lang === "it" ? "Nascondi import" : "Hide import")
      : (state.lang === "it" ? "Importa richieste" : "Import requests");
    ui.salesRequestImportButton.setAttribute("aria-expanded", String(state.showSalesRequestImport));
  }
  if (ui.salesRequestImportConfirmButton) {
    ui.salesRequestImportConfirmButton.textContent = state.lang === "it" ? "Importa adesso" : "Import now";
  }
  if (ui.salesRequestImportClearButton) {
    ui.salesRequestImportClearButton.textContent = state.lang === "it" ? "Svuota" : "Clear";
  }
}

function buildSalesRequestSourceSummary() {
  const saved = normalizeSalesRequestSourceConfig(state.salesRequestSourceConfig || {});
  const pendingEmail = String(state.pendingSalesRequestServiceAccountEmail || "").trim();
  const effectiveEmail = pendingEmail || saved.serviceAccountEmail || "";
  const spreadsheetLabel = saved.spreadsheetInput || String(ui.salesRequestSpreadsheetInput?.value || "").trim();
  const sheetLabel = saved.sheetName || String(ui.salesRequestSheetNameInput?.value || "").trim();

  if (!spreadsheetLabel && !effectiveEmail) {
    return state.lang === "it" ? "Nessuna credenziale caricata." : "No credentials uploaded.";
  }
  if (!spreadsheetLabel) {
    return state.lang === "it"
      ? `Service account pronto: ${effectiveEmail || "da confermare"}. Inserisci lo spreadsheet e salva il collegamento.`
      : `Service account ready: ${effectiveEmail || "pending"}. Add the spreadsheet and save the connection.`;
  }
  return state.lang === "it"
    ? `Foglio collegato${sheetLabel ? ` · Tab ${sheetLabel}` : ""}. ${effectiveEmail ? `Service account: ${effectiveEmail}${pendingEmail ? " (da salvare)" : ""}.` : "Manca il service account: importa il JSON Google e salva il collegamento."}`
    : `Sheet connected${sheetLabel ? ` · Tab ${sheetLabel}` : ""}. ${effectiveEmail ? `Service account: ${effectiveEmail}${pendingEmail ? " (pending save)" : ""}.` : "Service account missing: upload the Google JSON and save the connection."}`;
}

function updateSalesRequestSourcePanel() {
  const config = normalizeSalesRequestSourceConfig(state.salesRequestSourceConfig || {});
  if (ui.salesRequestSpreadsheetInput && document.activeElement !== ui.salesRequestSpreadsheetInput) {
    ui.salesRequestSpreadsheetInput.value = config.spreadsheetInput || "";
  }
  if (ui.salesRequestSheetNameInput && document.activeElement !== ui.salesRequestSheetNameInput) {
    ui.salesRequestSheetNameInput.value = config.sheetName || "";
  }
  if (ui.salesRequestSourceSummary) {
    ui.salesRequestSourceSummary.textContent = buildSalesRequestSourceSummary();
    ui.salesRequestSourceSummary.classList.toggle("is-ready", Boolean(config.hasServiceAccount || state.pendingSalesRequestServiceAccountEmail));
  }
  if (ui.salesRequestOpenSheetButton) {
    ui.salesRequestOpenSheetButton.disabled = !config.editUrl;
  }
  if (ui.salesRequestClearServiceAccountButton) {
    ui.salesRequestClearServiceAccountButton.disabled = !config.hasServiceAccount && !state.pendingSalesRequestServiceAccountJson;
  }
  if (ui.salesRequestSourceSyncButton) {
    ui.salesRequestSourceSyncButton.disabled = !config.hasServiceAccount || !config.spreadsheetInput;
  }
}

function readSalesRequestSourceDraft() {
  return {
    spreadsheetInput: String(ui.salesRequestSpreadsheetInput?.value || "").trim(),
    sheetName: String(ui.salesRequestSheetNameInput?.value || "").trim(),
  };
}

function parseServiceAccountEmail(raw = "") {
  try {
    return String(JSON.parse(raw)?.client_email || "").trim();
  } catch {
    return "";
  }
}

async function handleSalesRequestServiceAccountSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const content = await file.text();
    const email = parseServiceAccountEmail(content);
    if (!email) {
      setStatus(ui.salesRequestSourceStatus, "error", state.lang === "it" ? "JSON service account non valido." : "Invalid service account JSON.");
      return;
    }
    state.pendingSalesRequestServiceAccountJson = content;
    state.pendingSalesRequestServiceAccountEmail = email;
    updateSalesRequestSourcePanel();
    setStatus(
      ui.salesRequestSourceStatus,
      "success",
      state.lang === "it" ? "Credenziali caricate. Salva il collegamento per attivarle." : "Credentials loaded. Save the connection to activate them.",
    );
  } catch {
    setStatus(ui.salesRequestSourceStatus, "error", state.lang === "it" ? "Impossibile leggere il file JSON." : "Unable to read the JSON file.");
  } finally {
    if (ui.salesRequestServiceAccountInput) ui.salesRequestServiceAccountInput.value = "";
  }
}

async function saveSalesRequestSourceConfig({ clearServiceAccount = false } = {}) {
  clearStatus(ui.salesRequestSourceStatus);
  const draft = readSalesRequestSourceDraft();
  const currentConfig = normalizeSalesRequestSourceConfig(state.salesRequestSourceConfig || {});
  if (!draft.spreadsheetInput) {
    setStatus(ui.salesRequestSourceStatus, "error", state.lang === "it" ? "Inserisci l'URL o ID dello spreadsheet." : "Enter the spreadsheet URL or ID.");
    return;
  }
  if (!clearServiceAccount && !state.pendingSalesRequestServiceAccountJson && !currentConfig.hasServiceAccount) {
    setStatus(
      ui.salesRequestSourceStatus,
      "error",
      state.lang === "it"
        ? "Carica prima il JSON del service account Google, poi salva il collegamento."
        : "Upload the Google service account JSON before saving the connection.",
    );
    return;
  }
  try {
    const saved = await apiFetch("/api/sales/request-source", {
      method: "POST",
      body: JSON.stringify({
        spreadsheetInput: draft.spreadsheetInput,
        sheetName: draft.sheetName,
        serviceAccountJson: clearServiceAccount ? "" : state.pendingSalesRequestServiceAccountJson,
        clearServiceAccount,
      }),
    });
    state.salesRequestSourceConfig = normalizeSalesRequestSourceConfig(saved);
    state.pendingSalesRequestServiceAccountJson = "";
    state.pendingSalesRequestServiceAccountEmail = "";
    updateSalesRequestSourcePanel();
    setStatus(
      ui.salesRequestSourceStatus,
      "success",
      clearServiceAccount
        ? (state.lang === "it" ? "Credenziali rimosse." : "Credentials removed.")
        : (state.lang === "it" ? "Collegamento Google Sheets salvato." : "Google Sheets connection saved."),
    );
  } catch (error) {
    const message = error?.message === "invalid_spreadsheet"
      ? (state.lang === "it" ? "Spreadsheet non valido." : "Invalid spreadsheet.")
      : error?.message === "missing_service_account"
        ? (state.lang === "it" ? "Carica prima il JSON del service account Google." : "Upload the Google service account JSON first.")
      : error?.message === "invalid_service_account_json"
        ? (state.lang === "it" ? "JSON service account non valido." : "Invalid service account JSON.")
        : (error?.message && !["sales_request_source_save_failed", "request_failed"].includes(error.message)
            ? error.message
            : (state.lang === "it" ? "Impossibile salvare il collegamento Google Sheets." : "Unable to save the Google Sheets connection."));
    setStatus(ui.salesRequestSourceStatus, "error", message);
  }
}

async function syncSalesRequestSource({ auto = false, silent = false } = {}) {
  if (salesRequestSyncInFlight) return false;
  salesRequestSyncInFlight = true;
  if (!silent) clearStatus(ui.salesRequestSourceStatus);
  try {
    const payload = await apiFetch("/api/sales/request-source/sync", { method: "POST" });
    state.salesRequests = Array.isArray(payload.requests) ? payload.requests.map(normalizeSalesRequestRecord) : [];
    state.salesRequestSourceConfig = normalizeSalesRequestSourceConfig(payload.config || state.salesRequestSourceConfig || {});
    state.creatingSalesRequest = false;
    state.salesRequestPage = 1;
    renderOps();
    renderSalesRequests();
    if (state.currentView === "sales-generator") renderSalesGenerator();
    if (!silent) {
      setStatus(
        ui.salesRequestSourceStatus,
        "success",
        state.lang === "it"
          ? `${Number(payload.importedCount || 0)} richieste aggiornate da Google Sheets.`
          : `${Number(payload.importedCount || 0)} requests updated from Google Sheets.`,
      );
    }
    return true;
  } catch (error) {
    const message = error?.message === "missing_service_account"
      ? (state.lang === "it" ? "Carica prima il service account Google." : "Upload the Google service account first.")
      : error?.message === "missing_spreadsheet"
        ? (state.lang === "it" ? "Inserisci prima lo spreadsheet." : "Add the spreadsheet first.")
        : (error?.message && !["sales_request_source_sync_failed", "request_failed"].includes(error.message)
            ? error.message
            : (state.lang === "it" ? "Impossibile aggiornare le richieste dal foglio Google." : "Unable to update requests from Google Sheets."));
    if (auto) {
      setStatus(
        ui.salesRequestSourceStatus,
        "error",
        state.lang === "it"
          ? `Auto-refresh richieste fallito. ${message}`
          : `Requests auto-refresh failed. ${message}`,
      );
    } else {
      setStatus(ui.salesRequestSourceStatus, "error", message);
    }
    return false;
  } finally {
    salesRequestSyncInFlight = false;
  }
}

function openSalesRequestSourceSheet() {
  const config = normalizeSalesRequestSourceConfig(state.salesRequestSourceConfig || {});
  if (!config.editUrl) return;
  window.open(config.editUrl, "_blank", "noopener,noreferrer");
}

function composeAddress(order) {
  return [order.address, order.city].filter(Boolean).join(", ");
}

function normalizeCoveragePlannerState(payload) {
  const teams = payload?.teams && typeof payload.teams === "object" ? payload.teams : {};
  const availability = payload?.availability && typeof payload.availability === "object" ? payload.availability : {};
  return { teams, availability };
}

function loadCoveragePlannerState() {
  try {
    const raw = window.localStorage.getItem(COVERAGE_STORAGE_KEY);
    const parsed = JSON.parse(raw || "null");
    if (!parsed || typeof parsed !== "object") return normalizeCoveragePlannerState();
    return normalizeCoveragePlannerState(parsed);
  } catch {
    return normalizeCoveragePlannerState();
  }
}

function saveCoveragePlannerState() {
  if (!canManageCoveragePlanner()) return false;
  try {
    const normalized = normalizeCoveragePlannerState(state.coveragePlanner);
    state.coveragePlanner = normalized;
    window.localStorage.setItem(COVERAGE_STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  queueCoveragePlannerSync();
  return true;
}

function queueCoveragePlannerSync() {
  if (!state.currentUser || !canManageCoveragePlanner()) return;
  window.clearTimeout(coverageSyncTimer);
  coverageSyncTimer = window.setTimeout(() => {
    void syncCoveragePlannerState();
  }, COVERAGE_SYNC_DEBOUNCE_MS);
}

async function syncCoveragePlannerState() {
  if (!state.currentUser || !canManageCoveragePlanner() || coverageSyncInFlight) return;
  coverageSyncInFlight = true;
  try {
    const saved = await apiFetch("/api/coverage-planner", {
      method: "POST",
      body: JSON.stringify(normalizeCoveragePlannerState(state.coveragePlanner)),
    });
    state.coveragePlanner = normalizeCoveragePlannerState(saved);
    try {
      window.localStorage.setItem(COVERAGE_STORAGE_KEY, JSON.stringify(state.coveragePlanner));
    } catch {}
  } catch (error) {
    console.error("coverage_planner_sync_failed", error);
  } finally {
    coverageSyncInFlight = false;
  }
}

function canManageCoveragePlanner() {
  return normalizeUserRole(state.currentUser?.role || "") === "office";
}

function getInstallationCrewNames() {
  const accountCrews = getCrewAccounts()
    .map((user) => getCrewLabelForUser(user))
    .filter(Boolean);
  const orderCrews = state.orders
    .map((order) => String(order.operations?.installation?.crew || "").trim())
    .filter(Boolean);
  const storedCrews = Object.keys(state.coveragePlanner?.teams || {});
  return Array.from(new Set([...crews, ...accountCrews, ...orderCrews, ...storedCrews]))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "it"));
}

function getCrewLabelForUser(user = {}) {
  return String(user?.crewName || user?.name || "").trim();
}

function getCrewAccounts() {
  const crewUsers = Array.isArray(state.users)
    ? state.users.filter((user) => user.role === "crew")
    : [];
  if (state.currentUser?.role === "crew") {
    const currentCrewName = getCrewLabelForUser(state.currentUser);
    const existing = crewUsers.some((user) => user.id === state.currentUser.id || isSameCrewName(getCrewLabelForUser(user), currentCrewName));
    if (!existing) crewUsers.push(state.currentUser);
  }
  return crewUsers;
}

function getCrewProfile(crewName = "") {
  if (!crewName) return null;
  return getCrewAccounts().find((user) => isSameCrewName(getCrewLabelForUser(user), crewName)) || null;
}

function getCrewDailyCapacity(crewName = "") {
  const profile = crewName ? getCrewProfile(crewName) : null;
  const capacity = Number(profile?.dailyCapacity || 0);
  return capacity > 0 ? capacity : DEFAULT_CREW_DAILY_CAPACITY;
}

function getInstallationCapacityForScope(crewName = "") {
  if (crewName) return getCrewDailyCapacity(crewName);
  const crewNames = getInstallationCrewNames();
  if (!crewNames.length) return DEFAULT_CREW_DAILY_CAPACITY;
  const scopedCapacity = crewNames.reduce((sum, name) => sum + getCrewDailyCapacity(name), 0);
  return scopedCapacity || DEFAULT_CREW_DAILY_CAPACITY;
}

function getTravelExpensesForOrder(order) {
  return Array.isArray(order?.operations?.installation?.travelExpenses)
    ? order.operations.installation.travelExpenses
    : [];
}

function getTravelExpenseLabel(category = "") {
  const key = TRAVEL_EXPENSE_TYPES[category] ? category : "other";
  return TRAVEL_EXPENSE_TYPES[key][state.lang === "it" ? "it" : "en"];
}

function getCoverageDefaultColor(index = 0) {
  return COVERAGE_DEFAULT_COLORS[index % COVERAGE_DEFAULT_COLORS.length];
}

function ensureCoverageTeam(teamName) {
  const key = String(teamName || "").trim();
  if (!key) return null;
  if (!state.coveragePlanner?.teams) state.coveragePlanner = { teams: {} };
  if (!state.coveragePlanner.availability) state.coveragePlanner.availability = {};
  if (!state.coveragePlanner.teams[key]) {
    const index = getInstallationCrewNames().indexOf(key);
    state.coveragePlanner.teams[key] = {
      color: getCoverageDefaultColor(index >= 0 ? index : Object.keys(state.coveragePlanner.teams).length),
      base: "",
      note: "",
      regions: [],
      polygons: [],
    };
  }
  return state.coveragePlanner.teams[key];
}

function ensureCrewAvailability(crewName) {
  if (!crewName) return {};
  if (!state.coveragePlanner) state.coveragePlanner = { teams: {} };
  if (!state.coveragePlanner.availability) state.coveragePlanner.availability = {};
  if (!state.coveragePlanner.availability[crewName]) state.coveragePlanner.availability[crewName] = {};
  return state.coveragePlanner.availability[crewName];
}

function isCrewUnavailable(crewName, dateKey) {
  if (!crewName || !dateKey) return false;
  const availability = ensureCrewAvailability(crewName);
  return Boolean(availability[dateKey]);
}

function toggleCrewUnavailable(crewName, dateKey) {
  if (!crewName || !dateKey) return;
  const availability = ensureCrewAvailability(crewName);
  if (availability[dateKey]) delete availability[dateKey];
  else availability[dateKey] = true;
  saveCoveragePlannerState();
  renderInstallations();
}

function getSelectedInstallationCrew() {
  const forcedCrew = getCrewForCurrentUser();
  if (forcedCrew) {
    state.selectedInstallationCrew = forcedCrew;
    return forcedCrew;
  }
  const crewsAvailable = getInstallationCrewNames();
  if (!crewsAvailable.length) return "";
  if (state.selectedInstallationCrew) {
    const matched = crewsAvailable.find((crewName) => isSameCrewName(crewName, state.selectedInstallationCrew));
    if (matched) {
      state.selectedInstallationCrew = matched;
      return matched;
    }
  }
  state.selectedInstallationCrew = crewsAvailable[0];
  return state.selectedInstallationCrew;
}

function selectInstallationCrew(teamName) {
  if (!teamName) return;
  const crewsAvailable = getInstallationCrewNames();
  const resolved = crewsAvailable.find((crewName) => isSameCrewName(crewName, teamName)) || teamName;
  state.selectedInstallationCrew = resolved;
  ensureCoverageTeam(resolved);
  state.coverageDrawing = { active: false, points: [] };
  saveCoveragePlannerState();
  renderInstallations();
}

function buildInstallationCrewOptions(selectedCrew = "") {
  const forcedCrew = getCrewForCurrentUser();
  const crewNames = forcedCrew ? [forcedCrew] : getInstallationCrewNames();
  const selectedValue = forcedCrew || selectedCrew || activeCrewLabelFromFilter() || getSelectedInstallationCrew();
  return [`<option value="">${state.lang === "it" ? "Seleziona squadra" : "Select crew"}</option>`]
    .concat(
      crewNames.map((crewName) => `<option value="${escapeHtml(crewName)}" ${crewName === selectedValue ? "selected" : ""}>${escapeHtml(crewName)}</option>`)
    )
    .join("");
}

function updateCoverageTeamForm() {
  if (!ui.coverageTeamForm) return;
  const selectedCrew = getSelectedInstallationCrew();
  const team = selectedCrew ? ensureCoverageTeam(selectedCrew) : null;
  ui.coverageTeamForm.teamName.value = selectedCrew || "";
  ui.coverageTeamForm.teamBase.value = team?.base || "";
  ui.coverageTeamForm.teamColor.value = team?.color || getCoverageDefaultColor(0);
  ui.coverageTeamForm.teamNote.value = team?.note || "";
}

function saveCoverageTeamFromForm(event) {
  event.preventDefault();
  if (!ui.coverageTeamForm) return;
  const form = new FormData(ui.coverageTeamForm);
  const teamName = String(form.get("teamName") || "").trim();
  if (!teamName) {
    setStatus(ui.installationStatus, "error", state.lang === "it" ? "Inserisci il nome della squadra." : "Enter a crew name.");
    return;
  }
  const previousCrew = getSelectedInstallationCrew();
  const currentConfig = previousCrew && previousCrew !== teamName ? ensureCoverageTeam(previousCrew) : null;
  const existing = ensureCoverageTeam(teamName);
  if (currentConfig && !state.coveragePlanner.teams[teamName]?.base && !state.coveragePlanner.teams[teamName]?.regions?.length && !state.coveragePlanner.teams[teamName]?.polygons?.length) {
    state.coveragePlanner.teams[teamName] = {
      ...currentConfig,
      ...existing,
    };
  }
  state.coveragePlanner.teams[teamName] = {
    ...(state.coveragePlanner.teams[teamName] || {}),
    base: String(form.get("teamBase") || "").trim(),
    color: String(form.get("teamColor") || getCoverageDefaultColor(0)),
    note: String(form.get("teamNote") || "").trim(),
    regions: state.coveragePlanner.teams[teamName]?.regions || [],
    polygons: state.coveragePlanner.teams[teamName]?.polygons || [],
  };
  if (currentConfig && previousCrew && previousCrew !== teamName) {
    delete state.coveragePlanner.teams[previousCrew];
    state.orders = state.orders.map((order) => {
      if (!orderBelongsToCrew(order, previousCrew)) return order;
      return {
        ...order,
        operations: {
          ...(order.operations || {}),
          installation: {
            ...(order.operations?.installation || {}),
            crew: teamName,
          },
        },
      };
    });
  }
  state.selectedInstallationCrew = teamName;
  saveCoveragePlannerState();
  renderInstallations();
  setStatus(ui.installationStatus, "success", state.lang === "it" ? "Squadra aggiornata sulla cartina." : "Crew updated on the map.");
}

function addCoverageTeam() {
  let attempt = 1;
  let candidate = state.lang === "it" ? "Nuova squadra" : "New crew";
  const names = getInstallationCrewNames();
  while (names.includes(candidate)) {
    attempt += 1;
    candidate = `${state.lang === "it" ? "Nuova squadra" : "New crew"} ${attempt}`;
  }
  ensureCoverageTeam(candidate);
  state.selectedInstallationCrew = candidate;
  saveCoveragePlannerState();
  renderInstallations();
  requestAnimationFrame(() => {
    ui.coverageTeamForm?.teamName?.focus();
    ui.coverageTeamForm?.teamName?.select();
  });
}

function removeCoverageTeam() {
  const selectedCrew = getSelectedInstallationCrew();
  if (!selectedCrew || !state.coveragePlanner?.teams?.[selectedCrew]) return;
  const assignedOrders = state.orders.filter((order) => orderBelongsToCrew(order, selectedCrew));
  const confirmed = window.confirm(
    state.lang === "it"
      ? `Rimuovere ${selectedCrew} dal radar e scollegarla da ${assignedOrders.length} ordini assegnati?`
      : `Remove ${selectedCrew} from coverage and detach it from ${assignedOrders.length} assigned orders?`
  );
  if (!confirmed) return;
  delete state.coveragePlanner.teams[selectedCrew];
  if (assignedOrders.length) {
    state.orders = state.orders.map((order) => {
      if (!orderBelongsToCrew(order, selectedCrew)) return order;
      return {
        ...order,
        operations: {
          ...(order.operations || {}),
          installation: {
            ...(order.operations?.installation || {}),
            crew: "",
          },
        },
      };
    });
  }
  const remainingCrews = getInstallationCrewNames().filter((crewName) => normalizeLooseString(crewName) !== normalizeLooseString(selectedCrew));
  state.selectedInstallationCrew = remainingCrews[0] || "";
  state.coverageDrawing = { active: false, points: [] };
  saveCoveragePlannerState();
  renderInstallations();
  setStatus(ui.installationStatus, "success", state.lang === "it" ? "Squadra rimossa dal radar." : "Crew removed from coverage.");
}

function getInstallationOrdersForCrew(teamName) {
  return filterInstallations().filter((order) => orderBelongsToCrew(order, teamName));
}

function projectCoverageLatLng(lat, lng) {
  const x = clampNumber((lng - COVERAGE_BOUNDS.minLon) / (COVERAGE_BOUNDS.maxLon - COVERAGE_BOUNDS.minLon), 0, 1);
  const y = clampNumber((COVERAGE_BOUNDS.maxLat - lat) / (COVERAGE_BOUNDS.maxLat - COVERAGE_BOUNDS.minLat), 0, 1);
  return { x, y };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCoveragePointFromText(value) {
  const normalized = normalizeLooseString(value);
  if (!normalized) return null;
  if (COVERAGE_CITY_COORDINATES[normalized]) {
    const point = COVERAGE_CITY_COORDINATES[normalized];
    return projectCoverageLatLng(point.lat, point.lng);
  }
  for (const [cityName, point] of Object.entries(COVERAGE_CITY_COORDINATES)) {
    if (normalized.includes(cityName)) return projectCoverageLatLng(point.lat, point.lng);
  }
  return null;
}

function getCoveragePointForOrder(order) {
  return getCoveragePointFromText(order.city) || getCoveragePointFromText(composeAddress(order)) || null;
}

function polygonToSvgPoints(polygon) {
  return polygon
    .map((point) => `${Math.round(point.x * COVERAGE_MAP_SIZE.width)},${Math.round(point.y * COVERAGE_MAP_SIZE.height)}`)
    .join(" ");
}

function polygonCenter(polygon = []) {
  if (!polygon.length) return null;
  const total = polygon.reduce((acc, point) => {
    acc.x += point.x;
    acc.y += point.y;
    return acc;
  }, { x: 0, y: 0 });
  return {
    x: total.x / polygon.length,
    y: total.y / polygon.length,
  };
}

function getCoverageDrawingPointFromEvent(event) {
  const rect = ui.coverageMapOverlay?.getBoundingClientRect();
  if (!rect) return null;
  const x = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clampNumber((event.clientY - rect.top) / rect.height, 0, 1);
  return { x, y };
}

function toggleCoverageDrawing() {
  const selectedCrew = getSelectedInstallationCrew();
  if (!selectedCrew) return;
  ensureCoverageTeam(selectedCrew);
  state.coverageDrawing = state.coverageDrawing?.active
    ? { active: false, points: [] }
    : { active: true, points: [] };
  renderInstallations();
}

function undoCoveragePoint() {
  if (!state.coverageDrawing?.active) return;
  state.coverageDrawing.points.pop();
  renderInstallationsCoverage();
}

function cancelCoverageDrawing() {
  state.coverageDrawing = { active: false, points: [] };
  renderInstallationsCoverage();
}

function closeCoveragePolygon() {
  const selectedCrew = getSelectedInstallationCrew();
  const team = ensureCoverageTeam(selectedCrew);
  const points = state.coverageDrawing?.points || [];
  if (!team || points.length < 3) return;
  team.polygons = team.polygons || [];
  team.polygons.push(points.map((point) => ({
    x: floorTo(point.x, 4),
    y: floorTo(point.y, 4),
  })));
  saveCoveragePlannerState();
  state.coverageDrawing = { active: false, points: [] };
  renderInstallations();
}

function clearCoveragePolygons() {
  const selectedCrew = getSelectedInstallationCrew();
  const team = ensureCoverageTeam(selectedCrew);
  if (!team?.polygons?.length) return;
  const confirmed = window.confirm(state.lang === "it" ? `Cancellare tutte le aree di ${selectedCrew}?` : `Delete all areas for ${selectedCrew}?`);
  if (!confirmed) return;
  team.polygons = [];
  saveCoveragePlannerState();
  cancelCoverageDrawing();
}

function toggleCoverageRegion(regionName) {
  const selectedCrew = getSelectedInstallationCrew();
  const team = ensureCoverageTeam(selectedCrew);
  if (!team) return;
  team.regions = Array.isArray(team.regions) ? team.regions : [];
  if (team.regions.includes(regionName)) {
    team.regions = team.regions.filter((item) => item !== regionName);
  } else {
    team.regions.push(regionName);
  }
  saveCoveragePlannerState();
  renderInstallationsCoverage();
}

function handleCoverageMapClick(event) {
  if (!state.coverageDrawing?.active) return;
  const point = getCoverageDrawingPointFromEvent(event);
  if (!point) return;
  state.coverageDrawing.points.push(point);
  renderInstallationsCoverage();
}

function renderInstallationsCoverage() {
  const crewNames = getInstallationCrewNames();
  if (ui.coverageTeamList) {
    ui.coverageTeamList.innerHTML = crewNames.length
      ? crewNames.map((crewName) => {
          const team = ensureCoverageTeam(crewName);
          const jobs = getInstallationOrdersForCrew(crewName);
          return `
            <button class="coverage-team-card ${crewName === getSelectedInstallationCrew() ? "is-active" : ""}" type="button" data-action="select-coverage-team" data-coverage-team="${escapeHtml(crewName)}">
              <div class="coverage-team-title">
                <div class="coverage-team-name">
                  <span class="coverage-swatch" style="background:${escapeHtml(team.color || getCoverageDefaultColor(0))}"></span>
                  <span>${escapeHtml(crewName)}</span>
                </div>
                <span class="coverage-count">${jobs.length} ${state.lang === "it" ? "cantieri" : "jobs"}</span>
              </div>
              <div class="coverage-meta">
                ${team.base ? `<span class="coverage-tag">Base ${escapeHtml(team.base)}</span>` : ""}
                <span class="coverage-tag">${(team.regions || []).length} ${state.lang === "it" ? "regioni" : "regions"}</span>
                <span class="coverage-tag">${(team.polygons || []).length} ${state.lang === "it" ? "aree" : "areas"}</span>
              </div>
            </button>
          `;
        }).join("")
      : `<div class="coverage-empty">${state.lang === "it" ? "Nessuna squadra disponibile." : "No crews available."}</div>`;
  }

  const selectedCrew = getSelectedInstallationCrew();
  const team = selectedCrew ? ensureCoverageTeam(selectedCrew) : null;
  const jobs = selectedCrew ? getInstallationOrdersForCrew(selectedCrew) : [];
  if (ui.coverageRegionGrid) {
    ui.coverageRegionGrid.innerHTML = COVERAGE_REGIONS.map((regionName) => `
      <button class="coverage-region-chip ${(team?.regions || []).includes(regionName) ? "is-selected" : ""}" type="button" data-coverage-region="${escapeHtml(regionName)}">${escapeHtml(regionName)}</button>
    `).join("");
  }
  if (ui.coverageRegionCount) ui.coverageRegionCount.textContent = String((team?.regions || []).length);
  if (ui.coverageJobCount) ui.coverageJobCount.textContent = String(jobs.length);
  if (ui.coverageActiveTitle) ui.coverageActiveTitle.textContent = selectedCrew || (state.lang === "it" ? "Nessuna squadra selezionata" : "No crew selected");
  if (ui.coverageActiveSubtitle) {
    const summary = selectedCrew
      ? [
          team?.base ? `Base ${team.base}` : (state.lang === "it" ? "Base non indicata" : "Base missing"),
          (team?.regions || []).length ? `${state.lang === "it" ? "Regioni" : "Regions"}: ${(team.regions || []).join(", ")}` : (state.lang === "it" ? "Nessuna regione associata" : "No linked regions"),
          jobs.length ? `${jobs.length} ${state.lang === "it" ? "cantieri assegnati" : "assigned jobs"}` : (state.lang === "it" ? "Nessun cantiere assegnato" : "No assigned jobs"),
        ].join(" • ")
      : (state.lang === "it" ? "Seleziona una squadra per vedere copertura e cantieri assegnati." : "Select a crew to view coverage and assigned jobs.");
    ui.coverageActiveSubtitle.textContent = summary;
  }

  if (ui.coverageJobsList) {
    ui.coverageJobsList.innerHTML = jobs.length
      ? jobs.map((order, index) => `
          <button class="coverage-job-card" type="button" data-action="select-coverage-order" data-coverage-order="${escapeHtml(order.id)}">
            <div class="coverage-job-head">
              <div class="coverage-job-title">
                <span class="coverage-count">${index + 1}</span>
                <span>${escapeHtml(composeClientName(order))}</span>
              </div>
              <span class="coverage-tag">${order.operations?.installation?.installDate ? formatDate(order.operations.installation.installDate) : t("toPlan")}</span>
            </div>
            <div class="coverage-job-meta">${escapeHtml(composeAddress(order) || order.city || addressIncompleteText())}</div>
            <div class="coverage-meta">
              <span class="coverage-tag">${escapeHtml(getOrderNumber(order))}</span>
              <span class="coverage-tag">${Math.round(toNumber(order.operations?.sqm || 0))} mq</span>
              <span class="coverage-tag">${escapeHtml(order.operations?.product || t("undefined"))}</span>
            </div>
          </button>
        `).join("")
      : `<div class="coverage-empty">${state.lang === "it" ? "Nessun cantiere assegnato a questa squadra nella vista posa." : "No jobs assigned to this crew in the install view."}</div>`;
  }

  renderCoverageOverlay(selectedCrew, team, jobs);
  updateCoverageTeamForm();
  updateCoverageControls();
}

function renderCoverageOverlay(selectedCrew, team, jobs) {
  if (!ui.coverageMapOverlay) return;
  const fragments = [
    `<defs>
      <marker id="coverage-arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M0,0 L12,6 L0,12 z" fill="${escapeHtml(team?.color || "#2d6a4f")}"></path>
      </marker>
    </defs>`,
  ];

  Object.entries(state.coveragePlanner?.teams || {}).forEach(([crewName, config]) => {
    const color = config?.color || getCoverageDefaultColor(0);
    (config?.polygons || []).forEach((polygon) => {
      const center = polygonCenter(polygon);
      fragments.push(`
        <polygon points="${polygonToSvgPoints(polygon)}" fill="${escapeHtml(color)}" fill-opacity="${crewName === selectedCrew ? 0.24 : 0.1}" stroke="${escapeHtml(color)}" stroke-width="${crewName === selectedCrew ? 4 : 2}"></polygon>
        ${crewName === selectedCrew && center ? `<text class="coverage-area-label" x="${Math.round(center.x * COVERAGE_MAP_SIZE.width)}" y="${Math.round(center.y * COVERAGE_MAP_SIZE.height)}" text-anchor="middle" fill="${escapeHtml(color)}">${escapeHtml(crewName)}</text>` : ""}
      `);
    });
  });

  const basePoint = team?.base ? getCoveragePointFromText(team.base) : null;
  if (basePoint) {
    fragments.push(`
      <circle cx="${Math.round(basePoint.x * COVERAGE_MAP_SIZE.width)}" cy="${Math.round(basePoint.y * COVERAGE_MAP_SIZE.height)}" r="13" fill="${escapeHtml(team.color)}" stroke="#fff" stroke-width="4"></circle>
      <text class="coverage-pin-label" x="${Math.round(basePoint.x * COVERAGE_MAP_SIZE.width)}" y="${Math.round(basePoint.y * COVERAGE_MAP_SIZE.height - 18)}" text-anchor="middle" fill="${escapeHtml(team.color)}">${escapeHtml(team.base)}</text>
    `);
  }

  jobs.forEach((order, index) => {
    const point = getCoveragePointForOrder(order);
    if (!point) return;
    const x = Math.round(point.x * COVERAGE_MAP_SIZE.width);
    const y = Math.round(point.y * COVERAGE_MAP_SIZE.height);
    if (basePoint) {
      fragments.push(`<line class="coverage-arrow-line" x1="${Math.round(basePoint.x * COVERAGE_MAP_SIZE.width)}" y1="${Math.round(basePoint.y * COVERAGE_MAP_SIZE.height)}" x2="${x}" y2="${y}" stroke="${escapeHtml(team.color)}" marker-end="url(#coverage-arrowhead)"></line>`);
    }
    fragments.push(`
      <circle cx="${x}" cy="${y}" r="12" fill="${escapeHtml(team.color)}" stroke="#fff" stroke-width="4"></circle>
      <text class="coverage-pin-label" x="${x}" y="${y + 7}" text-anchor="middle" fill="#ffffff">${index + 1}</text>
    `);
  });

  const draftPoints = state.coverageDrawing?.points || [];
  if (draftPoints.length) {
    const points = polygonToSvgPoints(draftPoints);
    if (draftPoints.length >= 3) {
      fragments.push(`<polygon points="${points}" fill="#111827" fill-opacity="0.12" stroke="#111827" stroke-width="2"></polygon>`);
    }
    fragments.push(`<polyline points="${points}" fill="none" stroke="#111827" stroke-width="3" stroke-dasharray="8 8"></polyline>`);
    draftPoints.forEach((point) => {
      fragments.push(`<circle cx="${Math.round(point.x * COVERAGE_MAP_SIZE.width)}" cy="${Math.round(point.y * COVERAGE_MAP_SIZE.height)}" r="6" fill="#111827" stroke="#ffffff" stroke-width="2"></circle>`);
    });
  }

  ui.coverageMapOverlay.innerHTML = fragments.join("");
  ui.coverageMapOverlay.classList.toggle("is-idle", !state.coverageDrawing?.active);
}

function updateCoverageControls() {
  if (ui.coverageDrawButton) {
    ui.coverageDrawButton.classList.toggle("is-feedback", Boolean(state.coverageDrawing?.active));
    ui.coverageDrawButton.textContent = state.coverageDrawing?.active
      ? (state.lang === "it" ? "Disegno attivo" : "Drawing active")
      : (state.lang === "it" ? "Disegna area" : "Draw area");
  }
  if (ui.coverageUndoPointButton) ui.coverageUndoPointButton.disabled = !state.coverageDrawing?.active || !(state.coverageDrawing?.points || []).length;
  if (ui.coverageClosePolygonButton) ui.coverageClosePolygonButton.disabled = !state.coverageDrawing?.active || (state.coverageDrawing?.points || []).length < 3;
  if (ui.coverageClearPolygonsButton) ui.coverageClearPolygonsButton.disabled = !(ensureCoverageTeam(getSelectedInstallationCrew())?.polygons || []).length;
  if (ui.coverageRemoveTeamButton) ui.coverageRemoveTeamButton.disabled = !getSelectedInstallationCrew();
}

function getOrderNumber(order) {
  return String(order.orderNumber || order.id || "—");
}

function getPaymentLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("paid")) return t("paid");
  if (normalized.includes("part")) return t("partial");
  return t("pending");
}

function getFulfillmentLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("fulfill") && !normalized.includes("un")) return t("fulfilled");
  if (normalized.includes("progress")) return t("partial");
  return t("unfulfilled");
}

function statusChip(label, tone) {
  return `<span class="status-chip status-${tone}">${label}</span>`;
}

function buildOrderTone(order) {
  const ops = order.operations || {};
  if (ops.warehouse?.status === "bloccato" || ops.installation?.status === "problema") return [state.lang === "it" ? "Blocco" : "Blocked", "red"];
  const stage = getUnifiedOrderStage(order);
  return [stage.label, stage.tone];
}

function getSelectedOrder() {
  return state.orders.find((order) => order.id === state.selectedOrderId) || state.orders[0] || null;
}

function ensureSelectedOrder() {
  if (!state.orders.length) {
    state.selectedOrderId = null;
    return;
  }
  if (!state.selectedOrderId || !state.orders.some((order) => order.id === state.selectedOrderId)) {
    state.selectedOrderId = state.orders[0].id;
  }
}

function getOrdersPageSize() {
  if (window.innerWidth <= 520) return 6;
  if (window.innerWidth <= 720) return 7;
  if (window.innerWidth <= 980) return 9;
  return 12;
}

function paginateOrders(items) {
  const pageSize = getOrdersPageSize();
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  state.orderPage = Math.min(Math.max(1, state.orderPage || 1), totalPages);
  const start = (state.orderPage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    pageSize,
    totalPages,
    totalItems: items.length,
  };
}

function normalizeAccountingPaymentEntry(entry = {}, index = 0, fallbackMethod = "") {
  const amount = Number(toNumber(entry.amount ?? entry.value ?? 0).toFixed(2));
  if (amount <= 0) return null;
  const type = ["deposit", "balance", "manual"].includes(String(entry.type || "").trim())
    ? String(entry.type || "").trim()
    : "manual";
  return {
    id: String(entry.id || `payment-${Date.now()}-${index}`),
    type,
    amount,
    method: String(entry.method || fallbackMethod || "").trim(),
    date: String(entry.date || "").trim(),
    note: String(entry.note || "").trim(),
  };
}

function getAccountingPayments(order) {
  const accounting = order?.accounting || {};
  const explicit = Array.isArray(accounting.payments)
    ? accounting.payments.map((entry, index) => normalizeAccountingPaymentEntry(entry, index, accounting.paymentMethod || order?.paymentMethod || ""))
      .filter(Boolean)
    : [];
  if (explicit.length) return explicit;

  const legacy = [];
  const paymentMethod = accounting.paymentMethod || order?.paymentMethod || "";
  const depositPaid = Number(toNumber(accounting.depositPaid || 0).toFixed(2));
  const balancePaid = Number(toNumber(accounting.balancePaid || 0).toFixed(2));
  if (depositPaid > 0) {
    legacy.push(normalizeAccountingPaymentEntry({
      id: `legacy-deposit-${order?.id || "order"}`,
      type: "deposit",
      amount: depositPaid,
      method: paymentMethod,
    }, 0, paymentMethod));
  }
  if (balancePaid > 0) {
    legacy.push(normalizeAccountingPaymentEntry({
      id: `legacy-balance-${order?.id || "order"}`,
      type: "balance",
      amount: balancePaid,
      method: paymentMethod,
    }, 1, paymentMethod));
  }
  return legacy.filter(Boolean);
}

function getAccountingPaymentTypeLabel(type = "manual") {
  if (type === "deposit") return state.lang === "it" ? "Acconto registrato" : "Recorded deposit";
  if (type === "balance") return state.lang === "it" ? "Saldo registrato" : "Recorded balance";
  return state.lang === "it" ? "Pagamento registrato" : "Recorded payment";
}

function createEmptyAccountingPayment(order = null) {
  return {
    id: `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "manual",
    amount: 0,
    method: getEffectivePaymentMethod(order || {}) || "",
    date: "",
    note: "",
  };
}

function readAccountingPaymentDraft() {
  if (!ui.accountingPaymentsEditor) return [];
  return Array.from(ui.accountingPaymentsEditor.querySelectorAll(".payment-entry"))
    .map((row, index) => normalizeAccountingPaymentEntry({
      id: row.dataset.paymentId || `draft-${index}`,
      type: row.querySelector("[name='paymentType']")?.value || "manual",
      amount: row.querySelector("[name='paymentAmount']")?.value || 0,
      method: row.querySelector("[name='paymentMethod']")?.value || "",
      date: row.querySelector("[name='paymentDate']")?.value || "",
    }, index))
    .filter(Boolean);
}

function renderAccountingPaymentEditor(order, payments = null) {
  if (!ui.accountingPaymentsEditor) return;
  const entries = Array.isArray(payments) ? payments : getAccountingPayments(order);
  if (!entries.length) {
    ui.accountingPaymentsEditor.innerHTML = `
      <div class="info-card payment-entry-empty">
        ${state.lang === "it" ? "Nessun pagamento interno registrato. Usa il pulsante qui sotto per aggiungerne uno." : "No internal payments recorded yet. Use the button below to add one."}
      </div>
    `;
    return;
  }
  ui.accountingPaymentsEditor.innerHTML = entries.map((payment) => `
    <div class="payment-entry" data-payment-id="${escapeHtml(payment.id)}">
      <div class="payment-entry-grid">
        <label class="field">
          <span>${state.lang === "it" ? "Tipo" : "Type"}</span>
          <select class="text-input" name="paymentType">
            <option value="deposit" ${payment.type === "deposit" ? "selected" : ""}>${state.lang === "it" ? "Acconto" : "Deposit"}</option>
            <option value="balance" ${payment.type === "balance" ? "selected" : ""}>${state.lang === "it" ? "Saldo" : "Balance"}</option>
            <option value="manual" ${payment.type === "manual" ? "selected" : ""}>${state.lang === "it" ? "Altro" : "Other"}</option>
          </select>
        </label>
        <label class="field">
          <span>${state.lang === "it" ? "Importo" : "Amount"}</span>
          <input class="text-input" name="paymentAmount" placeholder="0,00" value="${escapeHtml(payment.amount ? String(payment.amount).replace(".", ",") : "")}" />
        </label>
        <label class="field">
          <span>${state.lang === "it" ? "Metodo" : "Method"}</span>
          <input class="text-input" name="paymentMethod" placeholder="${state.lang === "it" ? "Bonifico, contanti..." : "Wire, cash..."}" value="${escapeHtml(payment.method || "")}" />
        </label>
        <label class="field">
          <span>${state.lang === "it" ? "Data" : "Date"}</span>
          <input class="text-input" type="date" name="paymentDate" value="${escapeHtml(payment.date || "")}" />
        </label>
      </div>
      <div class="payment-entry-actions">
        <button type="button" class="ghost-button small-button payment-entry-remove" data-remove-payment="${escapeHtml(payment.id)}">${state.lang === "it" ? "Rimuovi" : "Remove"}</button>
      </div>
    </div>
  `).join("");
}

function addAccountingPaymentRow() {
  const order = getSelectedOrder();
  if (!order) return;
  const draft = readAccountingPaymentDraft();
  draft.push(createEmptyAccountingPayment(order));
  renderAccountingPaymentEditor(order, draft);
}

function removeAccountingPaymentRow(paymentId) {
  const order = getSelectedOrder();
  if (!order || !paymentId) return;
  const draft = readAccountingPaymentDraft().filter((entry) => entry.id !== paymentId);
  renderAccountingPaymentEditor(order, draft);
}

function getOpenBalance(order) {
  const total = getOrderGrossTotal(order);
  const effectivePaid = Math.max(getShopifyPaidAmount(order), getInternalPaidAmount(order));
  const residual = Math.max(0, total - effectivePaid);
  return residual < 0.05 ? 0 : residual;
}

function getShopifyPaidAmount(order) {
  const normalized = String(order.financialStatus || "").toLowerCase();
  if (normalized.includes("paid") && !normalized.includes("partial")) return toNumber(order.total);
  return 0;
}

function isShopifyPaid(order) {
  return getShopifyPaidAmount(order) > 0;
}

function getInternalPaidAmount(order) {
  return Number(getAccountingPayments(order).reduce((sum, payment) => sum + toNumber(payment.amount || 0), 0).toFixed(2));
}

function getCollectedAmount(order) {
  return Math.max(0, toNumber(order.total) - getOpenBalance(order));
}

function getAccountingNote(order) {
  if (isShopifyPaid(order) && !getInternalPaidAmount(order)) {
    return t("shopifyPaymentCaptured");
  }
  return t("internalAccountingPending");
}

function getEffectivePaymentMethod(order) {
  return order.accounting?.paymentMethod
    || order.paymentMethod
    || (getShopifyPaidAmount(order) > 0 ? t("shopifyMethodFallback") : t("methodUnavailable"));
}

function getOrderLineSummary(order) {
  const lines = order.lineDetails || [];
  const totalPieces = lines.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  return {
    lines: lines.length,
    pieces: totalPieces,
  };
}

function getOrderGrossTotal(order) {
  return toNumber(order?.totals?.grossTotal ?? order?.total ?? 0);
}

function getOrderTaxTotal(order) {
  return toNumber(order?.totals?.taxTotal ?? 0);
}

function isLikelyFlatShopifyVatFallback(order) {
  if (!isShopifyBackedOrder(order)) return false;
  const grossTotal = getOrderGrossTotal(order);
  const taxTotal = toNumber(order?.totals?.taxTotal ?? 0);
  const netSubtotal = toNumber(order?.totals?.netSubtotal ?? 0);
  if (grossTotal <= 0 || taxTotal <= 0 || netSubtotal <= 0) return false;
  const flatTax = Number((grossTotal - (grossTotal / 1.22)).toFixed(2));
  const flatNet = Number((grossTotal / 1.22).toFixed(2));
  return Math.abs(taxTotal - flatTax) <= 0.02 && Math.abs(netSubtotal - flatNet) <= 0.02;
}

function hasDerivedShopifyFinancials(order) {
  if (!isShopifyBackedOrder(order)) return false;
  const taxSource = String(order?.totals?.taxSource || "").trim().toLowerCase();
  const netSource = String(order?.totals?.netSource || "").trim().toLowerCase();
  if (taxSource === "legacy-fallback" || netSource === "legacy-fallback") return true;
  if (taxSource === "derived" || netSource === "derived") return true;
  if (!taxSource && !netSource && isLikelyFlatShopifyVatFallback(order)) return true;
  return false;
}

function hasReliableTaxData(order) {
  const totals = order?.totals || {};
  if (hasDerivedShopifyFinancials(order)) return false;
  if (typeof totals.taxKnown === "boolean") return totals.taxKnown;
  return totals.taxTotal != null && String(totals.taxTotal).trim() !== "";
}

function hasReliableNetData(order) {
  const totals = order?.totals || {};
  if (hasDerivedShopifyFinancials(order)) return false;
  if (typeof totals.netKnown === "boolean") return totals.netKnown;
  return totals.netSubtotal != null && String(totals.netSubtotal).trim() !== "";
}

function canEstimateItalianVat(order) {
  const billing = order?.billing || {};
  const source = String(order?.source || "").toLowerCase();
  const countryCode = String(billing.countryCode || order?.countryCode || "IT").trim().toUpperCase();
  if (source.startsWith("shopify")) return false;
  if (countryCode !== "IT") return false;
  if (billing.taxExempt) return false;
  if (getOrderGrossTotal(order) <= 0) return false;
  const lineDetails = Array.isArray(order?.lineDetails) ? order.lineDetails : [];
  const hasExplicitUntaxedLine = lineDetails.some((item) => item?.taxable === false && (
    (Array.isArray(item?.taxLines) && item.taxLines.length > 0)
    || toNumber(item?.totalPrice || 0) > 0
    || String(item?.sku || "").trim()
    || String(item?.variant || "").trim()
  ));
  if (hasExplicitUntaxedLine) return false;
  return true;
}

function getEstimatedItalianVatTotal(order) {
  if (!canEstimateItalianVat(order)) return 0;
  const grossTotal = getOrderGrossTotal(order);
  return Number((grossTotal - (grossTotal / 1.22)).toFixed(2));
}

function isEstimatedVatDisplay(order) {
  return !hasReliableTaxData(order) && canEstimateItalianVat(order);
}

function getDisplayedTaxTotal(order) {
  return isEstimatedVatDisplay(order)
    ? getEstimatedItalianVatTotal(order)
    : getOrderTaxTotal(order);
}

function getDisplayedNetSubtotal(order) {
  if (hasReliableNetData(order)) return getOrderNetSubtotal(order);
  if (isEstimatedVatDisplay(order)) {
    return Number((getOrderGrossTotal(order) - getEstimatedItalianVatTotal(order)).toFixed(2));
  }
  return getOrderNetSubtotal(order);
}

function getOrderNetSubtotal(order) {
  const explicitNet = order?.totals?.netSubtotal;
  if (explicitNet != null) return toNumber(explicitNet);
  return Math.max(0, Number((getOrderGrossTotal(order) - getOrderTaxTotal(order)).toFixed(2)));
}

function getOrderTaxDisplay(order) {
  if (isShopifyBackedOrder(order) && !hasReliableTaxData(order)) {
    return state.lang === "it" ? "Da sincronizzare" : "Pending sync";
  }
  return hasReliableTaxData(order) || isEstimatedVatDisplay(order)
    ? formatCurrency(getDisplayedTaxTotal(order))
    : (state.lang === "it" ? "Da verificare" : "To verify");
}

function getOrderNetDisplay(order) {
  if (isShopifyBackedOrder(order) && !hasReliableNetData(order)) {
    return state.lang === "it" ? "Da sincronizzare" : "Pending sync";
  }
  return hasReliableNetData(order) || isEstimatedVatDisplay(order)
    ? formatCurrency(getDisplayedNetSubtotal(order))
    : (state.lang === "it" ? "Da verificare" : "To verify");
}

function isShopifyBackedOrder(order) {
  return String(order?.source || "").toLowerCase().startsWith("shopify");
}

function needsShopifyFinancialRefresh(order) {
  return isShopifyBackedOrder(order) && (hasDerivedShopifyFinancials(order) || !hasReliableTaxData(order) || !hasReliableNetData(order));
}

async function refreshOrderFromShopify(orderId) {
  if (!orderId || shopifyOrderRefreshInFlight.has(orderId) || shopifyOrderRefreshAttempted.has(orderId)) return;
  shopifyOrderRefreshInFlight.add(orderId);
  shopifyOrderRefreshAttempted.add(orderId);
  shopifyOrderRefreshErrors.delete(orderId);
  try {
    const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/refresh-shopify`, {
      method: "POST",
    });
    state.orders = state.orders.map((item) => (item.id === orderId || item.id === saved.id ? saved : item));
    if (state.selectedOrderId === orderId) state.selectedOrderId = saved.id;
  } catch (error) {
    shopifyOrderRefreshErrors.set(orderId, String(error?.message || "shopify_order_refresh_failed"));
    console.warn("shopify_order_refresh_failed", orderId, error);
  } finally {
    shopifyOrderRefreshInFlight.delete(orderId);
    scheduleCurrentViewRender();
  }
}

function getBillingDisplayName(order) {
  const billing = order?.billing || {};
  return String(
    billing.company
    || [billing.firstName, billing.lastName].filter(Boolean).join(" ").trim()
    || composeClientName(order)
    || "",
  ).trim();
}

function getBillingAddressLine(order) {
  const billing = order?.billing || {};
  const address = String(billing.address || "").trim();
  const cityParts = [billing.postalCode, billing.city, billing.provinceCode || billing.province].filter(Boolean).join(" ");
  return [address, cityParts, billing.countryCode].filter(Boolean).join(" · ");
}

function getBillingCompleteness(order) {
  const billing = order?.billing || {};
  const invoiceRequested = Boolean(order?.accounting?.invoiceRequired || billing.invoiceRequested);
  const isItaly = String(billing.countryCode || order?.countryCode || "IT").trim().toUpperCase() === "IT";
  const hasVatNumber = Boolean(String(billing.vatNumber || "").trim());
  const hasTaxCode = Boolean(String(billing.taxCode || "").trim());
  const hasSdiCode = Boolean(String(billing.sdiCode || "").trim());
  const hasPecEmail = Boolean(String(billing.pecEmail || "").trim());
  const hasBusinessSignals = Boolean(String(billing.company || "").trim() || hasVatNumber || hasSdiCode || hasPecEmail);
  const hasFiscalIdentity = Boolean(hasVatNumber || hasTaxCode || hasSdiCode || hasPecEmail);
  const fiscalProfile = hasBusinessSignals ? "business" : "person";
  const collected = invoiceRequested || hasFiscalIdentity || hasBusinessSignals;
  const missing = [];
  if (collected) {
    if (!getBillingDisplayName(order)) missing.push(state.lang === "it" ? "intestazione" : "billing name");
    if (!String(billing.address || "").trim()) missing.push(state.lang === "it" ? "indirizzo" : "address");
    if (!String(billing.city || "").trim()) missing.push(state.lang === "it" ? "citta" : "city");
    if (!String(billing.postalCode || "").trim()) missing.push(state.lang === "it" ? "CAP" : "ZIP");
    if (!String(billing.provinceCode || billing.province || "").trim()) missing.push(state.lang === "it" ? "provincia" : "province");
    if (!String(billing.countryCode || "").trim()) missing.push(state.lang === "it" ? "nazione" : "country");
    if (isItaly && fiscalProfile === "business") {
      if (!hasVatNumber) missing.push(state.lang === "it" ? "partita IVA" : "VAT number");
      if (!hasSdiCode && !hasPecEmail) missing.push(state.lang === "it" ? "codice SDI o PEC" : "SDI code or PEC");
    } else if (isItaly) {
      if (!hasTaxCode) missing.push(state.lang === "it" ? "codice fiscale" : "tax code");
    } else if (fiscalProfile === "business" && !hasVatNumber) {
      missing.push(state.lang === "it" ? "VAT number" : "VAT number");
    }
  }

  if (!collected) {
    return {
      complete: false,
      collected: false,
      invoiceRequested,
      profile: fiscalProfile,
      missing: state.lang === "it"
        ? ["partita IVA o codice fiscale", "codice SDI o PEC se azienda"]
        : ["VAT number or tax code", "SDI code or PEC for businesses"],
      label: state.lang === "it" ? "Dati fiscali non raccolti" : "Fiscal data not collected",
      rowLabel: state.lang === "it" ? "Dati fiscali assenti" : "Fiscal data missing",
      tone: "badge-warning",
      copy: state.lang === "it"
        ? "Mancano gli identificativi fiscali minimi: per privato serve almeno il codice fiscale, per azienda partita IVA e SDI o PEC."
        : "Missing minimum fiscal identifiers: private customers need a tax code, companies need VAT number and SDI or PEC.",
    };
  }

  const complete = missing.length === 0;
  return {
    complete,
    collected: true,
    invoiceRequested,
    profile: fiscalProfile,
    missing,
    label: complete
      ? (state.lang === "it" ? "Dati fattura completi" : "Billing data complete")
      : (state.lang === "it" ? "Dati fattura da integrare" : "Billing data incomplete"),
    rowLabel: complete
      ? (state.lang === "it" ? "Fattura OK" : "Billing OK")
      : (state.lang === "it" ? "Fattura da completare" : "Billing to complete"),
    tone: complete ? "badge-success" : "badge-warning",
    copy: complete
      ? (
          state.lang === "it"
            ? (fiscalProfile === "business" ? "Anagrafica aziendale pronta per fatturazione." : "Anagrafica cliente pronta per fatturazione.")
            : (fiscalProfile === "business" ? "Business billing profile ready for invoicing." : "Customer billing profile ready for invoicing.")
        )
      : `${state.lang === "it" ? "Mancano" : "Missing"}: ${missing.join(", ")}`,
  };
}

function describeTaxStatus(line = {}) {
  const taxLines = Array.isArray(line.taxLines) ? line.taxLines : [];
  if (taxLines.length) {
    return taxLines.map((entry) => {
      const label = String(entry.title || "").trim() || (state.lang === "it" ? "Imposta" : "Tax");
      const rate = Number(entry.rate || 0);
      return rate > 0 ? `${label} ${Math.round(rate * 100)}%` : label;
    }).join(" · ");
  }
  if (line.taxable) {
    return state.lang === "it" ? "Imponibile da Shopify" : "Taxable in Shopify";
  }
  return state.lang === "it" ? "Nessuna imposta" : "No tax";
}

function getStatusNodeForAttachmentTarget(targetType = "") {
  if (targetType === "installation") return ui.installationStatus;
  if (targetType === "shipping") return ui.shippingStatus;
  if (targetType === "sample-ldv") return ui.sampleStatus || ui.shippingStatus;
  if (targetType === "sales-content") return ui.salesContentStatus;
  return ui.ordersStatus;
}

function isImageAttachment(item = {}) {
  return /^image\//i.test(String(item.type || "").trim());
}

function getAttachmentContextLabel(context = "") {
  if (context === "installation") return state.lang === "it" ? "Posa" : "Install";
  if (context === "shipping") return state.lang === "it" ? "Logistica" : "Shipping";
  if (context === "sample-ldv") return state.lang === "it" ? "LDV" : "Waybill";
  if (context === "sales-content") return state.lang === "it" ? "Contenuti" : "Content";
  return state.lang === "it" ? "Ordine" : "Order";
}

function mapAttachmentsForContext(order, context = "") {
  const attachments = Array.isArray(order?.attachments) ? order.attachments : [];
  return attachments
    .map((item, index) => ({ ...item, _attachmentIndex: index }))
    .filter((item) => {
      if (!context) return true;
      const itemContext = String(item.context || "").trim();
      return !itemContext || itemContext === context;
    });
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function inferCatalogEntry(value) {
  const label = String(value || "").toLowerCase();
  if (label.includes("tasso")) return INVENTORY_CATALOG.find((item) => item.key === "tasso");
  if (label.includes("bonsai")) return INVENTORY_CATALOG.find((item) => item.key === "bonsai");
  if (label.includes("faggio")) return INVENTORY_CATALOG.find((item) => item.key === "faggio");
  if (label.includes("betulla")) return INVENTORY_CATALOG.find((item) => item.key === "betulla");
  if (label.includes("acero")) return INVENTORY_CATALOG.find((item) => item.key === "acero");
  if (label.includes("cedro")) return INVENTORY_CATALOG.find((item) => item.key === "cedro");
  if (label.includes("rovere")) return INVENTORY_CATALOG.find((item) => item.key === "rovere");
  if (label.includes("palma")) return INVENTORY_CATALOG.find((item) => item.key === "palma");
  if (label.includes("cipresso")) return INVENTORY_CATALOG.find((item) => item.key === "cipresso");
  if (label.includes("abete")) return INVENTORY_CATALOG.find((item) => item.key === "abete");
  if (label.includes("ginepro") && label.includes("45")) return INVENTORY_CATALOG.find((item) => item.key === "ginepro-45");
  if (label.includes("ginepro") && label.includes("35")) return INVENTORY_CATALOG.find((item) => item.key === "ginepro-35");
  if (label.includes("ginepro")) return INVENTORY_CATALOG.find((item) => item.key === "ginepro-35");
  if (label.includes("mogano")) return INVENTORY_CATALOG.find((item) => item.key === "mogano");
  if (label.includes("banda")) return INVENTORY_CATALOG.find((item) => item.key === "banda");
  if (label.includes("colla")) return INVENTORY_CATALOG.find((item) => item.key === "colla");
  if (label.includes("telo")) return INVENTORY_CATALOG.find((item) => item.key === "telo");
  if (label.includes("picchetti")) return INVENTORY_CATALOG.find((item) => item.key === "picchetti");
  if (/(ciottol|lapillo|pietrisco|sabbia|graniglia|decorativ)/i.test(label)) return INVENTORY_CATALOG.find((item) => item.key === "decorativi");
  return null;
}

function isTurfModel(value) {
  return inferCatalogEntry(value)?.type === "turf";
}

function getCatalogLabel(value) {
  return inferCatalogEntry(value)?.label || String(value || "").trim() || t("product");
}

function getInventoryGrossPricePerSqm(value) {
  const entry = typeof value === "string"
    ? inferCatalogEntry(value)
    : inferCatalogEntry(value?.product || value?.label || value?.key || "");
  const price = toNumber(entry?.grossPricePerSqm || 0);
  return price > 0 ? price : 0;
}

function isServiceLine(title = "") {
  return /(installazione|posa|sopralluogo|consulenza|servizio)/i.test(title);
}

function getPhysicalOrderLines(order) {
  return (order.lineDetails || [])
    .filter((item) => item?.title && !isServiceLine(item.title))
    .map((item) => ({
      title: String(item.title).trim(),
      quantity: Number(item.quantity || 1),
      dimensions: extractDimensions(item.title),
      note: String(item.note || "").trim(),
    }));
}

function getOrderLineItemsForSample(order) {
  if (!order || typeof order !== "object") return [];
  const candidates = [
    order.lineDetails,
    order.line_items,
    order.lineItems,
    order.items,
  ];
  for (const source of candidates) {
    if (Array.isArray(source) && source.length) return source;
  }
  return [];
}

function isSampleOrder(order) {
  const sampleRegex = /(box campion|campionatura|box-camp|campion)/i;
  const lineItems = getOrderLineItemsForSample(order);
  const hasSampleLine = lineItems.some((item) => {
    const name = typeof item === "string"
      ? item
      : String(item?.title || item?.name || item?.product_title || "").trim();
    const sku = typeof item === "string"
      ? ""
      : String(item?.sku || item?.variant_sku || "").trim();
    return sampleRegex.test(name) || sampleRegex.test(sku);
  });
  if (hasSampleLine) return true;
  return sampleRegex.test(String(order?.operations?.product || ""));
}

function getSampleLdvAttachments(order) {
  const items = mapAttachmentsForContext(order, "")
    .map((item) => ({
      ...item,
      __ctx: String(item.context || "").trim().toLowerCase(),
      __name: String(item.name || "").trim().toLowerCase(),
    }))
    .filter((item) => (
      item.__ctx === "sample-ldv"
      || item.__ctx === "ldv"
      || (item.__ctx === "shipping" && /(ldv|lettera.*vettura)/i.test(item.__name))
      || (!item.__ctx && /(ldv|lettera.*vettura)/i.test(item.__name))
    ));
  return items.sort((left, right) => (
    new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  ));
}

function hasSampleLdvAttachment(order) {
  return getSampleLdvAttachments(order).length > 0;
}

function getSampleLdvNumber(order) {
  return String(
    order?.operations?.warehouse?.sampleLdvNumber
    || order?.operations?.warehouse?.pickupLabel
    || "",
  ).trim();
}

function getSampleUrgencyMeta(order) {
  const targetDate = String(getShippingTargetDate(order) || "").trim();
  if (!targetDate) {
    return {
      urgencyClass: "scheduled",
      urgencyText: state.lang === "it" ? "Da pianificare" : "To schedule",
    };
  }
  const target = new Date(`${targetDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      urgencyClass: "overdue",
      urgencyText: state.lang === "it" ? "In ritardo" : "Overdue",
    };
  }
  if (diffDays === 0) {
    return {
      urgencyClass: "imminent",
      urgencyText: state.lang === "it" ? "Oggi" : "Today",
    };
  }
  if (diffDays <= 2) {
    return {
      urgencyClass: "soon",
      urgencyText: state.lang === "it" ? "Prossima" : "Soon",
    };
  }
  return {
    urgencyClass: "scheduled",
    urgencyText: state.lang === "it" ? "Programmato" : "Scheduled",
  };
}

function getDisplayPieceCount(order, item) {
  const rawQty = Math.max(1, Number(item?.quantity || 1));
  const dims = extractDimensions(item?.title || "");
  if (!dims || !isTurfModel(item?.title)) return rawQty;
  const turfLines = (order?.lineDetails || []).filter((line) => {
    const lineDims = extractDimensions(line?.title || "");
    return Boolean(lineDims && isTurfModel(line?.title));
  });
  if (turfLines.length !== 1) return rawQty;
  const totalSqm = toNumber(order?.operations?.sqm || 0);
  if (totalSqm <= dims.sqm) return rawQty;
  const derivedQty = totalSqm / dims.sqm;
  const roundedQty = Math.round(derivedQty);
  if (roundedQty > 1 && Math.abs(derivedQty - roundedQty) < 0.08) {
    return roundedQty;
  }
  return rawQty;
}

function focusElement(node) {
  if (!node) return;
  requestAnimationFrame(() => {
    if (!node.hasAttribute("tabindex")) {
      node.setAttribute("tabindex", "-1");
    }
    if (typeof node.focus === "function") {
      try {
        node.focus({ preventScroll: true });
      } catch {
        node.focus();
      }
    }
  });
}

function focusViewTarget(view) {
  if (view === "orders") focusElement(document.querySelector("#orders .page-header h1"));
  if (view === "sales-requests") focusElement(document.querySelector("#sales-requests .page-header h1"));
  if (view === "sales-generator") focusElement(document.querySelector("#sales-generator .page-header h1"));
  if (view === "sales-content") focusElement(document.querySelector("#sales-content .page-header h1"));
  if (view === "warehouse") focusElement(document.querySelector("#warehouse .page-header h1"));
  if (view === "installations") focusElement(document.querySelector("#installations .page-header h1"));
  if (view === "accounting") focusElement(document.querySelector("#accounting .page-header h1"));
  if (view === "shipping") focusElement(document.querySelector("#shipping .page-header h1"));
}

function getMobileDetailTarget(view) {
  if (view === "accounting") return ui.accountingDetailTitle?.closest(".detail-panel") || ui.accountingDetailTitle;
  if (view === "shipping") {
    if (ui.sampleDetailPanel && !ui.sampleDetailPanel.classList.contains("hidden")) {
      return ui.sampleDetailPanel;
    }
    return ui.shippingStandardDetailPanel || ui.shippingDetailTitle?.closest(".detail-panel") || ui.shippingDetailTitle;
  }
  if (view === "installations") return ui.installationDetailTitle?.closest(".detail-panel") || ui.installationDetailTitle;
  return null;
}

function revealMobileDetailTarget(view) {
  if (window.innerWidth > 980) return;
  const target = getMobileDetailTarget(view);
  if (!target) return;
  window.setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    focusElement(target);
  }, 110);
}

function scrollCurrentViewToTop() {
  const activeView = document.getElementById(state.currentView);
  if (activeView) {
    activeView.scrollTop = 0;
  }
  if (ui.mainContent) {
    ui.mainContent.scrollTop = 0;
    if (typeof ui.mainContent.scrollTo === "function") {
      ui.mainContent.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }
  if (typeof window.scrollTo === "function") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = 0;
  }
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function updateAccountingPaneVisibility() {
  const isMobile = window.innerWidth <= 980;
  const pane = state.accountingMobilePane || "summary";
  ui.accountingMobileTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.pane === pane);
  });
  document.querySelectorAll("#accounting [data-accounting-pane]").forEach((node) => {
    node.toggleAttribute("hidden", isMobile && node.dataset.accountingPane !== pane);
  });
}

function setAccountingPane(pane = "summary") {
  const allowed = new Set(["summary", "payments", "billing"]);
  state.accountingMobilePane = allowed.has(pane) ? pane : "summary";
  updateAccountingPaneVisibility();
}

function updateInstallationPaneVisibility() {
  const isMobile = window.innerWidth <= 980;
  const isCrewView = state.currentUser?.role === "crew";
  const allowed = isCrewView
    ? new Set(["summary", "expenses"])
    : new Set(["summary", "expenses", "coverage"]);
  if (!allowed.has(state.installationMobilePane)) {
    state.installationMobilePane = "summary";
  }
  const pane = state.installationMobilePane || "summary";
  ui.installationMobileTabs.forEach((button) => {
    const buttonPane = button.dataset.pane || "summary";
    const visible = allowed.has(buttonPane);
    button.hidden = !visible;
    button.classList.toggle("hidden", !visible);
    button.classList.toggle("is-active", visible && buttonPane === pane);
  });
  document.querySelectorAll("#installations [data-installation-pane]").forEach((node) => {
    const nodePane = node.dataset.installationPane || "summary";
    node.toggleAttribute("hidden", isMobile && nodePane !== pane);
  });
}

function setInstallationPane(pane = "summary") {
  const isCrewView = state.currentUser?.role === "crew";
  const allowed = new Set(isCrewView ? ["summary", "expenses"] : ["summary", "expenses", "coverage"]);
  state.installationMobilePane = allowed.has(pane) ? pane : "summary";
  updateInstallationPaneVisibility();
}

function buildDashboardActions() {
  const raw = [...state.orders]
    .map((order) => {
      const ops = order.operations || {};
      const missingAddress = !order.address || !order.city;
      const stage = getUnifiedOrderStage(order);
      const missingWarehouse = stage.key === "warehouse-work" && ["da-preparare", "bloccato", ""].includes(String(ops.warehouse?.status || "").trim());
      const needsDate = ops.installation?.required && !ops.installation?.installDate;
      const openBalance = getOpenBalance(order);
      const needsAccounting = openBalance > 0 || (order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued);
      const isCompleted = stage.key === "install-completed" || stage.key === "closed";
      const materialMissing = ops.warehouse?.status === "bloccato";
      let title = "Verifica ordine";
      let reason = "Ordine operativo da completare";
      let score = 10;
      let kind = "generic";
      let urgency = "info";
      if (materialMissing) {
        title = state.lang === "it" ? "Materiale mancante" : "Missing material";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} — magazzino bloccato`
          : `${composeClientName(order)} · ${getOrderNumber(order)} — warehouse blocked`;
        score = 110;
        kind = "material";
        urgency = "urgent";
      } else if (missingAddress) {
        title = state.lang === "it" ? "Completa indirizzo cliente" : "Complete customer address";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} ha indirizzo incompleto`
          : `${composeClientName(order)} · ${getOrderNumber(order)} has incomplete address`;
        score = 100;
        kind = "address";
        urgency = "warning";
      } else if (isCompleted && openBalance <= 0) {
        title = state.lang === "it" ? "Conferma chiusura" : "Confirm closure";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} — posa completata, pronto per chiusura`
          : `${composeClientName(order)} · ${getOrderNumber(order)} — install completed, ready to close`;
        score = 95;
        kind = "completed";
        urgency = "success";
      } else if (missingWarehouse) {
        title = state.lang === "it" ? "Sblocca magazzino" : "Unlock warehouse";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} non è pronto per preparazione/spedizione`
          : `${composeClientName(order)} · ${getOrderNumber(order)} is not ready for prep/shipping`;
        score = 90;
        kind = "warehouse";
        urgency = "warning";
      } else if (needsDate) {
        title = state.lang === "it" ? "Conferma data posa" : "Confirm install date";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} è pronto ma senza data`
          : `${composeClientName(order)} · ${getOrderNumber(order)} is ready but has no date`;
        score = 70;
        kind = "installation";
        urgency = "info";
      } else if (needsAccounting) {
        title = state.lang === "it" ? "Pagamento in attesa" : "Payment pending";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} — ${formatCurrency(openBalance)} da incassare`
          : `${composeClientName(order)} · ${getOrderNumber(order)} — ${formatCurrency(openBalance)} to collect`;
        score = 60;
        kind = "accounting";
        urgency = "warning";
      }
      return { order, title, reason, score, kind, urgency };
    })
    .filter(a => a.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const grouped = {};
  for (const action of raw) {
    const gKey = action.kind + "_" + action.title;
    if (!grouped[gKey]) {
      grouped[gKey] = { ...action, orders: [action.order], count: 1 };
    } else {
      grouped[gKey].orders.push(action.order);
      grouped[gKey].count++;
      if (grouped[gKey].count <= 3) {
        const names = grouped[gKey].orders.map(o => `${getOrderNumber(o)}`).join(", ");
        grouped[gKey].reason = `${grouped[gKey].title} per ${grouped[gKey].count} ordini: ${names}`;
      } else {
        grouped[gKey].reason = `${grouped[gKey].count} ordini richiedono: ${grouped[gKey].title.toLowerCase()}`;
      }
    }
  }

  return raw;
}

function extractDimensions(label) {
  const normalized = String(label || "").replace(/,/g, ".");
  if (/mm/i.test(normalized) && !/\b2\s*m\s*[/x]\s*\d+/i.test(normalized)) return null;
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[x/]\s*(\d+(?:\.\d+)?)\s*m?/i);
  if (!match) return null;
  const width = toNumber(match[1]);
  const length = toNumber(match[2]);
  if (!width || !length) return null;
  return { width, length, sqm: Number((width * length).toFixed(2)) };
}

function parseSquareMetersFromTitle(label, quantity = 1) {
  const normalized = String(label || "").replace(/,/g, ".");
  const slashMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m\s*\/\s*(\d+(?:\.\d+)?)\s*m/i);
  if (slashMatch) return toNumber(slashMatch[1]) * toNumber(slashMatch[2]) * quantity;
  const xMatch = normalized.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*m/i);
  if (xMatch) return toNumber(xMatch[1]) * toNumber(xMatch[2]) * quantity;
  const mqMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mq/i);
  if (mqMatch) return toNumber(mqMatch[1]) * quantity;
  return 0;
}

function normalizeProductName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*\d+\s*(?:m|mq|cm)?\s*$/i, "")
    .trim()
    .toLowerCase();
}

function formatPieceLabel(item) {
  if (item.variant) return item.variant;
  const width = toNumber(item.width);
  const length = toNumber(item.length);
  if (width && length) return `${width} x ${length}`;
  return "1 unità";
}

function formatPalletDimensions(ddt = {}) {
  const parts = [ddt.palletWidth, ddt.palletLength, ddt.palletHeight]
    .map((item) => String(item || "").replace(/\s*cm$/i, "").trim())
    .filter(Boolean);
  return parts.length ? parts.join("x") : undefinedText();
}

function getDefaultShippingPricing() {
  return {
    carrierName: "",
    shippingRateMode: "oneexpress-auto",
    shippingTariffProfile: "silver",
    volumetricDivisor: 5000,
    rate80: 0,
    rate150: 0,
    rate300: 0,
    rate500: 0,
    rate1000: 0,
    extraKgRate: 0,
  };
}

function getShippingPricing() {
  const source = state.settings || {};
  const defaults = getDefaultShippingPricing();
  return {
    carrierName: String(source.carrierName || defaults.carrierName),
    shippingRateMode: source.shippingRateMode || defaults.shippingRateMode,
    shippingTariffProfile: source.shippingTariffProfile || defaults.shippingTariffProfile,
    volumetricDivisor: toNumber(source.volumetricDivisor || defaults.volumetricDivisor) || defaults.volumetricDivisor,
    rate80: toNumber(source.rate80 || defaults.rate80),
    rate150: toNumber(source.rate150 || defaults.rate150),
    rate300: toNumber(source.rate300 || defaults.rate300),
    rate500: toNumber(source.rate500 || defaults.rate500),
    rate1000: toNumber(source.rate1000 || defaults.rate1000),
    extraKgRate: toNumber(source.extraKgRate || defaults.extraKgRate),
  };
}

function getInventoryProductConfig(value) {
  const entry = inferCatalogEntry(value);
  if (!entry) {
    return {
      entry: null,
      isMeasured: true,
      quantityLabel: state.lang === "it" ? "Quanti pezzi" : "Quantity",
      widthLabel: state.lang === "it" ? "Larghezza" : "Width",
      lengthLabel: state.lang === "it" ? "Lunghezza" : "Length",
      variantLabel: state.lang === "it" ? "Formato" : "Format",
      variantOptions: [],
      defaultVariant: "",
      preset: null,
      allowResidual: true,
      notePlaceholder: state.lang === "it" ? "Rotolo nuovo, residuo da ordine #2791, taglio utile..." : "New roll, offcut from order #2791...",
    };
  }
  const variantOptions = entry.variants || (entry.variantLabel ? [{ value: "standard", label: entry.variantLabel }] : []);
  return {
    entry,
    isMeasured: entry.type === "turf",
    quantityLabel: entry.type === "turf"
      ? (state.lang === "it" ? "Quanti pezzi" : "Quantity")
      : (entry.unitLabel ? `${state.lang === "it" ? "Quante" : "How many"} ${entry.unitLabel}` : (state.lang === "it" ? "Quanti pezzi" : "Quantity")),
    widthLabel: state.lang === "it" ? "Larghezza" : "Width",
    lengthLabel: state.lang === "it" ? "Lunghezza" : "Length",
    variantLabel: state.lang === "it" ? "Formato" : "Format",
    variantOptions,
    defaultVariant: entry.defaultVariant || variantOptions[0]?.value || "",
    preset: entry.preset || null,
    allowResidual: entry.type === "turf",
    notePlaceholder: entry.type === "turf"
      ? (state.lang === "it" ? "Rotolo nuovo, residuo da ordine #2791, taglio utile..." : "New roll, offcut from order #2791...")
      : (state.lang === "it" ? "Lotto, scaffale, fornitore o note articolo..." : "Batch, shelf, supplier or item notes..."),
  };
}

function parseDimensionCm(value) {
  return toNumber(String(value || "").replace(/\s*cm$/i, ""));
}

function parseWeightKg(value) {
  return toNumber(String(value || "").replace(/\s*kg$/i, ""));
}

function getShippingDestination(order) {
  const destination = order?.operations?.warehouse?.destination || {};
  const inferredProvince = extractProvinceCodeFromText([
    destination.province,
    order?.province,
    order?.city,
    order?.address,
  ].filter(Boolean).join(" "));
  const code = normalizeProvinceCode(
    destination.provinceCode
      || order?.provinceCode
      || destination.province
      || order?.province
      || inferredProvince,
  );
  const provinceRecord = getProvinceRecord(code);
  return {
    provinceCode: code,
    province: destination.province || order?.province || provinceRecord?.province || "",
    postalCode: String(destination.postalCode || order?.postalCode || "").trim(),
    countryCode: String(destination.countryCode || order?.countryCode || "IT").trim().toUpperCase(),
    region: provinceRecord?.region || "",
    tariffRecord: provinceRecord,
    supported: Boolean(provinceRecord),
  };
}

function getPalletClassThresholds() {
  return PALLET_CLASS_ORDER
    .map((key) => ONE_EXPRESS_TARIFFS.classes?.[key])
    .filter(Boolean);
}

function classifyPallet(ddt = {}) {
  const width = parseDimensionCm(ddt.palletWidth);
  const length = parseDimensionCm(ddt.palletLength);
  const height = parseDimensionCm(ddt.palletHeight);
  const realWeight = parseWeightKg(ddt.palletWeight);
  const longSide = Math.max(width, length);
  const shortSide = Math.min(width, length);
  const area = width && length ? width * length : 0;
  const baselineArea = Number(ONE_EXPRESS_TARIFFS.baselineAreaCm2 || 12000);
  const footprintIsOversized = Boolean(area > baselineArea || longSide > ONE_EXPRESS_TARIFFS.standardFootprintCm.longSide || shortSide > ONE_EXPRESS_TARIFFS.standardFootprintCm.shortSide);
  const exceedsAbsoluteLimits = Boolean(
    !width
    || !length
    || !height
    || !realWeight
    || longSide > Number(ONE_EXPRESS_TARIFFS.absoluteLimits.maxLongSide || 240)
    || shortSide > Number(ONE_EXPRESS_TARIFFS.absoluteLimits.maxShortSide || 160)
    || height > Number(ONE_EXPRESS_TARIFFS.absoluteLimits.maxHeight || 240)
    || realWeight > Number(ONE_EXPRESS_TARIFFS.absoluteLimits.maxWeightKg || 1800)
  );
  const thresholds = getPalletClassThresholds();
  const baseClass = thresholds.find((item) => height <= item.maxHeightCm && realWeight <= item.maxWeightKg)
    || (!exceedsAbsoluteLimits ? ONE_EXPRESS_TARIFFS.classes?.P1000 || null : null);

  const dimensionMultiplier = area
    ? Math.max(1, floorTo(area / baselineArea, 2))
    : 1;
  const weightMultiplier = realWeight > 1100
    ? Number((((Math.ceil(realWeight / 100) * 100) / 1000) - 0.1).toFixed(2))
    : 1;

  return {
    width,
    length,
    height,
    realWeight,
    longSide,
    shortSide,
    area,
    footprintIsOversized,
    exceedsAbsoluteLimits,
    baseClass: baseClass?.key || "",
    dimensionMultiplier,
    weightMultiplier,
    resolved: Boolean(baseClass?.key) && !exceedsAbsoluteLimits,
  };
}

function getCurrentDdtDraft(order) {
  if (!order || !ui.ddtForm) return order?.operations?.warehouse?.ddt || {};
  const saved = order.operations?.warehouse?.ddt || {};
  return {
    ...saved,
    number: ui.ddtForm.number?.value || saved.number || "",
    palletLength: ui.ddtForm.palletLength?.value || saved.palletLength || "",
    palletWidth: ui.ddtForm.palletWidth?.value || saved.palletWidth || "",
    palletHeight: ui.ddtForm.palletHeight?.value || saved.palletHeight || "",
    palletWeight: ui.ddtForm.palletWeight?.value || saved.palletWeight || "",
  };
}

function calculateManualShippingEstimate(ddt = {}) {
  const pricing = getShippingPricing();
  const width = parseDimensionCm(ddt.palletWidth);
  const length = parseDimensionCm(ddt.palletLength);
  const height = parseDimensionCm(ddt.palletHeight);
  const realWeight = parseWeightKg(ddt.palletWeight);
  const volumetricWeight = width && length && height
    ? Number(((width * length * height) / pricing.volumetricDivisor).toFixed(2))
    : 0;
  const billableWeight = Math.max(realWeight, volumetricWeight);
  const configured = [pricing.rate80, pricing.rate150, pricing.rate300, pricing.rate500, pricing.rate1000].some(Boolean);
  let estimatedCost = 0;

  if (configured && billableWeight > 0) {
    if (billableWeight <= 80) estimatedCost = pricing.rate80;
    else if (billableWeight <= 150) estimatedCost = pricing.rate150;
    else if (billableWeight <= 300) estimatedCost = pricing.rate300;
    else if (billableWeight <= 500) estimatedCost = pricing.rate500;
    else if (billableWeight <= 1000) estimatedCost = pricing.rate1000;
    else estimatedCost = pricing.rate1000 + ((billableWeight - 1000) * pricing.extraKgRate);
  }

  return {
    carrierName: pricing.carrierName,
    mode: "manual-weight",
    configured,
    realWeight,
    volumetricWeight,
    billableWeight,
    estimatedCost: Number(estimatedCost.toFixed(2)),
  };
}

function calculateOneExpressEstimate(order, ddt = {}) {
  const pricing = getShippingPricing();
  const destination = getShippingDestination(order);
  const pallet = classifyPallet(ddt);
  const profile = getShippingTariffProfile();
  const rateLine = destination.tariffRecord?.[profile] || null;
  const baseRate = rateLine && pallet.baseClass ? Number(rateLine[pallet.baseClass] || 0) : 0;
  const appliedMultiplier = Math.max(1, pallet.dimensionMultiplier, pallet.weightMultiplier);
  const estimatedCost = baseRate > 0 ? Number((baseRate * appliedMultiplier).toFixed(2)) : 0;
  const dimensionRate = baseRate > 0 ? Number((baseRate * pallet.dimensionMultiplier).toFixed(2)) : 0;
  const weightRate = baseRate > 0 ? Number((baseRate * pallet.weightMultiplier).toFixed(2)) : 0;
  const configured = Boolean(rateLine && baseRate > 0);
  const missingReason = !destination.provinceCode
    ? "missing_destination"
    : !destination.supported
      ? "destination_not_supported"
      : !pallet.resolved
        ? "unsupported_pallet"
        : !configured
          ? "missing_rate"
          : "";

  return {
    mode: "oneexpress-auto",
    carrierName: pricing.carrierName || ONE_EXPRESS_TARIFFS.carrier || "One Express",
    configured,
    estimatedCost,
    realWeight: pallet.realWeight,
    volumetricWeight: 0,
    billableWeight: pallet.realWeight,
    profile,
    provinceCode: destination.provinceCode,
    province: destination.province || destination.tariffRecord?.province || "",
    region: destination.region,
    postalCode: destination.postalCode,
    resa: rateLine?.resa || "",
    palletClass: pallet.baseClass,
    baseRate,
    dimensionMultiplier: pallet.dimensionMultiplier,
    weightMultiplier: pallet.weightMultiplier,
    dimensionRate,
    weightRate,
    finalMultiplier: appliedMultiplier,
    oversizedByFootprint: pallet.footprintIsOversized,
    unsupported: Boolean(missingReason),
    missingReason,
  };
}

function calculateShippingEstimate(order, ddt = {}) {
  if (getShippingRateMode() === "manual-weight") {
    return calculateManualShippingEstimate(ddt);
  }
  const oneExpress = calculateOneExpressEstimate(order, ddt);
  if (oneExpress.configured || oneExpress.missingReason !== "missing_rate") {
    return oneExpress;
  }
  return calculateManualShippingEstimate(ddt);
}

function getShippingModeLabel(order) {
  const mode = order.operations?.warehouse?.fulfillmentMode;
  if (mode === "corriere") return state.lang === "it" ? "Spedizione corriere" : "Courier shipment";
  if (mode === "ritiro") return state.lang === "it" ? "Ritiro in sede" : "Warehouse pickup";
  if (mode === "furgone") return state.lang === "it" ? "Carico su furgone" : "Van loading";
  if (order.operations?.installation?.required) return state.lang === "it" ? "Posa / uscita squadra" : "Install / crew departure";
  return t("undefined");
}

function getShipmentStateLabel(order) {
  const warehouse = order.operations?.warehouse || {};
  const status = String(warehouse.status || "").trim();
  if (warehouse.shipped || status === "ritirato") return state.lang === "it" ? "Ritirato" : "Collected";
  if (warehouse.carrierPassed) return t("carrierPassed");
  if (warehouse.readyToShip && !status) return t("goodsReady");
  const stage = getUnifiedOrderStage(order);
  if (stage.key === "warehouse-ready") return stage.label;
  if (stage.key === "warehouse-work") {
    if (status === "in-attesa-di-ritiro") return state.lang === "it" ? "In attesa di ritiro" : "Waiting for pickup";
    if (status === "da-ritirare") return state.lang === "it" ? "Da ritirare" : "Ready for pickup";
    if (status === "in-preparazione") return state.lang === "it" ? "In preparazione" : "Preparing";
    if (status === "pronto") return state.lang === "it" ? "Pronto" : "Ready";
    if (status === "da-preparare") return t("toPrepare");
  }
  return stage.label || status || t("toPrepare");
}

function getShippingTargetDate(order) {
  const explicitPreparationDate = order.operations?.warehouse?.preparationDate;
  if (explicitPreparationDate) {
    return explicitPreparationDate;
  }
  const installationDate = order.operations?.installation?.installDate;
  if (installationDate) {
    const date = new Date(`${installationDate}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }
  return "";
}

function getShippingTargetLabel(order) {
  const target = getShippingTargetDate(order);
  if (!target) return state.lang === "it" ? "Data preparazione da definire" : "Preparation date to define";
  const todayKey = new Date().toISOString().slice(0, 10);
  if (target === todayKey) return state.lang === "it" ? "Preparare oggi" : "Prepare today";
  return `${t("prepareBy")} ${formatDate(target)}`;
}

function getShippingSummary(order) {
  const physicalLines = getWarehousePreparedLines(order);
  if (!physicalLines.length) return noPhysicalGoodsText();
  return physicalLines
    .map((item) => `${item.title}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
    .join(" · ");
}

function getShippingBuckets(orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const buckets = { today: [], week: [], unscheduled: [] };
  orders.forEach((order) => {
    const target = getShippingTargetDate(order);
    if (!target) {
      buckets.unscheduled.push(order);
      return;
    }
    const date = new Date(`${target}T00:00:00`);
    if (date.getTime() <= today.getTime()) buckets.today.push(order);
    else if (date.getTime() <= weekEnd.getTime()) buckets.week.push(order);
    else buckets.unscheduled.push(order);
  });
  return buckets;
}

function getOrderType(order) {
  if (order.operations?.installation?.required) return { label: state.lang === "it" ? "Posa" : "Install", tone: "status-amber" };
  const mode = order.operations?.warehouse?.fulfillmentMode;
  if (mode === "ritiro") return { label: state.lang === "it" ? "Ritiro" : "Pickup", tone: "status-green" };
  if (mode === "corriere") return { label: state.lang === "it" ? "Spedizione" : "Shipping", tone: "status-blue" };
  if (mode === "furgone") return { label: state.lang === "it" ? "Furgone" : "Van", tone: "status-amber" };
  return { label: state.lang === "it" ? "Operativo" : "Operational", tone: "status-slate" };
}

function getActionMeta(kind) {
  if (kind === "material") return { icon: state.lang === "it" ? "Urgente" : "Urgent", tone: "status-red" };
  if (kind === "address") return { icon: state.lang === "it" ? "Da completare" : "To complete", tone: "status-amber" };
  if (kind === "warehouse") return { icon: state.lang === "it" ? "Magazzino" : "Warehouse", tone: "status-amber" };
  if (kind === "installation") return { icon: state.lang === "it" ? "Pianifica" : "Plan", tone: "status-blue" };
  if (kind === "accounting") return { icon: state.lang === "it" ? "Follow up" : "Follow up", tone: "status-amber" };
  if (kind === "completed") return { icon: state.lang === "it" ? "Conferma" : "Confirm", tone: "status-green" };
  return { icon: state.lang === "it" ? "Ordine" : "Order", tone: "status-slate" };
}

function getOrderProgress(order) {
  const install = order.operations?.installation || {};
  const warehouse = order.operations?.warehouse || {};
  const accounting = order.accounting || {};
  const openBalance = getOpenBalance(order);
  const logisticsCompleted = isLogisticsOrderCompleted(order);
  const closed = isOrderClosed(order);
  const warehouseReady = [
    "in-preparazione",
    "pronto",
    "in-attesa-di-ritiro",
    "da-ritirare",
    "ritirato",
  ].includes(warehouse.status);
  return [
    Boolean(order.address && order.city),
    warehouseReady,
    install.required ? Boolean(install.installDate) : true,
    install.required ? install.status === "completata" : logisticsCompleted,
    closed || (openBalance <= 0 && (!accounting.invoiceRequired || accounting.invoiceIssued)),
  ];
}

function renderProgressDots(order) {
  return `
    <div class="progress-dots" aria-label="Stato avanzamento">
      ${getOrderProgress(order)
        .map((done) => `<span class="progress-dot ${done ? "is-done" : ""}"></span>`)
        .join("")}
    </div>
  `;
}

function getPrimaryTurfLabel(order) {
  const explicit = order.operations?.product;
  if (explicit) return getCatalogLabel(explicit);
  const turfLine = getPhysicalOrderLines(order).find((item) => inferCatalogEntry(item.title)?.type === "turf");
  return turfLine ? getCatalogLabel(turfLine.title) : "";
}

function getPhysicalMaterialLines(order) {
  return getPhysicalOrderLines(order).filter((line) => inferCatalogEntry(line.title)?.type === "material");
}

function orderNeedsWarehouseWork(order) {
  if (!isRoutedToWarehouse(order)) return false;
  if (isLogisticsOrderCompleted(order)) return false;
  return true;
}

function isLogisticsOrderCompleted(order) {
  const warehouse = order.operations?.warehouse || {};
  const status = String(warehouse.status || "").trim();
  const mode = String(warehouse.fulfillmentMode || "").trim();
  return Boolean(
    warehouse.shipped
    || status === "ritirato"
    || (mode === "corriere" && warehouse.carrierPassed),
  );
}

function isInstallationOrderCompleted(order) {
  return String(order.operations?.installation?.status || "").trim() === "completata";
}

function isOrderFulfilledOrClosed(order) {
  const installRequired = Boolean(order.operations?.installation?.required);
  if (installRequired) return isInstallationOrderCompleted(order) || isOrderClosed(order);
  return isLogisticsOrderCompleted(order) || isOrderClosed(order);
}

function isOrderClosed(order) {
  const installRequired = Boolean(order.operations?.installation?.required);
  const installCompleted = isInstallationOrderCompleted(order);
  const logisticsCompleted = isLogisticsOrderCompleted(order);
  const financiallyClosed = getOpenBalance(order) <= 0 && (!order.accounting?.invoiceRequired || order.accounting?.invoiceIssued);
  const operationallyClosed = installRequired ? installCompleted : logisticsCompleted;
  return Boolean(operationallyClosed && financiallyClosed);
}

function getUnifiedOrderStage(order) {
  const ops = order.operations || {};
  const officeStatus = String(ops.officeStatus || "").trim();
  const warehouse = ops.warehouse || {};
  const install = ops.installation || {};
  const warehouseStatus = String(warehouse.status || "").trim();
  const fulfillmentMode = String(warehouse.fulfillmentMode || "").trim();
  const installStatus = String(install.status || "").trim();
  const installRequired = Boolean(install.required);
  const logisticsCompleted = isLogisticsOrderCompleted(order);

  if (isOrderClosed(order)) {
    return {
      key: "closed",
      label: state.lang === "it" ? "Chiuso" : "Closed",
      tone: "green",
    };
  }
  if (installStatus === "completata") {
    return {
      key: "install-completed",
      label: state.lang === "it" ? "Posa completata" : "Install completed",
      tone: "green",
    };
  }
  if (installStatus === "in-corso") {
    return {
      key: "install-progress",
      label: state.lang === "it" ? "Posa in corso" : "Install in progress",
      tone: "blue",
    };
  }
  if (installRequired && install.installDate) {
    return {
      key: "install-planned",
      label: state.lang === "it" ? "Posa pianificata" : "Install planned",
      tone: "amber",
    };
  }
  if (fulfillmentMode === "furgone" && logisticsCompleted) {
    return {
      key: "van-loaded",
      label: state.lang === "it" ? "Caricato su furgone" : "Loaded on van",
      tone: "green",
    };
  }
  if (logisticsCompleted) {
    return {
      key: "goods-collected",
      label: state.lang === "it" ? "Ritirato / evaso" : "Collected / shipped",
      tone: "green",
    };
  }
  if (warehouse.readyToShip || ["pronto", "da-ritirare", "in-attesa-di-ritiro"].includes(warehouseStatus)) {
    return {
      key: "warehouse-ready",
      label: state.lang === "it" ? "Pronto per uscita" : "Ready to dispatch",
      tone: "green",
    };
  }
  if (["in-preparazione", "da-preparare", "bloccato"].includes(warehouseStatus) || isRoutedToWarehouse(order)) {
    return {
      key: "warehouse-work",
      label: state.lang === "it" ? "Da preparare" : "To prepare",
      tone: warehouseStatus === "bloccato" ? "red" : "amber",
    };
  }
  if (officeStatus === "bozza" || !isRoutedToWarehouse(order)) {
    return {
      key: "office-review",
      label: state.lang === "it" ? "Da verificare" : "To review",
      tone: "blue",
    };
  }
  return {
    key: "operational",
    label: state.lang === "it" ? "Operativo" : "Operational",
    tone: "amber",
  };
}

function getPreparedProductLines(order) {
  return getWarehousePreparedLines(order).filter((line) => inferCatalogEntry(line.title)?.type === "turf");
}

function buildWarehouseDemandMap() {
  const demandMap = new Map();
  state.orders
    .filter(orderNeedsWarehouseWork)
    .forEach((order) => {
      const preparedProducts = getPreparedProductLines(order);
      const hasMeasuredProducts = preparedProducts.some((line) => line.dimensions?.sqm);

      preparedProducts.forEach((line) => {
        const label = getCatalogLabel(line.title);
        const key = normalizeProductName(label);
        const current = demandMap.get(key) || {
          key,
          product: label,
          type: "turf",
          demandSqm: 0,
          demandUnits: 0,
          demandOrders: new Set(),
        };
        const sqm = line.dimensions?.sqm
          ? line.dimensions.sqm * Number(line.quantity || 1)
          : 0;
        current.demandSqm += sqm;
        current.demandOrders.add(order.id);
        demandMap.set(key, current);
      });

      if (!hasMeasuredProducts) {
        const fallbackLabel = getPrimaryTurfLabel(order);
        const fallbackSqm = toNumber(order.operations?.sqm || 0);
        if (fallbackLabel && fallbackSqm > 0) {
          const key = normalizeProductName(fallbackLabel);
          const current = demandMap.get(key) || {
            key,
            product: fallbackLabel,
            type: "turf",
            demandSqm: 0,
            demandUnits: 0,
            demandOrders: new Set(),
          };
          current.demandSqm += fallbackSqm;
          current.demandOrders.add(order.id);
          demandMap.set(key, current);
        }
      }

      getWarehousePreparedLines(order)
        .filter((line) => inferCatalogEntry(line.title)?.type === "material")
        .forEach((line) => {
          const label = getCatalogLabel(line.title);
          const key = normalizeProductName(label);
          const current = demandMap.get(key) || {
            key,
            product: label,
            type: "material",
            demandSqm: 0,
            demandUnits: 0,
            demandOrders: new Set(),
          };
          current.demandUnits += Number(line.quantity || 1);
          current.demandOrders.add(order.id);
          demandMap.set(key, current);
        });
    });

  return demandMap;
}

function getWarehousePrepItems(order) {
  const current = Array.isArray(order.operations?.warehouse?.prepItems) ? order.operations.warehouse.prepItems : [];
  if (current.length) {
    return current
      .filter((item) => item?.title)
      .map((item) => ({
        title: String(item.title).trim(),
        quantity: getDisplayPieceCount(order, item),
        included: item.included !== false,
        note: String(item.note || "").trim(),
      }));
  }
  return getPhysicalOrderLines(order).map((line) => ({
    title: line.title,
    quantity: getDisplayPieceCount(order, line),
    included: true,
    note: String(line.note || "").trim(),
  }));
}

function getWarehousePreparedLines(order) {
  return getWarehousePrepItems(order)
    .filter((item) => item.included !== false)
    .map((item) => ({
      title: item.title,
      quantity: Number(item.quantity || 1),
      dimensions: extractDimensions(item.title),
      note: item.note || "",
    }));
}

function getNextOrderAction(order) {
  if (!order.address || !order.city) {
    return t("needsAddress");
  }
  if (isOrderClosed(order)) {
    return state.lang === "it" ? "Ordine chiuso: nessuna azione operativa aperta" : "Order closed: no open operational actions";
  }
  if (!isRoutedToWarehouse(order) && !isRoutedToInstallation(order)) {
    return state.lang === "it" ? "Instrada l'ordine verso magazzino o posa" : "Route the order to warehouse or installation";
  }
  if (isLogisticsOrderCompleted(order) && !order.operations?.installation?.required) {
    return state.lang === "it" ? "Verifica solo chiusura amministrativa e archiviazione" : "Only admin closure and archiving remain";
  }
  if (isRoutedToWarehouse(order) && getWarehousePreparedLines(order).length === 0) {
    return t("needsPrepSelection");
  }
  if (isRoutedToInstallation(order) && !order.operations?.installation?.installDate) {
    return state.lang === "it" ? "Definisci la data posa" : "Set the installation date";
  }
  return t("noActionRequired");
}

function getInboxRouteLabel(order) {
  const installSelected = isRoutedToInstallation(order);
  const mode = String(order.operations?.warehouse?.fulfillmentMode || "").trim();
  if (installSelected) {
    return state.lang === "it" ? "Ufficio -> Magazzino/Logistica -> Posa" : "Office -> Warehouse/Logistics -> Installation";
  }
  if (mode === "corriere") {
    return state.lang === "it" ? "Ufficio -> Magazzino -> Corriere" : "Office -> Warehouse -> Courier";
  }
  if (mode === "ritiro") {
    return state.lang === "it" ? "Ufficio -> Magazzino -> Ritiro cliente" : "Office -> Warehouse -> Customer pickup";
  }
  if (mode === "furgone") {
    return state.lang === "it" ? "Ufficio -> Magazzino -> Furgone" : "Office -> Warehouse -> Van";
  }
  if (isRoutedToWarehouse(order)) {
    return state.lang === "it" ? "Ufficio -> Magazzino" : "Office -> Warehouse";
  }
  return state.lang === "it" ? "Da instradare" : "To route";
}

function getInboxVisibilityLabel(order) {
  const targets = [];
  if (isRoutedToWarehouse(order)) targets.push(state.lang === "it" ? "Logistica" : "Logistics");
  if (isRoutedToInstallation(order)) targets.push(state.lang === "it" ? "Posa" : "Installation");
  return targets.length ? targets.join(" + ") : (state.lang === "it" ? "Solo ufficio" : "Office only");
}

function buildRouteColumns() {
  const officeOrders = filterOrdersForView("order");
  return [
    {
      route: "clear",
      title: t("newFlow"),
      copy: t("dragOrdersHere"),
      orders: officeOrders.filter((order) => !isRoutedToWarehouse(order) && !isRoutedToInstallation(order)),
    },
    {
      route: "warehouse",
      title: t("warehouseFlow"),
      copy: t("dragOrdersHere"),
      orders: officeOrders.filter((order) => isRoutedToWarehouse(order) && !isRoutedToInstallation(order)),
    },
    {
      route: "installation",
      title: t("installationFlow"),
      copy: t("dragOrdersHere"),
      orders: officeOrders.filter((order) => isRoutedToInstallation(order)),
    },
  ];
}

function isRoutedToWarehouse(order) {
  const warehouse = order.operations?.warehouse || {};
  return Boolean(
    warehouse.selected
    || (warehouse.fulfillmentMode && warehouse.fulfillmentMode !== "da-definire")
    || (warehouse.preparationDate && String(warehouse.preparationDate).trim())
    || (warehouse.status && warehouse.status !== "da-preparare")
    || warehouse.readyToShip
    || warehouse.carrierPassed
    || warehouse.shipped
    || (warehouse.trackingNumber && String(warehouse.trackingNumber).trim()),
  );
}

function isRoutedToInstallation(order) {
  const installation = order.operations?.installation || {};
  return Boolean(
    installation.required
    || installation.selected
    || (installation.installDate && String(installation.installDate).trim())
    || (installation.installTime && String(installation.installTime).trim())
    || (installation.crew && String(installation.crew).trim())
    || installation.clientConfirmed
    || (installation.reportNote && String(installation.reportNote).trim())
    || (installation.status && !["", "da-pianificare"].includes(String(installation.status).trim())),
  );
}

function getCrewForCurrentUser() {
  if (state.currentUser?.role !== "crew") return "";
  if (state.currentUser?.crewName) return String(state.currentUser.crewName).trim();
  if (/alpha/i.test(state.currentUser?.name || "")) return "Alpha";
  if (/beta/i.test(state.currentUser?.name || "")) return "Beta";
  if (/delta/i.test(state.currentUser?.name || "")) return "Delta";
  const availableCrews = getInstallationCrewNames();
  const normalizedUserName = normalizeCrewAlias(state.currentUser?.name || "");
  const matchedCrew = availableCrews.find((crewName) => {
    const normalizedCrew = normalizeCrewAlias(crewName);
    return normalizedCrew && (
      normalizedCrew === normalizedUserName
      || normalizedUserName.includes(normalizedCrew)
      || normalizedCrew.includes(normalizedUserName)
    );
  });
  if (matchedCrew) return matchedCrew;
  return "";
}

function buildInventoryGroups() {
  const demandMap = buildWarehouseDemandMap();

  const groups = new Map();
  state.inventory.forEach((item) => {
    const productLabel = getCatalogLabel(item.product);
    const key = normalizeProductName(productLabel);
    const existing = groups.get(key) || {
      key,
      product: productLabel,
      type: inferCatalogEntry(productLabel)?.type || "material",
      pieces: [],
      totalSqm: 0,
      totalUnits: 0,
      fullCount: 0,
      residualCount: 0,
      demandSqm: demandMap.get(key)?.demandSqm || 0,
      demandUnits: demandMap.get(key)?.demandUnits || 0,
      demandOrders: [...(demandMap.get(key)?.demandOrders || [])],
    };
    existing.pieces.push(item);
    existing.totalSqm += toNumber(item.sqm);
    const units = Math.max(1, Number(item.units || 1));
    existing.totalUnits += units;
    if (item.status === "residuo") existing.residualCount += units;
    else existing.fullCount += units;
    groups.set(key, existing);
  });

  INVENTORY_CATALOG.forEach((item) => {
    const key = normalizeProductName(item.label);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        product: item.label,
        type: item.type,
        pieces: [],
        totalSqm: 0,
        totalUnits: 0,
        fullCount: 0,
        residualCount: 0,
        demandSqm: demandMap.get(key)?.demandSqm || 0,
        demandUnits: demandMap.get(key)?.demandUnits || 0,
        demandOrders: [...(demandMap.get(key)?.demandOrders || [])],
      });
    }
  });

  demandMap.forEach((value, key) => {
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        product: value.product || t("product"),
        type: value.type || "material",
        pieces: [],
        totalSqm: 0,
        totalUnits: 0,
        fullCount: 0,
        residualCount: 0,
        demandSqm: value.demandSqm,
        demandUnits: value.demandUnits,
        demandOrders: [...value.demandOrders],
      });
    }
  });

  return [...groups.values()]
    .map((group) => {
      const availableSqm = Number((group.totalSqm - group.demandSqm).toFixed(2));
      const availableUnits = group.totalUnits - group.demandUnits;
      const isModel = group.type === "turf";
      const grossPricePerSqm = isModel ? getInventoryGrossPricePerSqm(group.product) : 0;
      const grossPriceConfigured = isModel && grossPricePerSqm > 0;
      const availableGrossValue = grossPriceConfigured
        ? Number((Math.max(0, availableSqm) * grossPricePerSqm).toFixed(2))
        : 0;
      return {
        ...group,
        availableSqm,
        availableUnits,
        isModel,
        grossPricePerSqm,
        grossPriceConfigured,
        availableGrossValue,
        pieces: [...group.pieces].sort((a, b) => {
        if (a.status !== b.status) return a.status === "intero" ? -1 : 1;
        if (group.type === "turf") return (b.sqm || 0) - (a.sqm || 0);
        return String(a.variant || a.note || "").localeCompare(String(b.variant || b.note || ""), "it");
      }),
      };
    })
    .sort((a, b) => {
      if (a.isModel !== b.isModel) return a.isModel ? -1 : 1;
      return INVENTORY_CATALOG.findIndex((item) => item.label === a.product) - INVENTORY_CATALOG.findIndex((item) => item.label === b.product);
    });
}

function buildMaterialInventorySlots(group) {
  const slots = new Map();
  group.pieces.forEach((item) => {
    const slotKey = [
      item.status || "intero",
      item.variant || "",
      item.note || "",
    ].join("|");
    const existing = slots.get(slotKey) || {
      id: item.id,
      status: item.status || "intero",
      variant: item.variant || "",
      note: item.note || "",
      units: 0,
    };
    existing.units += Math.max(1, Number(item.units || 1));
    slots.set(slotKey, existing);
  });
  return [...slots.values()].sort((a, b) => b.units - a.units);
}

function getInventorySummary() {
  return buildInventoryGroups();
}

function filterOrdersForView(kind) {
  const searchKey = kind === "order" ? "orders" : kind;
  const search = state.search[searchKey] || "";
  const filter = state.filters[kind === "order" ? "order" : kind];
  return state.orders.filter((order) => {
    if (kind === "warehouse" && !isRoutedToWarehouse(order)) return false;
    if (kind === "shipping" && !(isRoutedToWarehouse(order) || isRoutedToInstallation(order))) return false;
    if (state.currentUser?.role === "warehouse" && kind === "order") return false;
    const haystack = [
      composeClientName(order),
      getOrderNumber(order),
      order.city,
      order.operations?.product,
      getShippingModeLabel(order),
    ].join(" ").toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (kind === "order") {
      const stage = getUnifiedOrderStage(order);
      const fulfilledOrClosed = isOrderFulfilledOrClosed(order);
      if (filter === "attention") return !fulfilledOrClosed && (!order.address || !order.city || order.operations?.officeStatus === "bozza");
      if (filter === "warehouse") return !fulfilledOrClosed && ["warehouse-work", "warehouse-ready"].includes(stage.key);
      if (filter === "installation") return !fulfilledOrClosed && (["install-planned", "install-progress"].includes(stage.key) || isRoutedToInstallation(order));
      if (filter === "shipping") return !fulfilledOrClosed && (isRoutedToWarehouse(order) || isRoutedToInstallation(order));
      if (filter === "fulfilled") return fulfilledOrClosed;
      return !fulfilledOrClosed;
    }
    if (kind === "warehouse") {
      return !isLogisticsOrderCompleted(order);
    }
    if (kind === "accounting") {
      if (filter === "open") return getOpenBalance(order) > 0;
      if (filter === "invoice") return Boolean(order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued);
      if (filter === "thisMonth") {
        const now = new Date();
        const orderDate = new Date(order.createdAt || 0);
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      if (filter === "lastMonth") {
        const now = new Date();
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const orderDate = new Date(order.createdAt || 0);
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
      }
      return true;
    }
    if (kind === "shipping") {
      const sample = isSampleOrder(order);
      if (filter === "completed") return isLogisticsOrderCompleted(order);
      if (isLogisticsOrderCompleted(order)) return false;
      if (filter === "sample") return sample;
      if (filter === "all") return true;
      if (sample) return false;
      const mode = order.operations?.warehouse?.fulfillmentMode;
      if (filter === "courier") return mode === "corriere";
      if (filter === "pickup") return mode === "ritiro";
      if (filter === "van") return mode === "furgone";
      return true;
    }
    return true;
  }).sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0));
}

function renderInboxFlowControls(order) {
  const jobNeedsInstall = Boolean(order.operations?.installation?.required);
  const warehouseSelected = isRoutedToWarehouse(order) || jobNeedsInstall;
  const installSelected = isRoutedToInstallation(order) || jobNeedsInstall;
  const warehouseStatus = order.operations?.warehouse?.status || "da-preparare";
  const fulfillmentMode = order.operations?.warehouse?.fulfillmentMode || "da-definire";
  const preparationDate = getShippingTargetDate(order);
  const stage = getUnifiedOrderStage(order);
  const nextAction = getNextOrderAction(order);
  const routeSummary = installSelected
    ? (state.lang === "it" ? "Ordine in carico a ufficio, logistica e squadra posa." : "Order active for office, logistics and installation crew.")
    : warehouseSelected
      ? (state.lang === "it" ? "Ordine in carico a ufficio e logistica / magazzino." : "Order active for office and logistics / warehouse.")
      : (state.lang === "it" ? "Ordine ancora da instradare nei flussi operativi." : "Order not routed yet into the operational flows.");
  return `
    <article class="guidance-card order-flow-card">
      <span class="panel-eyebrow">${state.lang === "it" ? "Processo operativo" : "Operational flow"}</span>
      <div class="detail-grid detail-grid-tight">
        ${renderInfoLine(state.lang === "it" ? "Fase attuale" : "Current stage", stage.label)}
        ${renderInfoLine(state.lang === "it" ? "Prossimo passo" : "Next step", nextAction)}
        ${renderInfoLine(state.lang === "it" ? "Percorso ordine" : "Order route", getInboxRouteLabel(order))}
        ${renderInfoLine(state.lang === "it" ? "Visibilità moduli" : "Module visibility", getInboxVisibilityLabel(order))}
      </div>
      <p>${routeSummary}</p>
      <div class="route-visibility-grid">
        <label class="route-toggle-card ${warehouseSelected ? "is-active" : ""}">
          <div class="route-toggle-head">
            <input type="checkbox" data-order-flow-warehouse="${order.id}" ${warehouseSelected ? "checked" : ""} />
            <span>${state.lang === "it" ? "Visibile in logistica" : "Visible in logistics"}</span>
          </div>
          <small class="route-toggle-copy">
            ${state.lang === "it"
              ? "Ordine da preparare in sede, spedire, ritirare oppure caricare sul furgone."
              : "Order to prepare at HQ, ship, pick up, or load onto the van."}
          </small>
        </label>
        <label class="route-toggle-card ${installSelected ? "is-active" : ""}">
          <div class="route-toggle-head">
            <input type="checkbox" data-order-flow-installation="${order.id}" ${installSelected ? "checked" : ""} />
            <span>${state.lang === "it" ? "Visibile in posa" : "Visible in installation"}</span>
          </div>
          <small class="route-toggle-copy">
            ${jobNeedsInstall
              ? (state.lang === "it" ? "Da comunicare alla squadra con data, orario e uscita materiale dalla sede centrale." : "To be shared with the crew with date, time, and material departure from HQ.")
              : (state.lang === "it" ? "Attivalo solo se questo ordine deve entrare davvero nel planning della squadra." : "Enable only if this order must enter the crew planning board.")}
          </small>
        </label>
      </div>
      <div class="order-flow-grid">
        <label class="field">
          <span>${state.lang === "it" ? "Stato preparazione" : "Preparation status"}</span>
          <select class="text-input" data-order-flow-status="${order.id}">
            <option value="da-preparare" ${warehouseStatus === "da-preparare" ? "selected" : ""}>${state.lang === "it" ? "Da preparare" : "To prepare"}</option>
            <option value="in-preparazione" ${warehouseStatus === "in-preparazione" ? "selected" : ""}>${state.lang === "it" ? "In preparazione" : "Preparing"}</option>
            <option value="pronto" ${warehouseStatus === "pronto" ? "selected" : ""}>${state.lang === "it" ? "Pronto" : "Ready"}</option>
            <option value="in-attesa-di-ritiro" ${warehouseStatus === "in-attesa-di-ritiro" ? "selected" : ""}>${state.lang === "it" ? "In attesa di ritiro" : "Waiting for pickup"}</option>
            <option value="da-ritirare" ${warehouseStatus === "da-ritirare" ? "selected" : ""}>${state.lang === "it" ? "Da ritirare" : "Ready for pickup"}</option>
            <option value="ritirato" ${warehouseStatus === "ritirato" ? "selected" : ""}>${state.lang === "it" ? "Ritirato" : "Collected"}</option>
          </select>
        </label>
        <label class="field">
          <span>${state.lang === "it" ? "Uscita merce" : "Goods exit mode"}</span>
          <select class="text-input" data-order-flow-mode="${order.id}">
            <option value="da-definire" ${fulfillmentMode === "da-definire" ? "selected" : ""}>${state.lang === "it" ? "Da definire" : "To define"}</option>
            <option value="corriere" ${fulfillmentMode === "corriere" ? "selected" : ""}>${state.lang === "it" ? "Corriere" : "Courier"}</option>
            <option value="ritiro" ${fulfillmentMode === "ritiro" ? "selected" : ""}>${state.lang === "it" ? "Ritiro" : "Pickup"}</option>
            <option value="furgone" ${fulfillmentMode === "furgone" ? "selected" : ""}>${state.lang === "it" ? "Furgone" : "Van"}</option>
          </select>
        </label>
        <label class="field">
          <span>${state.lang === "it" ? "Data preparazione merce" : "Goods preparation date"}</span>
          <input class="text-input" type="date" data-order-flow-date="${order.id}" value="${preparationDate || ""}" />
        </label>
      </div>
      <div class="flow-helper-note">
        ${state.lang === "it"
          ? "Sede centrale Orta di Atella: la merce da spedire parte su pallet per corrieri o ritiro cliente, la merce da posare viene preparata e caricata sul furgone."
          : "HQ in Orta di Atella: shipment-only goods leave on pallets for couriers or pickup, installation goods are prepared and loaded onto the van."}
      </div>
    </article>
  `;
}

function getActiveInstallationCrewFilter() {
  const forcedCrew = getCrewForCurrentUser();
  if (forcedCrew) return forcedCrew;
  return state.filters.installation && state.filters.installation !== "all"
    ? String(state.filters.installation)
    : "";
}

function filterInstallations() {
  const activeCrewFilter = getActiveInstallationCrewFilter();
  return state.orders
    .filter((order) => isRoutedToInstallation(order))
    .filter((order) => {
      if (!activeCrewFilter) return true;
      return orderBelongsToCrew(order, activeCrewFilter);
    })
    .sort((left, right) => {
      const leftDate = String(left.operations?.installation?.installDate || "");
      const rightDate = String(right.operations?.installation?.installDate || "");
      if (leftDate && rightDate && leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      if (!leftDate && rightDate) return -1;
      if (leftDate && !rightDate) return 1;
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    });
}

function applyStaticTranslations() {
  document.documentElement.lang = state.lang;
  document.title = `${t("localPortal")} - ${t("portalSubtitle")}`;
  staticLabels().forEach(([selector, text, placeholder]) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    if (!nodes.length) return;
    nodes.forEach((node) => {
      if (placeholder != null) {
        node.setAttribute("placeholder", placeholder);
        return;
      }
      node.textContent = text;
    });
  });
  ui.navLinks.forEach((button) => {
    const label = button.querySelector(".nav-label");
    if (label) label.textContent = t(button.dataset.view);
    else button.textContent = t(button.dataset.view);
  });
  setText("sidebar-operational-label", t("operationsSection"));
  setText("sidebar-sales-label", t("salesSection"));
  setText("sidebar-admin-label", t("adminSection"));
  setSubheading("#orders .panel-subsection:nth-of-type(1) h4", t("officeOperations"));
  setSubheading("#orders .panel-subsection:nth-of-type(2) h4", t("orderItems"));
  setSubheading("#orders .panel-subsection:nth-of-type(3) h4", t("officePreparation"));
  setSubheading("#orders .panel-subsection:nth-of-type(4) h4", t("orderAttachments"));
  setSubheading("#accounting .panel-head h3", t("accounting"));
  setSubheading("#accounting .panel-subsection h4", t("accountingSummary"));
  setSubheading("#warehouse .panel-head h3", t("stockFlowTitle"));
  setSubheading("#shipping .panel-head h3", t("shippingTitle"));
  setSubheading("#installations .panel-head h3", t("installations"));
  setText("sales-requests-title", t("salesRequestsTitle"));
  setText("sales-requests-subtitle", t("salesRequestsSubtitle"));
  setText("sales-generator-title", t("salesGeneratorTitle"));
  setText("sales-generator-subtitle", t("salesGeneratorSubtitle"));
  setText("sales-content-title", t("salesContentTitle"));
  setText("sales-content-subtitle", t("salesContentSubtitle"));
  setFieldLabel(ui.installationForm, "installDate", state.lang === "it" ? "Data posa" : "Installation date");
  setFieldLabel(ui.installationForm, "installTime", state.lang === "it" ? "Ora" : "Time");
  setFieldLabel(ui.installationForm, "status", state.lang === "it" ? "Stato cantiere" : "Site status");
  setFieldLabel(ui.installationForm, "crew", state.lang === "it" ? "Squadra" : "Crew");
  setFieldLabel(ui.installationForm, "reportNote", state.lang === "it" ? "Note squadra / cantiere" : "Crew / site notes");
  setFieldLabel(ui.installationExpenseForm, "category", t("expenseCategory"));
  setFieldLabel(ui.installationExpenseForm, "amount", t("expenseAmount"));
  setFieldLabel(ui.installationExpenseForm, "date", t("expenseDate"));
  setFieldLabel(ui.installationExpenseForm, "note", t("expenseNote"));
  setFieldLabel(ui.accountingForm, "paymentMethod", state.lang === "it" ? "Metodo utilizzato" : "Method used");
  setFieldLabel(ui.accountingForm, "invoiceRequired", state.lang === "it" ? "Fattura richiesta" : "Invoice required");
  setFieldLabel(ui.accountingForm, "invoiceIssued", state.lang === "it" ? "Fattura emessa" : "Invoice issued");
  setFieldLabel(ui.accountingForm, "accountingNote", state.lang === "it" ? "Nota amministrativa" : "Administrative note");
  setText("accounting-payments-label", state.lang === "it" ? "Pagamenti registrati" : "Recorded payments");
  setText("accounting-add-payment-button", state.lang === "it" ? "+ Aggiungi pagamento" : "+ Add payment");
  setFieldLabel(ui.shippingForm, "destinationProvinceCode", state.lang === "it" ? "Provincia destinazione" : "Destination province");
  setFieldLabel(ui.shippingForm, "destinationPostalCode", state.lang === "it" ? "CAP destinazione" : "Destination ZIP");
  setFieldLabel(ui.settingsForm, "storeDomain", state.lang === "it" ? "Dominio Shopify" : "Shopify domain");
  setFieldLabel(ui.settingsForm, "clientId", "Client ID");
  setFieldLabel(ui.settingsForm, "clientSecret", state.lang === "it" ? "Client secret app" : "App client secret");
  setFieldLabel(ui.settingsForm, "adminAccessToken", state.lang === "it" ? "Admin API access token" : "Admin API access token");
  setFieldLabel(ui.settingsForm, "locationName", state.lang === "it" ? "Deposito / location" : "Warehouse / location");
  setFieldLabel(ui.settingsForm, "carrierName", state.lang === "it" ? "Vettore di riferimento" : "Reference carrier");
  setFieldLabel(ui.settingsForm, "shippingRateMode", state.lang === "it" ? "Modalità tariffa spedizione" : "Shipping pricing mode");
  setFieldLabel(ui.settingsForm, "shippingTariffProfile", state.lang === "it" ? "Profilo tariffario" : "Tariff profile");
  setFieldLabel(ui.settingsForm, "volumetricDivisor", state.lang === "it" ? "Divisore peso volumetrico" : "Volumetric divisor");
  setFieldLabel(ui.settingsForm, "rate80", state.lang === "it" ? "Nolo fino a 80 kg" : "Rate up to 80 kg");
  setFieldLabel(ui.settingsForm, "rate150", state.lang === "it" ? "Nolo fino a 150 kg" : "Rate up to 150 kg");
  setFieldLabel(ui.settingsForm, "rate300", state.lang === "it" ? "Nolo fino a 300 kg" : "Rate up to 300 kg");
  setFieldLabel(ui.settingsForm, "rate500", state.lang === "it" ? "Nolo fino a 500 kg" : "Rate up to 500 kg");
  setFieldLabel(ui.settingsForm, "rate1000", state.lang === "it" ? "Nolo fino a 1000 kg" : "Rate up to 1000 kg");
  setFieldLabel(ui.settingsForm, "extraKgRate", state.lang === "it" ? "Extra €/kg oltre 1000 kg" : "Extra €/kg over 1000 kg");
  setFieldLabel(ui.orderForm, "provinceCode", state.lang === "it" ? "Provincia" : "Province");
  setFieldLabel(ui.orderForm, "postalCode", state.lang === "it" ? "CAP" : "ZIP");
  if (ui.installationForm?.status) {
    const statusLabels = {
      "da-pianificare": t("toPlan"),
      programmata: t("scheduled"),
      "in-corso": t("inProgress"),
      completata: t("completed"),
      problema: t("issue"),
    };
    Array.from(ui.installationForm.status.options).forEach((option) => {
      option.textContent = statusLabels[option.value] || option.textContent;
    });
  }
  if (ui.installationExpenseForm?.category) {
    Array.from(ui.installationExpenseForm.category.options).forEach((option) => {
      option.textContent = getTravelExpenseLabel(option.value);
    });
  }
}

function updateShell() {
  applyMobileSafeMode();
  const currentRole = normalizeUserRole(state.currentUser?.role || "office");
  const allowed = getAllowedViewsForRole(currentRole);
  const showCoverageRadar = currentRole === "office";
  const showGardenPlannerShortcut = currentRole === "office" || currentRole === "crew";
  if (!allowed.includes(state.currentView)) state.currentView = allowed[0];
  document.body.dataset.userRole = currentRole;
  ui.navLinks.forEach((button) => {
    const visible = allowed.includes(button.dataset.view);
    button.hidden = !visible;
    button.classList.toggle("hidden", !visible);
    button.classList.toggle("is-active", state.currentView === button.dataset.view);
    button.setAttribute("aria-hidden", visible ? "false" : "true");
    forceMobileVisibility(button, visible, "grid");
  });
  const adminVisible = Array.from(ui.sidebarAdminNav?.querySelectorAll(".nav-link") || []).some((button) => !button.hidden);
  if (ui.sidebarAdminDivider) {
    ui.sidebarAdminDivider.classList.toggle("hidden", !adminVisible);
    forceMobileVisibility(ui.sidebarAdminDivider, adminVisible, "block");
  }
  if (ui.sidebarAdminLabel) {
    ui.sidebarAdminLabel.classList.toggle("hidden", !adminVisible);
    forceMobileVisibility(ui.sidebarAdminLabel, adminVisible, "block");
  }
  if (ui.sidebarAdminNav) {
    ui.sidebarAdminNav.classList.toggle("hidden", !adminVisible);
    forceMobileVisibility(ui.sidebarAdminNav, adminVisible, "grid");
  }
  const operationalVisible = Array.from(ui.sidebarOperationalNav?.querySelectorAll(".nav-link") || []).some((button) => !button.hidden);
  if (ui.sidebarOperationalLabel) {
    ui.sidebarOperationalLabel.classList.toggle("hidden", !operationalVisible);
    forceMobileVisibility(ui.sidebarOperationalLabel, operationalVisible, "block");
  }
  if (ui.sidebarOperationalNav) {
    ui.sidebarOperationalNav.classList.toggle("hidden", !operationalVisible);
    forceMobileVisibility(ui.sidebarOperationalNav, operationalVisible, "grid");
  }
  const salesVisible = Array.from(ui.sidebarSalesNav?.querySelectorAll(".nav-link") || []).some((button) => !button.hidden);
  if (ui.sidebarSalesDivider) {
    ui.sidebarSalesDivider.classList.toggle("hidden", !salesVisible);
    forceMobileVisibility(ui.sidebarSalesDivider, salesVisible, "block");
  }
  if (ui.sidebarSalesLabel) {
    ui.sidebarSalesLabel.classList.toggle("hidden", !salesVisible);
    forceMobileVisibility(ui.sidebarSalesLabel, salesVisible, "block");
  }
  if (ui.sidebarSalesNav) {
    ui.sidebarSalesNav.classList.toggle("hidden", !salesVisible);
    forceMobileVisibility(ui.sidebarSalesNav, salesVisible, "grid");
  }
  ui.views.forEach((view) => view.classList.toggle("is-active", view.id === state.currentView));
  ui.viewTitle.textContent = t(state.currentView);
  ui.currentUserName.textContent = state.currentUser?.name || "-";
  ui.currentUserRole.textContent = roleLabel(state.currentUser?.role);
  ui.topbarUserName.textContent = state.currentUser?.name || "-";
  ui.topbarUserRole.textContent = roleLabel(state.currentUser?.role);
  if (ui.topbarAvatar) {
    const crewBranding = buildSalesGeneratorBrandingPayload();
    if (crewBranding.crewLogoDataUrl) {
      ui.topbarAvatar.classList.add("has-image");
      ui.topbarAvatar.innerHTML = `<img src="${escapeHtml(crewBranding.crewLogoDataUrl)}" alt="${escapeHtml(crewBranding.crewName ? `Logo squadra ${crewBranding.crewName}` : "Logo squadra")}" />`;
    } else {
      ui.topbarAvatar.classList.remove("has-image");
      ui.topbarAvatar.textContent = getUserInitials(state.currentUser?.name);
    }
  }
  if (ui.coveragePanel) ui.coveragePanel.classList.toggle("hidden", !showCoverageRadar);
  if (ui.newOrderButton) {
    const allowCreateOrders = currentRole === "office";
    ui.newOrderButton.hidden = !allowCreateOrders;
    ui.newOrderButton.classList.toggle("hidden", !allowCreateOrders);
  }
  if (ui.mobilePillNewOrderButton) {
    const allowCreateOrders = currentRole === "office";
    ui.mobilePillNewOrderButton.hidden = !allowCreateOrders;
    ui.mobilePillNewOrderButton.classList.toggle("hidden", !allowCreateOrders);
  }
  if (ui.topbarGardenPlannerLink) {
    ui.topbarGardenPlannerLink.hidden = !showGardenPlannerShortcut;
    ui.topbarGardenPlannerLink.classList.toggle("hidden", !showGardenPlannerShortcut);
  }
  if (ui.mobileGardenPlannerLink) {
    ui.mobileGardenPlannerLink.hidden = !showGardenPlannerShortcut;
    ui.mobileGardenPlannerLink.classList.toggle("hidden", !showGardenPlannerShortcut);
    forceMobileVisibility(ui.mobileGardenPlannerLink, showGardenPlannerShortcut, "flex");
  }
  if (ui.mobilePillGardenPlannerLink) {
    ui.mobilePillGardenPlannerLink.hidden = !showGardenPlannerShortcut;
    ui.mobilePillGardenPlannerLink.classList.toggle("hidden", !showGardenPlannerShortcut);
  }
  if (ui.sidebarMobileTools) {
    ui.sidebarMobileTools.hidden = false;
    ui.sidebarMobileTools.classList.remove("hidden", "is-office-mode", "is-crew-mode", "is-warehouse-mode");
    ui.sidebarMobileTools.classList.add(
      currentRole === "crew" ? "is-crew-mode" : currentRole === "warehouse" ? "is-warehouse-mode" : "is-office-mode",
    );
    forceMobileVisibility(ui.sidebarMobileTools, true, "grid");
  }
  if (ui.mobilePillShell) {
    ui.mobilePillShell.dataset.userRole = currentRole;
  }
  syncSidebarLayout(currentRole);
  if (ui.salesGeneratorContextPanel) {
    const hideGeneratorPrefill = currentRole === "crew";
    ui.salesGeneratorContextPanel.hidden = hideGeneratorPrefill;
    ui.salesGeneratorContextPanel.classList.toggle("hidden", hideGeneratorPrefill);
  }
  applyStaticTranslations();
  syncMobilePillNav();
  if (state.currentUser?.role === "crew") {
    setText(
      "sales-generator-subtitle",
      state.lang === "it"
        ? "Usa il preventivatore integrato per generare preventivi della squadra, senza accesso alle richieste commerciali."
        : "Use the integrated quote tool for crew estimates, without access to sales requests.",
    );
  }
  if (ui.reloadButton) {
    ui.reloadButton.disabled = state.syncInProgress;
    ui.reloadButton.textContent = state.syncInProgress ? t("syncing") : t("reloadData");
  }
  if (ui.mobilePillReloadButton) {
    ui.mobilePillReloadButton.disabled = state.syncInProgress;
    ui.mobilePillReloadButton.textContent = state.syncInProgress ? t("syncing") : t("reloadData");
  }
  if (ui.ordersSyncButton) {
    ui.ordersSyncButton.disabled = state.syncInProgress;
    ui.ordersSyncButton.textContent = state.syncInProgress ? t("syncingShopify") : t("syncShopify");
  }
  updateMobileMenu();
}

function getSoldSqmEstimate() {
  return state.orders.reduce((sum, order) => {
    if (order.operations?.officeStatus === "bozza" && order.source === "manual") return sum;
    const physicalLines = getPhysicalOrderLines(order);
    const turfLines = physicalLines.filter((line) => isTurfModel(line.title));
    const measuredSqm = turfLines.reduce((lineSum, line) => {
      const dimsSqm = toNumber(line.dimensions?.sqm || 0);
      if (dimsSqm) return lineSum + (dimsSqm * getDisplayPieceCount(order, line));
      return lineSum + parseSquareMetersFromTitle(line.title, getDisplayPieceCount(order, line));
    }, 0);
    const fallbackSqm = turfLines.reduce((lineSum, line) => lineSum + parseSquareMetersFromTitle(line.title, Number(line.quantity || 1)), 0);
    const operationsSqm = toNumber(order.operations?.sqm || 0);
    const sqm = measuredSqm > 0 ? measuredSqm : (operationsSqm > 0 ? operationsSqm : fallbackSqm);
    if (sqm <= 0) return sum;
    return sum + sqm;
  }, 0);
}

function getDashboardInventorySnapshot() {
  const groups = getInventorySummary();
  const turfGroups = groups.filter((group) => group.isModel);
  const materialGroups = groups.filter((group) => !group.isModel);
  const totalStockSqm = turfGroups.reduce((sum, group) => sum + toNumber(group.totalSqm), 0);
  const totalAvailableSqm = turfGroups.reduce((sum, group) => sum + Math.max(0, toNumber(group.availableSqm)), 0);
  const totalCommittedSqm = turfGroups.reduce((sum, group) => sum + toNumber(group.demandSqm), 0);
  const totalImmobilizedGrossValue = turfGroups.reduce((sum, group) => sum + toNumber(group.availableGrossValue), 0);
  const pricedAvailableSqm = turfGroups.reduce((sum, group) => sum + (group.grossPriceConfigured ? Math.max(0, toNumber(group.availableSqm)) : 0), 0);
  const unpricedAvailableSqm = turfGroups.reduce((sum, group) => sum + (!group.grossPriceConfigured ? Math.max(0, toNumber(group.availableSqm)) : 0), 0);
  const totalMaterialUnits = materialGroups.reduce((sum, group) => sum + toNumber(group.totalUnits), 0);
  const uncovered = groups.filter((group) => (group.isModel ? toNumber(group.availableSqm) < 0 : toNumber(group.availableUnits) < 0)).length;
  return {
    totalStockSqm,
    totalAvailableSqm,
    totalCommittedSqm,
    totalImmobilizedGrossValue,
    pricedAvailableSqm,
    unpricedAvailableSqm,
    totalMaterialUnits,
    uncovered,
  };
}

function renderOps() {
  const orders = state.orders.length;
  const inboxOrders = state.orders.filter((order) => !isOrderFulfilledOrClosed(order)).length;
  const soldSqm = getSoldSqmEstimate();
  const warehouse = state.orders.filter((order) => orderNeedsWarehouseWork(order)).length;
  const inventorySnapshot = getDashboardInventorySnapshot();
  const installations = state.orders.filter((order) => isRoutedToInstallation(order) && !["completata"].includes(String(order.operations?.installation?.status || "").trim())).length;
  const accounting = state.orders.filter((order) => getOpenBalance(order) > 0 || (order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued)).length;
  const shipping = state.orders.filter((order) => {
    if (isLogisticsOrderCompleted(order)) return false;
    if (isSampleOrder(order)) return true;
    return ["corriere", "ritiro", "furgone"].includes(order.operations?.warehouse?.fulfillmentMode);
  }).length;
  const closed = state.orders.filter((order) => isOrderClosed(order)).length;
  const salesRequests = state.salesRequests.filter((item) => !isSalesRequestClosedStatus(item.status)).length;
  const salesContents = state.salesContents.length;
  ui.opsOrdersValue.textContent = String(orders);
  if (ui.opsSoldSqmValue) ui.opsSoldSqmValue.textContent = `${Math.round(soldSqm)} mq`;
  ui.opsWarehouseValue.textContent = String(warehouse);
  if (ui.opsStockValue) ui.opsStockValue.textContent = `${Math.round(inventorySnapshot.totalStockSqm)} mq`;
  ui.opsInstallationsValue.textContent = String(installations);
  ui.opsAccountingValue.textContent = String(accounting);
  if (ui.opsShippingValue) ui.opsShippingValue.textContent = String(shipping);
  const opsClosedValue = document.getElementById("ops-closed-value");
  if (opsClosedValue) opsClosedValue.textContent = String(closed);
  setNavCount("dashboard", "");
  setNavCount("orders", inboxOrders);
  setNavCount("warehouse", warehouse);
  setNavCount("installations", installations);
  setNavCount("accounting", accounting);
  setNavCount("shipping", shipping);
  setNavCount("sales-requests", salesRequests);
  setNavCount("sales-generator", "");
  setNavCount("sales-content", salesContents);
  setNavCount("settings", "");
  const opsTexts = state.lang === "it"
    ? {
        orders: "Ordini totali e bozze operative.",
        soldSqm: "Stima dei metri quadri confermati sugli ordini acquisiti.",
        warehouse: "Ordini da preparare, spedire o caricare.",
        stock: `Disponibili ${Math.round(inventorySnapshot.totalAvailableSqm)} mq netti su prato.`,
        installations: "Installazioni da pianificare o in corso.",
        accounting: "Ordini da verificare, saldare o fatturare.",
        shipping: "Corrieri, ritiri, furgoni e bancali.",
        closed: "Ordini completati e senza azioni aperte.",
      }
    : {
        orders: "Total orders and operational drafts.",
        soldSqm: "Estimated square meters confirmed across acquired orders.",
        warehouse: "Orders to prepare, ship or load.",
        stock: `${Math.round(inventorySnapshot.totalAvailableSqm)} net sqm available across turf stock.`,
        installations: "Installations to plan or in progress.",
        accounting: "Orders to verify, settle or invoice.",
        shipping: "Couriers, pickups, vans and pallets.",
        closed: "Completed orders with no open actions.",
      };
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  setText("ops-orders-text", opsTexts.orders);
  setText("ops-sold-sqm-text", opsTexts.soldSqm);
  setText("ops-warehouse-text", opsTexts.warehouse);
  setText("ops-stock-text", opsTexts.stock);
  setText("ops-installations-text", opsTexts.installations);
  setText("ops-accounting-text", opsTexts.accounting);
  setText("ops-shipping-text", opsTexts.shipping);
  setText("ops-closed-text", opsTexts.closed);
}

function renderDashboard() {
  const actions = buildDashboardActions();
  if (ui.dashboardSubtitle) ui.dashboardSubtitle.textContent = getDashboardSubtitle();

  const actionsBadge = document.getElementById("dashboard-actions-badge");
  if (actionsBadge) actionsBadge.textContent = `${actions.length} ${actions.length === 1 ? "azione" : "azioni"}`;

  if (ui.dashboardActions) {
    ui.dashboardActions.innerHTML = actions.length
      ? actions.map(({ order, title, reason, kind, urgency }, idx) => {
        const meta = getActionMeta(kind);
        const badgeClass = urgency === "urgent"
          ? "badge-urgent"
          : urgency === "warning"
            ? "badge-warning"
            : urgency === "success"
              ? "badge-success"
              : "badge-info";
        const dotColor = kind === "material" ? "material"
          : kind === "address" ? "address"
          : kind === "warehouse" ? "warehouse"
          : kind === "installation" ? "installation"
          : kind === "accounting" ? "accounting"
          : kind === "completed" ? "completed"
          : "generic";
        return `
          <article class="action-card" style="animation-delay:${idx * 0.05}s">
            <div class="action-dot ${dotColor}"></div>
            <div class="action-content">
              <div class="action-title">${title}</div>
              <div class="action-sub">${reason}</div>
            </div>
            <div class="action-tail">
              <span class="action-badge ${badgeClass}">${meta.icon}</span>
              <button class="btn primary" data-action="select-order" data-id="${order.id}" data-view="orders">${state.lang === "it" ? "Apri" : "Open"}</button>
            </div>
          </article>
        `;
      }).join("")
      : `<div class="info-card">${state.lang === "it" ? "Nessuna priorità critica al momento." : "No critical priorities right now."}</div>`;
  }

  if (ui.dashboardActivity) {
    const activityItems = buildActivityFeed();
    ui.dashboardActivity.innerHTML = activityItems.length
      ? activityItems.map(item => `
        <article class="feed-item">
          <div class="feed-dot ${item.color}"></div>
          <div class="feed-body">
            <div class="feed-text"><strong>${item.actor}</strong> ${item.text}</div>
            <div class="feed-time">${item.time}</div>
          </div>
        </article>
      `).join("")
      : `<div class="info-card">${state.lang === "it" ? "Nessuna attività recente." : "No recent activity."}</div>`;
  }

  if (ui.dashboardWeekSummary) {
    const installs = filterInstallations();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    ui.dashboardWeekSummary.innerHTML = Array.from({ length: 3 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const items = installs.filter((order) => order.operations?.installation?.installDate === key);
      const totalSqm = items.reduce((sum, order) => sum + toNumber(order.operations?.sqm || 0), 0);
      const pct = Math.min(100, Math.round((totalSqm / 120) * 100));
      const gaugeColor = pct >= 80 ? "gauge-high" : pct >= 50 ? "gauge-mid" : "gauge-low";
      const isToday = index === 0;
      return `
        <article class="week-card ${isToday ? "week-card-today" : ""}">
          <div class="week-card-head">
            <strong>${isToday ? (state.lang === "it" ? "Oggi" : "Today") + " — " : ""}${formatDate(key)}</strong>
            <span class="week-cap">${Math.round(totalSqm)}/120 mq</span>
          </div>
          <div class="cal-gauge"><div class="cal-gauge-fill ${gaugeColor}" style="width:${pct}%"></div></div>
          ${items.length
            ? items.slice(0, 2).map((order) => `<div class="week-item">${composeClientName(order)} · ${getOrderNumber(order)}<small>${order.operations?.product || "—"} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq</small></div>`).join("")
            : `<div class="week-empty">${state.lang === "it" ? "Nessuna posa" : "No installs"}</div>`}
        </article>
      `;
    }).join("");
  }

  if (ui.dashboardAlerts) {
    const warehouseAlerts = buildWarehouseAlerts();
    const orderAlerts = state.orders
      .filter((order) => order.operations?.warehouse?.status === "bloccato" || order.operations?.installation?.status === "problema")
      .slice(0, 8);

    let alertHTML = "";
    if (warehouseAlerts.length) {
      alertHTML += warehouseAlerts.map(alert => `
        <article class="alert-compact alert-${alert.severity}">
          <strong>${alert.title}</strong>
          <p>${alert.detail}</p>
        </article>
      `).join("");
    }
    if (orderAlerts.length) {
      alertHTML += orderAlerts.map(order => `
        <article class="alert-compact alert-amber">
          <strong>${composeClientName(order)} · ${getOrderNumber(order)}</strong>
          <p>${order.operations?.warehouse?.warehouseNote || order.operations?.installation?.reportNote || (state.lang === "it" ? "Serve un intervento operativo." : "An operational action is needed.")}</p>
        </article>
      `).join("");
    }
    if (!alertHTML) {
      alertHTML = `
        <div class="info-card">
          <strong>${state.lang === "it" ? "Nessun alert bloccante" : "No blocking alerts"}</strong>
          <p>${state.lang === "it" ? "Oggi" : "Today"}: ${state.orders.filter((order) => order.operations?.installation?.status === "in-corso").length} ${state.lang === "it" ? "pose in corso" : "installs in progress"} · ${state.orders.filter((order) => ["da-preparare", "in-preparazione"].includes(order.operations?.warehouse?.status)).length} ${state.lang === "it" ? "ordini da preparare" : "orders to prepare"} · ${formatCurrency(state.orders.reduce((sum, order) => sum + getOpenBalance(order), 0))} ${state.lang === "it" ? "da incassare" : "to collect"}</p>
        </div>
      `;
    }
    ui.dashboardAlerts.innerHTML = alertHTML;
  }

  if (ui.dashboardAccountingSnapshot) {
    const totalOpenBalance = state.orders.reduce((sum, order) => sum + getOpenBalance(order), 0);
    const invoicePending = state.orders.filter((order) => order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued).length;
    const paidOnShopify = state.orders.filter((order) => getShopifyPaidAmount(order) > 0).length;
    const internalPending = state.orders.filter((order) => !isShopifyPaid(order) && getOpenBalance(order) > 0).length;
    ui.dashboardAccountingSnapshot.innerHTML = [
      {
        label: state.lang === "it" ? "Residuo totale" : "Total open balance",
        value: formatCurrency(totalOpenBalance),
        meta: state.lang === "it" ? `${accountingOpenOrdersLabel()} da presidiare` : `${accountingOpenOrdersLabel()} to follow up`,
        accent: true,
      },
      {
        label: state.lang === "it" ? "Fatture da emettere" : "Invoices pending",
        value: String(invoicePending),
        meta: state.lang === "it" ? "Ordini con fattura richiesta e non ancora emessa." : "Orders requiring an invoice not issued yet.",
      },
      {
        label: state.lang === "it" ? "Incassi Shopify" : "Shopify collections",
        value: String(paidOnShopify),
        meta: state.lang === "it" ? "Ordini con pagamento online già acquisito." : "Orders already captured online.",
      },
      {
        label: state.lang === "it" ? "Da registrare internamente" : "Internal follow-up",
        value: String(internalPending),
        meta: state.lang === "it" ? "Ordini con saldo o registrazione ancora da completare." : "Orders still waiting for manual accounting follow-up.",
      },
    ].map((item) => `
      <article class="accounting-analysis-card ${item.accent ? "accent" : ""}">
        <span class="panel-eyebrow">${item.label}</span>
        <strong>${item.value}</strong>
        <p>${item.meta}</p>
      </article>
    `).join("");
  }

  if (ui.dashboardInventorySnapshot) {
    const snapshot = getDashboardInventorySnapshot();
    ui.dashboardInventorySnapshot.innerHTML = [
      {
        label: state.lang === "it" ? "Giacenza prato" : "Turf stock",
        value: `${Math.round(snapshot.totalStockSqm)} mq`,
        meta: state.lang === "it" ? `${Math.round(snapshot.totalAvailableSqm)} mq netti ancora disponibili` : `${Math.round(snapshot.totalAvailableSqm)} net sqm still available`,
        accent: true,
      },
      {
        label: state.lang === "it" ? "Impegnato ordini" : "Committed",
        value: `${Math.round(snapshot.totalCommittedSqm)} mq`,
        meta: state.lang === "it" ? "Metri quadri già assorbiti dagli ordini aperti." : "Square meters already reserved by open orders.",
      },
      {
        label: state.lang === "it" ? "Valore immobilizzato" : "Immobilized value",
        value: formatCurrency(snapshot.totalImmobilizedGrossValue),
        meta: state.lang === "it"
          ? `Calcolato sul listino ivato per ${Math.round(snapshot.pricedAvailableSqm)} mq disponibili${snapshot.unpricedAvailableSqm > 0 ? ` · ${Math.round(snapshot.unpricedAvailableSqm)} mq senza prezzo configurato` : ""}`
          : `Calculated on gross price list for ${Math.round(snapshot.pricedAvailableSqm)} available sqm${snapshot.unpricedAvailableSqm > 0 ? ` · ${Math.round(snapshot.unpricedAvailableSqm)} sqm still missing a price` : ""}`,
      },
      {
        label: state.lang === "it" ? "Materiali accessori" : "Accessory stock",
        value: `${Math.round(snapshot.totalMaterialUnits)} u`,
        meta: state.lang === "it" ? "Unità caricate a magazzino tra colla, banda, telo e accessori." : "Units loaded in stock across glue, tape, membrane and accessories.",
      },
      {
        label: state.lang === "it" ? "Prodotti scoperti" : "Uncovered products",
        value: String(snapshot.uncovered),
        meta: state.lang === "it" ? "Referenze dove il fabbisogno supera la disponibilità reale." : "References where demand exceeds current availability.",
      },
    ].map((item) => `
      <article class="accounting-analysis-card ${item.accent ? "accent" : ""}">
        <span class="panel-eyebrow">${item.label}</span>
        <strong>${item.value}</strong>
        <p>${item.meta}</p>
      </article>
    `).join("");
  }
}

function accountingOpenOrdersLabel() {
  const count = state.orders.filter((order) => getOpenBalance(order) > 0 || (order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued)).length;
  return `${count} ${state.lang === "it" ? "ordini" : "orders"}`;
}

function buildActivityFeed() {
  const items = [];
  const sorted = [...state.orders].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 8);
  for (const order of sorted) {
    const ops = order.operations || {};
    const name = composeClientName(order);
    const num = getOrderNumber(order);
    const time = formatDate(order.updatedAt || order.createdAt);
    const type = getOrderType(order);
    if (ops.installation?.status === "completata") {
      items.push({ actor: state.lang === "it" ? "Posa" : "Installation", text: `ha completato la posa ${num} (${name}, ${Math.round(toNumber(ops.sqm || 0))} mq)`, time, color: "green" });
    } else if (ops.warehouse?.status === "pronto") {
      items.push({ actor: state.lang === "it" ? "Magazzino" : "Warehouse", text: `ha preparato l'ordine ${num} (${name}, ${ops.product || "—"})`, time, color: "blue" });
    } else if (order.source === "shopify-live") {
      items.push({ actor: "Shopify", text: `— ${state.lang === "it" ? "ordine" : "order"} ${num} ${state.lang === "it" ? "da" : "from"} ${name} (${ops.product || "—"}, ${Math.round(toNumber(ops.sqm || 0))} mq)`, time, color: "amber" });
    } else {
      items.push({ actor: name, text: `· ${num} · ${type.label}`, time, color: "slate" });
    }
  }
  return items.slice(0, 6);
}

function buildWarehouseAlerts() {
  const alerts = [];
  const inventoryMap = {};
  if (state.inventory) {
    for (const [key, data] of Object.entries(state.inventory)) {
      if (data && data.pieces) {
        const totalMq = data.pieces.reduce((sum, p) => sum + toNumber(p.sqm || (toNumber(p.width) * toNumber(p.length)) || 0), 0);
        inventoryMap[key] = totalMq;
      }
    }
  }
  const demandMap = {};
  for (const order of state.orders) {
    const product = normalizeProductName(order.operations?.product);
    if (product) {
      const sqm = toNumber(order.operations?.sqm || 0);
      const isOpen = !order.operations?.warehouse?.shipped && order.operations?.warehouse?.status !== "pronto";
      if (isOpen && sqm > 0) {
        demandMap[product] = (demandMap[product] || 0) + sqm;
      }
    }
  }
  for (const [product, demand] of Object.entries(demandMap)) {
    const available = inventoryMap[product] || 0;
    if (available < demand) {
      const catalogEntry = INVENTORY_CATALOG.find(c => c.key === product || c.label.toLowerCase() === product);
      const label = catalogEntry ? catalogEntry.label : product;
      const deficit = Math.round(demand - available);
      if (available === 0) {
        alerts.push({
          title: `${label} — nessuna giacenza`,
          detail: `Fabbisogno: ${Math.round(demand)} mq · 0 pezzi caricati`,
          severity: "red"
        });
      } else {
        alerts.push({
          title: `${label} sotto scorta`,
          detail: `Disponibili: ${Math.round(available)} mq · Fabbisogno: ${Math.round(demand)} mq · Mancano ${deficit} mq`,
          severity: "amber"
        });
      }
    }
  }
  return alerts;
}

function renderOrderStepper(order) {
  const warehouseDone = isRoutedToWarehouse(order);
  const installNeeded = order.operations?.installation?.required;
  const installDone = installNeeded
    ? ["completata", "in-corso"].includes(String(order.operations?.installation?.status || "").trim()) || Boolean(order.operations?.installation?.installDate)
    : isLogisticsOrderCompleted(order);
  const closed = isOrderClosed(order);
  return `
    <div class="stepper">
      <div class="stepper-step done"><div class="stepper-dot">1</div>${state.lang === "it" ? "Ordine" : "Order"}</div>
      <div class="stepper-line ${warehouseDone ? "done" : ""}"></div>
      <div class="stepper-step ${warehouseDone ? "current" : ""} ${warehouseDone ? "done" : ""}"><div class="stepper-dot">2</div>${state.lang === "it" ? "Magazzino" : "Warehouse"}</div>
      <div class="stepper-line ${installDone ? "done" : ""}"></div>
      <div class="stepper-step ${installDone ? "current" : ""} ${installDone ? "done" : ""}"><div class="stepper-dot">3</div>${state.lang === "it" ? "Posa" : "Install"}</div>
      <div class="stepper-line ${closed ? "done" : ""}"></div>
      <div class="stepper-step ${closed ? "done current" : ""}"><div class="stepper-dot">4</div>${state.lang === "it" ? "Chiuso" : "Closed"}</div>
    </div>
  `;
}

function renderOrderRow(order, view = "orders") {
  const selected = order.id === state.selectedOrderId ? "selected" : "";
  const orderType = getOrderType(order);
  const stage = getUnifiedOrderStage(order);
  const nextAction = getNextOrderAction(order);
  const stageChipTone = stage.tone === "green"
    ? "badge-success"
    : stage.tone === "red"
      ? "badge-urgent"
      : stage.tone === "blue"
        ? "badge-info"
        : "badge-warning";
  return `
    <article class="order-row inbox-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="${view}">
      <div class="inbox-row-main">
        <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
        <div class="order-meta">${order.operations?.product || undefinedText()} &middot; ${Math.round(toNumber(order.operations?.sqm || 0))} mq &middot; ${composeAddress(order) || addressIncompleteText()}</div>
        <div class="inbox-row-next-step">
          <span class="panel-eyebrow">${state.lang === "it" ? "Prossimo passo" : "Next step"}</span>
          <strong>${nextAction}</strong>
        </div>
      </div>
      <div class="order-type-badge ${orderType.tone === "status-amber" ? "type-posa" : orderType.tone === "status-blue" ? "type-spedizione" : "type-ritiro"}">${orderType.label}</div>
      <div class="order-amount">${formatCurrency(order.total)}</div>
      <div class="action-badge ${stageChipTone}">${stage.label}</div>
    </article>
  `;
}

function renderOrderCard(order) {
  const [label, tone] = buildOrderTone(order);
  const type = getOrderType(order);
  const selected = order.id === state.selectedOrderId ? "is-selected" : "";
  return `
    <article class="order-card ${selected}" draggable="true" data-order-draggable="true" data-action="select-order" data-id="${order.id}" data-view="orders">
      <div class="order-card-head">
        <div>
          <strong>${composeClientName(order)} · ${getOrderNumber(order)}</strong>
          <div class="order-card-meta">${composeAddress(order) || addressIncompleteText()} · ${order.operations?.sqm || 0} mq · ${order.operations?.product || undefinedText()}</div>
        </div>
        ${statusChip(label, tone)}
      </div>
      <div class="order-card-badges">
        ${statusChip(type.label, type.tone.replace("status-", ""))}
        ${renderProgressDots(order)}
      </div>
      <div class="order-card-meta">
        ${getPaymentLabel(order.financialStatus)} · ${getFulfillmentLabel(order.fulfillmentStatus)} · ${order.source}
      </div>
      <div class="order-card-actions">
        <button class="mini-action primary-mini" data-action="select-order" data-id="${order.id}" data-view="orders">${state.lang === "it" ? "Apri ordine" : "Open order"}</button>
        <button class="mini-action" data-action="open-modal" data-id="${order.id}">${t("edit")}</button>
      </div>
    </article>
  `;
}

function getInstallationStatusLabel(status = "", hasInstallDate = false) {
  const normalized = String(status || "").trim();
  if (normalized === "programmata") return t("scheduled");
  if (normalized === "in-corso") return t("inProgress");
  if (normalized === "completata") return t("completed");
  if (normalized === "problema") return t("issue");
  if (normalized === "da-pianificare" && hasInstallDate) return t("scheduled");
  return t("toPlan");
}

function getLatestIsoDateLabel(items = [], fieldName = "createdAt", emptyLabel = "—") {
  const latest = items.reduce((current, item) => {
    const candidate = String(item?.[fieldName] || "").trim();
    return candidate && (!current || candidate > current) ? candidate : current;
  }, "");
  return latest ? formatDate(latest) : emptyLabel;
}

function renderOrderJobHub(order) {
  const install = order.operations?.installation || {};
  const attachments = Array.isArray(order.attachments) ? order.attachments : [];
  const prepItems = getWarehousePrepItems(order);
  const prepIncludedCount = prepItems.filter((item) => item.included !== false).length;
  const travelExpenses = getTravelExpensesForOrder(order);
  const travelTotal = travelExpenses.reduce((sum, expense) => sum + toNumber(expense.amount || 0), 0);
  const openBalance = getOpenBalance(order);
  const collectedAmount = getCollectedAmount(order);
  const hasInstallFlow = Boolean(install.required || isRoutedToInstallation(order) || travelExpenses.length);
  const installDateLabel = install.installDate
    ? `${formatDate(install.installDate)}${install.installTime ? ` · ${escapeHtml(install.installTime)}` : ""}`
    : (state.lang === "it" ? "Data da definire" : "Date to define");
  const installValue = hasInstallFlow
    ? escapeHtml(String(install.crew || "").trim() || (state.lang === "it" ? "Squadra da assegnare" : "Crew to assign"))
    : (state.lang === "it" ? "Non richiesta" : "Not required");
  const installMeta = hasInstallFlow
    ? [
        getInstallationStatusLabel(install.status, Boolean(install.installDate)),
        installDateLabel,
        travelExpenses.length
          ? `${travelExpenses.length} ${state.lang === "it" ? "spese" : "expenses"} · ${formatCurrency(travelTotal)}`
          : (state.lang === "it" ? "Nessuna spesa squadra registrata" : "No crew expenses recorded"),
      ].join(" · ")
    : (state.lang === "it" ? "Solo flusso logistico, nessuna uscita squadra pianificata." : "Logistics only, no crew dispatch planned.");
  const invoiceState = order.accounting?.invoiceRequired
    ? (order.accounting?.invoiceIssued
      ? (state.lang === "it" ? "Fattura emessa" : "Invoice issued")
      : (state.lang === "it" ? "Fattura da emettere" : "Invoice to issue"))
    : (state.lang === "it" ? "Fattura non richiesta" : "Invoice not required");
  const noteCount = [
    order.note,
    order.operations?.officeNote,
    install.reportNote,
    order.accounting?.accountingNote,
  ].filter((item) => String(item || "").trim()).length;
  const latestAttachmentLabel = getLatestIsoDateLabel(
    attachments,
    "createdAt",
    state.lang === "it" ? "Nessun file caricato" : "No file uploaded",
  );
  const savedProfitSplit = getStoredProfitSplitForOrder(order);
  const profitSplitScenario = savedProfitSplit ? computeProfitSplitScenario(savedProfitSplit) : null;
  const quickLinks = [];
  const allowedViews = new Set(getAllowedViewsForRole());
  if (allowedViews.has("warehouse")) {
    quickLinks.push({
      view: "warehouse",
      label: state.lang === "it" ? "Apri Magazzino" : "Open Warehouse",
    });
  }
  if (allowedViews.has("shipping") && isRoutedToWarehouse(order)) {
    quickLinks.push({
      view: "shipping",
      label: state.lang === "it" ? "Apri Spedizioni" : "Open Shipping",
    });
  }
  if (allowedViews.has("installations") && hasInstallFlow) {
    quickLinks.push({
      view: "installations",
      label: state.lang === "it" ? "Apri Pose" : "Open Installations",
    });
  }
  if (allowedViews.has("accounting")) {
    quickLinks.push({
      view: "accounting",
      label: state.lang === "it" ? "Apri Contabilità" : "Open Accounting",
    });
  }
  if (allowedViews.has("profit-split")) {
    quickLinks.push({
      view: "profit-split",
      label: state.lang === "it" ? "Apri Conti posa" : "Open Profit Split",
      action: "open-profit-split-order",
    });
  }
  return `
    <div class="info-card order-job-hub-note">
      <strong>${state.lang === "it" ? "Commessa unificata: primo step" : "Unified job: first step"}</strong>
      <p>${state.lang === "it"
        ? "Qui l'ordine legge insieme i dati gia salvati in ufficio, logistica, posa, contabilita e allegati. I moduli restano dove sono: cambia la visibilita, non il flusso operativo."
        : "Here the order reads together data already saved in office, logistics, installations, accounting and attachments. Modules stay where they are: visibility changes, not the workflow."}</p>
      <div class="order-job-hub-pill-row" aria-label="${state.lang === "it" ? "Aree collegate alla commessa" : "Areas connected to the job"}">
        <span class="order-job-hub-pill">${state.lang === "it" ? "Ufficio" : "Office"}</span>
        <span class="order-job-hub-pill">${state.lang === "it" ? "Magazzino" : "Warehouse"}</span>
        <span class="order-job-hub-pill">${state.lang === "it" ? "Posa" : "Installations"}</span>
        <span class="order-job-hub-pill">${state.lang === "it" ? "Contabilita" : "Accounting"}</span>
        <span class="order-job-hub-pill">${state.lang === "it" ? "Documenti" : "Documents"}</span>
      </div>
    </div>
    <div class="detail-grid detail-grid-tight order-job-hub-grid">
      ${renderDetailBox({
        label: state.lang === "it" ? "Stato commessa" : "Job status",
        value: getUnifiedOrderStage(order).label,
        meta: getNextOrderAction(order),
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Posa e squadra" : "Installation and crew",
        value: installValue,
        meta: installMeta,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Logistica" : "Logistics",
        value: getShipmentStateLabel(order),
        meta: [
          getShippingModeLabel(order),
          `${prepIncludedCount}/${prepItems.length} ${state.lang === "it" ? "righe pronte" : "prep lines"}`,
          getShippingTargetLabel(order),
        ].join(" · "),
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Economico" : "Accounting",
        value: openBalance > 0 ? formatCurrency(openBalance) : t("accountingOk"),
        meta: `${state.lang === "it" ? "Incassato" : "Collected"} ${formatCurrency(collectedAmount)} · ${invoiceState}`,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Documenti e note" : "Documents and notes",
        value: `${attachments.length} ${state.lang === "it" ? "allegati" : "attachments"}`,
        meta: `${noteCount} ${state.lang === "it" ? "note attive" : "active notes"} · ${latestAttachmentLabel}`,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Conti posa" : "Profit split",
        value: savedProfitSplit
          ? (savedProfitSplit.partnerName || (state.lang === "it" ? "Conto collegato" : "Linked split"))
          : (state.lang === "it" ? "Da collegare" : "To link"),
        meta: savedProfitSplit
          ? `${formatCurrency(profitSplitScenario?.revenue || 0)} · ${state.lang === "it" ? "saldo collaboratore" : "partner due"} ${formatCurrency(profitSplitScenario?.partnerDue || 0)}`
          : (state.lang === "it" ? "Apri Conti posa da questa commessa per salvare un riparto condiviso." : "Open Profit Split from this job to save a shared settlement."),
      })}
    </div>
    ${quickLinks.length ? `
      <div class="detail-actions order-job-hub-actions">
        ${quickLinks.map((item) => `
          <button class="btn" data-action="${escapeHtml(item.action || "select-order")}" data-id="${escapeHtml(order.id)}" data-view="${escapeHtml(item.view)}">${escapeHtml(item.label)}</button>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function openDashboardViewTarget(target) {
  const dataset = target?.dataset || {};
  const nextView = dataset.view || "orders";
  if (nextView === "orders") {
    state.filters.order = dataset.dashboardOrderFilter || dataset.orderFilter || "all";
    state.search.orders = "";
    state.orderPage = 1;
  }
  if (nextView === "warehouse") {
    state.filters.warehouse = dataset.dashboardWarehouseFilter || dataset.warehouseFilter || "all";
    state.search.warehouse = "";
  }
  if (nextView === "installations") {
    state.filters.installation = dataset.dashboardInstallationFilter || dataset.installationFilter || "all";
    if (state.filters.installation === "all") {
      state.selectedInstallationCrew = "";
    }
  }
  if (nextView === "accounting") {
    state.filters.accounting = dataset.dashboardAccountingFilter || dataset.accountingFilter || "all";
    state.search.accounting = "";
  }
  if (nextView === "shipping") {
    state.filters.shipping = dataset.dashboardShippingFilter || dataset.shippingFilter || "all";
    state.search.shipping = "";
  }
  setView(nextView);
}

function renderOrders() {
  const orders = filterOrdersForView("order");
  const { pageItems, totalPages, totalItems } = paginateOrders(orders);
  const ordersGrid = ui.ordersList?.closest(".order-grid");
  if (ordersGrid) ordersGrid.classList.toggle("is-empty", orders.length === 0);
  updateOrderImportPanel();
  ui.ordersList.innerHTML = pageItems.length ? pageItems.map((order) => renderOrderRow(order, "orders")).join("") : `<div class="info-card">${t("noOrdersAvailable")}</div>`;
  if (ui.ordersPagination) {
    ui.ordersPagination.innerHTML = totalItems > getOrdersPageSize()
      ? `
        <div class="list-pagination-copy">${state.lang === "it" ? `Pagina ${state.orderPage} di ${totalPages} · ${totalItems} ordini` : `Page ${state.orderPage} of ${totalPages} · ${totalItems} orders`}</div>
        <div class="list-pagination-actions">
          <button class="btn" data-action="orders-prev-page" ${state.orderPage <= 1 ? "disabled" : ""}>${state.lang === "it" ? "Prec." : "Prev"}</button>
          <button class="btn" data-action="orders-next-page" ${state.orderPage >= totalPages ? "disabled" : ""}>${state.lang === "it" ? "Succ." : "Next"}</button>
        </div>
      `
      : "";
  }
  let order = orders.find((item) => item.id === state.selectedOrderId) || pageItems[0] || orders[0] || null;
  if (order && !pageItems.some((item) => item.id === order.id) && pageItems.length) {
    order = pageItems[0];
  }
  if (state.currentView === "orders" && order && order.id !== state.selectedOrderId) state.selectedOrderId = order.id;
  if (!order) {
    ui.orderDetailTitle.textContent = t("noSelection");
    ui.orderDetailBadge.innerHTML = "";
    ui.orderDetailSummary.innerHTML = `<div class="info-card"><strong>${state.lang === "it" ? "Nessun ordine nel filtro corrente" : "No orders in the current filter"}</strong><p>${state.lang === "it" ? "Rimuovi il filtro o cambia ricerca per tornare alla lista operativa." : "Clear the filter or change the search to restore the operational list."}</p></div>`;
    if (ui.orderJobHub) ui.orderJobHub.innerHTML = "";
    ui.orderOfficeSummary.innerHTML = "";
    ui.orderLineList.innerHTML = "";
    if (ui.orderPrepList) ui.orderPrepList.innerHTML = "";
    ui.orderAttachments.innerHTML = "";
    ui.orderDetailSections.forEach((section) => section.classList.add("hidden"));
    return;
  }
  ui.orderDetailSections.forEach((section) => section.classList.remove("hidden"));

  const [label, tone] = buildOrderTone(order);
  const orderType = getOrderType(order);
  const nextAction = getNextOrderAction(order);
  const stage = getUnifiedOrderStage(order);
  const prepItems = getWarehousePrepItems(order);
  const routeLabel = getInboxRouteLabel(order);
  const visibilityLabel = getInboxVisibilityLabel(order);
  const shippingModeLabel = getShippingModeLabel(order);
  const prepSummary = prepItems.length
    ? prepItems
      .filter((item) => item.included !== false)
      .slice(0, 3)
      .map((item) => `${item.title} x${item.quantity}`)
      .join(" · ")
    : (state.lang === "it" ? "Nessuna riga selezionata" : "No prep lines selected");
  const paymentSummary = getOpenBalance(order) > 0
    ? (state.lang === "it" ? `Residuo ${formatCurrency(getOpenBalance(order))}` : `Open balance ${formatCurrency(getOpenBalance(order))}`)
    : (state.lang === "it" ? "Saldo operativo allineato" : "Balance aligned");
  ui.orderDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  ui.orderDetailBadge.innerHTML = statusChip(label, tone);
  ui.orderDetailSummary.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title">${composeClientName(order)}</div>
        <div class="detail-id">${getOrderNumber(order)} &middot; ${order.source} &middot; ${formatDate(order.createdAt)}</div>
      </div>
      ${statusChip(getPaymentLabel(order.financialStatus), tone)}
    </div>
    ${renderOrderStepper(order)}
    <div class="detail-grid detail-grid-tight order-summary-grid">
      ${renderDetailBox({
        label: state.lang === "it" ? "Situazione ordine" : "Order status",
        value: stage.label,
        meta: nextAction,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Cliente e cantiere" : "Customer and site",
        value: composeAddress(order) || addressIncompleteText(),
        meta: order.phone || order.email || (state.lang === "it" ? "Contatti da verificare" : "Contacts to verify"),
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Materiale e percorso" : "Materials and route",
        value: `${order.operations?.product || t("undefined")} · ${order.operations?.sqm || 0} mq`,
        meta: `${routeLabel} · ${shippingModeLabel}`,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Pagamento" : "Payment",
        value: formatCurrency(order.total),
        meta: `${paymentSummary} · ${state.lang === "it" ? "Shopify incassato" : "Shopify paid"} ${formatCurrency(getShopifyPaidAmount(order))}`,
      })}
    </div>
    <div class="detail-actions detail-actions-primary">
      ${composeAddress(order) ? `<button class="btn" data-action="open-maps" data-id="${order.id}">${state.lang === "it" ? "Apri Maps" : "Open Maps"}</button>` : ""}
      ${order.phone ? `<button class="btn" data-action="call-client" data-id="${order.id}">${state.lang === "it" ? "Chiama cliente" : "Call customer"}</button>` : ""}
    </div>
  `;
  if (ui.orderJobHub) ui.orderJobHub.innerHTML = renderOrderJobHub(order);
  const orderNoteMarkup = order.note
    ? `<div class="detail-note-chip">${escapeHtml(order.note)}</div>`
    : "";
  ui.orderOfficeSummary.innerHTML = `
    ${renderInboxFlowControls(order)}
    <div class="detail-grid detail-grid-tight order-office-grid">
      ${renderDetailBox({
        label: state.lang === "it" ? "Decisione ufficio" : "Office decision",
        value: visibilityLabel,
        meta: `${routeLabel} · ${order.operations?.installation?.required ? t("supplyInstall") : t("supply")}`,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Preparazione reale" : "Actual preparation",
        value: getShippingTargetLabel(order),
        meta: prepSummary,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Presidio amministrativo" : "Administrative follow-up",
        value: getEffectivePaymentMethod(order),
        meta: `${(order.attachments || []).length} ${state.lang === "it" ? "allegati" : "attachments"} · ${paymentSummary}`,
      })}
    </div>
    ${orderNoteMarkup}
  `;
  ui.orderLineList.innerHTML = (order.lineDetails || []).length
    ? order.lineDetails.map((item) => {
      const dims = extractDimensions(item.title);
      const lineType = inferCatalogEntry(item.title)?.type || (isServiceLine(item.title) ? "service" : "other");
      const displayQty = getDisplayPieceCount(order, item);
      const formatMeasure = (value) => String(value ?? "").replace(".", ",");
      const meta = dims
        ? `${formatMeasure(dims.width)} x ${formatMeasure(dims.length)} · ${displayQty} ${state.lang === "it" ? "pz" : "pcs"}`
        : lineType === "service"
          ? (state.lang === "it" ? "Servizio / voce non fisica" : "Service / non-physical line")
          : (state.lang === "it" ? "Riga Shopify" : "Shopify line");
      return `<li><span><strong>${item.title}</strong><small class="line-item-meta">${meta}</small></span><strong>x${displayQty}</strong></li>`;
    }).join("")
    : `<li><span>${state.lang === "it" ? "Nessun articolo disponibile" : "No items available"}</span><strong>—</strong></li>`;
  if (ui.orderPrepList) {
    const prepItems = getWarehousePrepItems(order);
    ui.orderPrepList.innerHTML = prepItems.length
      ? prepItems.map((item, index) => `
        <article class="prep-item ${item.included === false ? "is-excluded" : ""}">
          <label class="prep-item-toggle">
            <input type="checkbox" data-prep-field="included" data-index="${index}" ${item.included === false ? "" : "checked"} />
          </label>
          <div class="prep-item-body">
            <div class="prep-item-head">
              <div>
                <strong>${item.title}</strong>
                <div class="prep-item-meta">${t("prepQty")}: ${item.quantity}</div>
              </div>
              ${statusChip(item.included === false ? t("excluded") : t("included"), item.included === false ? "slate" : "green")}
            </div>
            <label class="field field-full">
              <span>${t("warehouseNoteLabel")}</span>
              <textarea class="text-input prep-item-note" data-prep-field="note" data-index="${index}" rows="2" placeholder="${state.lang === "it" ? "Taglio, priorità, esclusioni, note bancale..." : "Cutting, priority, exclusions, pallet notes..."}">${item.note || ""}</textarea>
            </label>
          </div>
        </article>
      `).join("")
      : `<div class="info-card">${t("noPhysicalPrep")}</div>`;
  }
  ui.orderAttachments.innerHTML = renderAttachmentGrid(order.attachments || [], order.id);
}

function getFilteredSalesRequests() {
  const query = String(state.search.salesRequests || "").trim().toLowerCase();
  return [...state.salesRequests]
    .sort((left, right) => {
      const leftRow = Number(left.sourceRowNumber || 0);
      const rightRow = Number(right.sourceRowNumber || 0);
      const leftHasRow = leftRow > 0;
      const rightHasRow = rightRow > 0;
      if (leftHasRow && rightHasRow && leftRow !== rightRow) return rightRow - leftRow;
      if (leftHasRow !== rightHasRow) return leftHasRow ? -1 : 1;
      const rightCreated = new Date(right.createdAt || right.updatedAt || 0).getTime();
      const leftCreated = new Date(left.createdAt || left.updatedAt || 0).getTime();
      if (rightCreated !== leftCreated) return rightCreated - leftCreated;
      if (rightRow !== leftRow) return rightRow - leftRow;
      return String(right.id || "").localeCompare(String(left.id || ""));
    })
    .filter((item) => {
      if (!query) return true;
      const haystack = [
        getSalesRequestDisplayName(item),
        item.city,
        item.phone,
        item.email,
        item.requestedHeight,
        item.assignment,
        item.note,
        item.whatsappTemplate,
        item.whatsappUrl,
        getSalesRequestStatusLabel(item.status),
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
}

function getFilteredSalesContents({ ignoreCategory = false } = {}) {
  const query = String(state.search.salesContent || "").trim().toLowerCase();
  const categoryFilter = normalizeSalesContentCategoryFilter(state.salesContentCategory);
  return [...state.salesContents]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
    .filter((item) => {
      if (!ignoreCategory && categoryFilter !== "all") {
        const category = normalizeSalesContentCategoryFilter(item.category || "");
        if (category !== categoryFilter) return false;
      }
      if (!query) return true;
      const haystack = [
        item.title,
        item.category,
        item.description,
        item.link,
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
}

function renderSalesRequests() {
  const filtered = getFilteredSalesRequests();
  const { pageItems, totalPages, totalItems } = paginateSalesRequests(filtered);
  let selected = ensureSelectedSalesRequest();
  if (selected && !filtered.some((item) => item.id === selected.id) && filtered.length) {
    selected = filtered[0];
  }
  if (!selected && filtered.length) {
    selected = filtered[0];
  }
  if (selected && !pageItems.some((item) => item.id === selected.id) && pageItems.length) {
    selected = pageItems[0];
  }
  if ((selected?.id || "") !== state.selectedSalesRequestId) {
    state.selectedSalesRequestId = selected?.id || "";
  }
  updateSalesRequestImportPanel();
  updateSalesRequestSourcePanel();
  if (ui.salesRequestsList) {
    ui.salesRequestsList.innerHTML = pageItems.length
      ? pageItems.map((item) => {
        const automationBadge = getSalesRequestAutomationBadge(item);
        return `
          <article class="sales-request-card ${item.id === selected?.id ? "is-active" : ""}" data-action="select-sales-request" data-id="${item.id}" data-first-contact-state="${escapeHtml(normalizeSalesRequestFirstContactState(item.firstContactState || ""))}">
            <div class="sales-request-card-head">
              <div>
                <strong>${escapeHtml(getSalesRequestDisplayName(item))}</strong>
                <p>${escapeHtml(item.city || (state.lang === "it" ? "Città da definire" : "City pending"))}</p>
              </div>
              <div class="sales-request-card-head-badges">
                <span class="sales-status-pill">${escapeHtml(getSalesRequestStatusLabel(item.status))}</span>
                ${automationBadge
                  ? `<span class="sales-automation-pill ${automationBadge.tone === "queued" ? "is-queued" : "is-sent"}" title="${escapeHtml(automationBadge.title)}">${escapeHtml(automationBadge.label)}</span>`
                  : ""}
              </div>
            </div>
            <div class="sales-request-card-meta">
              <span>${escapeHtml(getSalesRequestServiceLabel(item.service))}</span>
              <span>${[
                item.sqm > 0 ? `${Number(item.sqm)} mq` : (state.lang === "it" ? "MQ da definire" : "SQM pending"),
                item.requestedHeight ? escapeHtml(item.requestedHeight) : "",
              ].filter(Boolean).join(" · ")}</span>
            </div>
            <div class="sales-request-card-foot">
              <span>${escapeHtml(item.assignment || (state.lang === "it" ? "non assegnato" : "Unassigned"))}</span>
              <span>${item.updatedAt ? formatDate(item.updatedAt) : "—"}</span>
            </div>
          </article>
        `;
      }).join("")
      : `<div class="info-card">${state.lang === "it" ? "Nessuna richiesta disponibile." : "No requests available."}</div>`;
  }
  if (ui.salesRequestsPagination) {
    const showPagination = totalItems > getSalesRequestsPageSize();
    ui.salesRequestsPagination.classList.toggle("hidden", !showPagination);
    ui.salesRequestsPagination.innerHTML = showPagination
      ? `
        <div class="list-pagination-copy">${state.lang === "it" ? `Pagina ${state.salesRequestPage} di ${totalPages} · ${totalItems} richieste` : `Page ${state.salesRequestPage} of ${totalPages} · ${totalItems} requests`}</div>
        <div class="list-pagination-actions">
          <button class="btn" data-action="sales-requests-prev-page" ${state.salesRequestPage <= 1 ? "disabled" : ""}>${state.lang === "it" ? "Prec." : "Prev"}</button>
          <button class="btn" data-action="sales-requests-next-page" ${state.salesRequestPage >= totalPages ? "disabled" : ""}>${state.lang === "it" ? "Succ." : "Next"}</button>
        </div>
      `
      : "";
  }
  if (!ui.salesRequestForm) return;
  ensureSalesRequestWhatsAppActionUi();
  ui.salesRequestForm.id.value = selected?.id || "";
  ui.salesRequestForm.name.value = selected?.name || "";
  ui.salesRequestForm.surname.value = selected?.surname || "";
  ui.salesRequestForm.city.value = selected?.city || "";
  ui.salesRequestForm.phone.value = selected?.phone || "";
  ui.salesRequestForm.email.value = selected?.email || "";
  ui.salesRequestForm.sqm.value = selected?.sqm ? String(selected.sqm).replace(".", ",") : "";
  ui.salesRequestForm.requestedHeight.value = selected?.requestedHeight || "";
  ui.salesRequestForm.service.value = selected?.service || "";
  ui.salesRequestForm.surface.value = selected?.surface || "";
  syncSalesRequestAssignmentField(selected?.assignment || "");
  syncSalesRequestStatusField(selected?.status || "");
  ui.salesRequestForm.note.value = selected?.note || "";
  if (ui.salesRequestForm.whatsappTemplate) {
    ui.salesRequestForm.whatsappTemplate.value = selected?.whatsappTemplate || "";
  }
  if (ui.salesRequestForm.whatsappUrl) {
    ui.salesRequestForm.whatsappUrl.value = selected?.whatsappUrl || "";
  }
  const salesRequestWhatsAppUrl = selected ? buildSalesRequestWhatsAppUrl(selected) : "";
  const queuedDueForCurrentOperator = Boolean(
    selected
    && normalizeSalesRequestFirstContactState(selected.firstContactState || "") === "queued"
    && isSalesRequestFirstContactDue(selected)
    && normalizeSalesRequestAssignment(selected.assignment || selected.firstContactBy || "")
      && normalizeSalesRequestAssignment(selected.assignment || selected.firstContactBy || "") === getSalesRequestOperatorFromCurrentUser(),
  );
  if (ui.salesRequestWhatsAppButton) {
    ui.salesRequestWhatsAppButton.href = salesRequestWhatsAppUrl || "#";
    ui.salesRequestWhatsAppButton.classList.toggle("hidden", !salesRequestWhatsAppUrl);
    ui.salesRequestWhatsAppButton.setAttribute("aria-disabled", salesRequestWhatsAppUrl ? "false" : "true");
    ui.salesRequestWhatsAppButton.dataset.action = "open-sales-request-whatsapp";
    ui.salesRequestWhatsAppButton.dataset.id = selected?.id || "";
    ui.salesRequestWhatsAppButton.textContent = queuedDueForCurrentOperator
      ? (state.lang === "it" ? "Invia primo contatto (in coda)" : "Send queued first contact")
      : (state.lang === "it" ? "Primo contatto WhatsApp" : "First WhatsApp contact");
  }
  if (ui.salesRequestWhatsAppHint) {
    ui.salesRequestWhatsAppHint.textContent = selected
      ? getSalesRequestFirstContactHint(selected)
      : (state.lang === "it"
        ? "Usa lo stesso link rapido del foglio Google quando disponibile, altrimenti viene creato dal numero cliente."
        : "Uses the Google Sheet quick link when available, otherwise it is built from the client phone number.");
  }
  if (ui.salesRequestDetailTitle) {
    ui.salesRequestDetailTitle.textContent = selected
      ? getSalesRequestDisplayName(selected)
      : (state.lang === "it" ? "Nuova richiesta" : "New request");
  }
  if (ui.salesRequestDeleteButton) ui.salesRequestDeleteButton.disabled = !selected;
  if (ui.salesRequestUseGeneratorButton) ui.salesRequestUseGeneratorButton.disabled = !selected;
}

function renderSalesGeneratorPlannerMaterials(reference) {
  const sections = Array.isArray(reference?.sections) ? reference.sections.filter((section) => Array.isArray(section.items) && section.items.length) : [];
  if (!sections.length) return "";
  const showCosts = Boolean(reference?.showCosts);
  const sectionsHtml = sections.map((section) => `
    <div class="sales-generator-planner-material-section">
      <div class="sales-generator-planner-material-section-head">
        <span>${escapeHtml(section.title)}</span>
        ${showCosts && section.subtotal > 0 ? `<strong>${escapeHtml(formatCurrency(section.subtotal))}</strong>` : ""}
      </div>
      <div class="sales-generator-planner-material-list">
        ${section.items.map((item) => `
          <div class="sales-generator-planner-material-line">
            <span class="sales-generator-planner-material-name">${escapeHtml(item.name)}</span>
            <span class="sales-generator-planner-material-qty">${escapeHtml(item.qty || "—")}</span>
            ${showCosts ? `<strong class="sales-generator-planner-material-cost">${escapeHtml(item.cost > 0 ? formatCurrency(item.cost) : "—")}</strong>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
  return `
    <div class="sales-generator-planner-materials">
      <div class="sales-generator-planner-materials-head">
        <strong>${state.lang === "it" ? "Materiali calcolati dal planner" : "Planner-calculated materials"}</strong>
        ${showCosts && reference.totalCost > 0 ? `<span class="sales-status-pill">${escapeHtml(formatCurrency(reference.totalCost))}</span>` : ""}
      </div>
      <p class="sales-generator-planner-materials-copy">
        ${escapeHtml(state.lang === "it"
          ? `Riferimento interno importato dal Garden Planner${reference.region ? ` · listino ${reference.region}` : ""}.`
          : `Internal reference imported from the Garden Planner${reference.region ? ` · ${reference.region} pricing` : ""}.`)}
      </p>
      <div class="sales-generator-planner-materials-scroll">
        ${sectionsHtml}
      </div>
    </div>
  `;
}

function renderSalesGenerator() {
  const generatorOnlyMode = state.currentUser?.role === "crew";
  const selected = ensureSelectedSalesRequest();
  const plannerBridge = !generatorOnlyMode ? getGardenPlannerQuoteBridge() : null;
  const plannerMode = !generatorOnlyMode && state.salesGeneratorPlannerMode && Boolean(plannerBridge?.payload);
  const freeMode = !generatorOnlyMode && state.salesGeneratorFreeMode && !plannerMode;
  const plannerMaterialsHtml = plannerMode ? renderSalesGeneratorPlannerMaterials(plannerBridge?.materialsReference) : "";
  const contextEyebrow = document.getElementById("sales-generator-context-eyebrow");
  const contextTitle = document.getElementById("sales-generator-context-title");
  if (contextEyebrow) {
    contextEyebrow.textContent = plannerMode
      ? (state.lang === "it" ? "Planner collegato" : "Planner linked")
      : freeMode
        ? (state.lang === "it" ? "Preventivo libero" : "Free quote")
        : (state.lang === "it" ? "Prefill attivo" : "Active prefill");
  }
  if (contextTitle) {
    contextTitle.textContent = plannerMode
      ? "Garden Planner"
      : freeMode
        ? (state.lang === "it" ? "Generatore manuale" : "Manual generator")
        : (state.lang === "it" ? "Richiesta collegata" : "Linked request");
  }
  if (ui.salesGeneratorRequestCard) {
    ui.salesGeneratorRequestCard.innerHTML = generatorOnlyMode
      ? (state.lang === "it"
          ? "Preventivatore attivo per la squadra. Le richieste commerciali restano riservate all'ufficio."
          : "Crew quote mode is active. Sales requests remain visible only to the office.")
      : plannerMode && plannerBridge
      ? `
          <div class="sales-generator-card-head">
            <strong>${state.lang === "it" ? "Dati importati dal Garden Planner" : "Imported from Garden Planner"}</strong>
            <span class="sales-status-pill">${escapeHtml(plannerBridge.sqmLabel || (state.lang === "it" ? "Preventivo pronto" : "Quote ready"))}</span>
          </div>
          <div class="sales-generator-card-grid">
            <span>${escapeHtml(plannerBridge.client || (state.lang === "it" ? "Cliente da definire" : "Customer pending"))}</span>
            <span>${escapeHtml(plannerBridge.city || plannerBridge.address || (state.lang === "it" ? "Cantiere da definire" : "Site pending"))}</span>
            <span>${escapeHtml(plannerBridge.serviceLabel || (state.lang === "it" ? "Fornitura + posa" : "Supply + installation"))}</span>
            <span>${escapeHtml(plannerBridge.surfaceLabel || (state.lang === "it" ? "Fondo da definire" : "Surface pending"))}</span>
          </div>
          <p class="sales-generator-request-note" title="${escapeHtml(plannerBridge.note || plannerBridge.materialHighlights.join(" · ") || "")}">
            ${escapeHtml(plannerBridge.note || plannerBridge.materialHighlights.join(" · ") || (state.lang === "it" ? "Riepilogo materiali pronto. Il report cliente viene allegato al PDF e qui sotto trovi il riferimento interno dei costi planner." : "Materials summary is ready. The client report is attached to the quote PDF and the internal planner cost reference is shown below."))}
          </p>
          ${plannerMaterialsHtml}
          <div class="sales-generator-card-foot">
            <button class="ghost-button small-button" type="button" data-action="use-planner-prefill">${state.lang === "it" ? "Aggiorna dati planner" : "Refresh planner data"}</button>
            ${plannerBridge.reportHtml.technical ? `<button class="ghost-button small-button" type="button" data-action="open-planner-report" data-variant="technical">${state.lang === "it" ? "Apri report" : "Open report"}</button>` : ""}
          </div>
        `
      : freeMode
      ? `
          <div class="sales-generator-card-head">
            <strong>${escapeHtml(t("salesGeneratorFreeModeTitle"))}</strong>
          </div>
          <p class="sales-generator-request-note">${escapeHtml(t("salesGeneratorFreeModeCopy"))}</p>
          ${selected
            ? `<p class="panel-note">${state.lang === "it" ? "Richiesta attualmente selezionata:" : "Currently selected request:"} <strong>${escapeHtml(getSalesRequestDisplayName(selected))}</strong></p>`
            : ""}
          ${plannerBridge
            ? `
              <div class="sales-generator-card-foot">
                <button class="ghost-button small-button" type="button" data-action="use-planner-prefill">${state.lang === "it" ? "Usa Garden Planner" : "Use Garden Planner"}</button>
                ${plannerBridge.reportHtml.technical ? `<button class="ghost-button small-button" type="button" data-action="open-planner-report" data-variant="technical">${state.lang === "it" ? "Apri report" : "Open report"}</button>` : ""}
              </div>
            `
            : ""}
        `
      : selected
      ? `
          <div class="sales-generator-card-head">
            <strong>${escapeHtml(getSalesRequestDisplayName(selected))}</strong>
            <span class="sales-status-pill">${escapeHtml(getSalesRequestStatusLabel(selected.status))}</span>
          </div>
          <div class="sales-generator-card-grid">
            <span>${escapeHtml(selected.city || (state.lang === "it" ? "Città da definire" : "City pending"))}</span>
            <span>${selected.sqm > 0 ? `${Number(selected.sqm)} mq` : (state.lang === "it" ? "MQ da definire" : "SQM pending")}</span>
            <span>${escapeHtml(getSalesRequestHeightLabel(selected.requestedHeight))}</span>
            <span>${escapeHtml(getSalesRequestServiceLabel(selected.service))}</span>
            <span>${escapeHtml(getSalesRequestSurfaceLabel(selected.surface))}</span>
          </div>
          <p class="sales-generator-request-note" title="${escapeHtml(selected.note || "")}">${escapeHtml(selected.note || (state.lang === "it" ? "Nessuna nota commerciale." : "No sales note."))}</p>
          ${plannerBridge
            ? `
              <div class="sales-generator-card-foot">
                <button class="ghost-button small-button" type="button" data-action="use-planner-prefill">${state.lang === "it" ? "Usa Garden Planner" : "Use Garden Planner"}</button>
                ${plannerBridge.reportHtml.technical ? `<button class="ghost-button small-button" type="button" data-action="open-planner-report" data-variant="technical">${state.lang === "it" ? "Apri report" : "Open report"}</button>` : ""}
              </div>
            `
            : ""}
        `
      : plannerBridge
      ? `
          <p class="sales-generator-request-note">${state.lang === "it"
            ? "Seleziona una richiesta oppure carica il riepilogo del Garden Planner per partire dai materiali già calcolati."
            : "Select a request or load the Garden Planner summary to start from the calculated materials."}</p>
          <div class="sales-generator-card-foot">
            <button class="ghost-button small-button" type="button" data-action="use-planner-prefill">${state.lang === "it" ? "Usa Garden Planner" : "Use Garden Planner"}</button>
            ${plannerBridge.reportHtml.technical ? `<button class="ghost-button small-button" type="button" data-action="open-planner-report" data-variant="technical">${state.lang === "it" ? "Apri report" : "Open report"}</button>` : ""}
          </div>
        `
      : (state.lang === "it"
          ? "Seleziona una richiesta per precompilare automaticamente il generatore."
          : "Select a request to prefill the generator.");
  }
  if (ui.salesGeneratorOpenRequestButton) ui.salesGeneratorOpenRequestButton.disabled = generatorOnlyMode || !selected;
  if (ui.salesGeneratorPrefillButton) ui.salesGeneratorPrefillButton.disabled = generatorOnlyMode || !selected || freeMode;
  if (ui.salesGeneratorFreeQuoteButton) {
    ui.salesGeneratorFreeQuoteButton.hidden = generatorOnlyMode;
    ui.salesGeneratorFreeQuoteButton.classList.toggle("hidden", generatorOnlyMode);
    ui.salesGeneratorFreeQuoteButton.disabled = freeMode && !selected;
    ui.salesGeneratorFreeQuoteButton.textContent = plannerMode
      ? (selected ? t("salesGeneratorUseSelectedRequest") : t("salesGeneratorFreeModeTitle"))
      : freeMode
      ? t("salesGeneratorUseSelectedRequest")
      : t("salesGeneratorFreeQuote");
    ui.salesGeneratorFreeQuoteButton.classList.toggle("primary-button", !(freeMode || plannerMode));
    ui.salesGeneratorFreeQuoteButton.classList.toggle("ghost-button", freeMode || plannerMode);
  }
  if (ui.salesGeneratorContactPanel) {
    const canShowContacts = !generatorOnlyMode && Boolean(selected);
    const whatsappUrl = canShowContacts ? buildSalesRequestWhatsAppUrl(selected) : "";
    const emailUrl = canShowContacts ? buildSalesRequestMailtoUrl(selected) : "";
    ui.salesGeneratorContactPanel.hidden = !canShowContacts;
    ui.salesGeneratorContactPanel.classList.toggle("hidden", !canShowContacts);
    if (ui.salesGeneratorContactSummary) {
      const whatsappPreview = String(selected?.whatsappTemplate || "").trim();
      ui.salesGeneratorContactSummary.textContent = canShowContacts
        ? `${getSalesRequestDisplayName(selected)} · ${selected.phone || "—"} · ${selected.email || "—"}${whatsappPreview ? `\n${whatsappPreview}` : ""}`
        : "";
    }
    if (ui.salesGeneratorWhatsAppButton) {
      ui.salesGeneratorWhatsAppButton.href = whatsappUrl || "#";
      ui.salesGeneratorWhatsAppButton.classList.toggle("hidden", !whatsappUrl);
      ui.salesGeneratorWhatsAppButton.setAttribute("aria-disabled", whatsappUrl ? "false" : "true");
    }
    if (ui.salesGeneratorEmailButton) {
      ui.salesGeneratorEmailButton.href = emailUrl || "#";
      ui.salesGeneratorEmailButton.classList.toggle("hidden", !emailUrl);
      ui.salesGeneratorEmailButton.setAttribute("aria-disabled", emailUrl ? "false" : "true");
    }
  }
  if (state.currentView === "sales-generator") {
    applySalesGeneratorFrameHeight(SALES_GENERATOR_FRAME_DEFAULT_HEIGHT);
  }
  if (state.currentView === "sales-generator") {
    window.setTimeout(() => pushSalesGeneratorBranding(false), 20);
  }
  if (state.currentView === "sales-generator" && plannerMode) {
    window.setTimeout(() => pushPlannerPrefillToGenerator(false), 40);
  }
  if (state.currentView === "sales-generator" && selected && !generatorOnlyMode && !freeMode && !plannerMode) {
    window.setTimeout(() => pushSalesRequestToGenerator(false), 40);
  }
}

function renderSalesContentAttachments(items = [], contentId = "") {
  if (!items.length) {
    return `<div class="info-card">${state.lang === "it" ? "Nessun allegato caricato." : "No attachments uploaded."}</div>`;
  }
  return items.map((item, index) => {
    const pendingKey = getSalesContentAttachmentPendingKey(contentId, item.id || "", Number(item._attachmentIndex ?? index));
    const isDeleting = salesContentAttachmentDeleteInFlight.has(pendingKey);
    return `
    <article class="attachment-item${isDeleting ? " is-pending" : ""}">
      <button
        class="attachment-remove"
        type="button"
        data-action="remove-sales-content-attachment"
        data-id="${contentId}"
        data-index="${Number(item._attachmentIndex ?? index)}"
        data-attachment-id="${escapeHtml(item.id || "")}"
        aria-label="${state.lang === "it" ? "Rimuovi allegato" : "Remove attachment"}"
        ${isDeleting ? "disabled" : ""}
      >${isDeleting ? "…" : "×"}</button>
      ${isImageAttachment(item) && (item.url || item.dataUrl)
        ? `<img src="${escapeHtml(item.url || item.dataUrl)}" alt="${escapeHtml(item.name || "Attachment")}" loading="lazy" decoding="async" fetchpriority="low" />`
        : `<div class="attachment-file-badge">${escapeHtml(String(item.type || "file").split("/").pop()?.toUpperCase() || "FILE")}</div>`}
      <strong>${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.name || "Attachment")}</a>` : escapeHtml(item.name || "Attachment")}</strong>
      <div class="attachment-copy">${escapeHtml(getAttachmentContextLabel("sales-content"))}</div>
      <div>${item.createdAt ? formatDate(item.createdAt) : "—"}</div>
    </article>
  `;
  }).join("");
}

function renderSalesContent() {
  let selected = ensureSelectedSalesContent();
  const filteredBase = getFilteredSalesContents({ ignoreCategory: true });
  const activeCategory = normalizeSalesContentCategoryFilter(state.salesContentCategory);
  const filtered = activeCategory === "all"
    ? filteredBase
    : filteredBase.filter((item) => normalizeSalesContentCategoryFilter(item.category || "") === activeCategory);
  const { pageItems, totalPages, totalItems } = paginateSalesContents(filtered);
  const hasSearchValue = String(state.search.salesContent || "").trim().length > 0;
  if (ui.salesContentSearchClear) {
    ui.salesContentSearchClear.classList.toggle("hidden", !hasSearchValue);
    ui.salesContentSearchClear.disabled = !hasSearchValue;
  }
  if (!state.creatingSalesContent && selected && !filtered.some((item) => item.id === selected.id) && filtered.length) {
    selected = filtered[0];
  }
  if (!state.creatingSalesContent && !selected && filtered.length) {
    selected = filtered[0];
  }
  if (!state.creatingSalesContent && selected && !pageItems.some((item) => item.id === selected.id) && pageItems.length) {
    selected = pageItems[0];
  }
  if (state.creatingSalesContent) {
    state.selectedSalesContentId = "";
  } else if ((selected?.id || "") !== state.selectedSalesContentId) {
    state.selectedSalesContentId = selected?.id || "";
  }
  if (ui.salesContentCategoryFilters) {
    const categoryOptions = getSalesContentCategoryOptions(state.salesContents);
    const categoryCountMap = new Map();
    filteredBase.forEach((item) => {
      const key = normalizeSalesContentCategoryFilter(item.category || "");
      categoryCountMap.set(key, (categoryCountMap.get(key) || 0) + 1);
    });
    const chips = [
      {
        value: "all",
        label: t("all"),
        count: filteredBase.length,
      },
      ...categoryOptions.map((category) => ({
        value: category,
        label: getSalesContentCategoryLabel(category),
        count: categoryCountMap.get(category) || 0,
      })),
    ];
    ui.salesContentCategoryFilters.innerHTML = chips.map((chip) => `
      <button
        type="button"
        class="sales-content-chip ${chip.value === activeCategory ? "is-active" : ""}"
        data-action="set-sales-content-category"
        data-category="${escapeHtml(chip.value)}"
      >
        <span>${escapeHtml(chip.label)}</span>
        <span class="sales-content-chip-count">${Number(chip.count || 0)}</span>
      </button>
    `).join("");
  }
  if (ui.salesContentInsights) {
    const totalAttachments = filtered.reduce((sum, item) => sum + (Array.isArray(item.attachments) ? item.attachments.length : 0), 0);
    const recentThreshold = Date.now() - (1000 * 60 * 60 * 24 * 7);
    const updatedRecently = filtered.reduce((sum, item) => {
      const updatedAt = new Date(item.updatedAt || item.createdAt || 0).getTime();
      return updatedAt >= recentThreshold ? sum + 1 : sum;
    }, 0);
    ui.salesContentInsights.innerHTML = `
      <article class="sales-content-kpi">
        <strong>${filtered.length}</strong>
        <span>${state.lang === "it" ? "risultati filtro" : "filtered results"}</span>
      </article>
      <article class="sales-content-kpi">
        <strong>${totalAttachments}</strong>
        <span>${state.lang === "it" ? "allegati visibili" : "visible attachments"}</span>
      </article>
      <article class="sales-content-kpi">
        <strong>${updatedRecently}</strong>
        <span>${state.lang === "it" ? "aggiornati 7 giorni" : "updated in 7 days"}</span>
      </article>
    `;
  }
  if (ui.salesContentList) {
    ui.salesContentList.innerHTML = pageItems.length
      ? pageItems.map((item) => `
          <article class="sales-content-card ${item.id === selected?.id ? "is-active" : ""}" data-action="select-sales-content" data-id="${item.id}">
            <div class="sales-content-card-head">
              <strong>${escapeHtml(item.title || (state.lang === "it" ? "Contenuto senza titolo" : "Untitled content"))}</strong>
              <span class="sales-category-pill">${escapeHtml(getSalesContentCategoryLabel(item.category))}</span>
            </div>
            <p>${escapeHtml(item.description || (state.lang === "it" ? "Nessuna descrizione." : "No description."))}</p>
            <div class="sales-content-card-foot">
              <span>${(item.attachments || []).length} ${state.lang === "it" ? "allegati" : "attachments"}</span>
              <span>${item.updatedAt ? formatDate(item.updatedAt) : "—"}</span>
            </div>
          </article>
        `).join("")
      : `<div class="info-card">${state.lang === "it" ? "Nessun contenuto disponibile." : "No content available."}</div>`;
  }
  if (ui.salesContentPagination) {
    const showPagination = totalItems > getSalesContentPageSize();
    ui.salesContentPagination.classList.toggle("hidden", !showPagination);
    ui.salesContentPagination.innerHTML = showPagination
      ? `
        <div class="list-pagination-copy">${state.lang === "it" ? `Pagina ${state.salesContentPage} di ${totalPages} · ${totalItems} contenuti` : `Page ${state.salesContentPage} of ${totalPages} · ${totalItems} contents`}</div>
        <div class="list-pagination-actions">
          <button class="btn" data-action="sales-content-prev-page" ${state.salesContentPage <= 1 ? "disabled" : ""}>${state.lang === "it" ? "Prec." : "Prev"}</button>
          <button class="btn" data-action="sales-content-next-page" ${state.salesContentPage >= totalPages ? "disabled" : ""}>${state.lang === "it" ? "Succ." : "Next"}</button>
        </div>
      `
      : "";
  }
  if (!ui.salesContentForm) return;
  ui.salesContentForm.id.value = selected?.id || "";
  ui.salesContentForm.title.value = selected?.title || "";
  ui.salesContentForm.category.value = selected?.category || "documentazione";
  ui.salesContentForm.link.value = selected?.link || "";
  ui.salesContentForm.description.value = selected?.description || "";
  if (ui.salesContentDetailTitle) {
    ui.salesContentDetailTitle.textContent = selected?.title || (state.lang === "it" ? "Nuovo contenuto" : "New content");
  }
  if (ui.salesContentDeleteButton) {
    if (!ui.salesContentDeleteButton.dataset.defaultLabel) {
      ui.salesContentDeleteButton.dataset.defaultLabel = ui.salesContentDeleteButton.textContent || (state.lang === "it" ? "Elimina" : "Delete");
    }
    ui.salesContentDeleteButton.disabled = !selected || Boolean(salesContentDeleteInFlightId);
    ui.salesContentDeleteButton.textContent = salesContentDeleteInFlightId
      ? (state.lang === "it" ? "Eliminazione..." : "Deleting...")
      : (ui.salesContentDeleteButton.dataset.defaultLabel || (state.lang === "it" ? "Elimina" : "Delete"));
  }
  if (ui.salesContentAttachmentButton) ui.salesContentAttachmentButton.disabled = false;
  if (ui.salesContentAttachments) {
    const items = (selected?.attachments || []).map((item, index) => ({ ...item, _attachmentIndex: index }));
    ui.salesContentAttachments.innerHTML = renderSalesContentAttachments(items, selected?.id || "");
  }
}

function upsertSalesRequest(saved, { skipOpsRender = false } = {}) {
  const normalized = normalizeSalesRequestRecord(saved);
  const existingIndex = state.salesRequests.findIndex((item) => item.id === normalized.id);
  if (existingIndex >= 0) {
    state.salesRequests = state.salesRequests.map((item, index) => (index === existingIndex ? normalized : item));
  } else {
    state.salesRequests = [normalized, ...state.salesRequests];
    state.salesRequestPage = 1;
  }
  state.selectedSalesRequestId = normalized.id;
  state.creatingSalesRequest = false;
  if (!skipOpsRender) renderOps();
}

function upsertSalesContent(saved, { skipOpsRender = false } = {}) {
  const normalized = normalizeSalesContentRecord(saved);
  state.salesContents = [
    normalized,
    ...state.salesContents.filter((item) => item.id !== normalized.id),
  ];
  state.selectedSalesContentId = normalized.id;
  state.creatingSalesContent = false;
  state.salesContentPage = 1;
  if (!skipOpsRender) renderOps();
}

function createNewSalesRequest() {
  state.creatingSalesRequest = true;
  state.selectedSalesRequestId = "";
  state.salesRequestPage = 1;
  renderSalesRequests();
  clearStatus(ui.salesRequestsStatus);
  requestAnimationFrame(() => {
    ui.salesRequestDetailTitle?.scrollIntoView({ behavior: window.innerWidth <= 980 ? "smooth" : "auto", block: "start" });
    ui.salesRequestForm?.name?.focus();
  });
}

function getSalesRequestAutomationFailureMessage(reason = "", details = "") {
  const code = String(reason || "").trim().toLowerCase();
  const fallback = state.lang === "it"
    ? "invio automatico non riuscito"
    : "automatic send failed";
  const mapped = code === "automation_disabled"
    ? (state.lang === "it" ? "automazione disattivata lato server" : "server automation disabled")
    : code === "missing_operator_config"
      ? (state.lang === "it" ? "configurazione operatore WhatsApp mancante" : "missing operator WhatsApp config")
      : code === "missing_phone"
        ? (state.lang === "it" ? "numero cliente non valido" : "invalid customer phone")
        : code === "missing_email"
          ? (state.lang === "it" ? "email cliente non valida" : "invalid customer email")
          : code === "missing_email_config"
            ? (state.lang === "it" ? "configurazione email automatica mancante" : "missing automated email config")
            : code === "unsupported_email_provider"
              ? (state.lang === "it" ? "provider email non supportato" : "unsupported email provider")
          : code === "missing_message"
            ? (state.lang === "it" ? "messaggio automatico non disponibile" : "automatic message missing")
          : code === "provider_error"
            ? (state.lang === "it" ? "errore provider automazione" : "automation provider error")
            : code === "network_error"
              ? (state.lang === "it" ? "errore di rete verso provider" : "network error to provider")
              : fallback;
  const detailText = String(details || "").trim();
  if (!detailText) return mapped;
  return `${mapped}: ${detailText}`;
}

function getSalesRequestAutomationSaveMessage(automation = null) {
  if (!automation || typeof automation !== "object") return "";
  const action = String(automation.action || "").trim().toLowerCase();
  const channel = String(automation.channel || "").trim().toLowerCase();
  if (action === "sent") {
    if (channel === "email") {
      return state.lang === "it"
        ? " Follow-up email inviato automaticamente."
        : " Follow-up email sent automatically.";
    }
    return state.lang === "it"
      ? " Primo contatto inviato automaticamente."
      : " First contact sent automatically.";
  }
  if (action === "queued") {
    const scheduledAt = normalizeIsoDateTime(automation.scheduledAt || automation.firstContactScheduledAt || "");
    const failureReason = getSalesRequestAutomationFailureMessage(automation.reason, automation.details);
    const prefix = channel === "email"
      ? (state.lang === "it" ? "Follow-up email in coda" : "Follow-up email queued")
      : (state.lang === "it" ? "Contatto in coda" : "Contact queued");
    if (scheduledAt) {
      return state.lang === "it"
        ? ` ${prefix} (${failureReason}) · pianificato ${formatDate(scheduledAt)}.`
        : ` ${prefix} (${failureReason}) · scheduled ${formatDate(scheduledAt)}.`;
    }
    return state.lang === "it"
      ? ` ${prefix} (${failureReason}).`
      : ` ${prefix} (${failureReason}).`;
  }
  return "";
}

async function saveSalesRequest(event) {
  event.preventDefault();
  clearStatus(ui.salesRequestsStatus);
  const form = new FormData(ui.salesRequestForm);
  const requestId = String(form.get("id") || "").trim();
  const existingRequest = requestId
    ? (state.salesRequests.find((item) => item.id === requestId) || null)
    : null;
  const nextStatus = String(form.get("status") || "").trim() || "new";
  const draftRecord = normalizeSalesRequestRecord({
    ...(existingRequest || {}),
    id: requestId || undefined,
    name: form.get("name"),
    surname: form.get("surname"),
    city: form.get("city"),
    phone: form.get("phone"),
    email: form.get("email"),
    sqm: form.get("sqm"),
    requestedHeight: form.get("requestedHeight"),
    service: form.get("service"),
    surface: form.get("surface"),
    assignment: normalizeSalesRequestAssignment(form.get("assignment")),
    status: nextStatus,
    note: form.get("note"),
    whatsappTemplate: form.get("whatsappTemplate"),
    whatsappUrl: form.get("whatsappUrl"),
    source: existingRequest?.source || "manual",
    sourceSpreadsheetId: existingRequest?.sourceSpreadsheetId || "",
    sourceSheetName: existingRequest?.sourceSheetName || "",
    sourceRowNumber: Number(existingRequest?.sourceRowNumber || 0),
    createdAt: existingRequest?.createdAt || undefined,
  });
  try {
    const saved = await apiFetch("/api/sales/requests", {
      method: "POST",
      body: JSON.stringify(buildSalesRequestPayloadFromRecord(draftRecord)),
    });
    const automationMessage = getSalesRequestAutomationSaveMessage(saved?._automation || null);
    upsertSalesRequest(saved, { skipOpsRender: true });
    renderSalesRequests();
    if (state.currentView === "sales-generator") renderSalesGenerator();
    setStatus(
      ui.salesRequestsStatus,
      "success",
      `${state.lang === "it" ? "Richiesta salvata." : "Request saved."}${automationMessage}`,
    );
  } catch (error) {
    setStatus(ui.salesRequestsStatus, "error", state.lang === "it" ? "Impossibile salvare la richiesta." : "Unable to save the request.");
  }
}

async function deleteSalesRequest() {
  const selected = getSelectedSalesRequest();
  if (!selected) return;
  const confirmed = window.confirm(state.lang === "it" ? "Vuoi eliminare questa richiesta?" : "Do you want to delete this request?");
  if (!confirmed) return;
  try {
    await apiFetch(`/api/sales/requests/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    state.salesRequests = state.salesRequests.filter((item) => item.id !== selected.id);
    state.selectedSalesRequestId = "";
    state.salesRequestPage = 1;
    state.creatingSalesRequest = false;
    state.lastSalesGeneratorSignature = "";
    renderOps();
    renderSalesRequests();
    if (state.currentView === "sales-generator") renderSalesGenerator();
    setStatus(ui.salesRequestsStatus, "success", state.lang === "it" ? "Richiesta eliminata." : "Request deleted.");
  } catch (error) {
    setStatus(ui.salesRequestsStatus, "error", state.lang === "it" ? "Impossibile eliminare la richiesta." : "Unable to delete the request.");
  }
}

async function importSalesRequests() {
  clearStatus(ui.salesRequestsStatus);
  const raw = String(ui.salesRequestImportText?.value || "").trim();
  if (!raw) {
    setStatus(ui.salesRequestsStatus, "error", state.lang === "it" ? "Incolla un JSON o CSV prima di importare." : "Paste JSON or CSV before importing.");
    return;
  }

  const parsedItems = parseSalesRequestImport(raw);
  if (!parsedItems.length) {
    setStatus(ui.salesRequestsStatus, "error", state.lang === "it" ? "Nessuna richiesta valida trovata nel contenuto incollato." : "No valid requests found in the pasted content.");
    return;
  }

  try {
    for (const item of parsedItems) {
      const saved = await apiFetch("/api/sales/requests", {
        method: "POST",
        body: JSON.stringify({
          name: item.name,
          surname: item.surname,
          city: item.city,
          phone: item.phone,
          email: item.email,
          sqm: item.sqm,
          requestedHeight: item.requestedHeight,
          service: item.service,
          surface: item.surface,
          assignment: normalizeSalesRequestAssignment(item.assignment),
          status: item.status,
          note: item.note,
          whatsappTemplate: item.whatsappTemplate,
          whatsappUrl: item.whatsappUrl,
          source: "import",
        }),
      });
      upsertSalesRequest(saved, { skipOpsRender: true });
    }
    if (ui.salesRequestImportText) ui.salesRequestImportText.value = "";
    state.showSalesRequestImport = false;
    state.salesRequestPage = 1;
    renderOps();
    renderSalesRequests();
    if (state.currentView === "sales-generator") renderSalesGenerator();
    setStatus(ui.salesRequestsStatus, "success", state.lang === "it" ? `${parsedItems.length} richieste importate correttamente.` : `${parsedItems.length} requests imported successfully.`);
  } catch (error) {
    renderOps();
    setStatus(ui.salesRequestsStatus, "error", state.lang === "it" ? "Impossibile importare le richieste." : "Unable to import the requests.");
  }
}

function useSelectedSalesRequestInGenerator() {
  const selected = getSelectedSalesRequest();
  if (!selected) return;
  state.salesGeneratorFreeMode = false;
  state.salesGeneratorPlannerMode = false;
  pushSalesRequestToGenerator(true);
  setView("sales-generator");
}

function toggleSalesGeneratorFreeMode() {
  const selected = getSelectedSalesRequest();
  if (state.salesGeneratorPlannerMode) {
    if (selected) {
      state.salesGeneratorPlannerMode = false;
      state.salesGeneratorFreeMode = false;
      pushSalesRequestToGenerator(true);
      if (state.currentView === "sales-generator") renderSalesGenerator();
      return;
    }
    clearSalesRequestPrefillInGenerator({ keepFreeMode: true });
    renderSalesGenerator();
    return;
  }
  if (state.salesGeneratorFreeMode) {
    if (!selected) return;
    state.salesGeneratorFreeMode = false;
    pushSalesRequestToGenerator(true);
    if (state.currentView === "sales-generator") renderSalesGenerator();
    return;
  }
  clearSalesRequestPrefillInGenerator({ keepFreeMode: true });
  renderSalesGenerator();
}

function createNewSalesContent() {
  state.creatingSalesContent = true;
  state.selectedSalesContentId = "";
  state.salesContentPage = 1;
  renderSalesContent();
  clearStatus(ui.salesContentStatus);
  requestAnimationFrame(() => {
    ui.salesContentDetailTitle?.scrollIntoView({ behavior: window.innerWidth <= 980 ? "smooth" : "auto", block: "start" });
    ui.salesContentForm?.title?.focus();
  });
}

async function saveSalesContent(event) {
  if (event?.preventDefault) event.preventDefault();
  clearStatus(ui.salesContentStatus);
  const form = new FormData(ui.salesContentForm);
  try {
    const isUpdate = Boolean(String(form.get("id") || "").trim());
    const saved = await apiFetch("/api/sales/content-items", {
      method: "POST",
      body: JSON.stringify({
        id: String(form.get("id") || "").trim() || undefined,
        title: form.get("title"),
        category: form.get("category"),
        link: form.get("link"),
        description: form.get("description"),
      }),
    });
    upsertSalesContent(saved, { skipOpsRender: isUpdate });
    renderSalesContent();
    setStatus(ui.salesContentStatus, "success", state.lang === "it" ? "Contenuto salvato." : "Content saved.");
    return saved;
  } catch (error) {
    setStatus(ui.salesContentStatus, "error", state.lang === "it" ? "Impossibile salvare il contenuto." : "Unable to save the content.");
    return null;
  }
}

async function ensureSelectedSalesContentForAttachment({ preparingUpload = false } = {}) {
  const selected = getSelectedSalesContent();
  if (selected?.id) return selected;
  if (!ui.salesContentForm) return null;
  const form = new FormData(ui.salesContentForm);
  const title = String(form.get("title") || "").trim()
    || (state.lang === "it" ? `Nuovo contenuto ${new Date().toLocaleDateString("it-IT")}` : `New content ${new Date().toLocaleDateString("en-GB")}`);
  const category = String(form.get("category") || "").trim() || "documentazione";
  const link = String(form.get("link") || "").trim();
  const description = String(form.get("description") || "").trim();
  const saved = await apiFetch("/api/sales/content-items", {
    method: "POST",
    body: JSON.stringify({ title, category, link, description }),
  });
  upsertSalesContent(saved, { skipOpsRender: true });
  renderSalesContent();
  setStatus(ui.salesContentStatus, "success", state.lang === "it"
    ? (preparingUpload ? "Contenuto creato e pronto per il caricamento allegati." : "Contenuto creato automaticamente.")
    : (preparingUpload ? "Content created and ready for attachment upload." : "Content auto-created."));
  return getSelectedSalesContent();
}

async function deleteSalesContent() {
  const selected = getSelectedSalesContent();
  if (!selected) return;
  const confirmed = window.confirm(state.lang === "it" ? "Vuoi eliminare questo contenuto?" : "Do you want to delete this content?");
  if (!confirmed) return;
  const previousContents = [...state.salesContents];
  const previousSelectedId = state.selectedSalesContentId;
  const previousCreatingState = state.creatingSalesContent;
  const previousPage = state.salesContentPage;
  salesContentDeleteInFlightId = selected.id;
  state.salesContents = state.salesContents.filter((item) => item.id !== selected.id);
  state.selectedSalesContentId = "";
  state.creatingSalesContent = false;
  state.salesContentPage = 1;
  renderOps();
  renderSalesContent();
  setStatus(ui.salesContentStatus, "success", state.lang === "it" ? "Eliminazione contenuto in corso..." : "Deleting content...");
  try {
    await apiFetch(`/api/sales/content-items/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    setStatus(ui.salesContentStatus, "success", state.lang === "it" ? "Contenuto eliminato." : "Content deleted.");
  } catch (error) {
    state.salesContents = previousContents;
    state.selectedSalesContentId = previousSelectedId;
    state.creatingSalesContent = previousCreatingState;
    state.salesContentPage = previousPage;
    renderOps();
    renderSalesContent();
    setStatus(ui.salesContentStatus, "error", state.lang === "it" ? "Impossibile eliminare il contenuto." : "Unable to delete the content.");
  } finally {
    salesContentDeleteInFlightId = "";
    renderSalesContent();
  }
}

async function removeSalesContentAttachment(contentId, attachmentIndex, attachmentId = "") {
  const contentIndex = state.salesContents.findIndex((item) => item.id === contentId);
  if (contentIndex < 0) return;
  const currentContent = state.salesContents[contentIndex];
  const currentAttachments = Array.isArray(currentContent.attachments) ? [...currentContent.attachments] : [];
  if (attachmentIndex < 0 || attachmentIndex >= currentAttachments.length) return;
  const previousContents = [...state.salesContents];
  const pendingKey = getSalesContentAttachmentPendingKey(contentId, attachmentId || currentAttachments[attachmentIndex]?.id || "", attachmentIndex);
  salesContentAttachmentDeleteInFlight.add(pendingKey);
  state.salesContents = state.salesContents.map((item, index) => (
    index === contentIndex
      ? { ...item, attachments: currentAttachments.filter((_, indexItem) => indexItem !== attachmentIndex) }
      : item
  ));
  renderSalesContent();
  setStatus(ui.salesContentStatus, "success", state.lang === "it" ? "Rimozione allegato in corso..." : "Removing attachment...");
  try {
    const saved = await apiFetch(`/api/sales/content-items/${encodeURIComponent(contentId)}/attachments/${attachmentIndex}`, {
      method: "DELETE",
    });
    upsertSalesContent(saved, { skipOpsRender: true });
    setStatus(ui.salesContentStatus, "success", state.lang === "it" ? "Allegato rimosso." : "Attachment removed.");
  } catch (error) {
    state.salesContents = previousContents;
    setStatus(ui.salesContentStatus, "error", state.lang === "it" ? "Impossibile rimuovere l'allegato." : "Unable to remove the attachment.");
    throw error;
  } finally {
    salesContentAttachmentDeleteInFlight.delete(pendingKey);
    renderSalesContent();
  }
}

function renderInventoryCard(group) {
  const totalPieces = group.pieces.length;
  const stockValue = group.isModel ? group.availableSqm : group.availableUnits;
  const hasDeficit = stockValue < 0;
  const hasStock = group.isModel ? group.totalSqm > 0 : group.totalUnits > 0;
  const hasDemand = group.isModel ? group.demandSqm > 0 : group.demandUnits > 0;

  const stockState = hasDeficit
    ? (state.lang === "it" ? "Fabbisogno non coperto" : "Unmet demand")
    : !hasStock && hasDemand
      ? (state.lang === "it" ? "Nessuna giacenza" : "No stock")
      : !hasStock
        ? (state.lang === "it" ? "Da caricare" : "To load")
        : hasDemand && stockValue < group.totalSqm * 0.3
          ? (state.lang === "it" ? "Sotto scorta" : "Low stock")
          : (state.lang === "it" ? "Disponibile" : "Available");

  const badgeClass = hasDeficit || (!hasStock && hasDemand)
    ? "badge-urgent"
    : !hasStock
      ? "badge-warning"
      : hasDemand && stockValue < group.totalSqm * 0.3
        ? "badge-warning"
        : "badge-success";

  const stockLabel = group.isModel ? `${Math.round(group.totalSqm)} mq` : `${group.totalUnits} u`;
  const demandLabel = group.isModel ? `${Math.round(group.demandSqm)} mq` : `${group.demandUnits} u`;
  const netValue = group.isModel ? group.availableSqm : stockValue;
  const netLabel = group.isModel ? `${Math.round(Math.max(0, group.availableSqm))} mq` : `${Math.max(0, stockValue)} u`;
  const immobilizedValueLabel = group.isModel && group.grossPriceConfigured
    ? formatCurrency(group.availableGrossValue)
    : "—";
  const unitDetailLabel = inferCatalogEntry(group.product)?.unitLabel || (state.lang === "it" ? "unità" : "units");
  const firstDemandOrderId = group.demandOrders[0] || "";
  const demandActionAttrs = firstDemandOrderId
    ? `data-action="open-modal" data-id="${firstDemandOrderId}" role="button" tabindex="0" title="${state.lang === "it" ? "Apri ordine collegato" : "Open linked order"}"`
    : "";
  const linkedDemandOrders = group.demandOrders
    .map((orderId) => state.orders.find((order) => order.id === orderId))
    .filter(Boolean)
    .slice(0, 3);
  const remainingDemandCount = Math.max(0, group.demandOrders.length - linkedDemandOrders.length);
  const committedLabel = group.isModel ? `${Math.round(group.demandSqm)} mq` : `${group.demandUnits} u`;
  const materialSlots = group.isModel ? [] : buildMaterialInventorySlots(group);

  const deficitAlert = hasDeficit || (!hasStock && hasDemand)
    ? `<div class="wh-deficit-alert">
        <strong>${state.lang === "it" ? "Fabbisogno non coperto" : "Unmet demand"}: ${group.isModel ? `${Math.round(Math.abs(netValue))} mq` : `${Math.abs(netValue)} u`}</strong>
        <p>${group.demandOrders.length} ${state.lang === "it"
          ? `ordini aperti richiedono ${demandLabel} ma ${hasStock ? `sono disponibili solo ${stockLabel}` : "non ci sono pezzi in magazzino"}.`
          : `open orders require ${demandLabel} but ${hasStock ? `only ${stockLabel} available` : "no pieces in warehouse"}.`
        }</p>
      </div>`
    : "";

  return `
    <article class="wh-product">
      <div class="wh-product-header">
        <div>
          <div class="wh-product-name">${group.product}</div>
          <div class="wh-product-total">${group.isModel
            ? `${Math.round(group.totalSqm)} mq in ${totalPieces} pezzi · ${group.fullCount} interi, ${group.residualCount} residui${group.grossPriceConfigured ? ` · ${state.lang === "it" ? "immobilizzato" : "immobilized"} ${immobilizedValueLabel}` : ` · ${state.lang === "it" ? "listino ivato non configurato" : "gross price not configured"}`}`
            : `${group.totalUnits} unità caricate`}</div>
        </div>
        <div class="wh-actions">
          <span class="action-badge ${badgeClass}">${stockState}</span>
          <button class="btn" data-action="prefill-inventory" data-product="${group.product}">${state.lang === "it" ? "Carica giacenza" : "Load stock"}</button>
        </div>
      </div>
      ${deficitAlert}
      ${linkedDemandOrders.length ? `
        <div class="wh-demand-orders">
          <div class="wh-demand-orders-head">
            <strong>${state.lang === "it" ? "Ordini che impegnano questa giacenza" : "Orders reserving this stock"}</strong>
            <span>${group.demandOrders.length} ${state.lang === "it" ? "ordini" : "orders"}</span>
          </div>
          <div class="wh-demand-order-list">
            ${linkedDemandOrders.map((order) => `
              <button class="wh-demand-order" data-action="open-modal" data-id="${order.id}">
                <strong>${composeClientName(order)} <small>${getOrderNumber(order)}</small></strong>
                <span>${order.operations?.product || undefinedText()} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq</span>
                <small>${getUnifiedOrderStage(order).label} · ${getShippingTargetLabel(order)}</small>
              </button>
            `).join("")}
            ${remainingDemandCount > 0 ? `<div class="wh-demand-more">+${remainingDemandCount} ${state.lang === "it" ? "ordini collegati" : "linked orders"}</div>` : ""}
          </div>
        </div>
      ` : ""}
      <div class="wh-pieces">
        ${group.isModel && group.pieces.length ? group.pieces.map((item) => `
          <div class="wh-piece ${item.status === "residuo" ? "residuo" : "intero"}">
            <button
              class="wh-piece-remove"
              type="button"
              data-action="delete-inventory-piece"
              data-id="${item.id}"
              title="${state.lang === "it" ? "Rimuovi pezzo" : "Remove piece"}"
              aria-label="${state.lang === "it" ? "Rimuovi pezzo" : "Remove piece"}"
            >×</button>
            <strong>${formatPieceLabel(item)}</strong>
            <span>${group.isModel ? `${Math.round(item.sqm)} mq` : (item.note || unitDetailLabel)}</span>
            <small>${group.isModel ? (item.status === "residuo" ? "RESIDUO" : "INTERO") : unitDetailLabel.toUpperCase()}</small>
          </div>
        `).join("") : !group.isModel && materialSlots.length ? materialSlots.map((slot) => `
          <div class="wh-piece material-slot ${slot.status === "residuo" ? "residuo" : "intero"}">
            <button
              class="wh-piece-remove"
              type="button"
              data-action="delete-inventory-piece"
              data-id="${slot.id}"
              title="${state.lang === "it" ? "Rimuovi lotto" : "Remove slot"}"
              aria-label="${state.lang === "it" ? "Rimuovi lotto" : "Remove slot"}"
            >×</button>
            <strong>${slot.variant || (state.lang === "it" ? "Slot magazzino" : "Warehouse slot")}</strong>
            <span>${slot.note || (state.lang === "it" ? "Quantita aggregata a magazzino" : "Aggregated stock quantity")}</span>
            <small class="material-slot-qty">${slot.units} ${unitDetailLabel}</small>
          </div>
        `).join("") : `<div class="wh-empty">${state.lang === "it" ? "Nessun pezzo caricato." : "No pieces loaded."}</div>`}
      </div>
      <div class="wh-piece-tools">
        <button
          class="btn ghost-button danger-button"
          type="button"
          data-action="clear-inventory-product"
          data-product="${escapeHtml(group.product)}"
          ${group.pieces.length ? "" : "disabled"}
        >
          ${state.lang === "it" ? "Azzera giacenza" : "Clear stock"}
        </button>
      </div>
      <div class="wh-stats">
        <div class="wh-stat soft">
          <div class="wh-stat-label">${state.lang === "it" ? "Giacenza reale" : "Physical stock"}</div>
          <div class="wh-stat-value">${stockLabel}</div>
          <div class="wh-stat-sub">${group.isModel ? `${totalPieces} ${state.lang === "it" ? "pezzi fisici caricati" : "physical pieces loaded"}` : `${materialSlots.length} ${state.lang === "it" ? "slot" : "slots"} · ${group.totalUnits} ${unitDetailLabel} ${state.lang === "it" ? "fisicamente caricati" : "physically loaded"}`}</div>
        </div>
        <div class="wh-stat ${hasDemand ? "danger" : "soft"}" ${demandActionAttrs}>
          <div class="wh-stat-label">${state.lang === "it" ? "Impegnato su ordini" : "Committed to orders"}</div>
          <div class="wh-stat-value" ${hasDemand && hasDeficit ? 'style="color:#dc2626"' : ""}>${committedLabel}</div>
          <div class="wh-stat-sub">${group.demandOrders.length} ${state.lang === "it" ? "ordini aperti" : "open orders"}${firstDemandOrderId ? ` · ${state.lang === "it" ? "clicca per aprire" : "click to open"}` : ""}</div>
        </div>
        <div class="wh-stat ${hasDeficit ? "danger" : "neutral"}">
          <div class="wh-stat-label">${state.lang === "it" ? "Disponibile per nuovi ordini" : "Available for new orders"}</div>
          <div class="wh-stat-value" ${hasDeficit ? 'style="color:#dc2626"' : netValue > 0 ? 'style="color:#16a34a"' : ""}>${hasDeficit ? (group.isModel ? (state.lang === "it" ? `Mancano ${Math.round(Math.abs(netValue))} mq` : `Missing ${Math.round(Math.abs(netValue))} sq`) : (state.lang === "it" ? `Mancano ${Math.abs(netValue)} u` : `Missing ${Math.abs(netValue)} u`)) : netLabel}</div>
          <div class="wh-stat-sub">${group.isModel
            ? `${group.fullCount} ${state.lang === "it" ? "interi" : "full"} · ${group.residualCount} ${state.lang === "it" ? "residui" : "residual"}${group.grossPriceConfigured ? ` · ${immobilizedValueLabel}` : ` · ${state.lang === "it" ? "prezzo ivato mancante" : "gross price missing"}`}`
            : `${group.totalUnits} ${unitDetailLabel}`}</div>
        </div>
      </div>
    </article>
  `;
}

function renderWarehouse() {
  const orders = filterOrdersForView("warehouse");
  const groups = getInventorySummary().filter((group) => {
    const search = (state.search.warehouse || "").toLowerCase();
    const matchesSearch = !search || [
      group.product,
      ...group.pieces.map((item) => `${item.width}x${item.length}`),
    ].join(" ").toLowerCase().includes(search);
    if (!matchesSearch) return false;
    if (state.filters.warehouse === "full") return group.fullCount > 0;
    if (state.filters.warehouse === "residual") return group.residualCount > 0;
    if (state.filters.warehouse === "demand") return group.demandSqm > 0 || group.demandUnits > 0;
    return true;
  });

  ui.warehouseList.innerHTML = orders.length
    ? `<div class="action-list">${
      orders.map((order) => {
        const warehouseStatus = order.operations?.warehouse?.status || "da-preparare";
        const selected = order.id === state.selectedOrderId ? "selected" : "";
        const borderTone = warehouseStatus === "bloccato" ? "var(--red)" : warehouseStatus === "pronto" ? "var(--green)" : "var(--blue)";
        const preparedLines = getWarehousePreparedLines(order);
        const prepSummary = preparedLines
          .map((item) => item.title)
          .slice(0, 2)
          .join(" · ");
        const warehouseStatusLabel = warehouseStatus === "bloccato"
          ? (state.lang === "it" ? "Bloccato" : "Blocked")
          : warehouseStatus === "pronto"
            ? (state.lang === "it" ? "Pronto" : "Ready")
            : (state.lang === "it" ? "Da preparare" : "To prepare");
        return `
          <article class="action-card warehouse-action-card ${selected}" style="border-left:3px solid ${borderTone}" data-action="select-order" data-id="${order.id}" data-view="warehouse">
            <div class="action-content">
              <div class="action-title">${composeClientName(order)} ${getOrderNumber(order)}</div>
              <div class="action-sub">${order.operations?.product || undefinedText()} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq · ${composeAddress(order) || addressIncompleteText()}</div>
              <div class="action-sub">${prepSummary || (state.lang === "it" ? "Nessuna riga selezionata" : "No prepared lines")} · ${preparedLines.length} ${state.lang === "it" ? "righe da preparare" : "lines to prepare"}</div>
              <div class="action-sub">${getShippingTargetLabel(order)} · ${order.operations?.warehouse?.fulfillmentMode === "furgone" ? (state.lang === "it" ? "Caricare su furgone" : "Load on van") : getShippingModeLabel(order)}</div>
            </div>
            <div class="action-tail">
              <div class="action-badge ${warehouseStatus === "bloccato" ? "badge-urgent" : warehouseStatus === "pronto" ? "badge-success" : "badge-info"}">${warehouseStatusLabel}</div>
              <button class="btn small-button" data-action="select-order" data-id="${order.id}" data-view="warehouse">${state.lang === "it" ? "Apri" : "Open"}</button>
            </div>
          </article>
        `;
      }).join("")
    }</div>`
    : `<div class="info-card">${state.lang === "it" ? "Nessun ordine per il magazzino con questo filtro." : "No warehouse orders for this filter."}</div>`;

  if (ui.inventorySummary) {
    ui.inventorySummary.innerHTML = groups.length
      ? groups.map(renderInventoryCard).join("")
      : `<div class="info-card">${state.lang === "it" ? "Nessuna giacenza caricata. Inserisci i primi rotoli o residui dal pannello a destra." : "No stock loaded yet. Add the first rolls or offcuts from the right panel."}</div>`;
  }

  const order = orders.find((item) => item.id === state.selectedOrderId) || orders[0] || null;
  if (state.currentView === "warehouse" && order && order.id !== state.selectedOrderId) state.selectedOrderId = order.id;
  ui.warehouseDetailTitle.textContent = state.lang === "it" ? "Inventario operativo" : "Inventory operations";
  ui.warehouseDetailFields.innerHTML = order
    ? [
        { label: t("selectedOrder"), value: `${composeClientName(order)} · ${getOrderNumber(order)}`, meta: composeAddress(order) || addressIncompleteText() },
        { label: t("primaryProduct"), value: order.operations?.product || undefinedText(), meta: `${order.operations?.sqm || 0} mq · ${order.phone || (state.lang === "it" ? "Telefono non disponibile" : "Phone unavailable")}` },
        {
          label: state.lang === "it" ? "Preparazione ufficio" : "Office preparation",
          value: `${getWarehousePreparedLines(order).length} ${state.lang === "it" ? "righe da preparare" : "lines to prepare"}`,
          meta: getWarehousePreparedLines(order).map((item) => `${item.title} x${item.quantity}`).join(" · ") || (state.lang === "it" ? "Nessuna riga inclusa" : "No included lines"),
        },
        {
          label: state.lang === "it" ? "Residuo inventario" : "Inventory residual",
          value: groups.find((group) => normalizeProductName(group.product) === normalizeProductName(getCatalogLabel(order.operations?.product)))?.isModel ? `${Math.round(groups.find((group) => normalizeProductName(group.product) === normalizeProductName(getCatalogLabel(order.operations?.product)))?.availableSqm || 0)} mq` : "—",
          meta: state.lang === "it" ? "Calcolato sui pezzi caricati a magazzino" : "Calculated from loaded warehouse pieces",
        },
      ].map(renderDetailBox).join("")
    : [
        { label: t("selectedOrder"), value: state.lang === "it" ? "Nessun ordine selezionato" : "No order selected", meta: state.lang === "it" ? "Scegli un ordine dalla lista di preparazione." : "Pick an order from the preparation list." },
        { label: t("gettingStarted"), value: t("loadStartingStock"), meta: t("startingStockExample") },
      ].map(renderDetailBox).join("");

  if (ui.inventoryForm && document.activeElement !== ui.inventoryForm.product) {
    ui.inventoryForm.quantity.value = ui.inventoryForm.quantity.value || "1";
  }
  updateInventoryFormUI();
}

function updateInventoryFormUI() {
  if (!ui.inventoryForm) return;
  const config = getInventoryProductConfig(ui.inventoryForm.product?.value || "");
  const widthField = ui.inventoryForm.querySelector('[name="width"]')?.closest(".field");
  const lengthField = ui.inventoryForm.querySelector('[name="length"]')?.closest(".field");
  const statusField = ui.inventoryForm.querySelector('[name="status"]')?.closest(".field");
  const variantField = ui.inventoryForm.querySelector('[name="variant"]')?.closest(".field");
  const quantityLabel = ui.inventoryForm.querySelector('[name="quantity"]')?.closest(".field")?.querySelector("span");
  const widthLabel = widthField?.querySelector("span");
  const lengthLabel = lengthField?.querySelector("span");
  const variantLabel = variantField?.querySelector("span");
  const noteField = ui.inventoryForm.querySelector('[name="note"]');

  if (quantityLabel) quantityLabel.textContent = config.quantityLabel;
  if (widthLabel) widthLabel.textContent = config.widthLabel;
  if (lengthLabel) lengthLabel.textContent = config.lengthLabel;
  if (variantLabel) variantLabel.textContent = config.variantLabel;
  if (noteField) noteField.placeholder = config.notePlaceholder;

  if (ui.inventoryForm.variant) {
    const currentVariant = ui.inventoryForm.variant.value;
    ui.inventoryForm.variant.innerHTML = config.variantOptions.length
      ? config.variantOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")
      : '<option value="">Standard</option>';
    ui.inventoryForm.variant.value = config.variantOptions.some((option) => option.value === currentVariant)
      ? currentVariant
      : (config.defaultVariant || "");
  }

  const shouldShowVariant = Boolean(config.variantOptions.length || config.preset);

  if (config.isMeasured) {
    if (widthField) widthField.hidden = false;
    if (lengthField) lengthField.hidden = false;
    if (statusField) statusField.hidden = false;
    if (variantField) variantField.hidden = !shouldShowVariant;
  } else {
    if (widthField) widthField.hidden = true;
    if (lengthField) lengthField.hidden = true;
    if (statusField) statusField.hidden = true;
    if (variantField) variantField.hidden = !shouldShowVariant;
    if (ui.inventoryForm.status) ui.inventoryForm.status.value = "intero";
    if (config.preset) {
      if (ui.inventoryForm.width) ui.inventoryForm.width.value = String(config.preset.width || "");
      if (ui.inventoryForm.length) ui.inventoryForm.length.value = String(config.preset.length || "");
    } else {
      if (ui.inventoryForm.width) ui.inventoryForm.width.value = "";
      if (ui.inventoryForm.length) ui.inventoryForm.length.value = "";
    }
  }
}

function renderAccountingModels() {
  if (!ui.accountingModelsOverview) return;
  const openOrders = state.orders.filter((order) => getOpenBalance(order) > 0);
  const toInvoice = state.orders.filter((order) => order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued);
  const paidOrders = state.orders.filter((order) => getOpenBalance(order) <= 0);
  const totalToCollect = openOrders.reduce((sum, order) => sum + getOpenBalance(order), 0);
  ui.accountingModelsOverview.innerHTML = `
    <article class="accounting-summary-card acc-card-red">
      <span class="panel-eyebrow">${t("toBeCollected")}</span>
      <strong>${formatCurrency(totalToCollect)}</strong>
      <p>${openOrders.length} ${t("openBalanceOrders")}</p>
    </article>
    <article class="accounting-summary-card acc-card-blue">
      <span class="panel-eyebrow">${state.lang === "it" ? "Da fatturare" : "To invoice"}</span>
      <strong>${toInvoice.length}</strong>
      <p>${t("invoiceOrders")}</p>
    </article>
    <article class="accounting-summary-card acc-card-green">
      <span class="panel-eyebrow">${t("fullySettled")}</span>
      <strong>${paidOrders.length}</strong>
      <p>${t("settledOrders")}</p>
    </article>
  `;
}

function renderAccountingAnalysis(orders) {
  if (!ui.accountingAnalysis) return;
  const visibleCount = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + toNumber(order.total), 0);
  const collectedTotal = orders.reduce((sum, order) => sum + getCollectedAmount(order), 0);
  const openOrders = orders.filter((order) => getOpenBalance(order) > 0);
  const openTotal = openOrders.reduce((sum, order) => sum + getOpenBalance(order), 0);
  const averageOpen = openOrders.length ? openTotal / openOrders.length : 0;
  const invoicePending = orders.filter((order) => order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued).length;
  const settledCount = orders.filter((order) => getOpenBalance(order) <= 0).length;
  const searchActive = Boolean(String(state.search.accounting || "").trim());
  const filterLabel = getAccountingFilterLabel();
  ui.accountingAnalysis.innerHTML = `
    <article class="accounting-analysis-card">
      <span class="panel-eyebrow">${state.lang === "it" ? "Ordini visibili" : "Visible orders"}</span>
      <strong>${visibleCount}</strong>
      <p>${state.lang === "it" ? `Filtro: ${filterLabel}` : `Filter: ${filterLabel}`}${searchActive ? ` · ${state.lang === "it" ? "ricerca attiva" : "search active"}` : ""}</p>
    </article>
    <article class="accounting-analysis-card">
      <span class="panel-eyebrow">${state.lang === "it" ? "Valore ordini" : "Order value"}</span>
      <strong>${formatCurrency(totalValue)}</strong>
      <p>${state.lang === "it" ? "Totale lordo della vista corrente." : "Gross total in the current view."}</p>
    </article>
    <article class="accounting-analysis-card">
      <span class="panel-eyebrow">${state.lang === "it" ? "Incassato reale" : "Collected"}</span>
      <strong>${formatCurrency(collectedTotal)}</strong>
      <p>${state.lang === "it" ? `${settledCount} ordini già chiusi contabilmente.` : `${settledCount} orders already settled.`}</p>
    </article>
    <article class="accounting-analysis-card accent">
      <span class="panel-eyebrow">${state.lang === "it" ? "Residuo aperto" : "Open balance"}</span>
      <strong>${formatCurrency(openTotal)}</strong>
      <p>${state.lang === "it" ? `Media ${formatCurrency(averageOpen)} · ${invoicePending} da fatturare` : `Average ${formatCurrency(averageOpen)} · ${invoicePending} to invoice`}</p>
    </article>
  `;
}

function renderDdtPreview(order) {
  if (!ui.ddtItemsPreview) return;
  if (!order) {
    ui.ddtItemsPreview.innerHTML = `<div class="info-card">${state.lang === "it" ? "Seleziona un ordine in Spedizioni per preparare il DDT con gli articoli fisici del bancale." : "Select an order in Shipping to prepare the DDT with the pallet's physical items."}</div>`;
    return;
  }
  const ddt = getCurrentDdtDraft(order);
  const physicalLines = getWarehousePreparedLines(order);
  const estimate = calculateShippingEstimate(order, ddt);
  const destination = getShippingDestination(order);
  const shopifyOrderDate = formatDate(order.createdAt || order.updatedAt || new Date().toISOString());
  ui.ddtItemsPreview.innerHTML = `
    <div class="detail-grid">
      ${renderDetailBox({
        label: t("shippingAddress"),
        value: composeClientName(order),
        meta: `${composeAddress(order) || addressIncompleteText()} · ${destination.provinceCode || provinceIncompleteText()} · ${order.phone ? `${order.phone} · ${phoneNoticeText().toUpperCase()}` : phoneIncompleteText()}`,
      })}
      ${renderDetailBox({
        label: state.lang === "it" ? "Data ordine Shopify" : "Shopify order date",
        value: shopifyOrderDate,
        meta: String(order.source || "").toLowerCase().startsWith("shopify")
          ? (state.lang === "it" ? "Data acquisita dallo store Shopify" : "Date pulled from Shopify store")
          : (state.lang === "it" ? "Data ordine registrata nel gestionale" : "Order date registered in the app"),
      })}
      ${renderDetailBox({
        label: t("palletLabel"),
        value: formatPalletDimensions(ddt),
        meta: `${state.lang === "it" ? "Peso" : "Weight"} ${ddt.palletWeight || "—"} · ${getShippingTargetLabel(order)}`,
      })}
      ${renderDetailBox({
        label: t("carrierEstimate"),
        value: estimate.configured ? formatCurrency(estimate.estimatedCost) : "—",
        meta: estimate.mode === "oneexpress-auto"
          ? `${estimate.palletClass || "—"} · ${estimate.region || (state.lang === "it" ? "Provincia mancante" : "Missing province")}`
          : (estimate.configured ? `${t("billableWeight")}: ${estimate.billableWeight || 0} kg` : t("noRateConfigured")),
      })}
      ${renderDetailBox({
        label: t("ddtReady"),
        value: physicalLines.length ? `${physicalLines.length} ${state.lang === "it" ? "righe merce" : "goods rows"}` : "0",
        meta: physicalLines.length
          ? (state.lang === "it" ? "Righe fisiche selezionate per preparazione e DDT." : "Physical lines selected for prep and DDT.")
          : (state.lang === "it" ? "Nessuna merce fisica selezionata" : "No physical goods selected"),
      })}
    </div>
    ${physicalLines.length ? `
      <ul class="material-list compact-list">
        ${physicalLines.map((item) => `<li><span>${escapeHtml(item.title)}${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</span><strong>x${item.quantity}</strong></li>`).join("")}
      </ul>
    ` : `<div class="info-card">${state.lang === "it" ? "Questo ordine non ha articoli fisici da riportare nel DDT." : "This order has no physical items to include in the DDT."}</div>`}
  `;
}

function renderShippingMaterialPreview(order) {
  if (!ui.shippingMaterialPreview) return;
  if (!order) {
    ui.shippingMaterialPreview.innerHTML = `<div class="info-card">${state.lang === "it" ? "Seleziona un ordine per vedere subito cosa deve partire, in che formato e con quale priorità di preparazione." : "Select an order to immediately see what has to leave, in which format, and with what prep priority."}</div>`;
    return;
  }
  const preparedLines = getWarehousePreparedLines(order);
  const physicalLines = preparedLines.filter((item) => !isServiceLine(item.title));
  const routeLabel = getShippingTargetLabel(order);
  const urgencyTone = order.operations?.warehouse?.readyToShip ? "is-ready" : "is-pending";
  const materialSummary = physicalLines.length
    ? physicalLines.map((item) => `
      <li class="shipping-material-line">
        <div>
          <span>${escapeHtml(item.title)}</span>
        </div>
        <strong>x${escapeHtml(item.quantity)}</strong>
      </li>
    `).join("")
    : `<li class="shipping-material-line is-empty"><div><span>${state.lang === "it" ? "Nessuna riga materiale pronta" : "No prepared material lines"}</span><small>${state.lang === "it" ? "Compila la preparazione ufficio prima di creare il bancale." : "Complete office prep before building the pallet."}</small></div><strong>—</strong></li>`;

  ui.shippingMaterialPreview.innerHTML = `
    <div class="shipping-material-hero ${urgencyTone}">
      <div>
        <span class="panel-eyebrow">${state.lang === "it" ? "Merce da preparare" : "Goods to prepare"}</span>
        <strong>${physicalLines.length} ${state.lang === "it" ? "righe materiali" : "material lines"}</strong>
        <p>${routeLabel}</p>
      </div>
      <div class="shipping-material-badges">
        <span class="search-pill compact-pill">${order.operations?.product || undefinedText()}</span>
        <span class="search-pill compact-pill">${order.operations?.sqm || 0} mq</span>
      </div>
    </div>
    <ul class="material-list compact-list shipping-material-list">
      ${materialSummary}
    </ul>
  `;
}

function refreshShippingDraftPreview() {
  if (state.currentView !== "shipping") return;
  const order = getSelectedOrder();
  if (!order) return;
  if (ui.shippingEstimate) {
    ui.shippingEstimate.innerHTML = buildShippingEstimate(order);
  }
  renderDdtPreview(order);
}

function getInstallationWeekStart() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset + (state.installationWeekOffset * 7));
  return start;
}

function getInstallationWeekKeys() {
  const start = getInstallationWeekStart();
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function isInstallationInCurrentWeek(order) {
  const installDate = String(order.operations?.installation?.installDate || "");
  if (!installDate) return false;
  return getInstallationWeekKeys().includes(installDate);
}

function getInstallationWeekOffsetForDate(dateValue) {
  if (!dateValue) return 0;
  const installDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(installDate.getTime())) return 0;
  installDate.setHours(0, 0, 0, 0);
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + mondayOffset);
  const diffMs = installDate.getTime() - base.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function getPreferredCrewInstallationOrder(orders = []) {
  const scheduled = orders
    .filter((order) => String(order.operations?.installation?.installDate || "").trim())
    .sort((left, right) => String(left.operations?.installation?.installDate || "").localeCompare(String(right.operations?.installation?.installDate || "")));
  const todayKey = new Date().toISOString().slice(0, 10);
  return scheduled.find((order) => String(order.operations?.installation?.installDate || "") >= todayKey)
    || scheduled[0]
    || orders[0]
    || null;
}

function clearInstallationDetail() {
  if (ui.installationDetailSummary) ui.installationDetailSummary.innerHTML = "";
  if (ui.installationForm?.installDate) ui.installationForm.installDate.value = "";
  if (ui.installationForm?.installTime) ui.installationForm.installTime.value = "";
  if (ui.installationForm?.status) ui.installationForm.status.value = "da-pianificare";
  if (ui.installationCrew) ui.installationCrew.innerHTML = buildInstallationCrewOptions("");
  if (ui.installationForm?.reportNote) ui.installationForm.reportNote.value = "";
  if (ui.installationAttachments) ui.installationAttachments.innerHTML = `<div class="info-card">${state.lang === "it" ? "Nessun allegato caricato." : "No attachments uploaded."}</div>`;
  if (ui.installationExpenseForm) {
    ui.installationExpenseForm.reset();
    if (ui.installationExpenseForm.date) ui.installationExpenseForm.date.value = new Date().toISOString().slice(0, 10);
  }
  if (ui.installationExpenseSummary) ui.installationExpenseSummary.innerHTML = "";
  if (ui.installationExpenseList) ui.installationExpenseList.innerHTML = `<div class="info-card">${state.lang === "it" ? "Nessuna spesa registrata su questo ordine." : "No crew expenses registered for this order."}</div>`;
  clearStatus(ui.installationExpenseStatus);
  clearStatus(ui.installationStatus);
}

function getInstallationSaturationTone(ratio = 0) {
  if (ratio >= 0.9) return "gauge-high";
  if (ratio >= 0.65) return "gauge-mid";
  return "gauge-low";
}

function getInstallationCapacityBadgeCopy(ratio = 0) {
  if (ratio >= 0.9) return state.lang === "it" ? "Rosso" : "Red";
  if (ratio >= 0.65) return state.lang === "it" ? "Giallo" : "Yellow";
  return state.lang === "it" ? "Verde" : "Green";
}

function buildInstallationCrewFilterButtons() {
  const forcedCrew = getCrewForCurrentUser();
  const crewNames = getInstallationCrewNames();
  const filters = forcedCrew ? [forcedCrew] : ["all", ...crewNames];
  const active = forcedCrew || state.filters.installation || "all";
  return filters.map((filterValue) => {
    const isAll = filterValue === "all";
    const label = isAll ? t("allCrews") : filterValue;
    const activeClass = active === filterValue ? "is-active" : "";
    return `<button class="filter-btn ${activeClass}" type="button" data-action="set-installation-crew-filter" data-installation-filter="${escapeHtml(filterValue)}">${escapeHtml(label)}</button>`;
  }).join("");
}

function getInstallationExpensesForMonth(monthKey = new Date().toISOString().slice(0, 7)) {
  return state.orders.flatMap((order) => getTravelExpensesForOrder(order)
    .filter((expense) => String(expense.date || "").slice(0, 7) === monthKey)
    .map((expense) => ({ ...expense, order })));
}

function renderInstallationExpenseSection(order) {
  const expenses = getTravelExpensesForOrder(order).slice().sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  const total = expenses.reduce((sum, item) => sum + toNumber(item.amount || 0), 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses
    .filter((item) => String(item.date || "").slice(0, 7) === monthKey)
    .reduce((sum, item) => sum + toNumber(item.amount || 0), 0);
  const byCategory = Object.keys(TRAVEL_EXPENSE_TYPES).map((key) => ({
    key,
    amount: expenses
      .filter((item) => item.category === key)
      .reduce((sum, item) => sum + toNumber(item.amount || 0), 0),
  })).filter((item) => item.amount > 0);
  if (ui.installationExpenseForm?.date && !ui.installationExpenseForm.date.value) {
    ui.installationExpenseForm.date.value = new Date().toISOString().slice(0, 10);
  }
  if (ui.installationExpenseSummary) {
    ui.installationExpenseSummary.innerHTML = [
      {
        label: state.lang === "it" ? "Totale commessa" : "Job total",
        value: formatCurrency(total),
        meta: `${expenses.length} ${state.lang === "it" ? "spese registrate" : "logged expenses"}`,
      },
      {
        label: state.lang === "it" ? "Totale mese corrente" : "Current month",
        value: formatCurrency(monthTotal),
        meta: monthKey,
      },
      {
        label: state.lang === "it" ? "Categorie attive" : "Active categories",
        value: String(byCategory.length || 0),
        meta: byCategory.map((item) => `${getTravelExpenseLabel(item.key)} ${formatCurrency(item.amount)}`).join(" · ") || "—",
      },
    ].map(renderDetailBox).join("");
  }
  if (ui.installationExpenseList) {
    ui.installationExpenseList.innerHTML = expenses.length
      ? expenses.map((expense) => `
        <article class="detail-box crew-expense-card">
          <div class="crew-expense-head">
            <strong>${escapeHtml(getTravelExpenseLabel(expense.category))}</strong>
            <span>${formatCurrency(expense.amount)}</span>
          </div>
          <p>${escapeHtml(expense.note || (state.lang === "it" ? "Nessuna nota" : "No note"))}</p>
          <div class="crew-expense-meta">
            <span>${escapeHtml(expense.crew || order.operations?.installation?.crew || (state.lang === "it" ? "Squadra non assegnata" : "Crew not assigned"))}</span>
            <span>${escapeHtml(formatDate(expense.date))}</span>
            ${expense.createdBy ? `<span>${escapeHtml(expense.createdBy)}</span>` : ""}
          </div>
          <button class="ghost-button small-button" type="button" data-action="remove-installation-expense" data-id="${escapeHtml(order.id)}" data-expense-id="${escapeHtml(expense.id)}">
            ${state.lang === "it" ? "Rimuovi spesa" : "Remove expense"}
          </button>
        </article>
      `).join("")
      : `<div class="info-card">${state.lang === "it" ? "Nessuna spesa registrata su questo ordine." : "No crew expenses registered for this order."}</div>`;
  }
}

function renderCrewExpenseMonthlyReport() {
  if (!ui.crewExpenseMonthlyReport) return;
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthLabel = formatMonthKey(monthKey);
  const items = getInstallationExpensesForMonth(monthKey);
  if (!items.length) {
    ui.crewExpenseMonthlyReport.innerHTML = `<div class="info-card">${state.lang === "it" ? `Nessuna spesa squadra registrata in ${monthLabel}.` : `No crew expenses recorded in ${monthLabel}.`}</div>`;
    return;
  }
  const crewMap = new Map();
  const orderMap = new Map();
  const categoryMap = new Map();
  items.forEach((item) => {
    const crewLabel = item.crew || item.order.operations?.installation?.crew || (state.lang === "it" ? "Senza squadra" : "Unassigned");
    const existing = crewMap.get(crewLabel) || { total: 0, orders: new Map() };
    existing.total += toNumber(item.amount || 0);
    const orderKey = item.order.id;
    const orderEntry = existing.orders.get(orderKey) || {
      label: `${composeClientName(item.order)} · ${getOrderNumber(item.order)}`,
      total: 0,
    };
    orderEntry.total += toNumber(item.amount || 0);
    existing.orders.set(orderKey, orderEntry);
    crewMap.set(crewLabel, existing);

    const orderSummary = orderMap.get(orderKey) || {
      label: `${composeClientName(item.order)} · ${getOrderNumber(item.order)}`,
      total: 0,
      crews: new Set(),
      count: 0,
    };
    orderSummary.total += toNumber(item.amount || 0);
    orderSummary.count += 1;
    orderSummary.crews.add(crewLabel);
    orderMap.set(orderKey, orderSummary);

    const categoryKey = item.category || "other";
    categoryMap.set(categoryKey, (categoryMap.get(categoryKey) || 0) + toNumber(item.amount || 0));
  });
  const total = items.reduce((sum, item) => sum + toNumber(item.amount || 0), 0);
  const categoryCopy = [...categoryMap.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, amount]) => `${getTravelExpenseLabel(key)} ${formatCurrency(amount)}`)
    .join(" · ");

  const crewCards = [...crewMap.entries()]
    .sort((left, right) => right[1].total - left[1].total)
    .map(([crewLabel, summary]) => `
      <article class="detail-box crew-expense-report-card">
        <div class="crew-expense-head">
          <strong>${escapeHtml(crewLabel)}</strong>
          <span>${formatCurrency(summary.total)}</span>
        </div>
        <p>${summary.orders.size} ${state.lang === "it" ? "commesse con spese" : "jobs with expenses"} · ${monthLabel}</p>
        <div class="crew-expense-order-list">
          ${[...summary.orders.values()]
            .sort((left, right) => right.total - left.total)
            .map((entry) => `<div class="crew-expense-order-line"><span>${escapeHtml(entry.label)}</span><strong>${formatCurrency(entry.total)}</strong></div>`)
            .join("")}
        </div>
      </article>
    `).join("");

  const orderCards = [...orderMap.values()]
    .sort((left, right) => right.total - left.total)
    .map((entry) => `
      <article class="detail-box crew-expense-report-card">
        <div class="crew-expense-head">
          <strong>${escapeHtml(entry.label)}</strong>
          <span>${formatCurrency(entry.total)}</span>
        </div>
        <p>${entry.crews.size} ${state.lang === "it" ? "squadre coinvolte" : "crews involved"} · ${entry.count} ${state.lang === "it" ? "spese" : "expenses"}</p>
        <div class="crew-expense-meta">
          ${[...entry.crews].map((crewLabel) => `<span>${escapeHtml(crewLabel)}</span>`).join("")}
        </div>
      </article>
    `).join("");

  ui.crewExpenseMonthlyReport.innerHTML = `
    <div class="crew-expense-summary-grid">
      ${[
        {
          label: state.lang === "it" ? "Mese attivo" : "Active month",
          value: monthLabel,
          meta: `${items.length} ${state.lang === "it" ? "spese registrate" : "recorded expenses"}`,
        },
        {
          label: state.lang === "it" ? "Totale trasferte" : "Travel total",
          value: formatCurrency(total),
          meta: `${crewMap.size} ${state.lang === "it" ? "squadre" : "crews"} · ${orderMap.size} ${state.lang === "it" ? "commesse" : "jobs"}`,
        },
        {
          label: state.lang === "it" ? "Categorie" : "Categories",
          value: String(categoryMap.size),
          meta: categoryCopy || "—",
        },
      ].map(renderDetailBox).join("")}
    </div>
    <div class="crew-expense-report-grid">
      <section class="crew-expense-panel">
        <div class="crew-expense-panel-head">
          <p class="panel-eyebrow">${state.lang === "it" ? "Per squadra" : "By crew"}</p>
          <h4>${state.lang === "it" ? "Totali team" : "Team totals"}</h4>
        </div>
        <div class="detail-stack">
          ${crewCards}
        </div>
      </section>
      <section class="crew-expense-panel">
        <div class="crew-expense-panel-head">
          <p class="panel-eyebrow">${state.lang === "it" ? "Per commessa" : "By job"}</p>
          <h4>${state.lang === "it" ? "Ordini del mese" : "Monthly jobs"}</h4>
        </div>
        <div class="detail-stack">
          ${orderCards}
        </div>
      </section>
    </div>
  `;
}

function buildInstallationCalendar(orders, crewName = "") {
  const start = getInstallationWeekStart();
  const dailyCapacity = getInstallationCapacityForScope(crewName);
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const items = orders.filter((order) => String(order.operations?.installation?.installDate || "") === key);
    const totalSqm = items.reduce((sum, order) => sum + toNumber(order.operations?.sqm || 0), 0);
    const fillRatio = dailyCapacity > 0 ? totalSqm / dailyCapacity : 0;
    const fillPct = Math.min(100, Math.round(fillRatio * 100));
    const gaugeTone = getInstallationSaturationTone(fillRatio);
    const unavailable = Boolean(crewName && isCrewUnavailable(crewName, key));
    return `
      <article class="cal-day ${unavailable ? "is-unavailable" : ""}" data-date="${key}" data-drop-date="${key}">
        <div class="cal-day-header">
          <div class="cal-day-date">${formatDate(key)}</div>
          <div class="cal-day-capacity">${Math.round(totalSqm)}/${Math.round(dailyCapacity)} mq</div>
          <div class="cal-capacity-pill ${gaugeTone}">${getInstallationCapacityBadgeCopy(fillRatio)}</div>
        </div>
        <div class="cal-gauge"><div class="cal-gauge-fill ${gaugeTone}" style="width:${fillPct}%"></div></div>
        ${crewName ? `
          <button class="cal-unavailable-btn ${unavailable ? "is-active" : ""}" type="button" data-action="toggle-crew-unavailable" data-date="${key}">
            ${unavailable ? (state.lang === "it" ? "Non disponibile" : "Unavailable") : (state.lang === "it" ? "Segna indisponibile" : "Mark unavailable")}
          </button>` : ""}
        ${items.length
          ? items.map((order) => `
            <button class="cal-item" data-action="select-order" data-id="${order.id}" data-view="installations">
              <strong>${composeClientName(order)} · ${getOrderNumber(order)}</strong>
              <span>${order.operations?.product || t("undefined")} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq</span>
            </button>
          `).join("")
          : `<div class="cal-empty">${state.lang === "it" ? "Nessuna posa" : "No installs"}</div>`}
      </article>
    `;
  }).join("");
}

function renderInstallations() {
  const isCrewView = state.currentUser?.role === "crew";
  const crewName = isCrewView ? getCrewForCurrentUser() : "";
  const activeCrewFilter = getActiveInstallationCrewFilter();
  const calendarCrewScope = activeCrewFilter || crewName;
  let orders = filterInstallations();
  if (!isCrewView && activeCrewFilter) {
    state.selectedInstallationCrew = activeCrewFilter;
  }
  if (isCrewView && orders.length) {
    const currentWeekMatches = orders.filter(isInstallationInCurrentWeek);
    if (!currentWeekMatches.length) {
      const preferredOrder = getPreferredCrewInstallationOrder(orders);
      const preferredDate = preferredOrder?.operations?.installation?.installDate || "";
      if (preferredDate) {
        state.installationWeekOffset = getInstallationWeekOffsetForDate(preferredDate);
      }
    }
  }
  const weekOrders = orders.filter(isInstallationInCurrentWeek);
  const backlogOrders = orders.filter((order) => !isInstallationInCurrentWeek(order));
  const listOrders = isCrewView ? orders : backlogOrders;
  if (ui.installationCrewField) ui.installationCrewField.classList.toggle("hidden", isCrewView);
  if (ui.installationEmailButton) ui.installationEmailButton.classList.toggle("hidden", isCrewView);
  if (ui.installationSubmitButton) ui.installationSubmitButton.textContent = isCrewView
    ? (state.lang === "it" ? "Salva aggiornamento cantiere" : "Save site update")
    : (state.lang === "it" ? "Salva posa" : "Save installation");
  if (ui.installationCrewFilters) {
    ui.installationCrewFilters.innerHTML = buildInstallationCrewFilterButtons();
    ui.installationCrewFilters.classList.toggle("hidden", isCrewView);
  }
  if (ui.installationCapacityHint) {
    const capacityValue = Math.round(getInstallationCapacityForScope(calendarCrewScope));
    const crewCount = getInstallationCrewNames().length;
    ui.installationCapacityHint.textContent = calendarCrewScope
      ? `${calendarCrewScope} · ${capacityValue} mq/${state.lang === "it" ? "giorno" : "day"}`
      : `${crewCount} ${state.lang === "it" ? "squadre attive" : "active crews"} · ${capacityValue} mq/${state.lang === "it" ? "giorno complessivi" : "day total"}`;
  }
  const sectionTitle = document.querySelector("#installations .section-title");
  if (sectionTitle) {
    sectionTitle.textContent = isCrewView
      ? (state.lang === "it" ? "Le tue pose" : "Your installs")
      : (state.lang === "it" ? "Da pianificare (backlog)" : "To schedule (backlog)");
  }
  getSelectedInstallationCrew();
  renderInstallationsCoverage();
  if (ui.installationCalendar) {
    ui.installationCalendar.innerHTML = buildInstallationCalendar(orders, calendarCrewScope);
  }
  if (ui.installationPrevWeekButton) {
    const start = getInstallationWeekStart();
    ui.installationPrevWeekButton.dataset.weekStart = start.toISOString().slice(0, 10);
  }
  if (ui.installationNextWeekButton) {
    const start = getInstallationWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    ui.installationNextWeekButton.dataset.weekEnd = end.toISOString().slice(0, 10);
  }
  ui.installationList.innerHTML = listOrders.length
    ? listOrders.map((order) => {
        const selected = order.id === state.selectedOrderId ? "selected" : "";
        const install = order.operations?.installation || {};
        const detailLabel = install.installDate
          ? `${formatDate(install.installDate)}${install.installTime ? ` · ${install.installTime}` : ""}`
          : (state.lang === "it" ? "Da pianificare" : "To schedule");
        const badgeLabel = install.installDate
          ? (state.lang === "it" ? "Programmato" : "Scheduled")
          : t("toPlan");
        const crewBadge = install.crew || (state.lang === "it" ? "Squadra da assegnare" : "Crew to assign");
        return `
          <article class="order-row installation-row ${selected} ${!isCrewView ? "is-draggable" : ""}" data-action="select-order" data-id="${order.id}" data-view="installations" ${!isCrewView ? `draggable="true" data-installation-drag-id="${order.id}"` : ""}>
            <div>
              <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
              <div class="order-meta">${order.operations?.product || t("undefined")} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq · ${composeAddress(order) || addressIncompleteText()}</div>
            </div>
            <div class="order-type-badge type-posa">${escapeHtml(crewBadge)}</div>
            <div class="order-amount">${detailLabel}</div>
            <div class="action-badge ${install.installDate ? "badge-info" : "badge-warning"}">${badgeLabel}</div>
          </article>
        `;
      }).join("")
    : `<div class="info-card">${isCrewView
      ? (state.lang === "it" ? "Nessuna posa assegnata a questa squadra." : "No installs assigned to this crew.")
      : (state.lang === "it" ? "Nessuna posa in backlog per la settimana selezionata." : "No backlog installs for the selected week.")}</div>`;

  const order = orders.find((item) => item.id === state.selectedOrderId) || weekOrders[0] || listOrders[0] || null;
  if (state.currentView === "installations" && order && order.id !== state.selectedOrderId) state.selectedOrderId = order.id;
  if (!order) {
    state.selectedOrderId = null;
    ui.installationDetailTitle.textContent = t("noSelection");
    if (ui.installationDetailMeta) {
      ui.installationDetailMeta.textContent = isCrewView
        ? (state.lang === "it" ? "Dettaglio operativo cantiere" : "Site operations detail")
        : t("installationPlanningDetail");
    }
    clearInstallationDetail();
    updateInstallationPaneVisibility();
    return;
  }
  if (!state.selectedInstallationCrew && order.operations?.installation?.crew) {
    state.selectedInstallationCrew = order.operations.installation.crew;
  }
  renderInstallationsCoverage();
  ui.installationDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  if (ui.installationDetailMeta) {
    ui.installationDetailMeta.textContent = isCrewView
      ? `${order.operations?.product || undefinedText()} · ${composeAddress(order) || addressIncompleteText()}`
      : t("installationPlanningDetail");
  }
  if (ui.installationDetailSummary) {
    const summaryCards = isCrewView
      ? [
          { label: state.lang === "it" ? "Prodotto" : "Product", value: order.operations?.product || undefinedText(), meta: `${order.operations?.sqm || 0} mq · ${order.operations?.surface || (state.lang === "it" ? "terra" : "ground")}` },
          { label: state.lang === "it" ? "Cantiere" : "Site", value: composeAddress(order) || addressIncompleteText(), meta: composeClientName(order) },
          { label: state.lang === "it" ? "Programmazione" : "Schedule", value: order.operations?.installation?.installDate ? formatDate(order.operations.installation.installDate) : t("installationDatePending"), meta: order.operations?.installation?.installTime || t("timePending") },
          { label: state.lang === "it" ? "Stato cantiere" : "Site status", value: getUnifiedOrderStage(order).label, meta: String(order.operations?.installation?.status || "").trim() || t("updateNeeded") },
          { label: state.lang === "it" ? "Materiale in uscita" : "Outbound goods", value: getShippingTargetLabel(order), meta: getShippingSummary(order) },
        ]
      : [
          { label: state.lang === "it" ? "Prodotto" : "Product", value: order.operations?.product || undefinedText(), meta: `${order.operations?.sqm || 0} mq · ${order.operations?.surface || (state.lang === "it" ? "terra" : "ground")}` },
          { label: state.lang === "it" ? "Cliente" : "Customer", value: composeClientName(order), meta: composeAddress(order) || addressIncompleteText() },
          { label: state.lang === "it" ? "Preparazione ufficio" : "Office preparation", value: getShippingTargetLabel(order), meta: getShippingSummary(order) },
          { label: state.lang === "it" ? "Gestione logistica" : "Logistics handling", value: getShippingModeLabel(order), meta: order.operations?.installation?.installDate ? `${formatDate(order.operations.installation.installDate)} · ${order.operations?.installation?.installTime || t("timePending")}` : t("installationDatePending") },
        ];
    ui.installationDetailSummary.innerHTML = summaryCards.map(renderDetailBox).join("");
  }
  ui.installationForm.installDate.value = order.operations?.installation?.installDate || "";
  ui.installationForm.installTime.value = order.operations?.installation?.installTime || "";
  if (ui.installationForm.status) {
    ui.installationForm.status.value = order.operations?.installation?.status || (order.operations?.installation?.installDate ? "programmata" : "da-pianificare");
  }
  if (ui.installationCrew) {
    ui.installationCrew.innerHTML = buildInstallationCrewOptions(order.operations?.installation?.crew || "");
    ui.installationCrew.value = getCrewForCurrentUser() || order.operations?.installation?.crew || "";
    ui.installationCrew.disabled = state.currentUser?.role === "crew";
  }
  ui.installationForm.reportNote.value = order.operations?.installation?.reportNote || "";
  if (ui.installationForm.reportNote) {
    ui.installationForm.reportNote.placeholder = isCrewView
      ? (state.lang === "it" ? "Accesso, arrivo squadra, avanzamento, problemi, fine lavori..." : "Access, crew arrival, progress, issues, completion...")
      : (state.lang === "it" ? "Accesso, riprogrammazione, note posa, report cantiere..." : "Access, rescheduling, install notes, site report...");
  }
  ui.installationAttachments.innerHTML = renderAttachmentGrid(mapAttachmentsForContext(order, "installation"), order.id);
  renderInstallationExpenseSection(order);
  clearStatus(ui.installationStatus);
  updateInstallationPaneVisibility();
}

function renderAccounting() {
  const orders = filterOrdersForView("accounting");
  renderAccountingModels();
  renderAccountingAnalysis(orders);
  ui.accountingList.innerHTML = orders.length
    ? orders.map((order) => {
        const selected = order.id === state.selectedOrderId ? "selected" : "";
        const openBalance = getOpenBalance(order);
        const billingHealth = getBillingCompleteness(order);
        const collected = Math.max(getShopifyPaidAmount(order), getInternalPaidAmount(order));
        const settled = openBalance <= 0 && collected > 0;
        return `
          <article class="order-row accounting-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="accounting">
            <div>
              <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
              <div class="order-meta">
                ${getPaymentLabel(order.financialStatus)} &middot; ${getEffectivePaymentMethod(order)} &middot; ${isShopifyPaid(order) ? t("importedFromShopify") : t("internalAccountingPending")}
                &middot; ${state.lang === "it" ? "Imponibile" : "Net"} ${getOrderNetDisplay(order)}
                &middot; ${state.lang === "it" ? "IVA" : "VAT"} ${getOrderTaxDisplay(order)}
                &middot; ${billingHealth.rowLabel}
              </div>
            </div>
            <div class="order-amount-stack">
              <div class="order-amount" style="color:${openBalance > 0 ? "#dc2626" : "#16a34a"}">${formatCurrency(openBalance)}</div>
              <div class="action-badge accounting-status-chip ${settled ? "badge-success" : "badge-urgent"}">${settled ? (state.lang === "it" ? "Pagato" : "Paid") : (state.lang === "it" ? "Da incassare" : "To collect")}</div>
            </div>
            <div class="action-badge ${billingHealth.tone}">${billingHealth.label}</div>
          </article>
        `;
      }).join("")
    : `<div class="info-card">${state.lang === "it" ? "Nessun ordine in contabilità con questo filtro." : "No accounting orders for this filter."}</div>`;

  const order = orders.find((item) => item.id === state.selectedOrderId) || orders[0] || null;
  if (state.currentView === "accounting" && order && order.id !== state.selectedOrderId) state.selectedOrderId = order.id;
  if (!order) {
    ui.accountingDetailTitle.textContent = t("noSelection");
    ui.accountingMeta.innerHTML = "";
    if (ui.accountingPaymentsEditor) ui.accountingPaymentsEditor.innerHTML = "";
    updateAccountingPaneVisibility();
    return;
  }
  if (needsShopifyFinancialRefresh(order)) {
    refreshOrderFromShopify(order.id);
  }
  ui.accountingDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  ui.accountingForm.paymentMethod.value = getEffectivePaymentMethod(order);
  ui.accountingForm.invoiceRequired.value = order.accounting?.invoiceRequired ? "yes" : "no";
  ui.accountingForm.invoiceIssued.value = order.accounting?.invoiceIssued ? "yes" : "no";
  ui.accountingForm.accountingNote.value = order.accounting?.accountingNote || "";
  renderAccountingPaymentEditor(order);

  const shopifyPaid = getShopifyPaidAmount(order);
  const internalPaid = getInternalPaidAmount(order);
  const openBalance = getOpenBalance(order);
  const isInstall = order.operations?.installation?.required;
  const grossTotal = getOrderGrossTotal(order);
  const totalPaid = shopifyPaid + internalPaid;
  const billingHealth = getBillingCompleteness(order);
  const billingDisplayName = getBillingDisplayName(order);
  const billingAddress = getBillingAddressLine(order);
  const billing = order.billing || {};
  const taxDisplay = getOrderTaxDisplay(order);
  const netDisplay = getOrderNetDisplay(order);
  const estimatedVat = isEstimatedVatDisplay(order);
  const refreshError = shopifyOrderRefreshErrors.get(order.id) || "";
  const taxRows = Array.isArray(order.lineDetails) ? order.lineDetails : [];
  const manualPayments = getAccountingPayments(order);

  const trancheRows = [];
  if (shopifyPaid > 0) {
    trancheRows.push({ type: state.lang === "it" ? "Acconto fornitura" : "Supply deposit", method: getEffectivePaymentMethod(order), amount: shopifyPaid, status: "received", source: "Shopify" });
  }
  manualPayments.forEach((payment) => {
    trancheRows.push({
      type: getAccountingPaymentTypeLabel(payment.type),
      method: payment.method || "—",
      amount: payment.amount,
      status: "received",
      source: `${state.lang === "it" ? "Interno" : "Internal"}${payment.date ? ` · ${formatDate(payment.date)}` : ""}`,
    });
  });
  if (openBalance > 0 && isInstall) {
    trancheRows.push({ type: state.lang === "it" ? "Saldo posa in opera" : "Install balance", method: "—", amount: openBalance, status: "pending", source: state.lang === "it" ? "Da incassare" : "To collect" });
  } else if (openBalance > 0) {
    trancheRows.push({ type: state.lang === "it" ? "Saldo fornitura" : "Supply balance", method: "—", amount: openBalance, status: "pending", source: state.lang === "it" ? "Da incassare" : "To collect" });
  }

  ui.accountingMeta.innerHTML = [
    `
      <div class="detail-section">
        <div class="detail-row"><span class="detail-row-label">${estimatedVat ? (state.lang === "it" ? "Imponibile stimato" : "Estimated net subtotal") : (state.lang === "it" ? "Imponibile ordine" : "Order net subtotal")}</span><span class="detail-row-value detail-row-value-mono" style="font-size:18px">${netDisplay}</span></div>
        <div class="detail-row"><span class="detail-row-label">${estimatedVat ? (state.lang === "it" ? "IVA stimata 22%" : "Estimated VAT 22%") : (state.lang === "it" ? "IVA totale" : "Total VAT")}</span><span class="detail-row-value detail-row-value-mono">${taxDisplay}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Totale ivato" : "Gross total"}</span><span class="detail-row-value detail-row-value-mono" style="font-size:18px">${formatCurrency(grossTotal)}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Stato Shopify" : "Shopify status"}</span><span class="detail-row-value">${getPaymentLabel(order.financialStatus)} · ${getFulfillmentLabel(order.fulfillmentStatus)}</span></div>
        <div class="detail-row"><span class="detail-row-label">${t("realResidual")}</span><span class="detail-row-value" style="color:${openBalance > 0 ? "#dc2626" : "#16a34a"};font-weight:800;font-size:16px">${formatCurrency(openBalance)}</span></div>
        ${shopifyOrderRefreshInFlight.has(order.id) ? `<div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Aggiornamento Shopify" : "Shopify refresh"}</span><span class="detail-row-value">${state.lang === "it" ? "Recupero importi reali dall'ordine Shopify..." : "Fetching exact totals from the Shopify order..."}</span></div>` : ""}
        ${refreshError ? `<div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Errore Shopify" : "Shopify error"}</span><span class="detail-row-value">${escapeHtml(refreshError)}</span></div>` : ""}
        ${estimatedVat ? `<div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Nota IVA" : "VAT note"}</span><span class="detail-row-value">${state.lang === "it" ? "Calcolata in fallback con aliquota standard 22% in attesa del dettaglio fiscale Shopify." : "Calculated with the standard 22% fallback while waiting for Shopify tax detail."}</span></div>` : ""}
      </div>
    `,
    `
      <div class="detail-section">
        <div class="detail-section-title">${state.lang === "it" ? "Pagamenti registrati" : "Recorded payments"}</div>
        <div class="tranche-list">
          ${trancheRows.map(row => `
            <div class="tranche-row">
              <span class="tranche-type">${row.type}</span>
              <span class="tranche-method">${row.source}</span>
              <span class="tranche-amount" style="font-family:'JetBrains Mono',monospace">${formatCurrency(row.amount)}</span>
              <span class="tranche-status ${row.status === "received" ? "badge-success" : "badge-warning"}">${row.status === "received" ? (state.lang === "it" ? "Ricevuto" : "Received") : (state.lang === "it" ? "In attesa" : "Pending")}</span>
            </div>
          `).join("")}
          ${trancheRows.length === 0 ? `<div class="info-card" style="padding:8px 12px;font-size:12px">${state.lang === "it" ? "Nessun pagamento registrato." : "No payments recorded."}</div>` : ""}
        </div>
        <button class="btn add-payment-btn" type="button" data-action="add-accounting-payment">${state.lang === "it" ? "+ Aggiungi pagamento" : "+ Add payment"}</button>
      </div>
    `,
    `
      <div class="detail-section">
        <div class="detail-section-title">${state.lang === "it" ? "Fatturazione" : "Invoicing"}</div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Verifica anagrafica" : "Billing profile check"}</span><span class="detail-row-value"><span class="action-badge ${billingHealth.tone}">${billingHealth.label}</span></span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Profilo fiscale" : "Fiscal profile"}</span><span class="detail-row-value">${billingHealth.profile === "business" ? (state.lang === "it" ? "Azienda / B2B" : "Business / B2B") : (state.lang === "it" ? "Privato / B2C" : "Private / B2C")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Intestazione" : "Billing name"}</span><span class="detail-row-value">${escapeHtml(billingDisplayName || "—")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Indirizzo fattura" : "Billing address"}</span><span class="detail-row-value">${escapeHtml(billingAddress || "—")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Partita IVA" : "VAT number"}</span><span class="detail-row-value detail-row-value-mono">${escapeHtml(billing.vatNumber || "—")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Codice fiscale" : "Tax code"}</span><span class="detail-row-value detail-row-value-mono">${escapeHtml(billing.taxCode || "—")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Codice SDI" : "SDI code"}</span><span class="detail-row-value detail-row-value-mono">${escapeHtml(billing.sdiCode || "—")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "PEC" : "PEC email"}</span><span class="detail-row-value">${escapeHtml(billing.pecEmail || "—")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Fattura richiesta" : "Invoice requested"}</span><span class="detail-row-value">${order.accounting?.invoiceRequired ? t("invoiceRequested") : t("invoiceNotRequested")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Fattura emessa" : "Invoice issued"}</span><span class="detail-row-value">${order.accounting?.invoiceIssued ? t("invoiceIssued") : (state.lang === "it" ? "No" : "No")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Esito" : "Status"}</span><span class="detail-row-value">${billingHealth.copy}</span></div>
      </div>
    `,
    `
      <div class="detail-section">
        <div class="detail-section-title">${state.lang === "it" ? "Imposte per articolo" : "Taxes by line item"}</div>
        <div class="detail-stack tax-detail-stack">
          ${taxRows.length
            ? taxRows.map((item) => {
                const lineTax = toNumber(item.taxAmount || 0);
                const lineNet = toNumber(item.totalPrice || 0);
                return `
                  <article class="tax-line-card">
                    <div class="tax-line-head">
                      <strong>${escapeHtml(item.title || (state.lang === "it" ? "Articolo" : "Item"))}</strong>
                      <span class="action-badge ${item.taxable ? "badge-info" : "badge-warning"}">${item.taxable ? (state.lang === "it" ? "Con imposta" : "Taxed") : (state.lang === "it" ? "Senza imposta" : "Untaxed")}</span>
                    </div>
                    <div class="tax-line-meta">${state.lang === "it" ? "Qta" : "Qty"} ${item.quantity || 1} · ${describeTaxStatus(item)}</div>
                    <div class="tax-line-values">
                      <span>${state.lang === "it" ? "Netto riga" : "Line net"} ${lineNet > 0 ? formatCurrency(lineNet) : "—"}</span>
                      <strong>${state.lang === "it" ? "IVA riga" : "Line tax"} ${lineTax > 0 ? formatCurrency(lineTax) : formatCurrency(0)}</strong>
                    </div>
                  </article>
                `;
              }).join("")
            : `<div class="info-card">${state.lang === "it" ? "Shopify non ha restituito il dettaglio imposte per questo ordine." : "Shopify did not return tax details for this order."}</div>`}
        </div>
      </div>
    `,
    order.accounting?.accountingNote ? `<div class="info-card"><strong>${t("accountingDetailSubtitle")}</strong><p>${order.accounting.accountingNote}</p></div>` : "",
  ].join("");
  updateAccountingPaneVisibility();
}

async function importShopifyPayment() {
  const order = getSelectedOrder();
  if (!order) return;
  const shopifyPaid = getShopifyPaidAmount(order);
  if (shopifyPaid <= 0) {
    window.alert(t("noShopifyPaymentToImport"));
    return;
  }

  const currentNote = String(order.accounting?.accountingNote || "").trim();
  const importedNote = t("shopifyImportedSuccess");
  const nextNote = currentNote.includes(importedNote)
    ? currentNote
    : [currentNote, importedNote].filter(Boolean).join(" · ");
  const existingPayments = getAccountingPayments(order);
  const alreadyImported = existingPayments.some((payment) => Math.abs(toNumber(payment.amount || 0) - shopifyPaid) <= 0.01);
  const nextPayments = alreadyImported
    ? existingPayments
    : [
        ...existingPayments,
        normalizeAccountingPaymentEntry({
          id: `shopify-import-${order.id}-${Date.now()}`,
          type: existingPayments.length ? "manual" : "balance",
          amount: shopifyPaid,
          method: order.paymentMethod || getEffectivePaymentMethod(order),
          date: new Date().toISOString().slice(0, 10),
        }, existingPayments.length, order.paymentMethod || getEffectivePaymentMethod(order)),
      ].filter(Boolean);
  const depositPaid = Number(nextPayments.filter((entry) => entry.type === "deposit").reduce((sum, entry) => sum + toNumber(entry.amount || 0), 0).toFixed(2));
  const balancePaid = Number(nextPayments.filter((entry) => entry.type !== "deposit").reduce((sum, entry) => sum + toNumber(entry.amount || 0), 0).toFixed(2));

  const updated = await apiFetch(`/api/orders/${order.id}/accounting`, {
    method: "POST",
    body: JSON.stringify({
      paymentMethod: order.paymentMethod || getEffectivePaymentMethod(order),
      depositPaid,
      balancePaid,
      payments: nextPayments,
      invoiceRequired: order.accounting?.invoiceRequired,
      invoiceIssued: order.accounting?.invoiceIssued,
      accountingNote: nextNote,
    }),
  });

  state.orders = state.orders.map((item) => (item.id === updated.id ? updated : item));
  renderAccounting();
}

function buildShippingEstimate(order) {
  const ddt = getCurrentDdtDraft(order);
  const dimensions = formatPalletDimensions(ddt);
  const carrier = getShippingModeLabel(order);
  const estimate = calculateShippingEstimate(order, ddt);

  if (estimate.mode === "oneexpress-auto") {
    const destinationLabel = estimate.provinceCode
      ? `${estimate.provinceCode} · ${estimate.region || estimate.province || "Italia"}`
      : (state.lang === "it" ? "Provincia destinazione mancante" : "Missing destination province");
    const profileLabel = estimate.profile === "silver" ? "Silver" : "Gold";
    const note = estimate.unsupported
      ? estimate.missingReason === "missing_destination"
        ? (state.lang === "it" ? "Inserisci o sincronizza la provincia di destinazione per attivare il listino automatico." : "Add or sync the destination province to enable the automatic tariff table.")
        : estimate.missingReason === "unsupported_pallet"
          ? (state.lang === "it" ? "Misure o peso fuori dai limiti automatici One Express (max 240x160x240 cm e 1800 kg)." : "Dimensions or weight exceed automatic One Express limits.")
          : (state.lang === "it" ? "Tariffa non trovata per destinazione o profilo selezionato." : "No tariff found for the selected destination or profile.")
      : estimate.finalMultiplier > 1
        ? `${state.lang === "it" ? "Riprezzamento applicato" : "Repricing applied"} · x${estimate.finalMultiplier.toFixed(2)}`
        : (state.lang === "it" ? "Tariffa standard senza maggiorazioni." : "Standard tariff without repricing.");
    return `
      <div class="ship-calc">
        <div class="ship-calc-title">${state.lang === "it" ? "Stima One Express" : "One Express estimate"}</div>
        <div class="ship-calc-grid">
          <div class="ship-calc-item">
            <span>${state.lang === "it" ? "Destinazione" : "Destination"}</span>
            <strong>${destinationLabel}</strong>
          </div>
          <div class="ship-calc-item">
            <span>${state.lang === "it" ? "Classe pallet" : "Pallet class"}</span>
            <strong>${estimate.palletClass || "—"}</strong>
          </div>
          <div class="ship-calc-item">
            <span>${state.lang === "it" ? "Profilo" : "Profile"}</span>
            <strong>${profileLabel}</strong>
          </div>
        </div>
        <div class="ship-calc-grid ship-calc-grid-secondary">
          <div class="ship-calc-item">
            <span>${state.lang === "it" ? "Peso reale" : "Actual weight"}</span>
            <strong>${estimate.realWeight ? `${estimate.realWeight} kg` : "—"}</strong>
          </div>
          <div class="ship-calc-item">
            <span>${state.lang === "it" ? "Tariffa base" : "Base tariff"}</span>
            <strong>${estimate.baseRate ? formatCurrency(estimate.baseRate) : "—"}</strong>
          </div>
          <div class="ship-calc-item">
            <span>${state.lang === "it" ? "Tempi resa" : "Transit time"}</span>
            <strong>${estimate.resa || "—"}</strong>
          </div>
        </div>
        <div class="ship-calc-result">
          <div>
            <span class="label">${state.lang === "it" ? "Vettore" : "Carrier"}</span>
            <strong>${carrier} · ${profileLabel}</strong>
            <small>${dimensions} · ${note}</small>
          </div>
          <div class="price">${estimate.configured ? formatCurrency(estimate.estimatedCost) : "—"}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="ship-calc">
      <div class="ship-calc-title">${t("carrierEstimate")}</div>
      <div class="ship-calc-grid">
        <div class="ship-calc-item">
          <span>${t("realWeight")}</span>
          <strong>${estimate.realWeight ? `${estimate.realWeight} kg` : "—"}</strong>
        </div>
        <div class="ship-calc-item">
          <span>${t("volumetricWeight")}</span>
          <strong>${estimate.volumetricWeight ? `${estimate.volumetricWeight} kg` : "—"}</strong>
        </div>
        <div class="ship-calc-item">
          <span>${t("billableWeight")}</span>
          <strong>${estimate.billableWeight ? `${estimate.billableWeight} kg` : "—"}</strong>
        </div>
      </div>
      <div class="ship-calc-result">
        <div>
          <span class="label">${state.lang === "it" ? "Vettore" : "Carrier"}</span>
          <strong>${estimate.configured ? carrier : t("noRateConfigured")}</strong>
          <small>${dimensions}</small>
        </div>
        <div class="price">${estimate.configured && estimate.billableWeight > 0 ? formatCurrency(estimate.estimatedCost) : "—"}</div>
      </div>
    </div>
  `;
}

function getShippingQueueGroupMeta(mode) {
  if (mode === "corriere") {
    return {
      key: "corriere",
      title: state.lang === "it" ? "Ordini corriere" : "Courier orders",
      copy: state.lang === "it" ? "Merce da bancalare e affidare al vettore." : "Goods to palletize and hand to the carrier.",
    };
  }
  if (mode === "ritiro") {
    return {
      key: "ritiro",
      title: state.lang === "it" ? "Ordini ritiro" : "Pickup orders",
      copy: state.lang === "it" ? "Merce pronta in sede per ritiro cliente." : "Goods ready at HQ for customer pickup.",
    };
  }
  if (mode === "furgone") {
    return {
      key: "furgone",
      title: state.lang === "it" ? "Ordini furgone / posa" : "Van / installation orders",
      copy: state.lang === "it" ? "Merce da caricare sul furgone per uscita squadra." : "Goods to load on the van for crew departure.",
    };
  }
  return {
    key: "altro",
    title: state.lang === "it" ? "Ordini da definire" : "Orders to define",
    copy: state.lang === "it" ? "Flusso logistico ancora da completare." : "Logistics flow still to be completed.",
  };
}

function getShippingNextAction(order) {
  if (isLogisticsOrderCompleted(order)) {
    return state.lang === "it" ? "Uscita completata: resta solo verifica finale" : "Dispatch completed: only final verification remains";
  }
  if (isSampleOrder(order)) {
    if (!hasSampleLdvAttachment(order)) {
      return state.lang === "it" ? "Apri RDF e carica la LDV" : "Open RDF and upload the waybill";
    }
    if (!String(order.operations?.warehouse?.trackingNumber || "").trim()) {
      return state.lang === "it" ? "Inserisci il tracking SDA" : "Enter SDA tracking";
    }
    if (!order.operations?.warehouse?.shipped && !order.operations?.warehouse?.shippedAt) {
      return state.lang === "it" ? "Conferma box spedito" : "Confirm sample box shipped";
    }
    return state.lang === "it" ? "Verifica chiusura logistica" : "Verify logistics closure";
  }
  if (getWarehousePreparedLines(order).length === 0) {
    return state.lang === "it" ? "Completa le righe da preparare" : "Complete the preparation lines";
  }
  if (!order.operations?.warehouse?.preparationDate) {
    return state.lang === "it" ? "Definisci la data preparazione merce" : "Set the goods preparation date";
  }
  if (!order.operations?.warehouse?.ddt?.number && order.operations?.warehouse?.fulfillmentMode === "corriere") {
    return state.lang === "it" ? "Genera il DDT del bancale" : "Generate the pallet DDT";
  }
  if (!order.operations?.warehouse?.readyToShip) {
    return state.lang === "it" ? "Conferma merce pronta in uscita" : "Confirm goods ready to dispatch";
  }
  if (order.operations?.warehouse?.fulfillmentMode === "corriere" && !order.operations?.warehouse?.carrierPassed) {
    return state.lang === "it" ? "Affida il bancale al vettore" : "Hand the pallet to the carrier";
  }
  if (order.operations?.warehouse?.fulfillmentMode === "ritiro" && String(order.operations?.warehouse?.status || "").trim() !== "ritirato") {
    return state.lang === "it" ? "Consegna al cliente e chiudi il ritiro" : "Hand over to the customer and close pickup";
  }
  if (order.operations?.warehouse?.fulfillmentMode === "furgone" && String(order.operations?.warehouse?.status || "").trim() !== "ritirato") {
    return state.lang === "it" ? "Carica il furgone e marca uscita squadra" : "Load the van and mark crew departure";
  }
  return state.lang === "it" ? "Verifica chiusura logistica" : "Verify logistics closure";
}

function renderShippingQueueCard(order) {
  const selected = order.id === state.selectedOrderId ? "selected" : "";
  const sampleOrder = isSampleOrder(order);
  const mode = order.operations?.warehouse?.fulfillmentMode || "da-definire";
  const preparedLines = getWarehousePreparedLines(order);
  const prepSummary = preparedLines.length
    ? preparedLines.slice(0, 2).map((item) => `${item.title} x${item.quantity}`).join(" · ")
    : (state.lang === "it" ? "Preparazione ufficio da completare" : "Office prep still incomplete");
  const hiddenCount = Math.max(0, preparedLines.length - 2);
  const prepMeta = hiddenCount > 0
    ? `${prepSummary} · +${hiddenCount} ${state.lang === "it" ? "righe" : "lines"}`
    : prepSummary;
  const shipmentState = getShipmentStateLabel(order);
  const stage = getUnifiedOrderStage(order);
  const nextAction = getShippingNextAction(order);
  const routeLabel = getShippingModeLabel(order);
  const targetLabel = getShippingTargetLabel(order);
  const destination = composeAddress(order) || addressIncompleteText();
  const ddtOrSampleLabel = sampleOrder
    ? (hasSampleLdvAttachment(order)
      ? (state.lang === "it" ? "LDV allegata" : "Waybill attached")
      : (state.lang === "it" ? "LDV da caricare" : "Upload waybill"))
    : (order.operations?.warehouse?.ddt?.number || (state.lang === "it" ? "DDT da creare" : "DDT to create"));
  const badgeTone = stage.tone === "green"
    ? "badge-success"
    : stage.tone === "red"
      ? "badge-urgent"
      : stage.tone === "blue"
        ? "badge-info"
        : "badge-warning";
  return `
    <article class="shipping-queue-card ${selected} ${sampleOrder ? "is-sample" : ""}" data-action="select-order" data-id="${order.id}" data-view="shipping">
      <div class="shipping-queue-head">
        <div>
          <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
          <div class="order-meta">${order.operations?.product || t("undefined")} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq · ${destination}</div>
        </div>
        <div class="shipping-queue-badges">
          ${sampleOrder ? `<div class="order-type-badge type-sample-box">${state.lang === "it" ? "Box campioni" : "Sample box"}</div>` : ""}
          <div class="order-type-badge ${mode === "corriere" ? "type-spedizione" : mode === "ritiro" ? "type-ritiro" : "type-posa"}">${routeLabel}</div>
          <div class="action-badge ${badgeTone}">${stage.label}</div>
        </div>
      </div>
      <div class="shipping-queue-body">
        <div class="shipping-queue-line">
          <span>${state.lang === "it" ? "Prossimo passo" : "Next step"}</span>
          <strong>${nextAction}</strong>
        </div>
        <div class="shipping-queue-line">
          <span>${state.lang === "it" ? "Stato uscita" : "Dispatch state"}</span>
          <strong>${shipmentState}</strong>
        </div>
        <div class="shipping-queue-line">
          <span>${state.lang === "it" ? "Righe da preparare" : "Lines to prepare"}</span>
          <strong>${preparedLines.length} ${state.lang === "it" ? "righe" : "lines"}</strong>
        </div>
        <div class="shipping-queue-copy">${prepMeta}</div>
      </div>
      <div class="shipping-queue-footer">
        <span class="shipping-prep-date ${String(getShippingTargetDate(order) || "") === new Date().toISOString().slice(0, 10) ? "is-today" : ""}">${targetLabel}</span>
        <strong>${ddtOrSampleLabel}</strong>
      </div>
    </article>
  `;
}

function renderSampleShippingRow(order) {
  const selected = order.id === state.selectedOrderId ? "is-selected" : "";
  const destination = composeAddress(order) || addressIncompleteText();
  const hasLdvAttached = hasSampleLdvAttachment(order);
  const urgency = getSampleUrgencyMeta(order);
  const actionLabel = hasLdvAttached
    ? (state.lang === "it" ? "Scarica LDV" : "Download waybill")
    : "Vai a RDF";
  const actionKind = hasLdvAttached ? "open-sample-ldv" : "open-rdf";
  return `
    <article class="sample-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="shipping">
      <div class="sample-info">
        <div class="sample-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div class="sample-text">
          <div class="sample-name">${escapeHtml(composeClientName(order))} <span class="sample-num">· ${escapeHtml(getOrderNumber(order))}</span></div>
          <div class="sample-addr">${escapeHtml(destination)}</div>
        </div>
      </div>
      <div class="sample-actions">
        ${hasLdvAttached ? `<span class="sample-status ok">${state.lang === "it" ? "LDV allegata" : "Waybill attached"}</span>` : ""}
        <span class="shipping-urgency-badge urgency-${urgency.urgencyClass}">${urgency.urgencyText}</span>
        <button class="sample-btn-primary" type="button" data-action="${actionKind}" data-id="${order.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h6v6"></path>
            <path d="M10 14 21 3"></path>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          </svg>
          ${actionLabel}
        </button>
      </div>
    </article>
  `;
}

function toggleShippingDetailPanel(order = null) {
  const shouldShowSample = order ? isSampleOrder(order) : state.filters.shipping === "sample";
  if (ui.shippingStandardDetailPanel) {
    ui.shippingStandardDetailPanel.classList.toggle("hidden", shouldShowSample);
  }
  if (ui.sampleDetailPanel) {
    ui.sampleDetailPanel.classList.toggle("hidden", !shouldShowSample);
  }
  if (shouldShowSample) {
    clearStatus(ui.shippingStatus);
  } else {
    clearStatus(ui.sampleStatus);
  }
  return shouldShowSample;
}

function renderSampleShippingDetail(order) {
  if (!ui.sampleDetailTitle || !ui.sampleDetailFields) return;
  if (!order) {
    ui.sampleDetailTitle.textContent = state.lang === "it" ? "Seleziona un ordine campione" : "Select a sample order";
    ui.sampleDetailFields.innerHTML = "";
    if (ui.sampleAttachments) {
      ui.sampleAttachments.innerHTML = `<div class="info-card">${state.lang === "it" ? "Nessuna LDV caricata." : "No waybill uploaded."}</div>`;
    }
    if (ui.sampleForm) ui.sampleForm.reset();
    clearStatus(ui.sampleStatus);
    return;
  }

  const destination = getShippingDestination(order);
  const sampleLdvAttachments = getSampleLdvAttachments(order);
  const hasLdv = sampleLdvAttachments.length > 0;
  const ldvAttachment = sampleLdvAttachments[0] || null;

  ui.sampleDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  ui.sampleDetailFields.innerHTML = [
    {
      label: state.lang === "it" ? "Cliente" : "Customer",
      value: composeClientName(order),
      meta: composeAddress(order) || addressIncompleteText(),
    },
    {
      label: state.lang === "it" ? "Flusso" : "Flow",
      value: state.lang === "it" ? "Box campioni" : "Sample boxes",
      meta: getShippingTargetLabel(order),
    },
    {
      label: state.lang === "it" ? "Stato spedizione" : "Shipping status",
      value: getShipmentStateLabel(order),
      meta: order.operations?.warehouse?.trackingNumber || (state.lang === "it" ? "Tracking non inserito" : "Tracking not set"),
    },
    {
      label: "LDV",
      value: hasLdv
        ? (state.lang === "it" ? "Allegata" : "Attached")
        : (state.lang === "it" ? "Da caricare" : "To upload"),
      meta: hasLdv
        ? `${ldvAttachment?.name || "LDV"} · ${formatDate(ldvAttachment?.createdAt)}`
        : (state.lang === "it" ? "Carica PDF o immagine della lettera di vettura." : "Upload the PDF/image waybill."),
    },
    {
      label: state.lang === "it" ? "Destinazione" : "Destination",
      value: destination.provinceCode || provinceIncompleteText(),
      meta: `${destination.postalCode || "—"} · ${destination.province || order.province || "—"}`,
    },
  ].map(renderDetailBox).join("");

  if (ui.sampleForm) {
    ui.sampleForm.sampleCarrier.value = String(order.operations?.warehouse?.carrier || "SDA").trim() || "SDA";
    ui.sampleForm.sampleLdvNumber.value = getSampleLdvNumber(order);
    ui.sampleForm.sampleTracking.value = String(order.operations?.warehouse?.trackingNumber || "").trim();
    ui.sampleForm.sampleShipped.checked = Boolean(
      order.operations?.warehouse?.shipped
      || String(order.operations?.warehouse?.status || "").trim() === "ritirato",
    );
  }

  if (ui.sampleAttachments) {
    ui.sampleAttachments.innerHTML = renderAttachmentGrid(sampleLdvAttachments, order.id);
  }
}

function formatClientDataForRdf(order) {
  const destination = getShippingDestination(order);
  const fullName = String(composeClientName(order) || "").trim();
  const lines = [
    fullName ? `Nome: ${fullName}` : "",
    order?.address ? `Indirizzo: ${order.address}` : "",
    order?.city ? `Città: ${order.city}` : "",
    destination.postalCode ? `CAP: ${destination.postalCode}` : "",
    (destination.provinceCode || destination.province) ? `Provincia: ${destination.provinceCode || destination.province}` : "",
    order?.phone ? `Telefono: ${order.phone}` : "",
    order?.email ? `Email: ${order.email}` : "",
    `Riferimento: Ordine ${getOrderNumber(order)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function openRdfWithData(order) {
  if (!order) return;
  const statusNode = isSampleOrder(order) ? (ui.sampleStatus || ui.shippingStatus) : ui.shippingStatus;
  const payload = formatClientDataForRdf(order);
  let copied = false;
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(payload);
      copied = true;
    } catch {}
  }
  if (statusNode) {
    setStatus(
      statusNode,
      copied ? "success" : "error",
      copied
        ? (state.lang === "it" ? "Dati cliente copiati. Incolla nel portale RDF." : "Customer data copied. Paste in the RDF portal.")
        : (state.lang === "it" ? "Apertura RDF eseguita. Copia manualmente i dati cliente." : "RDF opened. Copy customer data manually."),
    );
  }
  window.open(RDF_PORTAL_URL, "_blank", "noopener,noreferrer");
}

function openSampleLdvFile(order) {
  if (!order) return;
  const firstAttachment = getSampleLdvAttachments(order)[0];
  const fileUrl = firstAttachment?.url || firstAttachment?.dataUrl || "";
  if (!fileUrl) {
    setStatus(
      ui.sampleStatus || ui.shippingStatus,
      "error",
      state.lang === "it" ? "Nessuna LDV disponibile per questo ordine." : "No waybill available for this order.",
    );
    return;
  }
  window.open(fileUrl, "_blank", "noopener,noreferrer");
}

function renderShipping() {
  const orders = filterOrdersForView("shipping");
  const isSampleFilter = state.filters.shipping === "sample";
  const shippingGrid = ui.shippingList?.closest(".order-grid");
  if (shippingGrid) shippingGrid.classList.toggle("is-empty", orders.length === 0);
  if (ui.shippingList) {
    if (isSampleFilter) {
      ui.shippingList.innerHTML = orders.length
        ? `<div class="sample-list">${orders.map(renderSampleShippingRow).join("")}</div>`
        : `<div class="info-card">${state.lang === "it" ? "Nessun ordine Box campioni con questo filtro." : "No sample-box orders for this filter."}</div>`;
    } else {
      const groupedOrders = [
        getShippingQueueGroupMeta("corriere"),
        getShippingQueueGroupMeta("ritiro"),
        getShippingQueueGroupMeta("furgone"),
        getShippingQueueGroupMeta("altro"),
      ].map((group) => ({
        ...group,
        orders: orders.filter((order) => {
          const mode = order.operations?.warehouse?.fulfillmentMode || "da-definire";
          if (group.key === "altro") return !["corriere", "ritiro", "furgone"].includes(mode);
          return mode === group.key;
        }),
      })).filter((group) => group.orders.length);
      const totalPreparedLines = orders.reduce((sum, order) => sum + getWarehousePreparedLines(order).length, 0);
      ui.shippingList.innerHTML = orders.length
        ? `
          <div class="shipping-queue-summary">
            ${renderDetailBox({
              label: state.lang === "it" ? "Ordini in coda" : "Queued orders",
              value: String(orders.length),
              meta: state.lang === "it" ? "Lista ordini da gestire in logistica." : "Order list to handle in logistics.",
            })}
            ${renderDetailBox({
              label: state.lang === "it" ? "Righe da preparare" : "Lines to prepare",
              value: String(totalPreparedLines),
              meta: state.lang === "it" ? "Somma delle righe materiali pronte o da verificare." : "Combined material lines ready or to verify.",
            })}
          </div>
          <div class="shipping-queue-groups">
            ${groupedOrders.map((group) => `
              <section class="shipping-queue-group">
                <div class="shipping-queue-group-head">
                  <div>
                    <h4>${group.title}</h4>
                    <p>${group.copy}</p>
                  </div>
                  <span class="search-pill compact-pill">${group.orders.length}</span>
                </div>
                <div class="shipping-queue-list">
                  ${group.orders.map(renderShippingQueueCard).join("")}
                </div>
              </section>
            `).join("")}
          </div>
        `
        : `<div class="info-card">${state.lang === "it" ? "Nessuna spedizione o ritiro con questo filtro." : "No shipments or pickups for this filter."}</div>`;
    }
  }

  const order = orders.find((item) => item.id === state.selectedOrderId) || orders[0] || null;
  if (state.currentView === "shipping" && order && order.id !== state.selectedOrderId) state.selectedOrderId = order.id;
  const samplePanelActive = toggleShippingDetailPanel(order);
  if (!order) {
    if (ui.shippingDetailTitle) ui.shippingDetailTitle.textContent = t("noSelection");
    if (ui.shippingDetailFields) ui.shippingDetailFields.innerHTML = "";
    if (ui.shippingMaterialPreview) renderShippingMaterialPreview(null);
    if (ui.shippingEstimate) ui.shippingEstimate.innerHTML = "";
    if (ui.shippingAttachments) ui.shippingAttachments.innerHTML = `<div class="info-card">${state.lang === "it" ? "Nessun allegato logistico." : "No shipping attachments."}</div>`;
    clearStatus(ui.shippingStatus);
    clearStatus(ui.sampleStatus);
    renderSampleShippingDetail(null);
    if (ui.ddtItemsPreview) renderDdtPreview(null);
    return;
  }

  if (samplePanelActive) {
    renderSampleShippingDetail(order);
    if (ui.shippingDetailTitle) ui.shippingDetailTitle.textContent = t("noSelection");
    if (ui.shippingDetailFields) ui.shippingDetailFields.innerHTML = "";
    if (ui.shippingMaterialPreview) renderShippingMaterialPreview(null);
    if (ui.shippingEstimate) ui.shippingEstimate.innerHTML = "";
    if (ui.shippingAttachments) ui.shippingAttachments.innerHTML = `<div class="info-card">${state.lang === "it" ? "Nessun allegato logistico." : "No shipping attachments."}</div>`;
    if (ui.ddtItemsPreview) renderDdtPreview(null);
    clearStatus(ui.shippingStatus);
    return;
  }

  if (ui.shippingDetailTitle) {
    ui.shippingDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  }
  renderSampleShippingDetail(null);
  const destination = getShippingDestination(order);
  const estimate = calculateShippingEstimate(order, getCurrentDdtDraft(order));
  const stage = getUnifiedOrderStage(order);
  const nextAction = getShippingNextAction(order);
  if (ui.shippingDetailFields) {
    ui.shippingDetailFields.innerHTML = [
      {
        label: state.lang === "it" ? "Prodotto" : "Product",
        value: order.operations?.product || undefinedText(),
        meta: `${order.operations?.sqm || 0} mq · ${composeAddress(order) || addressIncompleteText()}`,
      },
      {
        label: state.lang === "it" ? "Fase logistica" : "Logistics stage",
        value: stage.label,
        meta: nextAction,
      },
      {
        label: "Gestione",
        value: getShippingModeLabel(order),
        meta: getShipmentStateLabel(order),
      },
      {
        label: "Preparazione",
        value: getShippingTargetLabel(order),
        meta: order.operations?.warehouse?.preparationDate
          ? (state.lang === "it"
              ? `Calendario preparazione fissato per ${formatDate(order.operations?.warehouse?.preparationDate)}`
              : `Prep calendar set for ${formatDate(order.operations?.warehouse?.preparationDate)}`)
          : (state.lang === "it" ? "Calendario preparazione ancora da definire." : "Prep calendar not set yet."),
      },
      {
        label: "DDT",
        value: order.operations?.warehouse?.ddt?.number || "Da creare",
        meta: order.operations?.warehouse?.ddt?.createdAt ? formatDate(order.operations?.warehouse?.ddt?.createdAt) : "Non ancora generato",
      },
      {
        label: state.lang === "it" ? "Destinazione tariffaria" : "Tariff destination",
        value: destination.provinceCode || (state.lang === "it" ? "Provincia mancante" : "Missing province"),
        meta: destination.region || destination.province || (state.lang === "it" ? "Compila provincia o CAP per il calcolo automatico." : "Fill province or ZIP for automatic pricing."),
      },
      {
        label: t("shipmentState"),
        value: getShipmentStateLabel(order),
        meta: order.operations?.warehouse?.trackingNumber || order.operations?.warehouse?.warehouseNote || "Nessuna nota logistica",
      },
      {
        label: state.lang === "it" ? "Classe stimata" : "Estimated class",
        value: estimate.mode === "oneexpress-auto" ? (estimate.palletClass || "—") : (state.lang === "it" ? "Manuale" : "Manual"),
        meta: estimate.mode === "oneexpress-auto"
          ? `${estimate.profile === "silver" ? "Silver" : "Gold"} · ${estimate.resa || "—"}`
          : (state.lang === "it" ? "Fallback per fasce peso." : "Weight-band fallback."),
      },
    ].map(renderDetailBox).join("");
  }
  renderShippingMaterialPreview(order);
  if (ui.shippingForm) {
    ui.shippingForm.trackingNumber.value = order.operations?.warehouse?.trackingNumber || "";
    ui.shippingForm.destinationProvinceCode.value = destination.provinceCode || "";
    ui.shippingForm.destinationPostalCode.value = destination.postalCode || "";
    ui.shippingForm.warehouseNote.value = order.operations?.warehouse?.warehouseNote || "";
    ui.shippingForm.readyToShip.checked = Boolean(order.operations?.warehouse?.readyToShip);
    ui.shippingForm.carrierPassed.checked = Boolean(order.operations?.warehouse?.carrierPassed);
    ui.shippingForm.shipped.checked = Boolean(order.operations?.warehouse?.shipped);
  }
  if (ui.shippingAttachments) {
    ui.shippingAttachments.innerHTML = renderAttachmentGrid(mapAttachmentsForContext(order, "shipping"), order.id);
  }
  if (ui.shippingEstimate) {
    ui.shippingEstimate.innerHTML = buildShippingEstimate(order);
  }
  if (ui.ddtForm) {
    const ddt = order.operations?.warehouse?.ddt || {};
    ui.ddtForm.number.value = ddt.number || "";
    ui.ddtForm.palletLength.value = ddt.palletLength || "";
    ui.ddtForm.palletWidth.value = ddt.palletWidth || "";
    ui.ddtForm.palletHeight.value = ddt.palletHeight || "";
    ui.ddtForm.palletWeight.value = ddt.palletWeight || "";
  }
  renderDdtPreview(order);
}

function renderSettings() {
  ui.settingsForm.storeDomain.value = state.settings.storeDomain || "";
  ui.settingsForm.clientId.value = state.settings.clientId || "";
  ui.settingsForm.clientSecret.value = "";
  ui.settingsForm.adminAccessToken.value = "";
  ui.settingsForm.locationName.value = state.settings.locationName || "";
  ui.settingsForm.carrierName.value = state.settings.carrierName || "";
  ui.settingsForm.shippingRateMode.value = state.settings.shippingRateMode || "oneexpress-auto";
  ui.settingsForm.shippingTariffProfile.value = state.settings.shippingTariffProfile || "silver";
  ui.settingsForm.volumetricDivisor.value = state.settings.volumetricDivisor || "5000";
  ui.settingsForm.rate80.value = state.settings.rate80 || "";
  ui.settingsForm.rate150.value = state.settings.rate150 || "";
  ui.settingsForm.rate300.value = state.settings.rate300 || "";
  ui.settingsForm.rate500.value = state.settings.rate500 || "";
  ui.settingsForm.rate1000.value = state.settings.rate1000 || "";
  ui.settingsForm.extraKgRate.value = state.settings.extraKgRate || "";
  if (ui.connectShopifyButton) {
    ui.connectShopifyButton.textContent = state.settings.hasAdminAccessToken
      ? (state.lang === "it" ? "Verifica Shopify" : "Verify Shopify")
      : "Connect Shopify";
  }
  if (ui.securityForm) {
    ui.securityForm.reset();
  }
  renderSecurityCenter();
  renderAccountsManager();
  renderCrewExpenseMonthlyReport();
}

function renderProfitSplitWorkspace() {
  if (isProfitSplitOrderLinked() && !getProfitSplitContextOrder()) {
    restoreProfitSplitLocalDraft();
  }
  renderProfitSplitCalculator();
}

function renderSecurityCenter() {
  if (ui.securityPolicyNote) {
    const minLength = Number(state.securityPolicy?.passwordMinLength || 12);
    const recoveryActive = Boolean(state.securityPolicy?.bootstrapRecoveryActive);
    ui.securityPolicyNote.innerHTML = `
      <strong>Policy password</strong>
      <p>Usa almeno ${minLength} caratteri, con maiuscole, minuscole e numeri. ${state.currentUser?.mustChangePassword ? "Per questo account e richiesto il cambio password al prossimo accesso." : "Password account allineata."} ${recoveryActive ? "Recupero admin temporaneo attivo via Render: rimuovilo appena rientri." : "Recupero bootstrap non attivo."}</p>
    `;
  }
  if (!ui.securityEvents) return;
  if (state.currentUser?.role !== "office") {
    ui.securityEvents.innerHTML = `<div class="info-card">Solo l'ufficio puo vedere gli eventi di sicurezza.</div>`;
    return;
  }
  if (!state.securityEvents.length) {
    ui.securityEvents.innerHTML = `<div class="info-card">Nessun evento di sicurezza registrato.</div>`;
    return;
  }
  ui.securityEvents.innerHTML = state.securityEvents.slice(0, 8).map((event) => `
    <article class="detail-box">
      <span class="panel-eyebrow">${escapeHtml(String(event.type || "security").replaceAll("_", " "))}</span>
      <strong>${escapeHtml(event.message || "Evento sicurezza")}</strong>
      <p>${escapeHtml(event.actor || "system")} · ${formatDate(event.createdAt)}</p>
    </article>
  `).join("");
}

function updateAccountCrewFieldVisibility(form) {
  if (!form) return;
  const roleInput = form.querySelector("[name='role']");
  const crewOnlyFields = form.querySelectorAll("[data-crew-field]");
  const visible = roleInput?.value === "crew";
  crewOnlyFields.forEach((field) => field.classList.toggle("hidden", !visible));
}

function getCrewLogoPreviewImageAlt(form, fallbackLabel = "") {
  const crewLabel = String(
    form?.querySelector("[name='crewName']")?.value
    || form?.querySelector("[name='name']")?.value
    || fallbackLabel
    || "",
  ).trim();
  return crewLabel ? `Logo squadra ${crewLabel}` : "Logo squadra";
}

function setAccountCrewLogoPreview(form, dataUrl = "", fallbackLabel = "") {
  const preview = form?.querySelector(".crew-logo-preview");
  if (!preview) return;
  const normalizedDataUrl = String(dataUrl || "").trim();
  preview.classList.toggle("is-empty", !normalizedDataUrl);
  preview.innerHTML = normalizedDataUrl
    ? `<img src="${escapeHtml(normalizedDataUrl)}" alt="${escapeHtml(getCrewLogoPreviewImageAlt(form, fallbackLabel))}" />`
    : "<span>Nessun logo squadra caricato.</span>";
}

async function syncAccountCrewLogoPreview(form, existingLogo = "") {
  if (!form) return;
  try {
    const nextLogo = await readCrewLogoDataUrlFromForm(form, existingLogo);
    setAccountCrewLogoPreview(form, nextLogo);
  } catch {
    setAccountCrewLogoPreview(form, existingLogo);
  }
}

function bindAccountCrewFields(form) {
  if (!form) return;
  updateAccountCrewFieldVisibility(form);
  if (form.dataset.crewFieldsBound === "1") return;
  form.dataset.crewFieldsBound = "1";
  const getPersistedCrewLogo = () => String(form.dataset.persistedCrewLogo || "").trim();
  const roleInput = form.querySelector("[name='role']");
  if (roleInput) {
    roleInput.addEventListener("change", () => {
      updateAccountCrewFieldVisibility(form);
      if (roleInput.value !== "crew") {
        setAccountCrewLogoPreview(form, "");
        return;
      }
      void syncAccountCrewLogoPreview(form, getPersistedCrewLogo());
    });
  }
  const fileInput = form.querySelector("[name='crewLogoFile']");
  const removeInput = form.querySelector("[name='removeCrewLogo']");
  const nameInputs = [
    form.querySelector("[name='crewName']"),
    form.querySelector("[name='name']"),
  ].filter(Boolean);
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (removeInput?.checked && fileInput.files?.length) removeInput.checked = false;
      void syncAccountCrewLogoPreview(form, getPersistedCrewLogo());
    });
  }
  if (removeInput) {
    removeInput.addEventListener("change", () => {
      if (removeInput.checked && fileInput) fileInput.value = "";
      const previewLogo = removeInput.checked
        ? ""
        : getPersistedCrewLogo();
      void syncAccountCrewLogoPreview(form, previewLogo);
    });
  }
  nameInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const currentLogo = form.querySelector(".crew-logo-preview img")?.getAttribute("src") || "";
      setAccountCrewLogoPreview(form, currentLogo);
    });
  });
}

function syncCoveragePlannerCrewRename(previousCrewName = "", nextCrewName = "") {
  if (!previousCrewName || !nextCrewName || isSameCrewName(previousCrewName, nextCrewName)) return;
  if (!state.coveragePlanner?.teams) state.coveragePlanner = { teams: {} };
  if (!state.coveragePlanner.availability) state.coveragePlanner.availability = {};
  const matchedTeamKey = Object.keys(state.coveragePlanner.teams).find((key) => isSameCrewName(key, previousCrewName));
  if (matchedTeamKey && matchedTeamKey !== nextCrewName) {
    state.coveragePlanner.teams[nextCrewName] = {
      ...(state.coveragePlanner.teams[matchedTeamKey] || {}),
    };
    delete state.coveragePlanner.teams[matchedTeamKey];
  }
  const matchedAvailabilityKey = Object.keys(state.coveragePlanner.availability).find((key) => isSameCrewName(key, previousCrewName));
  if (matchedAvailabilityKey && matchedAvailabilityKey !== nextCrewName) {
    state.coveragePlanner.availability[nextCrewName] = {
      ...(state.coveragePlanner.availability[matchedAvailabilityKey] || {}),
    };
    delete state.coveragePlanner.availability[matchedAvailabilityKey];
  }
  if (isSameCrewName(state.selectedInstallationCrew, previousCrewName)) {
    state.selectedInstallationCrew = nextCrewName;
  }
  saveCoveragePlannerState();
}

function buildAccountsManagerSignature() {
  return JSON.stringify({
    role: state.currentUser?.role || "",
    lang: state.lang,
    users: Array.isArray(state.users)
      ? state.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: Boolean(user.mustChangePassword),
        crewName: user.crewName || "",
        dailyCapacity: Number(user.dailyCapacity || 0),
        crewLogoDataUrl: String(user.crewLogoDataUrl || ""),
      }))
      : [],
  });
}

function renderAccountsManager() {
  if (!ui.accountsList) return;
  if (state.currentUser?.role !== "office") {
    state.lastAccountsManagerSignature = "";
    ui.accountsList.innerHTML = `<div class="info-card">Solo l'ufficio puo gestire gli account.</div>`;
    if (ui.accountCreateForm) ui.accountCreateForm.classList.add("hidden");
    return;
  }
  if (ui.accountCreateForm) ui.accountCreateForm.classList.remove("hidden");
  const signature = buildAccountsManagerSignature();
  if (
    state.lastAccountsManagerSignature === signature
    && ui.accountsList.dataset.accountsRendered === "1"
  ) {
    bindAccountCrewFields(ui.accountCreateForm);
    return;
  }
  if (!state.users.length) {
    state.lastAccountsManagerSignature = signature;
    ui.accountsList.dataset.accountsRendered = "1";
    ui.accountsList.innerHTML = `<div class="info-card">Nessun account presente.</div>`;
    return;
  }
  ui.accountsList.innerHTML = state.users
    .slice()
    .sort((left, right) => {
      if (left.role === right.role) return left.name.localeCompare(right.name, "it");
      if (left.role === "crew") return -1;
      if (right.role === "crew") return 1;
      return left.name.localeCompare(right.name, "it");
    })
    .map((user) => `
    <form class="detail-box account-edit-form" data-account-id="${user.id}" data-persisted-crew-logo="${escapeHtml(user.crewLogoDataUrl || "")}">
      <div class="inline-form-grid">
        <label class="field">
          <span>Nome</span>
          <input class="text-input" name="name" value="${escapeHtml(user.name || "")}" />
        </label>
        <label class="field">
          <span>Email</span>
          <input class="text-input" name="email" type="email" value="${escapeHtml(user.email || "")}" />
        </label>
        <label class="field">
          <span>Ruolo</span>
          <select class="text-input" name="role">
            <option value="office" ${user.role === "office" ? "selected" : ""}>Office</option>
            <option value="warehouse" ${user.role === "warehouse" ? "selected" : ""}>Magazzino</option>
            <option value="crew" ${user.role === "crew" ? "selected" : ""}>Squadra</option>
          </select>
        </label>
        <label class="field">
          <span>Stato account</span>
          <select class="text-input" name="status">
            <option value="active" ${user.status !== "suspended" ? "selected" : ""}>Attivo</option>
            <option value="suspended" ${user.status === "suspended" ? "selected" : ""}>Sospeso</option>
          </select>
        </label>
        <label class="field">
          <span>Nuova password</span>
          <input class="text-input" name="password" type="password" placeholder="Lascia vuoto per non cambiarla" />
        </label>
        <label class="field field-full crew-account-field ${user.role === "crew" ? "" : "hidden"}" data-crew-field>
          <span>Nome squadra</span>
          <input class="text-input" name="crewName" value="${escapeHtml(user.crewName || user.name || "")}" placeholder="Alpha" />
        </label>
        <label class="field crew-account-field ${user.role === "crew" ? "" : "hidden"}" data-crew-field>
          <span>Capacita giornaliera (mq)</span>
          <input class="text-input" name="dailyCapacity" value="${escapeHtml(String(user.dailyCapacity || DEFAULT_CREW_DAILY_CAPACITY))}" placeholder="120" />
        </label>
        <label class="field field-full crew-account-field ${user.role === "crew" ? "" : "hidden"}" data-crew-field>
          <span>Logo squadra (opzionale)</span>
          <div class="crew-logo-preview ${user.crewLogoDataUrl ? "" : "is-empty"}">
            ${user.crewLogoDataUrl
              ? `<img src="${escapeHtml(user.crewLogoDataUrl)}" alt="Logo squadra ${escapeHtml(user.crewName || user.name || "")}" />`
              : `<span>Nessun logo squadra caricato.</span>`}
          </div>
          <input class="text-input" name="crewLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" />
          <small class="field-hint">Lascia vuoto per mantenere il logo attuale.</small>
        </label>
        <label class="checkline field-full crew-account-field ${user.role === "crew" ? "" : "hidden"}" data-crew-field>
          <input type="checkbox" name="removeCrewLogo" />
          <span>Rimuovi logo squadra</span>
        </label>
        <label class="checkline field-full">
          <input type="checkbox" name="mustChangePassword" ${user.mustChangePassword ? "checked" : ""} />
          <span>Richiedi cambio password al prossimo accesso</span>
        </label>
        <div class="inline-actions field-full">
          <button type="submit" class="ghost-button small-button">Salva account</button>
        </div>
      </div>
    </form>
  `).join("");
  ui.accountsList.querySelectorAll(".account-edit-form").forEach((form) => {
    bindAccountCrewFields(form);
    form.addEventListener("submit", updateManagedAccount);
  });
  bindAccountCrewFields(ui.accountCreateForm);
  state.lastAccountsManagerSignature = signature;
  ui.accountsList.dataset.accountsRendered = "1";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderDetailBox(item) {
  return `
    <article class="detail-box shipping-detail-box">
      <span class="panel-eyebrow">${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.meta || "—"}</p>
    </article>
  `;
}

function renderInfoLine(label, value) {
  return `
    <div class="detail-box">
      <span class="panel-eyebrow">${label}</span>
      <p>${value || "—"}</p>
    </div>
  `;
}

function renderAttachmentGrid(items, orderId = "") {
  if (!items?.length) return `<div class="info-card">${state.lang === "it" ? "Nessun allegato caricato." : "No attachments uploaded."}</div>`;
  return items.map((item, index) => `
    <article class="attachment-item">
      ${orderId ? `<button class="attachment-remove" type="button" data-action="remove-attachment" data-id="${orderId}" data-index="${Number(item._attachmentIndex ?? index)}" aria-label="${state.lang === "it" ? "Rimuovi allegato" : "Remove attachment"}">×</button>` : ""}
      ${isImageAttachment(item) && (item.url || item.dataUrl)
        ? `<img src="${escapeHtml(item.url || item.dataUrl)}" alt="${escapeHtml(item.name || "Allegato")}" loading="lazy" />`
        : `<div class="attachment-file-badge">${escapeHtml(String(item.type || "file").split("/").pop()?.toUpperCase() || "FILE")}</div>`}
      <strong>${item.url || item.dataUrl
        ? `<a href="${escapeHtml(item.url || item.dataUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.name || "Allegato")}</a>`
        : escapeHtml(item.name || "Allegato")}</strong>
      <div class="attachment-copy">${getAttachmentContextLabel(String(item.context || ""))}</div>
      <div>${item.createdAt ? formatDate(item.createdAt) : "—"}</div>
    </article>
  `).join("");
}

function populateInventoryOptions() {
  if (!ui.inventoryProductOptions) return;
  const signature = INVENTORY_CATALOG.map((item) => item.label).join("|");
  if (ui.inventoryProductOptions.dataset.signature === signature) return;
  ui.inventoryProductOptions.innerHTML = INVENTORY_CATALOG
    .map((item) => `<option value="${item.label}"></option>`)
    .join("");
  ui.inventoryProductOptions.dataset.signature = signature;
}

function applySessionPayload(session = {}) {
  const previousUserId = String(state.currentUser?.id || "");
  const nextUser = normalizeUserRecord(session.user || null);
  const nextUserId = String(nextUser?.id || "");
  const userChanged = previousUserId !== nextUserId;
  const nextSessionRevision = String(session.revision || "").trim();
  const preserveEditingState = !userChanged;
  state.currentUser = nextUser;
  state.sessionRevision = nextUser ? nextSessionRevision : "";
  state.orders = session.orders || [];
  state.inventory = session.inventory || [];
  state.salesRequests = Array.isArray(session.salesRequests) ? session.salesRequests.map(normalizeSalesRequestRecord) : [];
  state.salesContents = Array.isArray(session.salesContents) ? session.salesContents.map(normalizeSalesContentRecord) : [];
  state.salesRequestSourceConfig = normalizeSalesRequestSourceConfig(session.salesRequestSource || {});
  state.pendingSalesRequestServiceAccountJson = preserveEditingState ? state.pendingSalesRequestServiceAccountJson : "";
  state.pendingSalesRequestServiceAccountEmail = preserveEditingState ? state.pendingSalesRequestServiceAccountEmail : "";
  state.creatingSalesRequest = preserveEditingState ? state.creatingSalesRequest : false;
  state.creatingSalesContent = preserveEditingState ? state.creatingSalesContent : false;
  state.accountingMobilePane = preserveEditingState ? state.accountingMobilePane : "summary";
  state.installationMobilePane = preserveEditingState ? state.installationMobilePane : "summary";
  state.salesRequestPage = preserveEditingState ? Math.max(1, Number(state.salesRequestPage || 1)) : 1;
  state.salesContentPage = preserveEditingState ? Math.max(1, Number(state.salesContentPage || 1)) : 1;
  state.salesContentCategory = preserveEditingState
    ? normalizeSalesContentCategoryFilter(state.salesContentCategory || "all")
    : "all";
  if (userChanged) {
    state.lastSalesGeneratorSignature = "";
    state.lastSalesGeneratorBrandingSignature = "";
    state.salesGeneratorFreeMode = false;
    state.pendingCurrentViewRefresh = false;
  }
  state.coveragePlanner = normalizeCoveragePlannerState(session.coveragePlanner || state.coveragePlanner);
  state.settings = session.shopifySettings || {};
  state.users = Array.isArray(session.users) ? session.users.map((user) => normalizeUserRecord(user)).filter(Boolean) : [];
  state.securityEvents = session.securityEvents || [];
  state.securityPolicy = session.securityPolicy || {};
  try {
    window.localStorage.setItem(COVERAGE_STORAGE_KEY, JSON.stringify(state.coveragePlanner));
  } catch {}
}

function stopSessionKeepalive() {
  if (sessionKeepaliveTimer) {
    window.clearInterval(sessionKeepaliveTimer);
    sessionKeepaliveTimer = 0;
  }
  sessionKeepaliveInFlight = false;
  sessionKeepaliveForceQueued = false;
}

function clearSessionEventsReconnectTimer() {
  if (!sessionEventsReconnectTimer) return;
  window.clearTimeout(sessionEventsReconnectTimer);
  sessionEventsReconnectTimer = 0;
}

function clearSessionEventsRefreshTimer() {
  if (!sessionEventsRefreshTimer) return;
  window.clearTimeout(sessionEventsRefreshTimer);
  sessionEventsRefreshTimer = 0;
}

function stopSessionEvents() {
  sessionEventsStopped = true;
  clearSessionEventsReconnectTimer();
  clearSessionEventsRefreshTimer();
  sessionEventsLastRefreshAt = 0;
  if (sessionEventsSource) {
    sessionEventsSource.close();
    sessionEventsSource = null;
  }
  sessionEventsReconnectBackoffMs = SESSION_EVENTS_RECONNECT_BASE_MS;
}

function parseSessionEventPayload(event) {
  try {
    return JSON.parse(String(event?.data || "{}"));
  } catch {
    return {};
  }
}

function requestRealtimeSessionRefresh() {
  if (!state.currentUser || document.hidden) return;
  const now = Date.now();
  const elapsed = now - sessionEventsLastRefreshAt;
  if (elapsed >= SESSION_EVENTS_REFRESH_DEBOUNCE_MS && !sessionEventsRefreshTimer) {
    sessionEventsLastRefreshAt = now;
    void keepSessionAlive({ silent: true, force: true });
    return;
  }
  if (sessionEventsRefreshTimer) return;
  const waitMs = Math.max(120, SESSION_EVENTS_REFRESH_DEBOUNCE_MS - Math.max(0, elapsed));
  sessionEventsRefreshTimer = window.setTimeout(() => {
    sessionEventsRefreshTimer = 0;
    if (!state.currentUser || document.hidden) return;
    sessionEventsLastRefreshAt = Date.now();
    void keepSessionAlive({ silent: true, force: true });
  }, waitMs);
}

function handleRealtimeSessionRevision(rawRevision = "") {
  if (!state.currentUser || document.hidden) return;
  const revision = String(rawRevision || "").trim();
  if (!revision || revision === state.sessionRevision) return;
  requestRealtimeSessionRefresh();
}

function scheduleSessionEventsReconnect() {
  if (sessionEventsStopped || sessionEventsReconnectTimer || !state.currentUser || !("EventSource" in window)) return;
  const waitMs = Math.max(SESSION_EVENTS_RECONNECT_BASE_MS, sessionEventsReconnectBackoffMs);
  sessionEventsReconnectTimer = window.setTimeout(() => {
    sessionEventsReconnectTimer = 0;
    if (!state.currentUser || sessionEventsStopped) return;
    startSessionEvents();
  }, waitMs);
  sessionEventsReconnectBackoffMs = Math.min(SESSION_EVENTS_RECONNECT_MAX_MS, waitMs * 2);
}

function startSessionEvents() {
  if (!state.currentUser || !("EventSource" in window)) return;
  sessionEventsStopped = false;
  clearSessionEventsReconnectTimer();
  clearSessionEventsRefreshTimer();
  if (sessionEventsSource) {
    sessionEventsSource.close();
    sessionEventsSource = null;
  }
  const source = new EventSource(SESSION_EVENTS_ENDPOINT);
  sessionEventsSource = source;

  source.addEventListener("ready", (event) => {
    if (sessionEventsSource !== source) return;
    const payload = parseSessionEventPayload(event);
    handleRealtimeSessionRevision(payload?.revision);
  });

  source.addEventListener("store-revision", (event) => {
    if (sessionEventsSource !== source) return;
    const payload = parseSessionEventPayload(event);
    handleRealtimeSessionRevision(payload?.revision);
  });

  source.onopen = () => {
    if (sessionEventsSource !== source) return;
    sessionEventsReconnectBackoffMs = SESSION_EVENTS_RECONNECT_BASE_MS;
  };

  source.onerror = () => {
    if (sessionEventsSource !== source) return;
    if (source.readyState === EventSource.CLOSED) {
      source.close();
      sessionEventsSource = null;
      scheduleSessionEventsReconnect();
    }
  };
}

function stopShopifyAutoSync() {
  if (shopifyAutoSyncTimer) {
    window.clearInterval(shopifyAutoSyncTimer);
    shopifyAutoSyncTimer = 0;
  }
  shopifyAutoSyncInFlight = false;
}

function stopSalesRequestAutoSync() {
  if (salesRequestAutoSyncTimer) {
    window.clearInterval(salesRequestAutoSyncTimer);
    salesRequestAutoSyncTimer = 0;
  }
}

async function readSessionRevision() {
  const payload = await apiFetch(SESSION_REVISION_ENDPOINT);
  return {
    hasUser: Boolean(payload?.user),
    revision: String(payload?.revision || "").trim(),
  };
}

function resetSessionToAuthView() {
  applySessionPayload({});
  showAuth();
}

function applyFetchedSessionSnapshot(session, { renderMode = "current", enforcePasswordResetView = false } = {}) {
  if (!session?.user) {
    resetSessionToAuthView();
    return false;
  }
  applySessionPayload(session);
  if (enforcePasswordResetView && state.currentUser?.mustChangePassword) {
    state.currentView = "settings";
  }
  ensureSelectedOrder();
  if (renderMode === "all") {
    render();
  } else if (renderMode === "current") {
    refreshCurrentView({ allowDefer: true });
  }
  return true;
}

async function keepSessionAlive({ silent = true, force = false } = {}) {
  if (!state.currentUser) return false;
  if (sessionKeepaliveInFlight) {
    if (force) sessionKeepaliveForceQueued = true;
    return true;
  }
  sessionKeepaliveInFlight = true;
  if (!silent) setShellPending(true);
  try {
    let shouldReloadSession = force || !state.sessionRevision;
    if (!shouldReloadSession) {
      try {
        const revisionPayload = await readSessionRevision();
        if (!revisionPayload.hasUser) {
          // Guard against transient revision desyncs: confirm with a full session snapshot once.
          const fallbackSession = await apiFetch("/api/session").catch(() => null);
          if (fallbackSession?.user) {
            return applyFetchedSessionSnapshot(fallbackSession, {
              renderMode: silent ? "current" : "all",
              enforcePasswordResetView: false,
            });
          }
          resetSessionToAuthView();
          return false;
        }
        shouldReloadSession = !revisionPayload.revision || revisionPayload.revision !== state.sessionRevision;
      } catch {
        shouldReloadSession = true;
      }
    }
    if (!shouldReloadSession) return true;
    const session = await apiFetch("/api/session");
    return applyFetchedSessionSnapshot(session, {
      renderMode: silent ? "current" : "all",
      enforcePasswordResetView: false,
    });
  } catch (error) {
    if (!silent) throw error;
    return false;
  } finally {
    sessionKeepaliveInFlight = false;
    if (!silent) setShellPending(false);
    if (sessionKeepaliveForceQueued && state.currentUser) {
      sessionKeepaliveForceQueued = false;
      window.setTimeout(() => {
        if (!state.currentUser) return;
        void keepSessionAlive({ silent: true, force: true });
      }, 40);
    }
  }
}

function startSessionKeepalive() {
  stopSessionKeepalive();
  if (!state.currentUser) return;
  sessionKeepaliveTimer = window.setInterval(() => {
    if (!state.currentUser || document.hidden) return;
    void keepSessionAlive({ silent: true });
  }, SESSION_KEEPALIVE_INTERVAL_MS);
}

function canAutoSyncShopify() {
  return Boolean(
    state.currentUser
    && state.currentUser.role === "office"
    && state.settings?.storeDomain
    && state.settings?.hasAdminAccessToken
    && !document.hidden
    && navigator.onLine !== false,
  );
}

function canAutoRefreshSalesRequests() {
  const config = normalizeSalesRequestSourceConfig(state.salesRequestSourceConfig || {});
  return Boolean(
    state.currentUser
    && state.currentUser.role === "office"
    && config.hasServiceAccount
    && config.spreadsheetInput
    && navigator.onLine !== false,
  );
}

function startShopifyAutoSync() {
  stopShopifyAutoSync();
  if (!state.currentUser) return;
  shopifyAutoSyncTimer = window.setInterval(() => {
    if (!canAutoSyncShopify()) return;
    void runShopifySync({ silent: true });
  }, SHOPIFY_AUTO_SYNC_INTERVAL_MS);
}

function startSalesRequestAutoSync() {
  stopSalesRequestAutoSync();
  if (!state.currentUser || state.currentUser.role !== "office") return;
  salesRequestAutoSyncTimer = window.setInterval(() => {
    if (!canAutoRefreshSalesRequests()) return;
    void syncSalesRequestSource({ auto: true, silent: true });
  }, SALES_REQUEST_AUTO_SYNC_INTERVAL_MS);
}

async function loadSession() {
  setShellPending(true);
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const session = await apiFetch("/api/session");
      const hasSession = applyFetchedSessionSnapshot(session, {
        renderMode: "none",
        enforcePasswordResetView: true,
      });
      if (!hasSession) {
        showAuth();
        return;
      }
      showApp();
      return;
    } catch (error) {
      lastError = error;
      if (error?.status === 401 || error?.message === "unauthorized") {
        resetSessionToAuthView();
        return;
      }
      if (attempt < 1) {
        await waitMs(280 * (attempt + 1));
        continue;
      }
    }
  }
  console.warn("session_bootstrap_failed", lastError);
  if (state.currentUser) {
    showApp();
    return;
  }
  showAuth();
  if (ui.authError) {
    ui.authError.textContent = state.lang === "it"
      ? "Connessione instabile o server occupato. Riprova tra qualche secondo."
      : "Connection is unstable or the server is busy. Try again in a few seconds.";
    ui.authError.classList.remove("hidden");
  }
  if (!state.currentUser) setShellPending(false);
}

function showAuth() {
  stopSessionKeepalive();
  stopSessionEvents();
  stopShopifyAutoSync();
  stopSalesRequestAutoSync();
  clearAllSearchRenderTimers();
  clearPendingCurrentViewRefresh();
  setShellPending(false);
  state.mobileMenuOpen = false;
  updateMobileMenu();
  ui.authScreen.classList.remove("hidden");
  ui.appShell.classList.add("hidden");
}

function showApp() {
  startSessionKeepalive();
  startSessionEvents();
  startShopifyAutoSync();
  startSalesRequestAutoSync();
  clearPendingCurrentViewRefresh();
  setShellPending(false);
  state.mobileMenuOpen = false;
  updateMobileMenu();
  if (!launchParamsApplied) {
    const allowed = getAllowedViewsForRole();
    if (launchParams.requestedView && allowed.includes(launchParams.requestedView)) {
      state.currentView = launchParams.requestedView;
    }
    if (launchParams.usePlannerPrefill && allowed.includes("sales-generator") && getGardenPlannerQuoteBridge()) {
      state.currentView = "sales-generator";
      state.salesGeneratorPlannerMode = true;
      state.salesGeneratorFreeMode = false;
    }
    launchParamsApplied = true;
    clearHandledLaunchParams();
  }
  ui.authScreen.classList.add("hidden");
  ui.appShell.classList.remove("hidden");
  renderCurrentViewOnly(state.currentView);
  requestAnimationFrame(() => {
    scrollCurrentViewToTop();
    focusViewTarget(state.currentView);
  });
}

function render() {
  if (state.currentUser && state.shellPending) {
    setShellPending(false);
  }
  ensureSelectedOrder();
  populateInventoryOptions();
  updateShell();
  renderOps();
  renderDashboard();
  renderOrders();
  renderSalesRequests();
  renderSalesGenerator();
  renderSalesContent();
  renderWarehouse();
  renderInstallations();
  renderAccounting();
  renderProfitSplitWorkspace();
  renderShipping();
  renderSettings();
}

function renderCurrentViewOnly(view = state.currentView) {
  if (state.currentUser && state.shellPending) {
    setShellPending(false);
  }
  ensureSelectedOrder();
  populateInventoryOptions();
  updateShell();
  renderOps();
  switch (view) {
    case "dashboard":
      renderDashboard();
      break;
    case "orders":
      renderOrders();
      break;
    case "sales-requests":
      renderSalesRequests();
      break;
    case "sales-generator":
      renderSalesGenerator();
      break;
    case "sales-content":
      renderSalesContent();
      break;
    case "warehouse":
      renderWarehouse();
      break;
    case "installations":
      renderInstallations();
      break;
    case "accounting":
      renderAccounting();
      break;
    case "profit-split":
      renderProfitSplitWorkspace();
      break;
    case "shipping":
      renderShipping();
      break;
    case "settings":
      renderSettings();
      break;
    default:
      renderDashboard();
      break;
  }
}

function scheduleCurrentViewRender() {
  if (currentViewRenderFrame) return;
  currentViewRenderFrame = window.requestAnimationFrame(() => {
    currentViewRenderFrame = 0;
    renderCurrentViewOnly(state.currentView);
  });
}

function isActiveElementInsideCurrentViewForm() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  const viewNode = active.closest(".view");
  if (!viewNode || viewNode.id !== state.currentView) return false;
  return Boolean(active.closest("form"));
}

function clearPendingCurrentViewRefresh() {
  state.pendingCurrentViewRefresh = false;
}

function flushPendingCurrentViewRefresh({ force = false } = {}) {
  if (!state.pendingCurrentViewRefresh) return false;
  if (!force && isActiveElementInsideCurrentViewForm()) return false;
  clearPendingCurrentViewRefresh();
  scheduleCurrentViewRender();
  return true;
}

function refreshCurrentView({ allowDefer = false } = {}) {
  if (allowDefer && isActiveElementInsideCurrentViewForm()) {
    state.pendingCurrentViewRefresh = true;
    return false;
  }
  clearPendingCurrentViewRefresh();
  renderCurrentViewOnly(state.currentView);
  return true;
}

function scheduleSearchRender(key = "", renderFn = () => {}, delay = 120) {
  const timerKey = String(key || "").trim();
  if (!timerKey) {
    renderFn();
    return;
  }
  clearSearchRenderTimer(timerKey);
  searchRenderTimers[timerKey] = window.setTimeout(() => {
    searchRenderTimers[timerKey] = 0;
    renderFn();
  }, delay);
}

function clearSearchRenderTimer(key = "") {
  const timerKey = String(key || "").trim();
  if (!timerKey || !searchRenderTimers[timerKey]) return;
  window.clearTimeout(searchRenderTimers[timerKey]);
  searchRenderTimers[timerKey] = 0;
}

function clearAllSearchRenderTimers() {
  Object.keys(searchRenderTimers).forEach((key) => {
    clearSearchRenderTimer(key);
  });
}

function setView(view) {
  const allowed = getAllowedViewsForRole();
  const nextView = allowed.includes(view) ? view : (allowed[0] || "dashboard");
  const previousView = state.currentView;
  if (currentViewRenderFrame) {
    window.cancelAnimationFrame(currentViewRenderFrame);
    currentViewRenderFrame = 0;
  }
  if (nextView === "accounting") state.accountingMobilePane = "summary";
  if (nextView === "installations") state.installationMobilePane = "summary";
  clearAllSearchRenderTimers();
  clearPendingCurrentViewRefresh();
  state.currentView = nextView;
  renderCurrentViewOnly(nextView);
  if (nextView !== previousView) {
    requestAnimationFrame(() => {
      scrollCurrentViewToTop();
      focusViewTarget(nextView);
    });
    return;
  }
  focusViewTarget(nextView);
}

function setStatus(node, kind, text) {
  if (!node) return;
  node.textContent = text;
  node.classList.remove("hidden", "success", "error");
  node.classList.add(kind);
}

function clearStatus(node) {
  if (!node) return;
  node.classList.add("hidden");
  node.textContent = "";
}

function formatShopifySyncError(rawMessage = "") {
  const message = String(rawMessage || "");
  if (message === "missing_shopify_credentials" || message === "missing_shopify_token") {
    return state.lang === "it"
      ? "Sync Shopify fallito. Compila dominio store e collega un Admin API access token valido nelle impostazioni."
      : "Shopify sync failed. Fill in the store domain and a valid Admin API access token in settings.";
  }
  if (message.startsWith("shopify_sync_failed:")) {
    return state.lang === "it"
      ? `Sync Shopify fallito. ${message.replace("shopify_sync_failed:", "").trim()}`
      : `Shopify sync failed. ${message.replace("shopify_sync_failed:", "").trim()}`;
  }
  return state.lang === "it"
    ? `Sync Shopify fallito. ${message || "Controlla la connessione Shopify."}`
    : `Shopify sync failed. ${message || "Check the Shopify connection."}`;
}

async function runShopifySync({ silent = false } = {}) {
  if (state.syncInProgress || shopifyAutoSyncInFlight) return false;
  shopifyAutoSyncInFlight = true;
  try {
    state.syncInProgress = true;
    updateShell();
    if (!silent) clearStatus(ui.ordersStatus);
    state.orders = await apiFetch("/api/orders/sync-shopify", { method: "POST" });
    shopifyOrderRefreshAttempted.clear();
    shopifyOrderRefreshInFlight.clear();
    shopifyOrderRefreshErrors.clear();
    ensureSelectedOrder();
    await keepSessionAlive({ silent: true });
    if (!silent) {
      setStatus(ui.ordersStatus, "success", t("shopifySynced"));
    }
    return true;
  } catch (error) {
    const message = formatShopifySyncError(error.message || "");
    if (!silent) {
      setStatus(ui.ordersStatus, "error", message);
    } else {
      console.warn("shopify_auto_sync_failed", error);
    }
    return false;
  } finally {
    state.syncInProgress = false;
    shopifyAutoSyncInFlight = false;
    updateShell();
  }
}

async function syncShopifyOrders() {
  await runShopifySync({ silent: false });
}

async function importOrdersJson() {
  try {
    const raw = ui.orderImportText.value.trim();
    if (!raw) {
      setStatus(ui.ordersStatus, "error", state.lang === "it" ? "Incolla un JSON prima di importare." : "Paste JSON before importing.");
      return;
    }
    const parsed = JSON.parse(raw);
    state.orders = await apiFetch("/api/orders/import", {
      method: "POST",
      body: JSON.stringify(parsed),
    });
    ui.orderImportText.value = "";
    state.showOrderImport = false;
    ensureSelectedOrder();
    setStatus(ui.ordersStatus, "success", state.lang === "it" ? "Ordini importati correttamente." : "Orders imported successfully.");
    updateOrderImportPanel();
    renderCurrentViewOnly(state.currentView);
  } catch {
    setStatus(ui.ordersStatus, "error", state.lang === "it" ? "JSON non valido. Incolla un payload Shopify corretto." : "Invalid JSON. Paste a valid Shopify payload.");
  }
}

async function clearManualOrders() {
  setStatus(
    ui.ordersStatus,
    "error",
    state.lang === "it"
      ? "La rimozione degli ordini e disattivata: gli ordini restano sempre salvati nel gestionale."
      : "Order removal is disabled: orders always remain saved in the management app.",
  );
}

function openOrderModal(order = null) {
  ui.orderModal.classList.remove("hidden");
  ui.orderModalTitle.textContent = order ? `Modifica ordine ${getOrderNumber(order)}` : "Nuovo ordine";
  ui.deleteOrderButton.classList.add("hidden");
  ui.orderForm.id.value = order?.id || "";
  ui.orderForm.orderNumber.value = order?.orderNumber || "";
  ui.orderForm.firstName.value = order?.firstName || "";
  ui.orderForm.lastName.value = order?.lastName || "";
  ui.orderForm.city.value = order?.city || "";
  ui.orderForm.provinceCode.value = order?.provinceCode || order?.operations?.warehouse?.destination?.provinceCode || "";
  ui.orderForm.postalCode.value = order?.postalCode || order?.operations?.warehouse?.destination?.postalCode || "";
  ui.orderForm.phone.value = order?.phone || "";
  ui.orderForm.email.value = order?.email || "";
  ui.orderForm.address.value = order?.address || "";
  ui.orderForm.product.value = order?.operations?.product || "";
  ui.orderForm.sqm.value = order?.operations?.sqm || "";
  ui.orderForm.surface.value = order?.operations?.surface || "terra";
  ui.orderForm.installRequired.value = order?.operations?.installation?.required ? "yes" : "no";
  ui.orderForm.materials.value = (order?.operations?.materials || []).join("\n");
  ui.orderForm.officeNote.value = order?.operations?.officeNote || "";
}

function closeOrderModal() {
  ui.orderModal.classList.add("hidden");
  ui.orderForm.reset();
}

async function saveOrder(event) {
  event.preventDefault();
  const form = new FormData(ui.orderForm);
  const payload = {
    orderNumber: form.get("orderNumber"),
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    city: form.get("city"),
    provinceCode: form.get("provinceCode"),
    postalCode: form.get("postalCode"),
    phone: form.get("phone"),
    email: form.get("email"),
    address: form.get("address"),
    product: form.get("product"),
    sqm: toNumber(form.get("sqm")),
    surface: form.get("surface"),
    installRequired: form.get("installRequired") === "yes",
    materials: String(form.get("materials") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    officeNote: form.get("officeNote"),
    lineItems: [],
    lineDetails: String(form.get("product") || "").trim()
      ? [{ title: String(form.get("product")).trim(), quantity: 1 }]
      : [],
    financialStatus: "pending",
    fulfillmentStatus: "unfulfilled",
  };

  let saved;
  if (form.get("id")) {
    saved = await apiFetch(`/api/orders/${encodeURIComponent(form.get("id"))}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.orders = state.orders.map((order) => (order.id === saved.id ? saved : order));
  } else {
    saved = await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.orders.unshift(saved);
  }
  state.selectedOrderId = saved.id;
  closeOrderModal();
  renderCurrentViewOnly(state.currentView);
}

async function deleteSelectedOrder() {
  setStatus(
    ui.ordersStatus,
    "error",
    state.lang === "it"
      ? "La cancellazione ordini e disattivata: gli ordini restano sempre nello storico."
      : "Order deletion is disabled: orders always remain in history.",
  );
}

async function saveWarehouse(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order) return;
  const form = new FormData(ui.warehouseForm);
  const fulfillmentMode = String(form.get("fulfillmentMode") || "da-definire");
  const payload = {
    warehouse: {
      status: form.get("status"),
      fulfillmentMode,
      carrier: form.get("carrier"),
      pickupLabel: fulfillmentMode === "ritiro" ? form.get("pickupLabel") : "",
      vanLoadLabel: fulfillmentMode === "furgone" ? form.get("pickupLabel") : "",
      warehouseNote: form.get("warehouseNote"),
    },
  };
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
}

async function saveInventory(event) {
  event.preventDefault();
  const form = new FormData(ui.inventoryForm);
  const config = getInventoryProductConfig(form.get("product"));
  const variantOptions = config.variantOptions || [];
  const variantValue = String(form.get("variant") || config.defaultVariant || "").trim();
  const variantLabel = variantOptions.find((option) => option.value === variantValue)?.label
    || ui.inventoryForm.variant?.selectedOptions?.[0]?.textContent?.trim()
    || "";
  state.inventory = await apiFetch("/api/inventory/items", {
    method: "POST",
    body: JSON.stringify({
      product: form.get("product"),
      quantity: form.get("quantity"),
      measured: config.isMeasured,
      width: config.isMeasured ? form.get("width") : (config.preset?.width || ""),
      length: config.isMeasured ? form.get("length") : (config.preset?.length || ""),
      status: config.isMeasured ? form.get("status") : "intero",
      variant: variantLabel,
      note: form.get("note"),
    }),
  });
  ui.inventoryForm.reset();
  updateInventoryFormUI();
  renderWarehouse();
}

function getInventoryItemsByProductName(product = "") {
  const productKey = normalizeProductName(product);
  if (!productKey) return [];
  return state.inventory.filter((item) => {
    const itemLabel = getCatalogLabel(item.product || "");
    return normalizeProductName(itemLabel) === productKey;
  });
}

async function removeInventoryPieceById(itemId = "") {
  const normalizedId = String(itemId || "").trim();
  if (!normalizedId) return false;
  const previousInventory = [...state.inventory];
  state.inventory = state.inventory.filter((item) => String(item.id || "") !== normalizedId);
  renderWarehouse();
  try {
    const nextInventory = await apiFetch(`/api/inventory/items/${encodeURIComponent(normalizedId)}`, { method: "DELETE" });
    state.inventory = nextInventory;
    renderWarehouse();
  } catch (error) {
    state.inventory = previousInventory;
    renderWarehouse();
    throw error;
  }
  return true;
}

async function removeLatestInventoryPieceByProduct(product = "") {
  const productLabel = String(product || "").trim();
  const candidates = getInventoryItemsByProductName(productLabel);
  if (!candidates.length) return false;
  const sortedCandidates = [...candidates].sort((left, right) => {
    const rightTime = new Date(right.createdAt || 0).getTime();
    const leftTime = new Date(left.createdAt || 0).getTime();
    if (rightTime !== leftTime) return rightTime - leftTime;
    return String(right.id || "").localeCompare(String(left.id || ""));
  });
  const target = sortedCandidates[0];
  const confirmed = window.confirm(
    state.lang === "it"
      ? `Rimuovere l'ultimo elemento caricato per ${productLabel}?`
      : `Remove the latest loaded stock item for ${productLabel}?`,
  );
  if (!confirmed) return false;
  return removeInventoryPieceById(target.id);
}

async function clearInventoryProductStock(product = "") {
  const productLabel = String(product || "").trim();
  const candidates = getInventoryItemsByProductName(productLabel);
  if (!candidates.length) return false;
  const confirmed = window.confirm(
    state.lang === "it"
      ? `Azzerare tutta la giacenza per ${productLabel}? (${candidates.length} elementi)`
      : `Clear all stock for ${productLabel}? (${candidates.length} items)`,
  );
  if (!confirmed) return false;
  const productKey = normalizeProductName(productLabel);
  const previousInventory = [...state.inventory];
  state.inventory = state.inventory.filter((item) => normalizeProductName(getCatalogLabel(item.product || "")) !== productKey);
  renderWarehouse();
  try {
    const nextInventory = await apiFetch(`/api/inventory/items/by-product/${encodeURIComponent(productLabel)}`, { method: "DELETE" });
    state.inventory = nextInventory;
    renderWarehouse();
  } catch (error) {
    state.inventory = previousInventory;
    renderWarehouse();
    throw error;
  }
  return true;
}

async function savePrepList() {
  const order = getSelectedOrder();
  if (!order || !ui.orderPrepList) return;
  const baseItems = getWarehousePrepItems(order);
  const nextItems = baseItems.map((item, index) => {
    const includedInput = ui.orderPrepList.querySelector(`[data-prep-field="included"][data-index="${index}"]`);
    const noteInput = ui.orderPrepList.querySelector(`[data-prep-field="note"][data-index="${index}"]`);
    return {
      title: item.title,
      quantity: Number(item.quantity || 1),
      included: Boolean(includedInput?.checked),
      note: String(noteInput?.value || "").trim(),
    };
  });
  const flowPayload = buildInboxOrderFlowPayload(order.id, order);
  const payload = flowPayload
    ? {
        ...flowPayload,
        warehouse: {
          ...(flowPayload.warehouse || {}),
          prepItems: nextItems,
        },
      }
    : {
        warehouse: {
          prepItems: nextItems,
        },
      };
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
}

async function updateOrderRouting(patch) {
  const order = getSelectedOrder();
  if (!order) return;
  return updateOrderRoutingById(order.id, patch);
}

async function updateOrderRoutingById(orderId, patch) {
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/operations`, {
    method: "POST",
    body: JSON.stringify(patch),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  state.selectedOrderId = saved.id;
  renderCurrentViewOnly(state.currentView);
  return saved;
}

function buildInboxOrderFlowPayload(orderId, currentOrder = null) {
  const order = currentOrder || state.orders.find((item) => item.id === orderId) || null;
  const statusInput = document.querySelector(`[data-order-flow-status="${orderId}"]`);
  const modeInput = document.querySelector(`[data-order-flow-mode="${orderId}"]`);
  const dateInput = document.querySelector(`[data-order-flow-date="${orderId}"]`);
  const warehouseToggle = document.querySelector(`[data-order-flow-warehouse="${orderId}"]`);
  const installToggle = document.querySelector(`[data-order-flow-installation="${orderId}"]`);
  if (!statusInput && !modeInput && !dateInput && !warehouseToggle && !installToggle) return null;
  const nextStatus = statusInput?.value || "da-preparare";
  const installSelected = Boolean(installToggle?.checked);
  const warehouseSelected = Boolean(warehouseToggle?.checked) || installSelected;
  const nextModeRaw = modeInput?.value || "da-definire";
  const nextMode = installSelected && nextModeRaw === "da-definire" ? "furgone" : nextModeRaw;
  const nextDate = dateInput?.value || "";
  const shouldRouteWarehouse = Boolean(
    warehouseSelected
    || nextMode !== "da-definire"
    || nextStatus !== "da-preparare"
    || nextDate
  );
  return {
    warehouse: {
      selected: shouldRouteWarehouse,
      status: nextStatus,
      fulfillmentMode: nextMode,
      preparationDate: nextDate,
    },
    installation: {
      selected: installSelected,
      required: installSelected || Boolean(order?.operations?.installation?.required),
    },
  };
}

async function saveInboxOrderFlow(orderId, patch = null, triggerButton = null) {
  const payload = patch || buildInboxOrderFlowPayload(orderId);
  if (!payload) return;
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  state.selectedOrderId = saved.id;
  renderCurrentViewOnly(state.currentView);
  flashButtonFeedback(triggerButton);
}

async function saveShipping(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order || !ui.shippingForm) return;
  clearStatus(ui.shippingStatus);
  const form = new FormData(ui.shippingForm);
  const currentWarehouse = order.operations?.warehouse || {};
  const currentStatus = String(currentWarehouse.status || "").trim();
  const fulfillmentMode = String(currentWarehouse.fulfillmentMode || "").trim();
  let nextReadyToShip = form.get("readyToShip") === "on";
  let nextCarrierPassed = form.get("carrierPassed") === "on";
  let nextShipped = form.get("shipped") === "on";
  const statusImpliesCompleted = currentStatus === "ritirato";
  if (statusImpliesCompleted) {
    nextReadyToShip = true;
    nextShipped = true;
    if (fulfillmentMode === "corriere") nextCarrierPassed = true;
  }
  if (nextShipped) {
    nextReadyToShip = true;
    if (fulfillmentMode === "corriere") nextCarrierPassed = true;
  }
  const shippingProofAttachments = mapAttachmentsForContext(order, "shipping");
  const requiresDeparturePhoto = Boolean(
    !isSampleOrder(order)
    && fulfillmentMode === "corriere"
    && nextShipped,
  );
  if (requiresDeparturePhoto && !shippingProofAttachments.length) {
    setStatus(
      ui.shippingStatus,
      "error",
      state.lang === "it"
        ? "Per segnare l'ordine come evaso carica prima la foto di partenza."
        : "Upload the departure photo before marking the order as shipped.",
    );
    return;
  }
  const destinationProvinceCode = normalizeProvinceCode(form.get("destinationProvinceCode"));
  const destinationProvinceRecord = getProvinceRecord(destinationProvinceCode);
  const payload = {
    warehouse: {
      trackingNumber: String(form.get("trackingNumber") || "").trim(),
      readyToShip: nextReadyToShip,
      carrierPassed: nextCarrierPassed,
      shipped: nextShipped,
      destination: {
        provinceCode: destinationProvinceCode,
        province: destinationProvinceRecord?.province || String(order.province || ""),
        postalCode: String(form.get("destinationPostalCode") || "").trim(),
        countryCode: String(order.countryCode || "IT").trim().toUpperCase(),
      },
      warehouseNote: form.get("warehouseNote"),
    },
  };
  let saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  let shopifyMessage = "";
  const shouldSyncTrackingToShopify = Boolean(
    nextShipped
    && String(payload.warehouse.trackingNumber || "").trim()
    && String(saved.source || order.source || "").toLowerCase().startsWith("shopify"),
  );
  if (shouldSyncTrackingToShopify) {
    try {
      const syncResult = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/sync-shopify-fulfillment`, {
        method: "POST",
        body: JSON.stringify({
          trackingNumber: payload.warehouse.trackingNumber,
          carrier: String(saved.operations?.warehouse?.carrier || state.settings?.carrierName || "").trim(),
        }),
      });
      saved = syncResult.order || saved;
      shopifyMessage = syncResult.alreadySynced
        ? (state.lang === "it"
          ? " Tracking Shopify gia allineato."
          : " Shopify tracking was already aligned.")
        : (state.lang === "it"
          ? " Tracking inviato anche a Shopify."
          : " Tracking was also sent to Shopify.");
    } catch (error) {
      state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
      renderCurrentViewOnly(state.currentView);
      setStatus(
        ui.shippingStatus,
        "error",
        state.lang === "it"
          ? `Spedizione salvata, ma l'aggiornamento tracking su Shopify e fallito. ${String(error.message || "").trim()}`
          : `Shipping saved, but the Shopify tracking update failed. ${String(error.message || "").trim()}`,
      );
      return;
    }
  }
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
  setStatus(
    ui.shippingStatus,
    "success",
    `${state.lang === "it" ? "Spedizione aggiornata correttamente." : "Shipping updated successfully."}${shopifyMessage}`,
  );
}

async function saveSampleShipping(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order || !ui.sampleForm || !isSampleOrder(order)) return;
  const sampleStatusNode = ui.sampleStatus || ui.shippingStatus;
  clearStatus(sampleStatusNode);
  const form = new FormData(ui.sampleForm);
  const nextShipped = form.get("sampleShipped") === "on";
  const carrier = String(form.get("sampleCarrier") || "SDA").trim() || "SDA";
  const trackingNumber = String(form.get("sampleTracking") || "").trim();
  const ldvNumber = String(form.get("sampleLdvNumber") || "").trim();
  const payload = {
    warehouse: {
      fulfillmentMode: order.operations?.warehouse?.fulfillmentMode && order.operations?.warehouse?.fulfillmentMode !== "da-definire"
        ? order.operations.warehouse.fulfillmentMode
        : "corriere",
      carrier,
      trackingNumber,
      pickupLabel: ldvNumber,
      readyToShip: nextShipped,
      carrierPassed: nextShipped,
      shipped: nextShipped,
    },
  };

  let saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  let shopifyMessage = "";
  const shouldSyncTrackingToShopify = Boolean(
    nextShipped
    && trackingNumber
    && String(saved.source || order.source || "").toLowerCase().startsWith("shopify"),
  );

  if (shouldSyncTrackingToShopify) {
    try {
      const syncResult = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/sync-shopify-fulfillment`, {
        method: "POST",
        body: JSON.stringify({
          trackingNumber,
          carrier,
        }),
      });
      saved = syncResult.order || saved;
      shopifyMessage = syncResult.alreadySynced
        ? (state.lang === "it" ? " Tracking Shopify già allineato." : " Shopify tracking was already aligned.")
        : (state.lang === "it" ? " Tracking inviato anche a Shopify." : " Tracking was also sent to Shopify.");
    } catch (error) {
      state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
      renderCurrentViewOnly(state.currentView);
      setStatus(
        sampleStatusNode,
        "error",
        state.lang === "it"
          ? `Spedizione campione salvata, ma sync Shopify fallita. ${String(error.message || "").trim()}`
          : `Sample shipping saved, but Shopify sync failed. ${String(error.message || "").trim()}`,
      );
      return;
    }
  }

  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
  setStatus(
    sampleStatusNode,
    "success",
    `${state.lang === "it" ? "Spedizione campione aggiornata correttamente." : "Sample shipping updated successfully."}${shopifyMessage}`,
  );
}

async function createDdt() {
  const order = getSelectedOrder();
  if (!order) return;
  const form = new FormData(ui.ddtForm);
  const trigger = ui.createDdtButton;
  const defaultLabel = trigger?.textContent || (state.lang === "it" ? "Crea PDF DDT" : "Create DDT PDF");
  if (trigger) {
    trigger.disabled = true;
    trigger.classList.add("is-busy");
    trigger.textContent = state.lang === "it" ? "Generazione..." : "Generating...";
  }
  if (ui.warehouseDdtStatus) {
    ui.warehouseDdtStatus.textContent = state.lang === "it"
      ? "Generazione DDT in corso..."
      : "Generating DDT...";
  }
  try {
    const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/create-ddt`, {
      method: "POST",
      body: JSON.stringify({
        number: form.get("number"),
        palletLength: form.get("palletLength"),
        palletWidth: form.get("palletWidth"),
        palletHeight: form.get("palletHeight"),
        palletWeight: form.get("palletWeight"),
      }),
    });
    state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
    renderCurrentViewOnly(state.currentView);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    await downloadDdtPdf(saved);
    if (ui.warehouseDdtStatus) {
      ui.warehouseDdtStatus.textContent = `DDT ${saved.operations?.warehouse?.ddt?.number || ""} ${state.lang === "it" ? "creato e scaricato in PDF." : "created and downloaded as PDF."}`;
    }
  } catch (error) {
    if (ui.warehouseDdtStatus) {
      ui.warehouseDdtStatus.textContent = state.lang === "it"
        ? `Errore generazione DDT: ${String(error?.message || "riprovare").trim()}`
        : `DDT generation failed: ${String(error?.message || "please retry").trim()}`;
    }
  } finally {
    if (trigger) {
      trigger.disabled = false;
      trigger.classList.remove("is-busy");
      trigger.textContent = defaultLabel;
    }
  }
}

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function splitPdfTextLines(value, maxChars = 56) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if (!word) return;
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      let chunk = word;
      while (chunk.length > maxChars) {
        lines.push(`${chunk.slice(0, Math.max(1, maxChars - 1))}-`);
        chunk = chunk.slice(Math.max(1, maxChars - 1));
      }
      current = chunk;
      return;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      lines.push(current);
      current = word;
      return;
    }
    current = candidate;
  });
  if (current) lines.push(current);
  return lines;
}

function pushWrappedPdfText(pushText, {
  x,
  startY,
  size,
  value,
  maxChars = 56,
  lineHeight = 12,
  maxLines = 2,
}) {
  const wrapped = splitPdfTextLines(value, maxChars);
  if (!wrapped.length) return 0;
  let rows = wrapped.slice(0, Math.max(1, maxLines));
  if (wrapped.length > rows.length) {
    const lastIndex = rows.length - 1;
    const base = rows[lastIndex].slice(0, Math.max(1, maxChars - 1)).trim();
    rows[lastIndex] = `${base}…`;
  }
  rows.forEach((row, index) => {
    pushText(x, startY - (index * lineHeight), size, row);
  });
  return rows.length;
}

function buildPdfContent(lines) {
  const content = ["BT", "/F1 12 Tf", "40 800 Td"];
  lines.forEach((line, index) => {
    if (index === 0) {
      content.push(`(${escapePdfText(line)}) Tj`);
    } else {
      content.push("0 -18 Td");
      content.push(`(${escapePdfText(line)}) Tj`);
    }
  });
  content.push("ET");
  return content.join("\n");
}

function encodeLatin1(str) {
  return new Uint8Array([...str].map((char) => char.charCodeAt(0) & 0xff));
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

let ddtLogoCache = undefined;

async function loadLogoJpegFromPath(path) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = path;
  });
  const ratio = image.naturalHeight / image.naturalWidth;
  const width = 98;
  const height = Math.round(width * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const binary = atob(dataUrl.split(",")[1]);
  return {
    binary,
    width,
    height,
    pixelWidth: image.naturalWidth,
    pixelHeight: image.naturalHeight,
  };
}

async function loadLogoJpeg() {
  if (ddtLogoCache !== undefined) return ddtLogoCache;
  try {
    ddtLogoCache = await loadLogoJpegFromPath("./logo-prato.png");
    return ddtLogoCache;
  } catch {
    try {
      ddtLogoCache = await loadLogoJpegFromPath("./logo-prato.jpg");
      return ddtLogoCache;
    } catch {
      ddtLogoCache = null;
      return null;
    }
  }
}

async function downloadDdtPdf(order) {
  const ddt = order.operations?.warehouse?.ddt || {};
  const logo = await loadLogoJpeg();
  const physicalLines = getWarehousePreparedLines(order);
  const estimate = calculateShippingEstimate(order, ddt);
  const destination = getShippingDestination(order);
  const recipientRows = [];
  const customerName = String(composeClientName(order) || "").trim();
  if (customerName) recipientRows.push(customerName);
  const addressRows = splitPdfTextLines(composeAddress(order) || addressIncompleteText(), 52);
  recipientRows.push(...addressRows);
  const cityRow = [
    destination.postalCode || "",
    order.city || "",
    destination.provinceCode ? `(${destination.provinceCode})` : "",
  ].filter(Boolean).join(" ");
  if (cityRow) recipientRows.push(cityRow);
  recipientRows.push(order.phone ? `Tel: ${order.phone} · ${phoneNoticeText().toUpperCase()}` : `Tel: ${phoneIncompleteText()} · ${phoneNoticeText().toUpperCase()}`);
  if (order.email) recipientRows.push(`Email: ${order.email}`);
  const lines = [];
  const pushText = (x, y, size, value) => {
    lines.push(`BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`);
  };
  const pushRule = (x1, y1, x2, y2) => {
    lines.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const pushRect = (x, y, w, h) => {
    lines.push(`${x} ${y} ${w} ${h} re S`);
  };

  lines.push("0.35 w");
  lines.push("0.16 0.30 0.20 RG");
  if (logo) {
    lines.push("q");
    lines.push("1 1 1 rg");
    lines.push("40 744 112 86 re f");
    lines.push("0 0 0 rg");
    lines.push(`${logo.width} 0 0 ${logo.height} 50 756 cm`);
    lines.push("/Im1 Do");
    lines.push("Q");
  }
  pushText(348, 805, 11, "PRATO SINTETICO ITALIA");
  pushText(348, 790, 8.5, "Vertex Srls · Via Ottorino Respighi 57");
  pushText(348, 778, 8.5, "81025 Marcianise (CE)");
  pushText(348, 766, 8.5, "www.pratosinteticoitalia.com");
  pushRect(40, 690, 515, 44);
  const printableDdtNumber = String(ddt.number || getOrderNumber(order)).replace(/^D\.?D\.?T\.?\s*[-:]?\s*/i, "");
  const shopifyOrderDateLabel = `${state.lang === "it" ? "Ordine Shopify" : "Shopify order"} ${formatDate(order.createdAt || order.updatedAt || ddt.createdAt || new Date().toISOString())}`;
  pushText(52, 716, 19, `DDT ${printableDdtNumber}`);
  pushText(404, 716, 10, `${state.lang === "it" ? "Data" : "Date"} ${formatDate(ddt.createdAt || new Date().toISOString())}`);
  pushText(404, 703, 8.5, shopifyOrderDateLabel);
  pushWrappedPdfText(pushText, {
    x: 52,
    startY: 698,
    size: 9,
    value: `${state.lang === "it" ? "Ordine" : "Order"} ${getOrderNumber(order)} · ${composeClientName(order)}`,
    maxChars: 84,
    lineHeight: 10,
    maxLines: 1,
  });
  pushRect(40, 564, 335, 112);
  pushText(52, 658, 9, state.lang === "it" ? "DESTINATARIO / SPEDIZIONE" : "RECIPIENT / SHIPMENT");
  recipientRows.slice(0, 6).forEach((row, index) => pushText(52, 638 - (index * 13), index === 0 ? 10 : 9, row));
  pushRect(392, 564, 163, 112);
  pushText(404, 658, 9, String(t("palletLabel")).toUpperCase());
  pushText(404, 638, 14, formatPalletDimensions(ddt));
  pushText(404, 616, 9, state.lang === "it" ? "PESO REALE" : "REAL WEIGHT");
  pushText(404, 600, 11, ddt.palletWeight || "—");
  pushText(404, 584, 9, String(t("estimatedCost")).toUpperCase());
  pushText(404, 568, 11, estimate.configured && estimate.billableWeight > 0 ? formatCurrency(estimate.estimatedCost) : "—");
  pushRect(40, 156, 515, 392);
  pushText(52, 530, 9, state.lang === "it" ? "ARTICOLI TRASPORTATI" : "TRANSPORTED ITEMS");
  pushText(454, 530, 9, state.lang === "it" ? "QTA" : "QTY");
  pushText(500, 530, 9, state.lang === "it" ? "NOTE" : "NOTES");
  pushRule(48, 518, 545, 518);
  let rowY = 496;
  let ddtRowsTruncated = false;
  for (const item of physicalLines) {
    const lineTitleRows = splitPdfTextLines(item.title || t("product"), 58);
    const noteRaw = String(item.note || "").trim();
    const noteLabel = state.lang === "it" ? "Tagli" : "Cuts";
    const noteText = noteRaw
      ? (/tagli?|cut/i.test(noteRaw) ? noteRaw : `${noteLabel}: ${noteRaw}`)
      : "";
    const lineNoteRows = noteText ? splitPdfTextLines(noteText, 20) : [];
    const visualRows = Math.max(1, lineTitleRows.length || 0, lineNoteRows.length || 0);
    const blockTopY = rowY;
    const blockBottomY = blockTopY - ((visualRows - 1) * 11);
    if (blockBottomY < 176) {
      ddtRowsTruncated = true;
      break;
    }
    for (let index = 0; index < visualRows; index += 1) {
      const lineY = rowY - (index * 11);
      const titleChunk = lineTitleRows[index] || "";
      const noteChunk = lineNoteRows[index] || "";
      if (titleChunk) pushText(52, lineY, 9.5, titleChunk);
      if (index === 0) pushText(458, lineY, 10, String(item.quantity || 1));
      if (noteChunk) pushText(500, lineY, 8.5, noteChunk);
    }
    rowY -= (visualRows * 11) + 7;
  }
  if (ddtRowsTruncated) {
    pushText(
      52,
      Math.max(170, rowY),
      8.5,
      state.lang === "it" ? "… altre righe presenti nel gestionale operativo" : "… additional rows available in the operations app",
    );
  }
  if (!physicalLines.length) {
    pushText(40, rowY, 10, state.lang === "it" ? "Nessuna merce fisica da trasportare" : "No physical goods to transport");
  }
  pushRule(40, 122, 555, 122);
  pushText(40, 102, 9, "FIRMA MITTENTE");
  pushText(228, 102, 9, "FIRMA TRASPORTATORE");
  pushText(410, 102, 9, "FIRMA DESTINATARIO");
  pushRule(40, 86, 176, 86);
  pushRule(228, 86, 364, 86);
  pushRule(410, 86, 546, 86);
  pushText(40, 52, 8, `Documento generato da Prato Sintetico Italia · Ordine ${getOrderNumber(order)} · ${composeClientName(order)} · Pagina 1/1`);

  const stream = lines.join("\n");
  const textStream = encodeLatin1(stream);
  const objects = [];
  const addTextObject = (content) => objects.push(encodeLatin1(content));
  addTextObject("<< /Type /Catalog /Pages 2 0 R >>");
  addTextObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  const pageResources = logo
    ? "<< /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >>"
    : "<< /Font << /F1 5 0 R >> >>";
  addTextObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources ${pageResources} >>`);
  objects.push(concatBytes(
    encodeLatin1(`<< /Length ${textStream.length} >>\nstream\n`),
    textStream,
    encodeLatin1("\nendstream"),
  ));
  addTextObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  if (logo) {
    objects.push(concatBytes(
      encodeLatin1(`<< /Type /XObject /Subtype /Image /Width ${logo.pixelWidth} /Height ${logo.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.binary.length} >>\nstream\n`),
      encodeLatin1(logo.binary),
      encodeLatin1("\nendstream"),
    ));
  }

  const chunks = [encodeLatin1("%PDF-1.4\n")];
  const offsets = [0];
  let pointer = chunks[0].length;
  objects.forEach((content, index) => {
    offsets.push(pointer);
    const header = encodeLatin1(`${index + 1} 0 obj\n`);
    const footer = encodeLatin1("\nendobj\n");
    chunks.push(header, content, footer);
    pointer += header.length + content.length + footer.length;
  });
  const xrefOffset = pointer;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encodeLatin1(xref));
  const blob = new Blob(chunks, { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${ddt.number || `DDT-${getOrderNumber(order)}`}.pdf`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 800);
}

async function saveInstallation(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order) return;
  const form = new FormData(ui.installationForm);
  clearStatus(ui.installationStatus);
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      installation: {
        installDate: form.get("installDate"),
        installTime: form.get("installTime"),
        status: form.get("status"),
        crew: getCrewForCurrentUser() || form.get("crew") || activeCrewLabelFromFilter(),
        reportNote: form.get("reportNote"),
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  if (saved.operations?.installation?.crew) {
    state.selectedInstallationCrew = saved.operations.installation.crew;
    if (canManageCoveragePlanner()) {
      ensureCoverageTeam(saved.operations.installation.crew);
      saveCoveragePlannerState();
    }
  }
  renderCurrentViewOnly(state.currentView);
  setStatus(
    ui.installationStatus,
    "success",
    state.lang === "it" ? "Programmazione posa aggiornata." : "Installation plan updated.",
  );
  flashButtonFeedback(event.submitter);
}

async function saveInstallationExpense(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order || !ui.installationExpenseForm) return;
  clearStatus(ui.installationExpenseStatus);
  const form = new FormData(ui.installationExpenseForm);
  const amount = toNumber(form.get("amount"));
  const date = String(form.get("date") || "").trim();
  if (!amount || !date) {
    setStatus(
      ui.installationExpenseStatus,
      "error",
      state.lang === "it" ? "Inserisci importo e data della spesa." : "Enter amount and expense date.",
    );
    return;
  }
  const nextExpenses = [
    ...getTravelExpensesForOrder(order),
    {
      id: `exp-${Date.now()}`,
      category: String(form.get("category") || "other"),
      amount,
      date,
      note: String(form.get("note") || "").trim(),
      crew: getCrewForCurrentUser() || order.operations?.installation?.crew || activeCrewLabelFromFilter(),
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser?.name || state.currentUser?.email || "",
    },
  ];
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      installation: {
        travelExpenses: nextExpenses,
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  if (ui.installationExpenseForm) {
    ui.installationExpenseForm.reset();
    if (ui.installationExpenseForm.date) ui.installationExpenseForm.date.value = new Date().toISOString().slice(0, 10);
  }
  renderCurrentViewOnly(state.currentView);
  setStatus(
    ui.installationExpenseStatus,
    "success",
    state.lang === "it" ? "Spesa trasferta registrata." : "Travel expense recorded.",
  );
}

function activeCrewLabelFromFilter() {
  return getActiveInstallationCrewFilter() || state.selectedInstallationCrew || "";
}

async function removeInstallationExpense(orderId, expenseId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;
  const nextExpenses = getTravelExpensesForOrder(order).filter((expense) => expense.id !== expenseId);
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      installation: {
        travelExpenses: nextExpenses,
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
}

async function assignInstallationOrderToDate(orderId, dateKey) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || !dateKey) return;
  const suggestedCrew = getActiveInstallationCrewFilter() || order.operations?.installation?.crew || "";
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      installation: {
        installDate: dateKey,
        status: order.operations?.installation?.status === "da-pianificare" ? "programmata" : order.operations?.installation?.status,
        crew: suggestedCrew,
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  state.selectedOrderId = saved.id;
  renderCurrentViewOnly(state.currentView);
}

async function saveAccounting(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order) return;
  const form = new FormData(ui.accountingForm);
  const payments = readAccountingPaymentDraft();
  const depositPaid = Number(payments.filter((entry) => entry.type === "deposit").reduce((sum, entry) => sum + toNumber(entry.amount || 0), 0).toFixed(2));
  const balancePaid = Number(payments.filter((entry) => entry.type !== "deposit").reduce((sum, entry) => sum + toNumber(entry.amount || 0), 0).toFixed(2));
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/accounting`, {
    method: "POST",
    body: JSON.stringify({
      paymentMethod: form.get("paymentMethod"),
      depositPaid,
      balancePaid,
      payments,
      invoiceRequired: form.get("invoiceRequired") === "yes",
      invoiceIssued: form.get("invoiceIssued") === "yes",
      accountingNote: form.get("accountingNote"),
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
}

async function saveSettings(event) {
  event.preventDefault();
  state.settings = await persistSettingsForm();
  setStatus(ui.settingsStatus, "success", state.lang === "it" ? "Impostazioni Shopify salvate." : "Shopify settings saved.");
  renderSettings();
}

async function persistSettingsForm() {
  const form = new FormData(ui.settingsForm);
  return apiFetch("/api/settings/shopify", {
    method: "POST",
    body: JSON.stringify({
      storeDomain: form.get("storeDomain"),
      clientId: form.get("clientId"),
      clientSecret: form.get("clientSecret"),
      adminAccessToken: form.get("adminAccessToken"),
      locationName: form.get("locationName"),
      carrierName: form.get("carrierName"),
      shippingRateMode: form.get("shippingRateMode") === "manual-weight" ? "manual-weight" : "oneexpress-auto",
      shippingTariffProfile: form.get("shippingTariffProfile") === "gold" ? "gold" : "silver",
      volumetricDivisor: form.get("volumetricDivisor"),
      rate80: form.get("rate80"),
      rate150: form.get("rate150"),
      rate300: form.get("rate300"),
      rate500: form.get("rate500"),
      rate1000: form.get("rate1000"),
      extraKgRate: form.get("extraKgRate"),
      webhookBaseUrl: window.location.origin,
    }),
  });
}

async function enableShopifyAutomation() {
  let webhookRegistered = false;
  try {
    const webhook = await apiFetch("/api/webhooks/register-shopify", {
      method: "POST",
    });
    state.settings = {
      ...state.settings,
      webhookEndpoint: webhook.endpoint || state.settings.webhookEndpoint || "",
      webhookSubscriptionId: webhook.subscriptionId || state.settings.webhookSubscriptionId || "",
    };
    webhookRegistered = Boolean(webhook.endpoint || webhook.subscriptionId);
  } catch (error) {
    console.warn("shopify_webhook_register_failed", error);
  }
  await runShopifySync({ silent: true });
  await keepSessionAlive({ silent: true });
  return { webhookRegistered };
}

async function connectShopify() {
  try {
    clearStatus(ui.settingsStatus);
    const form = new FormData(ui.settingsForm);
    const manualToken = String(form.get("adminAccessToken") || "").trim();
    const hadExistingToken = Boolean(state.settings?.hasAdminAccessToken);
    state.settings = await persistSettingsForm();
    const shop = String(state.settings.storeDomain || "").trim();
    if (!shop) {
      setStatus(ui.settingsStatus, "error", state.lang === "it" ? "Inserisci prima il dominio Shopify dello store." : "Enter the Shopify store domain first.");
      return;
    }
    if (manualToken || hadExistingToken || state.settings.hasAdminAccessToken) {
      const validation = await apiFetch("/api/settings/shopify/validate", {
        method: "POST",
      });
      state.settings = validation.settings || state.settings;
      const automation = await enableShopifyAutomation();
      const label = validation.shopName || validation.shopDomain || shop;
      setStatus(
        ui.settingsStatus,
        "success",
        state.lang === "it"
          ? `Shopify collegato correttamente a ${label}. ${automation.webhookRegistered ? "Import automatico attivo." : "Import iniziale completato."}`
          : `Shopify connected successfully to ${label}. ${automation.webhookRegistered ? "Automatic import is active." : "Initial import completed."}`,
      );
      renderSettings();
      return;
    }
    window.location.href = `/api/shopify/oauth/start?shop=${encodeURIComponent(shop)}`;
  } catch (error) {
    const rawMessage = String(error.message || "");
    const message = rawMessage === "unauthorized"
      ? (state.lang === "it" ? "Sessione scaduta. Ricarica la pagina ed effettua di nuovo il login." : "Session expired. Reload the page and log in again.")
      : rawMessage === "forbidden"
        ? (state.lang === "it" ? "Solo l'account office puo collegare Shopify." : "Only the office account can connect Shopify.")
        : rawMessage === "server_error"
          ? (state.lang === "it" ? "Errore server durante il salvataggio impostazioni Shopify." : "Server error while saving Shopify settings.")
          : rawMessage === "missing_shopify_token"
            ? (state.lang === "it"
              ? "Manca un Admin API access token valido. Inseriscilo nelle impostazioni oppure completa l'OAuth."
              : "A valid Admin API access token is missing. Enter it in settings or complete OAuth.")
            : rawMessage.startsWith("shopify_validation_failed:")
              ? (state.lang === "it"
                ? `Verifica Shopify fallita. ${rawMessage.replace("shopify_validation_failed:", "").trim()}`
                : `Shopify validation failed. ${rawMessage.replace("shopify_validation_failed:", "").trim()}`)
          : state.lang === "it"
            ? `Impossibile avviare il collegamento Shopify. ${rawMessage || "Controlla le impostazioni."}`
            : `Unable to start the Shopify connection. ${rawMessage || "Check the settings."}`;
    setStatus(ui.settingsStatus, "error", message);
  }
}

async function readCrewLogoDataUrlFromForm(form, existingLogo = "") {
  if (!form) return String(existingLogo || "");
  const file = form.querySelector('input[name="crewLogoFile"]')?.files?.[0];
  const shouldRemove = Boolean(form.querySelector('input[name="removeCrewLogo"]')?.checked);
  if (file) {
    const mime = String(file.type || "").trim().toLowerCase();
    const ext = String(file.name || "").trim().toLowerCase();
    const isAcceptedImage = mime.startsWith("image/")
      || ext.endsWith(".svg")
      || ext.endsWith(".png")
      || ext.endsWith(".jpg")
      || ext.endsWith(".jpeg")
      || ext.endsWith(".webp");
    if (!isAcceptedImage) {
      throw new Error("invalid_crew_logo_file");
    }
    if (Number(file.size || 0) > 6_000_000) {
      throw new Error("crew_logo_too_large");
    }
    return readFileAsDataUrl(file);
  }
  if (shouldRemove) return "";
  return String(existingLogo || "");
}

async function createManagedAccount(event) {
  event.preventDefault();
  if (!ui.accountCreateForm) return;
  clearStatus(ui.accountsStatus);
  const form = new FormData(ui.accountCreateForm);
  const role = String(form.get("role") || "");
  const crewName = String(form.get("crewName") || form.get("name") || "").trim();
  const dailyCapacity = toNumber(form.get("dailyCapacity") || DEFAULT_CREW_DAILY_CAPACITY);
  try {
    const crewLogoDataUrl = role === "crew"
      ? await readCrewLogoDataUrlFromForm(ui.accountCreateForm)
      : "";
    const created = await apiFetch("/api/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        role,
        status: form.get("status"),
        mustChangePassword: form.get("mustChangePassword") === "on",
        password: form.get("password"),
        crewName: role === "crew" ? crewName : "",
        dailyCapacity: role === "crew" ? dailyCapacity : 0,
        crewLogoDataUrl,
      }),
    });
    state.users = [...state.users, created].sort((a, b) => a.name.localeCompare(b.name, "it"));
    ui.accountCreateForm.reset();
    updateAccountCrewFieldVisibility(ui.accountCreateForm);
    setAccountCrewLogoPreview(ui.accountCreateForm, "");
    if (created.role === "crew" && created.crewName) {
      ensureCoverageTeam(created.crewName);
      saveCoveragePlannerState();
    }
    await reloadAll();
    renderAccountsManager();
    setStatus(ui.accountsStatus, "success", state.lang === "it" ? "Account creato correttamente." : "Account created successfully.");
  } catch (error) {
    const message = error.message === "email_already_exists"
      ? (state.lang === "it" ? "Esiste gia un account con questa email." : "An account with this email already exists.")
      : error.message === "crew_name_exists"
        ? (state.lang === "it" ? "Esiste gia una squadra con questo nome." : "A crew with this name already exists.")
      : error.message === "invalid_crew_logo_file"
        ? (state.lang === "it" ? "Carica un logo squadra in formato PNG, JPG, WebP o SVG." : "Upload a crew logo in PNG, JPG, WebP, or SVG format.")
      : error.message === "crew_logo_too_large"
        ? (state.lang === "it" ? "Il logo squadra è troppo pesante. Usa un file più leggero." : "The crew logo is too large. Use a lighter file.")
      : error.message === "weak_password_case"
        ? (state.lang === "it" ? "La password deve contenere maiuscole e minuscole." : "The password must contain uppercase and lowercase letters.")
      : error.message === "weak_password_number"
          ? (state.lang === "it" ? "La password deve contenere almeno un numero." : "The password must contain at least one number.")
      : error.message === "invalid_account_payload"
        ? (state.lang === "it" ? "Compila tutti i campi e usa una password di almeno 12 caratteri." : "Fill in all fields and use a password with at least 12 characters.")
        : (state.lang === "it" ? "Creazione account fallita." : "Account creation failed.");
    setStatus(ui.accountsStatus, "error", message);
  }
}

async function updateManagedAccount(event) {
  event.preventDefault();
  clearStatus(ui.accountsStatus);
  const form = event.currentTarget;
  const accountId = form.dataset.accountId;
  const data = new FormData(form);
  const previousAccount = state.users.find((item) => item.id === accountId) || null;
  const nextRole = String(data.get("role") || previousAccount?.role || "");
  const nextCrewName = String(data.get("crewName") || previousAccount?.crewName || data.get("name") || "").trim();
  const nextDailyCapacity = toNumber(data.get("dailyCapacity") || previousAccount?.dailyCapacity || DEFAULT_CREW_DAILY_CAPACITY);
  try {
    const crewLogoDataUrl = nextRole === "crew"
      ? await readCrewLogoDataUrlFromForm(form, previousAccount?.crewLogoDataUrl || "")
      : "";
    const saved = await apiFetch(`/api/accounts/${encodeURIComponent(accountId)}`, {
      method: "POST",
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        role: nextRole,
        status: data.get("status"),
        mustChangePassword: data.get("mustChangePassword") === "on",
        password: data.get("password"),
        crewName: nextRole === "crew" ? nextCrewName : "",
        dailyCapacity: nextRole === "crew" ? nextDailyCapacity : 0,
        removeCrewLogo: data.get("removeCrewLogo") === "on",
        crewLogoDataUrl,
      }),
    });
    if (previousAccount?.role === "crew" && previousAccount?.crewName && saved.role === "crew" && saved.crewName) {
      syncCoveragePlannerCrewRename(previousAccount.crewName, saved.crewName);
    }
    state.users = state.users.map((item) => (item.id === saved.id ? saved : item)).sort((a, b) => a.name.localeCompare(b.name, "it"));
    await reloadAll();
    renderAccountsManager();
    setStatus(ui.accountsStatus, "success", state.lang === "it" ? "Account aggiornato." : "Account updated.");
  } catch (error) {
    const message = error.message === "email_already_exists"
      ? (state.lang === "it" ? "Questa email e gia usata da un altro account." : "This email is already used by another account.")
      : error.message === "crew_name_exists"
        ? (state.lang === "it" ? "Esiste gia una squadra con questo nome." : "A crew with this name already exists.")
      : error.message === "invalid_crew_logo_file"
        ? (state.lang === "it" ? "Carica un logo squadra in formato PNG, JPG, WebP o SVG." : "Upload a crew logo in PNG, JPG, WebP, or SVG format.")
      : error.message === "crew_logo_too_large"
        ? (state.lang === "it" ? "Il logo squadra è troppo pesante. Usa un file più leggero." : "The crew logo is too large. Use a lighter file.")
      : error.message === "weak_password" || error.message === "weak_password_length"
        ? (state.lang === "it" ? "La nuova password deve avere almeno 12 caratteri." : "The new password must be at least 12 characters long.")
        : error.message === "weak_password_case"
          ? (state.lang === "it" ? "La password deve contenere maiuscole e minuscole." : "The password must contain uppercase and lowercase letters.")
          : error.message === "weak_password_number"
            ? (state.lang === "it" ? "La password deve contenere almeno un numero." : "The password must contain at least one number.")
        : error.message === "invalid_account_payload"
          ? (state.lang === "it" ? "Controlla nome, email e ruolo." : "Check name, email, and role.")
          : (state.lang === "it" ? "Aggiornamento account fallito." : "Account update failed.");
    setStatus(ui.accountsStatus, "error", message);
  }
}

async function updatePassword(event) {
  event.preventDefault();
  if (!ui.securityForm) return;
  clearStatus(ui.securityStatus);
  const form = new FormData(ui.securityForm);
  const currentPassword = String(form.get("currentPassword") || "");
  const newPassword = String(form.get("newPassword") || "");
  const confirmPassword = String(form.get("confirmPassword") || "");
  if (newPassword.length < 12) {
    setStatus(ui.securityStatus, "error", state.lang === "it" ? "La nuova password deve avere almeno 12 caratteri." : "The new password must be at least 12 characters long.");
    return;
  }
  if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
    setStatus(ui.securityStatus, "error", state.lang === "it" ? "Usa almeno una lettera maiuscola e una minuscola." : "Use at least one uppercase and one lowercase letter.");
    return;
  }
  if (!/\d/.test(newPassword)) {
    setStatus(ui.securityStatus, "error", state.lang === "it" ? "Aggiungi almeno un numero alla nuova password." : "Add at least one number to the new password.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setStatus(ui.securityStatus, "error", state.lang === "it" ? "La conferma password non coincide." : "Password confirmation does not match.");
    return;
  }
  try {
    await apiFetch("/api/account/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    await reloadAll();
    ui.securityForm.reset();
    setStatus(ui.securityStatus, "success", state.lang === "it" ? "Password aggiornata correttamente." : "Password updated successfully.");
  } catch (error) {
    const message = error.message === "invalid_current_password"
      ? (state.lang === "it" ? "La password attuale non e corretta." : "The current password is incorrect.")
      : error.message === "weak_password" || error.message === "weak_password_length"
        ? (state.lang === "it" ? "La nuova password e troppo debole." : "The new password is too weak.")
        : error.message === "weak_password_case"
          ? (state.lang === "it" ? "La nuova password deve contenere maiuscole e minuscole." : "The new password must contain uppercase and lowercase letters.")
          : error.message === "weak_password_number"
            ? (state.lang === "it" ? "La nuova password deve contenere almeno un numero." : "The new password must contain at least one number.")
        : (state.lang === "it" ? "Aggiornamento password fallito." : "Password update failed.");
    setStatus(ui.securityStatus, "error", message);
  }
}

async function handleShopifyOauthFeedback() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("shopify");
  const message = params.get("message");
  if (!status) return;

  if (status === "connected") {
    try {
      const validation = await apiFetch("/api/settings/shopify/validate", {
        method: "POST",
      });
      state.settings = validation.settings || state.settings;
      const automation = await enableShopifyAutomation();
      const label = validation.shopName || validation.shopDomain || state.settings.storeDomain || "Shopify";
      setStatus(
        ui.settingsStatus,
        "success",
        state.lang === "it"
          ? `Shopify collegato correttamente a ${label}. ${automation.webhookRegistered ? "Import automatico attivo." : "Import iniziale completato."}`
          : `Shopify connected successfully to ${label}. ${automation.webhookRegistered ? "Automatic import is active." : "Initial import completed."}`,
      );
      renderSettings();
    } catch (error) {
      setStatus(
        ui.settingsStatus,
        "error",
        state.lang === "it"
          ? `Collegamento Shopify completato, ma la verifica finale e fallita. ${String(error.message || "").trim()}`
          : `Shopify connection completed, but final validation failed. ${String(error.message || "").trim()}`,
      );
    }
  } else {
    setStatus(ui.settingsStatus, "error", message || (state.lang === "it" ? "Collegamento Shopify non completato." : "Shopify connection not completed."));
  }

  params.delete("shopify");
  params.delete("message");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function openMaps(order) {
  const query = composeAddress(order) || order.city || composeClientName(order);
  if (!query) {
    window.alert("Manca un indirizzo o una città da aprire in Google Maps.");
    return;
  }
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
}

function openRoute(order) {
  const query = composeAddress(order) || order.city || composeClientName(order);
  if (!query) {
    window.alert("Manca un indirizzo o una città da aprire nel navigatore.");
    return;
  }
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
}

function sendOrderEmail(order) {
  if (!order?.email) {
    window.alert("Manca un indirizzo email per questo cliente.");
    return;
  }
  const subject = encodeURIComponent(`Aggiornamento ordine ${getOrderNumber(order)}`);
  window.location.href = `mailto:${order.email}?subject=${subject}`;
}

function prefillInventoryForm(product) {
  if (!ui.inventoryForm) return;
  ui.inventoryForm.product.value = product || "";
  ui.inventoryForm.quantity.value = ui.inventoryForm.quantity.value || "1";
  ui.inventoryForm.status.value = "intero";
  updateInventoryFormUI();
  setView("warehouse");
  requestAnimationFrame(() => ui.inventoryForm.product.focus());
}

async function openAttachmentPicker(type) {
  if (ui.attachmentInput) {
    ui.attachmentInput.accept = type === "sales-content"
      ? "image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      : type === "sample-ldv"
        ? "application/pdf,image/*"
      : "image/*,.pdf";
  }
  if (type === "sales-content") {
    let content = getSelectedSalesContent();
    if (!content?.id) {
      clearStatus(ui.salesContentStatus);
      setStatus(
        ui.salesContentStatus,
        "success",
        state.lang === "it" ? "Preparazione contenuto in corso..." : "Preparing content...",
      );
      try {
        content = await ensureSelectedSalesContentForAttachment({ preparingUpload: true });
      } catch {
        content = null;
      }
      if (!content?.id) {
        setStatus(
          ui.salesContentStatus,
          "error",
          state.lang === "it"
            ? "Impossibile preparare il contenuto per l'allegato."
            : "Unable to prepare the content for the attachment.",
        );
        state.pendingAttachmentTarget = null;
        return;
      }
    }
    state.pendingAttachmentTarget = { type, id: content.id };
    ui.attachmentInput.value = "";
    ui.attachmentInput.click();
    return;
  }
  if (type === "sample-ldv") {
    const order = getSelectedOrder();
    if (!order || !isSampleOrder(order)) return;
    state.pendingAttachmentTarget = { type, id: order.id };
    ui.attachmentInput.value = "";
    ui.attachmentInput.click();
    return;
  }
  const order = getSelectedOrder();
  if (!order) return;
  state.pendingAttachmentTarget = { type, id: order.id };
  ui.attachmentInput.value = "";
  ui.attachmentInput.click();
}

async function handleAttachmentChange(event) {
  const file = event.target.files?.[0];
  const target = state.pendingAttachmentTarget;
  if (!file || !target) return;
  const targetStatus = getStatusNodeForAttachmentTarget(target.type);
  clearStatus(targetStatus);
  let resolvedTarget = target;
  if (target.type === "sales-content" && !target.id) {
    setStatus(
      targetStatus,
      "success",
      state.lang === "it" ? "Salvataggio contenuto in corso..." : "Saving content...",
    );
    try {
      const savedContent = await ensureSelectedSalesContentForAttachment();
      if (!savedContent?.id) {
        throw new Error("missing_content_id");
      }
      resolvedTarget = { ...target, id: savedContent.id };
      state.pendingAttachmentTarget = resolvedTarget;
    } catch (error) {
      setStatus(
        targetStatus,
        "error",
        state.lang === "it"
          ? "Impossibile preparare il contenuto. Salva titolo/categoria e riprova."
          : "Unable to prepare the content. Save title/category and try again.",
      );
      state.pendingAttachmentTarget = null;
      return;
    }
  }
  setStatus(
    targetStatus,
    "success",
    state.lang === "it" ? "Preparazione file in corso..." : "Preparing file...",
  );
  if (resolvedTarget.type === "sales-content") {
    try {
      const uploadPayload = await buildBinaryUploadPayload(file);
      setStatus(
        targetStatus,
        "success",
        state.lang === "it"
          ? `Caricamento diretto ${uploadPayload.optimized ? "ottimizzato " : ""}in corso...`
          : `Direct ${uploadPayload.optimized ? "optimized " : ""}upload in progress...`,
      );
      const query = new URLSearchParams({
        name: uploadPayload.name || file.name || "attachment",
        type: uploadPayload.type || file.type || "application/octet-stream",
        size: String(Number(uploadPayload.size || file.size || 0)),
        context: "sales-content",
      });
      const response = await fetch(`/api/sales/content-items/${encodeURIComponent(resolvedTarget.id)}/attachments/upload?${query.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": uploadPayload.type || file.type || "application/octet-stream",
        },
        body: uploadPayload.blob || file,
      });
      const saved = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(saved?.error || saved?.message || "upload_failed");
      }
      upsertSalesContent(saved, { skipOpsRender: true });
      renderSalesContent();
      setStatus(
        targetStatus,
        "success",
        state.lang === "it" ? "Allegato contenuto caricato correttamente." : "Content attachment uploaded successfully.",
      );
      return;
    } catch (error) {
      setStatus(
        targetStatus,
        "error",
        state.lang === "it" ? "Impossibile caricare l'allegato contenuto." : "Unable to upload the content attachment.",
      );
      return;
    } finally {
      state.pendingAttachmentTarget = null;
    }
  }
  let payload = null;
  try {
    payload = await buildAttachmentPayload(file);
  } catch (error) {
    setStatus(
      targetStatus,
      "error",
      state.lang === "it"
        ? "Impossibile preparare il file selezionato. Riprova con un file più leggero."
        : "Unable to prepare the selected file. Try a lighter file.",
    );
    state.pendingAttachmentTarget = null;
    return;
  }
  setStatus(
    targetStatus,
    "success",
    state.lang === "it"
      ? `Caricamento ${payload.optimized ? "ottimizzato " : ""}in corso...`
      : `Uploading ${payload.optimized ? "optimized " : ""}file...`,
  );
  try {
    const saved = await apiFetch(`/api/orders/${encodeURIComponent(resolvedTarget.id)}/attachments`, {
      method: "POST",
      body: JSON.stringify({
        attachments: [{
          name: payload.name,
          type: payload.type,
          size: payload.size,
          dataUrl: payload.dataUrl,
          context: target.type,
          createdAt: new Date().toISOString(),
        }],
      }),
    });
    state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
    renderCurrentViewOnly(state.currentView);
    setStatus(
      targetStatus,
      "success",
      resolvedTarget.type === "shipping"
        ? (state.lang === "it" ? "Foto logistica caricata correttamente." : "Shipping photo uploaded successfully.")
        : resolvedTarget.type === "sample-ldv"
          ? (state.lang === "it" ? "LDV caricata correttamente." : "Waybill uploaded successfully.")
        : resolvedTarget.type === "installation"
          ? (state.lang === "it" ? "Foto cantiere caricata correttamente." : "Site photo uploaded successfully.")
          : (state.lang === "it" ? "Allegato ordine caricato correttamente." : "Order attachment uploaded successfully."),
    );
  } catch (error) {
    setStatus(
      targetStatus,
      "error",
      resolvedTarget.type === "sales-content"
        ? (state.lang === "it" ? "Impossibile caricare l'allegato contenuto." : "Unable to upload the content attachment.")
        : resolvedTarget.type === "sample-ldv"
          ? (state.lang === "it" ? "Impossibile caricare la LDV." : "Unable to upload the waybill.")
        : (state.lang === "it" ? "Impossibile caricare l'allegato." : "Unable to upload the attachment."),
    );
  } finally {
    state.pendingAttachmentTarget = null;
  }
}

async function removeAttachment(orderId, attachmentIndex) {
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/attachments/${attachmentIndex}`, {
    method: "DELETE",
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  renderCurrentViewOnly(state.currentView);
}

function estimateDataUrlSize(dataUrl = "") {
  const encoded = String(dataUrl || "").split(",")[1] || "";
  if (!encoded) return 0;
  return Math.floor((encoded.length * 3) / 4);
}

function renameFileExtension(fileName = "", nextType = "") {
  const baseName = String(fileName || "").trim();
  if (!baseName) return baseName;
  const ext = nextType === "image/jpeg"
    ? "jpg"
    : nextType === "image/webp"
      ? "webp"
      : nextType === "image/png"
        ? "png"
        : "";
  if (!ext) return baseName;
  const cleanedBase = baseName.replace(/\.[a-z0-9]{1,5}$/i, "");
  return `${cleanedBase}.${ext}`;
}

function loadImageFromDataUrl(dataUrl = "") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function optimizeImageAttachment(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const originalSize = estimateDataUrlSize(originalDataUrl);
  const image = await loadImageFromDataUrl(originalDataUrl);
  const maxDimension = 2048;
  const largestSide = Math.max(image.width || 0, image.height || 0);
  const scale = largestSide > maxDimension ? (maxDimension / largestSide) : 1;
  if (scale >= 1 && originalSize <= 1_200_000) {
    return {
      dataUrl: originalDataUrl,
      size: file.size,
      type: file.type || "image/png",
      name: file.name,
      optimized: false,
    };
  }
  const width = Math.max(1, Math.round((image.width || 1) * scale));
  const height = Math.max(1, Math.round((image.height || 1) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      dataUrl: originalDataUrl,
      size: file.size,
      type: file.type || "image/png",
      name: file.name,
      optimized: false,
    };
  }
  ctx.drawImage(image, 0, 0, width, height);
  const hasAlpha = String(file.type || "").toLowerCase() === "image/png";
  const outputType = hasAlpha ? "image/png" : "image/jpeg";
  const outputDataUrl = canvas.toDataURL(outputType, outputType === "image/jpeg" ? 0.82 : undefined);
  const outputSize = estimateDataUrlSize(outputDataUrl);
  if (outputSize > 0 && outputSize >= originalSize && scale >= 1) {
    return {
      dataUrl: originalDataUrl,
      size: file.size,
      type: file.type || outputType,
      name: file.name,
      optimized: false,
    };
  }
  return {
    dataUrl: outputDataUrl,
    size: outputSize || file.size,
    type: outputType,
    name: renameFileExtension(file.name, outputType),
    optimized: true,
  };
}

function dataUrlToBlob(dataUrl = "") {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i);
  if (!match) return null;
  const mime = String(match[1] || "application/octet-stream").trim() || "application/octet-stream";
  const binary = window.atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

async function buildBinaryUploadPayload(file) {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.startsWith("image/")) {
    try {
      const optimized = await optimizeImageAttachment(file);
      if (optimized.optimized && optimized.dataUrl) {
        const blob = dataUrlToBlob(optimized.dataUrl);
        if (blob?.size) {
          return {
            blob,
            size: blob.size,
            type: optimized.type || file.type || "application/octet-stream",
            name: optimized.name || file.name || "attachment",
            optimized: true,
          };
        }
      }
    } catch {
      // fallback to original file upload
    }
  }
  return {
    blob: file,
    size: Number(file?.size || 0),
    type: file?.type || "application/octet-stream",
    name: file?.name || "attachment",
    optimized: false,
  };
}

async function buildAttachmentPayload(file) {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.startsWith("image/")) {
    try {
      return await optimizeImageAttachment(file);
    } catch {
      // fallback to original payload
    }
  }
  const dataUrl = await readFileAsDataUrl(file);
  return {
    dataUrl,
    size: file.size,
    type: file.type || "application/octet-stream",
    name: file.name || "attachment",
    optimized: false,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function reloadAll() {
  if (reloadAllInFlight || state.syncInProgress) return false;
  reloadAllInFlight = true;
  state.syncInProgress = true;
  updateShell();
  try {
    const session = await apiFetch("/api/session");
    return applyFetchedSessionSnapshot(session, {
      renderMode: "current",
      enforcePasswordResetView: false,
    });
  } finally {
    reloadAllInFlight = false;
    state.syncInProgress = false;
    updateShell();
  }
}

function handleInstallationBacklogDragStart(event) {
  const card = event.target.closest("[data-installation-drag-id]");
  if (!card || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.installationDragId || "");
  card.classList.add("is-dragging");
}

function handleInstallationBacklogDragEnd(event) {
  const card = event.target.closest("[data-installation-drag-id]");
  if (card) card.classList.remove("is-dragging");
  document.querySelectorAll(".cal-day.is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
}

function handleInstallationCalendarDragOver(event) {
  const day = event.target.closest("[data-drop-date]");
  if (!day) return;
  event.preventDefault();
  document.querySelectorAll(".cal-day.is-drop-target").forEach((node) => {
    if (node !== day) node.classList.remove("is-drop-target");
  });
  day.classList.add("is-drop-target");
}

function handleInstallationCalendarDragLeave(event) {
  const day = event.target.closest("[data-drop-date]");
  if (!day) return;
  day.classList.remove("is-drop-target");
}

function handleInstallationCalendarDrop(event) {
  const day = event.target.closest("[data-drop-date]");
  if (!day) return;
  event.preventDefault();
  const orderId = event.dataTransfer?.getData("text/plain") || "";
  day.classList.remove("is-drop-target");
  if (!orderId) return;
  assignInstallationOrderToDate(orderId, day.dataset.dropDate || "");
}

function handleGlobalClick(event) {
  const targetNode = event.target instanceof Element ? event.target : event.target?.parentElement;
  if (!targetNode) return;
  const button = targetNode.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "orders-prev-page") {
    state.orderPage = Math.max(1, (state.orderPage || 1) - 1);
    state.selectedOrderId = null;
    renderOrders();
    ui.ordersList?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "orders-next-page") {
    state.orderPage = (state.orderPage || 1) + 1;
    state.selectedOrderId = null;
    renderOrders();
    ui.ordersList?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "sales-requests-prev-page") {
    state.salesRequestPage = Math.max(1, (state.salesRequestPage || 1) - 1);
    renderSalesRequests();
    ui.salesRequestsList?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "sales-requests-next-page") {
    state.salesRequestPage = (state.salesRequestPage || 1) + 1;
    renderSalesRequests();
    ui.salesRequestsList?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "open-sales-request-whatsapp") {
    event.preventDefault();
    event.stopPropagation();
    const request = state.salesRequests.find((item) => item.id === id) || getSelectedSalesRequest();
    if (!request) return;
    openSalesRequestWhatsAppContact(request).catch(() => {
      setStatus(
        ui.salesRequestsStatus,
        "error",
        state.lang === "it" ? "Impossibile aprire il contatto WhatsApp." : "Unable to open WhatsApp contact.",
      );
    });
    return;
  }
  if (action === "delete-inventory-piece") {
    removeInventoryPieceById(id).catch(() => {
      setStatus(
        ui.ordersStatus,
        "error",
        state.lang === "it" ? "Impossibile rimuovere l'elemento di giacenza." : "Unable to remove stock item.",
      );
    });
    return;
  }
  if (action === "remove-last-inventory-piece") {
    const product = String(button.dataset.product || "").trim();
    if (!product) return;
    removeLatestInventoryPieceByProduct(product).catch(() => {
      setStatus(
        ui.ordersStatus,
        "error",
        state.lang === "it" ? "Impossibile rimuovere l'ultimo elemento di giacenza." : "Unable to remove latest stock item.",
      );
    });
    return;
  }
  if (action === "clear-inventory-product") {
    const product = String(button.dataset.product || "").trim();
    if (!product) return;
    clearInventoryProductStock(product).catch(() => {
      setStatus(
        ui.ordersStatus,
        "error",
        state.lang === "it" ? "Impossibile azzerare la giacenza del prodotto." : "Unable to clear product stock.",
      );
    });
    return;
  }
  if (action === "prefill-inventory") {
    prefillInventoryForm(button.dataset.product || "");
    return;
  }
  if (action === "remove-attachment") {
    event.preventDefault();
    event.stopPropagation();
    removeAttachment(id, Number(button.dataset.index || -1)).catch((error) => {
      const message = error?.message === "attachment_not_found"
        ? (state.lang === "it" ? "Allegato gia rimosso o non trovato." : "Attachment already removed or not found.")
        : (state.lang === "it" ? "Impossibile rimuovere l'allegato." : "Unable to remove attachment.");
      const activeShippingStatus = ui.sampleDetailPanel && !ui.sampleDetailPanel.classList.contains("hidden")
        ? (ui.sampleStatus || ui.shippingStatus)
        : ui.shippingStatus;
      const targetStatus = state.currentView === "installations"
        ? ui.installationStatus
        : state.currentView === "shipping"
          ? activeShippingStatus
          : ui.ordersStatus;
      if (targetStatus) setStatus(targetStatus, "error", message);
    });
    return;
  }
  if (action === "open-rdf") {
    const targetOrder = state.orders.find((item) => item.id === id) || getSelectedOrder();
    if (!targetOrder) return;
    openRdfWithData(targetOrder);
    return;
  }
  if (action === "open-sample-ldv") {
    const targetOrder = state.orders.find((item) => item.id === id) || getSelectedOrder();
    if (!targetOrder) return;
    openSampleLdvFile(targetOrder);
    return;
  }
  if (action === "save-inbox-flow") {
    saveInboxOrderFlow(id, null, button);
    return;
  }
  if (action === "open-sold-sqm") {
    openDashboardViewTarget({ dataset: { view: "orders", orderFilter: "all" } });
    return;
  }
  if (action === "use-planner-prefill") {
    activatePlannerPrefill({ force: true, openView: state.currentView !== "sales-generator" });
    return;
  }
  if (action === "open-planner-report") {
    openPlannerReportPreview(button.dataset.variant || "technical");
    return;
  }
  if (action === "open-dashboard-view") {
    openDashboardViewTarget(button);
    return;
  }
  if (action === "open-profit-split-order") {
    if (!id) return;
    if (!setProfitSplitContextOrder(id, { preferStored: true })) return;
    setView("profit-split");
    return;
  }
  if (action === "toggle-crew-unavailable") {
    if (state.currentUser?.role !== "crew") return;
    const crewName = getCrewForCurrentUser();
    const dateKey = button.dataset.date || "";
    toggleCrewUnavailable(crewName, dateKey);
    return;
  }
  if (action === "select-coverage-team") {
    const teamName = button.dataset.coverageTeam || "";
    if (teamName) selectInstallationCrew(teamName);
    return;
  }
  if (action === "select-coverage-order") {
    const orderId = button.dataset.coverageOrder || "";
    if (!orderId) return;
    state.selectedOrderId = orderId;
    renderInstallations();
    requestAnimationFrame(() => {
      scrollCurrentViewToTop();
      focusViewTarget("installations");
    });
    return;
  }
  if (action === "set-installation-crew-filter") {
    const nextFilter = button.dataset.installationFilter || "all";
    state.filters.installation = nextFilter;
    if (nextFilter !== "all") {
      state.selectedInstallationCrew = nextFilter;
    }
    renderInstallations();
    return;
  }
  if (action === "remove-installation-expense") {
    const expenseId = button.dataset.expenseId || "";
    if (!id || !expenseId) return;
    removeInstallationExpense(id, expenseId);
    return;
  }
  if (action === "select-sales-request") {
    state.creatingSalesRequest = false;
    state.selectedSalesRequestId = id || "";
    renderSalesRequests();
    if (state.currentView === "sales-generator") renderSalesGenerator();
    if (window.innerWidth <= 980) {
      requestAnimationFrame(() => ui.salesRequestDetailTitle?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    return;
  }
  if (action === "select-sales-content") {
    state.creatingSalesContent = false;
    state.selectedSalesContentId = id || "";
    renderSalesContent();
    if (window.innerWidth <= 980) {
      requestAnimationFrame(() => ui.salesContentDetailTitle?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    return;
  }
  if (action === "set-sales-content-category") {
    state.salesContentCategory = normalizeSalesContentCategoryFilter(button.dataset.category || "");
    state.salesContentPage = 1;
    renderSalesContent();
    return;
  }
  if (action === "sales-content-prev-page") {
    state.salesContentPage = Math.max(1, Number(state.salesContentPage || 1) - 1);
    renderSalesContent();
    return;
  }
  if (action === "sales-content-next-page") {
    state.salesContentPage = Number(state.salesContentPage || 1) + 1;
    renderSalesContent();
    return;
  }
  if (action === "remove-sales-content-attachment") {
    event.preventDefault();
    event.stopPropagation();
    if (!id) return;
    removeSalesContentAttachment(id, Number(button.dataset.index || -1), button.dataset.attachmentId || "").catch(() => {
      setStatus(
        ui.salesContentStatus,
        "error",
        state.lang === "it" ? "Impossibile rimuovere l'allegato." : "Unable to remove the attachment.",
      );
    });
    return;
  }
  if (action === "add-accounting-payment") {
    state.accountingMobilePane = "payments";
    addAccountingPaymentRow();
    updateAccountingPaneVisibility();
    requestAnimationFrame(() => {
      ui.accountingPaymentsEditor?.lastElementChild?.querySelector("[name='paymentAmount']")?.focus();
    });
    return;
  }
  if (action === "set-accounting-pane") {
    setAccountingPane(button.dataset.pane || "summary");
    return;
  }
  const order = state.orders.find((item) => item.id === id) || getSelectedOrder();
  if (!order) return;
  if (action === "select-order") {
    state.selectedOrderId = id;
    const nextView = button.dataset.view || state.currentView;
    if (nextView === "accounting") {
      state.accountingMobilePane = "summary";
    }
    if (nextView === "installations") {
      state.installationMobilePane = "summary";
    }
    if (window.innerWidth <= 980) {
      state.mobileMenuOpen = false;
      updateMobileMenu();
    }
    if (button.dataset.view) {
      setView(button.dataset.view);
    } else {
      renderCurrentViewOnly(state.currentView);
      focusViewTarget(state.currentView);
    }
    revealMobileDetailTarget(nextView);
    return;
  }
  if (action === "open-modal") {
    state.selectedOrderId = order.id;
    openOrderModal(order);
    return;
  }
  if (action === "open-maps") {
    openMaps(order);
    return;
  }
  if (action === "call-client") {
    if (order.phone) window.open(`tel:${order.phone}`);
    return;
  }
}

function handleGlobalActionKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const trigger = event.target.closest("[data-action][role='button']");
  if (!trigger) return;
  event.preventDefault();
  trigger.click();
}

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-order-draggable='true']");
  if (!card) return;
  card.classList.add("is-dragging");
  event.dataTransfer.setData("text/plain", card.dataset.id || "");
  event.dataTransfer.effectAllowed = "move";
});

document.addEventListener("dragend", (event) => {
  const card = event.target.closest("[data-order-draggable='true']");
  if (card) card.classList.remove("is-dragging");
  document.querySelectorAll("[data-route-dropzone]").forEach((node) => node.classList.remove("is-over"));
});

document.addEventListener("dragover", (event) => {
  const zone = event.target.closest("[data-route-dropzone]");
  if (!zone) return;
  event.preventDefault();
  zone.classList.add("is-over");
});

document.addEventListener("dragleave", (event) => {
  const zone = event.target.closest("[data-route-dropzone]");
  if (zone) zone.classList.remove("is-over");
});

document.addEventListener("drop", (event) => {
  const zone = event.target.closest("[data-route-dropzone]");
  if (!zone) return;
  event.preventDefault();
  zone.classList.remove("is-over");
  const orderId = event.dataTransfer.getData("text/plain");
  if (!orderId) return;
  if (zone.dataset.route === "warehouse") {
    updateOrderRoutingById(orderId, { warehouse: { selected: true }, installation: { selected: false } });
    return;
  }
  if (zone.dataset.route === "installation") {
    updateOrderRoutingById(orderId, { warehouse: { selected: true }, installation: { selected: true, required: true } });
    return;
  }
  updateOrderRoutingById(orderId, { warehouse: { selected: false }, installation: { selected: false } });
});

document.addEventListener("click", (event) => {
  const control = event.target.closest("button, .btn, .topbar-btn, .filter-btn, .primary-button, .mini-action, a.topbar-btn");
  if (!control) return;
  flashButtonFeedback(control);
});

ui.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setShellPending(true);
  try {
    const form = new FormData(ui.authForm);
    const session = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    applySessionPayload(session);
    if (state.currentUser?.mustChangePassword) state.currentView = "settings";
    ensureSelectedOrder();
    ui.authError.classList.add("hidden");
    showApp();
  } catch (error) {
    ui.authError.textContent = error.message === "invalid_credentials"
      ? "Credenziali non valide."
      : error.message === "account_suspended"
        ? "Questo account e sospeso. Accedi con un account office per riattivarlo."
      : error.message === "too_many_attempts"
        ? "Troppi tentativi di accesso. Attendi 2 minuti e riprova."
        : "Errore server o sessione non salvata. Riprova tra qualche secondo.";
    ui.authError.classList.remove("hidden");
  } finally {
    setShellPending(false);
  }
});

function bindEvent(node, eventName, handler) {
  if (node) node.addEventListener(eventName, handler);
}

function flashButtonFeedback(node) {
  if (!node) return;
  node.classList.remove("is-feedback");
  requestAnimationFrame(() => {
    node.classList.add("is-feedback");
    window.setTimeout(() => node.classList.remove("is-feedback"), 520);
  });
}

ui.navLinks.forEach((button) => button.addEventListener("click", () => {
  state.mobileMenuOpen = false;
  updateMobileMenu();
  setView(button.dataset.view);
}));
ui.langButtons.forEach((button) => {
  if (button.dataset.boundLang === "true") return;
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    ui.langButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.lang === state.lang));
    renderCurrentViewOnly(state.currentView);
  });
  button.dataset.boundLang = "true";
});
ui.quickViewButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.quickView)));
bindEvent(ui.logoutButton, "click", async () => {
  await apiFetch("/api/logout", { method: "POST" });
  applySessionPayload({});
  showAuth();
});
bindEvent(ui.mobileLogoutButton, "click", async () => {
  await apiFetch("/api/logout", { method: "POST" });
  state.mobileMenuOpen = false;
  applySessionPayload({});
  showAuth();
});
bindEvent(ui.mobileLogoutInlineButton, "click", async () => {
  await apiFetch("/api/logout", { method: "POST" });
  state.mobileMenuOpen = false;
  applySessionPayload({});
  showAuth();
});
bindEvent(ui.reloadButton, "click", reloadAll);
bindEvent(ui.mobileReloadButton, "click", reloadAll);
bindEvent(ui.newOrderButton, "click", () => openOrderModal(null));
bindEvent(ui.mobileMenuButton, "click", () => {
  state.mobileMenuOpen = !state.mobileMenuOpen;
  updateMobileMenu();
});
bindEvent(ui.mobileMenuClose, "click", () => {
  state.mobileMenuOpen = false;
  updateMobileMenu();
});
bindEvent(ui.mobileSidebarBackdrop, "click", () => {
  state.mobileMenuOpen = false;
  updateMobileMenu();
});
bindEvent(ui.ordersSyncButton, "click", syncShopifyOrders);
bindEvent(ui.ordersImportButton, "click", () => {
  state.showOrderImport = !state.showOrderImport;
  updateOrderImportPanel();
  if (state.showOrderImport) {
    clearStatus(ui.ordersStatus);
    ui.orderImportText?.focus();
  }
});
bindEvent(ui.orderImportConfirmButton, "click", importOrdersJson);
bindEvent(ui.orderImportClearButton, "click", () => {
  if (ui.orderImportText) ui.orderImportText.value = "";
  clearStatus(ui.ordersStatus);
  ui.orderImportText?.focus();
});
bindEvent(ui.ordersClearManualButton, "click", clearManualOrders);
bindEvent(ui.ordersSearch, "input", (event) => {
  state.search.orders = event.target.value;
  state.orderPage = 1;
  scheduleSearchRender("orders", renderOrders);
});
bindEvent(ui.salesRequestsSearch, "input", (event) => {
  state.search.salesRequests = event.target.value;
  state.salesRequestPage = 1;
  scheduleSearchRender("sales-requests", renderSalesRequests);
});
bindEvent(ui.salesRequestImportButton, "click", () => {
  state.showSalesRequestImport = !state.showSalesRequestImport;
  updateSalesRequestImportPanel();
  if (state.showSalesRequestImport) {
    clearStatus(ui.salesRequestsStatus);
    ui.salesRequestImportText?.focus();
  }
});
bindEvent(ui.salesRequestImportConfirmButton, "click", importSalesRequests);
bindEvent(ui.salesRequestImportClearButton, "click", () => {
  if (ui.salesRequestImportText) ui.salesRequestImportText.value = "";
  clearStatus(ui.salesRequestsStatus);
  ui.salesRequestImportText?.focus();
});
bindEvent(ui.salesRequestForm, "submit", saveSalesRequest);
bindEvent(ui.salesRequestNewButton, "click", createNewSalesRequest);
bindEvent(ui.salesRequestDeleteButton, "click", deleteSalesRequest);
bindEvent(ui.salesRequestUseGeneratorButton, "click", useSelectedSalesRequestInGenerator);
bindEvent(ui.salesRequestServiceAccountButton, "click", () => ui.salesRequestServiceAccountInput?.click());
bindEvent(ui.salesRequestServiceAccountInput, "change", handleSalesRequestServiceAccountSelection);
bindEvent(ui.salesRequestClearServiceAccountButton, "click", () => saveSalesRequestSourceConfig({ clearServiceAccount: true }));
bindEvent(ui.salesRequestSourceSaveButton, "click", () => saveSalesRequestSourceConfig());
bindEvent(ui.salesRequestSourceSyncButton, "click", syncSalesRequestSource);
bindEvent(ui.salesRequestOpenSheetButton, "click", openSalesRequestSourceSheet);
bindEvent(ui.salesGeneratorOpenRequestButton, "click", () => setView("sales-requests"));
bindEvent(ui.salesGeneratorPrefillButton, "click", () => {
  state.salesGeneratorFreeMode = false;
  state.salesGeneratorPlannerMode = false;
  pushSalesRequestToGenerator(true);
  renderSalesGenerator();
});
bindEvent(ui.salesGeneratorFreeQuoteButton, "click", toggleSalesGeneratorFreeMode);
bindEvent(ui.salesGeneratorFrame, "load", () => {
  pushSalesGeneratorBranding(true);
  if (state.salesGeneratorPlannerMode) {
    pushPlannerPrefillToGenerator(true);
  } else if (state.salesGeneratorFreeMode) {
    clearSalesRequestPrefillInGenerator({ keepFreeMode: true });
  } else {
    pushSalesRequestToGenerator(true);
  }
});
bindEvent(ui.salesContentSearch, "input", (event) => {
  state.search.salesContent = event.target.value;
  state.salesContentPage = 1;
  scheduleSearchRender("sales-content", renderSalesContent);
});
bindEvent(ui.salesContentSearchClear, "click", () => {
  if (!ui.salesContentSearch) return;
  ui.salesContentSearch.value = "";
  state.search.salesContent = "";
  state.salesContentPage = 1;
  clearSearchRenderTimer("sales-content");
  renderSalesContent();
  ui.salesContentSearch.focus();
});
bindEvent(ui.salesContentForm, "submit", saveSalesContent);
bindEvent(ui.salesContentNewButton, "click", createNewSalesContent);
bindEvent(ui.salesContentDeleteButton, "click", deleteSalesContent);
bindEvent(ui.salesContentAttachmentButton, "click", () => openAttachmentPicker("sales-content"));
bindEvent(ui.warehouseSearch, "input", (event) => {
  state.search.warehouse = event.target.value;
  scheduleSearchRender("warehouse", renderWarehouse);
});
bindEvent(ui.accountingSearch, "input", (event) => {
  state.search.accounting = event.target.value;
  scheduleSearchRender("accounting", renderAccounting);
});
bindEvent(ui.accountingAddPaymentButton, "click", () => {
  state.accountingMobilePane = "payments";
  addAccountingPaymentRow();
  updateAccountingPaneVisibility();
  requestAnimationFrame(() => {
    ui.accountingPaymentsEditor?.lastElementChild?.querySelector("[name='paymentAmount']")?.focus();
  });
});
bindEvent(ui.accountingPaymentsEditor, "click", (event) => {
  const removeButton = event.target.closest("[data-remove-payment]");
  if (!removeButton) return;
  removeAccountingPaymentRow(removeButton.dataset.removePayment || "");
});
if (ui.importShopifyPaymentButton) {
  ui.importShopifyPaymentButton.addEventListener("click", importShopifyPayment);
}
bindEvent(ui.orderImportText, "keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    importOrdersJson();
  }
});
if (ui.shippingSearch) {
  ui.shippingSearch.addEventListener("input", (event) => {
    state.search.shipping = event.target.value;
    scheduleSearchRender("shipping", renderShipping);
  });
}
ui.orderFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.filters.order = button.dataset.orderFilter;
  ui.orderFilterTags.forEach((item) => item.classList.toggle("is-active", item === button));
  state.orderPage = 1;
  renderOrders();
}));
ui.warehouseFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.filters.warehouse = button.dataset.warehouseFilter;
  ui.warehouseFilterTags.forEach((item) => item.classList.toggle("is-active", item === button));
  renderWarehouse();
}));
ui.installationFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.filters.installation = button.dataset.installationFilter;
  ui.installationFilterTags.forEach((item) => item.classList.toggle("is-active", item === button));
  renderInstallations();
}));
ui.accountingFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.filters.accounting = button.dataset.accountingFilter;
  ui.accountingFilterTags.forEach((item) => item.classList.toggle("is-active", item === button));
  renderAccounting();
}));
if (ui.shippingFilterTags?.length) {
  ui.shippingFilterTags.forEach((button) => button.addEventListener("click", () => {
    state.filters.shipping = button.dataset.shippingFilter;
    ui.shippingFilterTags.forEach((item) => item.classList.toggle("is-active", item === button));
    renderShipping();
  }));
}
bindEvent(ui.orderAttachmentButton, "click", () => openAttachmentPicker("order"));
bindEvent(ui.shippingAttachmentButton, "click", () => openAttachmentPicker("shipping"));
bindEvent(ui.sampleUploadLdvButton, "click", () => openAttachmentPicker("sample-ldv"));
bindEvent(ui.sampleOpenRdfButton, "click", () => {
  const order = getSelectedOrder();
  if (!order) return;
  openRdfWithData(order);
});
if (ui.savePrepListButton) {
  ui.savePrepListButton.addEventListener("click", savePrepList);
}
bindEvent(ui.inventoryForm, "submit", saveInventory);
if (ui.inventoryForm) {
  ui.inventoryForm.product?.addEventListener("input", updateInventoryFormUI);
  ui.inventoryForm.variant?.addEventListener("change", updateInventoryFormUI);
}
bindEvent(ui.inventoryJumpButton, "click", () => {
  ui.inventoryForm?.scrollIntoView({ behavior: "smooth", block: "start" });
  requestAnimationFrame(() => ui.inventoryForm?.product?.focus());
});
if (ui.shippingForm) {
  ui.shippingForm.addEventListener("submit", saveShipping);
}
if (ui.sampleForm) {
  ui.sampleForm.addEventListener("submit", saveSampleShipping);
}
bindEvent(ui.createDdtButton, "click", createDdt);
if (ui.ddtForm) {
  ui.ddtForm.addEventListener("input", () => {
    refreshShippingDraftPreview();
  });
}
bindEvent(ui.installationForm, "submit", saveInstallation);
bindEvent(ui.installationExpenseForm, "submit", saveInstallationExpense);
bindEvent(ui.installationList, "dragstart", handleInstallationBacklogDragStart);
bindEvent(ui.installationList, "dragend", handleInstallationBacklogDragEnd);
bindEvent(ui.installationCalendar, "dragover", handleInstallationCalendarDragOver);
bindEvent(ui.installationCalendar, "dragleave", handleInstallationCalendarDragLeave);
bindEvent(ui.installationCalendar, "drop", handleInstallationCalendarDrop);
bindEvent(ui.coverageTeamForm, "submit", saveCoverageTeamFromForm);
bindEvent(ui.coverageAddTeamButton, "click", addCoverageTeam);
bindEvent(ui.coverageRemoveTeamButton, "click", removeCoverageTeam);
bindEvent(ui.coverageDrawButton, "click", toggleCoverageDrawing);
bindEvent(ui.coverageUndoPointButton, "click", undoCoveragePoint);
bindEvent(ui.coverageClosePolygonButton, "click", closeCoveragePolygon);
bindEvent(ui.coverageClearPolygonsButton, "click", clearCoveragePolygons);
if (ui.coverageMapOverlay) {
  ui.coverageMapOverlay.addEventListener("click", handleCoverageMapClick);
}
if (ui.coverageTeamList) {
  ui.coverageTeamList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-coverage-team]");
    if (!card) return;
    selectInstallationCrew(card.dataset.coverageTeam);
  });
}
if (ui.coverageRegionGrid) {
  ui.coverageRegionGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coverage-region]");
    if (!button) return;
    toggleCoverageRegion(button.dataset.coverageRegion);
  });
}
if (ui.coverageJobsList) {
  ui.coverageJobsList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-coverage-order]");
    if (!card) return;
    state.selectedOrderId = card.dataset.coverageOrder;
    renderInstallations();
    ui.installationDetailTitle?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
bindEvent(ui.installationPrevWeekButton, "click", () => {
  state.installationWeekOffset -= 1;
  renderInstallations();
});
bindEvent(ui.installationNextWeekButton, "click", () => {
  state.installationWeekOffset += 1;
  renderInstallations();
});
bindEvent(ui.installationMapsButton, "click", () => {
  const order = getSelectedOrder();
  if (order) openMaps(order);
});
bindEvent(ui.installationRouteButton, "click", () => {
  const order = getSelectedOrder();
  if (order) openRoute(order);
});
bindEvent(ui.installationCallButton, "click", () => {
  const order = getSelectedOrder();
  if (order?.phone) window.open(`tel:${order.phone}`);
});
bindEvent(ui.installationEmailButton, "click", () => {
  const order = getSelectedOrder();
  if (order) sendOrderEmail(order);
});
bindEvent(ui.installationAttachmentButton, "click", () => openAttachmentPicker("installation"));
bindEvent(ui.accountingForm, "submit", saveAccounting);
bindEvent(ui.settingsForm, "submit", saveSettings);
bindEvent(ui.profitSplitUseSelectedOrderButton, "click", () => {
  const order = getSelectedOrder();
  if (!order) return;
  setProfitSplitContextOrder(order.id, { preferStored: true });
  renderProfitSplitWorkspace();
});
bindEvent(ui.profitSplitSaveOrderButton, "click", async () => {
  await saveProfitSplitToLinkedOrder();
});
bindEvent(ui.profitSplitDetachOrderButton, "click", () => {
  restoreProfitSplitLocalDraft();
  renderProfitSplitWorkspace();
});
bindEvent(ui.profitSplitOpenOrderButton, "click", () => {
  const order = getProfitSplitContextOrder();
  if (!order) return;
  state.selectedOrderId = order.id;
  setView("orders");
});
bindEvent(ui.profitSplitForm, "click", (event) => {
  const addButton = event.target.closest("[data-profit-split-add-expense]");
  const presetButton = event.target.closest("[data-profit-split-expense-preset]");
  const removeButton = event.target.closest("[data-profit-split-remove-expense]");
  if (!addButton && !presetButton && !removeButton) return;
  event.preventDefault();
  const draft = readProfitSplitDraftFromForm();
  const expenseLines = [...draft.expenseLines];
  if (addButton) {
    expenseLines.push(getDefaultProfitSplitExpenseLine());
  }
  if (presetButton) {
    const presetLabel = String(presetButton.getAttribute("data-profit-split-expense-preset") || "").trim();
    draft.expenseLines = presetLabel
      ? addProfitSplitExpenseLine(expenseLines, { label: presetLabel })
      : expenseLines;
  }
  if (removeButton) {
    const lineId = removeButton.getAttribute("data-profit-split-remove-expense");
    const filteredLines = expenseLines.filter((line) => line.id !== lineId);
    draft.expenseLines = filteredLines.length ? filteredLines : [getDefaultProfitSplitExpenseLine()];
  } else if (!presetButton) {
    draft.expenseLines = expenseLines;
  }
  syncProfitSplitDraftAfterInput(draft);
  renderProfitSplitCalculator();
});
bindEvent(ui.profitSplitForm, "input", () => {
  syncProfitSplitDraftAfterInput(readProfitSplitDraftFromForm());
  renderProfitSplitCalculator({ syncForm: false });
});
bindEvent(ui.profitSplitForm, "change", () => {
  syncProfitSplitDraftAfterInput(readProfitSplitDraftFromForm());
  renderProfitSplitCalculator({ syncForm: false });
});
bindEvent(ui.profitSplitResetButton, "click", () => {
  if (isProfitSplitOrderLinked()) {
    const linkedOrder = getProfitSplitContextOrder();
    state.profitSplitDraft = linkedOrder
      ? buildProfitSplitDraftForOrder(linkedOrder, { preferStored: true })
      : normalizeProfitSplitDraft();
  } else {
    state.profitSplitDraft = normalizeProfitSplitDraft();
    persistProfitSplitDraftLocally(state.profitSplitDraft);
  }
  renderProfitSplitCalculator();
});
bindEvent(ui.connectShopifyButton, "click", connectShopify);
bindEvent(ui.securityForm, "submit", updatePassword);
bindEvent(ui.accountCreateForm, "submit", createManagedAccount);
bindAccountCrewFields(ui.accountCreateForm);
handleShopifyOauthFeedback();
window.addEventListener("resize", () => {
  if (responsiveResizeFrame) cancelAnimationFrame(responsiveResizeFrame);
  responsiveResizeFrame = requestAnimationFrame(() => {
    responsiveResizeFrame = 0;
    handleResponsiveResize();
  });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    flushPendingCurrentViewRefresh();
  }
  if (!state.currentUser || document.hidden) return;
  void keepSessionAlive({ silent: true });
  if (canAutoSyncShopify()) {
    void runShopifySync({ silent: true });
  }
  if (canAutoRefreshSalesRequests()) {
    void syncSalesRequestSource({ auto: true, silent: true });
  }
});
window.addEventListener("focus", () => {
  flushPendingCurrentViewRefresh();
  if (!state.currentUser) return;
  void keepSessionAlive({ silent: true });
  if (canAutoSyncShopify()) {
    void runShopifySync({ silent: true });
  }
  if (canAutoRefreshSalesRequests()) {
    void syncSalesRequestSource({ auto: true, silent: true });
  }
});
window.addEventListener("online", () => {
  flushPendingCurrentViewRefresh();
  if (!state.currentUser) return;
  void keepSessionAlive({ silent: true });
  if (canAutoSyncShopify()) {
    void runShopifySync({ silent: true });
  }
  if (canAutoRefreshSalesRequests()) {
    void syncSalesRequestSource({ auto: true, silent: true });
  }
});
window.addEventListener("beforeunload", () => {
  stopSessionKeepalive();
  stopShopifyAutoSync();
  stopSalesRequestAutoSync();
  clearAllSearchRenderTimers();
});
document.addEventListener("focusout", () => {
  window.setTimeout(() => {
    flushPendingCurrentViewRefresh();
  }, 0);
});

if (ui.authDemo && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
  ui.authDemo.classList.add("hidden");
}
if (ui.ordersClearManualButton) {
  ui.ordersClearManualButton.classList.add("hidden");
}
bindEvent(ui.orderForm, "submit", saveOrder);
bindEvent(ui.deleteOrderButton, "click", deleteSelectedOrder);
ui.closeModalTriggers.forEach((item) => item.addEventListener("click", closeOrderModal));
bindEvent(ui.attachmentInput, "change", handleAttachmentChange);
document.addEventListener("click", handleGlobalClick);
document.addEventListener("keydown", handleGlobalActionKeydown);

registerServiceWorker();
if (ui.appShell) ui.appShell.classList.add("hidden");
if (ui.authScreen) ui.authScreen.classList.add("hidden");
setShellPending(true);
ensureFreshShellVersion().then((resetTriggered) => {
  if (resetTriggered) return;
  loadSession();
});

// === EXPORT CSV ===
function exportAccountingCSV() {
  const orders = filterOrdersForView("accounting");
  const rows = [[
    state.lang === "it" ? "Ordine" : "Order",
    state.lang === "it" ? "Cliente" : "Customer",
    state.lang === "it" ? "Prodotto" : "Product",
    state.lang === "it" ? "Totale" : "Total",
    "Shopify",
    state.lang === "it" ? "Acconto" : "Deposit",
    state.lang === "it" ? "Saldo" : "Balance",
    state.lang === "it" ? "Residuo" : "Open balance",
    state.lang === "it" ? "Metodo" : "Method",
    state.lang === "it" ? "Fattura richiesta" : "Invoice requested",
    state.lang === "it" ? "Fattura emessa" : "Invoice issued",
    state.lang === "it" ? "Data" : "Date",
  ]];
  for (const order of orders) {
    rows.push([
      getOrderNumber(order),
      composeClientName(order),
      order.operations?.product || "",
      String(order.total || 0),
      String(getShopifyPaidAmount(order)),
      String(order.accounting?.depositPaid || 0),
      String(order.accounting?.balancePaid || 0),
      String(getOpenBalance(order)),
      getEffectivePaymentMethod(order),
      order.accounting?.invoiceRequired ? (state.lang === "it" ? "Sì" : "Yes") : "No",
      order.accounting?.invoiceIssued ? (state.lang === "it" ? "Sì" : "Yes") : "No",
      formatDate(order.createdAt),
    ]);
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.lang === "it" ? "contabilita" : "accounting"}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportAccountingPDF() {
  const orders = filterOrdersForView("accounting");
  let html = `<html><head><style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:18px;color:#1B4332}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}th{background:#1B4332;color:#fff;padding:6px 8px;text-align:left}td{padding:5px 8px;border-bottom:1px solid #ddd}.total{font-weight:bold}.red{color:#dc2626}.green{color:#16a34a}</style></head><body>`;
  html += `<h1>${state.lang === "it" ? "Contabilità" : "Accounting"} — Vertex Ops</h1><p>${state.lang === "it" ? "Esportato il" : "Exported on"} ${new Date().toLocaleDateString(state.lang === "it" ? "it-IT" : "en-GB")} · ${orders.length} ${state.lang === "it" ? "ordini" : "orders"}</p>`;
  html += `<table><tr><th>${state.lang === "it" ? "Ordine" : "Order"}</th><th>${state.lang === "it" ? "Cliente" : "Customer"}</th><th>${state.lang === "it" ? "Prodotto" : "Product"}</th><th>${state.lang === "it" ? "Totale" : "Total"}</th><th>${state.lang === "it" ? "Incassato" : "Collected"}</th><th>${state.lang === "it" ? "Residuo" : "Open balance"}</th><th>${state.lang === "it" ? "Metodo" : "Method"}</th><th>${state.lang === "it" ? "Fattura" : "Invoice"}</th></tr>`;
  for (const order of orders) {
    const open = getOpenBalance(order);
    html += `<tr><td>${getOrderNumber(order)}</td><td>${composeClientName(order)}</td><td>${order.operations?.product || "—"}</td><td class="total">${formatCurrency(order.total)}</td><td class="green">${formatCurrency(getShopifyPaidAmount(order) + getInternalPaidAmount(order))}</td><td class="${open > 0 ? "red" : "green"}">${formatCurrency(open)}</td><td>${getEffectivePaymentMethod(order)}</td><td>${order.accounting?.invoiceRequired ? (order.accounting?.invoiceIssued ? (state.lang === "it" ? "Emessa" : "Issued") : (state.lang === "it" ? "Da emettere" : "To issue")) : "No"}</td></tr>`;
  }
  html += `</table></body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
}

const exportCsvBtn = document.getElementById("export-csv-button");
const exportPdfBtn = document.getElementById("export-pdf-button");
if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportAccountingCSV);
if (exportPdfBtn) exportPdfBtn.addEventListener("click", exportAccountingPDF);
