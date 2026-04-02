// ── State ─────────────────────────────────────────────────────────────────────
const S={
  user:JSON.parse(localStorage.getItem('sm_user')||'null'),
  theme:localStorage.getItem('sm_theme')||'dark',
  chat:null,       // {id,name,type:'direct'|'group'}
  pollId:null,
  lastMsgId:null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const $=id=>document.getElementById(id);
const ce=(tag,cls='',html='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html)e.innerHTML=html;return e;};
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const myId=()=>S.user?.id||S.user?._id||'';

function ago(d){
  const diff=Date.now()-new Date(d);
  const m=Math.floor(diff/60000),h=Math.floor(m/60),dy=Math.floor(h/24);
  if(dy>0)return`${dy}d`;if(h>0)return`${h}h`;if(m>0)return`${m}m`;return'ahora';
}
function fmtT(d){return new Date(d).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});}
function storyLeft(d){
  const ms=86400000-(Date.now()-new Date(d));
  if(ms<=0)return'expirada';
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  return h>0?`${h}h ${m}m`:`${m}m`;
}

let _tt;
function toast(msg,type=''){
  const t=$('toast');t.textContent=msg;t.className=`on ${type}`;
  clearTimeout(_tt);_tt=setTimeout(()=>t.className='',2500);
}

function avHtml(u,size='md'){
  const sz=size==='lg'?80:size==='sm'?36:44;
  const cls=size==='lg'?'av-lg':size==='sm'?'av-sm':'av';
  const clsPh=size==='lg'?'av-lg-ph':size==='sm'?'av-sm-ph':'av-ph';
  if(u?.avatar)return`<img class="${cls}" src="${esc(u.avatar)}" alt=""/>`;
  return`<div class="${clsPh}">${(u?.username||'?')[0].toUpperCase()}</div>`;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(t){
  document.body.classList.toggle('light',t==='light');
  S.theme=t;localStorage.setItem('sm_theme',t);
  const icon=$('theme-icon');
  if(icon)icon.innerHTML=t==='dark'
    ?'<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
    :'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}
function toggleTheme(){applyTheme(S.theme==='dark'?'light':'dark');}

// ── Navigation ────────────────────────────────────────────────────────────────
function nav(sec){
  document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('on',s.id==='sec-'+sec));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.sec===sec));
  stopPoll();
  if(sec==='chats')   loadConvs();
  if(sec==='groups')  loadGroups();
  if(sec==='stories') loadStories();
  if(sec==='notes')   loadNotes();
  if(sec==='settings')loadSettings();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(id){$(id).classList.add('on');}
function closeModal(id){$(id).classList.remove('on');}

// ── Polling ───────────────────────────────────────────────────────────────────
function startPoll(){
  stopPoll();
  S.pollId=setInterval(async()=>{
    if(!S.chat)return;
    const res=S.chat.type==='direct'?await API.getChat(S.chat.id):await API.getGroupMsgs(S.chat.id);
    if(!res?.ok)return;
    const msgs=res.data.messages||[];
    if(!msgs.length)return;
    const lid=msgs[msgs.length-1]._id;
    if(lid!==S.lastMsgId){S.lastMsgId=lid;renderMsgs(msgs);}
  },3000);
}
function stopPoll(){if(S.pollId){clearInterval(S.pollId);S.pollId=null;}}

// ── CHATS ─────────────────────────────────────────────────────────────────────
async function loadConvs(){
  const list=$('conv-list');
  list.innerHTML='<div class="empty"><p>Cargando...</p></div>';
  const res=await API.getConvs();
  list.innerHTML='';
  if(!res?.ok||!res.data.length){
    list.innerHTML='<div class="empty"><div class="icon">💬</div><h3>Sin conversaciones</h3><p>Toca el botón + para buscar un usuario</p></div>';
    return;
  }
  res.data.forEach(c=>{
    const item=ce('div','item');
    item.innerHTML=`${avHtml(c.user)}
      <div class="item-info">
        <div class="item-name">${esc(c.user.username)}</div>
        <div class="item-sub">${c.lastMessage?.type!=='text'?'📎 Archivo':esc(c.lastMessage?.content?.slice(0,40)||'')}</div>
      </div>
      <div class="item-meta">
        <span class="item-time">${ago(c.lastMessage?.createdAt)}</span>
        ${c.unread>0?`<span class="badge">${c.unread}</span>`:''}
      </div>`;
    item.onclick=()=>openChat(c.user._id,c.user.username,'direct');
    list.appendChild(item);
  });
}

