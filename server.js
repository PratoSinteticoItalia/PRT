import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, dirname, join, resolve } from "node:path";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 4178);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = dirname(fileURLToPath(import.meta.url));
const FALLBACK_DATA_DIR = resolve(join(ROOT, "data"));
let DATA_DIR = resolve(process.env.DATA_DIR || FALLBACK_DATA_DIR);
let STORE_PATH = join(DATA_DIR, "store.json");
let SESSION_PATH = join(DATA_DIR, "session.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const SHOPIFY_OAUTH_SCOPES = [
  "read_orders",
  "read_all_orders",
  "read_customers",
  "read_products",
  "read_inventory",
  "read_fulfillments",
].join(",");

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const LOGIN_WINDOW_MS = 1000 * 60 * 2;
const LOGIN_MAX_ATTEMPTS = 20;
const IS_PUBLIC_DEPLOY = Boolean(process.env.RENDER || process.env.NODE_ENV === "production");
const ALLOW_DEMO_FALLBACK = process.env.ALLOW_DEMO_FALLBACK === "true" || !IS_PUBLIC_DEPLOY;
const PASSWORD_MIN_LENGTH = 12;
const BOOTSTRAP_OFFICE_EMAIL = String(process.env.BOOTSTRAP_OFFICE_EMAIL || "office@vertex.local").trim().toLowerCase();
const BOOTSTRAP_OFFICE_PASSWORD = String(process.env.BOOTSTRAP_OFFICE_PASSWORD || "");
const loginAttempts = new Map();

function validatePasswordStrength(password = "") {
  const value = String(password || "");
  if (value.length < PASSWORD_MIN_LENGTH) return "weak_password_length";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) return "weak_password_case";
  if (!/\d/.test(value)) return "weak_password_number";
  return "";
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: scryptSync(String(password || ""), salt, 64).toString("hex"),
  };
}

function verifyPasswordRecord(user, password) {
  const candidate = String(password || "");
  if (user?.passwordHash && user?.passwordSalt) {
    const derived = scryptSync(candidate, user.passwordSalt, 64).toString("hex");
    const left = Buffer.from(derived, "utf8");
    const right = Buffer.from(String(user.passwordHash), "utf8");
    return left.length === right.length && timingSafeEqual(left, right);
  }
  return String(user?.password || "") === candidate;
}

function sanitizePasswordUser(user = {}) {
  const nextUser = { ...user };
  const plainPassword = String(nextUser.password || "");
  if ((!nextUser.passwordHash || !nextUser.passwordSalt) && plainPassword) {
    const { hash, salt } = hashPassword(plainPassword);
    nextUser.passwordHash = hash;
    nextUser.passwordSalt = salt;
  }
  nextUser.status = nextUser.status === "suspended" ? "suspended" : "active";
  nextUser.mustChangePassword = Boolean(nextUser.mustChangePassword);
  nextUser.sessionVersion = Math.max(1, Number(nextUser.sessionVersion || 1));
  nextUser.lastPasswordChangeAt = String(nextUser.lastPasswordChangeAt || "");
  delete nextUser.password;
  return nextUser;
}

function getClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function getLoginAttemptKey(req, email) {
  return `${getClientIp(req)}::${String(email || "").trim().toLowerCase()}`;
}

function pruneLoginAttempts(now = Date.now()) {
  for (const [key, entry] of loginAttempts.entries()) {
    if (!entry || entry.resetAt <= now) loginAttempts.delete(key);
  }
}

function recordFailedLogin(req, email) {
  pruneLoginAttempts();
  const key = getLoginAttemptKey(req, email);
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    loginAttempts.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function clearFailedLogin(req, email) {
  loginAttempts.delete(getLoginAttemptKey(req, email));
}

function isLoginBlocked(req, email) {
  pruneLoginAttempts();
  const entry = loginAttempts.get(getLoginAttemptKey(req, email));
  return Boolean(entry && entry.count >= LOGIN_MAX_ATTEMPTS && entry.resetAt > Date.now());
}

function setDataDir(nextDir) {
  DATA_DIR = resolve(nextDir);
  STORE_PATH = join(DATA_DIR, "store.json");
  SESSION_PATH = join(DATA_DIR, "session.json");
}

function ensureWritableDataDir() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const probePath = join(DATA_DIR, ".write-test");
    writeFileSync(probePath, "ok", "utf8");
    unlinkSync(probePath);
  } catch {
    if (DATA_DIR !== FALLBACK_DATA_DIR) {
      setDataDir(FALLBACK_DATA_DIR);
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }
}

ensureWritableDataDir();

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

function buildDefaultStore() {
  return {
    users: [
      {
        id: "u1",
        name: "Gabriele Todaro",
        email: "office@vertex.local",
        password: "office123",
        role: "office",
      },
      {
        id: "u2",
        name: "Ivan Magazzino",
        email: "warehouse@vertex.local",
        password: "warehouse123",
        role: "warehouse",
      },
      {
        id: "u3",
        name: "Squadra Alpha",
        email: "crew@vertex.local",
        password: "crew123",
        role: "crew",
      },
    ],
    jobs: [],
    orders: [],
    inventory: [],
    securityEvents: [],
    shopifySettings: {
      storeDomain: "",
      clientId: "",
      clientSecret: "",
      adminAccessToken: "",
      installedShop: "",
      tokenScope: "",
      tokenUpdatedAt: "",
      locationName: "",
      carrierName: "",
      shippingRateMode: "oneexpress-auto",
      shippingTariffProfile: "silver",
      volumetricDivisor: "5000",
      rate80: "",
      rate150: "",
      rate300: "",
      rate500: "",
      rate1000: "",
      extraKgRate: "",
      webhookBaseUrl: "",
      webhookEndpoint: "",
      webhookSubscriptionId: "",
    },
  };
}

function getDemoUsers() {
  return buildDefaultStore().users.map((user) => ({ ...user }));
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status === "suspended" ? "suspended" : "active",
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

function isValidRole(role = "") {
  return ["office", "warehouse", "crew"].includes(String(role || "").trim());
}

function pushSecurityEvent(store, type, actor, message, meta = {}) {
  store.securityEvents = Array.isArray(store.securityEvents) ? store.securityEvents : [];
  store.securityEvents.unshift({
    id: randomUUID(),
    type,
    actor: actor || "system",
    message,
    meta,
    createdAt: new Date().toISOString(),
  });
  store.securityEvents = store.securityEvents.slice(0, 150);
}

function serializeShopifySettings(settings = {}) {
  return {
    ...settings,
    clientSecret: "",
    adminAccessToken: "",
    hasClientSecret: Boolean(String(settings.clientSecret || "").trim()),
    hasAdminAccessToken: Boolean(String(settings.adminAccessToken || "").trim()),
  };
}

function requireOffice(res, currentUser) {
  if (!currentUser) return false;
  if (currentUser?.role === "office") return false;
  sendJson(res, 403, { error: "forbidden" });
  return true;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self' https://*.myshopify.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendRedirect(res, location, headers = {}) {
  res.writeHead(302, {
    Location: location,
    ...headers,
  });
  res.end();
}

function isValidShopDomain(shop = "") {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(shop || "").trim());
}

