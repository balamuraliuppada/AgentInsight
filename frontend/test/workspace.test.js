import assert from 'node:assert/strict';
import test from 'node:test';
import {cases,devices,evidence,findings,audits,types} from '../src/mocks/dataset.js';
import {login} from '../src/services/authService.js';
import {filterRecords,search} from '../src/services/searchService.js';
import {investigate,retrieve} from '../src/services/investigationService.js';
import {graphElements} from '../src/services/graphService.js';
import {getTimeline} from '../src/services/timelineService.js';

test('dataset satisfies coverage and referential integrity',()=>{
 assert.equal(cases.length,5);
 assert.equal(devices.length,10);
 assert.equal(new Set(evidence.flatMap(r=>r.participantIds)).size,20);
 assert.equal(new Set(evidence.map(r=>r.id)).size,evidence.length);
 assert.deepEqual(types.map(type=>evidence.filter(e=>e.type===type).length),[200,80,50,30,30,40,30,20,20,10]);
 for(const r of evidence)assert.ok(devices.some(d=>d.id===r.deviceId&&d.caseId===r.caseId));
 assert.equal(findings.length,15);
 for(const f of findings)for(const id of f.evidenceIds)assert.ok(evidence.some(e=>e.id===id&&e.caseId===f.caseId));
 assert.equal(audits.length,50);
});
test('mock login resolves demo roles and rejects incorrect passwords',async()=>{
 for(const [account,role] of [['admin','Administrator'],['investigator','Investigator'],['reviewer','Reviewer']]){
  assert.equal((await login(account+'@agentinsight.demo','Demo2025!')).role,role);
 }
 await assert.rejects(login('admin@agentinsight.demo','incorrect'));
});
test('search applies source, case, participant, query and date constraints',async()=>{
 const rows=await search(cases[0].id,{query:'transfer receipt',mode:'Exact',type:'Chat Messages',participant:'Maya Chen',from:'2025-06-01',to:'2025-06-12'});
 assert.ok(rows.length>0);
 assert.ok(rows.every(r=>r.caseId===cases[0].id&&r.participants.includes('Maya Chen')&&r.timestamp.slice(0,10)<='2025-06-12'));
 assert.deepEqual(await search(cases[1].id,{query:'AC-101'}),[]);
 assert.deepEqual(await search(undefined,{query:'transfer'}),[]);
 assert.equal(filterRecords(rows,{device:'not-a-device'}).length,0);
});
test('investigation returns deterministic case-local citations and reports empty retrieval',async()=>{
 const question='Find conversations related to financial transactions.';
 const rows=await investigate(cases[0].id,question);
 assert.ok(rows.length>0);
 assert.ok(rows.every(r=>r.caseId===cases[0].id&&r.content.includes('transfer receipt')));
 assert.deepEqual(rows,retrieve(evidence.filter(e=>e.caseId===cases[0].id),question));
 assert.deepEqual(await investigate(cases[1].id,question),[]);
 assert.deepEqual(await investigate(cases[0].id,'Where is the missing sculpture?'),[]);
});
test('graph references scoped evidence and timeline is chronologically ordered',async()=>{
 const rows=await getTimeline(cases[0].id),ids=new Set(rows.map(r=>r.id)),elements=graphElements(rows);
 assert.ok(rows.every(r=>r.caseId===cases[0].id));
 assert.deepEqual(rows.map(r=>r.timestamp),rows.map(r=>r.timestamp).sort());
 assert.ok(elements.some(e=>e.data.type==='Communication'));
 for(const element of elements)assert.ok(element.data.refs.every(id=>ids.has(id)));
});
