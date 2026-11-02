// Holographic player cards. Art lives in /cards/<id>.webp (+ -v2, -v3). Players with no art get a colored monogram.
// A player's `art` field ({versions, titles}) is set by scripts/generate-fictional-players.py from the files on disk.
const AAU_CROWN='<svg class="aau-crown" viewBox="0 0 28 20" aria-hidden="true"><path d="M2 18 4 5l6 6 4-9 4 9 6-6 2 13z"/></svg>';
// Rarity describes the collectible edition; it never changes the player's ratings.
const AAU_RARITY_STYLES={
 Common:{level:1,symbol:'●',finish:'MATTE',edition:'BASE EDITION',odds:55},
 Uncommon:{level:2,symbol:'◆',finish:'EMERALD',edition:'EMERALD EDITION',odds:25},
 Rare:{level:3,symbol:'✦',finish:'CHROME',edition:'STOCK RISERS',odds:12},
 Epic:{level:4,symbol:'✧',finish:'PRISM',edition:'CIRCUIT BREAKERS',odds:6},
 Legendary:{level:5,symbol:'♛',finish:'GOLD',edition:'PEACH JAM ELITE',odds:1.7},
 Mythic:{level:6,symbol:'✺',finish:'COSMIC',edition:'PEACH JAM LEGENDS',odds:.3}
};
function aauRarityStyle(rarity){return AAU_RARITY_STYLES[rarity]||null;}
function aauRarityGuide(){
 S.screen='rarity-guide';const p=players.find(p=>p.catalog?.isFictional)||players[0];
 frame(`<div class="kicker">THE COLLECTOR'S GUIDE</div><h1>SIX TIERS. ONE CHASE.</h1><p>Every card carries its rarity name and tier number. Legendary and Mythic are the elite collectible editions.</p><p class="small">Drafting signs a player to your roster. Packs collect editions of those same players. A new rarity is a new edition; the same player and rarity stacks as a duplicate. Rarity does not raise the player's ratings.</p><div class="aau-rarity-gallery">${Object.entries(AAU_RARITY_STYLES).map(([rarity,style])=>`<section><h2>${style.symbol} ${rarity}</h2><p>Tier ${style.level} of 6 · ${style.odds}% per card</p>${aauCard(p,{rarity,interactive:false})}<p class="small">${style.finish} · ${style.edition}</p></section>`).join('')}</div><p class="small">Illustrative previews, not awarded cards. Each card rolls independently; a pack does not guarantee an elite pull.</p><button class="btn" onclick="packRoom()">Back to packs</button>`);
}
const aauVer={};
function aauArtUrl(p,v){const art=typeof AAU_PLAYER_ART!=='undefined'?AAU_PLAYER_ART[p.id]:null;const A=typeof window!=='undefined'&&window.AAU_ART&&window.AAU_ART[p.id];return A?(A[v-1]||A[0]):art?(art.versions[v-1]||art.src):'/cards/'+p.id+(v>1?'-v'+v:'')+'.webp'}
function aauImg(p,v=1){const c=p.catalog;return (typeof AAU_PLAYER_ART!=='undefined'&&AAU_PLAYER_ART[p.id])||(c&&c.art&&c.art.versions)?`<img class="aau-img" alt="${escapeHtml(p.n)} player artwork" loading="lazy" decoding="async" src="${aauArtUrl(p,v)}" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()">`:''}
function aauVersion(p){const art=(p.catalog&&p.catalog.art)||{},n=art.versions||1;return Math.max(1,Math.min(n,aauVer[p.id]||art.defaultVersion||1))}
function aauTier(p,ovr){const n=(p.catalog&&p.catalog.art&&p.catalog.art.versions)||1;return n>1?aauVersion(p):ovr>=87?3:ovr>=80?2:1}
function aauCard(p,o={}){const c=p.catalog||{},values=o.values||cardAttributes(p),ovr=cardOvr(values),ph=physProfile(p),v=aauVersion(p),tier=aauTier(p,ovr),rar=o.rarity?String(o.rarity):'',rarityStyle=aauRarityStyle(rar),interactive=o.interactive!==false,cls=(rar?'aau-r-'+rar.toLowerCase().replace(/[^a-z]/g,''):'aau-t'+tier)+(c.originalSeries==='concrete-royalty-v1'?' aau-concrete':''),
 title=(c.art&&c.art.titles&&c.art.titles[v-1])||c.archetype||p.r||'',name=String(p.n),pos=c.position||p.p||'',
 ini=(c.avatar&&c.avatar.initials)||name.split(' ').filter(x=>x!=='Jr.').map(x=>x[0]).slice(0,2).join(''),
 nfs=Math.min(12.5,12.5*11/Math.max(11,name.length)),size=physFmt(ph.inches)+' \u00B7 '+ph.lbs+' lbs'+(ph.hKnown&&ph.wKnown?'':' (est.)'),
 bar=(n,x)=>`<div class="aau-stat"><div><span>${n}</span><b>${x}</b></div><i><u style="width:${Math.round((x-40)/59*100)}%"></u></i></div>`;
 return `<div class="aau-card ${cls}" ${interactive?'role="button" tabindex="0"':'role="img" data-static="true"'} aria-label="${escapeHtml(name)}, ${rar?escapeHtml(rar)+', ':''}${ovr} overall, ${escapeHtml(pos)}.${interactive?' Press to flip.':''}"><div class="aau-tilt"><div class="aau-inner">
 <div class="aau-face aau-front"><div class="aau-foil"></div><div class="aau-art"><div class="aau-mono">${escapeHtml(ini)}</div><small>AAU DYNASTY</small>${aauImg(p,v)}<div class="aau-holo"></div><div class="aau-glare"></div></div>
 <div class="aau-badge"><b>${ovr}</b><span>${escapeHtml(pos)}</span><small class="aau-ovr-label">OVR</small></div>${!rar||rarityStyle?.level>=5?AAU_CROWN:''}${rar?`<div class="aau-rar">${escapeHtml(rar)}</div>${rarityStyle?`<div class="aau-tier-mark" aria-hidden="true">${rarityStyle.symbol}<small>${rarityStyle.level} / 6</small></div>`:''}`:''}
 <div class="aau-plate">${rarityStyle?`<div class="aau-edition">${rarityStyle.level>=5?'ELITE · ':''}${rarityStyle.edition}</div>`:''}<div class="aau-nm" style="--nfs:${nfs.toFixed(1)}cqw">${escapeHtml(name)}</div><div class="aau-rib"><i>${escapeHtml(title)}</i></div>${rarityStyle?`<div class="aau-finish">TIER ${rarityStyle.level} / 6 · ${rarityStyle.finish}</div>`:''}</div></div>
 <div class="aau-face aau-back" ${interactive?'':'aria-hidden="true"'}><svg viewBox="0 0 28 20" aria-hidden="true"><path d="M2 18 4 5l6 6 4-9 4 9 6-6 2 13z"/></svg><h3>${escapeHtml(name)}</h3><div class="aau-sub">${escapeHtml(pos)} \u00B7 ${escapeHtml(c.archetype||p.r||'')}</div><div class="aau-sub" style="margin:0 0 3cqw">${escapeHtml(size)}</div>
 ${bar('Strength',ph.strength)}${bar('Speed',ph.speed)}${bar('Rebounding',ph.rebound)}<div class="aau-six">${sixAttributes.map((k,i)=>`<span>${escapeHtml(k)}<b>${values[i]}</b></span>`).join('')}</div><div class="aau-foot">${rarityStyle?`${rar.toUpperCase()} · TIER ${rarityStyle.level} / 6<br>${rarityStyle.edition}<br>`:''}Tap to flip back.</div></div>
 </div></div></div>`}
