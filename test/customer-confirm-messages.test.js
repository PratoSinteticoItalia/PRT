import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const slice = (from, to) => app.slice(app.indexOf(from), app.indexOf(to, app.indexOf(from)));
const code = [
  slice('function formatCustomerAppointmentDate(', 'function openCustomerWhatsApp('),
].join('\n');
const context = {
  state: { lang: 'it' },
  composeAddress: (order) => [order.address, order.city].filter(Boolean).join(', '),
  composeClientName: (order) => `${order.firstName} ${order.lastName}`,
};
vm.runInNewContext(code, context);

test('conferma sopralluogo: giorno della settimana, ora e indirizzo, nome con la maiuscola', () => {
  const text = context.buildSurveyConfirmMessage({ customerName: 'laura bianchi', scheduledDate: '2026-10-28', scheduledTime: '09:30', address: 'Via dei Pini 12', city: 'Anguillara' });
  assert.match(text, /^Ciao Laura, ti confermiamo il sopralluogo per il prato sintetico mercoledì 28 ottobre alle 09:30 in Via dei Pini 12, Anguillara\./);
  assert.match(text, /Prato Sintetico Italia$/);
});

test('conferma posa: data, indirizzo e link per seguire il cantiere', () => {
  const order = { firstName: 'Mario', lastName: 'Rossi', address: 'Via Roma 1', city: 'Latina', operations: { installation: { installDate: '2026-10-29', installTime: '08:30' } } };
  const text = context.buildInstallationConfirmMessage(order, 'https://portale.example.it/track/abc');
  assert.match(text, /Ciao Mario, ti confermiamo la posa del tuo prato sintetico per giovedì 29 ottobre alle 08:30 in Via Roma 1, Latina\./);
  assert.match(text, /Puoi seguire il cantiere qui: https:\/\/portale\.example\.it\/track\/abc/);
  assert.doesNotMatch(context.buildInstallationConfirmMessage(order, ''), /seguire il cantiere/);
});

test('senza ora né indirizzo il messaggio resta corretto', () => {
  const text = context.buildSurveyConfirmMessage({ customerName: 'Studio Verde', scheduledDate: '2026-11-02' });
  assert.match(text, /^Ciao, ti confermiamo il sopralluogo per il prato sintetico lunedì 2 novembre\./);
});
