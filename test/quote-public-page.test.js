import test from 'node:test';
import assert from 'node:assert/strict';
import { formatQuotePageDate, renderQuoteLinkErrorPage, renderQuotePublicPage, tidyQuotePageName } from '../lib/quote-public-page.js';

const links = {
  page: 'https://preventivi.example.it/F-2026-1/abc',
  pdf: 'https://preventivi.example.it/F-2026-1/abc/Preventivo-F-2026-1.pdf',
  download: 'https://preventivi.example.it/F-2026-1/abc/Preventivo-F-2026-1.pdf?scarica=1',
  image: 'https://preventivi.example.it/pwa-icon-512.png',
};

test('pagina preventivo: anteprima WhatsApp, cliente, validità e link al PDF', () => {
  const html = renderQuotePublicPage({
    label: 'F-2026-1', customerName: 'Mario Rossi', customerCity: 'Roma', createdAt: '2026-10-23T10:00:00Z',
    validUntil: '2026-11-22', quoteType: 'posa', sqm: 60, summary: 'Cedro 30 mm · 60 mq',
  }, links);
  assert.match(html, /<meta property="og:title" content="Preventivo F-2026-1" \/>/);
  assert.match(html, /og:image" content="https:\/\/preventivi\.example\.it\/pwa-icon-512\.png"/);
  assert.match(html, /Per <strong>Mario Rossi<\/strong> · Roma · del 23 ott 2026/);
  assert.match(html, /Fornitura e posa/);
  assert.match(html, /60 m²/);
  assert.match(html, /Valido fino al 22 nov 2026/);
  assert.match(html, /href="https:\/\/preventivi\.example\.it\/F-2026-1\/abc\/Preventivo-F-2026-1\.pdf\?scarica=1"/);
  assert.match(html, /noindex/);
  assert.doesNotMatch(html, /portale/i);
});

test('pagina preventivo: i testi del cliente non possono iniettare HTML', () => {
  const html = renderQuotePublicPage({ label: 'F-1', customerName: '<script>alert(1)</script>', summary: '"><img src=x>' }, links);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /"><img src=x>/);
  assert.match(html, /&lt;script&gt;/);
});

test('link scaduto o sbagliato: pagina gentile, senza dati', () => {
  const html = renderQuoteLinkErrorPage();
  assert.match(html, /Link non disponibile/);
  assert.doesNotMatch(html, /og:title/);
});

test('date in italiano, valori vuoti o sbagliati senza errori', () => {
  assert.equal(formatQuotePageDate('2026-01-05'), '5 gen 2026');
  assert.equal(formatQuotePageDate(''), '');
  assert.equal(formatQuotePageDate('non una data'), '');
});

test('nomi in minuscolo con le iniziali maiuscole, m² non ripetuti nel riepilogo', () => {
  assert.equal(tidyQuotePageName('gabriele todaro'), 'Gabriele Todaro');
  assert.equal(tidyQuotePageName("d'angelo maria-rosa"), "D'Angelo Maria-Rosa");
  assert.equal(tidyQuotePageName('Studio Verde srl'), 'Studio Verde srl');
  const html = renderQuotePublicPage({ label: 'F-1', customerName: 'gabriele todaro', customerCity: 'napoli', sqm: 45, summary: 'Betulla 30 mm · 45 mq' }, links);
  assert.match(html, /Per <strong>Gabriele Todaro<\/strong> · Napoli/);
  assert.match(html, /<p class="summary">Betulla 30 mm<\/p>/);
});
