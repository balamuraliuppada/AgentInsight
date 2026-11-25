import {useEffect,useRef,useState} from 'react';
import {Button,Form} from 'react-bootstrap';
import {BrainCircuit,Copy,Plus,RotateCcw,Send,Square} from 'lucide-react';
import toast from 'react-hot-toast';
import {Empty,EvidenceLink,Heading,Panel,Status,dateTime} from '../components/UI.jsx';
import {useWorkspace} from '../context/Workspace.jsx';
import {delay,uid} from '../services/client.js';
import {investigate,questions} from '../services/investigationService.js';
const stages=['Understanding query','Applying case filters','Retrieving evidence','Combining search results','Reranking evidence','Generating answer','Validating citations'];
export function Investigator(){const {caseId}=useWorkspace();return <InvestigationWorkspace key={caseId}/>;}
function InvestigationWorkspace(){
 const {caseId,scoped,write,user}=useWorkspace();
 const [conversation,setConversation]=useState(null),[question,setQuestion]=useState(''),[thread,setThread]=useState([]),[selected,setSelected]=useState(null),[stage,setStage]=useState(''),[error,setError]=useState('');
 const controller=useRef(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const stored=scoped('queries'),records=scoped('evidence');
 const answers=selected?.evidenceIds.map(id=>records.find(e=>e.id===id)).filter(Boolean)??[];
 const validation=selected?.evidenceIds.length?'Supported':'Insufficient Evidence';
 function clear(){controller.current?.abort();controller.current=null;setThread([]);setSelected(null);setConversation(null);setQuestion('');setStage('');setError('');}
 function open(entry){if(controller.current)return;const turns=stored.filter(q=>q.conversation===entry.conversation&&q.kind==='investigation').sort((a,b)=>a.created.localeCompare(b.created));setConversation(entry.conversation);setThread(turns);setSelected(turns.at(-1)??null);}
 async function ask(prompt,replace){
  if(!prompt.trim()||!caseId||controller.current)return;
  const abort=new AbortController();controller.current=abort;setError('');setQuestion('');
  const conversationId=conversation??uid('CONV');setConversation(conversationId);
  try{let rows=[];for(let i=0;i<stages.length;i++){if(abort.signal.aborted)return;setStage(stages[i]);if(i===2)rows=await investigate(caseId,prompt);await delay(170);}
   if(abort.signal.aborted)return;
   const entry={id:replace?.id??uid('QUERY'),caseId,kind:'investigation',conversation:conversationId,question:prompt,evidenceIds:rows.map(r=>r.id),created:replace?.created??new Date().toISOString()};
   await write('queries',entry,'Simulated investigation query');
   if(abort.signal.aborted)return;
   setThread(previous=>replace?previous.map(t=>t.id===entry.id?entry:t):[...previous,entry]);setSelected(entry);
  }catch(err){if(!abort.signal.aborted)setError(err.message);}finally{if(controller.current===abort){controller.current=null;setStage('');}}
 }
 async function saveQuery(entry){
  try{
   const id='SAVED-'+entry.id;
   await write('queries',{id,caseId,kind:'saved-investigation',question:entry.question},'Investigation query saved');
   toast.success('Investigation query saved');
  }catch(err){toast.error(err.message);}
 }
 function response(entry){const rows=entry.evidenceIds.map(id=>records.find(r=>r.id===id)).filter(Boolean);if(!rows.length)return 'Insufficient evidence in the active case to answer this question.';return '### Evidence retrieved\n'+rows.map(r=>'- '+r.content+' ['+r.id+']').join('\n');}
 async function finding(entry){try{await write('findings',{id:uid('F'),caseId,title:entry.question,description:response(entry),evidenceIds:entry.evidenceIds,source:'Simulated AI',status:'Pending Human Review',notes:'',created:new Date().toISOString(),history:[]},'AI finding submitted for review');toast.success('Finding submitted for human review');}catch(err){toast.error(err.message);}}
 return <><Heading title="AI Investigator" description="Ask case-specific questions and inspect the supporting evidence."/><div className="notice">Simulated AI engine. Every evidence excerpt links to a source record in the active case.</div>
 <div className="three-panel"><Panel title="Investigation sessions"><Button className="w-100 mb-3" onClick={clear}><Plus size={15}/> New conversation</Button><h3>Conversation history</h3><div className="sidebar-list">{[...new Map(stored.filter(q=>q.kind==='investigation').map(q=>[q.conversation,q])).values()].map(q=><button className="plain text-wrap" key={q.conversation} onClick={()=>open(q)}>{q.question}</button>)}{!stored.some(q=>q.kind==='investigation')&&<small>No conversations yet.</small>}</div><h3 className="mt-3">Suggested questions</h3><div className="sidebar-list">{questions.map(q=><button key={q} className="plain text-wrap" onClick={()=>setQuestion(q)}>{q}</button>)}</div><h3 className="mt-3">Saved queries</h3>{stored.filter(q=>q.kind==='saved-investigation').map(q=><button key={q.id} className="plain text-wrap d-block" onClick={()=>setQuestion(q.question)}>{q.question}</button>)}{!stored.some(q=>q.kind==='saved-investigation')&&<small>No saved queries yet.</small>}<h3 className="mt-3">Search history</h3>{stored.filter(q=>q.kind==='search').map(q=><button key={q.id} className="plain text-wrap d-block" onClick={()=>setQuestion(q.question)}>{q.question}</button>)}{!stored.some(q=>q.kind==='search')&&<small>Saved advanced searches appear here.</small>}</Panel>
 <Panel title="Investigation conversation" sub="Case-scoped retrieval"><div className="messages" aria-live="polite">{!thread.length&&!stage&&<Empty label="Ask a question or choose a suggested query to begin."/>}{thread.map(entry=><div key={entry.id} className="stack"><div className="message user">{entry.question}</div><div className="message"><div className="toolbar mb-2"><BrainCircuit size={16}/><strong>Simulated response</strong><Status>{entry.evidenceIds.length?'Supported':'Insufficient Evidence'}</Status></div>{entry.evidenceIds.length?<><h3>Evidence retrieved</h3><ul>{entry.evidenceIds.map(id=>{const record=records.find(r=>r.id===id);return record&&<li key={id}>{record.content} <EvidenceLink id={id}/></li>;})}</ul></>:<p>{response(entry)}</p>}<div className="toolbar"><Button size="sm" variant="outline-secondary" onClick={()=>setSelected(entry)}>Inspect sources</Button><Button size="sm" variant="outline-secondary" onClick={()=>saveQuery(entry)}>Save query</Button><button className="icon-btn" title="Copy response" aria-label="Copy response" onClick={async()=>{try{await navigator.clipboard.writeText(response(entry));toast.success('Response copied');}catch(err){toast.error(err.message);}}}><Copy size={15}/></button><button className="icon-btn" aria-label="Regenerate" title="Regenerate" disabled={!!stage} onClick={()=>ask(entry.question,entry)}><RotateCcw size={15}/></button>{user.role!=='Reviewer'&&<Button size="sm" disabled={!entry.evidenceIds.length} variant="outline-secondary" onClick={()=>finding(entry)}>Save as finding</Button>}</div></div></div>)}{stage&&<div className="message"><span className="spinner-border spinner-border-sm me-2"/>{stage}…</div>}{error&&<p role="alert" className="text-danger">{error}</p>}</div>
 <Form onSubmit={e=>{e.preventDefault();ask(question);}} className="stack"><Form.Control as="textarea" rows={3} aria-label="Investigation question" placeholder="Ask about the active case…" value={question} onChange={e=>setQuestion(e.target.value)}/><div className="toolbar">{stage?<Button variant="outline-secondary" onClick={()=>controller.current?.abort()}><Square size={14}/> Stop generation</Button>:<Button type="submit" disabled={!question.trim()||!caseId}><Send size={15}/> Send question</Button>}</div></Form></Panel>
 <Panel title="Retrieved evidence" sub={selected?answers.length+' source records':undefined}>{selected&&<Status>{validation}</Status>}{answers.length?answers.map((record,i)=><div className="source-card" key={record.id}><small>Rank {i+1} · {record.type}</small><p><EvidenceLink id={record.id}/></p><p>{record.content}</p><small>{dateTime(record.timestamp)}</small></div>):<Empty label="Sources appear after retrieval."/>}</Panel>
 </div></>;
}
