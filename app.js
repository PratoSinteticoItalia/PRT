const crews = ["Alpha", "Beta", "Delta"];
const INVENTORY_CATALOG = [
  { key: "tasso", label: "Tasso", type: "turf" },
  { key: "bonsai", label: "Bonsai", type: "turf" },
  { key: "faggio", label: "Faggio", type: "turf" },
  { key: "betulla", label: "Betulla", type: "turf" },
  { key: "acero", label: "Acero", type: "turf" },
  { key: "cedro", label: "Cedro", type: "turf" },
  { key: "rovere", label: "Rovere", type: "turf" },
  { key: "palma", label: "Palma", type: "turf" },
  { key: "cipresso", label: "Cipresso", type: "turf" },
  { key: "abete", label: "Abete", type: "turf" },
  { key: "ginepro", label: "Ginepro", type: "turf" },
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
const roleViews = {
  office: ["dashboard", "orders", "warehouse", "installations", "accounting", "shipping", "settings"],
  warehouse: ["warehouse", "shipping"],
  crew: ["installations"],
};

const translations = {
  it: {
    dashboard: "Dashboard",
    orders: "Inbox Ordini",
    warehouse: "Inventario",
    installations: "Pose",
    accounting: "Contabilità",
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
  },
  en: {
    dashboard: "Dashboard",
    orders: "Order Inbox",
    warehouse: "Inventory",
    installations: "Installations",
    accounting: "Accounting",
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
  },
};

const state = {
  currentUser: null,
  orders: [],
  inventory: [],
  users: [],
  securityEvents: [],
  securityPolicy: {},
  settings: {},
  currentView: "dashboard",
  selectedOrderId: null,
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
  },
  pendingAttachmentTarget: null,
  showOrderImport: false,
};

const ui = {
  authScreen: document.getElementById("auth-screen"),
  authForm: document.getElementById("auth-form"),
  authError: document.getElementById("auth-error"),
  appShell: document.getElementById("app-shell"),
  navLinks: Array.from(document.querySelectorAll(".nav-link")),
  views: Array.from(document.querySelectorAll(".view")),
  viewTitle: document.getElementById("view-title"),
  currentUserName: document.getElementById("current-user-name"),
  currentUserRole: document.getElementById("current-user-role"),
  topbarUserName: document.getElementById("topbar-user-name"),
  topbarUserRole: document.getElementById("topbar-user-role"),
  topbarAvatar: document.querySelector(".topbar-avatar"),
  topbarAlertCount: document.getElementById("topbar-alert-count"),
  langButtons: Array.from(document.querySelectorAll(".lang-btn")),
  logoutButton: document.getElementById("logout-button"),
  reloadButton: document.getElementById("reload-button"),
  newOrderButton: document.getElementById("new-order-button"),
  opsOrdersValue: document.getElementById("ops-orders-value"),
  opsWarehouseValue: document.getElementById("ops-warehouse-value"),
  opsInstallationsValue: document.getElementById("ops-installations-value"),
  opsAccountingValue: document.getElementById("ops-accounting-value"),
  opsShippingValue: document.getElementById("ops-shipping-value"),
  dashboardActions: document.getElementById("dashboard-actions"),
  dashboardAlerts: document.getElementById("dashboard-alerts"),
  dashboardOrderList: document.getElementById("dashboard-order-list"),
  dashboardActivity: document.getElementById("dashboard-activity"),
  dashboardWeekSummary: document.getElementById("dashboard-week-summary"),
  dashboardSyncButton: document.getElementById("dashboard-sync-button"),
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
  ordersStatus: document.getElementById("orders-status"),
  orderDetailTitle: document.getElementById("order-detail-title"),
  orderDetailBadge: document.getElementById("order-detail-badge"),
  orderDetailSummary: document.getElementById("order-detail-summary"),
  orderOfficeSummary: document.getElementById("order-office-summary"),
  orderLineList: document.getElementById("order-line-list"),
  orderPrepList: document.getElementById("order-prep-list"),
  ordersRouteBoard: document.getElementById("orders-route-board"),
  savePrepListButton: document.getElementById("save-prep-list-button"),
  routeToWarehouseButton: document.getElementById("route-to-warehouse-button"),
  routeToInstallationButton: document.getElementById("route-to-installation-button"),
  clearRoutingButton: document.getElementById("clear-routing-button"),
  orderRoutingStatus: document.getElementById("order-routing-status"),
  orderAttachmentButton: document.getElementById("order-attachment-button"),
  orderAttachments: document.getElementById("order-attachments"),
  openOrderModalButton: document.getElementById("open-order-modal-button"),
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
  installationCalendar: document.getElementById("installation-calendar"),
  installationList: document.getElementById("installation-list"),
  installationDetailTitle: document.getElementById("installation-detail-title"),
  installationDetailSummary: document.getElementById("installation-detail-summary"),
  installationForm: document.getElementById("installation-form"),
  installationMapsButton: document.getElementById("installation-maps-button"),
  installationAttachmentButton: document.getElementById("installation-attachment-button"),
  installationAttachments: document.getElementById("installation-attachments"),
  accountingSearch: document.getElementById("accounting-search"),
  accountingFilterTags: Array.from(document.querySelectorAll(".accounting-filter-tag")),
  accountingList: document.getElementById("accounting-list"),
  accountingModelsOverview: document.getElementById("accounting-models-overview"),
  accountingAnalysis: document.getElementById("accounting-analysis"),
  accountingDetailTitle: document.getElementById("accounting-detail-title"),
  accountingForm: document.getElementById("accounting-form"),
  accountingMeta: document.getElementById("accounting-meta"),
  importShopifyPaymentButton: document.getElementById("import-shopify-payment-button"),
  shippingSearch: document.getElementById("shipping-search"),
  shippingFilterTags: Array.from(document.querySelectorAll(".shipping-filter-tag")),
  shippingList: document.getElementById("shipping-list"),
  shippingDetailTitle: document.getElementById("shipping-detail-title"),
  shippingDetailFields: document.getElementById("shipping-detail-fields"),
  shippingMaterialPreview: document.getElementById("shipping-material-preview"),
  shippingEstimate: document.getElementById("shipping-estimate"),
  shippingForm: document.getElementById("shipping-form"),
  settingsForm: document.getElementById("shopify-settings-form"),
  settingsStatus: document.getElementById("settings-status"),
  connectShopifyButton: document.getElementById("connect-shopify-button"),
  securityForm: document.getElementById("security-form"),
  securityStatus: document.getElementById("security-status"),
  securityPolicyNote: document.getElementById("security-policy-note"),
  securityEvents: document.getElementById("security-events"),
  accountsList: document.getElementById("accounts-list"),
  accountCreateForm: document.getElementById("account-create-form"),
  accountsStatus: document.getElementById("accounts-status"),
  authDemo: document.getElementById("auth-demo"),
  orderModal: document.getElementById("order-modal"),
  orderModalTitle: document.getElementById("order-modal-title"),
  orderForm: document.getElementById("order-form"),
  deleteOrderButton: document.getElementById("delete-order-button"),
  closeModalTriggers: Array.from(document.querySelectorAll("[data-close-modal]")),
  attachmentInput: document.getElementById("attachment-input"),
  dashboardSubtitle: document.getElementById("dashboard-subtitle"),
};

function t(key) {
  return translations[state.lang]?.[key] || translations.it[key] || key;
}

function roleLabel(role) {
  if (role === "warehouse") return t("warehouseRole");
  if (role === "crew") return t("crewRole");
  return t("office");
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
    ["#new-order-button", t("newOrder")],
    ["#reload-button", t("reloadData")],
    ["#logout-button", t("logout")],
    [".sidebar-card .card-label", t("focusOperational")],
    [".sidebar-card h3", t("singleOrder")],
    [".sidebar-card p", t("focusCopy")],
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
    ["#orders-sync-button", t("syncShopify")],
    ["#orders-import-button", t("importJson")],
    ["#orders-clear-manual-button", t("clearManual")],
    ["#orders-search", null, state.lang === "it" ? "Cerca cliente, ordine, città o prodotto" : "Search customer, order, city or product"],
    ["[data-order-filter='all']", t("all")],
    ["[data-order-filter='attention']", t("complete")],
    ["[data-order-filter='warehouse']", t("warehouse")],
    ["[data-order-filter='installation']", t("installationShort")],
    ["#orders .route-subsection h4", t("routeOffice")],
    ["#orders .route-subsection .subsection-copy", t("routeOfficeCopy")],
    ["#open-order-modal-button", t("edit") || (state.lang === "it" ? "Modifica" : "Edit")],
    ["#orders .panel-subsection h4", t("officeOperations")],
    ["#save-prep-list-button", t("savePreparation")],
    ["#route-to-warehouse-button", t("sendToWarehouse")],
    ["#route-to-installation-button", t("sendToInstall")],
    ["#clear-routing-button", t("removeFromFlow")],
    ["#order-attachment-button", t("uploadAttachment")],
    ["#installations .toolbar-row .search-pill", t("crewViewCopy")],
    ["[data-installation-filter='all']", t("allCrews")],
    ["#installation-attachment-button", t("uploadPhoto")],
    ["#warehouse .panel-head .panel-eyebrow", t("physicalStock")],
    ["#warehouse-search", null, state.lang === "it" ? "Cerca prodotto, misura o residuo" : "Search product, size or offcut"],
    ["#warehouse .info-card strong", t("warehouseGuideTitle")],
    ["#warehouse .info-card p", t("warehouseGuideCopy")],
    ["#shipping .panel-head .panel-eyebrow", state.lang === "it" ? "Spedizioni e trasporto" : "Shipping and transport"],
    ["#shipping-search", null, t("shippingSearch")],
    ["#accounting .panel-head .panel-eyebrow", state.lang === "it" ? "Controllo economico" : "Financial control"],
    ["#accounting-search", null, t("searchOrderPayment")],
    ["#import-shopify-payment-button", t("importShopifyPayment")],
  ];
}

function setFieldLabel(form, name, text) {
  const label = form?.querySelector(`[name="${name}"]`)?.closest("label")?.querySelector("span");
  if (label) label.textContent = text;
}

function setSubheading(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
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
    if (!response.ok) throw new Error(data.error || data.message || "request_failed");
    return data;
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

function composeClientName(order) {
  return `${order.firstName || ""} ${order.lastName || ""}`.trim() || "Cliente da definire";
}

function getUserInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "VO";
}

function setNavCount(view, count) {
  const node = ui.navLinks.find((link) => link.dataset.view === view);
  if (!node) return;
  const normalized = Number(count) > 0 ? String(count) : "";
  node.setAttribute("data-count", normalized);
}

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

