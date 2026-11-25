import {useEffect,useRef} from 'react';
import cytoscape from 'cytoscape';
import {graphElements} from '../services/graphService.js';
export default function NetworkPreview({records,theme}){
 const root=useRef(null);
 useEffect(()=>{
  const full=graphElements(records),elements=full.filter(e=>e.data.type==='Person'||e.data.type==='Communication');
  if(!root.current||!elements.length)return;
  const graph=cytoscape({container:root.current,elements,autoungrabify:true,userPanningEnabled:false,userZoomingEnabled:false,layout:{name:'circle',padding:33},style:[
   {selector:'node',style:{label:'data(label)','background-color':'#609cff',color:theme==='dark'?'#dae8ff':'#142338','font-size':10,width:15,height:15,'text-valign':'bottom','text-margin-y':3}},
   {selector:'edge',style:{width:2,'line-color':'#5a7ba7','curve-style':'bezier'}}
  ]});
  return()=>graph.destroy();
 },[records,theme]);
 return <div className="graph-canvas network-preview" ref={root} role="img" aria-label="Preview of case participant communications"/>;
}
