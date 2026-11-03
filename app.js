const STATUS=['Pending','In Progress','Done'],AV=['#f05a28','#8e5bb7','#3b82f6','#10b981','#f59e0b','#ec4899'];
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
let S=JSON.parse(localStorage.tmData||'{"tasks":[],"teams":[],"cats":[],"givenBy":[]}'),editing=null,deferred=null,selCat='',selDay='',warnOnly=false,cm=new Date(new Date().getFullYear(),new Date().getMonth(),1);
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0'),iso=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const av=n=>`<i class="av" style="background:${AV[[...String(n)].reduce((a,c)=>a+c.charCodeAt(0),0)%6]}">${esc(ini(n))}</i>`;
const fmt=s=>{if(!s)return '-';const[p,q,r]=s.split('-');return `${MN[q-1].slice(0,3)} ${r}, ${p}`};

async function api(action,p={}){
  const r=await fetch(CONFIG.API_URL,{method:'POST',body:JSON.stringify({action,key:localStorage.tmKey||'',...p})}).then(r=>r.json());
  if(r.error==='unauthorized'){$('mKey').classList.add('show');throw new Error('Passcode required')}
  if(r.error)throw new Error(r.error);
  S={tasks:r.tasks,teams:r.teams,cats:r.cats,givenBy:r.givenBy};localStorage.tmData=JSON.stringify(S);fill();render();return r;
}
function saveKey(){localStorage.tmKey=$('keyIn').value;closeM('mKey');load()}
async function load(manual){if(manual)toast('Refreshing...');try{await api('bootstrap');if(manual)toast('Updated ✅')}catch(e){toast(navigator.onLine?e.message:'Offline — showing saved data',1)}}
async function act(action,p,msg){try{await api(action,p);if(msg)toast(msg);return true}catch(e){toast(e.message,1);return false}}