function openChat(id,name,type){
  S.chat={id,name,type};S.lastMsgId=null;
  $('chat-name').textContent=name;
  $('chat-sub').textContent=type==='group'?'Grupo':'Chat privado';
  $('chat-av').innerHTML=type==='group'
    ?`<div class="av-ph">${name[0].toUpperCase()}</div>`
    :avHtml({username:name});
  $('chat-msgs').innerHTML='<div class="empty"><p>Cargando...</p></div>';
  $('chat-screen').classList.add('on');
  fetchMsgs();
  if(type==='direct')API.markRead(id);
  startPoll();
}

function closeChat(){
  $('chat-screen').classList.remove('on');
  S.chat=null;stopPoll();
  loadConvs();loadGroups();
}

async function fetchMsgs(){
  if(!S.chat)return;
  const res=S.chat.type==='direct'?await API.getChat(S.chat.id):await API.getGroupMsgs(S.chat.id);
  if(!res?.ok)return;
  const msgs=res.data.messages||[];
  if(msgs.length)S.lastMsgId=msgs[msgs.length-1]._id;
  renderMsgs(msgs);
}

function renderMsgs(msgs){
  const area=$('chat-msgs');
  const atBot=area.scrollHeight-area.clientHeight-area.scrollTop<80;
  area.innerHTML='';
  if(!msgs.length){area.innerHTML='<div class="empty"><div class="icon">💬</div><p>Sin mensajes aún</p></div>';return;}
  const me=myId();
  msgs.forEach((msg,i)=>{
    const sid=msg.sender?._id||msg.sender;
    const isMe=sid===me;
    const prev=i>0?(msgs[i-1].sender?._id||msgs[i-1].sender):null;
    const grpStart=sid!==prev;
    if(grpStart){
      const grp=ce('div',`mg ${isMe?'me':'them'}`);
      if(S.chat.type==='group'&&!isMe){
        const n=ce('div','mg-name');n.textContent=msg.sender?.username||'';grp.appendChild(n);
      }
      const b=ce('div','bubble');b.textContent=msg.content;grp.appendChild(b);
      const t=ce('div','msg-time');t.textContent=fmtT(msg.createdAt);grp.appendChild(t);
      area.appendChild(grp);
    }else{
      const last=area.lastElementChild;
      const t=last?.querySelector('.msg-time');
      const b=ce('div','bubble');b.textContent=msg.content;
      if(t)last.insertBefore(b,t);else last?.appendChild(b);
    }
  });
  if(atBot)area.scrollTop=area.scrollHeight;
}

async function sendMsg(){
  const ta=$('msg-ta');
  const content=ta.value.trim();
  if(!content||!S.chat)return;
  ta.value='';ta.style.height='auto';
  const res=S.chat.type==='direct'
    ?await API.sendMsg(S.chat.id,content)
    :await API.sendGroupMsg(S.chat.id,content);
  if(res?.ok)fetchMsgs();
  else toast('Error al enviar','err');
}

// Search modal for new chat
let _st;
async function onSearch(){
  clearTimeout(_st);
  const q=$('search-q').value.trim();
  const res=$('search-res');
  if(!q){res.innerHTML='';return;}
  _st=setTimeout(async()=>{
    // search by username OR email
    const r=await API.searchUsers(q);
    res.innerHTML='';
    if(!r?.ok||!r.data.length){res.innerHTML='<p style="color:var(--muted);font-size:.83rem;padding:.5rem 0">Sin resultados para "'+esc(q)+'"</p>';return;}
    r.data.forEach(u=>{
      const item=ce('div','item');
      item.style.cursor='pointer';
      item.innerHTML=`${avHtml(u)}<div class="item-info"><div class="item-name">${esc(u.username)}</div><div class="item-sub">${esc(u.bio||u.email||'')}</div></div>`;
      item.onclick=()=>{closeModal('modal-search');openChat(u._id,u.username,'direct');};
      res.appendChild(item);
    });
  },350);
}

// ── GROUPS ────────────────────────────────────────────────────────────────────
async function loadGroups(){
  const list=$('group-list');
  list.innerHTML='<div class="empty"><p>Cargando...</p></div>';
  const res=await API.getGroups();
  list.innerHTML='';
  if(!res?.ok||!res.data.length){
    list.innerHTML='<div class="empty"><div class="icon">👥</div><h3>Sin grupos</h3><p>Toca + para crear uno</p></div>';
    return;
  }
  res.data.forEach(g=>{
    const item=ce('div','item');
    item.innerHTML=`<div class="av-ph">${g.name[0].toUpperCase()}</div>
      <div class="item-info">
        <div class="item-name">${esc(g.name)}</div>
        <div class="item-sub">${g.members.length} miembro${g.members.length!==1?'s':''}</div>
      </div>`;
    item.onclick=()=>openChat(g._id,g.name,'group');
    list.appendChild(item);
  });
}

