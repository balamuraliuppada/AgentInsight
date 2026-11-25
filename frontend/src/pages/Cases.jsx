import {useState} from 'react';
import {Button,Form} from 'react-bootstrap';
import {FolderOpen,LayoutGrid,List,Plus} from 'lucide-react';
import toast from 'react-hot-toast';
import {Link,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {Confirm,DataTable,Dialog,Empty,EvidenceLink,Heading,Panel,SearchBox,Select,Status,dateTime,useDebounce} from '../components/UI.jsx';
import {useWorkspace} from '../context/Workspace.jsx';
import {uid} from '../services/client.js';
const categories=['Financial Fraud','Phishing & Cybercrime','Online Harassment','Corporate Data Leakage','Normal Digital Activity','Other'];
const statuses=['Open','Under Investigation','Pending Review','Closed','Archived'],priorities=['Low','Medium','High','Critical'];
function CaseForm({record,onClose}){
 const {data,write,user,setCaseId}=useWorkspace();
 const [form,setForm]=useState(record??{title:'',description:'',category:categories[0],status:'Open',priority:'Medium',investigators:[user.name],notes:''});
 const [busy,setBusy]=useState(false);
 const set=(key,value)=>setForm(previous=>({...previous,[key]:value}));
 async function submit(e){
  e.preventDefault();
  setBusy(true);
  const now=new Date().toISOString().slice(0,10);
  try{
   const saved=await write('cases',{...form,id:record?.id??uid('CASE'),created:record?.created??now,updated:now},record?'Case updated':'Case created');
   const assignments=data.users.filter(account=>{
    if(account.role==='Administrator'||account.role==='Reviewer')return false;
    const shouldHaveCase=form.investigators.includes(account.name)||(!record&&account.id===user.id);
    const hadCase=account.cases.includes(saved.id);
    const wasAssigned=record?.investigators.includes(account.name);
    return shouldHaveCase?!hadCase:hadCase&&wasAssigned;
   });
   for(const account of assignments){
    const ids=account.cases.includes(saved.id)?account.cases.filter(id=>id!==saved.id):[...account.cases,saved.id];
    await write('users',{...account,cases:ids},'Case assignment updated');
   }
   if(!record)setCaseId(saved.id);
   toast.success('Case saved');onClose();
  }catch(err){toast.error(err.message);}finally{setBusy(false);}
 }
 return <Dialog title={record?'Edit case':'Create case'} onClose={onClose}><Form onSubmit={submit} className="stack"><Form.Group><Form.Label>Case title</Form.Label><Form.Control required value={form.title} onChange={e=>set('title',e.target.value)}/></Form.Group><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" value={form.description} onChange={e=>set('description',e.target.value)}/></Form.Group><div className="toolbar"><Select label="Category" all={false} options={categories} value={form.category} onChange={v=>set('category',v)}/><Select label="Priority" all={false} options={priorities} value={form.priority} onChange={v=>set('priority',v)}/><Select label="Status" all={false} options={statuses} value={form.status} onChange={v=>set('status',v)}/></div><fieldset><legend>Investigators</legend>{data.users.filter(u=>u.role!=='Reviewer'&&u.active).map(u=><Form.Check key={u.id} label={u.name} checked={form.investigators.includes(u.name)} onChange={e=>set('investigators',e.target.checked?[...form.investigators,u.name]:form.investigators.filter(n=>n!==u.name))}/>)}</fieldset><Button type="submit" disabled={busy}>{busy?'Saving…':'Save case'}</Button></Form></Dialog>;
}
export function Cases(){
 const {allowedCases,data,user}=useWorkspace(),navigate=useNavigate();
 const [params,setParams]=useSearchParams(),[query,setQuery]=useState(''),[status,setStatus]=useState(''),[priority,setPriority]=useState(''),[category,setCategory]=useState(''),[view,setView]=useState('table'),[order,setOrder]=useState('Newest first'),[cardPage,setCardPage]=useState(0);
 const text=useDebounce(query).toLowerCase();
 const rows=allowedCases.filter(c=>(c.id+' '+c.title+' '+c.description).toLowerCase().includes(text)&&(!status||c.status===status)&&(!priority||c.priority===priority)&&(!category||c.category===category)).sort((a,b)=>a.created.localeCompare(b.created)*(order==='Newest first'?-1:1));
 const columns=[{key:'title',label:'Case title',sort:true},{key:'id',label:'Case ID'},{key:'category',label:'Category'},{key:'priority',label:'Priority',render:r=><Status>{r.priority}</Status>},{key:'status',label:'Status',render:r=><Status>{r.status}</Status>},{key:'created',label:'Created',sort:true},{key:'evidence',label:'Evidence',render:r=>data.evidence.filter(e=>e.caseId===r.id).length}];
 const page=Math.min(cardPage,Math.max(0,Math.ceil(rows.length/6)-1));
 return <><Heading title="Case Management" description="Organize investigations, case evidence, and investigator assignments.">{user.role!=='Reviewer'&&<Button onClick={()=>setParams({new:'1'})}><Plus size={16}/> New case</Button>}</Heading><div className="toolbar filterbar"><SearchBox value={query} onChange={setQuery} placeholder="Search cases…"/><Select label="All statuses" options={statuses} value={status} onChange={setStatus}/><Select label="All priorities" options={priorities} value={priority} onChange={setPriority}/><Select label="All categories" options={categories} value={category} onChange={setCategory}/><Select label="Creation date order" all={false} options={['Newest first','Oldest first']} value={order} onChange={setOrder}/><button className="icon-btn" aria-label="Table view" aria-pressed={view==='table'} onClick={()=>setView('table')}><List size={18}/></button><button className="icon-btn" aria-label="Card view" aria-pressed={view==='card'} onClick={()=>setView('card')}><LayoutGrid size={18}/></button></div>{view==='table'?<Panel><DataTable rows={rows} columns={columns} onRow={r=>navigate('/cases/'+r.id)}/></Panel>:rows.length?<><div className="card-grid">{rows.slice(page*6,page*6+6).map(c=><Panel key={c.id}><FolderOpen className="text-accent"/><h2><Link to={'/cases/'+c.id}>{c.title}</Link></h2><p className="muted">{c.id} · {c.category}</p><Status>{c.status}</Status><p className="mt-3">{c.description}</p></Panel>)}</div>{rows.length>6&&<div className="pagination-bar"><Button disabled={!page} onClick={()=>setCardPage(page-1)}>Previous</Button><Button disabled={(page+1)*6>=rows.length} onClick={()=>setCardPage(page+1)}>Next</Button></div>}</>:<Empty/>}{params.has('new')&&user.role!=='Reviewer'&&<CaseForm onClose={()=>setParams({})}/>}</>;
}
export function CaseDetail(){
 const {id}=useParams(),{data,allowedCases,setCaseId,user,write}=useWorkspace();
 const record=allowedCases.find(c=>c.id===id);
 const [tab,setTab]=useState('Overview'),[edit,setEdit]=useState(false),[archive,setArchive]=useState(false),[draft,setDraft]=useState(null);
 if(!record)return <Empty label="This case is unavailable for your account."/>;
 const evidence=data.evidence.filter(e=>e.caseId===id),findings=data.findings.filter(f=>f.caseId===id);
 const canEdit=user.role!=='Reviewer';
 async function update(patch,action){try{await write('cases',{...record,...patch,updated:new Date().toISOString().slice(0,10)},action);toast.success(action);}catch(err){toast.error(err.message);}}
 return <><Heading title={record.title} description={record.id+' · '+record.category}><Button variant="outline-secondary" onClick={()=>{setCaseId(id);toast.success('Active case updated');}}>Set active case</Button>{canEdit&&<Button onClick={()=>setEdit(true)}>Edit details</Button>}</Heading><div className="dashboard-tabs"><div>{['Overview','Evidence','Investigators','Findings','Notes','Activity'].map(t=><button className={tab===t?'selected':''} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div></div><Panel title={tab}>
 {tab==='Overview'&&<><p>{record.description}</p><div className="toolbar"><Status>{record.status}</Status><Status>{record.priority}</Status></div><div className="entity-line"><span>Evidence artefacts</span><strong>{evidence.length}</strong></div><div className="entity-line"><span>Findings</span><strong>{findings.length}</strong></div><div className="entity-line"><span>Created and last updated</span><strong>{record.created} / {record.updated}</strong></div>{canEdit&&record.status!=='Archived'&&<Button className="mt-3" variant="outline-danger" onClick={()=>setArchive(true)}>Archive case</Button>}</>}
 {tab==='Evidence'&&<DataTable rows={evidence} columns={[{key:'id',label:'ID',render:r=><span onClick={()=>setCaseId(id)}><EvidenceLink id={r.id}/></span>},{key:'type',label:'Artefact'},{key:'content',label:'Content'}]}/>}
 {tab==='Investigators'&&(record.investigators.length?record.investigators.map(n=><div className="entity-line" key={n}>{n}</div>):<Empty label="No investigators assigned."/>)}
 {tab==='Findings'&&<DataTable rows={findings} columns={[{key:'title',label:'Finding'},{key:'status',label:'Status',render:r=><Status>{r.status}</Status>}]}/>}
 {tab==='Notes'&&<Form onSubmit={e=>{e.preventDefault();update({notes:draft??record.notes},'Case notes saved');}}><Form.Label>Investigation notes</Form.Label><Form.Control as="textarea" rows={5} readOnly={!canEdit} value={draft??record.notes} onChange={e=>setDraft(e.target.value)}/>{canEdit&&<Button type="submit" className="mt-3">Save notes</Button>}</Form>}
 {tab==='Activity'&&<DataTable rows={data.audits.filter(a=>a.caseId===id)} columns={[{key:'time',label:'Time',render:r=>dateTime(r.time)},{key:'action',label:'Action'},{key:'user',label:'User'}]}/>}
 </Panel>{edit&&<CaseForm record={record} onClose={()=>setEdit(false)}/>} {archive&&<Confirm title="Archive case" onClose={()=>setArchive(false)} onConfirm={async()=>{await update({status:'Archived'},'Case archived');setArchive(false);}}>Archive {record.title}?</Confirm>}</>;
}
