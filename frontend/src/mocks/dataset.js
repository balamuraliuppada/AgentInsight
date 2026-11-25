export const types = ['Chat Messages','Call Logs','SMS','Contacts','Emails','Browser History','Location Records','Media Metadata','Application Records','Device Information'];
const names = [
 'Aditi Rao','Rohan Mehta','Meera Iyer','Kabir Shah',
 'Ananya Reddy','Arjun Menon','Nisha Kulkarni','Vikram Joshi',
 'Ishita Sen','Dev Mukherjee','Tanvi Bose','Neel Banerjee',
 'Priya Nair','Karthik Pillai','Diya Thomas','Aman Varghese',
 'Sneha Patil','Aditya Deshmukh','Kavya Gokhale','Siddharth Jadhav'
];
const investigators = ['Anika Sharma','Ravi Verma','Farah Khan'];
const cities = ['Visakhapatnam','Hyderabad','Kolkata','Kochi','Pune'];
const phones = names.map((_,i)=>'+91 98XXX '+String(41001+i));
const titles = ['Operation Meridian','Project Nightfall','Case Horizon','Operation Cipher','Routine Device Review'];
const categories = ['Financial Fraud','Phishing & Cybercrime','Online Harassment','Corporate Data Leakage','Normal Digital Activity'];
export const cases = titles.map((title,i)=>({id:'CASE-2025-00'+(i+1),title,category:categories[i],status:['Under Investigation','Open','Pending Review','Under Investigation','Closed'][i],priority:['High','Critical','Medium','High','Low'][i],created:'2025-05-'+(10+i),updated:'2025-06-'+(10+i),description:'Synthetic investigation for '+categories[i].toLowerCase()+'.',city:cities[i],investigators:[investigators[0]],notes:''}));
export const users = ['Administrator','Investigator','Reviewer'].map((role,i)=>({id:'USR-'+(i+1),name:investigators[i],email:['admin','investigator','reviewer'][i]+'@agentinsight.demo',role,active:true,cases:cases.map(c=>c.id)}));
export const devices = cases.flatMap((c,i)=>['Android handset','iOS handset'].map((name,j)=>({id:'DEV-'+(i*2+j+1),name,caseId:c.id})));
const counts=[40,16,10,6,6,8,6,4,4,2];
const apps=['Signal','Phone','Messages','Contacts','Mail','Chrome','Maps','Camera','Files','System'];
const everyday=['Meet by the library after lunch.','The shared schedule is up to date.','Thanks, I received the document.','I will check the cafe hours.'];
const scenario=['I sent the transfer receipt for ₹18,500 via UPI for demo account AC-101.','Please review the sample email and its demo sign-in link.','Please stop sending messages to this account.','I moved the sample document into the shared folder.','I picked up the library books.'];
const places = [
 [[17.7145,83.3237,'RK Beach'],[17.7651,83.3756,'Kailasagiri'],[17.7820,83.3853,'Indira Gandhi Zoological Park']],
 [[17.3616,78.4747,'Charminar'],[17.3700,78.4808,'Salar Jung Museum'],[17.3598,78.4716,'Chowmahalla Palace']],
 [[22.5448,88.3426,'Victoria Memorial'],[22.5580,88.3509,'Indian Museum'],[22.5646,88.3433,'Eden Gardens']],
 [[9.9664,76.2426,'Fort Kochi Beach'],[9.9659,76.2420,'St. Francis Church'],[9.9580,76.2593,'Mattancherry Palace']],
 [[18.5196,73.8553,'Shaniwar Wada'],[18.5061,73.8479,'Saras Baug'],[18.5118,73.8543,'Raja Dinkar Kelkar Museum']]
];
const indiaTime = timestamp => new Date(Date.parse(timestamp)+330*60_000).toISOString().replace('Z','+05:30');
export const evidence=cases.flatMap((c,i)=>types.flatMap((type,t)=>Array.from({length:counts[t]},(_,j)=>{
 const id='EV-'+(i+1)+'-'+String(t+1).padStart(2,'0')+'-'+String(j+1).padStart(3,'0');
 const timestamp=new Date(Date.UTC(2025,5,1+(j*3+t)%14,8+(j+t)%12,(j*7+t)%60)).toISOString();
 const participants=[names[i*4+j%4],names[i*4+(j+1+(t===3?0:j%2))%4]];
 const participantIds=participants.map(name=>'PER-'+(names.indexOf(name)+1));
 const location=t===6?places[i][j%3]:null;
 const [senderPhone,recipientPhone]=participants.map(name=>phones[names.indexOf(name)]);
 const phoneEntries=t===3?[{name:participants[1],number:recipientPhone}]:[0,1,2].includes(t)?participants.map((name,index)=>({name,number:[senderPhone,recipientPhone][index]})):[];
 const originalTimestamp=indiaTime(timestamp);
 const content=[j%7===0?scenario[i]:everyday[j%4],j%3===0?'Incoming call · 124 seconds':'Outgoing call · 48 seconds',everyday[j%4],participants[1]+' · '+recipientPhone,'Subject: '+(j===0?scenario[i]:'Project coordination'), 'https://example.org/'+['reference','calendar','resources'][j%3],location ? location[2]+', '+cities[i] : undefined,'IMG_'+(100+j)+'.jpg · EXIF metadata','Opened demo-notes-'+j+'.txt','Registered '+(j%2?'iOS':'Android')+' device'][t];
 return {id,caseId:c.id,deviceId:devices[i*2+j%2].id,type,application:apps[t],participants,participantIds,content,timestamp,originalTimestamp,sourceFile:'extraction-'+(i+1)+'-'+(j%2+1)+'.json',originalRecordId:apps[t].toLowerCase()+'-'+(j+1),metadata:{origin:'Synthetic fixture',direction:j%2?'Outgoing':'Incoming',...(phoneEntries.length?{phoneEntries}:{}),...(location?{latitude:location[0],longitude:location[1],city:cities[i],country:'India'}:{}),...(t===4?{sender:participants[0].toLowerCase().replace(' ','.')+'@example.org',organization:['Meridian Studio','Nightfall Research','Horizon Library','Cipher Workshop','Civic Archive'][i]}:{})}};
})));
export const findings=cases.flatMap(c=>evidence.filter(e=>e.caseId===c.id&&e.type===types[0]).slice(0,3).map((e,j)=>({id:'F-'+e.id,caseId:c.id,title:['Review message content','Verify conversation reference','Document background activity'][j],description:e.content,evidenceIds:[e.id],source:'Investigator',status:j===0?'Investigator Verified':'Pending Human Review',notes:'',created:e.timestamp,history:[]})));
export const uploads=cases.flatMap((c,i)=>[1,2].map((j)=>{const file='extraction-'+(i+1)+'-'+j+'.json';return {id:'IMP-'+i+'-'+j,caseId:c.id,name:file,type:'JSON',size:524288+i*10240+j*4096,hash:'',status:'Processed',date:'2025-06-01',count:evidence.filter(e=>e.caseId===c.id&&e.sourceFile===file).length};}));
export const audits=cases.flatMap(c=>evidence.filter(e=>e.caseId===c.id).slice(0,10).map((e,j)=>({id:'AUD-'+e.id,time:e.timestamp,user:users[j%3].name,caseId:c.id,action:['Evidence viewed','Search executed','Evidence reviewed','Case opened','Source inspected'][j%5],resource:e.id,status:'Success',details:'Synthetic investigation activity'})));
