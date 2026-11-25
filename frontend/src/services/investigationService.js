import {http,list,mock} from './client.js';
export const questions=['Find conversations related to financial transactions.','Who communicated most frequently with Person A?','Show calls made during a selected date range.','Identify contacts associated with a particular account.','Summarize the evidence related to a fictional investigation.','Reconstruct the chronological sequence of relevant events.'];
export function retrieve(rows,question){
 const q=question.toLowerCase();
 if(/financial|transaction|transfer/.test(q))return rows.filter(e=>e.type==='Chat Messages'&&/transfer|receipt/.test(e.content)).slice(0,5);
 if(/calls?/.test(q)){
  const dates=q.match(/\d{4}-\d{2}-\d{2}/g)??[];
  return rows.filter(e=>e.type==='Call Logs'&&(!dates[0]||e.timestamp.slice(0,10)>=dates[0])&&(!dates[1]||e.timestamp.slice(0,10)<=dates[1])).slice(0,5);
 }
 if(/chronolog|sequence|timeline/.test(q))return [...rows].sort((a,b)=>a.timestamp.localeCompare(b.timestamp)).slice(0,5);
 if(/summarize|summary/.test(q))return rows.filter(e=>e.type==='Chat Messages').slice(0,5);
 if(/most frequently/.test(q)){
  const first=rows.find(e=>e.type==='Chat Messages')?.participants[0];
  const comm=rows.filter(e=>['Chat Messages','Call Logs','SMS'].includes(e.type)&&e.participants.includes(first));
  const counts={};
  comm.forEach(e=>e.participants.filter(p=>p!==first).forEach(p=>{counts[p]=(counts[p]??0)+1;}));
  const top=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
  return comm.filter(e=>e.participants.includes(top));
 }
 const account=q.match(/ac-\d+/)?.[0];
 return account?rows.filter(e=>e.type==='Contacts'&&e.content.toLowerCase().includes(account)).slice(0,5):[];
}
export async function investigate(caseId,question){
 if(!mock)return (await http.post('/investigation',{caseId,question})).data;
 return caseId?retrieve(await list('evidence',caseId),question):[];
}