async function createGroup(){
  const name=$('g-name').value.trim();
  const desc=$('g-desc').value.trim();
  if(!name)return toast('El nombre es obligatorio','err');
  const res=await API.createGroup(name,desc,[]);
  if(res?.ok){
    closeModal('modal-group');
    $('g-name').value='';$('g-desc').value='';
    toast('Grupo creado','ok');
    loadGroups();
    openChat(res.data._id,res.data.name,'group');
  }else toast(res?.data?.message||'Error','err');
}

// Add member search
let _amt;
async function onAddMember(){
  clearTimeout(_amt);
  const q=$('add-m-q').value.trim();
  const res=$('add-m-res');
  if(!q){res.innerHTML='';return;}
  _amt=setTimeout(async()=>{
    const r=await API.searchUsers(q);
    res.innerHTML='';
    if(!r?.ok||!r.data.length){res.innerHTML='<p style="color:var(--muted);font-size:.83rem;padding:.5rem 0">Sin resultados</p>';return;}
    r.data.forEach(u=>{
      const item=ce('div','item');
      item.innerHTML=`${avHtml(u)}<div class="item-info"><div class="item-name">${esc(u.username)}</div><div class="item-sub">${esc(u.bio||'')}</div></div>`;
      item.onclick=async()=>{
        if(!S.chat)return;
        const rv=await API.addMember(S.chat.id,u._id);
        if(rv?.ok){toast(`${u.username} agregado`,'ok');closeModal('modal-add-member');loadGroups();}
        else toast(rv?.data?.message||'Error','err');
      };
      res.appendChild(item);
    });
  },350);
}

async function leaveGroup(){
  if(!S.chat||S.chat.type!=='group')return;
  if(!confirm(`¿Salir del grupo "${S.chat.name}"?`))return;
  const res=await API.leaveGroup(S.chat.id);
  if(res?.ok){toast('Saliste del grupo','ok');closeChat();}
  else toast(res?.data?.message||'Error','err');
}

// ── STORIES ───────────────────────────────────────────────────────────────────
const COLORS=['#7b68ee','#ee68a4','#f7a54a','#68eeb8','#68b4ee','#c468ee','#ee6868'];
let selColor=COLORS[0];

