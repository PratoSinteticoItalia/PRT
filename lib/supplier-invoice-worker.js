import {parentPort,workerData} from 'node:worker_threads';
import {parseSupplierInvoice} from './supplier-invoice.js';
let doc;
try {
  const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loading=getDocument({data:new Uint8Array(workerData.bytes),isEvalSupported:false,useSystemFonts:false,verbosity:0});
  doc=await loading.promise;
  if(doc.numPages>20)throw new Error('too_many_pages');
  const pages=[];
  for(let i=1;i<=doc.numPages;i++){
    const page=await doc.getPage(i);
    const content=await page.getTextContent();
    if(content.items.length>20000)throw new Error('pdf_too_complex');
    pages.push(content.items.filter(v=>typeof v.str==='string').map(v=>({str:v.str,x:v.transform[4],y:v.transform[5],width:v.width})));
    page.cleanup();
  }
  parentPort.postMessage({result:parseSupplierInvoice(pages,workerData.suppliers)});
} catch(error) {
  const allowed=['too_many_pages','pdf_too_complex'];
  parentPort.postMessage({error:error?.name==='PasswordException'?'pdf_password':allowed.includes(error?.message)?error.message:'invalid_pdf'});
} finally { if(doc)await doc.destroy(); }
