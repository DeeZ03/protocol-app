export type ScheduledProtocol = { days?: number[]; time?: string; startDate?: string; durationWeeks?: number | null };
export const dateKey = (d: Date) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export function endDate(p: ScheduledProtocol): string | null {
 if (!p.startDate || !p.durationWeeks || p.durationWeeks < 1) return null;
 const [y,m,d] = p.startDate.split('-').map(Number);
 const last = new Date(y,m-1,d+p.durationWeeks*7-1,12);
 return dateKey(last);
}
export function isScheduled(p: ScheduledProtocol, d: Date): boolean {
 const key=dateKey(d), end=endDate(p);
 return Array.isArray(p.days) && p.days.includes((d.getDay()+6)%7) &&
 typeof p.time==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time) &&
 (!p.startDate || key>=p.startDate) && (!end || key<=end);
}
export function finalScheduledDate(p: ScheduledProtocol): string | null {
 const end=endDate(p);
 if(!end || !p.days?.length)return null;
 const [y,m,d]=end.split('-').map(Number);
 for(let offset=0;offset<7;offset++){
  const candidate=new Date(y,m-1,d-offset,12);
  if(isScheduled(p,candidate))return dateKey(candidate);
 }
 return null;
}
