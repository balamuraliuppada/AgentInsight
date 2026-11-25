import {useState} from 'react';
import {CircleMarker,MapContainer,Polyline,Popup,TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {Form} from 'react-bootstrap';
import {Empty,EvidenceLink,Heading,Panel,dateTime} from '../components/UI.jsx';
import {useWorkspace} from '../context/Workspace.jsx';
import {EvidenceFilters} from './Evidence.jsx';
import {filterRecords} from '../services/searchService.js';
export function Geo(){const {caseId}=useWorkspace();return <GeoView key={caseId}/>;}
function GeoView(){
 const {scoped}=useWorkspace();
 const [filters,setFilters]=useState({}),[tiles,setTiles]=useState(true),[sequence,setSequence]=useState(false);
 const locations=scoped('evidence').filter(e=>e.type==='Location Records');
 const rows=filterRecords(locations,filters).sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
 const position=e=>[e.metadata.latitude,e.metadata.longitude];
 const points=[...new Set(rows.map(e=>position(e).join(',')))];
 return <><Heading title="Geospatial Analysis" description="Inspect synthetic location observations and their source records."/><Panel className="mb-3"><div className="toolbar"><EvidenceFilters records={locations} filters={filters} onChange={(key,value)=>setFilters(previous=>({...previous,[key]:value}))} showType={false}/><Form.Check type="switch" label="Show recorded sequence" checked={sequence} onChange={e=>setSequence(e.target.checked)}/></div></Panel>
 <div className="split"><Panel title="Recorded locations" sub={rows.length+' records · '+points.length+' distinct points'}>{!tiles&&<div className="notice">Base map tiles are unavailable. Recorded coordinates remain visible on the map grid.</div>}{rows.length?<MapContainer center={position(rows[0])} zoom={12} scrollWheelZoom className="map-canvas" attributionControl><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{tileerror:()=>setTiles(false),tileload:()=>setTiles(true)}}/>{points.map(key=>{const matches=rows.filter(e=>position(e).join(',')===key);return <CircleMarker key={key} center={position(matches[0])} radius={9} pathOptions={{color:'#397ef4',fillColor:'#45d9be',opacity:1,fillOpacity:.85}}><Popup><strong>{matches[0].content}</strong>{matches.map(e=><div className="source-card" key={e.id}><EvidenceLink id={e.id}/><div>{dateTime(e.timestamp)}</div></div>)}</Popup></CircleMarker>;})}{sequence&&<Polyline positions={rows.map(position)} pathOptions={{color:'#5e9cff',dashArray:'5 7'}}/>}</MapContainer>:<Empty label="No recorded locations match these filters."/>}<div className="graph-legend"><span><i style={{background:'#45d9be'}}/> Recorded point</span>{sequence&&<span>Dashed line indicates recording order only.</span>}</div></Panel><Panel title="Location timeline">{rows.length?rows.map(e=><div className="source-card" key={e.id}><strong>{e.content}</strong><p>{dateTime(e.timestamp)}</p><small>{position(e).join(', ')} · {e.deviceId}</small><div><EvidenceLink id={e.id}/></div></div>):<Empty/>}</Panel></div></>;
}
