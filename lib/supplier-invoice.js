// Conservative, layout-aware extraction. Output is a reviewable draft, never an accounting entry.
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const norm = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function invoiceNumber(value) {
  let text = clean(value).replace(/(?:EUR|€)/gi, '').replace(/\s/g, '');
  if (!/^-?\d[\d.,]*$/.test(text)) return null;
  if (text.includes(',') && text.includes('.')) text = text.lastIndexOf('.') > text.lastIndexOf(',') ? text.replace(/,/g, '') : text.replace(/\./g, '').replace(',', '.');
  else if (text.includes(',')) text = text.replace(',', '.');
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}
export function invoiceDate(value) {
  const english = String(value).match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (english) {
    const month = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(english[1].toLowerCase()) + 1;
    return invoiceDate(`${english[3]}-${String(month).padStart(2,'0')}-${english[2].padStart(2,'0')}`);
  }
  const m = String(value).match(/\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
  if (!m) return '';
  const y=m[1]||m[6], month=(m[2]||m[5]).padStart(2,'0'), day=(m[3]||m[4]).padStart(2,'0');
  const iso=`${y}-${month}-${day}`, d=new Date(iso+'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===iso ? iso : '';
}
export function invoiceUnit(value) {
  const v=norm(value).replace(/[.\s]/g,'');
  return ({'㎡':'mq',mq:'mq',m2:'mq','m²':'mq',mc:'mc',m3:'mc','m³':'mc',kg:'kg',pz:'pz',nr:'pz',n:'pz',pce:'pz',m:'metro',ml:'metro',mt:'metro',l:'litro',lt:'litro',rot:'rotolo',rotolo:'rotolo',conf:'confezione'})[v] || '';
}
export function groupInvoiceRows(items) {
  const rows=[];
  for(const item of items.filter(i=>clean(i.str)).sort((a,b)=>b.y-a.y||a.x-b.x)) {
    let row=rows.find(r=>Math.abs(r.y-item.y)<2.5);
    if(!row){row={y:item.y,items:[]};rows.push(row);}
    row.items.push(item);
  }
  return rows.map(r=>({...r,items:r.items.sort((a,b)=>a.x-b.x),text:r.items.map(i=>i.str).join(' ')}));
}
function columnKind(text) {
  const t=norm(text);
  if(/^(descrizione|descrizione articolo|description|materiale|articolo)$/.test(t))return 'material';
  if(/^(quantita|q[. ]?ta|qty|quantity)$/.test(t))return 'quantity';
  if(/^(u[. ]?m\.?|unita|unit)$/.test(t))return 'unit';
  if(/^(prezzo(?: unitario| unit\.?| netto)?|p\. ?unit\.?|unit price|price|prezzo €)$/.test(t))return 'unitPrice';
  if(/^(sconto|sc\.?|discount)$/.test(t))return 'discount';
  if(/^(importo|totale|total|iva|vat|codice|code)$/.test(t))return 'other';
  return '';
}
export function parseSupplierInvoice(pages, knownSuppliers=[]) {
  const allRows=pages.flatMap(p=>groupInvoiceRows(p));
  const text=allRows.map(r=>r.text).join('\n');
  const warnings=[];
  if(text.replace(/\s/g,'').length<30)return {supplierName:'',invoiceDate:'',invoiceNumber:'',lines:[],warnings:['Il PDF non contiene testo sufficiente. Potrebbe essere una scansione: serve OCR o compilazione manuale.'],textPreview:text.slice(0,16000)};
  let date='',number='',supplierName='';
  // Restrict dates to invoice labels; never pick due dates or DDT dates.
  for(let i=0;i<allRows.length;i++){
    const t=allRows[i].text;
    if(!date && /\b(?:data(?:\s+fattura|\s+documento)?|invoice date|date|fattura.*del)\b/i.test(t) && !/scadenza|ddt|trasporto/i.test(t)) date=invoiceDate(t);
    const pi=t.match(/\bPI\s+No\.?\s*:\s*([A-Z0-9][A-Z0-9/.-]*)/i);
    if (pi) number=pi[1];
    const n=t.match(/(?:fattura(?:\s+(?:elettronica|accompagnatoria))?|invoice)\s*(?:n(?:umero)?[.°º]?\s*|no\.?\s*|#\s*|:\s*)?([A-Z0-9][A-Z0-9/.-]*)/i);
    if(!number && n && /\d/.test(n[1]) && !invoiceDate(n[1]))number=n[1];
    const named=t.match(/^(?:fornitore|cedente(?:\/prestatore)?|supplier|seller)\s*:\s*(.+)/i);
    if(!supplierName && named)supplierName=clean(named[1]);
  }
  if(!supplierName){
    const top=allRows.slice(0,12).map(r=>r.text);
    const candidates=[...new Set(knownSuppliers.map(clean).filter(Boolean))].filter(name=>top.some(t=>norm(t)===norm(name)));
    if(candidates.length===1)supplierName=candidates[0];
    else {
      const legal=top.filter(t=>/\b(?:s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?)\b/i.test(t) && !/^(?:add|address|via)\b|cliente|destinatario|cessionario|spett|prato sintetico italia|vertex/i.test(t));
      if(legal.length===1)supplierName=clean(legal[0]);
    }
  }
  const lines=[];
  for(const page of pages){
    let columns=null;
    for(const row of groupInvoiceRows(page)){
      const header=[];
      for (const item of row.items) {
        const previous=header.at(-1);
        if(previous && !columnKind(item.str) && columnKind(previous.str+' '+item.str)) {
          previous.str+=' '+item.str;
          previous.kind=columnKind(previous.str);
        } else header.push({...item,kind:columnKind(item.str)});
      }
      if(header.some(i=>i.kind==='material') && header.some(i=>i.kind==='unitPrice')){
        // Unknown columns are boundaries too: never merge VAT/total into unit price.
        columns=header;continue;
      }
      if(!columns)continue;
      if(/^(totale|imponibile|riepilogo|pagamento|scadenza|iban|total)\b/i.test(clean(row.text))){columns=null;continue;}
      const cells={};
      for(const item of row.items){
        // Match the column containing the text centre; handles right-aligned amounts.
        const center=item.x+(item.width||0)/2;
        let col=columns[0];
        for(const next of columns){if(center>=next.x-5)col=next;}
        if(col.kind)cells[col.kind]=clean((cells[col.kind]||'')+' '+item.str);
      }
      const price=invoiceNumber(cells.unitPrice),quantity=invoiceNumber(cells.quantity);
      if(!cells.material || price===null)continue;
      if(price<=0){warnings.push('Una riga con prezzo nullo o negativo non è importabile nel listino: verificarla nel PDF.');continue;}
      if(cells.discount && invoiceNumber(cells.discount.replace('%',''))!==0){warnings.push('Sono presenti sconti: verificare il prezzo unitario netto delle righe.');}
      const unit=invoiceUnit(cells.unit);
      lines.push({material:clean(cells.material).slice(0,300),unitPrice:price,quantity:quantity>0?quantity:'',unit,page:pages.indexOf(page)+1});
      if(lines.length>=200)break;
    }
  }
  // Some international proformas use tall product blocks, with the amounts centred
  // beside technical specifications rather than on the product-name baseline.
  if (!lines.length && /NAME OF COMMODITY AND SPECIFICATION/i.test(text)) {
    for (let pageIndex=0; pageIndex<pages.length; pageIndex++) {
      const pageText=groupInvoiceRows(pages[pageIndex]).map(r=>r.text).join('\n');
      const blocks=pageText.split(/(?:^|\n)Name:\s*/i).slice(1);
      for (const block of blocks) {
        const material=clean(block.split('\n')[0]);
        const amount=block.match(/(?:^|\s)([\d.,]+)\s*(㎡|M2|m²)\s+([\d.,]+)\s*€\s+([\d.,]+)\s*€/);
        if (!amount) { warnings.push('Un prodotto della proforma non ha importi riconoscibili: confrontare tutte le righe con il PDF.'); continue; }
        const quantity=invoiceNumber(amount[1]), unitPrice=invoiceNumber(amount[3]), total=invoiceNumber(amount[4]);
        if (!(quantity>0 && unitPrice>0 && total>0) || Math.abs(quantity*unitPrice-total)>0.02) {
          warnings.push('Una riga della proforma presenta importi non coerenti: inserirla manualmente.'); continue;
        }
        lines.push({material,quantity,unitPrice,unit:'mq',page:pageIndex+1});
      }
    }
  }
  if (/\b(?:proforma|PI No)/i.test(text)) warnings.push('Documento proforma: verificare che debba essere registrato come documento di acquisto.');
  if (/EURO|€/i.test(text) && /prices.*(?:dollar|dollor|USD)/i.test(text)) warnings.push('Valuta discordante: tabella in euro, condizioni in dollari. Confermare la valuta con il fornitore prima di salvare.');
  if(!supplierName)warnings.push('Fornitore non riconosciuto: selezionalo o inseriscilo.');
  if(!date)warnings.push('Data fattura non riconosciuta.');
  if(!number)warnings.push('Numero fattura non riconosciuto.');
  if(!lines.length)warnings.push('Tabella materiali non riconosciuta: inserire le righe confrontando il PDF.');
  if(lines.some(l=>!l.unit))warnings.push('Alcune unità di misura non sono riconosciute: selezionarle prima di salvare.');
  warnings.unshift('Bozza estratta dal PDF: controllare fornitore, data, quantità e prezzi unitari prima del salvataggio.');
  return {supplierName,invoiceDate:date,invoiceNumber:number,lines,warnings:[...new Set(warnings)],textPreview:text.slice(0,16000)};
}
