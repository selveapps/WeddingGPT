import { clean, makeId, searchText } from './storage';
export const INVITE_CHANNELS = ['WhatsApp','Email','Printed card','Phone call','In person'];
export const INVITE_STATUSES = ['Draft','Ready to send','Sent','Delivered','Responded'];
export function normalizeInvitation(raw={}) {
  return { id:clean(raw.id,100)||makeId('invite'), title:clean(raw.title,140)||'Wedding invitation',
    recipient:clean(raw.recipient,140), channel:INVITE_CHANNELS.includes(raw.channel)?raw.channel:'WhatsApp',
    status:INVITE_STATUSES.includes(raw.status)?raw.status:'Draft', deadline:clean(raw.deadline,60),
    message:clean(raw.message,3000), notes:clean(raw.notes,1000), createdAt:raw.createdAt||new Date().toISOString() };
}
export function upsertInvitation(list,raw) {
  const item=normalizeInvitation(raw);
  return list.some((v)=>v.id===item.id)?list.map((v)=>v.id===item.id?item:v):[item,...list];
}
export function filterInvitations(list,query,status) {
  const q=searchText(query);
  return list.filter((v)=>(!q||[v.title,v.recipient,v.channel,v.status,v.message].some((x)=>searchText(x).includes(q)))&&(status==='All'||v.status===status));
}
export function summarizeInvitations(list) {
  return list.reduce((s,v)=>({total:s.total+1,drafts:s.drafts+(v.status==='Draft'?1:0),
    sent:s.sent+(['Sent','Delivered','Responded'].includes(v.status)?1:0),responded:s.responded+(v.status==='Responded'?1:0)}),
  {total:0,drafts:0,sent:0,responded:0});
}
export function buildInvitation(item) {
  return `${item.title}\n\n${item.message}${item.deadline?`\n\nKindly respond by ${item.deadline}.`:''}`;
}
