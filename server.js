import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PORT || 4178);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = resolve(".");
const DATA_DIR = resolve(process.env.DATA_DIR || join(ROOT, "data"));
const STORE_PATH = join(DATA_DIR, "store.json");
const SESSION_PATH = join(DATA_DIR, "session.json");

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
    shopifySettings: {
      storeDomain: "",
      clientId: "",
      clientSecret: "",
      locationName: "",
      webhookBaseUrl: "",
      webhookEndpoint: "",
      webhookSubscriptionId: "",
    },
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
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
    ...headers,
  });
  res.end(JSON.stringify(payload));
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

function reconcileStoreData(store) {
  store.orders = (store.orders || []).map((order) => {
    const nextOrder = { ...order };
    if (!Array.isArray(nextOrder.lineDetails) || !nextOrder.lineDetails.length) {
      nextOrder.lineDetails = normalizeStringLineDetails(nextOrder.lineItems || []);
    }
    if (!Array.isArray(nextOrder.lineItems) || !nextOrder.lineItems.length) {
      nextOrder.lineItems = nextOrder.lineDetails.map((item) => item.title);
    }
    nextOrder.paymentMethod = nextOrder.paymentMethod || nextOrder.accounting?.paymentMethod || "";
    nextOrder.accounting = {
      paymentMethod: nextOrder.accounting?.paymentMethod || nextOrder.paymentMethod || "",
      depositPaid: toNumber(nextOrder.accounting?.depositPaid || 0),
      balancePaid: toNumber(nextOrder.accounting?.balancePaid || 0),
      invoiceRequired: Boolean(nextOrder.accounting?.invoiceRequired),
      invoiceIssued: Boolean(nextOrder.accounting?.invoiceIssued),
      accountingNote: nextOrder.accounting?.accountingNote || "",
    };
    nextOrder.attachments = Array.isArray(nextOrder.attachments) ? nextOrder.attachments : [];
    return nextOrder;
  });

  store.jobs = (store.jobs || []).map((job) => {
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
    if (existingJob) {
      order.convertedJobId = existingJob.id;
      return;
    }
    const draftJob = jobFromOrder(order);
    order.convertedJobId = draftJob.id;
    store.jobs.unshift(draftJob);
  });
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
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
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
  const query = `
    query VertexOpsOrders {
      orders(first: 25, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
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
          }
        }
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("shopify_sync_failed");
  }

  const payload = await response.json();
  const edges = payload?.data?.orders?.edges || [];
  const normalized = edges.map((edge, index) => normalizeGraphqlOrder(edge.node, index));
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
  const { storeDomain, clientId, clientSecret } = store.shopifySettings || {};
  if (!storeDomain || !clientId || !clientSecret) {
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
    throw new Error("shopify_sync_failed");
  }

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload?.access_token) {
    throw new Error("shopify_sync_failed");
  }

  return tokenPayload.access_token;
}

function upsertOrderAndMaybeJob(store, order) {
  const existingOrderIndex = store.orders.findIndex((item) => item.id === order.id);
  const existingOrder = existingOrderIndex >= 0 ? store.orders[existingOrderIndex] : null;

  if (existingOrder) {
    const merged = { ...existingOrder, ...order, convertedJobId: existingOrder.convertedJobId || order.convertedJobId || null };
    store.orders[existingOrderIndex] = merged;
    if (merged.convertedJobId) {
      return { order: merged, job: store.jobs.find((job) => job.id === merged.convertedJobId) || null };
    }
    const job = jobFromOrder(merged);
    merged.convertedJobId = job.id;
    store.jobs.unshift(job);
    return { order: merged, job };
  }

  const created = { ...order, convertedJobId: null };
  const job = jobFromOrder(created);
  created.convertedJobId = job.id;
  store.orders.unshift(created);
  store.jobs.unshift(job);
  return { order: created, job };
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
  const userId = session[cookies.vertex_session];
  if (!userId) return null;
  return store.users.find((user) => user.id === userId) || null;
}

async function handleApi(req, res, url) {
  await ensureStore();
  const store = await readJson(STORE_PATH, { users: [], jobs: [], orders: [], shopifySettings: {} });
  reconcileStoreData(store);
  const currentUser = await getSessionUser(req, store);

  if (url.pathname === "/api/session" && req.method === "GET") {
    return sendJson(res, 200, {
      user: sanitizeUser(currentUser),
      jobs: currentUser ? store.jobs : [],
      orders: currentUser ? store.orders : [],
      shopifySettings: currentUser ? store.shopifySettings : {},
    });
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const user = store.users.find((item) => item.email.toLowerCase() === email && item.password === password);
    if (!user) return sendJson(res, 401, { error: "invalid_credentials" });

    const sessionId = randomUUID();
    const sessions = await readJson(SESSION_PATH, {});
    sessions[sessionId] = user.id;
    await writeJson(SESSION_PATH, sessions);

    return sendJson(
      res,
      200,
      {
        user: sanitizeUser(user),
        jobs: store.jobs,
        orders: store.orders,
        shopifySettings: store.shopifySettings,
      },
      {
        "Set-Cookie": `vertex_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax`,
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
      { "Set-Cookie": "vertex_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax" },
    );
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
    const result = upsertOrderAndMaybeJob(store, normalized);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true, orderId: result.order.id, jobId: result.job?.id || null });
  }

  if (!currentUser) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  if (url.pathname === "/api/bootstrap" && req.method === "GET") {
    return sendJson(res, 200, {
      user: sanitizeUser(currentUser),
      jobs: store.jobs,
      orders: store.orders,
      shopifySettings: store.shopifySettings,
    });
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
      upsertOrderAndMaybeJob(store, order);
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname === "/api/orders/sync-shopify" && req.method === "POST") {
    try {
      const orders = await syncOrdersFromShopify(store);
      orders.forEach((order) => {
        upsertOrderAndMaybeJob(store, order);
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
    if (order.convertedJobId) {
      const existing = store.jobs.find((job) => job.id === order.convertedJobId);
      return sendJson(res, 200, { job: existing, order });
    }

    const job = jobFromOrder(order);
    order.convertedJobId = job.id;
    store.jobs.unshift(job);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { job, order });
  }

  if (url.pathname === "/api/settings/shopify" && req.method === "GET") {
    return sendJson(res, 200, store.shopifySettings);
  }

  if (url.pathname === "/api/settings/shopify" && req.method === "POST") {
    const body = await readBody(req);
    store.shopifySettings = {
      storeDomain: body.storeDomain || "",
      clientId: body.clientId || "",
      clientSecret: body.clientSecret || "",
      locationName: body.locationName || "",
      webhookBaseUrl: body.webhookBaseUrl || "",
      webhookEndpoint: store.shopifySettings?.webhookEndpoint || "",
      webhookSubscriptionId: store.shopifySettings?.webhookSubscriptionId || "",
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.shopifySettings);
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
