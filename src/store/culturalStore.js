import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage';
function emptyCol(){return{byId:{},allIds:[]}}
function upsert(c,e){const byId={...(c.byId||{}),[e.id]:e};const allIds=c.allIds?.includes(e.id)?c.allIds:[...(c.allIds||[]),e.id];return{byId,allIds}}
function removeById(c,id){const byId={...(c.byId||{})};delete byId[id];return{byId,allIds:(c.allIds||[]).filter(x=>x!==id)}}
function touch(e,p){return{...e,...p,updatedAt:Date.now()}}
function denorm(c){return(c?.allIds||[]).map(id=>c.byId[id]).filter(Boolean)}
function uid(){return Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9)}
const initial={items:emptyCol(),secondary:emptyCol(),meta:{}};
export const useCulturalStore=create()(persist((set,get)=>({
  ...initial,
  list:()=>denorm(get().items),
  listSecondary:()=>denorm(get().secondary),
  getById:(id)=>get().items.byId?.[id]||null,
  create:(partial={})=>{const e={id:uid(),createdAt:Date.now(),updatedAt:Date.now(),...partial};set(s=>({items:upsert(s.items,e)}));return e},
  update:(id,patch)=>{const cur=get().items.byId?.[id];if(!cur)return null;const n=touch(cur,patch);set(s=>({items:upsert(s.items,n)}));return n},
  remove:(id)=>set(s=>({items:removeById(s.items,id)})),
  setMeta:(k,v)=>set(s=>({meta:{...s.meta,[k]:v}})),
  getStats:()=>({count:denorm(get().items).length,secondaryCount:denorm(get().secondary).length,meta:get().meta}),
  reset:()=>set(initial),
}),{name:'weddinggpt-cultural',storage:zustandStorage,partialize:s=>({items:s.items,secondary:s.secondary,meta:s.meta})}));
