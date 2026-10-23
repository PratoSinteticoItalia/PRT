// Pagina pubblica di un preventivo (ottobre 2026): quella che il cliente apre
// dal link ricevuto su WhatsApp. Logo, numero, a chi è intestato, validità e
// il PDF da aprire o scaricare (sul computer anche sfogliabile nella pagina).
// I tag og: danno l'anteprima del link su WhatsApp ("Preventivo F-2026-2569 ·
// Prato Sintetico Italia"). Niente prezzi qui: stanno nel PDF.

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export function formatQuotePageDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const PAGE_STYLE = `
  :root { --brand: #2d6a4f; --brand-dark: #1b4332; --brand-soft: #e3f1e7; --text: #18231c; --muted: #66716a; --line: #e2e7e3; --bg: #f5f7f5; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { min-height: 100dvh; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .top { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: #fff; border-bottom: 1px solid var(--line); }
  .top img { width: 46px; height: auto; }
  .top strong { font-size: 15px; letter-spacing: .01em; }
  main { width: min(860px, 100%); margin: 0 auto; padding: 22px 16px 40px; }
  .card { padding: 22px 20px; border: 1px solid var(--line); border-radius: 16px; background: #fff; box-shadow: 0 2px 10px rgba(20, 40, 28, .05); }
  .eyebrow { color: var(--brand); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin-top: 4px; font-size: 28px; line-height: 1.15; letter-spacing: -.01em; }
  .for { margin-top: 6px; color: var(--muted); font-size: 15px; }
  .for strong { color: var(--text); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .chip { padding: 4px 10px; border-radius: 999px; background: var(--brand-soft); color: var(--brand-dark); font-size: 13px; font-weight: 600; }
  .summary { margin-top: 12px; color: var(--text); font-size: 14.5px; }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
  .button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 12px 20px; border: 1px solid var(--brand); border-radius: 12px; background: var(--brand); color: #fff; font-size: 15.5px; font-weight: 650; text-decoration: none; }
  .button.secondary { background: #fff; color: var(--brand-dark); border-color: #c9d8cd; }
  .viewer { display: none; margin-top: 18px; overflow: hidden; border: 1px solid var(--line); border-radius: 16px; background: #fff; }
  .viewer iframe { display: block; width: 100%; height: 80vh; border: 0; }
  .foot { margin-top: 18px; color: var(--muted); font-size: 12.5px; text-align: center; }
  .foot a { color: var(--brand-dark); }
  @media (max-width: 560px) { .actions .button { flex: 1 1 100%; } h1 { font-size: 25px; } }
  @media (min-width: 760px) { .viewer { display: block; } }
`;

function pageShell({ title, head = "", body }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex,nofollow" />
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/pwa-icon-512.png" />
${head}
<style>${PAGE_STYLE}</style>
</head>
<body>
<header class="top"><img src="/logo-prato.png" alt="" /><strong>Prato Sintetico Italia</strong></header>
<main>${body}</main>
</body>
</html>`;
}

// quote: { label, customerName, customerCity, createdAt, validUntil, quoteType, sqm, summary, expiresAt }
// links: { page, pdf, download, image } (assoluti, per l'anteprima di WhatsApp)
export function renderQuotePublicPage(quote = {}, links = {}) {
  const label = quote.label || "";
  const title = `Preventivo ${label} · Prato Sintetico Italia`;
  const customer = String(quote.customerName || "").trim();
  const description = `Il preventivo per il tuo prato sintetico${customer ? `, ${customer}` : ""}: aprilo o scaricalo in PDF.`;
  const chips = [
    quote.quoteType === "posa" ? "Fornitura e posa" : quote.quoteType === "fornitura" ? "Fornitura" : "",
    Number(quote.sqm) > 0 ? `${String(Math.round(Number(quote.sqm) * 100) / 100).replace(".", ",")} m²` : "",
    quote.validUntil ? `Valido fino al ${formatQuotePageDate(quote.validUntil)}` : "",
  ].filter(Boolean);
  const head = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Prato Sintetico Italia" />`,
    `<meta property="og:title" content="${escapeHtml(`Preventivo ${label}`)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    links.page ? `<meta property="og:url" content="${escapeHtml(links.page)}" />` : "",
    links.image ? `<meta property="og:image" content="${escapeHtml(links.image)}" />` : "",
    `<meta name="description" content="${escapeHtml(description)}" />`,
  ].filter(Boolean).join("\n");
  const body = `
  <section class="card">
    <p class="eyebrow">Preventivo</p>
    <h1>${escapeHtml(label)}</h1>
    <p class="for">${customer ? `Per <strong>${escapeHtml(customer)}</strong>` : ""}${quote.customerCity ? `${customer ? " · " : ""}${escapeHtml(quote.customerCity)}` : ""}${quote.createdAt ? `${customer || quote.customerCity ? " · " : ""}del ${formatQuotePageDate(quote.createdAt)}` : ""}</p>
    ${chips.length ? `<div class="chips">${chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("")}</div>` : ""}
    ${quote.summary ? `<p class="summary">${escapeHtml(quote.summary)}</p>` : ""}
    <div class="actions">
      <a class="button" href="${escapeHtml(links.pdf || "")}" target="_blank" rel="noopener">Apri il preventivo (PDF)</a>
      <a class="button secondary" href="${escapeHtml(links.download || "")}">Scarica</a>
    </div>
  </section>
  <section class="viewer" aria-label="Anteprima del preventivo"><iframe src="${escapeHtml(links.pdf || "")}#view=FitH" title="Preventivo ${escapeHtml(label)}" loading="lazy"></iframe></section>
  <p class="foot">Link personale${quote.expiresAt ? `, valido fino al ${formatQuotePageDate(quote.expiresAt)}` : ""} · <a href="https://www.pratosinteticoitalia.com" rel="noopener">pratosinteticoitalia.com</a></p>`;
  return pageShell({ title, head, body });
}

export function renderQuoteLinkErrorPage() {
  return pageShell({
    title: "Link non disponibile · Prato Sintetico Italia",
    body: `
  <section class="card">
    <p class="eyebrow">Preventivo</p>
    <h1>Link non disponibile</h1>
    <p class="for">Il link è scaduto o non è corretto. Scrivici e ti mandiamo di nuovo il preventivo.</p>
    <div class="actions"><a class="button secondary" href="https://www.pratosinteticoitalia.com" rel="noopener">Vai al sito</a></div>
  </section>`,
  });
}