async function loadStories(){
  const grid=$('stories-grid');
  grid.innerHTML='<div class="empty"><p>Cargando...</p></div>';
  const res=await API.getStories();
  grid.innerHTML='';
  if(!res?.ok||!res.data.length){
    grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="icon">📖</div><h3>Sin historias</h3><p>Toca + para publicar</p></div>';
    return;
  }
  const me=myId();
  res.data.forEach(s=>{
    const card=ce('div','story-card');
    const isOwner=(s.author?._id||s.author)===me;
    card.innerHTML=`<div class="sc-bg" style="background:${s.bgColor||COLORS[0]}">
      ${s.type==='text'?`<div class="sc-txt">${esc(s.content)}</div>`:`<img class="sc-img" src="${esc(s.content)}" alt=""/>`}
    </div>
    <div class="sc-footer">
      ${avHtml(s.author,'sm')}
      <div><div class="sc-author">${esc(s.author?.username||'')}</div><div class="sc-time">⏱ ${storyLeft(s.createdAt)}</div></div>
      ${isOwner?`<button onclick="delStory('${s._id}',event)" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,.7);font-size:.9rem;cursor:pointer;padding:4px">✕</button>`:''}
    </div>`;
    grid.appendChild(card);
  });
}

function openStoryModal(){
  selColor=COLORS[0];
  $('story-txt').value='';
  renderColors();
  openModal('modal-story');
}

function renderColors(){
  const wrap=$('color-pick');wrap.innerHTML='';
  COLORS.forEach(c=>{
    const b=ce('button',`col-btn${c===selColor?' sel':''}`);
    b.style.background=c;b.title=c;
    b.onclick=()=>{selColor=c;renderColors();};
    wrap.appendChild(b);
  });
}

async function createStory(){
  const content=$('story-txt').value.trim();
  if(!content)return toast('Escribe algo','err');
  const res=await API.createStory(content,'text',selColor);
  if(res?.ok){closeModal('modal-story');toast('Historia publicada','ok');loadStories();}
  else toast(res?.data?.message||'Error','err');
}

async function delStory(id,e){
  e.stopPropagation();
  const res=await API.deleteStory(id);
  if(res?.ok){toast('Historia eliminada','ok');loadStories();}
}

// ── NOTES ─────────────────────────────────────────────────────────────────────
async function loadNotes(){
  const feed=$('notes-feed');
  feed.innerHTML='<div style="padding:1rem;color:var(--muted);font-size:.83rem">Cargando...</div>';
  const res=await API.getNotes();
  feed.innerHTML='';
  const notes=res?.data?.notes||[];
  if(!notes.length){feed.innerHTML='<div style="padding:1rem;color:var(--muted);font-size:.83rem">Sin notas aún.</div>';return;}
  const me=myId();
  notes.forEach(n=>{
    const card=ce('div','note-card');
    const isOwner=(n.author?._id||n.author)===me;
    card.innerHTML=`<div class="note-hdr">
      ${avHtml(n.author,'sm')}
      <span class="note-user">${esc(n.author?.username||'')}</span>
      <span class="note-time">${ago(n.createdAt)}</span>
      ${isOwner?`<button class="note-del" onclick="delNote('${n._id}')">✕</button>`:''}
    </div>
    <div class="note-body">${esc(n.content)}</div>`;
    feed.appendChild(card);
  });
}

async function publishNote(){
  const ta=$('note-ta');
  const content=ta.value.trim();
  if(!content)return;
  const res=await API.createNote(content);
  if(res?.ok){ta.value='';toast('Nota publicada','ok');loadNotes();}
  else toast(res?.data?.message||'Error','err');
}

async function delNote(id){
  const res=await API.deleteNote(id);
  if(res?.ok){toast('Nota eliminada','ok');loadNotes();}
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
async function loadSettings(){
  const res=await API.getMe();
  if(!res?.ok)return;
  const u=res.data;
  S.user={...S.user,...u,id:u._id};
  localStorage.setItem('sm_user',JSON.stringify(S.user));

  // Profile card
  $('prof-av').innerHTML=u.avatar
    ?`<img class="av-lg" src="${esc(u.avatar)}" alt=""/>`
    :`<div class="av-lg-ph">${u.username[0].toUpperCase()}</div>`;
  $('prof-name').textContent=u.username;
  $('prof-email').textContent=u.email;
  $('prof-since').textContent='Miembro desde '+new Date(u.createdAt).toLocaleDateString('es');

  // pre-fill edit form
  $('edit-username').value=u.username||'';
  $('edit-bio').value=u.bio||'';
}

function openEditProfile(){openModal('modal-edit');}

async function saveProfile(){
  const username=$('edit-username').value.trim();
  const bio=$('edit-bio').value.trim();
  const res=await API.updateProfile({username,bio});
  if(res?.ok){
    S.user={...S.user,...res.data.user};
    localStorage.setItem('sm_user',JSON.stringify(S.user));
    toast('Perfil guardado','ok');closeModal('modal-edit');loadSettings();
  }else toast(res?.data?.message||'Error','err');
}

async function uploadAvatar(){
  const file=$('av-file').files[0];
  if(!file)return;
  toast('Subiendo foto...','');
  const data=await API.uploadAvatar(file);
  if(data?.avatar){toast('Foto actualizada','ok');loadSettings();}
  else toast('Error al subir','err');
}

function openChangePw(){openModal('modal-pw');}

async function changePw(){
  const cur=$('pw-cur').value;
  const nw=$('pw-new').value;
  if(!cur||!nw)return toast('Completa los campos','err');
  if(nw.length<6)return toast('Mínimo 6 caracteres','err');
  const res=await API.changePw(cur,nw);
  if(res?.ok){$('pw-cur').value='';$('pw-new').value='';toast('Contraseña actualizada','ok');closeModal('modal-pw');}
  else toast(res?.data?.message||'Contraseña incorrecta','err');
}

function confirmLogout(){openModal('modal-logout');}

function logout(){
  stopPoll();localStorage.clear();location.href='/';
}

function confirmDelete(){openModal('modal-delete');}

async function deleteAccount(){
  const res=await API.deleteAccount();
  if(res?.ok){localStorage.clear();location.href='/';}
  else{
    // endpoint puede no existir — solo logout
    localStorage.clear();location.href='/';
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
(function init(){
  if(!S.user||!localStorage.getItem('sm_token')){location.href='/';return;}
  applyTheme(S.theme);

  // textarea auto-resize + enter to send
  ['msg-ta','note-ta'].forEach(id=>{
    const ta=$(id);if(!ta)return;
    ta.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,110)+'px';});
    if(id==='msg-ta'){
      ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
    }
    if(id==='note-ta'){
      ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();publishNote();}});
    }
  });

  nav('chats');
})();
