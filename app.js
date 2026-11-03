const STATUS=['Pending','In Progress','Done'],MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const PAGE=6,COLORS=['#03bda9','#c484f3','#64b5f6','#ffd54f','#f05a28','#10b981'];
let S=JSON.parse(localStorage.tmData||'{"tasks":[],"teams":[],"cats":[],"givenBy":[]}'),pg=1,editing=null,chart=null,deferred=null;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function api(action,p={}){
  const r=await fetch(CONFIG.API_URL,{method:'POST',body:JSON.stringify({action,key:localStorage.tmKey||'',...p})}).then(r=>r.json());
  if(r.error==='unauthorized'){$('mKey').classList.add('show');throw new Error('Passcode required')}
  if(r.error)throw new Error(r.error);
  S={tasks:r.tasks,teams:r.teams,cats:r.cats,givenBy:r.givenBy};localStorage.tmData=JSON.stringify(S);
  fill();render();return r;
}
function saveKey(){localStorage.tmKey=$('keyIn').value;closeM('mKey');load()}
async function load(manual){
  if(manual)toast('Refreshing...');
  try{await api('bootstrap');if(manual)toast('Updated ✅')}catch(e){toast(navigator.onLine?e.message:'Offline — showing saved data',1)}
}
async function act(action,p,msg){try{await api(action,p);if(msg)toast(msg);return true}catch(e){toast(e.message,1);return false}}

/* ---------- deadline warning ---------- */
function warn(t){
  if(t.status==='Done'||!t.deadline)return null;
  const [y,m,d]=t.deadline.split('-'),n=new Date(),days=Math.round((new Date(y,m-1,d)-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/864e5);
  if(days<0)return{c:'over',txt:`⚠️ Overdue ${-days}d`};
  if(days===0)return{c:'soon',txt:'⚠️ Due today'};
  if(days<=CONFIG.WARN_DAYS)return{c:'soon',txt:`⚠️ ${days}d left`};
  return null;
}
const fmt=s=>{if(!s)return '-';const[p,q,r]=s.split('-');return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][q-1]} ${r}, ${p}`};

/* ---------- render ---------- */
function opts(el,vals,first){$(el).innerHTML=(first!=null?`<option value="">${first}</option>`:'')+vals.map(v=>`<option>${esc(v)}</option>`).join('')}
function fill(){
  const keep=['fM','fC','fA','fS'].map(i=>$(i).value);
  opts('fM',MONTHS,'All Month');opts('fC',S.cats.map(c=>c.name),'All Categories');opts('fA',S.teams.map(m=>m.name),'All Managers');opts('fS',STATUS,'Status');
  ['fM','fC','fA','fS'].forEach((i,k)=>$(i).value=keep[k]);
  opts('fCat',S.cats.map(c=>c.name));opts('fMgr',S.teams.map(m=>m.name));opts('fSt',STATUS);
  $('sideTeam').innerHTML=S.teams.map(m=>`<div class="mem">👤 ${esc(m.name)}</div>`).join('')||'<div class="mem">No members</div>';
}
function render(){
  const T=S.tasks,q=$('q').value.toLowerCase();
  $('sT').textContent=T.length;$('sP').textContent=T.filter(t=>t.status=='Pending').length;
  $('sI').textContent=T.filter(t=>t.status=='In Progress').length;$('sD').textContent=T.filter(t=>t.status=='Done').length;
  $('sW').textContent=T.filter(warn).length;
  const f=T.filter(t=>(!$('fM').value||t.month==$('fM').value)&&(!$('fC').value||t.category==$('fC').value)&&(!$('fA').value||t.assignedTo==$('fA').value)&&(!$('fS').value||t.status==$('fS').value)&&(!q||t.taskName.toLowerCase().includes(q)));
  const ord={'In Progress':1,Pending:2,Done:3};
  f.sort((a,b)=>(ord[a.status]||4)-(ord[b.status]||4)||(warn(b)?1:0)-(warn(a)?1:0)||(a.deadline||'9').localeCompare(b.deadline||'9'));
  const pages=Math.max(1,Math.ceil(f.length/PAGE));pg=Math.min(pg,pages);
  $('list').innerHTML='<div class="trow head"><span>Name</span><span>Manager</span><span>Date</span><span>Deadline</span><span>Status</span><span>Given By</span><span></span></div>'+
  (f.slice((pg-1)*PAGE,pg*PAGE).map(t=>{const w=warn(t);return `<div class="trow ${w?(w.c=='over'?'late':'near'):''}">
   <span><div class="tn">${esc(t.taskName)}</div><div class="tc">${esc(t.category)}</div></span><span>👤 ${esc(t.assignedTo||'-')}</span><span>${fmt(t.date)}</span>
   <span>${fmt(t.deadline)}${w?`<br><span class="wn ${w.c}">${w.txt}</span>`:''}</span>
   <span><span class="badge ${t.status.replace(/ /g,'-')}">${esc(t.status)}</span></span><span>${esc(t.givenBy||'-')}</span>
   <span class="ab"><button onclick="openTask('${t.taskId}')">✏️</button><button onclick="del('${t.taskId}')">🗑️</button>${t.status!='Done'?`<button class="ok" onclick="done('${t.taskId}')">✔</button>`:''}</span></div>`}).join('')||'<div style="padding:20px;text-align:center;color:var(--mu)">No tasks found.</div>');
  $('pager').innerHTML=pages>1?Array.from({length:pages},(_,i)=>`<button class="${i+1==pg?'on':''}" onclick="pg=${i+1};render()">${i+1}</button>`).join(''):'';
  pie();
}
function pie(){
  const m={};S.tasks.forEach(t=>{const p=t.assignedTo||'Unassigned';m[p]=m[p]||{n:p,t:0,d:0};m[p].t++;if(t.status=='Done')m[p].d++});
  const L=Object.values(m).sort((a,b)=>b.d-a.d),none=!L.some(x=>x.d);
  $('legend').innerHTML=L.map((s,i)=>`<div class="lg"><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${COLORS[i%6]};margin-right:8px"></i>${esc(s.n)}</span><span style="color:var(--mu)">${s.d}/${s.t} (${Math.round(s.d/s.t*100)}%)</span></div>`).join('');
  const d={labels:none?['No tasks done yet']:L.map(x=>x.n),datasets:[{data:none?[1]:L.map(x=>x.d),backgroundColor:none?['#e5e7eb']:COLORS,borderWidth:3,borderColor:getComputedStyle(document.body).getPropertyValue('--card')}]};
  if(!window.Chart)return;
  if(chart){chart.data=d;chart.update()}else chart=new Chart($('pie'),{type:'doughnut',data:d,options:{maintainAspectRatio:false,cutout:'60%',plugins:{legend:{display:false}}}});
}

