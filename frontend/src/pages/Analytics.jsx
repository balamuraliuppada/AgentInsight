import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import cytoscape from 'cytoscape';
import {Bookmark,Download,Focus,ZoomIn,ZoomOut} from 'lucide-react';
import {Button,Form} from 'react-bootstrap';
import {Link,useSearchParams} from 'react-router-dom';
import toast from 'react-hot-toast';
import {DataTable,Dialog,Empty,EvidenceLink,Heading,Panel,SearchBox,Select,dateTime,download,useDebounce} from '../components/UI.jsx';
import {useWorkspace} from '../context/Workspace.jsx';
import {getEntities} from '../services/entityService.js';
import {getGraph} from '../services/graphService.js';
import {getTimeline} from '../services/timelineService.js';
import {EvidenceFilters} from './Evidence.jsx';
import {filterRecords} from '../services/searchService.js';
const Chart=lazy(()=>import('../components/Plot.jsx'));
function useCaseResult(load,caseId){
 const [state,setState]=useState({id:null,rows:null,error:''});
 useEffect(()=>{let live=true;load(caseId).then(rows=>{if(live)setState({id:caseId,rows,error:''});}).catch(err=>{if(live)setState({id:caseId,rows:[],error:err.message});});return()=>{live=false;};},[load,caseId]);
 return state.id===caseId?state:{rows:null,error:''};
}
export function Entities(){const {caseId}=useWorkspace();return <EntityView key={caseId}/>;}
function EntityView(){
 const {caseId}=useWorkspace(),[params]=useSearchParams(),{rows,error}=useCaseResult(getEntities,caseId);
 const [query,setQuery]=useState(params.get('q')??''),[type,setType]=useState(''),[view,setView]=useState('Table'),[selected,setSelected]=useState(null);
 const text=useDebounce(query).toLowerCase();
 const filtered=(rows??[]).filter(row=>row.name.toLowerCase().includes(text)&&(!type||row.type===type)).sort((a,b)=>b.records.length-a.records.length);
 return <><Heading title="Entity Analysis" description="Inspect people, identifiers, and devices referenced by case evidence."/><div className="toolbar filterbar"><SearchBox value={query} onChange={setQuery} placeholder="Search entities…"/><Select label="All categories" options={['Person','Phone number','Email address','Account','Organization','Location','URL','Date','Device']} value={type} onChange={setType}/><Select label="Display mode" all={false} options={['Table','Cards']} value={view} onChange={setView}/></div>
 {error?<p role="alert">{error}</p>:!rows?<div className="skeleton"/>:view==='Table'?<Panel><DataTable rows={filtered} columns={[{key:'name',label:'Entity',sort:true},{key:'type',label:'Category',sort:true},{key:'count',label:'Occurrences',render:r=>r.records.length}]} onRow={setSelected}/></Panel>:filtered.length?<div className="card-grid">{filtered.map(e=><Panel key={e.id}><small>{e.type}</small><h2>{e.name}</h2><p>{e.records.length} referenced artefacts</p><Button variant="outline-secondary" onClick={()=>setSelected(e)}>Inspect entity</Button></Panel>)}</div>:<Empty/>}
 {selected&&<Dialog title={selected.name} onClose={()=>setSelected(null)}><p>{selected.type} · {selected.records.length} referenced artefacts</p><p>Participants in supporting records</p><p className="muted">{[...new Set(selected.records.flatMap(r=>r.participants))].filter(n=>n!==selected.name).join(', ')||'None'}</p><div className="table-responsive" style={{maxHeight:'40vh'}}>{selected.records.map(r=><div className="entity-line" key={r.id}><EvidenceLink id={r.id}/><small>{r.type}</small></div>)}</div>{['Person','Phone number','Location','Device','Account','Organization'].includes(selected.type)&&<Link className="btn btn-outline-secondary mt-3" to={'/graph?node='+encodeURIComponent(selected.id)}>Open in relationship graph</Link>}</Dialog>}</>;
}
const nodeStyles={Person:['#659fff','ellipse'],'Phone number':['#f5b66d','round-rectangle'],Account:['#c19cff','diamond'],Device:['#3bddbc','round-rectangle'],Organization:['#fa8fa8','hexagon'],Location:['#70d1fb','triangle']};
const edgeTypes=['Communication','Shared contact','Associated account','Device association','Recorded location association'];
export function Graph(){const {caseId}=useWorkspace();return <GraphView key={caseId}/>;}
function GraphView(){
 const {caseId,theme}=useWorkspace(),{rows,error}=useCaseResult(getGraph,caseId),[params]=useSearchParams();
 const root=useRef(null),instance=useRef(null);
 const [layout,setLayout]=useState('cose'),[relation,setRelation]=useState(''),[category,setCategory]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState(null);
 const initial=params.get('node');
 useEffect(()=>{
  if(!root.current||!rows?.length)return;
  const nodes=rows.filter(e=>!e.data.source&&(!category||e.data.type===category||e.data.type==='Person')),ids=new Set(nodes.map(e=>e.data.id));
  const elements=[...nodes,...rows.filter(e=>e.data.source&&ids.has(e.data.source)&&ids.has(e.data.target)&&(!relation||e.data.type===relation))];
  const cy=cytoscape({container:root.current,elements,layout:{name:layout,animate:false,padding:38},minZoom:.15,maxZoom:4,style:[
   {selector:'node',style:{label:'data(label)',color:theme==='dark'?'#edf3fb':'#142338','font-size':11,'text-valign':'bottom','text-margin-y':5,width:24,height:24}},
   ...Object.entries(nodeStyles).map(([type,[color,shape]])=>({selector:'node[type = "'+type+'"]',style:{'background-color':color,shape}})),
   {selector:'edge',style:{width:2,'line-color':theme==='dark'?'#526887':'#91a5c3','curve-style':'bezier'}},
   {selector:':selected',style:{'background-color':'#ffffff','line-color':'#78aeff','border-width':2,'border-color':'#468cff'}},
   {selector:'.dim',style:{opacity:.2}}
  ]});
  instance.current=cy;cy.on('tap','node,edge',event=>setSelected(event.target.data()));
  if(initial){const n=cy.getElementById(initial);if(n.length){n.select();setSelected(n.data());}}
  return()=>{cy.destroy();instance.current=null;};
 },[rows,layout,relation,category,theme,initial]);
 function find(e){e.preventDefault();const cy=instance.current;if(!cy)return;const found=cy.nodes().filter(n=>n.data('label').toLowerCase().includes(query.toLowerCase().trim()));if(found.length&&query.trim()){cy.elements().unselect();found.first().select();cy.center(found.first());setSelected(found.first().data());}else toast.error('No visible node matches your search.');}
 function exportImage(){const cy=instance.current;if(!cy)return;const a=document.createElement('a');a.href=cy.png({full:true,scale:2,bg:theme==='dark'?'#0b1220':'#edf2f8'});a.download='case-relationships.png';a.click();}
 function neighbors(){const cy=instance.current;if(!cy||!selected)return;const element=cy.getElementById(selected.id);const related=element.closedNeighborhood();cy.elements().addClass('dim');related.removeClass('dim');cy.fit(related,55);}
 return <><Heading title="Relationship Graph" description="Explore connections supported by case records."><Button variant="outline-secondary" disabled={!rows?.length} onClick={exportImage}><Download size={15}/> Export image</Button></Heading><div className="notice">Edges represent observations in synthetic records. They carry no conclusion about intent, guilt, or criminal association.</div><div className="split"><Panel title="Case network"><div className="toolbar filterbar"><form className="toolbar" onSubmit={find}><SearchBox value={query} onChange={setQuery} placeholder="Search visible nodes…"/><Button type="submit" variant="outline-secondary">Find</Button></form><Select label="Graph layout" options={[{value:'cose',label:'Force directed'},{value:'circle',label:'Circle'},{value:'grid',label:'Grid'}]} value={layout} onChange={setLayout} all={false}/><Select label="All relationships" options={edgeTypes} value={relation} onChange={v=>{setRelation(v);setSelected(null);}}/><Select label="All node categories" options={Object.keys(nodeStyles)} value={category} onChange={v=>{setCategory(v);setSelected(null);}}/></div>{error?<p role="alert">{error}</p>:rows?.length?<div className="graph-canvas" ref={root} role="img" aria-label="Interactive evidence relationship network"/>:rows?<Empty/>:<div className="skeleton"/>}<div className="toolbar mt-2"><button className="icon-btn" aria-label="Fit graph" onClick={()=>{instance.current?.elements().removeClass('dim');instance.current?.fit(undefined,35);}}><Focus size={17}/></button><button className="icon-btn" aria-label="Zoom in" onClick={()=>instance.current?.zoom(instance.current.zoom()*1.2)}><ZoomIn size={17}/></button><button className="icon-btn" aria-label="Zoom out" onClick={()=>instance.current?.zoom(instance.current.zoom()/1.2)}><ZoomOut size={17}/></button></div><div className="graph-legend">{Object.entries(nodeStyles).map(([name,[color]])=><span key={name}><i style={{background:color}}/>{name}</span>)}</div></Panel><Panel title="Supporting evidence">{selected?<><h3>{selected.label??selected.type}</h3><p>{selected.type} · {selected.refs.length} references</p>{!selected.source&&<Button size="sm" variant="outline-secondary" onClick={neighbors}>Focus on neighbors</Button>}<div className="table-responsive mt-2" style={{maxHeight:350}}>{selected.refs.map(id=><div className="source-card" key={id}><EvidenceLink id={id}/></div>)}</div></>:<Empty label="Select a node or relationship to inspect its sources."/>}</Panel></div></>;
}
export function Timeline(){const {caseId}=useWorkspace();return <TimelineView key={caseId}/>;}
function TimelineView(){
 const {caseId,theme,scoped,write}=useWorkspace(),{rows,error}=useCaseResult(getTimeline,caseId);
 const [filters,setFilters]=useState({}),[group,setGroup]=useState(true),[selected,setSelected]=useState(null);
 const filtered=filterRecords(rows??[],filters);
 const bookmarks=scoped('bookmarks');
 const events=filtered.map(e=>({...e,group:e.timestamp.slice(0,10)}));
 const eventTypes=[...new Set(events.map(e=>e.type))];
 async function bookmark(record){try{const id='bookmark-'+record.id;await write('bookmarks',{id,caseId,evidenceId:record.id,active:!bookmarks.find(b=>b.id===id)?.active},'Timeline bookmark updated');}catch(err){toast.error(err.message);}}
 return <><Heading title="Timeline Explorer" description="Review recorded events in chronological order."><Button variant="outline-secondary" disabled={!events.length} onClick={()=>download('case-timeline.json',events)}><Download size={15}/> Export timeline</Button></Heading><Panel className="mb-3"><div className="toolbar"><EvidenceFilters records={rows??[]} filters={filters} onChange={(key,value)=>setFilters(previous=>({...previous,[key]:value}))}/><Form.Check type="switch" label="Group by date" checked={group} onChange={e=>setGroup(e.target.checked)}/></div></Panel>
 {error?<p role="alert">{error}</p>:!rows?<div className="skeleton"/>:events.length?<><Panel title="Event timeline" sub="Drag across the plot to zoom. Double-click to reset." className="mb-3"><Suspense fallback={<div className="skeleton"/>}><Chart theme={theme} height={220} data={eventTypes.map(type=>{const matches=events.filter(e=>e.type===type);return {name:type,type:'scatter',mode:'markers',x:matches.map(e=>e.timestamp),y:matches.map(()=>type),text:matches.map(e=>e.id),hovertemplate:'%{text}<br>%{x}<extra></extra>'};})} layout={{margin:{l:120,r:20,t:10,b:35}}}/></Suspense></Panel><Panel title="Recorded events" sub={events.length+' events'}><DataTable rows={events} onRow={setSelected} columns={[{key:'id',label:'Evidence'},{key:'timestamp',label:'Recorded time',sort:true,render:r=><>{group&&<strong className="d-block">{r.group}</strong>}{dateTime(r.timestamp)}</>},{key:'type',label:'Event type'},{key:'content',label:'Content'},{key:'bookmark',label:'Bookmark',render:r=><button className="icon-btn" aria-label={'Bookmark '+r.id} aria-pressed={bookmarks.some(b=>b.evidenceId===r.id&&b.active)} onClick={e=>{e.stopPropagation();bookmark(r);}}><Bookmark size={14}/></button>}]}/></Panel></>:<Empty/>}
 {selected&&<Dialog title={selected.type} onClose={()=>setSelected(null)}><p>{selected.content}</p><p>Original timestamp {selected.originalTimestamp}</p><p>Normalized timestamp {dateTime(selected.timestamp)}</p><EvidenceLink id={selected.id}/></Dialog>}</>;
}
