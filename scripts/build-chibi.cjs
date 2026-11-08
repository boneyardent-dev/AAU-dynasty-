// Package the retained v0.6 gameplay with an isolated main-game entry point.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let source=fs.readFileSync(path.join(root,'gameplay/chibi/index.html'),'utf8');
// Refresh the embedded presentation from editable source; retain the original archive.
const rendererStart=source.indexOf('/* AAU Dynasty: Three.js presentation adapter.');
const rendererEnd=source.indexOf('</script>',rendererStart);
if(rendererStart<0||rendererEnd<0)throw Error('Expected Chibi renderer was not found');
source=source.slice(0,rendererStart)+fs.readFileSync(path.join(root,'gameplay/chibi/renderer.js'),'utf8')+source.slice(rendererEnd);
const teams=JSON.parse(fs.readFileSync(path.join(root,'gameplay/chibi/teams.json'),'utf8'));
const boot=/<script>window\.courtReview=AAUCourt\.mount[\s\S]*?<\/script>/;
if(!boot.test(source))throw Error('Expected original v0.6 startup was not found');
const replacement='<script>window.AAUChibiSampleTeams='+JSON.stringify(teams)+';if(window.parent===window)window.courtReview=AAUCourt.mount(document.getElementById("court"),window.AAUChibiSampleTeams);</script>';
const target=path.join(root,'public/chibi-v0.6');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'index.html'),source.replace(boot,()=>replacement));
fs.copyFileSync(path.join(root,'gameplay/chibi/THREE-LICENSE.txt'),path.join(target,'THREE-LICENSE.txt'));
fs.copyFileSync(path.join(root,'gameplay/chibi/three.min.js'),path.join(target,'three.min.js'));
fs.copyFileSync(path.join(root,'gameplay/chibi/renderer.js'),path.join(target,'renderer.js'));
for(const filename of ['two-on-two.html','two-on-two.js','two-on-two-ui.js','software.js'])fs.copyFileSync(path.join(root,'gameplay/chibi',filename),path.join(target,filename));
fs.copyFileSync(path.join(root,'gameplay/chibi/engine.cjs'),path.join(target,'engine.js'));
console.log('Packaged retained ten-player Chibi v0.6');
