import {http,list,mock} from './client.js';
export async function getTimeline(caseId){
 if(!mock)return (await http.get('/timeline',{params:{caseId}})).data;
 return caseId?(await list('evidence',caseId)).sort((a,b)=>a.timestamp.localeCompare(b.timestamp)):[];
}
