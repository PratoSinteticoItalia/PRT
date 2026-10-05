// Registro gestionale: importi in centesimi, operazioni esplicite e chiusure versionate.
export function registerState(value = {}) {
  return { revision: Number(value.revision) || 0, payouts: Array.isArray(value.payouts) ? value.payouts : [], entries: Array.isArray(value.entries) ? value.entries : [], periods: value.periods || {}, audit: Array.isArray(value.audit) ? value.audit : [] };
}
function fail(message) { throw new Error(message); }
function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s; }
export function registerEntry(raw, id) {
  const date = String(raw.date || '');
  const amount = Number(raw.amount);
  if (!validDate(date) || !Number.isFinite(amount) || amount <= 0 || amount > 1e9) fail('Data o importo non valido');
  const label = String(raw.label || '').trim().slice(0,240);
  if (!label) fail('Descrizione obbligatoria');
  if (!['income','expense','refund'].includes(raw.type)) fail('Tipo non valido');
  const document = String(raw.document || 'pending');
  if (!['pending','receipt','invoice','other'].includes(document)) fail('Documento non valido');
  const vatRate = raw.vatRate === '' || raw.vatRate == null ? null : Number(raw.vatRate);
  if (vatRate !== null && ![0,4,5,10,22].includes(vatRate)) fail('Aliquota non valida');
  const cents = Math.round(amount * 100);
  const verified = raw.verified === true;
  if (verified && (document === 'pending' || vatRate === null || !String(raw.reference || '').trim())) fail('Per verificare servono documento, riferimento e aliquota');
  return { id, date, fiscalDate: raw.fiscalDate ? String(raw.fiscalDate) : date, label, cents, type: raw.type, document, vatRate, verified,
    method: String(raw.method || '').slice(0,80), reference: String(raw.reference || '').slice(0,120), orderId: String(raw.orderId || '').slice(0,120) };
}
export function receiptSummary(entries) {
  const groups = new Map();
  for (const e of entries) {
    if (!e.verified || e.document !== 'receipt' || !['income','refund'].includes(e.type)) continue;
    const key = `${e.fiscalDate}|${e.vatRate}`, sign = e.type === 'refund' ? -1 : 1;
    const net = Math.round(e.cents / (1 + e.vatRate / 100));
    const row = groups.get(key) || { date:e.fiscalDate, rate:e.vatRate, gross:0, net:0, tax:0, count:0 };
    row.gross += sign*e.cents; row.net += sign*net; row.tax += sign*(e.cents-net); row.count++;
    groups.set(key,row);
  }
  return [...groups.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.rate-b.rate);
}
export function mutateRegister(value, command, actor, now, id) {
  const next = structuredClone(registerState(value));
  if (command.revision !== next.revision) fail('Dati aggiornati da un altro operatore. Ricarica prima di salvare.');
  const action = command.action;
  if (action === 'payout') {
    const p = command.payout || {};
    const date = String(p.date || '');
    if (!validDate(date) || next.periods[date.slice(0,7)]?.closed) fail('Data non valida o mese chiuso');
    const amounts = ['gross','refund','fees','bank'].map(k=>Number(p[k]));
    if(amounts.some(n=>!Number.isFinite(n)||n<0||n>1e9)) fail('Importi accredito non validi');
    const [gross,refund,fees,bank]=amounts.map(n=>Math.round(n*100));
    if(gross-refund-fees<0 || Math.abs(gross-refund-fees-bank)>1) fail('Il netto non coincide con il movimento bancario');
    const reference=String(p.reference||'').trim().slice(0,120);
    if(!reference || next.payouts.some(x=>x.reference===reference)) fail('Riferimento mancante o già registrato');
    const orderIds=Array.isArray(p.orderIds)?[...new Set(p.orderIds.map(String))]:[];
    if(!orderIds.length) fail('Collega almeno un ordine');
    const payout={id,date,reference,orderIds,gross,refund,fees,bank,at:now,actor};
    next.payouts.push(payout);
    next.audit.push({at:now,actor,action,after:payout});
  } else if (action === 'entry') {
    const previous = command.entry.id ? next.entries.find(e=>e.id===command.entry.id) : null;
    if (command.entry.id && !previous) fail('Movimento non trovato');
    const entry = registerEntry(command.entry, previous?.id || id);
    if (!validDate(entry.fiscalDate)) fail('Data registrazione non valida');
    // Una sola competenza mensile nella prima versione: evita chiusure ambigue.
    if (entry.date.slice(0,7)!==entry.fiscalDate.slice(0,7)) fail('Date in mesi diversi: richiede verifica contabile esterna');
    for (const e of [previous,entry].filter(Boolean)) if(next.periods[e.fiscalDate.slice(0,7)]?.closed) fail('Mese chiuso: riaprilo prima di modificare');
    next.entries = previous ? next.entries.map(e=>e.id===entry.id?entry:e) : [...next.entries,entry];
    next.audit.push({at:now,actor,action,entryId:entry.id,before:previous,after:entry});
  } else if (action === 'close' || action === 'reopen') {
    const month = String(command.month || '');
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) fail('Mese non valido');
    const current=next.periods[month];
    if(action==='close') {
      if(current?.closed) fail('Mese già chiuso');
      const entries=next.entries.filter(e=>e.fiscalDate.startsWith(month));
      if(!entries.length || entries.some(e=>!e.verified)) fail('Verifica tutti i movimenti prima di chiudere');
      next.periods[month]={closed:true,at:now,actor,entries:structuredClone(entries),payouts:structuredClone(next.payouts.filter(p=>p.date.startsWith(month)))};
    } else {
      if(!current?.closed || !String(command.reason || '').trim()) fail('Indica il motivo della riapertura');
      next.periods[month]={...current,closed:false};
    }
    next.audit.push({at:now,actor,action,month,reason:String(command.reason||'').slice(0,300),snapshot:current || null});
  } else fail('Azione non valida');
  next.revision++;
  return next;
}
export function registerCSV(rows) {
  return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,c=>"'"+c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
}
