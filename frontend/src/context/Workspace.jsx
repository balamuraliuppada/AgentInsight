import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {list,mock,save,uid} from '../services/client.js';
import {login} from '../services/authService.js';
const Workspace=createContext(null);
const tables=['cases','users','devices','evidence','findings','uploads','audits','reports','queries','bookmarks'];
export function WorkspaceProvider({children}){
 const [user,setUser]=useState(()=>{const value=sessionStorage.getItem('ai-session');return value?JSON.parse(value):undefined;});
 const [theme,setTheme]=useState(()=>localStorage.getItem('ai-theme')||'dark');
 const [caseId,setCaseId]=useState(()=>sessionStorage.getItem('ai-case')||'CASE-2025-001');
 const [data,setData]=useState(null);
 const [error,setError]=useState('');
 const refresh=useCallback(async()=>{
  try{const result=await Promise.all(tables.map(async key=>[key,await list(key)]));setData(Object.fromEntries(result));setError('');}
  catch(err){setError(err.message);}
 },[]);
 useEffect(()=>{refresh();},[refresh]);
 useEffect(()=>{document.documentElement.dataset.bsTheme=theme;localStorage.setItem('ai-theme',theme);},[theme]);
 useEffect(()=>{sessionStorage.setItem('ai-case',caseId);},[caseId]);
 useEffect(()=>{if(user!==undefined)sessionStorage.setItem('ai-session',JSON.stringify(user));},[user]);
 const currentUser=user===undefined
  ? (mock?data?.users.find(u=>u.role==='Administrator'&&u.active):undefined)
  : (mock&&user&&data?data.users.find(u=>u.id===user.id&&u.active):user);
 const allowedCases=(data?.cases??[]).filter(c=>currentUser?.role==='Administrator'||currentUser?.cases?.includes(c.id));
 const activeCase=allowedCases.find(c=>c.id===caseId)??allowedCases[0];
 const activeId=activeCase?.id;
 const scoped=key=>(data?.[key]??[]).filter(row=>activeId&&row.caseId===activeId);
 async function write(table,row,action){
  const result=await save(table,row);
  if(action)await save('audits',{id:uid('AUD'),time:new Date().toISOString(),user:currentUser?.name,action,caseId:row.caseId??activeId,resource:row.id,status:'Success',details:action});
  await refresh();
  return result;
 }
 async function signIn(email,password){setUser(await login(email,password));}
 return <Workspace.Provider value={{user:currentUser,signedOut:user===null,signIn,signOut:()=>setUser(null),theme,setTheme,caseId:activeId,setCaseId,activeCase,allowedCases,data,error,refresh,scoped,write}}>{children}</Workspace.Provider>;
}
export const useWorkspace=()=>useContext(Workspace);
