import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateAbsenceInput} from '../lib/timesheet-absence.js';
import {buildTimesheetCsv} from '../lib/timesheet-export.js';
test('assenze: date reali e orari completi per i permessi',()=>{
 assert.ok(validateAbsenceInput({date:'2026-02-30',type:'sick'}));
 assert.ok(validateAbsenceInput({date:'2026-10-20',type:'permit',startTime:'12:00',endTime:'10:00'}));
 assert.ok(validateAbsenceInput({date:'2026-10-20',type:'permit'}));
 assert.equal(validateAbsenceInput({date:'2026-10-20',type:'permit',startTime:'10:00',endTime:'12:00'}),'');
 assert.equal(validateAbsenceInput({date:'2026-10-20',type:'vacation'}),'');
});
test('export include assenze senza timbrature e non esporta note mediche',()=>{
 const csv=buildTimesheetCsv([],[{userId:'u',date:'2026-10-20',type:'sick',note:'privata'}],[{id:'u',name:'=formula'}]);
 assert.ok(csv.includes('Malattia'));assert.ok(csv.includes("'=formula"));assert.ok(!csv.includes('privata'));assert.ok(csv.startsWith('\ufeff'));
});
