#!/usr/bin/env python3
"""Build a single self-contained HTML preview of the game (no server needed).
Server calls (/api/*) are answered by built-in stubs; progress saves on the device only.
  python3 scripts/build-preview.py out.html
"""
import base64, glob, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
out = sys.argv[1] if len(sys.argv) > 1 else 'aau-dynasty-preview.html'
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.otf': 'font/otf'}
b64 = lambda p: 'data:%s;base64,%s' % (MIME[os.path.splitext(p)[1].lower()], base64.b64encode(open(p, 'rb').read()).decode())
ASSET = re.compile(r"/(?:[\w-]+/)*[\w-]+\.(?:png|jpe?g|webp|svg|otf)")
g = open('game.html', encoding='utf-8').read()
g = g.replace('__AAU_ARCHETYPE_DATA__', json.dumps(json.load(open('data/archetypes.json', encoding='utf-8')), separators=(',', ':')))
esc = lambda s: s.replace('</script', '<\\/script').replace('<!--', '<\\!--')
vars_, n = [], [0]
def asset_text(t):  # JS and HTML: swap each local asset path for its data URI
    return ASSET.sub(lambda m: b64('public' + m.group(0)) if os.path.exists('public' + m.group(0)) else m.group(0), t)
def css(m):
    c = open('public/' + m.group(1), encoding='utf-8').read()
    def url(mm):
        p = mm.group(1)
        if not os.path.exists('public' + p): return mm.group(0)
        if p.endswith('.otf'): return 'url(%s)' % b64('public' + p)   # @font-face cannot use var()
        n[0] += 1; vars_.append('--asset-%d:url(%s)' % (n[0], b64('public' + p))); return 'var(--asset-%d)' % n[0]
    return '<style>' + re.sub(r"url\('?(/[^')]+)'?\)", url, c) + '</style>'
g = re.sub(r'<link rel="stylesheet" href="/([^"]+\.css)"\s*/?>', css, g)
g = re.sub(r'<script src="/([^"]+\.js)"></script>', lambda m: '<script>' + esc(asset_text(open('public/' + m.group(1), encoding='utf-8').read())) + '</script>', g)
g = asset_text(g)
players = json.load(open('data/players.json', encoding='utf-8'))
art = {p['id']: [b64('public/cards/%s%s.webp' % (p['id'], s)) for s in ('', '-v2', '-v3')[:p['art']['versions']]] for p in players['players'] if p.get('art')}
pre = '<style>:root{%s;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n' % ';'.join(vars_)
pre += '<script type="application/json" id="aau-catalog">' + json.dumps(players, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/') + '</script>\n'
pre += '<script>window.AAU_ART=' + json.dumps(art).replace('</', '<\\/') + ''';
(function(){var CAT=JSON.parse(document.getElementById('aau-catalog').textContent),J=function(o,s){return new Response(JSON.stringify(o),{status:s||200,headers:{'Content-Type':'application/json'}})},real=window.fetch.bind(window);
window.fetch=function(u,o){var url=String(u&&u.url||u),post=o&&o.method==='POST';
 if(url.indexOf('/api/players')===0)return Promise.resolve(J(CAT));
 if(url.indexOf('/api/player-state')===0)return Promise.resolve(post?J({error:'Account saves are not part of this preview. Progress saves on this device.'},401):J({authenticated:false,saved:null}));
 if(url.indexOf('/api/auth')===0)return Promise.resolve(post?J({error:'Accounts are not part of this preview.'},400):J({authenticated:false,preview:true}));
 if(url.indexOf('/api/vault')===0)return Promise.resolve(J({error:'preview'},401));
 if(url.indexOf('/api/clock')===0)return Promise.resolve(J({date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'})}));
 if(url.indexOf('/api/leaderboard')===0)return Promise.resolve(J({error:'preview'},401));
 return real(u,o)};
if(!navigator.locks){try{Object.defineProperty(navigator,'locks',{value:{request:function(n,cb){return Promise.resolve().then(cb)}}})}catch(e){}}})();
</script>'''
vp = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
m = re.search(r'<meta name="viewport"[^>]*>', g)
g = g.replace(m.group(0), vp) if m else g.replace('<head>', '<head>' + vp, 1)
g = g.replace('</head>', pre + '</head>', 1)
g = g.replace('Sign in to join the weekly leaderboard.', 'The weekly leaderboard needs the live game server. It is not part of this preview.')
open(out, 'w', encoding='utf-8').write(g)
print('wrote %s (%.2f MB)' % (out, os.path.getsize(out) / 1e6))