function composeAddress(order) {
  return [order.address, order.city].filter(Boolean).join(", ");
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
  if (ops.installation?.status === "completata") return [t("completed"), "green"];
  if (ops.installation?.status === "in-corso") return [t("inProgress"), "blue"];
  if (ops.warehouse?.status === "pronto") return [t("ready"), "green"];
  if (ops.warehouse?.status === "in-preparazione") return [t("preparing"), "amber"];
  if (ops.officeStatus === "bozza") return [state.lang === "it" ? "Bozza" : "Draft", "blue"];
  return [state.lang === "it" ? "Operativo" : "Operational", "amber"];
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

function getOpenBalance(order) {
  const accounting = order.accounting || {};
  const total = toNumber(order.total);
  const paidOnShopify = String(order.financialStatus || "").toLowerCase().includes("paid");
  const internalPaid = toNumber(accounting.depositPaid) + toNumber(accounting.balancePaid);
  if (paidOnShopify && !internalPaid) return 0;
  const residual = Math.max(0, total - internalPaid);
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
  const accounting = order.accounting || {};
  return toNumber(accounting.depositPaid) + toNumber(accounting.balancePaid);
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

function getOrderChecklist(order) {
  return [
    { label: t("shippingData"), done: Boolean(order.address && order.city) },
    { label: t("officeRouting"), done: isRoutedToWarehouse(order) || isRoutedToInstallation(order) },
    { label: t("selectedLines"), done: getWarehousePreparedLines(order).length > 0 },
    { label: t("readyForWarehouse"), done: !isRoutedToWarehouse(order) || getWarehousePreparedLines(order).length > 0 },
    { label: t("readyForInstall"), done: !isRoutedToInstallation(order) || Boolean(order.operations?.installation?.crew && order.operations?.installation?.installDate) },
  ];
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
  if (label.includes("ginepro")) return INVENTORY_CATALOG.find((item) => item.key === "ginepro");
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
  return inferCatalogEntry(value)?.label || String(value || "").trim() || "Prodotto";
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
    }));
}

