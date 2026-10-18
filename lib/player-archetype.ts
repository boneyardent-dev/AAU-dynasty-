import definitions from '../data/archetypes.json';
export function classifyArchetype(id:string, position:string, ratings:Record<string,number>){
  const role=['PG','SG','CG','G','G/W'].includes(position)?'G':['C','PF','B','B/W','W/B'].includes(position)?'B':'W';
  const candidates=definitions.filter(a=>a.role===role);
  const score=(a:typeof definitions[number])=>{
    const rating=Object.entries(a.weights).reduce((n,[k,w])=>n+(ratings[k]||0)*(w||0),0);
    let hash=0;for(const c of id+':'+a.id)hash=(hash*31+c.charCodeAt(0))>>>0;
    return rating+((hash%801)/100-4);
  };
  return [...candidates].sort((a,b)=>score(b)-score(a))[0].id;
}
