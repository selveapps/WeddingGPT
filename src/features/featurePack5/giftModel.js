import { clean, amount, makeId, searchText } from './storage';
export const GIFT_STATUSES=['Idea','Requested','Purchased','Received','Thanked'];
export function normalizeGift(raw={}) {
 return {id:clean(raw.id,100)||makeId('gift'),name:clean(raw.name,160),category:clean(raw.category,80)||'General',
 storeUrl:clean(raw.storeUrl,400),requestedBy:clean(raw.requestedBy,120),contributor:clean(raw.contributor,120),
 estimated:amount(raw.estimated),actual:amount(raw.actual),status:GIFT_STATUSES.includes(raw.status)?raw.status:'Idea',
 notes:clean(raw.notes,1200),createdAt:raw.createdAt||new Date().toISOString()};
}
export function upsertGift(list,raw){const item=normalizeGift(raw);return list.some(x=>x.id===item.id)?list.map(x=>x.id===item.id?item:x):[item,...list];}
export function filterGifts(list,query,status){const q=searchText(query);return list.filter(x=>(!q||[x.name,x.category,x.requestedBy,x.contributor,x.notes].some(v=>searchText(v).includes(q)))&&(status==='All'||x.status===status));}
export function summarizeGifts(list){return list.reduce((s,x)=>({total:s.total+1,received:s.received+(['Received','Thanked'].includes(x.status)?1:0),thanked:s.thanked+(x.status==='Thanked'?1:0),estimated:s.estimated+x.estimated,actual:s.actual+x.actual}),{total:0,received:0,thanked:0,estimated:0,actual:0});}
export function exportGifts(list){return ['WEDDING GIFT REGISTRY','',...list.map((x,i)=>`${i+1}. ${x.name} — ${x.status}\nCategory: ${x.category} | Estimated: ₹${x.estimated} | Actual: ₹${x.actual}\nContributor: ${x.contributor||'Not assigned'}\n${x.storeUrl}\n${x.notes}`)].join('\n\n');}
