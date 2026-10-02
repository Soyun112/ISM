import {labs} from './data.ts';
export function recommend(interest:string) {
 const text=interest.toLowerCase().trim();
 return labs.map(lab=>({lab,matches:lab.tags.filter(tag=>text.includes(tag.toLowerCase()))})).filter(x=>x.matches.length>0).sort((a,b)=>b.matches.length-a.matches.length);
}