/* deadline warning */
function warn(t){
  if(t.status==='Done'||!t.deadline)return null;
  const [y,m,d]=t.deadline.split('-'),n=new Date(),days=Math.round((new Date(y,m-1,d)-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/864e5);
  if(days<0)return{c:'over',txt:`⚠️ Overdue ${-days}d`};
  if(days===0)return{c:'soon',txt:'⚠️ Due today'};
  if(days<=CONFIG.WARN_DAYS)return{c:'soon',txt:`⚠️ ${days}d left`};
  return null;
}

/* render */
function opts(el,vals,first){$(el).innerHTML=(first!=null?`<option value="">${first}</option>`:'')+vals.map(v=>`<option>${esc(v)}</option>`).join('')}
function fill(){
  const k=[$('fA').value,$('fS').value];
  opts('fA',S.teams.map(m=>m.name),'All Managers');opts('fS',STATUS,'Status');$('fA').value=k[0];$('fS').value=k[1];
  opts('fCat',S.cats.map(c=>c.name));opts('fMgr',S.teams.map(m=>m.name));opts('fSt',STATUS);
}
function tasks(){
  const q=$('q').value.toLowerCase(),a=$('fA').value,s=$('fS').value;
  const f=S.tasks.filter(t=>(!selCat||t.category==selCat)&&(!selDay||t.deadline==selDay)&&(!a||t.assignedTo==a)&&(!s||t.status==s)&&(!warnOnly||warn(t))&&(!q||t.taskName.toLowerCase().includes(q)));
  f.sort((x,y)=>(x.status=='Done')-(y.status=='Done')||(x.deadline||'9').localeCompare(y.deadline||'9'));
  $('tcount').textContent=`(${pad(f.length)})`;
  $('chips').innerHTML=(selCat?`<span class="chip" onclick="pickCat('')">🗂 ${esc(selCat)} ✕</span>`:'')+(selDay?`<span class="chip" onclick="pickDay('${selDay}')">📅 ${fmt(selDay)} ✕</span>`:'')+(warnOnly?'<span class="chip" onclick="warnOnly=false;render()">⚠️ Due soon ✕</span>':'');
  $('tlist').innerHTML=f.map((t,i)=>{const w=warn(t);return `<div class="tr ${t.status=='Done'?'dn':''}"><span class="no">${pad(i+1)}</span>
   <span class="tt" onclick="openTask('${t.taskId}')">${esc(t.taskName)}${w?`<span class="wn ${w.c}">${w.txt}</span>`:''}<small>${esc(t.category)} · ${esc(t.assignedTo||'-')}${t.deadline?' · '+fmt(t.deadline):''}${t.givenBy?' · by '+esc(t.givenBy):''}</small></span>
   <button class="ck ${t.status=='Done'?'on':''}" onclick="toggle('${t.taskId}')">✓</button></div>`}).join('')||'<div class="mu" style="padding:16px;text-align:center">No tasks found.</div>';
}
function calendar(){
  const y=cm.getFullYear(),m=cm.getMonth(),first=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),t0=new Date(),today=iso(t0.getFullYear(),t0.getMonth(),t0.getDate());
  $('calTitle').textContent=`${MN[m].slice(0,3)} ${y}`;
  let h=['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="h">${d}</div>`).join('');
  for(let i=0;i<42;i++){
    const dt=new Date(y,m,1-first+i),k=iso(dt.getFullYear(),dt.getMonth(),dt.getDate());
    const dots=S.tasks.filter(t=>t.deadline==k&&t.status!='Done').slice(0,3).map(t=>`<i class="${(warn(t)||{}).c||''}"></i>`).join('');
    h+=`<button class="d ${dt.getMonth()!=m?'o':''} ${k==today?'today':''} ${k==selDay?'sel':''}" onclick="pickDay('${k}')">${dt.getDate()}${dots?`<s>${dots}</s>`:''}</button>`;
    if(i==34&&dt.getMonth()!=m&&new Date(y,m,1-first+35).getMonth()!=m)break;
  }
  $('calGrid').innerHTML=h;
}
function render(){banner();chart();rings();progress();donut();tasks();calendar();upcoming()}
function banner(){
  const T=S.tasks,w=T.filter(t=>(warn(t)||{}).c=='soon').length,o=T.filter(t=>(warn(t)||{}).c=='over').length,c=n=>T.filter(t=>t.status==n).length;
  $('sT').textContent=T.length;$('sI').textContent=c('In Progress');$('sP').textContent=c('Pending');$('sD').textContent=c('Done');$('bellN').textContent=w+o||'';
  $('bnTxt').textContent=w+o?`⚠️ ${w} task${w==1?'':'s'} due soon${o?` and ${o} overdue`:''}. Check them before the deadline.`:'All caught up — no deadlines close right now.';
}
const sm=p=>p.map((q,i)=>i?`C${(p[i-1][0]+q[0])/2},${p[i-1][1]} ${(p[i-1][0]+q[0])/2},${q[1]} ${q[0]},${q[1]}`:`M${q[0]},${q[1]}`).join('');
function chart(){
  const n=new Date(),ms=Array.from({length:7},(_,i)=>{const d=new Date(n.getFullYear(),n.getMonth()-6+i,1);return{k:iso(d.getFullYear(),d.getMonth(),1).slice(0,7),l:MN[d.getMonth()].slice(0,3)}});
  const a=ms.map(m=>S.tasks.filter(t=>(t.date||'').startsWith(m.k)).length),b=ms.map(m=>S.tasks.filter(t=>(t.date||'').startsWith(m.k)&&t.status=='Done').length),mx=Math.max(5,...a);
  const X=i=>30+i*(380/6),Y=v=>140-v/mx*125,pa=a.map((v,i)=>[X(i),Y(v)]),pb=b.map((v,i)=>[X(i),Y(v)]);
  $('chart').innerHTML=`<svg viewBox="0 0 420 170" style="width:100%">${[0,1,2,3].map(i=>`<line x1="30" x2="410" y1="${140-i*125/3}" y2="${140-i*125/3}" stroke="var(--bd)"/><text x="4" y="${144-i*125/3}" font-size="9" fill="var(--mu)">${Math.round(mx*i/3)}</text>`).join('')}
  <path d="${sm(pa)} L410,140 L30,140Z" fill="#7b6ef618"/><path d="${sm(pa)}" fill="none" stroke="#7b6ef6" stroke-width="2.5"/><path d="${sm(pb)}" fill="none" stroke="#4fd08c" stroke-width="2" stroke-dasharray="4 3"/>
  ${pa.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="#7b6ef6"/><text x="${q[0]}" y="158" font-size="9" fill="var(--mu)" text-anchor="middle">${ms[i].l}</text>`).join('')}</svg>
  <div class="legend" style="grid-template-columns:1fr 1fr"><span><i style="background:#7b6ef6"></i>Tasks created</span><span><i style="background:#4fd08c"></i>Completed</span></div>`;
}
function rings(){
  const T=S.tasks,n=T.length||1,v=[['Done','#4fd08c',T.filter(t=>t.status=='Done').length],['In Progress','#5cc3bb',T.filter(t=>t.status=='In Progress').length],['Pending','#f4948a',T.filter(t=>t.status=='Pending').length]];
  $('rings').innerHTML=`<svg viewBox="0 0 160 160" style="width:100%;max-width:170px;display:block;margin:auto">${v.map((x,i)=>{const r=68-i*18,C=2*Math.PI*r;return `<circle cx="80" cy="80" r="${r}" fill="none" stroke="var(--bd)" stroke-width="11"/><circle cx="80" cy="80" r="${r}" fill="none" stroke="${x[1]}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${x[2]/n*C} ${C}" transform="rotate(-90 80 80)"/>`}).join('')}</svg>
  <div class="legend">${v.map(x=>`<span><i style="background:${x[1]}"></i>${x[0]}: ${x[2]} (${Math.round(x[2]/n*100)}%)</span>`).join('')}</div>`;
}
function progress(){
  const cats=S.cats.map(c=>c.name);S.tasks.forEach(t=>{if(t.category&&!cats.includes(t.category))cats.push(t.category)});
  $('prog').innerHTML=cats.map(c=>{const T=S.tasks.filter(t=>t.category==c),d=T.filter(t=>t.status=='Done').length,p=T.length?Math.round(d/T.length*100):0,
   st=T.map(t=>t.date).filter(Boolean).sort()[0],en=T.map(t=>t.deadline).filter(Boolean).sort().pop(),w=T.filter(warn).length;
   return `<div class="pc ${selCat==c?'sel':''}" data-c="${esc(c)}" onclick="pickCat(this.dataset.c)"><small>Ongoing Project${w?` · <span class="wn soon">⚠️ ${w}</span>`:''}</small><b>${esc(c)}</b>
   <div class="bar"><i style="width:${p}%"></i></div><small>${p} % Complete · ${d}/${T.length} tasks</small><div class="d2"><span>Start: ${fmt(st)}</span><span>End: ${fmt(en)}</span></div></div>`}).join('')||'<div class="card">No categories yet.</div>';
}
function donut(){
  const busy=S.teams.filter(m=>S.tasks.some(t=>t.assignedTo==m.name&&t.status!='Done')).length,n=S.teams.length,p=n?Math.round(busy/n*100):0,C=2*Math.PI*58;
  $('donut').innerHTML=`<svg viewBox="0 0 150 150" style="width:100%;max-width:170px;display:block;margin:auto"><circle cx="75" cy="75" r="58" fill="none" stroke="var(--bd)" stroke-width="18"/><circle cx="75" cy="75" r="58" fill="none" stroke="#7b6ef6" stroke-width="18" stroke-linecap="round" stroke-dasharray="${p/100*C} ${C}" transform="rotate(-90 75 75)"/>
  <text x="75" y="75" text-anchor="middle" font-size="24" font-weight="600" fill="var(--tx)">${p}%</text><text x="75" y="93" text-anchor="middle" font-size="10" fill="var(--mu)">Member Working</text></svg>
  <div class="mu" style="text-align:center;margin-top:8px;font-size:12px">${busy} of ${n} members have open tasks <a href="#" onclick="openTeam();return false" style="color:var(--pu)">⚙</a></div>`;
}
function upcoming(){
  const u=S.tasks.filter(t=>t.status!='Done'&&t.deadline).sort((a,b)=>a.deadline.localeCompare(b.deadline)).slice(0,6);
  $('upc').innerHTML=u.map(t=>{const w=warn(t);return `<div class="up ${w?w.c:''}" onclick="openTask('${t.taskId}')"><b>${esc(t.taskName)}</b><small>${esc(t.category)} · ${esc(t.assignedTo||'-')}<br>${fmt(t.deadline)} ${w?`<span class="wn ${w.c}">${w.txt}</span>`:''}</small></div>`}).join('')||'<div class="mu">No upcoming deadlines.</div>';
}
function pickCat(c){selCat=selCat==c?'':c;render()}
function pickDay(k){selDay=selDay==k?'':k;render()}
function mv(n){cm=new Date(cm.getFullYear(),cm.getMonth()+n,1);calendar()}
function go(id){$(id).scrollIntoView({behavior:'smooth'});side(0)}

/* task form */
function givOpts(sel){
  $('fGiv').innerHTML='<option value="">— Select —</option>'+S.givenBy.map(n=>`<option>${esc(n)}</option>`).join('')+'<option value="__new">＋ নতুন নাম যোগ করুন…</option>';
  $('fGiv').value=sel&&S.givenBy.includes(sel)?sel:'';$('fGivNew').style.display='none';$('fGivNew').value='';
  if(sel&&!S.givenBy.includes(sel)){$('fGiv').value='__new';$('fGivNew').style.display='block';$('fGivNew').value=sel}
}
function givChg(){const n=$('fGiv').value=='__new';$('fGivNew').style.display=n?'block':'none';if(n)$('fGivNew').focus()}
function openTask(id){
  if(!S.teams.length){toast('Add a team member first.',1);return openTeam()}
  editing=id?S.tasks.find(t=>t.taskId==id):null;const t=editing||{};
  $('mTitle').textContent=editing?'Edit Task — '+t.taskId:'Create new project/task';$('delBtn').style.display=editing?'':'none';
  $('fName').value=t.taskName||'';$('fCat').value=t.category||selCat||S.cats[0]?.name||'';$('fMgr').value=t.assignedTo||S.teams[0].name;
  $('fDue').value=t.deadline||'';$('fSt').value=t.status||'Pending';givOpts(t.givenBy);$('mTask').classList.add('show');
}
async function saveTask(){
  const name=$('fName').value.trim();if(!name)return toast('Task name is required.',1);
  const givenBy=($('fGiv').value=='__new'?$('fGivNew').value:$('fGiv').value).trim();
  const task={taskId:editing?.taskId,taskName:name,category:$('fCat').value,assignedTo:$('fMgr').value,deadline:$('fDue').value,status:$('fSt').value,givenBy};
  $('saveBtn').disabled=true;if(await act(editing?'updateTask':'addTask',{task},editing?'Updated ✅':'Added ✅'))closeM('mTask');$('saveBtn').disabled=false;
}
function toggle(id){const t=S.tasks.find(x=>x.taskId==id),st=t.status=='Done'?'Pending':'Done';t.status=st;render();act('updateStatus',{taskId:id,status:st},st=='Done'?'Marked done ✅':'Reopened')}
async function delTask(){if(confirm(`Delete "${editing.taskName}"?`)&&await act('deleteTask',{taskId:editing.taskId},'Deleted.'))closeM('mTask')}

/* categories / team */
function listHtml(a,fn){return a.map(x=>`<div class="li"><span>${esc(x.name)}</span><button class="ico" style="width:28px;height:28px;font-size:12px" onclick="${fn}('${x.id}')">🗑️</button></div>`).join('')||'<div class="li">Empty</div>'}
function cl(){$('catList').innerHTML=listHtml(S.cats,'delC');$('teamList').innerHTML=listHtml(S.teams,'delM')}
function openCats(){cl();$('mCats').classList.add('show')}function openTeam(){cl();$('mTeam').classList.add('show')}
async function addItem(action,inp){const v=$(inp).value.trim();if(!v)return;if(await act(action,{name:v},'Added.')){$(inp).value='';cl()}}
async function delC(id){if(confirm('Delete this category?')&&await act('deleteCategory',{id}))cl()}
async function delM(id){if(confirm('Delete this member?')&&await act('deleteTeamMember',{id}))cl()}

/* ui */
function closeM(id){$(id).classList.remove('show')}
function side(o){$('side').classList.toggle('open',!!o);$('scrim').classList.toggle('show',!!o)}
function theme(){document.body.classList.toggle('dark');const d=document.body.classList.contains('dark');localStorage.tmTheme=d?'d':'l';$('themeBtn').textContent=d?'☀️':'🌙'}
function toast(m,err){const t=$('toast');t.textContent=m;t.className='toast show'+(err?' err':'');setTimeout(()=>t.className='toast',3000)}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('installBtn').style.display='block'});
function installApp(){deferred?.prompt();deferred=null;$('installBtn').style.display='none'}
document.querySelectorAll('.ov').forEach(o=>o.addEventListener('click',e=>{if(e.target==o&&o.id!='mKey')o.classList.remove('show')}));
if(localStorage.tmTheme=='d'){document.body.classList.add('dark');$('themeBtn').textContent='☀️'}
$('today').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('dpill').textContent='📅 '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
fill();render();
if(CONFIG.API_URL.startsWith('http'))load();else toast('config.js এ API_URL বসান',1);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
