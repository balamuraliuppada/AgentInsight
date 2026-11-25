import {useState} from 'react';
import {Button,Form} from 'react-bootstrap';
import {Link,useNavigate} from 'react-router-dom';
import {Brand} from '../components/Layout.jsx';
import {useWorkspace} from '../context/Workspace.jsx';
import {recover,reset} from '../services/authService.js';
export default function Auth({mode='login'}){
 const {signIn}=useWorkspace(),navigate=useNavigate();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 const titles={login:'Sign in to your workspace',forgot:'Recover your account',reset:'Reset your password',unauthorized:'Access restricted',missing:'Page not found'};
 const form=['login','forgot','reset'].includes(mode);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{if(mode==='login'){await signIn(email,password);navigate('/');}else if(mode==='forgot'){await recover(email);setDone(true);}else{await reset(password);setDone(true);}}catch(err){setError(err.message);}finally{setBusy(false);}}
 return <div className="auth-page"><div className="auth-card panel"><Brand/><h1>{titles[mode]}</h1><p>AI-Powered Digital Forensic Intelligence</p>{form?<Form onSubmit={submit}>{mode!=='reset'&&<Form.Group className="mb-3"><Form.Label>Email address</Form.Label><Form.Control required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@agentinsight.demo"/></Form.Group>}{mode!=='forgot'&&<Form.Group className="mb-3"><Form.Label>{mode==='reset'?'New password':'Password'}</Form.Label><Form.Control required type="password" minLength={mode==='reset'?8:undefined} value={password} onChange={e=>setPassword(e.target.value)}/></Form.Group>}{error&&<p role="alert" className="text-danger">{error}</p>}{done&&<p role="status">{mode==='forgot'?'Recovery request simulated. No email was sent.':'Password reset simulated. Demo credentials still apply.'}</p>}<Button type="submit" disabled={busy} className="w-100">{busy?'Please wait…':mode==='login'?'Sign in':mode==='forgot'?'Request reset':'Reset password'}</Button><div className="auth-links">{mode==='login'?<Link to="/forgot-password">Forgot password?</Link>:<Link to={done&&mode==='forgot'?'/reset-password':'/login'}>{done&&mode==='forgot'?'Open demo reset form':'Back to sign in'}</Link>}</div></Form>:<Link to="/">Return to dashboard</Link>}{mode==='login'&&<div className="demo-signin"><small>DEMO ACCESS</small>{['admin','investigator','reviewer'].map(role=><button className="btn btn-outline-secondary" key={role} onClick={()=>{setEmail(role+'@agentinsight.demo');setPassword('Demo2025!');}}>{role}</button>)}</div>}</div></div>;
}
