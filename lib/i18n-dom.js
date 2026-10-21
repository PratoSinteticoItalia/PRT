// Traduzione dell'interfaccia sullo schermo (ottobre 2026): sostituisce le
// frasi italiane con il catalogo di lib/i18n-en.js mentre compaiono
// (MutationObserver), su testi, segnaposto, title e aria-label. Usato dall'app
// e dal Garden Planner. stop() rimette i testi originali.
//
// Le parti con [data-no-i18n] o .notranslate non vengono mai toccate: servono
// per i documenti che finiscono al cliente (es. il report del Garden Planner
// allegato al preventivo), che devono restare in italiano.

const ATTRS = ["placeholder", "title", "aria-label"];
const TEXT_SKIP_SELECTOR = "script, style, textarea, code, pre, [contenteditable='true'], .notranslate, [data-no-i18n]";
// Per segnaposto e title vale lo stesso elenco, ma il segnaposto di una
// textarea va tradotto (il testo scritto dentro no).
const ATTR_SKIP_SELECTOR = "script, style, code, pre, [contenteditable='true'], .notranslate, [data-no-i18n]";
const MAX_REMEMBERED = 20000;

export function createDomTranslator(translate) {
  const originalText = new Map();
  const originalAttrs = new Map();
  // Ultimo testo inglese scritto: la modifica fatta da noi rientra
  // nell'observer e non va ritradotta.
  const writtenText = new WeakMap();
  let observer = null;

  function translateTextNode(node) {
    const raw = node.nodeValue;
    if (!raw || !/[A-Za-zÀ-ÿ]/.test(raw) || writtenText.get(node) === raw) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(TEXT_SKIP_SELECTOR)) return;
    const trimmed = raw.trim();
    const translated = translate(trimmed);
    if (translated == null || translated === trimmed) return;
    // Sempre l'ultimo testo italiano: React o i render possono averlo cambiato.
    if (originalText.has(node) || originalText.size < MAX_REMEMBERED) originalText.set(node, raw);
    const next = raw.replace(trimmed, translated);
    writtenText.set(node, next);
    node.nodeValue = next;
  }

  function translateAttr(element, attr) {
    const value = element.getAttribute(attr);
    if (!value || element.closest(ATTR_SKIP_SELECTOR)) return;
    const translated = translate(value);
    if (translated == null || translated === value) return;
    const saved = originalAttrs.get(element);
    if (saved) saved[attr] = value;
    else if (originalAttrs.size < MAX_REMEMBERED) originalAttrs.set(element, { [attr]: value });
    element.setAttribute(attr, translated);
  }

  function translateSubtree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    ATTRS.forEach((attr) => { if (root.hasAttribute(attr)) translateAttr(root, attr); });
    root.querySelectorAll(ATTRS.map((attr) => `[${attr}]`).join(",")).forEach((element) => {
      ATTRS.forEach((attr) => { if (element.hasAttribute(attr)) translateAttr(element, attr); });
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateTextNode(walker.currentNode);
  }

  function restore() {
    originalText.forEach((original, node) => { if (node.isConnected) node.nodeValue = original; });
    originalAttrs.forEach((attrs, element) => {
      if (!element.isConnected) return;
      Object.entries(attrs).forEach(([attr, value]) => element.setAttribute(attr, value));
    });
    originalText.clear();
    originalAttrs.clear();
  }

  return {
    start(root = document.body) {
      if (!observer) {
        observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "childList") mutation.addedNodes.forEach((node) => translateSubtree(node));
            else if (mutation.type === "characterData") translateTextNode(mutation.target);
            else if (mutation.type === "attributes") translateAttr(mutation.target, mutation.attributeName);
          });
        });
        observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      }
      translateSubtree(root);
    },
    stop() {
      observer?.disconnect();
      observer = null;
      restore();
    },
  };
}
