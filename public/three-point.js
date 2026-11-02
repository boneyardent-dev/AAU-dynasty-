// Shot breakdowns extend the existing score-first simulation, not a possession feed.
function threePointProfile(p){
 const archetype=projectedArchetype(p).name;
 let rate=p.p.includes('G')?.22:p.p.includes('W')?.17:.07;
 if(['Sharpshooter','3-and-D Wing','Stretch Big'].includes(archetype))rate+=.09;
 if(['Slasher','Rim Protector','Glass Cleaner'].includes(archetype))rate*=.5;
 return {rating:p.s,rate,style:rate>=.22?'Perimeter threat':rate>=.12?'Balanced range':'Inside first'};
}
function threePointLine(row,p,seed,execution=1){
 if(!p||row.minutes<=0)return {threeMade:0,threeAttempts:0};
 const profile=threePointProfile(p),roll=n=>(circuitHash(seed+':'+n)%10000)/10000;
 const attempts=Math.max(0,Math.round(row.minutes*profile.rate*(.7+roll('volume')*.6)));
 const chance=Math.max(.12,Math.min(.48,.12+(profile.rating-40)*.0045+(execution-1)*.2));
 let made=0;for(let i=0;i<attempts;i++)if(roll('shot'+i)<chance)made++;
 return {threeMade:Math.min(made,Math.floor(Math.max(0,row.pts)/3)),threeAttempts:attempts,threeRating:profile.rating,threeStyle:profile.style};
}
function hasThreePointLine(row){return Number.isInteger(row?.threeMade)&&Number.isInteger(row?.threeAttempts)&&row.threeMade>=0&&row.threeAttempts>=row.threeMade;}
function threePointPercent(row){return !hasThreePointLine(row)||!row.threeAttempts?'—':(100*row.threeMade/row.threeAttempts).toFixed(1)+'%';}
function threePointDisplay(row){return hasThreePointLine(row)?row.threeMade+'–'+row.threeAttempts:'—';}
function threePointSummary(id,games=S.statLog){
 const total={threeMade:0,threeAttempts:0,threeGames:0};
 for(const game of games)for(const row of game.boxScore?.players||[])if(row.playerId===id&&hasThreePointLine(row)){total.threeMade+=row.threeMade;total.threeAttempts+=row.threeAttempts;total.threeGames++;}
 return total;
}
const threePointBox=buildBoxScore;
buildBoxScore=function(us,them){
 const box=threePointBox(us,them),sim=S.game?.simulation||S.simulation;
 for(const row of box.players){const seed=['threes-v1',accountId||'local',S.week,S.statLog.length,row.playerId,us,them,sim?.rolls?.[row.playerId]||1].join(':');Object.assign(row,threePointLine(row,player(row.playerId),seed,sim?.rolls?.[row.playerId]||1));}
 box.totals.threeMade=box.players.reduce((n,row)=>n+row.threeMade,0);box.totals.threeAttempts=box.players.reduce((n,row)=>n+row.threeAttempts,0);box.threePointVersion=1;return box;
};
boxTable=function(box){
 const rows=box?.players||[],minutes=!!box?.estimatedMinutes,keys=[...(minutes?['minutes']:[]),'pts','threes','percentage','reb','ast','stl','blk'];
 const cells=row=>keys.map(key=>'<td>'+(key==='threes'?threePointDisplay(row):key==='percentage'?threePointPercent(row):row?.[key]??0)+'</td>').join('');
 return `<div class="table-wrap"><table class="table box-score-table"><thead><tr><th>Player</th>${[...(minutes?['MIN']:[]),'PTS','3PM–3PA','3PT%','REB','AST','STL','BLK'].map(label=>'<th>'+label+'</th>').join('')}</tr></thead><tbody>${rows.map(row=>`<tr><td><b>${escapeHtml(row.name)}</b><div class="small">${escapeHtml(row.position)}</div></td>${cells(row)}</tr>`).join('')}<tr class="you"><td>TEAM TOTAL</td>${cells(box?.totals)}</tr></tbody></table>${minutes?'<p class="small">Minutes are estimated rotation shares in a 32-minute game (160 team minutes).</p>':''}<p class="small">3PM–3PA = three-pointers made–attempted. Threes are part of PTS. — means no attempts for percentage, or an older game without three-point tracking.</p></div>`;
};
const threePointDevelopmentCard=developmentCard;
developmentCard=function(id){
 const html=threePointDevelopmentCard(id),profile=threePointProfile(player(id)),total=threePointSummary(id);
 const tracked=total.threeGames?`${threePointDisplay(total)} from three · ${threePointPercent(total)} · ${total.threeGames} tracked games`:'No tracked three-point games yet.';
 return html.replace('<details><summary>Development history</summary>',`<section class="box"><div class="kicker">THREE-POINT SHOOTING</div><b>${escapeHtml(profile.style)} · Shooting ${profile.rating}</b><p class="small">${tracked}</p><p class="small">Range uses Shooting development and playing style. Totals cover tracked program history.</p></section><details><summary>Development history</summary>`);
};
