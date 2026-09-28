import {test} from 'node:test';
import assert from 'node:assert/strict';
import PDFDocument from 'pdfkit';
import {parseSupplierInvoice,invoiceNumber,invoiceDate} from '../lib/supplier-invoice.js';
import {extractSupplierInvoice} from '../lib/supplier-invoice-extract.js';
const cell=(str,x,y,width=40)=>({str,x,y,width});
const page=[cell('Demo Garden SRL',40,780),cell('Fattura n. 12/2026 del 28/09/2026',40,750,250),
 ...['Descrizione','Q.tà','U.M.','Prezzo unitario','Importo'].map((t,i)=>cell(t,[40,290,340,390,490][i],700)),
 ...['Prato 40 mm','20','mq','12,50','250,00'].map((t,i)=>cell(t,[40,290,340,410,500][i],670)),
 ...['Colla','2','kg','9,00','18,00'].map((t,i)=>cell(t,[40,290,340,410,500][i],640)),cell('Totale documento 326,96',40,600,200)];
test('invoice: extract labelled fields and columns, never use row total as unit price',()=>{
 const result=parseSupplierInvoice([page]);
 assert.equal(result.supplierName,'Demo Garden SRL');
 assert.equal(result.invoiceDate,'2026-09-28');
 assert.equal(result.invoiceNumber,'12/2026');
 assert.deepEqual(result.lines.map(l=>[l.material,l.quantity,l.unit,l.unitPrice]),[['Prato 40 mm',20,'mq',12.5],['Colla',2,'kg',9]]);
});
test('invoice: Italian amounts, dates and invalid calendar dates',()=>{
 assert.equal(invoiceNumber('1.234,56 €'),1234.56);
 assert.equal(invoiceNumber('12.50'),12.5);
 assert.equal(invoiceNumber('EUR 9,25'),9.25);
 assert.equal(invoiceNumber('12,50 22%'),null);
 assert.equal(invoiceDate('31/02/2026'),'');
 assert.equal(invoiceDate('2026-09-28'),'2026-09-28');
});
test('invoice: ambiguous supplier and scans do not invent fields',()=>{
 const result=parseSupplierInvoice([[cell('Fattura commerciale',0,700),cell('Scadenza 30/10/2026',0,650),cell('IBAN IT000000000000000000',0,600)]]);
 assert.equal(result.supplierName,'');assert.equal(result.invoiceDate,'');assert.equal(result.lines.length,0);
 assert.match(parseSupplierInvoice([[]]).warnings[0],/OCR/);
});
test('invoice: each page repeats headers, unknown units stay blank, source discounts flagged',()=>{
 const second=[cell('Descrizione',40,700),cell('Q.tà',290,700),cell('U.M.',340,700),cell('Prezzo',390,700),cell('Sconto',450,700),cell('Importo',510,700),cell('Accessorio',40,650),cell('1',290,650),cell('BOX',340,650),cell('10,00',390,650),cell('5%',450,650),cell('9,50',510,650)];
 const result=parseSupplierInvoice([page,second]);
 assert.equal(result.lines.length,3);assert.equal(result.lines[2].unit,'');assert.equal(result.lines[2].page,2);
 assert.ok(result.warnings.some(w=>w.includes('sconti')));
});
function pdfBuffer({blank=false,pages=1,password=false}={}) {
 return new Promise(resolve=>{
  const pdf=new PDFDocument({size:'A4',...(password?{userPassword:'test-only'}:{})}),chunks=[];
  pdf.on('data',c=>chunks.push(c));pdf.on('end',()=>resolve(Buffer.concat(chunks)));
  if(!blank){pdf.fontSize(10);for(const item of page)pdf.text(item.str,item.x,842-item.y,{lineBreak:false});}
  for(let i=1;i<pages;i++)pdf.addPage();
  pdf.end();
 });
}
test('invoice: real PDF extraction in isolated worker',async()=>{
 const result=await extractSupplierInvoice(await pdfBuffer());
 assert.equal(result.invoiceNumber,'12/2026');assert.equal(result.lines.length,2);assert.equal(result.lines[0].unitPrice,12.5);
});
test('invoice: corrupt, oversized, password-protected and long PDFs fail cleanly',async()=>{
 await assert.rejects(extractSupplierInvoice(Buffer.from('not a pdf')),/invalid_pdf/);
 await assert.rejects(extractSupplierInvoice(Buffer.alloc(8_000_001)),/pdf_too_large/);
 await assert.rejects(extractSupplierInvoice(await pdfBuffer({password:true})),/pdf_password/);
 await assert.rejects(extractSupplierInvoice(await pdfBuffer({blank:true,pages:21})),/too_many_pages/);
 const scan=await extractSupplierInvoice(await pdfBuffer({blank:true}));assert.match(scan.warnings[0],/OCR/);
});
test('invoice: split price header does not create a false column',()=>{
 const split=page.map(c=>c.str==='Prezzo unitario'?{...c,str:'Prezzo'}:c);
 split.push(cell('unitario',425,700));
 const result=parseSupplierInvoice([split]);
 assert.equal(result.lines.length,2);assert.equal(result.lines[0].unitPrice,12.5);
});

test('international proforma blocks span pages and exclude deposits from products', () => {
  const page = lines => lines.map((str,i)=>({str,x:10,y:800-i*20,width:400}));
  const result=parseSupplierInvoice([
    page(['SELLER: Example Grass Ltd','PI No.: TEST-123','PLACE: City DATE: March 20, 2026','NAME OF COMMODITY AND SPECIFICATION','Name: Grass A','Item No.: ABC','DTEX: 6000 1040.00 ㎡ 2.08 € 2,163.20 €']),
    page(['Name: Grass B','Pile Height: 30mm','500.00 M2 5.70 € 2,850.00 €','Total EURO 5013.20 €','Deposit 1002.64 €','All prices quoted herein are in Dollor.'])
  ]);
  assert.equal(result.supplierName,'Example Grass Ltd');
  assert.equal(result.invoiceDate,'2026-03-20');
  assert.equal(result.invoiceNumber,'TEST-123');
  assert.equal(result.lines.length,2);
  assert.deepEqual(result.lines[0],{material:'Grass A',quantity:1040,unitPrice:2.08,unit:'mq',page:1});
  assert.equal(result.lines[1].page,2);
  assert.ok(result.warnings.some(w=>w.includes('Valuta discordante')));
});

test('proforma rejects inconsistent amounts and never treats address snc as supplier', () => {
  const rows=['Add: Via Test, snc, Italy','NAME OF COMMODITY AND SPECIFICATION','Name: Grass A','100.00 M2 2.00 € 900.00 €'].map((str,i)=>({str,x:10,y:800-i*20,width:400}));
  const result=parseSupplierInvoice([rows]);
  assert.equal(result.supplierName,'');
  assert.equal(result.lines.length,0);
  assert.ok(result.warnings.some(w=>w.includes('non coerenti')));
  assert.equal(invoiceNumber('33,643.20'),33643.2);
  assert.equal(invoiceNumber('33.643,20'),33643.2);
  assert.equal(invoiceDate('February 30, 2026'),'');
});
