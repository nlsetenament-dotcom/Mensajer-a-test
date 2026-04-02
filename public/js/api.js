const API={
  async r(method,path,body=null){
    const tk=localStorage.getItem('sm_token');
    const opts={method,headers:{'Content-Type':'application/json',...(tk?{Authorization:`Bearer ${tk}`}:{})}};
    if(body)opts.body=JSON.stringify(body);
    const res=await fetch('/api'+path,opts);
    const data=await res.json().catch(()=>({}));
    if(res.status===401){localStorage.clear();location.href='/';return null;}
    return{ok:res.ok,data};
  },
  login:(e,p)=>API.r('POST','/auth/login',{email:e,password:p}),
  register:(u,e,p)=>API.r('POST','/auth/register',{username:u,email:e,password:p}),
  changePw:(c,n)=>API.r('PUT','/auth/change-password',{currentPassword:c,newPassword:n}),
  getMe:()=>API.r('GET','/users/me'),
  updateProfile:d=>API.r('PUT','/users/me',d),
  searchUsers:q=>API.r('GET',`/users/search?q=${encodeURIComponent(q)}`),
  deleteAccount:()=>API.r('DELETE','/users/me'),
  uploadAvatar(file){
    const tk=localStorage.getItem('sm_token');
    const fd=new FormData();fd.append('avatar',file);
    return fetch('/api/users/avatar',{method:'POST',headers:{Authorization:`Bearer ${tk}`},body:fd}).then(r=>r.json().catch(()=>({})));
  },
  getConvs:()=>API.r('GET','/chats'),
  getChat:id=>API.r('GET',`/chats/${id}`),
  sendMsg:(to,content,type='text')=>API.r('POST','/chats/send',{receiverId:to,content,type}),
  markRead:id=>API.r('PUT',`/chats/${id}/read`),
  getGroups:()=>API.r('GET','/groups'),
  createGroup:(name,desc,members)=>API.r('POST','/groups',{name,description:desc,memberIds:members}),
  getGroupMsgs:id=>API.r('GET',`/groups/${id}/messages`),
  sendGroupMsg:(id,content,type='text')=>API.r('POST',`/groups/${id}/messages`,{content,type}),
  addMember:(gid,uid)=>API.r('POST',`/groups/${gid}/members`,{userId:uid}),
  leaveGroup:id=>API.r('DELETE',`/groups/${id}/leave`),
  getStories:()=>API.r('GET','/stories'),
  createStory:(content,type,bgColor)=>API.r('POST','/stories',{content,type,bgColor}),
  deleteStory:id=>API.r('DELETE',`/stories/${id}`),
  getNotes:()=>API.r('GET','/notes'),
  createNote:c=>API.r('POST','/notes',{content:c}),
  deleteNote:id=>API.r('DELETE',`/notes/${id}`),
};
