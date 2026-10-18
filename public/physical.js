// Height and weight -> Strength, Speed, Rebounding; size matchups vs opponents; growth projections.
// Estimates only: players missing height or weight get position averages and are marked "estimated".
const PHYS_DEFAULT={G:[75,185],W:[78,205],B:[82,235]};
const PHYS_BASE={reb:64,spd:76,str:63}; // typical starting five, calibrated on the generated class
const OPP_SIZE={summit:{h:79,reb:78,spd:70,str:66},flash:{h:74,reb:58,spd:84,str:56},monarch:{h:77,reb:65,spd:76,str:63},coast:{h:76.5,reb:64,spd:78,str:61},oak:{h:77.5,reb:70,spd:71,str:74},bay:{h:76.5,reb:66,spd:78,str:62}};
const PHYS_AGE_PCT=[[11,.80],[12,.84],[13,.88],[14,.93],[15,.96],[16,.98],[17,.99],[18,1]];
let physNow=()=>new Date();
const physCl=(v,a=40,b=99)=>Math.max(a,Math.min(b,Math.round(v)));
function physInches(h){const m=/^(\d)-(\d{1,2})$/.exec(String(h==null?'':h));return m?+m[1]*12+ +m[2]:null}
const physFmt=i=>Math.floor(Math.round(i)/12)+'-'+(Math.round(i)%12);
function physProfile(p){const c=p.catalog||{},d=PHYS_DEFAULT[p.p]||PHYS_DEFAULT.W;
 let inches=physInches(c.height),hKnown=inches!=null;if(!hKnown)inches=d[0];
 let lbs=Number.isFinite(c.weight)?c.weight:null;const wKnown=lbs!=null;if(!wKnown)lbs=Math.round(hKnown?120+(inches-66)*7:d[1]);
 const a=p.a||75,q=p.q||75,z=(inches-77)/3.5,f=(lbs-(120+(inches-66)*7))/20;
 return {inches,lbs,hKnown,wKnown,strength:physCl(62+f*9+z*2.5+(a-80)*.25),speed:physCl(74+(a-80)*.7-z*4-f*3.5),rebound:physCl(60+z*8+f*3+(a-80)*.3+(q-80)*.1)}}
function physTeamAvg(list){const ps=list.map(physProfile),m=k=>ps.reduce((s,x)=>s+x[k],0)/Math.max(1,ps.length);return {h:m('inches'),lbs:m('lbs'),reb:m('rebound'),spd:m('speed'),str:m('strength')}}
function physOpp(o){return OPP_SIZE[o&&o.id]||{h:77,...PHYS_BASE}}
// Small team-strength term so drafting and lineup size matter even before the opponent is known.
function physTeam(list){const t=physTeamAvg(list);return Math.max(-2,Math.min(2,(t.reb-PHYS_BASE.reb)*.05+(t.spd-PHYS_BASE.spd)*.05+(t.str-PHYS_BASE.str)*.03))}
function matchupParts(){const t=physTeamAvg(starters()),o=physOpp(S.opp);return {t,o,reb:(t.reb-o.reb)*.12,spd:(t.spd-o.spd)*.07,str:(t.str-o.str)*.06}}
function matchupEdge(){const m=matchupParts();return Math.max(-3.5,Math.min(3.5,m.reb+m.spd+m.str))}
function sizeLine(){const m=matchupParts(),e=matchupEdge(),top=[['rebounding',m.reb],['speed',m.spd],['strength',m.str]].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0][0];
 const read=Math.abs(e)<.8?'Even matchup on size.':e>0?`Size edge of about ${e.toFixed(1)} points, mostly ${top}.`:`Size disadvantage of about ${(-e).toFixed(1)} points, mostly ${top}. A bigger or quicker lineup would help.`;
 return `<div class="small" style="margin-top:8px">Your starters average ${physFmt(m.t.h)} and ${Math.round(m.t.lbs)} lbs. They average ${physFmt(m.o.h)}. ${read}</div>`}
function physProject(p){const c=p.catalog||{},cy=c.classYear;if(!cy)return null;const base=physProfile(p);if(!base.hKnown)return null;
 const n=physNow(),now=n.getFullYear()+n.getMonth()/12,age=Math.max(11,Math.min(18,18-((cy+.5)-now)));
 let pct=1;for(let i=0;i<PHYS_AGE_PCT.length-1;i++){const[a0,p0]=PHYS_AGE_PCT[i],[a1,p1]=PHYS_AGE_PCT[i+1];if(age>=a0&&age<=a1)pct=p0+(p1-p0)*(age-a0)/(a1-a0)}
 return {age,inches:Math.round(base.inches/pct),lbs:Math.round(base.lbs*(1+(1-pct)*2.2)),growth:Math.round(base.inches/pct)-base.inches}}
function physHtml(p){const c=physProfile(p),pr=physProject(p),
 bar=(n,v)=>`<div style="margin:6px 0"><div class="small" style="display:flex;justify-content:space-between"><span>${n}</span><b>${v}</b></div><div style="height:6px;border-radius:3px;background:var(--line);overflow:hidden"><i style="display:block;height:100%;width:${Math.max(4,Math.round((v-40)/59*100))}%;background:var(--lime)"></i></div></div>`;
 const proj=pr?(pr.growth>=1?`Growth projection: about ${physFmt(pr.inches)} and ${pr.lbs} lbs when fully grown (+${pr.growth} in.).${pr.growth>=3?' Late-bloomer upside.':''} A game estimate from typical growth, not a prediction.`:'Close to full size.'):'';
 return `<div class="box" style="margin-top:12px"><div class="kicker">PHYSICAL PROFILE</div><div class="small">${physFmt(c.inches)}${c.hKnown?'':' (estimated)'} \u00B7 ${c.lbs} lbs${c.wKnown?'':' (estimated)'}</div>${bar('Strength',c.strength)}${bar('Speed',c.speed)}${bar('Rebounding',c.rebound)}${proj?`<p class="small" style="margin:10px 0 0">${proj}</p>`:''}</div>`}