function buildShopifyAuthQuery(searchParams) {
  return [...searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function verifyShopifyOauthHmac(searchParams, secret) {
  const hmac = String(searchParams.get("hmac") || "");
  if (!hmac || !secret) return false;
  const payload = buildShopifyAuthQuery(searchParams);
  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(digest, "utf8");
  const right = Buffer.from(hmac, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function getRequestBaseUrl(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim() || "https";
  return `${proto}://${req.headers.host}`;
}

function getShopifyRedirectUri(req) {
  return `${getRequestBaseUrl(req)}/api/shopify/oauth/callback`;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function toNumber(value) {
  const parsed = Number(String(value || "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSquareMeters(title, quantity = 1) {
  const normalized = String(title || "").replace(",", ".");
  const slashMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m\s*\/\s*(\d+(?:\.\d+)?)\s*m/i);
  if (slashMatch) return toNumber(slashMatch[1]) * toNumber(slashMatch[2]) * quantity;

  const xMatch = normalized.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*m/i);
  if (xMatch) return toNumber(xMatch[1]) * toNumber(xMatch[2]) * quantity;

  const mqMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mq/i);
  if (mqMatch) return toNumber(mqMatch[1]) * quantity;

  return 0;
}

function classifyOrderLine(title = "") {
  if (/(installazione|posa)/i.test(title)) return "service";
  if (/(banda|giunzione|telo|colla|picchetti|pietrisco|bordura|ciottol|lapillo|sabbia|kit|profumo|detergente|spazzolatrice|spazzola|mattonella|campionatura|box campionatura)/i.test(title)) {
    return "material";
  }
  return "product";
}

function normalizeStringLineDetails(lineItems = []) {
  return lineItems.map((item) => {
    const raw = String(item || "");
    const qtyMatch = raw.match(/·\s*(\d+(?:[.,]\d+)?)\s*pz/i);
    return {
      title: raw.replace(/\s*·\s*\d+(?:[.,]\d+)?\s*pz/i, "").trim(),
      quantity: qtyMatch ? toNumber(qtyMatch[1]) : 1,
    };
  });
}

function deriveOrderData(order) {
  const details = Array.isArray(order.lineDetails) && order.lineDetails.length
    ? order.lineDetails
    : normalizeStringLineDetails(order.lineItems || []);

  const products = [];
  const materials = [];
  const services = [];
  let sqm = 0;

  details.forEach((detail) => {
    const title = String(detail.title || "").trim();
    const quantity = Number(detail.quantity || 1);
    if (!title) return;
    const type = classifyOrderLine(title);
    if (type === "service") {
      services.push(title);
      if (!sqm) sqm = quantity;
      return;
    }
    if (type === "material") {
      materials.push(title);
      return;
    }
    const itemSqm = parseSquareMeters(title, quantity);
    sqm += itemSqm;
    products.push({ title, sqm: itemSqm });
  });

  const mainProduct = [...products].sort((a, b) => b.sqm - a.sqm)[0]?.title || products[0]?.title || "Da definire";
  const inferredSurface = materials.some((item) => /(pietrisco|picchetti|telo)/i.test(item)) ? "terra" : "pavimentazione";

  return {
    mainProduct: mainProduct.split(" - ")[0].trim(),
    sqm: Math.round(sqm || 0),
    materials,
    services,
    jobType: services.length ? "fornitura-posa" : "fornitura",
    surface: inferredSurface,
  };
}

function buildDefaultOperations(order, linkedJob = null) {
  const derived = deriveOrderData(order);
  return {
    officeStatus: linkedJob ? "operativo" : "bozza",
    product: linkedJob?.product || derived.mainProduct || "Da definire",
    sqm: Number(linkedJob?.sqm || derived.sqm || 0),
    surface: linkedJob?.surface || derived.surface || "terra",
    officeNote: linkedJob?.notes || "",
    materials: Array.isArray(linkedJob?.materials) && linkedJob.materials.length
      ? linkedJob.materials
      : Array.isArray(derived.materials)
        ? derived.materials
        : [],
    warehouse: {
      selected: false,
      status: linkedJob?.warehouseStatus || "da-preparare",
      fulfillmentMode: "da-definire",
      carrier: "",
      trackingNumber: "",
      carrierPassed: false,
      readyToShip: false,
      shipped: false,
      pickupLabel: "",
      vanLoadLabel: "",
      warehouseNote: "",
      destination: {
        provinceCode: order.provinceCode || "",
        province: order.province || "",
        postalCode: order.postalCode || "",
        countryCode: order.countryCode || "IT",
      },
      ddt: {
        number: "",
        palletLength: "",
        palletWidth: "",
        palletHeight: "",
        palletWeight: "",
        createdAt: "",
      },
    },
    installation: {
      required: (linkedJob?.jobType || derived.jobType) === "fornitura-posa",
      selected: false,
      crew: linkedJob?.crew || "",
      installDate: linkedJob?.installDate || "",
      installTime: linkedJob?.installTime || "",
      clientConfirmed: false,
      status: linkedJob?.installStatus || "da-pianificare",
      reportNote: "",
    },
  };
}

function normalizeOperations(order, linkedJob = null) {
  const defaults = buildDefaultOperations(order, linkedJob);
  const current = order.operations || {};
  return {
    officeStatus: current.officeStatus || defaults.officeStatus,
    product: current.product || defaults.product,
    sqm: Number(current.sqm || defaults.sqm || 0),
    surface: current.surface || defaults.surface,
    officeNote: current.officeNote || defaults.officeNote || "",
    materials: Array.isArray(current.materials) && current.materials.length ? current.materials : defaults.materials,
    warehouse: {
      selected: Boolean(current.warehouse?.selected ?? defaults.warehouse.selected),
      status: current.warehouse?.status || defaults.warehouse.status,
      fulfillmentMode: current.warehouse?.fulfillmentMode || defaults.warehouse.fulfillmentMode,
      carrier: current.warehouse?.carrier || defaults.warehouse.carrier,
      trackingNumber: current.warehouse?.trackingNumber || defaults.warehouse.trackingNumber,
      carrierPassed: Boolean(current.warehouse?.carrierPassed ?? defaults.warehouse.carrierPassed),
      readyToShip: Boolean(current.warehouse?.readyToShip ?? defaults.warehouse.readyToShip),
      shipped: Boolean(current.warehouse?.shipped ?? defaults.warehouse.shipped),
      pickupLabel: current.warehouse?.pickupLabel || defaults.warehouse.pickupLabel,
      vanLoadLabel: current.warehouse?.vanLoadLabel || defaults.warehouse.vanLoadLabel,
      warehouseNote: current.warehouse?.warehouseNote || defaults.warehouse.warehouseNote,
      destination: {
        provinceCode: String(current.warehouse?.destination?.provinceCode || defaults.warehouse.destination.provinceCode || "").trim().toUpperCase(),
        province: String(current.warehouse?.destination?.province || defaults.warehouse.destination.province || "").trim(),
        postalCode: String(current.warehouse?.destination?.postalCode || defaults.warehouse.destination.postalCode || "").trim(),
        countryCode: String(current.warehouse?.destination?.countryCode || defaults.warehouse.destination.countryCode || "IT").trim().toUpperCase(),
      },
      prepItems: Array.isArray(current.warehouse?.prepItems)
        ? current.warehouse.prepItems.map((item) => ({
            title: String(item?.title || "").trim(),
            quantity: Number(item?.quantity || 1),
            included: item?.included !== false,
            note: String(item?.note || "").trim(),
          })).filter((item) => item.title)
        : [],
      ddt: {
        number: current.warehouse?.ddt?.number || defaults.warehouse.ddt.number,
        palletLength: current.warehouse?.ddt?.palletLength || defaults.warehouse.ddt.palletLength,
        palletWidth: current.warehouse?.ddt?.palletWidth || defaults.warehouse.ddt.palletWidth,
        palletHeight: current.warehouse?.ddt?.palletHeight || defaults.warehouse.ddt.palletHeight,
        palletWeight: current.warehouse?.ddt?.palletWeight || defaults.warehouse.ddt.palletWeight,
        createdAt: current.warehouse?.ddt?.createdAt || defaults.warehouse.ddt.createdAt,
      },
    },
    installation: {
      required: Boolean(current.installation?.required ?? defaults.installation.required),
      selected: Boolean(current.installation?.selected ?? defaults.installation.selected),
      crew: current.installation?.crew || defaults.installation.crew,
      installDate: current.installation?.installDate || defaults.installation.installDate,
      installTime: current.installation?.installTime || defaults.installation.installTime,
      clientConfirmed: Boolean(current.installation?.clientConfirmed ?? defaults.installation.clientConfirmed),
      status: current.installation?.status || defaults.installation.status,
      reportNote: current.installation?.reportNote || defaults.installation.reportNote,
    },
  };
}

function reconcileStoreData(store) {
  const defaults = buildDefaultStore();
  let changed = false;

  store.users = Array.isArray(store.users) && store.users.length
    ? store.users.map((user, index) => {
        const normalized = sanitizePasswordUser({
          id: user.id || defaults.users[index]?.id || randomUUID(),
          name: String(user.name || defaults.users[index]?.name || "").trim(),
          email: String(user.email || defaults.users[index]?.email || "").trim().toLowerCase(),
          password: String(user.password || defaults.users[index]?.password || ""),
          passwordHash: String(user.passwordHash || ""),
          passwordSalt: String(user.passwordSalt || ""),
          role: String(user.role || defaults.users[index]?.role || "office").trim(),
        });
        if (normalized.passwordHash !== user.passwordHash || normalized.passwordSalt !== user.passwordSalt || "password" in user) {
          changed = true;
        }
        return normalized;
      })
    : defaults.users.map((user) => {
        changed = true;
        return sanitizePasswordUser({ ...user });
      });

  store.inventory = Array.isArray(store.inventory)
    ? store.inventory.map((item) => ({
        id: item.id || randomUUID(),
        product: String(item.product || "").trim(),
        width: toNumber(item.width || 0),
        length: toNumber(item.length || 0),
        sqm: toNumber(item.sqm || (toNumber(item.width || 0) * toNumber(item.length || 0))),
        variant: String(item.variant || ""),
        status: item.status === "residuo" ? "residuo" : "intero",
        note: String(item.note || ""),
        createdAt: item.createdAt || new Date().toISOString(),
      }))
    : [];

  store.jobs = Array.isArray(store.jobs) ? store.jobs : [];
  store.orders = Array.isArray(store.orders) ? store.orders : [];
  store.securityEvents = Array.isArray(store.securityEvents) ? store.securityEvents : [];
  store.shopifySettings = {
    ...defaults.shopifySettings,
    ...(store.shopifySettings || {}),
  };

  store.orders = store.orders.map((order) => {
    const nextOrder = { ...order };
    if (!Array.isArray(nextOrder.lineDetails) || !nextOrder.lineDetails.length) {
      nextOrder.lineDetails = normalizeStringLineDetails(nextOrder.lineItems || []);
    }
    if (!Array.isArray(nextOrder.lineItems) || !nextOrder.lineItems.length) {
      nextOrder.lineItems = nextOrder.lineDetails.map((item) => item.title);
    }
    nextOrder.paymentMethod = nextOrder.paymentMethod || nextOrder.accounting?.paymentMethod || "";
    nextOrder.provinceCode = String(nextOrder.provinceCode || "").trim().toUpperCase();
    nextOrder.province = String(nextOrder.province || "").trim();
    nextOrder.postalCode = String(nextOrder.postalCode || "").trim();
    nextOrder.countryCode = String(nextOrder.countryCode || "IT").trim().toUpperCase();
    nextOrder.accounting = {
      paymentMethod: nextOrder.accounting?.paymentMethod || nextOrder.paymentMethod || "",
      depositPaid: toNumber(nextOrder.accounting?.depositPaid || 0),
      balancePaid: toNumber(nextOrder.accounting?.balancePaid || 0),
      invoiceRequired: Boolean(nextOrder.accounting?.invoiceRequired),
      invoiceIssued: Boolean(nextOrder.accounting?.invoiceIssued),
      accountingNote: nextOrder.accounting?.accountingNote || "",
    };
    nextOrder.attachments = Array.isArray(nextOrder.attachments) ? nextOrder.attachments : [];
    const linkedJob = store.jobs.find((job) => job.sourceOrderId === nextOrder.id) || null;
    nextOrder.operations = normalizeOperations(nextOrder, linkedJob);
    return nextOrder;
  });

  store.jobs = store.jobs.map((job) => {
    if (!job.sourceOrderId) return job;
    const sourceOrder = store.orders.find((order) => order.id === job.sourceOrderId);
    if (!sourceOrder) return job;
    const derived = deriveOrderData(sourceOrder);
    return {
      ...job,
      firstName: sourceOrder.firstName || job.firstName,
      lastName: sourceOrder.lastName || job.lastName,
      city: sourceOrder.city || job.city,
      phone: sourceOrder.phone || job.phone,
      email: sourceOrder.email || job.email,
      address: sourceOrder.address || job.address,
      jobType: derived.jobType || job.jobType,
      surface: derived.surface || job.surface,
      product: derived.mainProduct || job.product,
      sqm: derived.sqm || job.sqm,
      materials: derived.materials.length ? derived.materials : job.materials,
      attachments: Array.isArray(job.attachments) ? job.attachments : [],
    };
  });

  store.orders.forEach((order) => {
    const existingJob = store.jobs.find((job) => job.sourceOrderId === order.id);
    order.convertedJobId = existingJob?.id || null;
  });

  if (BOOTSTRAP_OFFICE_PASSWORD) {
    const bootstrapError = validatePasswordStrength(BOOTSTRAP_OFFICE_PASSWORD);
    if (!bootstrapError) {
      const officeIndex = store.users.findIndex((user) => String(user.email || "").trim().toLowerCase() === BOOTSTRAP_OFFICE_EMAIL)
        >= 0
        ? store.users.findIndex((user) => String(user.email || "").trim().toLowerCase() === BOOTSTRAP_OFFICE_EMAIL)
        : store.users.findIndex((user) => user.role === "office");
      if (officeIndex >= 0) {
        const officeUser = store.users[officeIndex];
        if (!verifyPasswordRecord(officeUser, BOOTSTRAP_OFFICE_PASSWORD)) {
          const { hash, salt } = hashPassword(BOOTSTRAP_OFFICE_PASSWORD);
          store.users[officeIndex] = {
            ...officeUser,
            email: BOOTSTRAP_OFFICE_EMAIL || officeUser.email,
            passwordHash: hash,
            passwordSalt: salt,
            status: "active",
            mustChangePassword: true,
            sessionVersion: Math.max(1, Number(officeUser.sessionVersion || 1)) + 1,
            lastPasswordChangeAt: new Date().toISOString(),
          };
          pushSecurityEvent(
            store,
            "bootstrap_password_reset",
            "system",
            `Bootstrap password applicata per ${store.users[officeIndex].email}.`,
            { email: store.users[officeIndex].email },
          );
          changed = true;
        }
      }
    }
  }

  return changed;
}

function normalizeOrderPayload(order, index) {
  const customer = order.customer || {};
  const shipping = order.shipping_address || order.default_address || {};
  const lineDetails = Array.isArray(order.line_items)
    ? order.line_items.map((item) => ({
        title: item.title || item.name || "Prodotto",
        quantity: Number(item.quantity || 1),
      }))
    : Array.isArray(order.lineDetails)
      ? order.lineDetails.map((item) => ({
          title: String(item.title || item.name || ""),
          quantity: Number(item.quantity || 1),
        }))
      : Array.isArray(order.lineItems)
        ? order.lineItems.map((item) => ({ title: String(item), quantity: 1 }))
        : [];
  const lineItems = lineDetails.map((item) => item.title);

  return {
    id: String(order.id || order.order_number || `import-${Date.now()}-${index}`),
    orderNumber: order.name || order.orderNumber || `#${order.order_number || index + 1}`,
    firstName: shipping.first_name || customer.first_name || order.firstName || "",
    lastName: shipping.last_name || customer.last_name || order.lastName || "",
    email: order.email || customer.email || "",
    phone: shipping.phone || customer.phone || order.phone || "",
    city: shipping.city || order.city || "",
    address: [shipping.address1, shipping.address2].filter(Boolean).join(" ") || order.address || "",
    provinceCode: String(shipping.province_code || shipping.provinceCode || order.provinceCode || "").trim().toUpperCase(),
    province: String(shipping.province || order.province || "").trim(),
    postalCode: String(shipping.zip || shipping.postalCode || order.postalCode || "").trim(),
    countryCode: String(shipping.country_code || shipping.countryCode || order.countryCode || "IT").trim().toUpperCase(),
    total: String(order.current_total_price || order.total_price || order.total || "—"),
    financialStatus: String(order.financial_status || order.financialStatus || "pending"),
    fulfillmentStatus: String(order.fulfillment_status || order.fulfillmentStatus || "unfulfilled"),
    paymentMethod: Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join(", ") : String(order.paymentMethod || ""),
    source: "shopify-json",
    note: order.note || "",
    lineItems,
    lineDetails,
    accounting: order.accounting || {
      paymentMethod: Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join(", ") : String(order.paymentMethod || ""),
      depositPaid: 0,
      balancePaid: 0,
      invoiceRequired: false,
      invoiceIssued: false,
      accountingNote: "",
    },
    attachments: Array.isArray(order.attachments) ? order.attachments : [],
    convertedJobId: null,
  };
}

function normalizeGraphqlOrder(node, index) {
  const shipping = node.shippingAddress || {};
  const customer = node.customer || {};
  const lineDetails = Array.isArray(node.lineItems?.edges)
    ? node.lineItems.edges.map(({ node: item }) => ({
        title: item.name || "Prodotto",
        quantity: Number(item.currentQuantity || 1),
      }))
    : [];
  const lineItems = lineDetails.map((item) => item.title);

  return {
    id: String(node.id || `graphql-${Date.now()}-${index}`),
    orderNumber: node.name || `#${index + 1}`,
    firstName: shipping.firstName || customer.firstName || "",
    lastName: shipping.lastName || customer.lastName || "",
    email: node.email || customer.email || "",
    phone: shipping.phone || customer.phone || "",
    city: shipping.city || "",
    address: [shipping.address1, shipping.address2].filter(Boolean).join(" "),
    provinceCode: String(shipping.provinceCode || "").trim().toUpperCase(),
    province: String(shipping.province || "").trim(),
    postalCode: String(shipping.zip || "").trim(),
    countryCode: String(shipping.countryCodeV2 || "IT").trim().toUpperCase(),
    total: String(node.currentTotalPriceSet?.shopMoney?.amount || "—"),
    financialStatus: String(node.displayFinancialStatus || "pending"),
    fulfillmentStatus: String(node.displayFulfillmentStatus || "unfulfilled"),
    paymentMethod: Array.isArray(node.paymentGatewayNames) ? node.paymentGatewayNames.join(", ") : "",
    source: "shopify-live",
    note: node.note || "",
    lineItems,
    lineDetails,
    accounting: {
      paymentMethod: Array.isArray(node.paymentGatewayNames) ? node.paymentGatewayNames.join(", ") : "",
      depositPaid: 0,
      balancePaid: 0,
      invoiceRequired: false,
      invoiceIssued: false,
      accountingNote: "",
    },
    attachments: Array.isArray(node.attachments) ? node.attachments : [],
    convertedJobId: null,
  };
}

function jobFromOrder(order) {
  const derived = deriveOrderData(order);
  const combinedNotes = [
    order.note ? `Nota ordine: ${order.note}` : "",
    order.financialStatus ? `Pagamento Shopify: ${order.financialStatus}` : "",
    order.fulfillmentStatus ? `Fulfillment Shopify: ${order.fulfillmentStatus}` : "",
  ].filter(Boolean).join(" · ");

  return {
    id: randomUUID(),
    firstName: order.firstName,
    lastName: order.lastName,
    city: order.city,
    phone: order.phone || "",
    email: order.email || "",
    address: order.address || "",
    jobType: derived.jobType,
    surface: derived.surface,
    product: derived.mainProduct,
    sqm: derived.sqm,
    installDate: "",
    installTime: "",
    crew: "Alpha",
    priority: "media",
    warehouseStatus: "da-preparare",
    installStatus: "da-pianificare",
    materials: derived.materials.length ? derived.materials : Array.isArray(order.lineItems) ? order.lineItems.slice() : [],
    notes: combinedNotes,
    attachments: [],
    sourceOrderId: order.id,
  };
}

async function ensureStore() {
  ensureWritableDataDir();
  if (!existsSync(STORE_PATH)) {
    await writeJson(STORE_PATH, buildDefaultStore());
  }
  if (!existsSync(SESSION_PATH)) {
    await writeJson(SESSION_PATH, {});
  }
}

async function syncOrdersFromShopify(store) {
  const { storeDomain } = store.shopifySettings || {};
  if (!storeDomain) {
    throw new Error("missing_shopify_credentials");
  }
  const accessToken = await getShopifyAccessToken(store);

  const endpoint = `https://${storeDomain}/admin/api/2026-01/graphql.json`;
  const orderFields = `
    id
    name
    email
    note
    displayFinancialStatus
    displayFulfillmentStatus
    paymentGatewayNames
    currentTotalPriceSet {
      shopMoney {
        amount
      }
    }
    customer {
      firstName
      lastName
      email
      phone
    }
    shippingAddress {
      firstName
      lastName
      phone
      city
      province
      provinceCode
      zip
      countryCodeV2
      address1
      address2
    }
    lineItems(first: 20) {
      edges {
        node {
          name
          currentQuantity
        }
      }
    }
  `;

  async function fetchOrderBatch(batchQuery, batchLabel) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: batchQuery }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      throw new Error(responseText ? `shopify_sync_failed: ${batchLabel} ${response.status} ${responseText}` : `shopify_sync_failed: ${batchLabel} ${response.status}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload?.errors) && payload.errors.length) {
      throw new Error(`shopify_sync_failed: ${batchLabel} ${payload.errors.map((item) => item.message || item).join(" | ")}`);
    }
    return payload?.data?.orders?.edges || [];
  }

  const recentQuery = `
    query VertexOpsRecentOrders {
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            ${orderFields}
          }
        }
      }
    }
  `;

  const openOrdersQuery = `
    query VertexOpsOpenOrders {
      orders(
        first: 100,
        sortKey: UPDATED_AT,
        reverse: true,
        query: "status:open OR fulfillment_status:unfulfilled OR fulfillment_status:partial OR financial_status:pending OR financial_status:authorized"
      ) {
        edges {
          node {
            ${orderFields}
          }
        }
      }
    }
  `;

  const recentEdges = await fetchOrderBatch(recentQuery, "recent_orders");
  const openEdges = await fetchOrderBatch(openOrdersQuery, "open_orders");
  const uniqueNodes = new Map();
  [...recentEdges, ...openEdges].forEach((edge) => {
    if (edge?.node?.id) uniqueNodes.set(edge.node.id, edge.node);
  });
  const normalized = [...uniqueNodes.values()].map((node, index) => normalizeGraphqlOrder(node, index));
  const existingIds = new Set(store.orders.map((order) => order.id));
  normalized.forEach((order) => {
    const existingIndex = store.orders.findIndex((item) => item.id === order.id);
    if (existingIndex >= 0) {
      store.orders[existingIndex] = { ...store.orders[existingIndex], ...order, convertedJobId: store.orders[existingIndex].convertedJobId || null };
    } else if (!existingIds.has(order.id)) {
      store.orders.unshift(order);
    }
  });
  return store.orders;
}

async function getShopifyAccessToken(store) {
  const { storeDomain, clientId, clientSecret, adminAccessToken } = store.shopifySettings || {};
  if (!storeDomain) {
    throw new Error("missing_shopify_credentials");
  }

  const directToken = String(adminAccessToken || "").trim();
  if (directToken) {
    return directToken;
  }

  if (!clientId || !clientSecret) {
    throw new Error("missing_shopify_credentials");
  }

  const tokenResponse = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    const responseText = await tokenResponse.text().catch(() => "");
    throw new Error(responseText ? `shopify_token_failed: ${tokenResponse.status} ${responseText}` : `shopify_token_failed: ${tokenResponse.status}`);
  }

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload?.access_token) {
    throw new Error("shopify_token_failed: token_missing");
  }

  return tokenPayload.access_token;
}

function upsertOrderRecord(store, order) {
  const existingOrderIndex = store.orders.findIndex((item) => item.id === order.id);
  const existingOrder = existingOrderIndex >= 0 ? store.orders[existingOrderIndex] : null;

  if (existingOrder) {
    const merged = {
      ...existingOrder,
      ...order,
      convertedJobId: existingOrder.convertedJobId || order.convertedJobId || null,
    };
    merged.operations = normalizeOperations(merged, store.jobs.find((job) => job.sourceOrderId === merged.id) || null);
    store.orders[existingOrderIndex] = merged;
    return { order: merged, job: merged.convertedJobId ? store.jobs.find((job) => job.id === merged.convertedJobId) || null : null };
  }

  const created = { ...order, convertedJobId: null };
  created.operations = normalizeOperations(created, null);
  store.orders.unshift(created);
  return { order: created, job: null };
}

function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const left = Buffer.from(digest);
  const right = Buffer.from(String(hmacHeader));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function getSessionUser(req, store) {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.vertex_session) return null;
  const session = await readJson(SESSION_PATH, {});
  const entry = session[cookies.vertex_session];
  const userId = typeof entry === "string" ? entry : entry?.userId;
  const version = typeof entry === "object" && entry?.version ? Number(entry.version) : 1;
  const expiresAt = typeof entry === "object" && entry?.expiresAt ? Number(entry.expiresAt) : 0;
  if (expiresAt && expiresAt < Date.now()) {
    delete session[cookies.vertex_session];
    await writeJson(SESSION_PATH, session);
    return null;
  }
  if (!userId) return null;
  const user = store.users.find((item) => item.id === userId) || null;
  if (!user) return null;
  if (Number(user.sessionVersion || 1) !== version || user.status === "suspended") {
    delete session[cookies.vertex_session];
    await writeJson(SESSION_PATH, session);
    return null;
  }
  return user;
}

async function handleApi(req, res, url) {
  await ensureStore();
  const store = await readJson(STORE_PATH, { users: [], jobs: [], orders: [], shopifySettings: {} });
  const storeChanged = reconcileStoreData(store);
  if (storeChanged) {
    await writeJson(STORE_PATH, store);
  }
  const currentUser = await getSessionUser(req, store);

  if (url.pathname === "/api/session" && req.method === "GET") {
    return sendJson(res, 200, {
      user: sanitizeUser(currentUser),
      jobs: currentUser ? store.jobs : [],
      orders: currentUser ? store.orders : [],
      inventory: currentUser ? store.inventory : [],
      shopifySettings: currentUser ? serializeShopifySettings(store.shopifySettings) : {},
      users: currentUser?.role === "office" ? store.users.map(sanitizeUser) : [],
      securityEvents: currentUser?.role === "office" ? store.securityEvents : [],
      securityPolicy: currentUser?.role === "office"
        ? {
            passwordMinLength: PASSWORD_MIN_LENGTH,
            bootstrapRecoveryActive: Boolean(BOOTSTRAP_OFFICE_PASSWORD),
          }
        : {},
    });
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    if (isLoginBlocked(req, email)) {
      return sendJson(res, 429, { error: "too_many_attempts" });
    }
    const demoUsers = getDemoUsers();
    let user = store.users.find((item) => item.email.toLowerCase() === email && verifyPasswordRecord(item, password));
    const demoUser = ALLOW_DEMO_FALLBACK
      ? demoUsers.find((item) => item.email.toLowerCase() === email && item.password === password) || null
      : null;

    if (!user && demoUser) {
      const existingIndex = store.users.findIndex((item) => item.email.toLowerCase() === email);
      const securedDemoUser = sanitizePasswordUser(demoUser);
      if (existingIndex >= 0) {
        store.users[existingIndex] = { ...store.users[existingIndex], ...securedDemoUser };
      } else {
        store.users.push(securedDemoUser);
      }
      user = securedDemoUser;
      await writeJson(STORE_PATH, store);
    }

    if (!user) {
      recordFailedLogin(req, email);
      pushSecurityEvent(store, "login_failed", email || "unknown", "Tentativo login fallito.", { ip: getClientIp(req) });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 401, { error: "invalid_credentials" });
    }
    if (user.status === "suspended") {
      pushSecurityEvent(store, "login_blocked", user.email, "Login rifiutato: account sospeso.", { ip: getClientIp(req) });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 403, { error: "account_suspended" });
    }
    clearFailedLogin(req, email);

    const sessionId = randomUUID();
    const sessions = await readJson(SESSION_PATH, {});
    sessions[sessionId] = { userId: user.id, version: Number(user.sessionVersion || 1), expiresAt: Date.now() + SESSION_TTL_MS };
    await writeJson(SESSION_PATH, sessions);
    pushSecurityEvent(store, "login_success", user.email, "Login effettuato.", { ip: getClientIp(req) });
    await writeJson(STORE_PATH, store);

    return sendJson(
      res,
      200,
      {
        user: sanitizeUser(user),
        jobs: store.jobs,
        orders: store.orders,
        inventory: store.inventory,
        shopifySettings: serializeShopifySettings(store.shopifySettings),
        users: user.role === "office" ? store.users.map(sanitizeUser) : [],
        securityEvents: user.role === "office" ? store.securityEvents : [],
        securityPolicy: user.role === "office"
          ? {
              passwordMinLength: PASSWORD_MIN_LENGTH,
              bootstrapRecoveryActive: Boolean(BOOTSTRAP_OFFICE_PASSWORD),
            }
          : {},
      },
      {
        "Set-Cookie": `vertex_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Secure`,
      },
    );
  }

  if (url.pathname === "/api/logout" && req.method === "POST") {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.vertex_session) {
      const sessions = await readJson(SESSION_PATH, {});
      delete sessions[cookies.vertex_session];
      await writeJson(SESSION_PATH, sessions);
    }
    return sendJson(
      res,
      200,
      { ok: true },
      { "Set-Cookie": "vertex_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure" },
    );
  }

  if (url.pathname === "/api/account/password" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const currentPassword = String(body.currentPassword || "");
    const nextPassword = String(body.newPassword || "");
    const passwordError = validatePasswordStrength(nextPassword);
    if (passwordError) {
      return sendJson(res, 400, { error: passwordError });
    }
    const userIndex = store.users.findIndex((item) => item.id === currentUser.id);
    if (userIndex < 0) return sendJson(res, 404, { error: "user_not_found" });
    const storedUser = store.users[userIndex];
    if (!verifyPasswordRecord(storedUser, currentPassword)) {
      return sendJson(res, 400, { error: "invalid_current_password" });
    }
    const { hash, salt } = hashPassword(nextPassword);
    const sessions = await readJson(SESSION_PATH, {});
    const currentCookie = parseCookies(req.headers.cookie).vertex_session;
    store.users[userIndex] = {
      ...storedUser,
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: false,
      sessionVersion: Math.max(1, Number(storedUser.sessionVersion || 1)) + 1,
      lastPasswordChangeAt: new Date().toISOString(),
    };
    delete store.users[userIndex].password;
    const sessionId = randomUUID();
    sessions[sessionId] = {
      userId: storedUser.id,
      version: store.users[userIndex].sessionVersion,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    if (currentCookie) delete sessions[currentCookie];
    await writeJson(SESSION_PATH, sessions);
    pushSecurityEvent(store, "password_changed", currentUser.email, "Password aggiornata dall'utente.", {});
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true }, {
      "Set-Cookie": `vertex_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    });
  }

  if (url.pathname === "/api/webhooks/shopify/orders" && req.method === "POST") {
    const rawBody = await readRawBody(req);
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    const topic = String(req.headers["x-shopify-topic"] || "");
    const verified = verifyShopifyWebhook(rawBody, hmacHeader, store.shopifySettings?.clientSecret || "");
    if (!verified) return sendJson(res, 401, { error: "invalid_webhook_signature" });
    if (topic && topic !== "orders/create") return sendJson(res, 200, { ok: true, ignored: true });

    const payload = JSON.parse(rawBody.toString("utf8") || "{}");
    const normalized = normalizeOrderPayload(payload, 0);
    const result = upsertOrderRecord(store, normalized);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true, orderId: result.order.id, jobId: result.job?.id || null });
  }

  if (url.pathname === "/api/shopify/oauth/start" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    if (!currentUser) {
      return sendRedirect(res, "/index.html?shopify=error&message=Effettua%20prima%20il%20login");
    }

    const shop = String(url.searchParams.get("shop") || store.shopifySettings?.storeDomain || "").trim().toLowerCase();
    const clientId = String(store.shopifySettings?.clientId || "").trim();
    const clientSecret = String(store.shopifySettings?.clientSecret || "").trim();
    if (!isValidShopDomain(shop) || !clientId || !clientSecret) {
      return sendRedirect(res, "/index.html?shopify=error&message=Completa%20dominio,%20client%20id%20e%20client%20secret");
    }

    const state = randomUUID();
    const redirectUri = getShopifyRedirectUri(req);
    const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("scope", SHOPIFY_OAUTH_SCOPES);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);

    return sendRedirect(
      res,
      authorizeUrl.toString(),
      {
        "Set-Cookie": `shopify_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax`,
      },
    );
  }

  if (url.pathname === "/api/shopify/oauth/callback" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    const cookies = parseCookies(req.headers.cookie);
    const state = String(url.searchParams.get("state") || "");
    const shop = String(url.searchParams.get("shop") || "").trim().toLowerCase();
    const code = String(url.searchParams.get("code") || "");
    const clientId = String(store.shopifySettings?.clientId || "").trim();
    const clientSecret = String(store.shopifySettings?.clientSecret || "").trim();

    if (!isValidShopDomain(shop) || !code || !state || state !== String(cookies.shopify_oauth_state || "")) {
      return sendRedirect(res, "/index.html?shopify=error&message=Callback%20Shopify%20non%20valida");
    }
    if (!verifyShopifyOauthHmac(url.searchParams, clientSecret)) {
      return sendRedirect(res, "/index.html?shopify=error&message=Verifica%20Shopify%20fallita");
    }
    if (!clientId || !clientSecret) {
      return sendRedirect(res, "/index.html?shopify=error&message=Mancano%20le%20credenziali%20app");
    }

    try {
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        return sendRedirect(res, "/index.html?shopify=error&message=Scambio%20token%20Shopify%20fallito");
      }

      const tokenPayload = await tokenResponse.json();
      if (!tokenPayload?.access_token) {
        return sendRedirect(res, "/index.html?shopify=error&message=Token%20Shopify%20non%20ricevuto");
      }

      store.shopifySettings = {
        ...store.shopifySettings,
        storeDomain: shop,
        installedShop: shop,
        adminAccessToken: tokenPayload.access_token,
        tokenScope: String(tokenPayload.scope || ""),
        tokenUpdatedAt: new Date().toISOString(),
      };
      await writeJson(STORE_PATH, store);

      return sendRedirect(
        res,
        "/index.html?shopify=connected",
        {
          "Set-Cookie": "shopify_oauth_state=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
        },
      );
    } catch {
      return sendRedirect(res, "/index.html?shopify=error&message=OAuth%20Shopify%20non%20completato");
    }
  }

  if (!currentUser) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  if (url.pathname === "/api/bootstrap" && req.method === "GET") {
    return sendJson(res, 200, {
      user: sanitizeUser(currentUser),
      jobs: store.jobs,
      orders: store.orders,
      inventory: store.inventory,
      shopifySettings: serializeShopifySettings(store.shopifySettings),
      users: currentUser?.role === "office" ? store.users.map(sanitizeUser) : [],
      securityEvents: currentUser?.role === "office" ? store.securityEvents : [],
      securityPolicy: currentUser?.role === "office"
        ? {
            passwordMinLength: PASSWORD_MIN_LENGTH,
            bootstrapRecoveryActive: Boolean(BOOTSTRAP_OFFICE_PASSWORD),
          }
        : {},
    });
  }

  if (url.pathname === "/api/security/events" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    return sendJson(res, 200, store.securityEvents);
  }

  if (url.pathname === "/api/accounts" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    return sendJson(res, 200, store.users.map(sanitizeUser));
  }

  if (url.pathname === "/api/accounts" && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "").trim();
    const password = String(body.password || "");
    const status = String(body.status || "active").trim() === "suspended" ? "suspended" : "active";
    const mustChangePassword = Boolean(body.mustChangePassword);
    if (!name || !email || !isValidRole(role)) {
      return sendJson(res, 400, { error: "invalid_account_payload" });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return sendJson(res, 400, { error: passwordError });
    }
    if (store.users.some((item) => item.email.toLowerCase() === email)) {
      return sendJson(res, 400, { error: "email_already_exists" });
    }
    const { hash, salt } = hashPassword(password);
    const created = {
      id: randomUUID(),
      name,
      email,
      role,
      status,
      mustChangePassword,
      sessionVersion: 1,
      lastPasswordChangeAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };
    store.users.push(created);
    pushSecurityEvent(store, "account_created", currentUser.email, `Creato account ${email}.`, { email, role, status });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, sanitizeUser(created));
  }

  if (url.pathname.match(/^\/api\/accounts\/[^/]+$/) && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const userId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const userIndex = store.users.findIndex((item) => item.id === userId);
    if (userIndex < 0) return sendJson(res, 404, { error: "user_not_found" });
    const current = store.users[userIndex];
    const nextEmail = String(body.email || current.email || "").trim().toLowerCase();
    const nextName = String(body.name || current.name || "").trim();
    const nextRole = String(body.role || current.role || "").trim();
    const nextStatus = String(body.status || current.status || "active").trim() === "suspended" ? "suspended" : "active";
    const mustChangePassword = body.mustChangePassword === true || body.mustChangePassword === "true";
    const newPassword = String(body.password || "");
    if (!nextName || !nextEmail || !isValidRole(nextRole)) {
      return sendJson(res, 400, { error: "invalid_account_payload" });
    }
    if (store.users.some((item) => item.id !== userId && item.email.toLowerCase() === nextEmail)) {
      return sendJson(res, 400, { error: "email_already_exists" });
    }
    const updated = {
      ...current,
      name: nextName,
      email: nextEmail,
      role: nextRole,
      status: nextStatus,
      mustChangePassword: mustChangePassword || current.mustChangePassword,
    };
    if (newPassword) {
      const passwordError = validatePasswordStrength(newPassword);
      if (passwordError) {
        return sendJson(res, 400, { error: passwordError });
      }
      const { hash, salt } = hashPassword(newPassword);
      updated.passwordHash = hash;
      updated.passwordSalt = salt;
      updated.mustChangePassword = mustChangePassword || false;
      updated.sessionVersion = Math.max(1, Number(current.sessionVersion || 1)) + 1;
      updated.lastPasswordChangeAt = new Date().toISOString();
      delete updated.password;
    } else if (mustChangePassword !== current.mustChangePassword || nextStatus !== current.status) {
      updated.sessionVersion = Math.max(1, Number(current.sessionVersion || 1)) + 1;
    }
    store.users[userIndex] = updated;
    pushSecurityEvent(store, "account_updated", currentUser.email, `Aggiornato account ${nextEmail}.`, {
      email: nextEmail,
      role: nextRole,
      status: nextStatus,
      mustChangePassword: updated.mustChangePassword,
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, sanitizeUser(updated));
  }

  if (url.pathname === "/api/inventory" && req.method === "GET") {
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname === "/api/inventory/items" && req.method === "POST") {
    const body = await readBody(req);
    const quantity = Math.max(1, Math.round(toNumber(body.quantity || 1)));
    const product = String(body.product || "").trim();
    const width = toNumber(body.width || 0);
    const length = toNumber(body.length || 0);
    const note = String(body.note || "");
    const status = body.status === "residuo" ? "residuo" : "intero";
    if (!product) {
      return sendJson(res, 400, { error: "invalid_inventory_payload" });
    }
    const created = Array.from({ length: quantity }, () => ({
      id: randomUUID(),
      product,
      width,
      length,
      sqm: width && length ? Number((width * length).toFixed(2)) : 0,
      variant: String(body.variant || ""),
      status,
      note,
      createdAt: new Date().toISOString(),
    }));
    store.inventory.unshift(...created);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname.match(/^\/api\/inventory\/items\/[^/]+$/) && req.method === "DELETE") {
    const itemId = decodeURIComponent(url.pathname.split("/")[4]);
    store.inventory = store.inventory.filter((item) => item.id !== itemId);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname === "/api/jobs" && req.method === "GET") {
    return sendJson(res, 200, store.jobs);
  }

  if (url.pathname === "/api/jobs" && req.method === "POST") {
    const body = await readBody(req);
    const nextJobs = [body, ...store.jobs.filter((job) => job.id !== body.id)];
    store.jobs = nextJobs;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, body);
  }

  if (url.pathname.startsWith("/api/jobs/") && req.method === "DELETE") {
    const jobId = url.pathname.split("/").pop();
    store.jobs = store.jobs.filter((job) => job.id !== jobId);
    store.orders = store.orders.map((order) => order.convertedJobId === jobId ? { ...order, convertedJobId: null } : order);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname.match(/^\/api\/jobs\/[^/]+\/attachments$/) && req.method === "POST") {
    const jobId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const jobIndex = store.jobs.findIndex((item) => item.id === jobId);
    if (jobIndex < 0) return sendJson(res, 404, { error: "job_not_found" });
    const current = store.jobs[jobIndex];
    store.jobs[jobIndex] = {
      ...current,
      attachments: [...(current.attachments || []), ...(Array.isArray(body.attachments) ? body.attachments : [])],
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.jobs[jobIndex]);
  }

  if (url.pathname === "/api/orders" && req.method === "GET") {
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname === "/api/orders" && req.method === "POST") {
    const body = await readBody(req);
    const manualOrder = {
      id: randomUUID(),
      orderNumber: String(body.orderNumber || `MAN-${Date.now()}`),
      firstName: String(body.firstName || "").trim(),
      lastName: String(body.lastName || "").trim(),
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      city: String(body.city || "").trim(),
      provinceCode: String(body.provinceCode || "").trim().toUpperCase(),
      province: "",
      postalCode: String(body.postalCode || "").trim(),
      countryCode: "IT",
      address: String(body.address || "").trim(),
      total: String(body.total || "0"),
      financialStatus: String(body.financialStatus || "pending"),
      fulfillmentStatus: String(body.fulfillmentStatus || "unfulfilled"),
      paymentMethod: String(body.paymentMethod || ""),
      source: "manual",
      note: String(body.note || ""),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
      lineDetails: Array.isArray(body.lineDetails)
        ? body.lineDetails.map((item) => ({
            title: String(item.title || ""),
            quantity: Number(item.quantity || 1),
          }))
        : [],
      accounting: {
        paymentMethod: String(body.paymentMethod || ""),
        depositPaid: 0,
        balancePaid: 0,
        invoiceRequired: false,
        invoiceIssued: false,
        accountingNote: "",
      },
      attachments: [],
      convertedJobId: null,
    };
    manualOrder.operations = normalizeOperations(manualOrder, null);
    store.orders.unshift(manualOrder);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, manualOrder);
  }

  if (url.pathname === "/api/orders/non-shopify" && req.method === "DELETE") {
    const removableOrderIds = new Set(store.orders.filter((order) => order.source !== "shopify-live").map((order) => order.id));
    store.orders = store.orders.filter((order) => order.source === "shopify-live");
    store.jobs = store.jobs.filter((job) => !removableOrderIds.has(job.sourceOrderId));
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname.startsWith("/api/orders/") && req.method === "DELETE" && !url.pathname.endsWith("/create-job") && !url.pathname.endsWith("/accounting") && !url.pathname.endsWith("/attachments")) {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    store.orders = store.orders.filter((item) => item.id !== orderId);
    if (order.convertedJobId) {
      store.jobs = store.jobs.filter((job) => job.id !== order.convertedJobId);
    }
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (
    url.pathname.match(/^\/api\/orders\/[^/]+$/)
    && req.method === "POST"
    && url.pathname !== "/api/orders/sync-shopify"
    && url.pathname !== "/api/orders/import"
  ) {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    const nextOrder = {
      ...current,
      orderNumber: String(body.orderNumber || current.orderNumber || ""),
      firstName: String(body.firstName || current.firstName || ""),
      lastName: String(body.lastName || current.lastName || ""),
      email: String(body.email || current.email || ""),
      phone: String(body.phone || current.phone || ""),
      city: String(body.city || current.city || ""),
      provinceCode: String(body.provinceCode || current.provinceCode || "").trim().toUpperCase(),
      province: String(current.province || ""),
      postalCode: String(body.postalCode || current.postalCode || "").trim(),
      countryCode: String(current.countryCode || "IT").trim().toUpperCase(),
      address: String(body.address || current.address || ""),
      total: String(body.total || current.total || "0"),
      note: String(body.note || current.note || ""),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : current.lineItems || [],
      lineDetails: Array.isArray(body.lineDetails)
        ? body.lineDetails.map((item) => ({
            title: String(item.title || ""),
            quantity: Number(item.quantity || 1),
          }))
        : current.lineDetails || [],
    };
    nextOrder.operations = normalizeOperations(
      {
        ...nextOrder,
        operations: {
          ...(current.operations || {}),
          product: body.product || current.operations?.product || "",
          sqm: body.sqm || current.operations?.sqm || 0,
          surface: body.surface || current.operations?.surface || "terra",
          officeNote: body.officeNote || current.operations?.officeNote || "",
          materials: Array.isArray(body.materials) ? body.materials : current.operations?.materials || [],
          installation: {
            ...(current.operations?.installation || {}),
            required: body.installRequired != null ? Boolean(body.installRequired) : current.operations?.installation?.required,
          },
        },
      },
      store.jobs.find((job) => job.sourceOrderId === current.id) || null,
    );
    store.orders[orderIndex] = nextOrder;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, nextOrder);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/attachments$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    store.orders[orderIndex] = {
      ...current,
      attachments: [...(current.attachments || []), ...(Array.isArray(body.attachments) ? body.attachments : [])],
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/operations$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    store.orders[orderIndex] = {
      ...current,
      operations: normalizeOperations(
        {
          ...current,
          operations: {
            ...current.operations,
            ...body,
            warehouse: {
              ...(current.operations?.warehouse || {}),
              ...(body.warehouse || {}),
              ddt: {
                ...(current.operations?.warehouse?.ddt || {}),
                ...(body.warehouse?.ddt || {}),
              },
            },
            installation: {
              ...(current.operations?.installation || {}),
              ...(body.installation || {}),
            },
          },
        },
        store.jobs.find((job) => job.sourceOrderId === current.id) || null,
      ),
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/create-ddt$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    const currentDdt = current.operations?.warehouse?.ddt || {};
    const createdAt = new Date().toISOString();
    const number = body.number || currentDdt.number || `DDT-${String(current.orderNumber || orderId).replace(/[^\w-]/g, "")}`;
    store.orders[orderIndex] = {
      ...current,
      operations: normalizeOperations(
        {
          ...current,
          operations: {
            ...(current.operations || {}),
            warehouse: {
              ...(current.operations?.warehouse || {}),
              ddt: {
                ...currentDdt,
                number,
                palletLength: body.palletLength || currentDdt.palletLength || "",
                palletWidth: body.palletWidth || currentDdt.palletWidth || "",
                palletHeight: body.palletHeight || currentDdt.palletHeight || "",
                palletWeight: body.palletWeight || currentDdt.palletWeight || "",
                createdAt,
              },
            },
          },
        },
        store.jobs.find((job) => job.sourceOrderId === current.id) || null,
      ),
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/accounting$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    store.orders[orderIndex] = {
      ...current,
      paymentMethod: body.paymentMethod || current.paymentMethod || "",
      accounting: {
        paymentMethod: body.paymentMethod || current.accounting?.paymentMethod || current.paymentMethod || "",
        depositPaid: toNumber(body.depositPaid || 0),
        balancePaid: toNumber(body.balancePaid || 0),
        invoiceRequired: Boolean(body.invoiceRequired),
        invoiceIssued: Boolean(body.invoiceIssued),
        accountingNote: String(body.accountingNote || current.accounting?.accountingNote || ""),
      },
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname === "/api/orders/import" && req.method === "POST") {
    const body = await readBody(req);
    const orders = Array.isArray(body) ? body : Array.isArray(body.orders) ? body.orders : [];
    if (!orders.length) return sendJson(res, 400, { error: "invalid_payload" });

    const normalized = orders.map(normalizeOrderPayload);
    normalized.forEach((order) => {
      upsertOrderRecord(store, order);
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname === "/api/orders/sync-shopify" && req.method === "POST") {
    try {
      const orders = await syncOrdersFromShopify(store);
      orders.forEach((order) => {
        upsertOrderRecord(store, order);
      });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, store.orders);
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "shopify_sync_failed" });
    }
  }

  if (url.pathname === "/api/webhooks/register-shopify" && req.method === "POST") {
    const { storeDomain, webhookBaseUrl } = store.shopifySettings || {};
    if (!webhookBaseUrl) return sendJson(res, 400, { error: "missing_webhook_base_url" });
    if (!storeDomain) return sendJson(res, 400, { error: "missing_shopify_credentials" });

    try {
      const accessToken = await getShopifyAccessToken(store);
      const endpoint = `${String(webhookBaseUrl).replace(/\/$/, "")}/api/webhooks/shopify/orders`;
      const mutation = `
        mutation RegisterOrdersCreateWebhook($topic: WebhookSubscriptionTopic!, $subscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $subscription) {
            userErrors {
              field
              message
            }
            webhookSubscription {
              id
              topic
              uri
            }
          }
        }
      `;

      const response = await fetch(`https://${storeDomain}/admin/api/2026-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            topic: "ORDERS_CREATE",
            subscription: {
              uri: endpoint,
              format: "JSON",
            },
          },
        }),
      });

      if (!response.ok) return sendJson(res, 400, { error: "webhook_register_failed" });
      const payload = await response.json();
      const created = payload?.data?.webhookSubscriptionCreate;
      if (created?.userErrors?.length) {
        return sendJson(res, 400, { error: created.userErrors[0].message || "webhook_register_failed" });
      }

      store.shopifySettings.webhookEndpoint = endpoint;
      store.shopifySettings.webhookSubscriptionId = created?.webhookSubscription?.id || "";
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, { endpoint, subscriptionId: store.shopifySettings.webhookSubscriptionId });
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "webhook_register_failed" });
    }
  }

  if (url.pathname === "/api/orders/demo" && req.method === "POST") {
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/create-job$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    const existing = order.convertedJobId ? store.jobs.find((job) => job.id === order.convertedJobId) : null;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { job: existing, order });
  }

  if (url.pathname === "/api/settings/shopify" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    return sendJson(res, 200, serializeShopifySettings(store.shopifySettings));
  }

  if (url.pathname === "/api/settings/shopify" && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const body = await readBody(req);
    store.shopifySettings = {
      storeDomain: body.storeDomain || "",
      clientId: body.clientId || "",
      clientSecret: body.clientSecret || store.shopifySettings?.clientSecret || "",
      adminAccessToken: body.adminAccessToken || store.shopifySettings?.adminAccessToken || "",
      installedShop: store.shopifySettings?.installedShop || "",
      tokenScope: store.shopifySettings?.tokenScope || "",
      tokenUpdatedAt: store.shopifySettings?.tokenUpdatedAt || "",
      locationName: body.locationName || "",
      carrierName: body.carrierName || "",
      shippingRateMode: body.shippingRateMode === "manual-weight" ? "manual-weight" : "oneexpress-auto",
      shippingTariffProfile: body.shippingTariffProfile === "gold" ? "gold" : "silver",
      volumetricDivisor: body.volumetricDivisor || "5000",
      rate80: body.rate80 || "",
      rate150: body.rate150 || "",
      rate300: body.rate300 || "",
      rate500: body.rate500 || "",
      rate1000: body.rate1000 || "",
      extraKgRate: body.extraKgRate || "",
      webhookBaseUrl: body.webhookBaseUrl || "",
      webhookEndpoint: store.shopifySettings?.webhookEndpoint || "",
      webhookSubscriptionId: store.shopifySettings?.webhookSubscriptionId || "",
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, serializeShopifySettings(store.shopifySettings));
  }

  if (url.pathname === "/api/reset-demo" && req.method === "POST") {
    const fresh = await readJson(STORE_PATH, store);
    return sendJson(res, 200, fresh);
  }

  return sendJson(res, 404, { error: "not_found" });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(ROOT, requestedPath);
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  } catch (error) {
    if (url.pathname.startsWith("/api/")) {
      return sendJson(res, 500, { error: "server_error", message: error.message });
    }

    try {
      const content = await readFile(join(ROOT, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Vertex Ops backend running on http://${HOST}:${PORT}`);
});
