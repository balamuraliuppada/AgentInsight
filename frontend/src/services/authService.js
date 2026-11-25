import {delay,http,list,mock} from './client.js';
export async function login(email,password){
 if(!mock)return (await http.post('/auth/login',{email,password})).data;
 const user=(await list('users')).find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.active);
 if(!user||password!=='Demo2025!')throw new Error('Check your email and demo password.');
 return user;
}
export async function recover(email){if(!mock)return (await http.post('/auth/forgot-password',{email})).data;await delay();}
export async function reset(password){if(!mock)return (await http.post('/auth/reset-password',{password})).data;await delay();}
