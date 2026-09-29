import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSupplierProduct as convert} from '../lib/supplier-product-units.js';
test('band is one roll, not square metres; fabric is linear metres',()=>{
 const band=convert({material:'Tessuto non Tessuto - Altezza cm 25 - Rotoli da 25 mtl',unit:'pz',quantity:250,unitPrice:4.65}).line;
 assert.equal(band.unit,'rotolo');assert.equal(band.unitPrice,4.65);
 const fabric=convert({material:'Telo isolante Rotoli da 50 mtl',unit:'rotolo',quantity:2,unitPrice:100}).line;
 assert.equal(fabric.unit,'metro');assert.equal(fabric.unitPrice,2);assert.equal(fabric.quantity,100);
});
test('pieces and kilograms preserve purchase amount; unknown conversion is explicit',()=>{
 const pins=convert({material:'Picchetti — Totale pz = 15.000',unit:'confezione',quantity:150,unitPrice:6.38}).line;
 assert.equal(pins.unit,'pz');assert.equal(pins.quantity,15000);assert.equal(pins.unitPrice,.0638);
 const glue=convert({material:'TOVCOL B KG. 0,5',unit:'pz',quantity:72,unitPrice:1.08}).line;
 assert.equal(glue.unitPrice,2.16);assert.equal(glue.quantity,36);
 const unknown=convert({material:'Picchetti',unit:'confezione',quantity:1,unitPrice:10});
 assert.equal(unknown.line.unit,'confezione');assert.match(unknown.message,/manca/);
});
