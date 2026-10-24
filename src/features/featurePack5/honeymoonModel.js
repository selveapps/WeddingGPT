import { clean, amount, makeId, searchText } from './storage';
export const TRIP_STATUSES=['Idea','Researching','Ready to book','Booked','Completed'];
export function normalizeTrip(raw={}) {
 return {id:clean(raw.id,100)||makeId('trip'),title:clean(raw.title,160),kind:clean(raw.kind,80)||'Activity',
 destination:clean(raw.destination,160),startDate:clean(raw.startDate,40),endDate:clean(raw.endDate,40),
 cost:amount(raw.cost),status:TRIP_STATUSES.includes(raw.status)?raw.status:'Idea',
 confirmation:clean(raw.confirmation,120),address:clean(raw.address,300),notes:clean(raw.notes,1400),
 createdAt:raw.createdAt||new Date().toISOString()};
}
export function upsertTrip(list,raw){const item=normalizeTrip(raw);return list.some(x=>x.id===item.id)?list.map(x=>x.id===item.id?item:x):[item,...list];}
export function filterTrips(list,query,status){const q=searchText(query);return list.filter(x=>(!q||[x.title,x.kind,x.destination,x.address,x.notes].some(v=>searchText(v).includes(q)))&&(status==='All'||x.status===status)).sort((a,b)=>(a.startDate||'9999').localeCompare(b.startDate||'9999'));}
export function summarizeTrips(list){return list.reduce((s,x)=>({total:s.total+1,booked:s.booked+(x.status==='Booked'?1:0),completed:s.completed+(x.status==='Completed'?1:0),cost:s.cost+x.cost}),{total:0,booked:0,completed:0,cost:0});}
export function exportTrips(list){return ['HONEYMOON ITINERARY','',...list.map(x=>`${x.startDate||'Date TBD'} — ${x.title}\n${x.destination} | ${x.kind} | ${x.status} | ₹${x.cost}\n${x.endDate?`Until: ${x.endDate}\n`:''}${x.address}\nConfirmation: ${x.confirmation}\n${x.notes}`)].join('\n\n');}
