import {lazy,Suspense} from 'react';
import {Navigate,Route,Routes} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import Layout from './components/Layout.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import {useWorkspace} from './context/Workspace.jsx';
function page(loader,name){return lazy(()=>loader().then(m=>({default:m[name]})));}
const Cases=page(()=>import('./pages/Cases.jsx'),'Cases'),CaseDetail=page(()=>import('./pages/Cases.jsx'),'CaseDetail');
const Upload=page(()=>import('./pages/Evidence.jsx'),'Upload'),Evidence=page(()=>import('./pages/Evidence.jsx'),'Evidence'),Search=page(()=>import('./pages/Evidence.jsx'),'AdvancedSearch');
const Investigator=page(()=>import('./pages/Investigator.jsx'),'Investigator');
const Entities=page(()=>import('./pages/Analytics.jsx'),'Entities'),Graph=page(()=>import('./pages/Analytics.jsx'),'Graph'),Timeline=page(()=>import('./pages/Analytics.jsx'),'Timeline'),Map=page(()=>import('./pages/Geo.jsx'),'Geo');
const Findings=page(()=>import('./pages/Reports.jsx'),'Findings'),Builder=page(()=>import('./pages/Reports.jsx'),'Builder'),Reports=page(()=>import('./pages/Reports.jsx'),'Reports');
const Users=page(()=>import('./pages/Admin.jsx'),'Users'),Audit=page(()=>import('./pages/Admin.jsx'),'Audit'),Settings=page(()=>import('./pages/Admin.jsx'),'Settings');
function Loading(){return <div className="loading-wrap" aria-label="Loading workspace"><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>;}
function Gate({admin=false,children}){const {user,signedOut,data,error,refresh}=useWorkspace();if(signedOut)return <Navigate to="/login" replace/>;if(error)return <div className="loading-wrap"><p role="alert">{error}</p><button className="btn btn-primary" onClick={refresh}>Retry</button></div>;if(!data)return <Loading/>;if(!user)return <Navigate to="/login" replace/>;return admin&&user.role!=='Administrator'?<Navigate to="/unauthorized" replace/>:children;}
export default function App(){return <><Toaster position="bottom-right"/><Suspense fallback={<Loading/>}><Routes>
 <Route path="/login" element={<Auth key="login"/>}/><Route path="/forgot-password" element={<Auth key="forgot" mode="forgot"/>}/><Route path="/reset-password" element={<Auth key="reset" mode="reset"/>}/><Route path="/unauthorized" element={<Auth mode="unauthorized"/>}/>
 <Route element={<Gate><Layout/></Gate>}>
 <Route index element={<Dashboard/>}/><Route path="cases" element={<Cases/>}/><Route path="cases/:id" element={<CaseDetail/>}/><Route path="upload" element={<Upload/>}/><Route path="evidence" element={<Evidence/>}/><Route path="search" element={<Search/>}/>
 <Route path="investigator" element={<Investigator/>}/><Route path="entities" element={<Entities/>}/><Route path="graph" element={<Graph/>}/><Route path="timeline" element={<Timeline/>}/><Route path="map" element={<Map/>}/>
 <Route path="findings" element={<Findings/>}/><Route path="reports/build" element={<Builder/>}/><Route path="reports" element={<Reports/>}/><Route path="users" element={<Gate admin><Users/></Gate>}/><Route path="audit" element={<Gate admin><Audit/></Gate>}/><Route path="settings" element={<Settings/>}/><Route path="*" element={<Auth mode="missing"/>}/>
 </Route></Routes></Suspense></>;}
