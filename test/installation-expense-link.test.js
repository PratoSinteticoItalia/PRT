import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {syncInstallationExpenses,computeProfitSplitScenario,normalizeProfitSplitExpenseLines} from '../lib/profit-split.js';
import {toNumber} from '../lib/order-money.js';
const expenses=[{id:'fuel',category:'fuel',amount:80,date:'2026-09-28',note:'Viaggio'},{id:'hotel',category:'hotel',amount:120,date:'2026-09-28'}];
const draft={revenue:'1000',expenseLines:[{id:'manual',label:'Materiali',amount:'100',payer:'owner'}]};
test('link expenses once, preserve manual rows and reconcile the full split',()=>{
 const linked=syncInstallationExpenses(draft,'order1',expenses);
 assert.equal(linked.expenseLines.length,3);
 assert.deepEqual(syncInstallationExpenses(linked,'order1',expenses),linked);
 const result=computeProfitSplitScenario(linked);
 assert.equal(result.partnerPaidExpenses,200);
 assert.equal(result.ownerPaidExpenses,100);
 assert.equal(result.divisibleProfit,700);
 assert.equal(result.reconciliationGap,0);
 assert.equal(draft.expenseLines.length,1);
});
test('source edits, additions, removals and payer override propagate without duplicates',()=>{
 const linked=syncInstallationExpenses(draft,'order1',expenses);
 linked.expenseLines[1].payer='owner';
 const updated=syncInstallationExpenses(linked,'order1',[{...expenses[0],amount:90},{id:'meal',amount:20,date:'2026-09-28'}]);
 assert.equal(updated.expenseLines.length,3);
 assert.equal(updated.expenseLines[1].amount,'90');
 assert.equal(updated.expenseLines[1].payer,'owner');
 assert.ok(!updated.expenseLines.some(l=>l.sourceExpenseId==='hotel'));
 assert.equal(syncInstallationExpenses(updated,'order1',[]).expenseLines.length,1);
});
test('source identifiers survive client and server normalization and serialization',()=>{
 const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 const start=source.indexOf('function normalizeProfitSplitExpenseLines('),end=source.indexOf('function normalizeCoveragePlanner(',start);
 const normalize=vm.runInNewContext(source.slice(start,end)+'\nnormalizeProfitSplitRecord',{toNumber,randomUUID});
 const linked=syncInstallationExpenses(draft,'order1',expenses);
 const stored=JSON.parse(JSON.stringify(normalize(linked)));
 assert.deepEqual(syncInstallationExpenses(stored,'order1',expenses).expenseLines,normalizeProfitSplitExpenseLines(linked.expenseLines));
});
test('invalid and duplicate source rows are ignored, legacy manual costs retained',()=>{
 const result=syncInstallationExpenses({ownerPaidExpenses:'25'},'one',[...expenses,expenses[0],{id:'bad',amount:-1},{id:'nan',amount:'not a number'}]);
 assert.equal(result.expenseLines.length,3);
 assert.equal(computeProfitSplitScenario(result).deductibleCosts,225);
});
test('linking another order never carries over source expenses or payer overrides',()=>{
 const linked=syncInstallationExpenses(draft,'one',expenses);
 linked.expenseLines[1].payer='owner';
 const next=syncInstallationExpenses(linked,'two',[expenses[0]]);
 assert.equal(next.expenseLines.length,2);
 assert.equal(next.expenseLines[1].payer,'partner');
 assert.equal(next.expenseLines[1].sourceOrderId,'two');
});
test('adding an empty manual row stays possible while source rows are synchronized',()=>{
 const linked=syncInstallationExpenses(draft,'one',expenses);
 linked.expenseLines.push({id:'new',label:'',amount:'',payer:'owner'});
 const next=syncInstallationExpenses(linked,'one',expenses);
 assert.ok(next.expenseLines.some(l=>l.id==='new'));
});
