import axios from 'axios';
import * as seed from '../mocks/dataset.js';
export const mock = import.meta.env?.VITE_USE_MOCK_API !== 'false';
export const http = axios.create({baseURL:import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',timeout:12000});
export const delay = (ms=160)=>new Promise(resolve=>setTimeout(resolve,ms));
const tables = ['cases','users','devices','evidence','findings','uploads','audits','reports','queries','bookmarks'];
const db = Object.fromEntries(tables.map(key=>[key,structuredClone(seed[key]??[])]));
export async function list(table,caseId){
 if(!mock) return (await http.get('/'+table,{params:{caseId}})).data;
 await delay();
 return structuredClone(db[table].filter(row=>!caseId||row.caseId===caseId));
}
export async function save(table,row){
 if(!mock) return (await http.put('/'+table+'/'+row.id,row)).data;
 await delay();
 db[table]=[structuredClone(row),...db[table].filter(item=>item.id!==row.id)];
 return structuredClone(row);
}
export function uid(prefix){
 const bytes=globalThis.crypto.getRandomValues(new Uint8Array(8));
 return prefix+'-'+Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('').toUpperCase();
}
