import {list,http,mock} from './client.js';
export function filterRecords(rows,filters={}){
 const {query='',mode='Keyword',type,application,participant,device,from,to}=filters;
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return rows.filter(row=>{
  const haystack=[row.id,row.content,row.type,row.application,row.deviceId,...row.participants,...row.participantIds,...Object.values(row.metadata).filter(value=>typeof value!=='object'),...(row.metadata.phoneEntries??[]).map(entry=>entry.number)].join(' ').toLowerCase();
  return (!type||row.type===type)&&(!application||row.application===application)&&(!participant||row.participants.includes(participant))&&(!device||row.deviceId===device)&&(!from||row.timestamp.slice(0,10)>=from)&&(!to||row.timestamp.slice(0,10)<=to)&&(!terms.length||(mode==='Exact'?haystack.includes(query.toLowerCase().trim()):mode==='Semantic'||mode==='Hybrid'?terms.some(term=>haystack.includes(term)):terms.every(term=>haystack.includes(term))));
 });
}
export async function search(caseId,filters){
 if(!mock)return (await http.get('/search',{params:{caseId,...filters}})).data;
 if(!caseId)return [];
 const rows=filterRecords(await list('evidence',caseId),filters);
 if(!['Semantic','Hybrid'].includes(filters?.mode)||!filters.query?.trim())return rows;
 const query=filters.query.toLowerCase().trim();
 const terms=[...new Set(query.split(/\s+/))];
 const score=row=>{
  const content=[row.content,row.type,row.application,...row.participants].join(' ').toLowerCase();
  return terms.filter(term=>content.includes(term)).length+(filters.mode==='Hybrid'&&content.includes(query)?terms.length:0);
 };
 return rows.map(row=>({row,score:score(row)})).sort((a,b)=>b.score-a.score||a.row.id.localeCompare(b.row.id)).map(entry=>entry.row);
}
