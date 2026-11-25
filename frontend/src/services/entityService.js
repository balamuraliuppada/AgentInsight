import {http,list,mock} from './client.js';
export async function getEntities(caseId){
 if(!mock)return (await http.get('/entities',{params:{caseId}})).data;
 if(!caseId)return [];
 const entities=new Map();
 function add(name,type,row){
  const id=type+'-'+name;
  if(!entities.has(id))entities.set(id,{id,name,type,records:[]});
  entities.get(id).records.push(row);
 }
 for(const row of await list('evidence',caseId)){
  row.participants.forEach(p=>add(p,'Person',row));
  add(row.deviceId,'Device',row);
  add(row.timestamp.slice(0,10),'Date',row);
  if(row.type==='Location Records')add(row.content,'Location',row);
  if(row.type==='Browser History')add(row.content,'URL',row);
  if(row.metadata.sender)add(row.metadata.sender,'Email address',row);
  if(row.metadata.organization)add(row.metadata.organization,'Organization',row);
  for(const phone of row.content.match(/\+1 202 555 \d{4}/g)??[])add(phone,'Phone number',row);
  for(const account of row.content.match(/AC-\d+/g)??[])add(account,'Account',row);
 }
 return [...entities.values()];
}
