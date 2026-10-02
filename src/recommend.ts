import {labs} from './data.ts';
export function recommend(interest:string) {
 const text=interest.toLowerCase().trim();
 return labs.map(lab=>{const matches=lab.tags.filter(tag=>text.includes(tag.toLowerCase()));if(text.includes(lab.professor.toLowerCase()))matches.push(lab.professor);return {lab,matches};}).filter(x=>x.matches.length>0).sort((a,b)=>b.matches.length-a.matches.length);
}