function aauChips(p){const n=(p.catalog&&p.catalog.art&&p.catalog.art.versions)||1;if(n<2)return '';const v=aauVersion(p),t=p.catalog.art.titles||[];
 return `<div class="aau-chips" role="group" aria-label="Card version">${Array.from({length:n},(_,i)=>`<button aria-pressed="${v===i+1}" onclick="aauSetVersion('${p.id}',${i+1})">${escapeHtml(t[i]||'Version '+(i+1))}</button>`).join('')}</div>`}
function aauSetVersion(id,n){aauVer[id]=n;playerProfile(id)}
if(typeof document!=='undefined'&&document.addEventListener){
 const cardOf=e=>e.target&&e.target.closest?e.target.closest('.aau-card:not([data-static])'):null;
 document.addEventListener('click',e=>{const c=cardOf(e);if(c)c.classList.toggle('flipped')});
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('aau-card')){e.preventDefault();e.target.classList.toggle('flipped')}});
 if(typeof matchMedia!=='undefined'&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  document.addEventListener('pointermove',e=>{const c=cardOf(e);if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
   c.style.setProperty('--rx',((.5-y)*14).toFixed(1)+'deg');c.style.setProperty('--ry',((x-.5)*14).toFixed(1)+'deg');c.style.setProperty('--mx',(x*100).toFixed(0)+'%');c.style.setProperty('--my',(y*100).toFixed(0)+'%')});
  document.addEventListener('pointerout',e=>{const c=cardOf(e);if(c&&!c.contains(e.relatedTarget)){c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')}})}}