/* ---------- task form ---------- */
function givOpts(sel){
  $('fGiv').innerHTML='<option value="">— Select —</option>'+S.givenBy.map(n=>`<option>${esc(n)}</option>`).join('')+'<option value="__new">＋ নতুন নাম যোগ করুন…</option>';
  $('fGiv').value=sel&&S.givenBy.includes(sel)?sel:'';$('fGivNew').style.display='none';$('fGivNew').value='';
  if(sel&&!S.givenBy.includes(sel)){$('fGiv').value='__new';$('fGivNew').style.display='block';$('fGivNew').value=sel}
}
function givChg(){const n=$('fGiv').value=='__new';$('fGivNew').style.display=n?'block':'none';if(n)$('fGivNew').focus()}
function openTask(id){
  if(!S.teams.length){toast('Add a team member first.',1);return openTeam()}
  editing=id?S.tasks.find(t=>t.taskId==id):null;const t=editing||{};
  $('mTitle').textContent=editing?'Edit Task — '+t.taskId:'Create new project/task';
  $('fName').value=t.taskName||'';$('fCat').value=t.category||S.cats[0]?.name||'';$('fMgr').value=t.assignedTo||S.teams[0].name;
  $('fDue').value=t.deadline||'';$('fSt').value=t.status||'Pending';givOpts(t.givenBy);$('mTask').classList.add('show');
}
async function saveTask(){
  const name=$('fName').value.trim();if(!name)return toast('Task name is required.',1);
  const givenBy=($('fGiv').value=='__new'?$('fGivNew').value:$('fGiv').value).trim();
  const task={taskId:editing?.taskId,taskName:name,category:$('fCat').value,assignedTo:$('fMgr').value,deadline:$('fDue').value,status:$('fSt').value,givenBy};
  $('saveBtn').disabled=true;
  if(await act(editing?'updateTask':'addTask',{task},editing?'Updated ✅':'Added ✅'))closeM('mTask');
  $('saveBtn').disabled=false;
}
function done(id){const t=S.tasks.find(x=>x.taskId==id);t.status='Done';render();act('updateStatus',{taskId:id,status:'Done'},'Marked done ✅')}
function del(id){const t=S.tasks.find(x=>x.taskId==id);if(confirm(`Delete "${t.taskName}"?`))act('deleteTask',{taskId:id},'Deleted.')}

/* ---------- categories / team ---------- */
function listHtml(arr,fn){return arr.map(x=>`<div class="li"><span>${esc(x.name)}</span><button class="ico" style="width:28px;height:28px;font-size:12px" onclick="${fn}('${x.id}')">🗑️</button></div>`).join('')||'<div class="li">Empty</div>'}
function openCats(){cl();$('mCats').classList.add('show')}
function cl(){$('catList').innerHTML=listHtml(S.cats,'delC');$('teamList').innerHTML=listHtml(S.teams,'delM')}
function openTeam(){cl();$('mTeam').classList.add('show')}
async function addItem(action,inp){const v=$(inp).value.trim();if(!v)return;if(await act(action,{name:v},'Added.')){$(inp).value='';cl()}}
async function delC(id){if(confirm('Delete this category?')&&await act('deleteCategory',{id}))cl()}
async function delM(id){if(confirm('Delete this member?')&&await act('deleteTeamMember',{id}))cl()}

/* ---------- ui ---------- */
function closeM(id){$(id).classList.remove('show')}
function side(o){$('side').classList.toggle('open',!!o);$('scrim').classList.toggle('show',!!o)}
function theme(){document.body.classList.toggle('dark');localStorage.tmTheme=document.body.classList.contains('dark')?'d':'l';$('themeBtn').textContent=document.body.classList.contains('dark')?'☀️':'🌙';if(chart){chart.destroy();chart=null;pie()}}
function toast(m,err){const t=$('toast');t.textContent=m;t.className='toast show'+(err?' err':'');setTimeout(()=>t.className='toast',3000)}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('installBtn').style.display='block'});
function installApp(){deferred?.prompt();deferred=null;$('installBtn').style.display='none'}
document.querySelectorAll('.ov').forEach(o=>o.addEventListener('click',e=>{if(e.target==o&&o.id!='mKey')o.classList.remove('show')}));

if(localStorage.tmTheme=='d'){document.body.classList.add('dark');$('themeBtn').textContent='☀️'}
const h=new Date().getHours();$('greet').textContent=`${h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, ${CONFIG.USER_NAME} ${h<12?'☀️':h<18?'🌤️':'🌙'}`;
fill();render();
if(CONFIG.API_URL.startsWith('http'))load();else toast('config.js এ API_URL বসান',1);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
