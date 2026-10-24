import { clean, amount, makeId, searchText } from './storage';

export const VENDOR_CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Music', 'Transport', 'Outfits', 'Other'];
export const VENDOR_STATUSES = ['Researching', 'Contacted', 'Quote received', 'Shortlisted', 'Booked', 'Not proceeding'];

export function normalizeVendor(raw = {}) {
  return {
    id: clean(raw.id, 100) || makeId('vendor'), name: clean(raw.name, 120),
    category: VENDOR_CATEGORIES.includes(raw.category) ? raw.category : 'Other',
    contact: clean(raw.contact, 120), phone: clean(raw.phone, 60), email: clean(raw.email, 160),
    website: clean(raw.website, 300), quote: amount(raw.quote), paid: amount(raw.paid),
    status: VENDOR_STATUSES.includes(raw.status) ? raw.status : 'Researching',
    rating: Math.min(5, Math.max(0, Number(raw.rating) || 0)),
    notes: clean(raw.notes, 1600), createdAt: raw.createdAt || new Date().toISOString(),
  };
}
export function upsertVendor(list, raw) {
  const item = normalizeVendor(raw);
  return list.some((entry) => entry.id === item.id)
    ? list.map((entry) => entry.id === item.id ? item : entry) : [item, ...list];
}
export function filterVendors(list, query, category, status) {
  const q = searchText(query);
  return list.filter((v) => (!q || [v.name,v.category,v.contact,v.phone,v.email,v.notes].some((x) => searchText(x).includes(q)))
    && (category === 'All' || v.category === category) && (status === 'All' || v.status === status))
    .sort((a,b) => a.name.localeCompare(b.name));
}
export function summarizeVendors(list) {
  return list.reduce((s,v) => ({ total:s.total+1, booked:s.booked+(v.status==='Booked'?1:0),
    shortlisted:s.shortlisted+(v.status==='Shortlisted'?1:0), quotes:s.quotes+v.quote, paid:s.paid+v.paid }),
  {total:0,booked:0,shortlisted:0,quotes:0,paid:0});
}
export function exportVendors(list) {
  return ['WEDDING VENDOR SHORTLIST','',...list.map((v,i)=>`${i+1}. ${v.name} — ${v.category} — ${v.status}\nContact: ${v.contact||'Not set'} | Phone: ${v.phone||'Not set'} | Email: ${v.email||'Not set'}\nQuote: ₹${v.quote} | Paid: ₹${v.paid}\n${v.notes}`)].join('\n\n');
}
