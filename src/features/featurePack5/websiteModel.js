import { clean } from './storage';
export const DEFAULT_SECTIONS=[
 {id:'welcome',title:'Welcome',body:'We are so excited to celebrate this special day with you.'},
 {id:'story',title:'Our story',body:'Tell guests how you met and what makes your journey special.'},
 {id:'schedule',title:'Wedding schedule',body:'Add event names, dates, times and locations.'},
 {id:'venue',title:'Venue and travel',body:'Add the venue address, parking and travel guidance.'},
 {id:'dress-code',title:'Dress code',body:'Share dress code details and helpful suggestions.'},
 {id:'faq',title:'Frequently asked questions',body:'Answer common questions about children, plus-ones and accessibility.'},
 {id:'contact',title:'Contact',body:'Add the best contact name and phone number for questions.'},
];
export function normalizeSections(value){const list=Array.isArray(value)?value:DEFAULT_SECTIONS;return list.map((x,i)=>({id:clean(x.id,80)||`section-${i}`,title:clean(x.title,120),body:clean(x.body,3000)}));}
export function websiteProgress(sections){const complete=sections.filter(x=>x.title.trim()&&x.body.trim()).length;return {complete,total:sections.length,percent:sections.length?Math.round(complete/sections.length*100):0};}
export function websiteCopy(meta,sections){const heading=[clean(meta.title,120)||'Our Wedding',clean(meta.coupleNames,160),clean(meta.date,80),clean(meta.city,120)].filter(Boolean).join('\n');return `${heading}\n\n${sections.filter(x=>x.title.trim()||x.body.trim()).map(x=>`${x.title.toUpperCase()}\n${x.body}`).join('\n\n')}`.trim();}
