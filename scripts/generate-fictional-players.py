#!/usr/bin/env python3
"""Generate the fictional 2027 recruiting class for AAU Dynasty.

Deterministic for a given --seed. Rating spread comes from data/rating-profile.json
(plain numbers: per-tier mean/std and per-position attribute offsets), so game
balance stays close to what the game was tuned against.

  python3 scripts/generate-fictional-players.py [--seed 82] [--avoid names.json]
"""
import argparse, datetime, json, pathlib, random, statistics

ROOT = pathlib.Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('--seed', type=int, default=82)
ap.add_argument('--avoid', help='JSON file of players whose full names must not be generated')
ap.add_argument('--extra', action='append', default=[], help='extra JSON player lists to append unchanged (repeatable)')
args = ap.parse_args()
rng = random.Random(args.seed)

prof = json.load(open(ROOT / 'data/rating-profile.json'))
arch = json.load(open(ROOT / 'data/archetypes.json'))
ATTRS = ['Athleticism', 'Bag Work', 'Ball Handling', 'Basketball IQ', 'Defense', 'Shooting']
N = 180

FIRST = """Amari Jalen Mateo Cole Dante Elijah Ezra Kai Malik Nico Omar Rhys Silas Tobias Xavier Zion Andre Brandon
Caleb Darius Emmett Felix Gavin Hector Isaiah Jamal Kendrick Landon Marcus Nolan Orion Preston Quincy Reggie Shawn
Terrence Uriah Victor Wesley Yusuf Zane Aaron Bryce Carter Devin Eli Franklin Gabriel Ivan Julian Keenan Lamar Micah
Noah Otis Paxton Rowan Sterling Trey Vince Walker Xander Zachary Alonzo Beau Cedric Declan Easton Fabian Grady Hakeem
Idris Jericho Lorenzo Maverick Nasir Oscar Pierce Quentin Rashad Santiago Tariq Vaughn Wyatt Zaire Anthony Braylon
Camden Dominic Emilio Finn Griffin Hunter Isaac Jaxon Khalil Lucas Mason Nathan Owen Phoenix Roman Sebastian Tyson
Uriel Vernon Willie Demetrius Jonah Lennox Marlon Nehemiah Ronan Thaddeus Wilder""".split()

LAST = """Abara Beaumont Calloway Delacroix Eastwood Fontaine Gaines Hargrove Ingram Jessup Kimura Lockhart Mbeki Navarro
Oyelaran Pemberton Quarles Rousseau Sandoval Thibodeaux Underhill Vasquez Whitlock Xiong Yarbrough Zielinski Adeyemi
Bellamy Castillo Dunmore Ellsworth Faulkner Galloway Holloway Iwu Jemison Kessler Lattimore Mondragon Nakamura Okafor
Prescott Quintero Radcliffe Stallworth Tillman Umeh Valentine Washburn Yoon Zamora Ashby Briggs Cordero Dupree
Espinoza Fitzgerald Grimes Hendrix Ibarra Jovanovic Kowalski Laurent Maldonado Nwosu Ortega Pruitt Rivas Sutherland
Trevino Vickers Whitaker Yates Zeller Alvarado Boone Chambers Dawkins Ekwueme Fairchild Gutierrez Haddad Irvine
Jarrett Kamara Lindqvist Merriweather Nunez Odom Pettigrew Reyes Santos Thornton Vance Wexler Yilmaz Zimmer Archer
Baptiste Crowder Dillard Emerson Foxworth Gantt Hobbs Ikeda Jeffries Kaplan Leland Montrose Nettles Oakes Pickett
Rowe Sims Tolliver Voss Winters Yancey Zeigler Ames Barlow Coles Dorsey""".split()

SCHOOL_STEM = ['Ridgeline', 'Harborview', 'Cedar Mesa', 'Northgate', 'Summit Ridge', 'Lakeshore', 'Iron Valley',
               'Blue Rock', 'Eastbrook', 'Westfield Park', 'Copper Basin', 'Pinecrest Valley', 'Stonebridge',
               'Riverbend', 'Highland Crossing', 'Redwood Hollow', 'Sunset Bluff', 'Granite Falls', 'Oak Meadow',
               'Silver Lake Heights', 'Fox Run', 'Falcon Ridge', 'Mission Pines', 'Bayside', 'Canyon Point']
SCHOOL_TYPE = ['Prep', 'Academy', 'Christian', 'High School', 'Collegiate', 'Prep Academy']
CITIES = ['Sacramento, CA', 'Oakland, CA', 'San Jose, CA', 'Los Angeles, CA', 'San Diego, CA', 'Las Vegas, NV',
          'Phoenix, AZ', 'Seattle, WA', 'Portland, OR', 'Denver, CO', 'Dallas, TX', 'Houston, TX', 'Austin, TX',
          'Atlanta, GA', 'Orlando, FL', 'Miami, FL', 'Charlotte, NC', 'Memphis, TN', 'Nashville, TN', 'Chicago, IL',
          'Detroit, MI', 'Indianapolis, IN', 'Columbus, OH', 'Cleveland, OH', 'Baltimore, MD', 'Washington, DC',
          'Philadelphia, PA', 'Brooklyn, NY', 'Newark, NJ', 'Boston, MA', 'New Orleans, LA', 'Birmingham, AL',
          'Louisville, KY', 'St. Louis, MO', 'Kansas City, MO', 'Minneapolis, MN', 'Milwaukee, WI', 'Richmond, VA',
          'Jacksonville, FL', 'Tulsa, OK']
