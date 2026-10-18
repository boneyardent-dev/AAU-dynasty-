import { env } from 'cloudflare:workers';
import seed from '../../../data/players.json';
import archetypes from '../../../data/archetypes.json';
import { classifyArchetype } from '../../../lib/player-archetype';
const catalogVersion = '2027:' + seed.observedAt + ':archetypes-v1:all-fictional-v2:circuit-originals-v1';
let initializing:Promise<void>|undefined;
async function ensureCatalog(){
 const db=env.DB;
 if(!db)throw new Error('Player database unavailable');
 const meta=await db.prepare('SELECT value FROM catalog_meta WHERE key = ?').bind('version').first<{value:string}>();
 if(meta?.value===catalogVersion)return;
 await db.batch([db.prepare('DELETE FROM catalog_rankings'),db.prepare('DELETE FROM catalog_players')]);
 const statements=[];
 for(const p of seed.players){
  const record={...p,gameplayArchetype:classifyArchetype(p.id,p.position,p.gameRatings),archetypeModel:'Gameplay projection v1; not a sourced scouting classification.'};
  statements.push(db.prepare('INSERT INTO catalog_players (id,name,class_year,position,payload,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,class_year=excluded.class_year,position=excluded.position,payload=excluded.payload,updated_at=excluded.updated_at').bind(p.id,p.name,p.classYear,p.position,JSON.stringify(record),seed.observedAt));
  for(const r of p.rankings)statements.push(db.prepare('INSERT INTO catalog_rankings (id,player_id,source,national_rank,rating,stars,source_url,observed_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET national_rank=excluded.national_rank,rating=excluded.rating,stars=excluded.stars,source_url=excluded.source_url,observed_at=excluded.observed_at').bind(p.id+':'+r.source,p.id,r.source,r.rank??null,r.rating??null,r.stars??null,r.url,seed.observedAt));
 }
 for(let i=0;i<statements.length;i+=50)await db.batch(statements.slice(i,i+50));
 await db.prepare('INSERT INTO catalog_meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('version',catalogVersion).run();
}
export async function GET(){
 try{
  if(!initializing)initializing=ensureCatalog().catch(e=>{initializing=undefined;throw e});
  await initializing;
  const {results}=await env.DB!.prepare('SELECT payload FROM catalog_players ORDER BY name').all<{payload:string}>();
  return Response.json({...seed,archetypes,players:results.map(r=>JSON.parse(r.payload)),storage:'persistent-database'},{headers:{'Cache-Control':'public, max-age=300'}});
 }catch(e){console.error('Catalog error',e);return Response.json({error:'Player database is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
