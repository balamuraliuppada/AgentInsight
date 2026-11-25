import {useState} from 'react';
import {Activity,Bell,BrainCircuit,CalendarDays,ChevronDown,ChevronLeft,ChevronRight,ClipboardCheck,CloudUpload,Database,FileChartColumn,Files,FolderOpen,GitFork,History,LayoutDashboard,LogOut,MapPin,Menu,Moon,ScanLine,Search,Settings,Sun,Users,X} from 'lucide-react';
import {Dropdown} from 'react-bootstrap';
import {Link,NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {useWorkspace} from '../context/Workspace.jsx';
const groups=[
 ['Workspace',[['Dashboard','/',LayoutDashboard],['Case Management','/cases',FolderOpen],['Evidence Upload','/upload',CloudUpload],['Evidence Explorer','/evidence',Database]]],
 ['Investigation',[['AI Investigator','/investigator',BrainCircuit],['Advanced Search','/search',Search],['Entity Analysis','/entities',Users],['Relationship Graph','/graph',GitFork],['Timeline Explorer','/timeline',CalendarDays],['Geospatial Analysis','/map',MapPin]]],
 ['Reporting',[['Findings','/findings',ClipboardCheck],['Report Builder','/reports/build',FileChartColumn],['Generated Reports','/reports',Files]]],
 ['Administration',[['User Management','/users',Users],['Audit Logs','/audit',History],['Settings','/settings',Settings]]]
];
export function Brand(){return <div className="brand"><span className="brand-mark"><ScanLine size={23}/></span><div><strong>Agent<span>Insight</span></strong><small>FORENSIC INTELLIGENCE</small></div></div>;}
export default function Layout(){
 const {user,signOut,theme,setTheme,caseId,setCaseId,allowedCases,scoped}=useWorkspace();
 const [collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(false),[closed,setClosed]=useState({}),[query,setQuery]=useState('');
 const location=useLocation(),navigate=useNavigate();
 const entry=groups.flatMap(([group,items])=>items.map(item=>[group,...item])).filter(([, ,url])=>url==='/'?location.pathname==='/':location.pathname===url||location.pathname.startsWith(url+'/')).sort((a,b)=>b[2].length-a[2].length)[0];
 return <div className={'shell '+(collapsed?'collapsed':'')}>
 {mobile&&<button className="scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
 <aside className={'sidebar '+(mobile?'mobile-open':'')}>
 <div className="sidebar-brand"><Link to="/" onClick={()=>setMobile(false)}><Brand/></Link><button className="icon-btn mobile-close" aria-label="Close navigation" onClick={()=>setMobile(false)}><X size={18}/></button></div>
 <nav>{groups.map(([label,items])=><div className="nav-group" key={label}><button className="nav-label" onClick={()=>setClosed({...closed,[label]:!closed[label]})} aria-expanded={!closed[label]}>{label}<ChevronDown size={12}/></button>{(!closed[label]||collapsed)&&items.filter(([,path])=>(!['/users','/audit'].includes(path)||user?.role==='Administrator')&&(path!=='/upload'||user?.role!=='Reviewer')).map(([title,url,Icon])=><NavLink end={url==='/'||url==='/reports'} title={title} key={url} to={url} onClick={()=>setMobile(false)}><Icon size={17}/><span>{title}</span>{title==='AI Investigator'&&<i className="ai-dot"/>}</NavLink>)}</div>)}</nav>
 <div className="sidebar-bottom"><div className="system-mini"><Activity size={16}/><span><strong>System operational</strong><small>Demo environment</small></span></div><button className="collapse-btn icon-btn" title="Toggle sidebar" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button></div>
 </aside>
 <div className="main-area"><header className="topbar"><button className="icon-btn mobile-toggle" aria-label="Open navigation" onClick={()=>setMobile(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>{entry?.[0]??'Workspace'}</span><ChevronRight size={13}/><strong>{entry?.[1]??'Page'}</strong></div><div className="top-actions">
 <form className="global-search search-field" onSubmit={e=>{e.preventDefault();navigate('/search?q='+encodeURIComponent(query));}}><Search size={15}/><input aria-label="Global evidence search" placeholder="Search evidence…" value={query} onChange={e=>setQuery(e.target.value)}/><kbd>↵</kbd></form>
 <div className="active-case"><FolderOpen size={15}/><select aria-label="Active case" value={caseId??''} onChange={e=>setCaseId(e.target.value)}>{!allowedCases.length&&<option value="">No assigned cases</option>}{allowedCases.map(c=><option key={c.id} value={c.id}>{c.id}</option>)}</select><ChevronDown size={13}/></div>
 <button className="icon-btn theme-button" title="Toggle theme" aria-label="Toggle theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
 <Dropdown align="end"><Dropdown.Toggle className="icon-btn notification" aria-label="Notifications" variant="link"><Bell size={18}/>{localStorage.getItem('ai-notifications')!=='false'&&scoped('findings').some(f=>f.status==='Pending Human Review')&&<i/>}</Dropdown.Toggle><Dropdown.Menu><Dropdown.Header>Notifications</Dropdown.Header><Dropdown.Item as={Link} to="/findings">{scoped('findings').filter(f=>f.status==='Pending Human Review').length} findings pending review</Dropdown.Item></Dropdown.Menu></Dropdown>
 <Dropdown align="end"><Dropdown.Toggle variant="link" className="profile-button"><span className="avatar">{user?.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span className="profile-name"><strong>{user?.name}</strong><small>{user?.role}</small></span><ChevronDown size={13}/></Dropdown.Toggle><Dropdown.Menu><Dropdown.Item as={Link} to="/settings"><Settings size={15}/> Settings</Dropdown.Item><Dropdown.Item onClick={()=>{signOut();navigate('/login');}}><LogOut size={15}/> Log out</Dropdown.Item></Dropdown.Menu></Dropdown>
 </div></header><main><Outlet/></main></div></div>;
}
