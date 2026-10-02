export const size=10, start=0, goal=99;
export type Result={visited:number[];path:number[];length:number|null};
export function search(walls:number[],algorithm:'BFS'|'A*'):Result {
 const blocked=new Set(walls),open=[start],seen=new Set([start]),parent=new Map<number,number>(),distance=new Map([[start,0]]),visited:number[]=[];
 const h=(n:number)=>Math.abs(Math.floor(n/size)-9)+Math.abs(n%size-9);
 while(open.length){
  if(algorithm==='A*')open.sort((a,b)=>(distance.get(a)!+h(a))-(distance.get(b)!+h(b))||h(a)-h(b)||a-b);
  const n=open.shift()!; visited.push(n);
  if(n===goal){const path=[n];while(path[0]!==start)path.unshift(parent.get(path[0])!);return {visited,path,length:path.length-1};}
  const row=Math.floor(n/size),col=n%size;
  const next=[row>0?n-size:-1,col<size-1?n+1:-1,row<size-1?n+size:-1,col>0?n-1:-1];
  for(const m of next){if(m<0||blocked.has(m))continue;const cost=distance.get(n)!+1;if(!seen.has(m)){seen.add(m);distance.set(m,cost);parent.set(m,n);open.push(m);}else if(algorithm==='A*'&&cost<distance.get(m)!){distance.set(m,cost);parent.set(m,n);if(!visited.includes(m)&&!open.includes(m))open.push(m);}}
 }
 return {visited,path:[],length:null};
}
export const exampleWalls=[12,22,32,42,52,62,72,74,75,76,77,78,28,38,48,58];
