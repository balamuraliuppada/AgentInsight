import {useEffect,useState} from 'react';
import {Button,Form,ProgressBar} from 'react-bootstrap';
import {Bookmark,CloudUpload,Download,ExternalLink,FileCheck,Plus} from 'lucide-react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import toast from 'react-hot-toast';
import {DataTable,Dialog,Empty,Heading,Panel,SearchBox,Select,Status,dateTime,download,useDebounce} from '../components/UI.jsx';
import {useWorkspace} from '../context/Workspace.jsx';
import {delay,uid} from '../services/client.js';
import {search} from '../services/searchService.js';
const modes=['Exact','Keyword','Semantic','Hybrid'];
const categories=['Chat Messages','SMS','Call Logs','Contacts','Emails','Browser History','Location Records','Media Metadata','Application Records','Device Information'];
const unique=values=>[...new Set(values)].sort();
export function EvidenceFilters({records,filters,onChange,showType=true}){
 const select=(key,label,options)=><Select label={label} options={options} value={filters[key]??''} onChange={v=>onChange(key,v)}/>;
 return <>{showType&&select('type','All artefact types',categories)}{select('application','All applications',unique(records.map(e=>e.application)))}{select('participant','All participants',unique(records.flatMap(e=>e.participants)))}{select('device','All devices',unique(records.map(e=>e.deviceId)))}<Form.Control type="date" aria-label="From date" value={filters.from??''} onChange={e=>onChange('from',e.target.value)}/><Form.Control type="date" aria-label="To date" value={filters.to??''} onChange={e=>onChange('to',e.target.value)}/></>;
}
export function RecordDetails({record,records=[],onSelect}){
 const [source,setSource]=useState(false);
 if(!record)return <Empty label="Select an evidence record to inspect its source."/>;
 const fields=[['Artefact ID',record.id],['Case ID',record.caseId],['Device ID',record.deviceId],['Source file',record.sourceFile],['Original record ID',record.originalRecordId],['Original timestamp',record.originalTimestamp],['Normalized timestamp',dateTime(record.timestamp)],['Application',record.application],['Participants',record.participants.join(', ')]];
 return <><Status>{record.type}</Status><dl className="detail-list mt-3">{fields.map(([label,value])=><Detail key={label} label={label} value={value}/>)}</dl>
 {record.type==='Chat Messages'?<div className="stack"><h3>Conversation</h3>{records.filter(row=>row.type===record.type&&row.application===record.application&&row.participants.length===record.participants.length&&record.participants.every(p=>row.participants.includes(p))).sort((a,b)=>a.timestamp.localeCompare(b.timestamp)).map(row=><div className={'message '+(row.id===record.id?'user':'')} key={row.id}><small>{row.participants[0]} · {localStorage.getItem('ai-original-time')==='true'?row.originalTimestamp:dateTime(row.timestamp)}</small><p className="my-1">{row.content}</p><button className="plain evidence-link py-0" onClick={()=>onSelect?.(row)}>{row.id}</button></div>)}</div>:<div className="message mb-3"><small>{({Emails:'Mail subject',Contacts:'Contact entry','Call Logs':'Call information','Location Records':'Recorded position'})[record.type]??'Original content'}</small><p className="my-1">{record.content}</p>{record.type==='Location Records'&&<small>{record.metadata.latitude}, {record.metadata.longitude}</small>}</div>}
 <div className="mt-3"><h3>Metadata</h3><dl className="detail-list">{Object.entries(record.metadata).map(([key,value])=><Detail key={key} label={key} value={String(value)}/>)}</dl><Button variant="outline-secondary" onClick={()=>setSource(true)}><ExternalLink size={14}/> Source reference</Button></div>
 {source&&<Dialog title="Original source reference" onClose={()=>setSource(false)}><p>{record.sourceFile} · {record.originalRecordId}</p><pre className="text-wrap">{JSON.stringify(record,null,2)}</pre></Dialog>}</>;
}
function Detail({label,value}){return <><dt>{label}</dt><dd>{value}</dd></>;}
export function Evidence(){const {caseId}=useWorkspace();return <Explorer key={caseId}/>;}
function Explorer(){
 const {caseId,scoped,write,user}=useWorkspace(),[params,setParams]=useSearchParams();
 const records=scoped('evidence'),[filters,setFilters]=useState({}),[query,setQuery]=useState(''),[rows,setRows]=useState(null),[error,setError]=useState(''),[checked,setChecked]=useState([]),[attach,setAttach]=useState(false);
 const text=useDebounce(query),record=records.find(r=>r.id===params.get('record')),findings=scoped('findings'),bookmarks=scoped('bookmarks');
 useEffect(()=>{let live=true;search(caseId,{...filters,query:text}).then(result=>{if(live){setRows(result);setError('');}}).catch(err=>{if(live){setRows([]);setError(err.message);}});return()=>{live=false;};},[caseId,filters,text]);
 const setFilter=(key,value)=>setFilters(previous=>({...previous,[key]:value}));
 const select=row=>setParams({record:row.id});
 async function bookmark(){try{const id='bookmark-'+record.id,existing=bookmarks.find(b=>b.id===id);await write('bookmarks',{id,caseId,evidenceId:record.id,active:!existing?.active},existing?.active?'Bookmark removed':'Evidence bookmarked');toast.success(existing?.active?'Bookmark removed':'Evidence bookmarked');}catch(err){toast.error(err.message);}}
 async function add(finding){try{await write('findings',{...finding,status:finding.status==='Investigator Verified'?'Pending Human Review':finding.status,evidenceIds:[...new Set([...finding.evidenceIds,...(checked.length?checked:[record.id])])]},'Evidence attached to finding');setAttach(false);toast.success('Evidence attached');}catch(err){toast.error(err.message);}}
 const columns=[{key:'id',label:'Evidence ID',sort:true,render:r=><div className="d-flex align-items-center gap-2"><input type="checkbox" aria-label={'Select '+r.id} checked={checked.includes(r.id)} onClick={e=>e.stopPropagation()} onChange={e=>setChecked(e.target.checked?[...checked,r.id]:checked.filter(id=>id!==r.id))}/><button className="plain text-accent p-0" onClick={e=>{e.stopPropagation();select(r);}}>{r.id}</button></div>},{key:'content',label:'Content',sort:true},{key:'timestamp',label:'Recorded',sort:true,render:r=>dateTime(r.timestamp)}];
 return <><Heading title="Evidence Explorer" description="Browse and inspect original artefacts from the active case."><Button variant="outline-secondary" disabled={!checked.length} onClick={()=>download('evidence-records.json',records.filter(r=>checked.includes(r.id)))}><Download size={15}/> Export selected</Button></Heading><div className="three-panel">
 <Panel title="Artefact categories"><div className="sidebar-list">{['',...categories].map(t=><button key={t} className={'plain '+((filters.type??'')===t?'selected':'')} onClick={()=>setFilter('type',t)}>{t||'All artefacts'}</button>)}</div><div className="stack mt-3"><EvidenceFilters records={records} filters={filters} onChange={setFilter} showType={false}/></div></Panel>
 <Panel title="Evidence records" sub={rows?rows.length+' matching records':undefined}><SearchBox value={query} onChange={setQuery} placeholder="Search evidence records…"/><div className="mt-3">{error?<p role="alert" className="text-danger">{error}</p>:rows?<DataTable columns={columns} rows={rows} onRow={select}/>:<div className="skeleton"/>}</div></Panel>
 <Panel title="Evidence details" action={record&&<button title="Bookmark evidence" aria-label="Bookmark evidence" aria-pressed={bookmarks.some(b=>b.evidenceId===record.id&&b.active)} onClick={bookmark} className="icon-btn"><Bookmark size={16}/></button>}><RecordDetails key={record?.id} record={record} records={records} onSelect={select}/>{(record||checked.length>0)&&user.role!=='Reviewer'&&<Button className="mt-3" variant="outline-secondary" onClick={()=>setAttach(true)}><Plus size={15}/> Add to finding</Button>}</Panel>
 </div>{attach&&<Dialog title="Attach evidence to a finding" onClose={()=>setAttach(false)}>{findings.length?findings.map(f=><div className="entity-line" key={f.id}><span>{f.title}</span><Button size="sm" onClick={()=>add(f)}>Attach</Button></div>):<Empty label="Create a finding before attaching evidence."/>}</Dialog>}</>;
}
function highlight(str,query,mode){
 const phrase=query.trim();
 if(!phrase)return str;
 const terms=mode==='Exact'?[phrase]:phrase.split(/\s+/);
 const escaped=terms.map((term)=>Array.from(term).map(char=>'^$.*+?()[]{}|\\'.includes(char)?'\\'+char:char).join(''));
 const matcher=new RegExp('('+escaped.join('|')+')','gi');
 return str.split(matcher).map((part,index)=>index%2?<mark key={index}>{part}</mark>:part);
}
export function AdvancedSearch(){const {caseId}=useWorkspace();return <SearchWorkspace key={caseId}/>;}
function SearchWorkspace(){
 const {caseId,setCaseId,allowedCases,scoped,write}=useWorkspace(),[params,setParams]=useSearchParams(),navigate=useNavigate();
 const [filters,setFilters]=useState({}),[mode,setMode]=useState(()=>localStorage.getItem('ai-default-search')||'Keyword'),[rows,setRows]=useState(null),[duration,setDuration]=useState(0),[error,setError]=useState('');
 const query=params.get('q')??'',text=useDebounce(query),records=scoped('evidence');
 useEffect(()=>{let live=true;const start=performance.now();search(caseId,{...filters,query:text,mode}).then(result=>{if(live){setError('');setRows(result);setDuration(Math.round(performance.now()-start));}}).catch(err=>{if(live)setError(err.message);});return()=>{live=false;};},[caseId,filters,text,mode]);
 async function saveSearch(){try{await write('queries',{id:uid('SEARCH'),caseId,kind:'search',question:query,filters,mode},'Search saved');toast.success('Search saved');}catch(err){toast.error(err.message);}}
 const columns=[{key:'id',label:'Evidence ID',sort:true},{key:'content',label:'Excerpt',sort:true,render:r=>highlight(r.content,text,mode)},{key:'type',label:'Type',sort:true},{key:'sourceFile',label:'Source'},{key:'timestamp',label:'Recorded',sort:true,render:r=>dateTime(r.timestamp)},{key:'rank',label:'Rank',sort:true}];
 return <><Heading title="Advanced Search" description="Retrieve case evidence by text, source, participant, and date."><Button onClick={saveSearch} disabled={!query.trim()||!caseId}><Bookmark size={15}/> Save search</Button></Heading>
 <Panel className="mb-3"><div className="toolbar filterbar"><Select label="Search case" value={caseId??''} all={!allowedCases.length} options={allowedCases.map(c=>({value:c.id,label:c.title}))} onChange={setCaseId}/><SearchBox value={query} onChange={v=>setParams(v?{q:v}:{},{replace:true})} placeholder="Search keywords, accounts, or evidence IDs…"/><Select label="Search mode" options={modes} all={false} value={mode} onChange={setMode}/><Select label="Saved searches" options={scoped('queries').filter(q=>q.kind==='search').map(q=>({label:q.question,value:q.id}))} value="" onChange={v=>{const saved=scoped('queries').find(q=>q.id===v);if(saved){setParams({q:saved.question});setMode(saved.mode);setFilters(saved.filters);}}}/></div><div className="toolbar"><EvidenceFilters records={records} filters={filters} onChange={(key,value)=>setFilters(previous=>({...previous,[key]:value}))}/></div></Panel>
 {['Semantic','Hybrid'].includes(mode)&&<div className="notice">Simulated ranking uses literal term overlap. Semantic retrieval will require the backend.</div>}
 <Panel title="Search results" sub={rows?rows.length+' matching records · '+duration+' ms':undefined}>{error?<p role="alert">{error}</p>:rows?<DataTable rows={rows.map((r,i)=>({...r,rank:i+1}))} columns={columns} onRow={r=>navigate('/evidence?record='+r.id)}/>:<div className="skeleton"/>}</Panel></>;
}
const stages=['File validation','Integrity verification','Evidence parsing','Data normalization','Entity extraction','Embedding generation','Evidence indexing','Processing completed'];
const extensions=['json','xml','csv','zip'];
const extension=file=>file.name.split('.').at(-1).toLowerCase();
const filesize=size=>size<1024?size+' B':size<1048576?(size/1024).toFixed(1)+' KB':(size/1048576).toFixed(2)+' MB';
async function fingerprint(file){if(!globalThis.crypto?.subtle)return '';const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function Upload(){
 const {caseId,setCaseId,allowedCases,scoped,write,user}=useWorkspace();
 const [files,setFiles]=useState([]),[jobs,setJobs]=useState([]),[device,setDevice]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState(null),[controller,setController]=useState(null);
 function enqueue(items){setFiles(previous=>[...previous,...Array.from(items).map(file=>({id:uid('FILE'),file}))]);}
 async function inspect(file){try{setPreview({name:file.name,content:extension(file)==='zip'?'ZIP archive selected.':await file.slice(0,2500).text()});}catch(err){toast.error(err.message);}}
 async function run(items){
  if(!caseId||!items.length||busy)return;
  const abort=new AbortController(),active=caseId;setController(abort);setBusy(true);
  const update=(item,patch)=>setJobs(previous=>previous.some(job=>job.id===item.id)?previous.map(job=>job.id===item.id?{...job,...patch}:job):[...previous,{...item,...patch}]);
  try{for(const item of items){
   const file=item.file,ext=extension(file);
   try{
    if(!extensions.includes(ext)||file.size===0||file.size>64*1024*1024)throw new Error('Choose a non-empty JSON, XML, CSV, or ZIP file up to 64 MB.');
    let hash='';
    for(let i=0;i<stages.length;i++){
     if(abort.signal.aborted)throw new Error('Cancelled');
     update(item,{stage:stages[i],progress:Math.round((i+1)/stages.length*100),status:'Processing'});
     if(i===1)hash=await fingerprint(file);
     await delay(230);
    }
    if(abort.signal.aborted)throw new Error('Cancelled');
    await write('uploads',{id:item.id,caseId:active,name:file.name,type:ext.toUpperCase(),size:file.size,hash,status:'Processed',date:new Date().toISOString(),count:0,device},'Evidence import simulated');
    update(item,{status:'Processed',progress:100,stage:'Processing completed'});
   }catch(err){update(item,{status:abort.signal.aborted?'Cancelled':'Failed',stage:err.message,progress:0});}
  }}finally{setBusy(false);setController(null);}
 }
 if(user.role==='Reviewer')return <Heading title="Evidence Upload" description="Evidence ingestion requires an investigator or administrator account."/>;
 return <><Heading title="Evidence Upload" description="Stage local files and track simulated forensic ingestion."/><div className="notice">SHA-256 is calculated locally when Web Crypto is available. Ingestion stages are simulated and import zero parsed artefacts. Native UFDR support is planned.</div><div className="split mb-3"><Panel title="Upload files" sub="JSON, XML, CSV, and ZIP · up to 64 MB per file"><div className="dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)enqueue(e.dataTransfer.files);}}><CloudUpload size={30}/><p>Drop evidence files here</p><label className="btn btn-outline-secondary"><FileCheck size={15}/> Browse files<input className="visually-hidden" type="file" aria-label="Browse files" multiple accept=".json,.xml,.csv,.zip" disabled={busy} onChange={e=>{enqueue(e.target.files);e.target.value='';}}/></label></div>
 {files.map(item=><div className="entity-line" key={item.id}><div><button className="plain text-accent text-wrap" onClick={()=>inspect(item.file)}>{item.file.name}</button><div><small>{filesize(item.file.size)} · {extensions.includes(extension(item.file))?'Supported format':'Unsupported format'}</small></div></div><Button size="sm" variant="outline-secondary" disabled={busy} onClick={()=>setFiles(files.filter(f=>f.id!==item.id))}>Remove</Button></div>)}
 <div className="toolbar mt-3"><Button onClick={()=>run(files.filter(file=>!jobs.some(j=>j.id===file.id&&j.status==='Processed')))} disabled={!caseId||busy||!files.some(file=>!jobs.some(j=>j.id===file.id&&j.status==='Processed'))}>Start import</Button>{busy&&<Button variant="outline-danger" onClick={()=>controller.abort()}>Cancel processing</Button>}</div></Panel><Panel title="Import settings"><div className="stack"><Select label="Target case" value={caseId??''} all={!allowedCases.length} onChange={setCaseId} options={allowedCases.map(c=>({label:c.title,value:c.id}))}/><Form.Group><Form.Label>Source device information</Form.Label><Form.Control value={device} onChange={e=>setDevice(e.target.value)} placeholder="Device label or reference"/></Form.Group>{jobs.map(j=><div key={j.id}><div className="entity-line"><small>{j.file.name}</small><Status>{j.status}</Status></div><ProgressBar now={j.progress} aria-label={j.stage}/><small>{j.stage}</small>{['Failed','Cancelled'].includes(j.status)&&<Button variant="link" disabled={busy} onClick={()=>run([j])}>Retry</Button>}</div>)}</div></Panel></div>
 <Panel title="Ingestion history"><DataTable rows={scoped('uploads')} columns={[{key:'name',label:'File'},{key:'type',label:'Type'},{key:'size',label:'Size',render:r=>filesize(r.size)},{key:'hash',label:'SHA-256',render:r=><span title={r.hash}>{r.hash?r.hash.slice(0,12)+'…':'Unavailable'}</span>},{key:'status',label:'Status',render:r=><Status>{r.status}</Status>},{key:'date',label:'Upload date',render:r=>dateTime(r.date)},{key:'count',label:'Artefacts'}]}/></Panel>{preview&&<Dialog title={preview.name} onClose={()=>setPreview(null)}><pre className="text-wrap">{preview.content}</pre></Dialog>}</>;
}