function focusElement(node) {
  if (!node) return;
  requestAnimationFrame(() => {
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusViewTarget(view) {
  if (view === "orders") focusElement(ui.orderDetailTitle);
  if (view === "warehouse") focusElement(ui.warehouseDetailTitle);
  if (view === "installations") focusElement(ui.installationDetailTitle);
  if (view === "accounting") focusElement(ui.accountingDetailTitle);
  if (view === "shipping") focusElement(ui.shippingDetailTitle);
}

function buildDashboardActions() {
  const raw = [...state.orders]
    .map((order) => {
      const ops = order.operations || {};
      const missingAddress = !order.address || !order.city;
      const missingWarehouse = !ops.warehouse || ops.warehouse.status === "da-preparare" || ops.warehouse.status === "bloccato";
      const needsCrew = ops.installation?.required && !ops.installation?.crew;
      const needsDate = ops.installation?.required && !ops.installation?.installDate;
      const openBalance = getOpenBalance(order);
      const needsAccounting = openBalance > 0 || (order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued);
      const isCompleted = ops.installation?.status === "completata";
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
      } else if (needsCrew) {
        title = state.lang === "it" ? "Assegna squadra" : "Assign crew";
        reason = state.lang === "it"
          ? `${composeClientName(order)} · ${getOrderNumber(order)} ha posa richiesta ma nessuna squadra`
          : `${composeClientName(order)} · ${getOrderNumber(order)} requires install but has no crew`;
        score = 80;
        kind = "installation";
        urgency = "info";
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
  return parts.length ? parts.join("x") : "Da definire";
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
  if (warehouse.shipped) return t("shipped");
  if (warehouse.carrierPassed) return t("carrierPassed");
  if (warehouse.readyToShip) return t("goodsReady");
  return warehouse.status || t("toPrepare");
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
  return target ? `${t("prepareBy")} ${formatDate(target)}` : (state.lang === "it" ? "Data preparazione da definire" : "Preparation date to define");
}

function getShippingSummary(order) {
  const physicalLines = getWarehousePreparedLines(order);
  if (!physicalLines.length) return "Nessuna merce fisica";
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
  return [
    Boolean(order.address && order.city),
    warehouse.status === "in-preparazione" || warehouse.status === "pronto" || warehouse.status === "completato",
    install.required ? Boolean(install.crew && install.installDate) : true,
    install.required ? install.status === "completata" : warehouse.status === "pronto" || String(order.fulfillmentStatus || "").toLowerCase().includes("fulfill"),
    openBalance <= 0 && (!accounting.invoiceRequired || accounting.invoiceIssued),
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
  if (order.operations?.warehouse?.shipped) return false;
  return true;
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
        quantity: Number(item.quantity || 1),
        included: item.included !== false,
        note: String(item.note || "").trim(),
      }));
  }
  return getPhysicalOrderLines(order).map((line) => ({
    title: line.title,
    quantity: Number(line.quantity || 1),
    included: true,
    note: "",
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
  if (!isRoutedToWarehouse(order) && !isRoutedToInstallation(order)) {
    return state.lang === "it" ? "Instrada l'ordine verso magazzino o posa" : "Route the order to warehouse or installation";
  }
  if (isRoutedToWarehouse(order) && getWarehousePreparedLines(order).length === 0) {
    return t("needsPrepSelection");
  }
  if (isRoutedToInstallation(order) && !order.operations?.installation?.crew) {
    return t("needsCrewAndDate");
  }
  if (isRoutedToInstallation(order) && !order.operations?.installation?.installDate) {
    return t("needsCrewAndDate");
  }
  return t("noActionRequired");
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

function renderRouteBoard() {
  if (!ui.ordersRouteBoard) return;
  const columns = buildRouteColumns();
  ui.ordersRouteBoard.innerHTML = columns.map((column) => `
    <article class="route-column" data-route-dropzone="${column.route}">
      <div class="route-column-head">
        <div>
          <strong>${column.title}</strong>
          <p>${column.copy}</p>
        </div>
        <span class="route-count">${column.orders.length}</span>
      </div>
      <div class="route-stack">
        ${column.orders.length ? column.orders.slice(0, 3).map((order) => `
          <div class="route-mini-card">
            <strong>${composeClientName(order)} · ${getOrderNumber(order)}</strong>
            <span>${order.operations?.product || "—"} · ${order.operations?.sqm || 0} mq</span>
          </div>
        `).join("") : `<div class="info-card">${t("noOrdersHere")}</div>`}
        ${column.orders.length > 3 ? `<div class="route-board-compact-footer">+${column.orders.length - 3} ${state.lang === "it" ? "ordini" : "orders"}</div>` : ""}
      </div>
    </article>
  `).join("");
}

function isRoutedToWarehouse(order) {
  return Boolean(order.operations?.warehouse?.selected);
}

function isRoutedToInstallation(order) {
  return Boolean(order.operations?.installation?.selected && order.operations?.installation?.required);
}

function getCrewForCurrentUser() {
  if (state.currentUser?.role !== "crew") return "";
  if (/alpha/i.test(state.currentUser?.name || "")) return "Alpha";
  if (/beta/i.test(state.currentUser?.name || "")) return "Beta";
  if (/delta/i.test(state.currentUser?.name || "")) return "Delta";
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
    existing.totalUnits += 1;
    if (item.status === "residuo") existing.residualCount += 1;
    else existing.fullCount += 1;
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
        product: value.product || "Prodotto",
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
    .map((group) => ({
      ...group,
      availableSqm: Number((group.totalSqm - group.demandSqm).toFixed(2)),
      availableUnits: group.totalUnits - group.demandUnits,
      isModel: group.type === "turf",
      pieces: [...group.pieces].sort((a, b) => {
        if (a.status !== b.status) return a.status === "intero" ? -1 : 1;
        if (group.type === "turf") return (b.sqm || 0) - (a.sqm || 0);
        return String(a.variant || a.note || "").localeCompare(String(b.variant || b.note || ""), "it");
      }),
    }))
    .sort((a, b) => {
      if (a.isModel !== b.isModel) return a.isModel ? -1 : 1;
      return INVENTORY_CATALOG.findIndex((item) => item.label === a.product) - INVENTORY_CATALOG.findIndex((item) => item.label === b.product);
    });
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
    if (kind === "shipping" && !isRoutedToWarehouse(order)) return false;
    if (state.currentUser?.role === "warehouse" && kind === "order") return false;
    const haystack = [
      composeClientName(order),
      getOrderNumber(order),
      order.city,
      order.operations?.product,
      getShippingModeLabel(order),
      order.operations?.installation?.crew,
    ].join(" ").toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (kind === "order") {
      if (filter === "attention") return !order.address || !order.city || order.operations?.officeStatus === "bozza";
      if (filter === "warehouse") return order.operations?.warehouse?.status !== "pronto";
      if (filter === "installation") return Boolean(order.operations?.installation?.required);
      if (filter === "shipping") return !order.operations?.installation?.required && isRoutedToWarehouse(order);
      return true;
    }
    if (kind === "warehouse") {
      return !order.operations?.warehouse?.shipped;
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
      if (order.operations?.warehouse?.shipped && filter !== "all") return false;
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
  const warehouseStatus = order.operations?.warehouse?.status || "da-preparare";
  const fulfillmentMode = order.operations?.warehouse?.fulfillmentMode || "da-definire";
  const preparationDate = getShippingTargetDate(order);
  return `
    <article class="guidance-card order-flow-card">
      <span class="panel-eyebrow">${state.lang === "it" ? "Gestione rapida ufficio" : "Quick office handling"}</span>
      <div class="order-flow-grid">
        <label class="field">
          <span>${state.lang === "it" ? "Stato preparazione" : "Preparation status"}</span>
          <select class="text-input" data-order-flow-status="${order.id}">
            <option value="da-preparare" ${warehouseStatus === "da-preparare" ? "selected" : ""}>${state.lang === "it" ? "Da preparare" : "To prepare"}</option>
            <option value="in-preparazione" ${warehouseStatus === "in-preparazione" ? "selected" : ""}>${state.lang === "it" ? "In preparazione" : "Preparing"}</option>
            <option value="pronto" ${warehouseStatus === "pronto" ? "selected" : ""}>${state.lang === "it" ? "Pronto" : "Ready"}</option>
            <option value="bloccato" ${warehouseStatus === "bloccato" ? "selected" : ""}>${state.lang === "it" ? "Bloccato" : "Blocked"}</option>
          </select>
        </label>
        <label class="field">
          <span>${state.lang === "it" ? "Gestione logistica" : "Logistics mode"}</span>
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
      <div class="order-office-actions">
        <button class="mini-action primary-mini" data-action="save-inbox-flow" data-id="${order.id}">${state.lang === "it" ? "Salva stato ordine" : "Save order state"}</button>
        <button class="mini-action" data-action="preset-pickup-flow" data-id="${order.id}">${state.lang === "it" ? "Preparare e ritirare" : "Prepare and pickup"}</button>
        <button class="mini-action" data-action="preset-prepare-only" data-id="${order.id}">${state.lang === "it" ? "Preparare senza affidare" : "Prepare only"}</button>
      </div>
    </article>
  `;
}

function filterInstallations() {
  const crew = state.filters.installation;
  return state.orders.filter((order) => {
    if (!order.operations?.installation?.required) return false;
    if (!isRoutedToInstallation(order)) return false;
    if (state.currentUser?.role === "crew") {
      const currentCrew = getCrewForCurrentUser();
      if (!currentCrew) return false;
      return order.operations.installation.crew === currentCrew
        && Boolean(order.operations.installation.clientConfirmed || order.operations.installation.installDate);
    }
    if (crew === "all") return true;
    return order.operations.installation.crew === crew;
  });
}

function applyStaticTranslations() {
  staticLabels().forEach(([selector, text, placeholder]) => {
    const node = document.querySelector(selector);
    if (!node) return;
    if (placeholder != null) {
      node.setAttribute("placeholder", placeholder);
      return;
    }
    node.textContent = text;
  });
  ui.navLinks.forEach((button) => {
    button.textContent = t(button.dataset.view);
  });
  setSubheading("#orders .panel-subsection:nth-of-type(1) h4", t("officeOperations"));
  setSubheading("#orders .panel-subsection:nth-of-type(2) h4", t("orderItems"));
  setSubheading("#orders .panel-subsection:nth-of-type(3) h4", t("officePreparation"));
  setSubheading("#orders .panel-subsection:nth-of-type(4) h4", t("orderAttachments"));
  setSubheading("#accounting .panel-head h3", t("accounting"));
  setSubheading("#accounting .panel-subsection h4", t("accountingSummary"));
  setSubheading("#warehouse .panel-head h3", t("stockFlowTitle"));
  setSubheading("#shipping .panel-head h3", t("shippingTitle"));
  setSubheading("#installations .panel-head h3", t("installations"));
  setFieldLabel(ui.installationForm, "required", state.lang === "it" ? "Richiede posa" : "Requires installation");
  setFieldLabel(ui.installationForm, "crew", state.lang === "it" ? "Squadra" : "Crew");
  setFieldLabel(ui.installationForm, "installDate", state.lang === "it" ? "Data posa" : "Installation date");
  setFieldLabel(ui.installationForm, "installTime", state.lang === "it" ? "Ora" : "Time");
  setFieldLabel(ui.installationForm, "clientConfirmed", state.lang === "it" ? "Cliente confermato" : "Customer confirmed");
  setFieldLabel(ui.installationForm, "status", state.lang === "it" ? "Stato posa" : "Install status");
  setFieldLabel(ui.installationForm, "reportNote", state.lang === "it" ? "Report squadra / note" : "Crew report / notes");
  setFieldLabel(ui.accountingForm, "paymentMethod", state.lang === "it" ? "Metodo utilizzato" : "Method used");
  setFieldLabel(ui.accountingForm, "depositPaid", state.lang === "it" ? "Acconto registrato" : "Deposit recorded");
  setFieldLabel(ui.accountingForm, "balancePaid", state.lang === "it" ? "Saldo registrato" : "Balance recorded");
  setFieldLabel(ui.accountingForm, "invoiceRequired", state.lang === "it" ? "Fattura richiesta" : "Invoice required");
  setFieldLabel(ui.accountingForm, "invoiceIssued", state.lang === "it" ? "Fattura emessa" : "Invoice issued");
  setFieldLabel(ui.accountingForm, "accountingNote", state.lang === "it" ? "Nota amministrativa" : "Administrative note");
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
}

function updateShell() {
  const allowed = roleViews[state.currentUser?.role || "office"] || roleViews.office;
  ui.navLinks.forEach((button) => {
    const visible = allowed.includes(button.dataset.view);
    button.classList.toggle("hidden", !visible);
    button.classList.toggle("is-active", state.currentView === button.dataset.view);
  });
  if (!allowed.includes(state.currentView)) state.currentView = allowed[0];
  ui.views.forEach((view) => view.classList.toggle("is-active", view.id === state.currentView));
  ui.viewTitle.textContent = t(state.currentView);
  ui.currentUserName.textContent = state.currentUser?.name || "-";
  ui.currentUserRole.textContent = roleLabel(state.currentUser?.role);
  ui.topbarUserName.textContent = state.currentUser?.name || "-";
  ui.topbarUserRole.textContent = roleLabel(state.currentUser?.role);
  if (ui.topbarAvatar) ui.topbarAvatar.textContent = getUserInitials(state.currentUser?.name);
  applyStaticTranslations();
}

function renderOps() {
  const orders = state.orders.length;
  const warehouse = state.orders.filter((order) => ["da-preparare", "in-preparazione", "bloccato"].includes(order.operations?.warehouse?.status)).length;
  const installations = state.orders.filter((order) => order.operations?.installation?.required).length;
  const accounting = state.orders.filter((order) => getOpenBalance(order) > 0 || (order.accounting?.invoiceRequired && !order.accounting?.invoiceIssued)).length;
  const shipping = state.orders.filter((order) => ["corriere", "ritiro", "furgone"].includes(order.operations?.warehouse?.fulfillmentMode)).length;
  const criticalAlerts = state.orders.filter((order) => order.operations?.warehouse?.status === "bloccato" || order.operations?.installation?.status === "problema").length;
  const topbarAlerts = Math.min(9, criticalAlerts + accounting);
  ui.opsOrdersValue.textContent = String(orders);
  ui.opsWarehouseValue.textContent = String(warehouse);
  ui.opsInstallationsValue.textContent = String(installations);
  ui.opsAccountingValue.textContent = String(accounting);
  if (ui.opsShippingValue) ui.opsShippingValue.textContent = String(shipping);
  setNavCount("dashboard", "");
  setNavCount("orders", orders);
  setNavCount("warehouse", warehouse);
  setNavCount("installations", installations);
  setNavCount("accounting", accounting);
  setNavCount("shipping", shipping);
  setNavCount("settings", "");
  if (ui.topbarAlertCount) {
    ui.topbarAlertCount.textContent = String(topbarAlerts);
    ui.topbarAlertCount.classList.toggle("hidden", topbarAlerts === 0);
  }
  const opsTexts = state.lang === "it"
    ? {
        orders: "Ordini totali e bozze operative.",
        warehouse: "Ordini da preparare, spedire o caricare.",
        installations: "Installazioni da pianificare o in corso.",
        accounting: "Ordini da verificare, saldare o fatturare.",
        shipping: "Corrieri, ritiri, furgoni e bancali.",
      }
    : {
        orders: "Total orders and operational drafts.",
        warehouse: "Orders to prepare, ship or load.",
        installations: "Installations to plan or in progress.",
        accounting: "Orders to verify, settle or invoice.",
        shipping: "Couriers, pickups, vans and pallets.",
      };
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  setText("ops-orders-text", opsTexts.orders);
  setText("ops-warehouse-text", opsTexts.warehouse);
  setText("ops-installations-text", opsTexts.installations);
  setText("ops-accounting-text", opsTexts.accounting);
  setText("ops-shipping-text", opsTexts.shipping);
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
      const crews = [...new Set(items.map(o => o.operations?.installation?.crew).filter(Boolean))];
      const crewLabel = crews.length ? crews.join(", ") + ": " : "";
      return `
        <article class="week-card ${isToday ? "week-card-today" : ""}">
          <div class="week-card-head">
            <strong>${isToday ? (state.lang === "it" ? "Oggi" : "Today") + " — " : ""}${formatDate(key)}</strong>
            <span class="week-cap">${crewLabel}${Math.round(totalSqm)}/120 mq</span>
          </div>
          <div class="cal-gauge"><div class="cal-gauge-fill ${gaugeColor}" style="width:${pct}%"></div></div>
          ${items.length
            ? items.slice(0, 2).map((order) => `<div class="week-item">${composeClientName(order)} · ${getOrderNumber(order)}<small>${order.operations?.product || "—"} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq · ${order.operations?.installation?.crew || "—"}</small></div>`).join("")
            : `<div class="week-empty">${state.lang === "it" ? "Nessuna posa" : "No installs"}</div>`}
        </article>
      `;
    }).join("");
  }

  if (ui.dashboardAlerts) {
    const warehouseAlerts = buildWarehouseAlerts();
    const orderAlerts = state.orders
      .filter((order) => order.operations?.warehouse?.status === "bloccato" || order.operations?.installation?.status === "problema")
      .slice(0, 3);

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
      items.push({ actor: ops.installation?.crew || "Squadra", text: `ha completato la posa ${num} (${name}, ${Math.round(toNumber(ops.sqm || 0))} mq)`, time, color: "green" });
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
  const installDone = installNeeded ? Boolean(order.operations?.installation?.crew || order.operations?.installation?.installDate) : warehouseDone;
  const closed = getOpenBalance(order) <= 0 && (String(order.fulfillmentStatus || "").toLowerCase().includes("fulfill") || order.operations?.warehouse?.shipped);
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
  const paymentChipTone = getShopifyPaidAmount(order) > 0 ? "badge-success" : getOpenBalance(order) > 0 ? "badge-warning" : "badge-info";
  const paymentChipText = getShopifyPaidAmount(order) > 0
    ? (state.lang === "it" ? "Pagato" : "Paid")
    : getOpenBalance(order) > 0
      ? (state.lang === "it" ? "In attesa" : "Pending")
      : (state.lang === "it" ? "Operativo" : "Operational");
  return `
    <article class="order-row inbox-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="${view}">
      <div>
        <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
        <div class="order-meta">${order.operations?.product || "Da definire"} &middot; ${Math.round(toNumber(order.operations?.sqm || 0))} mq &middot; ${composeAddress(order) || (state.lang === "it" ? "Indirizzo da completare" : "Address to complete")}</div>
      </div>
      <div class="order-type-badge ${orderType.tone === "status-amber" ? "type-posa" : orderType.tone === "status-blue" ? "type-spedizione" : "type-ritiro"}">${orderType.label}</div>
      <div class="order-amount">${formatCurrency(order.total)}</div>
      <div class="action-badge ${paymentChipTone}">${paymentChipText}</div>
    </article>
  `;
}

function renderOrderCard(order) {
  const [label, tone] = buildOrderTone(order);
  const type = getOrderType(order);
  const selected = order.id === state.selectedOrderId ? "is-selected" : "";
  const showRouting = state.currentUser?.role === "office" && (state.currentView === "orders" || state.currentView === "dashboard");
  return `
    <article class="order-card ${selected}" draggable="true" data-order-draggable="true" data-action="select-order" data-id="${order.id}" data-view="orders">
      <div class="order-card-head">
        <div>
          <strong>${composeClientName(order)} · ${getOrderNumber(order)}</strong>
          <div class="order-card-meta">${composeAddress(order) || "Indirizzo da completare"} · ${order.operations?.sqm || 0} mq · ${order.operations?.product || "Da definire"}</div>
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
      ${showRouting ? `
        <div class="order-card-routing">
          <button class="route-button is-primary" data-action="route-warehouse" data-id="${order.id}">${t("routeWarehouseShort")}</button>
          <button class="route-button is-install" data-action="route-installation" data-id="${order.id}">${t("routeInstallShort")}</button>
          <button class="route-button is-clear" data-action="clear-routing-order" data-id="${order.id}">${t("routeClearShort")}</button>
        </div>
      ` : ""}
      <div class="order-card-actions">
        <button class="mini-action primary-mini" data-action="select-order" data-id="${order.id}" data-view="orders">${state.lang === "it" ? "Apri ordine" : "Open order"}</button>
        <button class="mini-action" data-action="open-modal" data-id="${order.id}">${t("edit")}</button>
      </div>
    </article>
  `;
}

function renderOrders() {
  const orders = filterOrdersForView("order");
  const ordersGrid = ui.ordersList?.closest(".order-grid");
  if (ordersGrid) ordersGrid.classList.toggle("is-empty", orders.length === 0);
  updateOrderImportPanel();
  renderRouteBoard();
  ui.ordersList.innerHTML = orders.length ? orders.map((order) => renderOrderRow(order, "orders")).join("") : `<div class="info-card">${t("noOrdersAvailable")}</div>`;
  const order = orders.find((item) => item.id === state.selectedOrderId) || orders[0] || null;
  if (order && order.id !== state.selectedOrderId) state.selectedOrderId = order.id;
  if (!order) {
    ui.orderDetailTitle.textContent = t("noSelection");
    ui.orderDetailBadge.innerHTML = "";
    ui.orderDetailSummary.innerHTML = "";
    ui.orderOfficeSummary.innerHTML = "";
    ui.orderLineList.innerHTML = "";
    if (ui.orderPrepList) ui.orderPrepList.innerHTML = "";
    ui.orderAttachments.innerHTML = "";
    return;
  }

  const [label, tone] = buildOrderTone(order);
  const orderType = getOrderType(order);
  const nextAction = getNextOrderAction(order);
  const prepItems = getWarehousePrepItems(order);
  ui.orderDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  ui.orderDetailBadge.innerHTML = statusChip(label, tone);
  const pieceTags = (order.lineDetails || [])
    .map((item) => {
      const dims = extractDimensions(item.title);
      const meta = dims
        ? `${dims.width} x ${dims.length} · ${Math.round(dims.sqm * Number(item.quantity || 1))} mq`
        : `${item.quantity || 1} ${state.lang === "it" ? "pz" : "pcs"}`;
      return `<div class="piece-tag intero"><strong>${escapeHtml(item.title)}</strong><br>${meta}</div>`;
    })
    .join("");
  const accessoryRows = getPhysicalOrderLines(order)
    .filter((item) => inferCatalogEntry(item.title)?.type === "material" || inferCatalogEntry(item.title)?.type === "decorative")
    .map((item) => `<div class="detail-row"><span class="detail-row-label">${item.title}</span><span class="detail-row-value">x${item.quantity}</span></div>`)
    .join("");
  ui.orderDetailSummary.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title">${composeClientName(order)}</div>
        <div class="detail-id">${getOrderNumber(order)} &middot; ${order.source} &middot; ${formatDate(order.createdAt)}</div>
      </div>
      ${statusChip(getPaymentLabel(order.financialStatus), tone)}
    </div>
    ${renderOrderStepper(order)}
    <div class="detail-section">
      <div class="detail-section-title">${state.lang === "it" ? "Cliente" : "Customer"}</div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Telefono" : "Phone"}</span><span class="detail-row-value">${order.phone ? `<a href="tel:${order.phone}" class="detail-link detail-link-phone">${order.phone}</a>` : `<span class="detail-missing">—</span>`}</span></div>
      <div class="detail-row"><span class="detail-row-label">Email</span><span class="detail-row-value">${order.email || "—"}</span></div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Indirizzo" : "Address"}</span><span class="detail-row-value">${composeAddress(order) ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(composeAddress(order))}" target="_blank" rel="noopener" class="detail-link">${composeAddress(order)}</a>` : `<span class="detail-missing">${state.lang === "it" ? "Da completare" : "To complete"}</span>`}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">${state.lang === "it" ? "Prodotto e pezzi" : "Product and pieces"}</div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Prodotto" : "Product"}</span><span class="detail-row-value">${order.operations?.product || t("undefined")}</span></div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Totale" : "Total"}</span><span class="detail-row-value">${order.operations?.sqm || 0} mq &middot; ${order.operations?.installation?.required ? t("supplyInstall") : t("supply")} &middot; ${order.operations?.surface || "terra"}</span></div>
      ${pieceTags ? `<div class="detail-pieces">${pieceTags}</div>` : ""}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">${state.lang === "it" ? "Materiali accessori" : "Accessory materials"}</div>
      ${accessoryRows || `<div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Nessun accessorio" : "No accessory items"}</span><span class="detail-row-value">—</span></div>`}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">${state.lang === "it" ? "Pagamento" : "Payment"}</div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Totale" : "Total"}</span><span class="detail-row-value detail-row-value-mono">${formatCurrency(order.total)}</span></div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Incassato Shopify" : "Collected on Shopify"}</span><span class="detail-row-value" style="color:${getShopifyPaidAmount(order) > 0 ? "#16a34a" : "inherit"}">${formatCurrency(getShopifyPaidAmount(order))}</span></div>
      <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Residuo" : "Residual"}</span><span class="detail-row-value" style="color:${getOpenBalance(order) > 0 ? "#dc2626" : "#16a34a"};font-weight:800">${formatCurrency(getOpenBalance(order))}</span></div>
    </div>
    <div class="detail-actions detail-actions-primary">
      ${!isRoutedToWarehouse(order) ? `<button class="btn primary" data-action="route-warehouse" data-id="${order.id}">${state.lang === "it" ? "Invia a magazzino" : "Send to warehouse"}</button>` : ""}
      ${order.operations?.installation?.required && !order.operations?.installation?.crew ? `<button class="btn primary" data-action="route-installation" data-id="${order.id}">${state.lang === "it" ? "Pianifica posa" : "Plan install"}</button>` : ""}
      ${composeAddress(order) ? `<button class="btn" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(composeAddress(order))}','_blank')">${state.lang === "it" ? "Apri Maps" : "Open Maps"}</button>` : ""}
      ${order.phone ? `<button class="btn" onclick="window.open('tel:${order.phone}')">${state.lang === "it" ? "Chiama cliente" : "Call customer"}</button>` : ""}
    </div>
  `;
  const checklist = getOrderChecklist(order);
  const selectedPrepCount = getWarehousePreparedLines(order).length;
  const orderNoteMarkup = order.note
    ? `<div class="detail-note-chip">${escapeHtml(order.note)}</div>`
    : "";
  ui.orderOfficeSummary.innerHTML = `
    <article class="guidance-card order-next-step-card">
      <span class="panel-eyebrow">${t("orderRadar")}</span>
      <strong>${nextAction}</strong>
      <p>${t("officeActionsCopy")}</p>
      <div class="order-card-badges">
        ${statusChip(orderType.label, orderType.tone.replace("status-", ""))}
        ${statusChip(label, tone)}
      </div>
      <div class="order-office-actions">
        <button class="mini-action primary-mini" data-action="open-modal" data-id="${order.id}">${t("edit")}</button>
        <button class="mini-action" data-action="route-warehouse" data-id="${order.id}">${t("routeWarehouseShort")}</button>
        <button class="mini-action" data-action="route-installation" data-id="${order.id}">${t("routeInstallShort")}</button>
      </div>
    </article>
    ${renderInboxFlowControls(order)}
    <div class="detail-grid detail-grid-tight">
      ${renderInfoLine(t("officeStatus"), order.operations?.officeStatus || (state.lang === "it" ? "bozza" : "draft"))}
      ${renderInfoLine(t("jobType"), order.operations?.installation?.required ? t("supplyInstall") : t("supply"))}
      ${renderInfoLine(t("paymentMethod"), getEffectivePaymentMethod(order))}
      ${renderInfoLine(t("attachmentsCount"), `${(order.attachments || []).length} ${state.lang === "it" ? "file" : "files"}`)}
    </div>
    ${orderNoteMarkup}
    <article class="guidance-card order-snapshot-card">
      <span class="panel-eyebrow">${state.lang === "it" ? "Snapshot ordine" : "Order snapshot"}</span>
      <div class="detail-grid detail-grid-tight">
        ${renderInfoLine(state.lang === "it" ? "Articoli Shopify" : "Shopify lines", `${(order.lineDetails || []).length}`)}
        ${renderInfoLine(state.lang === "it" ? "Righe da preparare" : "Prep lines", `${selectedPrepCount}`)}
        ${renderInfoLine(state.lang === "it" ? "Flusso magazzino" : "Warehouse flow", isRoutedToWarehouse(order) ? t("routeWarehouseStatusOn") : t("routeWarehouseStatusOff"))}
        ${renderInfoLine(state.lang === "it" ? "Flusso posa" : "Install flow", isRoutedToInstallation(order) ? t("routeInstallStatusOn") : t("routeInstallStatusOff"))}
      </div>
    </article>
    <article class="checklist-card">
      <span class="panel-eyebrow">${t("officeChecklist")}</span>
      <div class="checklist-grid">
        ${checklist.map((item) => `
          <div class="checklist-row ${item.done ? "is-done" : ""}">
            <span class="checklist-dot"></span>
            <strong>${item.label}</strong>
          </div>
        `).join("")}
      </div>
      <div class="checklist-note">${order.operations?.officeNote || "—"}</div>
    </article>
    <div class="detail-actions">
      <button class="btn primary" data-action="route-warehouse" data-id="${order.id}">${t("routeWarehouseShort")}</button>
      <button class="btn" data-action="route-installation" data-id="${order.id}">${t("routeInstallShort")}</button>
      <button class="btn" data-action="open-maps" data-id="${order.id}">${state.lang === "it" ? "Apri Maps" : "Open Maps"}</button>
      <button class="btn danger" data-action="open-modal" data-id="${order.id}">${t("edit")}</button>
    </div>
  `;
  if (ui.orderRoutingStatus) {
    ui.orderRoutingStatus.innerHTML = [
      renderInfoLine(t("shippingFlow"), isRoutedToWarehouse(order) ? t("routeWarehouseStatusOn") : t("routeWarehouseStatusOff")),
      renderInfoLine(t("installFlow"), isRoutedToInstallation(order) ? t("routeInstallStatusOn") : t("routeInstallStatusOff")),
    ].join("");
  }
  ui.orderLineList.innerHTML = (order.lineDetails || []).length
    ? order.lineDetails.map((item) => {
      const dims = extractDimensions(item.title);
      const lineType = inferCatalogEntry(item.title)?.type || (isServiceLine(item.title) ? "service" : "other");
      const meta = dims
        ? `${dims.width}x${dims.length} · ${Math.round(dims.sqm * (item.quantity || 1))} mq`
        : lineType === "service"
          ? (state.lang === "it" ? "Servizio / voce non fisica" : "Service / non-physical line")
          : (state.lang === "it" ? "Riga Shopify" : "Shopify line");
      return `<li><span><strong>${item.title}</strong><small class="line-item-meta">${meta}</small></span><strong>x${item.quantity || 1}</strong></li>`;
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
  ui.orderAttachments.innerHTML = renderAttachmentGrid(order.attachments || []);
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
  const unitDetailLabel = inferCatalogEntry(group.product)?.unitLabel || (state.lang === "it" ? "unità" : "units");

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
          <div class="wh-product-total">${group.isModel ? `${Math.round(group.totalSqm)} mq in ${totalPieces} pezzi · ${group.fullCount} interi, ${group.residualCount} residui` : `${group.totalUnits} unità caricate`}</div>
        </div>
        <div class="wh-actions">
          <span class="action-badge ${badgeClass}">${stockState}</span>
          <button class="btn" data-action="prefill-inventory" data-product="${group.product}">${state.lang === "it" ? "Carica giacenza" : "Load stock"}</button>
        </div>
      </div>
      ${deficitAlert}
      <div class="wh-pieces">
        ${group.pieces.length ? group.pieces.map((item) => `
          <button class="wh-piece ${item.status === "residuo" ? "residuo" : "intero"}" data-action="delete-inventory-piece" data-id="${item.id}" title="${state.lang === "it" ? "Rimuovi pezzo" : "Remove piece"}">
            <strong>${formatPieceLabel(item)}</strong>
            <span>${group.isModel ? `${Math.round(item.sqm)} mq` : (item.note || unitDetailLabel)}</span>
            <small>${group.isModel ? (item.status === "residuo" ? "RESIDUO" : "INTERO") : unitDetailLabel.toUpperCase()}</small>
          </button>
        `).join("") : `<div class="wh-empty">${state.lang === "it" ? "Nessun pezzo caricato." : "No pieces loaded."}</div>`}
      </div>
      <div class="wh-stats">
        <div class="wh-stat soft">
          <div class="wh-stat-label">${state.lang === "it" ? "Giacenza" : "Stock"}</div>
          <div class="wh-stat-value">${stockLabel}</div>
          <div class="wh-stat-sub">${group.isModel ? `${totalPieces} ${state.lang === "it" ? "pezzi caricati" : "pieces loaded"}` : `${group.totalUnits} ${unitDetailLabel} ${state.lang === "it" ? "caricati" : "loaded"}`}</div>
        </div>
        <div class="wh-stat ${hasDemand ? "danger" : "soft"}">
          <div class="wh-stat-label">${state.lang === "it" ? "Fabbisogno ordini" : "Order demand"}</div>
          <div class="wh-stat-value" ${hasDemand && hasDeficit ? 'style="color:#dc2626"' : ""}>${demandLabel}</div>
          <div class="wh-stat-sub">${group.demandOrders.length} ${state.lang === "it" ? "ordini da preparare" : "orders to prepare"}</div>
        </div>
        <div class="wh-stat ${hasDeficit ? "danger" : "neutral"}">
          <div class="wh-stat-label">${state.lang === "it" ? "Disponibile netto" : "Net available"}</div>
          <div class="wh-stat-value" ${hasDeficit ? 'style="color:#dc2626"' : netValue > 0 ? 'style="color:#16a34a"' : ""}>${hasDeficit ? (group.isModel ? (state.lang === "it" ? `Mancano ${Math.round(Math.abs(netValue))} mq` : `Missing ${Math.round(Math.abs(netValue))} sq`) : (state.lang === "it" ? `Mancano ${Math.abs(netValue)} u` : `Missing ${Math.abs(netValue)} u`)) : netLabel}</div>
          <div class="wh-stat-sub">${group.isModel ? `${group.fullCount} ${state.lang === "it" ? "interi" : "full"} · ${group.residualCount} ${state.lang === "it" ? "residui" : "residual"}` : `${group.totalUnits} ${unitDetailLabel}`}</div>
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
              <div class="action-sub">${order.operations?.product || "Da definire"} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq · ${composeAddress(order) || "Da definire"}</div>
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

  const order = getSelectedOrder();
  ui.warehouseDetailTitle.textContent = state.lang === "it" ? "Ordini da preparare" : "Orders to prepare";
  ui.warehouseDetailFields.innerHTML = order
    ? [
        { label: "Ordine selezionato", value: `${composeClientName(order)} · ${getOrderNumber(order)}`, meta: composeAddress(order) || "Indirizzo da completare" },
        { label: "Prodotto principale", value: order.operations?.product || "Da definire", meta: `${order.operations?.sqm || 0} mq · ${order.phone || "Telefono non disponibile"}` },
        { label: "Preparazione ufficio", value: `${getWarehousePreparedLines(order).length} righe da preparare`, meta: getWarehousePreparedLines(order).map((item) => `${item.title} x${item.quantity}`).join(" · ") || "Nessuna riga inclusa" },
        { label: "Residuo inventario", value: groups.find((group) => normalizeProductName(group.product) === normalizeProductName(getCatalogLabel(order.operations?.product)))?.isModel ? `${Math.round(groups.find((group) => normalizeProductName(group.product) === normalizeProductName(getCatalogLabel(order.operations?.product)))?.availableSqm || 0)} mq` : "—", meta: "Calcolato sui pezzi caricati a magazzino" },
      ].map(renderDetailBox).join("")
    : [
        { label: "Ordine selezionato", value: state.lang === "it" ? "Nessun ordine selezionato" : "No order selected", meta: state.lang === "it" ? "Scegli un ordine dalla lista di preparazione." : "Pick an order from the preparation list." },
        { label: "Come partire", value: "Carica le giacenze iniziali", meta: "Esempio: Betulla 30 mm · 4 pezzi da 2x25 oppure 12 colli di colla" },
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
    ui.inventoryForm.variant.innerHTML = config.variantOptions.length
      ? config.variantOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")
      : '<option value="">Standard</option>';
    if (!ui.inventoryForm.variant.value || !config.variantOptions.some((option) => option.value === ui.inventoryForm.variant.value)) {
      ui.inventoryForm.variant.value = config.defaultVariant || "";
    }
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
    ui.ddtItemsPreview.innerHTML = `<div class="info-card">Seleziona un ordine in Spedizioni per preparare il DDT con gli articoli fisici del bancale.</div>`;
    return;
  }
  const ddt = getCurrentDdtDraft(order);
  const physicalLines = getWarehousePreparedLines(order);
  const estimate = calculateShippingEstimate(order, ddt);
  const destination = getShippingDestination(order);
  ui.ddtItemsPreview.innerHTML = `
    <div class="detail-grid">
      ${renderDetailBox({
        label: t("shippingAddress"),
        value: composeClientName(order),
        meta: `${composeAddress(order) || "Indirizzo da completare"} · ${destination.provinceCode || (state.lang === "it" ? "Provincia da completare" : "Province missing")} · ${order.phone ? `${order.phone} · PREAVVISO TELEFONICO` : "Telefono da completare"}`,
      })}
      ${renderDetailBox({
        label: "Bancale",
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
        ${physicalLines.map((item) => `<li><span>${item.title}</span><strong>x${item.quantity}</strong></li>`).join("")}
      </ul>
    ` : `<div class="info-card">Questo ordine non ha articoli fisici da riportare nel DDT.</div>`}
  `;
}

function renderShippingMaterialPreview(order) {
  if (!ui.shippingMaterialPreview) return;
  if (!order) {
    ui.shippingMaterialPreview.innerHTML = `<div class="info-card">Seleziona un ordine per vedere subito cosa deve partire, in che formato e con quale priorità di preparazione.</div>`;
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
        <span class="search-pill compact-pill">${order.operations?.product || "Da definire"}</span>
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

function buildInstallationCalendar(orders) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const items = orders.filter((order) => order.operations?.installation?.installDate === key);
    const totalSqm = items.reduce((sum, order) => sum + toNumber(order.operations?.sqm || 0), 0);
    return `
      <article class="cal-day">
        <div class="cal-day-header">
          <div class="cal-day-date">${formatDate(key)}</div>
          <div class="cal-day-capacity">${Math.round(totalSqm)}/120 mq</div>
        </div>
        <div class="cal-gauge"><div class="cal-gauge-fill" style="width:${Math.min(100, Math.round((totalSqm / 120) * 100))}%"></div></div>
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
  const orders = filterInstallations();
  if (ui.installationCalendar) {
    ui.installationCalendar.innerHTML = buildInstallationCalendar(orders);
  }
  ui.installationList.innerHTML = orders.length
    ? orders.map((order) => {
        const selected = order.id === state.selectedOrderId ? "selected" : "";
        const install = order.operations?.installation || {};
        return `
          <article class="order-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="installations">
            <div>
              <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
              <div class="order-meta">${order.operations?.product || t("undefined")} · ${Math.round(toNumber(order.operations?.sqm || 0))} mq · ${composeAddress(order) || (state.lang === "it" ? "Indirizzo da completare" : "Address to complete")}</div>
            </div>
            <div class="order-type-badge type-posa">${install.crew || (state.lang === "it" ? "Da assegnare" : "Unassigned")}</div>
            <div class="order-amount">${install.installDate ? formatDate(install.installDate) : (state.lang === "it" ? "Backlog" : "Backlog")}</div>
            <div class="action-badge ${install.status === "completata" ? "badge-success" : install.status === "in-corso" ? "badge-info" : "badge-warning"}">${install.status || t("toPlan")}</div>
          </article>
        `;
      }).join("")
    : `<div class="info-card">${state.lang === "it" ? "Nessuna posa disponibile per il filtro corrente." : "No installs available for the current filter."}</div>`;

  const order = getSelectedOrder();
  if (!order) {
    ui.installationDetailTitle.textContent = t("noSelection");
    if (ui.installationDetailSummary) ui.installationDetailSummary.innerHTML = "";
    ui.installationAttachments.innerHTML = "";
    return;
  }
  ui.installationDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  if (ui.installationDetailSummary) {
    ui.installationDetailSummary.innerHTML = [
      { label: "Prodotto", value: order.operations?.product || "Da definire", meta: `${order.operations?.sqm || 0} mq · ${order.operations?.surface || "terra"}` },
      { label: "Cliente", value: composeClientName(order), meta: composeAddress(order) || "Indirizzo da completare" },
      { label: "Squadra", value: order.operations?.installation?.crew || "Da assegnare", meta: order.operations?.installation?.clientConfirmed ? "Cliente confermato" : "Conferma cliente mancante" },
      { label: "Programmazione", value: order.operations?.installation?.installDate ? formatDate(order.operations.installation.installDate) : "Data da definire", meta: order.operations?.installation?.installTime || "Ora da definire" },
    ].map(renderDetailBox).join("");
  }
  ui.installationForm.required.value = order.operations?.installation?.required ? "yes" : "no";
  ui.installationForm.crew.value = order.operations?.installation?.crew || "";
  ui.installationForm.installDate.value = order.operations?.installation?.installDate || "";
  ui.installationForm.installTime.value = order.operations?.installation?.installTime || "";
  ui.installationForm.clientConfirmed.value = order.operations?.installation?.clientConfirmed ? "yes" : "no";
  ui.installationForm.status.value = order.operations?.installation?.status || "da-pianificare";
  ui.installationForm.reportNote.value = order.operations?.installation?.reportNote || "";
  ui.installationAttachments.innerHTML = renderAttachmentGrid(order.attachments || []);
}

function renderAccounting() {
  const orders = filterOrdersForView("accounting");
  renderAccountingModels();
  renderAccountingAnalysis(orders);
  ui.accountingList.innerHTML = orders.length
    ? orders.map((order) => {
        const selected = order.id === state.selectedOrderId ? "selected" : "";
        const shopifyPaid = getShopifyPaidAmount(order);
        const internalPaid = getInternalPaidAmount(order);
        const openBalance = getOpenBalance(order);
        return `
          <article class="order-row accounting-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="accounting">
            <div>
              <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
              <div class="order-meta">${getPaymentLabel(order.financialStatus)} &middot; ${getEffectivePaymentMethod(order)} &middot; ${isShopifyPaid(order) ? t("importedFromShopify") : t("internalAccountingPending")} &middot; ${state.lang === "it" ? "Totale" : "Total"} ${formatCurrency(order.total)}</div>
            </div>
            <div class="order-amount" style="color:${openBalance > 0 ? "#dc2626" : "#16a34a"}">${formatCurrency(openBalance)}</div>
            <div class="action-badge ${openBalance > 0 ? "badge-urgent" : "badge-success"}">${openBalance > 0 ? t("accountingOpen") : t("accountingOk")}</div>
          </article>
        `;
      }).join("")
    : `<div class="info-card">${state.lang === "it" ? "Nessun ordine in contabilità con questo filtro." : "No accounting orders for this filter."}</div>`;

  const order = getSelectedOrder();
  if (!order) {
    ui.accountingDetailTitle.textContent = t("noSelection");
    ui.accountingMeta.innerHTML = "";
    return;
  }
  ui.accountingDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  ui.accountingForm.paymentMethod.value = getEffectivePaymentMethod(order);
  ui.accountingForm.depositPaid.value = order.accounting?.depositPaid || "";
  ui.accountingForm.balancePaid.value = order.accounting?.balancePaid || "";
  ui.accountingForm.invoiceRequired.value = order.accounting?.invoiceRequired ? "yes" : "no";
  ui.accountingForm.invoiceIssued.value = order.accounting?.invoiceIssued ? "yes" : "no";
  ui.accountingForm.accountingNote.value = order.accounting?.accountingNote || "";

  const shopifyPaid = getShopifyPaidAmount(order);
  const internalPaid = getInternalPaidAmount(order);
  const openBalance = getOpenBalance(order);
  const totalPaid = shopifyPaid + internalPaid;
  const isInstall = order.operations?.installation?.required;

  const trancheRows = [];
  if (shopifyPaid > 0) {
    trancheRows.push({ type: state.lang === "it" ? "Acconto fornitura" : "Supply deposit", method: getEffectivePaymentMethod(order), amount: shopifyPaid, status: "received", source: "Shopify" });
  }
  if (internalPaid > 0) {
    const depositAmt = toNumber(order.accounting?.depositPaid || 0);
    const balanceAmt = toNumber(order.accounting?.balancePaid || 0);
    if (depositAmt > 0) {
      trancheRows.push({ type: state.lang === "it" ? "Acconto registrato" : "Recorded deposit", method: order.accounting?.paymentMethod || "—", amount: depositAmt, status: "received", source: state.lang === "it" ? "Interno" : "Internal" });
    }
    if (balanceAmt > 0) {
      trancheRows.push({ type: state.lang === "it" ? "Saldo registrato" : "Recorded balance", method: order.accounting?.paymentMethod || "—", amount: balanceAmt, status: "received", source: state.lang === "it" ? "Interno" : "Internal" });
    }
  }
  if (openBalance > 0 && isInstall) {
    trancheRows.push({ type: state.lang === "it" ? "Saldo posa in opera" : "Install balance", method: "—", amount: openBalance, status: "pending", source: state.lang === "it" ? "Da incassare" : "To collect" });
  } else if (openBalance > 0) {
    trancheRows.push({ type: state.lang === "it" ? "Saldo fornitura" : "Supply balance", method: "—", amount: openBalance, status: "pending", source: state.lang === "it" ? "Da incassare" : "To collect" });
  }

  ui.accountingMeta.innerHTML = [
    `
      <div class="detail-section">
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Totale ordine" : "Order total"}</span><span class="detail-row-value detail-row-value-mono" style="font-size:18px">${formatCurrency(order.total)}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Stato Shopify" : "Shopify status"}</span><span class="detail-row-value">${getPaymentLabel(order.financialStatus)} · ${getFulfillmentLabel(order.fulfillmentStatus)}</span></div>
        <div class="detail-row"><span class="detail-row-label">${t("realResidual")}</span><span class="detail-row-value" style="color:${openBalance > 0 ? "#dc2626" : "#16a34a"};font-weight:800;font-size:16px">${formatCurrency(openBalance)}</span></div>
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
        <button class="btn add-payment-btn" type="button" onclick="document.querySelector('#accounting-form [name=depositPaid]').focus()">${state.lang === "it" ? "+ Aggiungi pagamento" : "+ Add payment"}</button>
      </div>
    `,
    `
      <div class="detail-section">
        <div class="detail-section-title">${state.lang === "it" ? "Fatturazione" : "Invoicing"}</div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Fattura richiesta" : "Invoice requested"}</span><span class="detail-row-value">${order.accounting?.invoiceRequired ? t("invoiceRequested") : t("invoiceNotRequested")}</span></div>
        <div class="detail-row"><span class="detail-row-label">${state.lang === "it" ? "Fattura emessa" : "Invoice issued"}</span><span class="detail-row-value">${order.accounting?.invoiceIssued ? t("invoiceIssued") : (state.lang === "it" ? "No" : "No")}</span></div>
      </div>
    `,
    order.accounting?.accountingNote ? `<div class="info-card"><strong>${t("accountingDetailSubtitle")}</strong><p>${order.accounting.accountingNote}</p></div>` : "",
  ].join("");
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

  const updated = await apiFetch(`/api/orders/${order.id}/accounting`, {
    method: "POST",
    body: JSON.stringify({
      paymentMethod: order.paymentMethod || getEffectivePaymentMethod(order),
      depositPaid: 0,
      balancePaid: shopifyPaid,
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

function renderShipping() {
  const orders = filterOrdersForView("shipping");
  const shippingGrid = ui.shippingList?.closest(".order-grid");
  if (shippingGrid) shippingGrid.classList.toggle("is-empty", orders.length === 0);
  if (ui.shippingList) {
    ui.shippingList.innerHTML = orders.length
      ? `
        ${orders.map((order) => {
          const selected = order.id === state.selectedOrderId ? "selected" : "";
          const mode = order.operations?.warehouse?.fulfillmentMode || "da-definire";
          const flowLabel = getShippingModeLabel(order);
          const destination = getShippingDestination(order);
          return `
            <article class="order-row shipping-row ${selected}" data-action="select-order" data-id="${order.id}" data-view="shipping">
              <div>
                <div class="order-name">${composeClientName(order)} <small>${getOrderNumber(order)}</small></div>
                <div class="order-meta">${order.operations?.product || t("undefined")} · ${getShippingModeLabel(order)} · ${composeAddress(order) || (state.lang === "it" ? "Indirizzo da completare" : "Address to complete")} · ${destination.provinceCode || (state.lang === "it" ? "provincia?" : "province?")}</div>
              </div>
              <div class="order-type-badge ${mode === "corriere" ? "type-spedizione" : mode === "ritiro" ? "type-ritiro" : "type-posa"}">${getShipmentStateLabel(order)}</div>
              <div class="order-amount">${getShippingTargetLabel(order)}</div>
              <div class="action-badge ${order.operations?.warehouse?.shipped ? "badge-success" : order.operations?.warehouse?.readyToShip ? "badge-info" : "badge-warning"}">${flowLabel}</div>
            </article>
          `;
        }).join("")}
      `
      : `<div class="info-card">${state.lang === "it" ? "Nessuna spedizione o ritiro con questo filtro." : "No shipments or pickups for this filter."}</div>`;
  }

  const order = getSelectedOrder();
  if (!order) {
    if (ui.shippingDetailTitle) ui.shippingDetailTitle.textContent = t("noSelection");
    if (ui.shippingDetailFields) ui.shippingDetailFields.innerHTML = "";
    if (ui.shippingMaterialPreview) renderShippingMaterialPreview(null);
    if (ui.shippingEstimate) ui.shippingEstimate.innerHTML = "";
    if (ui.ddtItemsPreview) renderDdtPreview(null);
    return;
  }

  if (ui.shippingDetailTitle) {
    ui.shippingDetailTitle.textContent = `${composeClientName(order)} · ${getOrderNumber(order)}`;
  }
  const destination = getShippingDestination(order);
  const estimate = calculateShippingEstimate(order, getCurrentDdtDraft(order));
  if (ui.shippingDetailFields) {
    ui.shippingDetailFields.innerHTML = [
      {
        label: "Prodotto",
        value: order.operations?.product || "Da definire",
        meta: `${order.operations?.sqm || 0} mq · ${composeAddress(order) || "Indirizzo da completare"}`,
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
      ? "Ricollega Shopify"
      : "Connect Shopify";
  }
  if (ui.securityForm) {
    ui.securityForm.reset();
  }
  renderSecurityCenter();
  renderAccountsManager();
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

function renderAccountsManager() {
  if (!ui.accountsList) return;
  if (state.currentUser?.role !== "office") {
    ui.accountsList.innerHTML = `<div class="info-card">Solo l'ufficio puo gestire gli account.</div>`;
    if (ui.accountCreateForm) ui.accountCreateForm.classList.add("hidden");
    return;
  }
  if (ui.accountCreateForm) ui.accountCreateForm.classList.remove("hidden");
  if (!state.users.length) {
    ui.accountsList.innerHTML = `<div class="info-card">Nessun account presente.</div>`;
    return;
  }
  ui.accountsList.innerHTML = state.users.map((user) => `
    <form class="detail-box account-edit-form" data-account-id="${user.id}">
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
    form.addEventListener("submit", updateManagedAccount);
  });
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

function renderAttachmentGrid(items) {
  if (!items?.length) return `<div class="info-card">Nessun allegato caricato.</div>`;
  return items.map((item) => `
    <article class="attachment-item">
      ${item.dataUrl ? `<img src="${item.dataUrl}" alt="${item.name || "Allegato"}" />` : ""}
      <strong>${item.name || "Allegato"}</strong>
      <div>${item.createdAt ? formatDate(item.createdAt) : "—"}</div>
    </article>
  `).join("");
}

function populateInventoryOptions() {
  if (!ui.inventoryProductOptions) return;
  ui.inventoryProductOptions.innerHTML = INVENTORY_CATALOG
    .map((item) => `<option value="${item.label}"></option>`)
    .join("");
}

async function loadSession() {
  const session = await apiFetch("/api/session");
  if (!session.user) {
    showAuth();
    return;
  }
  state.currentUser = session.user;
  state.orders = session.orders || [];
  state.inventory = session.inventory || [];
  state.settings = session.shopifySettings || {};
  state.users = session.users || [];
  state.securityEvents = session.securityEvents || [];
  state.securityPolicy = session.securityPolicy || {};
  if (state.currentUser?.mustChangePassword) state.currentView = "settings";
  ensureSelectedOrder();
  showApp();
}

function showAuth() {
  ui.authScreen.classList.remove("hidden");
  ui.appShell.classList.add("hidden");
}

function showApp() {
  ui.authScreen.classList.add("hidden");
  ui.appShell.classList.remove("hidden");
  render();
}

function render() {
  ensureSelectedOrder();
  populateInventoryOptions();
  updateShell();
  renderOps();
  renderDashboard();
  renderOrders();
  renderWarehouse();
  renderInstallations();
  renderAccounting();
  renderShipping();
  renderSettings();
}

function setView(view) {
  state.currentView = view;
  render();
  focusViewTarget(view);
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

async function syncShopifyOrders() {
  try {
    clearStatus(ui.ordersStatus);
    state.orders = await apiFetch("/api/orders/sync-shopify", { method: "POST" });
    ensureSelectedOrder();
    setStatus(ui.ordersStatus, "success", "Ordini Shopify sincronizzati.");
    render();
  } catch (error) {
    setStatus(
      ui.ordersStatus,
      "error",
      error.message === "missing_shopify_credentials"
        ? "Sync Shopify fallito. Compila dominio store e Admin API access token nelle impostazioni."
        : `Sync Shopify fallito. ${error.message}`,
    );
  }
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
    setStatus(ui.ordersStatus, "success", "Ordini importati correttamente.");
    updateOrderImportPanel();
    render();
  } catch {
    setStatus(ui.ordersStatus, "error", "JSON non valido. Incolla un payload Shopify corretto.");
  }
}

async function clearManualOrders() {
  state.orders = await apiFetch("/api/orders/non-shopify", { method: "DELETE" });
  ensureSelectedOrder();
  render();
}

function openOrderModal(order = null) {
  ui.orderModal.classList.remove("hidden");
  ui.orderModalTitle.textContent = order ? `Modifica ordine ${getOrderNumber(order)}` : "Nuovo ordine";
  ui.deleteOrderButton.classList.toggle("hidden", !order);
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
  render();
}

async function deleteSelectedOrder() {
  const order = getSelectedOrder();
  if (!order) return;
  await apiFetch(`/api/orders/${encodeURIComponent(order.id)}`, { method: "DELETE" });
  state.orders = state.orders.filter((item) => item.id !== order.id);
  ensureSelectedOrder();
  closeOrderModal();
  render();
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
  render();
}

async function saveInventory(event) {
  event.preventDefault();
  const form = new FormData(ui.inventoryForm);
  const config = getInventoryProductConfig(form.get("product"));
  const variantOptions = config.variantOptions || [];
  const variantValue = String(form.get("variant") || config.defaultVariant || "").trim();
  const variantLabel = variantOptions.find((option) => option.value === variantValue)?.label || "";
  state.inventory = await apiFetch("/api/inventory/items", {
    method: "POST",
    body: JSON.stringify({
      product: form.get("product"),
      quantity: form.get("quantity"),
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
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      warehouse: {
        prepItems: nextItems,
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  render();
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
  render();
  return saved;
}

async function saveInboxOrderFlow(orderId, patch = null) {
  const statusInput = document.querySelector(`[data-order-flow-status="${orderId}"]`);
  const modeInput = document.querySelector(`[data-order-flow-mode="${orderId}"]`);
  const dateInput = document.querySelector(`[data-order-flow-date="${orderId}"]`);
  const payload = patch || {
    warehouse: {
      selected: true,
      status: statusInput?.value || "da-preparare",
      fulfillmentMode: modeInput?.value || "da-definire",
      preparationDate: dateInput?.value || "",
    },
  };
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  state.selectedOrderId = saved.id;
  render();
}

async function saveShipping(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order || !ui.shippingForm) return;
  const form = new FormData(ui.shippingForm);
  const destinationProvinceCode = normalizeProvinceCode(form.get("destinationProvinceCode"));
  const destinationProvinceRecord = getProvinceRecord(destinationProvinceCode);
  const payload = {
    warehouse: {
      trackingNumber: String(form.get("trackingNumber") || "").trim(),
      readyToShip: form.get("readyToShip") === "on",
      carrierPassed: form.get("carrierPassed") === "on",
      shipped: form.get("shipped") === "on",
      destination: {
        provinceCode: destinationProvinceCode,
        province: destinationProvinceRecord?.province || String(order.province || ""),
        postalCode: String(form.get("destinationPostalCode") || "").trim(),
        countryCode: String(order.countryCode || "IT").trim().toUpperCase(),
      },
      warehouseNote: form.get("warehouseNote"),
    },
  };
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  render();
}

async function createDdt() {
  const order = getSelectedOrder();
  if (!order) return;
  const form = new FormData(ui.ddtForm);
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
  await downloadDdtPdf(saved);
  ui.warehouseDdtStatus.textContent = `DDT ${saved.operations?.warehouse?.ddt?.number || ""} creato e scaricato in PDF.`;
  render();
}

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
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

async function loadLogoJpeg() {
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = "./logo-prato.png";
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
  } catch {
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = "./logo-prato.jpg";
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
    } catch {
      return null;
    }
  }
}

async function downloadDdtPdf(order) {
  const ddt = order.operations?.warehouse?.ddt || {};
  const logo = await loadLogoJpeg();
  const physicalLines = getWarehousePreparedLines(order);
  const estimate = calculateShippingEstimate(order, ddt);
  const recipient = [
    composeClientName(order),
    order.address || "Indirizzo da completare",
    order.city || "",
    order.phone ? `Tel: ${order.phone} · PREAVVISO TELEFONICO` : "Tel: non disponibile · PREAVVISO TELEFONICO",
    order.email ? `Email: ${order.email}` : "",
  ].filter(Boolean);
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
  pushText(392, 805, 11, "PRATO SINTETICO ITALIA");
  pushText(392, 790, 9, "Vertex Srls · Via Ottorino Respighi 57");
  pushText(392, 777, 9, "81025 Marcianise (CE) · www.pratosinteticoitalia.com");
  pushRect(40, 690, 515, 44);
  const printableDdtNumber = String(ddt.number || getOrderNumber(order)).replace(/^D\.?D\.?T\.?\s*[-:]?\s*/i, "");
  pushText(52, 716, 19, `DDT ${printableDdtNumber}`);
  pushText(404, 716, 10, `Data ${formatDate(ddt.createdAt || new Date().toISOString())}`);
  pushText(52, 698, 9, `Ordine ${getOrderNumber(order)} · ${composeClientName(order)}`);
  pushRect(40, 564, 335, 112);
  pushText(52, 658, 9, "DESTINATARIO / SPEDIZIONE");
  recipient.forEach((row, index) => pushText(52, 638 - (index * 14), 10, row));
  pushRect(392, 564, 163, 112);
  pushText(404, 658, 9, "BANCALE");
  pushText(404, 638, 14, formatPalletDimensions(ddt));
  pushText(404, 616, 9, "PESO REALE");
  pushText(404, 600, 11, ddt.palletWeight || "—");
  pushText(404, 584, 9, String(t("estimatedCost")).toUpperCase());
  pushText(404, 568, 11, estimate.configured && estimate.billableWeight > 0 ? formatCurrency(estimate.estimatedCost) : "—");
  pushRect(40, 156, 515, 392);
  pushText(52, 530, 9, "ARTICOLI TRASPORTATI");
  pushText(454, 530, 9, "QTA");
  pushText(500, 530, 9, "NOTE");
  pushRule(48, 518, 545, 518);
  let rowY = 496;
  physicalLines.forEach((item) => {
    const title = String(item.title || "Prodotto");
    const lineTitle = title.length > 56 ? `${title.slice(0, 56)}…` : title;
    const lineNote = String(item.note || "").slice(0, 16);
    pushText(52, rowY, 10, lineTitle);
    pushText(458, rowY, 10, String(item.quantity || 1));
    if (lineNote) pushText(500, rowY, 9, lineNote);
    rowY -= 18;
  });
  if (!physicalLines.length) {
    pushText(40, rowY, 10, "Nessuna merce fisica da trasportare");
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
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/operations`, {
    method: "POST",
    body: JSON.stringify({
      installation: {
        required: form.get("required") === "yes",
        crew: form.get("crew"),
        installDate: form.get("installDate"),
        installTime: form.get("installTime"),
        clientConfirmed: form.get("clientConfirmed") === "yes",
        status: form.get("status"),
        reportNote: form.get("reportNote"),
      },
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  render();
}

async function saveAccounting(event) {
  event.preventDefault();
  const order = getSelectedOrder();
  if (!order) return;
  const form = new FormData(ui.accountingForm);
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(order.id)}/accounting`, {
    method: "POST",
    body: JSON.stringify({
      paymentMethod: form.get("paymentMethod"),
      depositPaid: form.get("depositPaid"),
      balancePaid: form.get("balancePaid"),
      invoiceRequired: form.get("invoiceRequired") === "yes",
      invoiceIssued: form.get("invoiceIssued") === "yes",
      accountingNote: form.get("accountingNote"),
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  render();
}

async function saveSettings(event) {
  event.preventDefault();
  state.settings = await persistSettingsForm();
  setStatus(ui.settingsStatus, "success", "Impostazioni Shopify salvate.");
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
      webhookBaseUrl: "",
    }),
  });
}

async function connectShopify() {
  try {
    clearStatus(ui.settingsStatus);
    state.settings = await persistSettingsForm();
    const shop = String(state.settings.storeDomain || "").trim();
    if (!shop) {
      setStatus(ui.settingsStatus, "error", "Inserisci prima il dominio Shopify dello store.");
      return;
    }
    window.location.href = `/api/shopify/oauth/start?shop=${encodeURIComponent(shop)}`;
  } catch (error) {
    const message = error.message === "unauthorized"
      ? "Sessione scaduta. Ricarica la pagina ed effettua di nuovo il login."
      : error.message === "forbidden"
        ? "Solo l'account office puo collegare Shopify."
        : error.message === "server_error"
          ? "Errore server durante il salvataggio impostazioni Shopify."
          : `Impossibile avviare il collegamento Shopify. ${error.message || "Controlla le impostazioni."}`;
    setStatus(ui.settingsStatus, "error", message);
  }
}

async function createManagedAccount(event) {
  event.preventDefault();
  if (!ui.accountCreateForm) return;
  clearStatus(ui.accountsStatus);
  const form = new FormData(ui.accountCreateForm);
  try {
    const created = await apiFetch("/api/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        role: form.get("role"),
        status: form.get("status"),
        mustChangePassword: form.get("mustChangePassword") === "on",
        password: form.get("password"),
      }),
    });
    state.users = [...state.users, created].sort((a, b) => a.name.localeCompare(b.name, "it"));
    ui.accountCreateForm.reset();
    await reloadAll();
    renderAccountsManager();
    setStatus(ui.accountsStatus, "success", "Account creato correttamente.");
  } catch (error) {
    const message = error.message === "email_already_exists"
      ? "Esiste gia un account con questa email."
      : error.message === "weak_password_case"
        ? "La password deve contenere maiuscole e minuscole."
        : error.message === "weak_password_number"
          ? "La password deve contenere almeno un numero."
      : error.message === "invalid_account_payload"
        ? "Compila tutti i campi e usa una password di almeno 12 caratteri."
        : "Creazione account fallita.";
    setStatus(ui.accountsStatus, "error", message);
  }
}

async function updateManagedAccount(event) {
  event.preventDefault();
  clearStatus(ui.accountsStatus);
  const form = event.currentTarget;
  const accountId = form.dataset.accountId;
  const data = new FormData(form);
  try {
    const saved = await apiFetch(`/api/accounts/${encodeURIComponent(accountId)}`, {
      method: "POST",
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        role: data.get("role"),
        status: data.get("status"),
        mustChangePassword: data.get("mustChangePassword") === "on",
        password: data.get("password"),
      }),
    });
    state.users = state.users.map((item) => (item.id === saved.id ? saved : item)).sort((a, b) => a.name.localeCompare(b.name, "it"));
    await reloadAll();
    renderAccountsManager();
    setStatus(ui.accountsStatus, "success", "Account aggiornato.");
  } catch (error) {
    const message = error.message === "email_already_exists"
      ? "Questa email e gia usata da un altro account."
      : error.message === "weak_password" || error.message === "weak_password_length"
        ? "La nuova password deve avere almeno 12 caratteri."
        : error.message === "weak_password_case"
          ? "La password deve contenere maiuscole e minuscole."
          : error.message === "weak_password_number"
            ? "La password deve contenere almeno un numero."
        : error.message === "invalid_account_payload"
          ? "Controlla nome, email e ruolo."
          : "Aggiornamento account fallito.";
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
    setStatus(ui.securityStatus, "error", "La nuova password deve avere almeno 12 caratteri.");
    return;
  }
  if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
    setStatus(ui.securityStatus, "error", "Usa almeno una lettera maiuscola e una minuscola.");
    return;
  }
  if (!/\d/.test(newPassword)) {
    setStatus(ui.securityStatus, "error", "Aggiungi almeno un numero alla nuova password.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setStatus(ui.securityStatus, "error", "La conferma password non coincide.");
    return;
  }
  try {
    await apiFetch("/api/account/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    await reloadAll();
    ui.securityForm.reset();
    setStatus(ui.securityStatus, "success", "Password aggiornata correttamente.");
  } catch (error) {
    const message = error.message === "invalid_current_password"
      ? "La password attuale non e corretta."
      : error.message === "weak_password" || error.message === "weak_password_length"
        ? "La nuova password e troppo debole."
        : error.message === "weak_password_case"
          ? "La nuova password deve contenere maiuscole e minuscole."
          : error.message === "weak_password_number"
            ? "La nuova password deve contenere almeno un numero."
        : "Aggiornamento password fallito.";
    setStatus(ui.securityStatus, "error", message);
  }
}

function handleShopifyOauthFeedback() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("shopify");
  const message = params.get("message");
  if (!status) return;

  if (status === "connected") {
    setStatus(ui.settingsStatus, "success", "Shopify collegato correttamente. Ora puoi sincronizzare gli ordini.");
  } else {
    setStatus(ui.settingsStatus, "error", message || "Collegamento Shopify non completato.");
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

function prefillInventoryForm(product) {
  if (!ui.inventoryForm) return;
  ui.inventoryForm.product.value = product || "";
  ui.inventoryForm.quantity.value = ui.inventoryForm.quantity.value || "1";
  ui.inventoryForm.status.value = "intero";
  updateInventoryFormUI();
  setView("warehouse");
  requestAnimationFrame(() => ui.inventoryForm.product.focus());
}

function openAttachmentPicker(type) {
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
  const dataUrl = await readFileAsDataUrl(file);
  const saved = await apiFetch(`/api/orders/${encodeURIComponent(target.id)}/attachments`, {
    method: "POST",
    body: JSON.stringify({
      attachments: [{
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        createdAt: new Date().toISOString(),
      }],
    }),
  });
  state.orders = state.orders.map((item) => (item.id === saved.id ? saved : item));
  state.pendingAttachmentTarget = null;
  render();
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
  const session = await apiFetch("/api/session");
  state.orders = session.orders || [];
  state.inventory = session.inventory || [];
  state.settings = session.shopifySettings || {};
  state.users = session.users || [];
  state.securityEvents = session.securityEvents || [];
  state.securityPolicy = session.securityPolicy || {};
  ensureSelectedOrder();
  render();
}

function handleGlobalClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "delete-inventory-piece") {
    apiFetch(`/api/inventory/items/${encodeURIComponent(id)}`, { method: "DELETE" }).then((inventory) => {
      state.inventory = inventory;
      renderWarehouse();
    });
    return;
  }
  if (action === "prefill-inventory") {
    prefillInventoryForm(button.dataset.product || "");
    return;
  }
  if (action === "route-warehouse") {
    updateOrderRoutingById(id, { warehouse: { selected: true }, installation: { selected: false } });
    return;
  }
  if (action === "save-inbox-flow") {
    saveInboxOrderFlow(id);
    return;
  }
  if (action === "preset-pickup-flow") {
    saveInboxOrderFlow(id, {
      warehouse: {
        selected: true,
        status: "da-preparare",
        fulfillmentMode: "ritiro",
      },
    });
    return;
  }
  if (action === "preset-prepare-only") {
    saveInboxOrderFlow(id, {
      warehouse: {
        selected: true,
        status: "da-preparare",
        fulfillmentMode: "da-definire",
      },
    });
    return;
  }
  if (action === "route-installation") {
    updateOrderRoutingById(id, { warehouse: { selected: true }, installation: { selected: true, required: true } });
    return;
  }
  if (action === "clear-routing-order") {
    updateOrderRoutingById(id, { warehouse: { selected: false }, installation: { selected: false } });
    return;
  }
  const order = state.orders.find((item) => item.id === id) || getSelectedOrder();
  if (!order) return;
  if (action === "select-order") {
    state.selectedOrderId = id;
    if (button.dataset.view) {
      setView(button.dataset.view);
    } else {
      render();
      focusViewTarget(state.currentView);
    }
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

ui.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const form = new FormData(ui.authForm);
    const session = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    state.currentUser = session.user;
    state.orders = session.orders || [];
    state.inventory = session.inventory || [];
    state.settings = session.shopifySettings || {};
    state.users = session.users || [];
    state.securityEvents = session.securityEvents || [];
    state.securityPolicy = session.securityPolicy || {};
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
  }
});

function bindEvent(node, eventName, handler) {
  if (node) node.addEventListener(eventName, handler);
}

ui.navLinks.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
ui.langButtons.forEach((button) => button.addEventListener("click", () => {
  state.lang = button.dataset.lang;
  ui.langButtons.forEach((item) => item.classList.toggle("is-active", item === button));
  render();
}));
ui.quickViewButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.quickView)));
bindEvent(ui.logoutButton, "click", async () => {
  await apiFetch("/api/logout", { method: "POST" });
  state.currentUser = null;
  showAuth();
});
bindEvent(ui.reloadButton, "click", reloadAll);
bindEvent(ui.newOrderButton, "click", () => openOrderModal(null));
bindEvent(ui.dashboardSyncButton, "click", syncShopifyOrders);
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
bindEvent(ui.ordersSearch, "input", (event) => { state.search.orders = event.target.value; renderOrders(); });
bindEvent(ui.warehouseSearch, "input", (event) => { state.search.warehouse = event.target.value; renderWarehouse(); });
bindEvent(ui.accountingSearch, "input", (event) => { state.search.accounting = event.target.value; renderAccounting(); });
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
    renderShipping();
  });
}
ui.orderFilterTags.forEach((button) => button.addEventListener("click", () => {
  state.filters.order = button.dataset.orderFilter;
  ui.orderFilterTags.forEach((item) => item.classList.toggle("is-active", item === button));
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
bindEvent(ui.openOrderModalButton, "click", () => {
  const order = getSelectedOrder();
  if (order) openOrderModal(order);
});
bindEvent(ui.orderAttachmentButton, "click", () => openAttachmentPicker("order"));
if (ui.savePrepListButton) {
  ui.savePrepListButton.addEventListener("click", savePrepList);
}
if (ui.routeToWarehouseButton) {
  ui.routeToWarehouseButton.addEventListener("click", () => updateOrderRouting({
    warehouse: { selected: true },
  }));
}
if (ui.routeToInstallationButton) {
  ui.routeToInstallationButton.addEventListener("click", () => updateOrderRouting({
    warehouse: { selected: true },
    installation: { selected: true, required: true },
  }));
}
if (ui.clearRoutingButton) {
  ui.clearRoutingButton.addEventListener("click", () => updateOrderRouting({
    warehouse: { selected: false },
    installation: { selected: false },
  }));
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
bindEvent(ui.createDdtButton, "click", createDdt);
if (ui.ddtForm) {
  ui.ddtForm.addEventListener("input", () => {
    refreshShippingDraftPreview();
  });
}
bindEvent(ui.installationForm, "submit", saveInstallation);
bindEvent(ui.installationMapsButton, "click", () => {
  const order = getSelectedOrder();
  if (order) openMaps(order);
});
bindEvent(ui.installationAttachmentButton, "click", () => openAttachmentPicker("installation"));
bindEvent(ui.accountingForm, "submit", saveAccounting);
bindEvent(ui.settingsForm, "submit", saveSettings);
bindEvent(ui.connectShopifyButton, "click", connectShopify);
bindEvent(ui.securityForm, "submit", updatePassword);
bindEvent(ui.accountCreateForm, "submit", createManagedAccount);
handleShopifyOauthFeedback();

if (ui.authDemo && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
  ui.authDemo.classList.add("hidden");
}
bindEvent(ui.orderForm, "submit", saveOrder);
bindEvent(ui.deleteOrderButton, "click", deleteSelectedOrder);
ui.closeModalTriggers.forEach((item) => item.addEventListener("click", closeOrderModal));
bindEvent(ui.attachmentInput, "change", handleAttachmentChange);
document.addEventListener("click", handleGlobalClick);

loadSession();

// === EXPORT CSV ===
function exportAccountingCSV() {
  const orders = filterOrdersForView("accounting");
  const rows = [["Ordine", "Cliente", "Prodotto", "Totale", "Shopify", "Acconto", "Saldo", "Residuo", "Metodo", "Fattura richiesta", "Fattura emessa", "Data"]];
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
      order.accounting?.invoiceRequired ? "Sì" : "No",
      order.accounting?.invoiceIssued ? "Sì" : "No",
      formatDate(order.createdAt),
    ]);
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `contabilita_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportAccountingPDF() {
  const orders = filterOrdersForView("accounting");
  let html = `<html><head><style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:18px;color:#1B4332}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}th{background:#1B4332;color:#fff;padding:6px 8px;text-align:left}td{padding:5px 8px;border-bottom:1px solid #ddd}.total{font-weight:bold}.red{color:#dc2626}.green{color:#16a34a}</style></head><body>`;
  html += `<h1>Contabilità — Vertex Ops</h1><p>Esportato il ${new Date().toLocaleDateString("it-IT")} · ${orders.length} ordini</p>`;
  html += `<table><tr><th>Ordine</th><th>Cliente</th><th>Prodotto</th><th>Totale</th><th>Incassato</th><th>Residuo</th><th>Metodo</th><th>Fattura</th></tr>`;
  for (const order of orders) {
    const open = getOpenBalance(order);
    html += `<tr><td>${getOrderNumber(order)}</td><td>${composeClientName(order)}</td><td>${order.operations?.product || "—"}</td><td class="total">${formatCurrency(order.total)}</td><td class="green">${formatCurrency(getShopifyPaidAmount(order) + getInternalPaidAmount(order))}</td><td class="${open > 0 ? "red" : "green"}">${formatCurrency(open)}</td><td>${getEffectivePaymentMethod(order)}</td><td>${order.accounting?.invoiceRequired ? (order.accounting?.invoiceIssued ? "Emessa" : "Da emettere") : "No"}</td></tr>`;
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
