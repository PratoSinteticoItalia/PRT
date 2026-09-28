import {Worker} from 'node:worker_threads';
export function extractSupplierInvoice(bytes,suppliers=[]) {
  if(bytes.length>8_000_000) return Promise.reject(new Error('pdf_too_large'));
  if(bytes.subarray(0,5).toString()!=='%PDF-')return Promise.reject(new Error('invalid_pdf'));
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./supplier-invoice-worker.js',import.meta.url),{
      workerData:{bytes,suppliers},resourceLimits:{maxOldGenerationSizeMb:192},
    });
    let finished=false;
    const finish=(error,result)=>{
      if(finished)return;finished=true;clearTimeout(timer);void worker.terminate();
      if(error)reject(error);else resolve(result);
    };
    const timer=setTimeout(()=>finish(new Error('pdf_timeout')),20000);
    worker.once('message',msg=>finish(msg.error?new Error(msg.error):null,msg.result));
    worker.once('error',()=>finish(new Error('invalid_pdf')));
    worker.once('exit',()=>{if(!finished)finish(new Error('invalid_pdf'));});
  });
}
