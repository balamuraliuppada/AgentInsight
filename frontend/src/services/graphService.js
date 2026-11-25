import {http,list,mock} from './client.js';
export function graphElements(rows){
 const nodes=new Map(),edges=new Map();
 function node(name,type,row){
  const id=type+'-'+name;
  if(!nodes.has(id))nodes.set(id,{id,label:name,type,refs:[]});
  nodes.get(id).refs.push(row.id);
  return id;
 }
 function edge(a,b,type,row){
  const [source,target]=[a,b].sort();
  const id=source+'|'+target+'|'+type;
  if(!edges.has(id))edges.set(id,{id,source,target,type,refs:[]});
  edges.get(id).refs.push(row.id);
 }
 rows.forEach(row=>{
  const [a,b]=row.participants.map(name=>node(name,'Person',row));
  if(['Chat Messages','Call Logs','SMS','Emails'].includes(row.type))edge(a,b,'Communication',row);
  if(row.type==='Contacts'){
   edge(a,b,'Shared contact',row);
   const phone=row.content.match(/\+1 202 555 \d{4}/)?.[0];
   if(phone)edge(b,node(phone,'Phone number',row),'Shared contact',row);
  }
  if(row.metadata.organization)edge(a,node(row.metadata.organization,'Organization',row),'Shared contact',row);
  if(row.type==='Device Information')edge(a,node(row.deviceId,'Device',row),'Device association',row);
  if(row.type==='Location Records')edge(a,node(row.content,'Location',row),'Recorded location association',row);
  const account=row.content.match(/AC-\d+/)?.[0];
  if(account)edge(a,node(account,'Account',row),'Associated account',row);
 });
 return [...nodes.values(),...edges.values()].map(data=>({data}));
}
export async function getGraph(caseId){
 if(!mock)return (await http.get('/graph',{params:{caseId}})).data;
 return caseId?graphElements(await list('evidence',caseId)):[];
}
