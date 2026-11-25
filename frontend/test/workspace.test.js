import assert from 'node:assert/strict';
import test from 'node:test';
import {cases,devices,evidence,findings,audits,types} from '../src/mocks/dataset.js';
import {login} from '../src/services/authService.js';
import {filterRecords,search} from '../src/services/searchService.js';
import {investigate,retrieve} from '../src/services/investigationService.js';
import {getEntities} from '../src/services/entityService.js';
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
 const rows=await search(cases[0].id,{query:'transfer receipt',mode:'Exact',type:'Chat Messages',participant:'Aditi Rao',from:'2025-06-01',to:'2025-06-12'});
 assert.ok(rows.length>0);
 assert.ok(rows.every(r=>r.caseId===cases[0].id&&r.participants.includes('Aditi Rao')&&r.timestamp.slice(0,10)<='2025-06-12'));
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

test('Indian fixtures keep numbers stable across artefacts and locations scoped to their case',async()=>{
 const phoneByName=new Map();
 for(const row of evidence){
  assert.match(row.originalTimestamp,/\+05:30$/);
  assert.equal(Date.parse(row.originalTimestamp),Date.parse(row.timestamp));
  for(const {name,number} of row.metadata.phoneEntries??[]){
   assert.match(number,/^\+91 98XXX \d{5}$/);
   assert.ok(row.participants.includes(name));
   assert.equal(phoneByName.get(name)??number,number);
   phoneByName.set(name,number);
  }
 }
 assert.equal(new Set(phoneByName.values()).size,20);
 for(const c of cases){
  const locations=evidence.filter(row=>row.caseId===c.id&&row.type==='Location Records');
  assert.equal(locations.length,6);
  assert.equal(new Set(locations.map(row=>row.content)).size,3);
  assert.ok(locations.every(row=>row.metadata.country==='India'&&row.metadata.city===c.city));
 }
 const number=phoneByName.get('Aditi Rao');
 const matching=await search(cases[0].id,{query:number,mode:'Exact'});
 assert.ok(matching.some(row=>row.type==='Call Logs'));
 assert.ok(matching.some(row=>row.type==='Contacts'));
 assert.deepEqual(await search(cases[1].id,{query:number,mode:'Exact'}),[]);
 assert.ok((await getEntities(cases[0].id)).some(entity=>entity.name===number&&entity.type==='Phone number'));
 assert.ok(graphElements(evidence.filter(row=>row.caseId===cases[0].id)).some(element=>element.data.label===number));
});