HEIGHT = {'PG': (70, 76), 'SG': (73, 78), 'CG': (72, 77), 'SF': (77, 81), 'PF': (79, 83), 'C': (81, 86)}
NUMBERS = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 44, 45, 55]

avoid = set()
if args.avoid:
    raw_avoid = json.load(open(args.avoid))
    for p in (raw_avoid['players'] if isinstance(raw_avoid, dict) else raw_avoid):
        avoid.add(p['name'].lower())


def classify(pid, position, ratings):
    """Python port of lib/player-archetype.ts so labels match the API's classifier."""
    role = 'G' if position in ('PG', 'SG', 'CG', 'G', 'G/W') else 'B' if position in ('C', 'PF', 'B', 'B/W', 'W/B') else 'W'
    best, best_score = None, None
    for a in [x for x in arch if x['role'] == role]:
        base = sum(ratings.get(k, 0) * w for k, w in a['weights'].items())
        h = 0
        for ch in pid + ':' + a['id']:
            h = (h * 31 + ord(ch)) & 0xFFFFFFFF
        s = base + ((h % 801) / 100 - 4)
        if best_score is None or s > best_score:
            best, best_score = a, s
    return best


# positions: exact counts from the profile, shuffled
positions = []
for pos, n in prof['positions'].items():
    positions += [pos] * n
positions = positions[:N] + ['SF'] * max(0, N - len(positions))
rng.shuffle(positions)

# names
names, seen = [], set()
while len(names) < N:
    nm = f'{rng.choice(FIRST)} {rng.choice(LAST)}'
    if nm.lower() in seen or nm.lower() in avoid:
        continue
    seen.add(nm.lower())
    names.append(nm)

# ratings by tier
tiers = prof['tiers']  # [{"upTo": 0.06, "mean": .., "std": ..}, ...]


def tier_for(i):
    f = (i + 0.5) / N
    return next(t for t in tiers if f <= t['upTo'])


raw = []
for i in range(N):
    t = tier_for(i)
    target = rng.gauss(t['mean'], t['std'] * 0.6)
    pos = positions[i]
    ratings = {}
    for a in ATTRS:
        v = target + prof['offsets'][pos][a] + rng.gauss(0, 3.5)
        ratings[a] = int(max(50, min(99, round(v))))
    raw.append((statistics.mean(ratings.values()) + rng.random() * 0.01, i, ratings))
raw.sort(key=lambda r: -r[0])

cut5, cut4 = round(prof['stars']['five'] * N), round(prof['stars']['fourPlus'] * N)
players = []
for rank, (ovr, i, ratings) in enumerate(raw, start=1):
    pos, name = positions[i], names[i]
    pid = f'dyn-2027-{rank:03d}'
    a = classify(pid, pos, ratings)
    lo, hi = HEIGHT[pos]
    inches = rng.randint(lo, hi)
    weight = int(max(150, min(270, 120 + (inches - 66) * 7.0 + rng.gauss(0, 9))))
    hometown = rng.choice(CITIES)
    initials = name.split()[0][0] + name.split()[-1][0]
    stars = 5 if rank <= cut5 else 4 if rank <= cut4 else 3
    players.append({
        'id': pid, 'name': name, 'classYear': 2027, 'position': pos,
        'school': f'{rng.choice(SCHOOL_STEM)} {rng.choice(SCHOOL_TYPE)}',
        'hometown': hometown, 'height': f'{inches // 12}-{inches % 12}', 'weight': weight,
        'commitment': {'status': 'None', 'school': None, 'date': None},
        'rankings': [{'source': 'Dynasty Scouts', 'rank': rank, 'rating': round(99 - (rank - 1) * 25 / (N - 1), 1),
                      'stars': stars, 'reportedVia': 'in-game'}],
        'sourceSnapshots': [], 'coverage': ['Dynasty Scouts'],
        'isCustom': False, 'isFictional': True,
        'archetype': a['name'],
        'bio': f"{a['strength']} Out of {hometown.split(',')[0]}.",
        'gameRatings': ratings,
        'ratingsMethod': 'Generated for AAU Dynasty. Fictional player; ratings are game values.',
        'avatar': {'initials': initials, 'number': rng.choice(NUMBERS), 'hue': rng.randrange(360)},
    })

# players kept across regenerations: director-added customs + earlier hand-made fictional players
extras = list(args.extra)
for name in ('data/custom-players.json', 'data/seed-fictional-extras.json'):
    if (ROOT / name).exists():
        extras.append(str(ROOT / name))
for path in extras:
    players += json.load(open(path))

# art flags: a player has card art when public/cards/<id>.webp exists (plus -v2, -v3 for extra versions)
cards = ROOT / 'public/cards'
for p in players:
    n = sum((cards / (p['id'] + suffix + '.webp')).exists() for suffix in ('', '-v2', '-v3'))
    if n:
        p['art'] = {**(p.get('art') or {}), 'versions': n}
    else:
        p.pop('art', None)

out = {
    'classYear': 2027,
    'observedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'sourceNote': 'All players are fictional and generated for AAU Dynasty. Ranks and stars come from the in-game Dynasty Scouts.',
    'sources': [{'name': 'Dynasty Scouts', 'url': None, 'coverage': 'All prospects'}],
    'players': players,
}
(ROOT / 'data/players.json').write_text(json.dumps(out, indent=1, ensure_ascii=False))
print(f'wrote {len(players)} players ({N} generated, seed {args.seed})')
