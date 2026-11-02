const fs = require('fs');

const path = 'data/custom-players.json';
const existing = JSON.parse(fs.readFileSync(path, 'utf8'));
const roster = [
  ['Jerimiah', 'Mamba Black'], ['Andrew', 'Mamba Black'], ['Jahleel', 'Mamba Black'],
  ['True', 'Mamba Black'], ['Landon', 'Mamba Black'], ['Odyn', 'Mamba Black'],
  ['Xander', 'Mamba Black'], ['Lucas', 'Mamba Black'],
  ['Niaz', 'Mamba Black MADE'], ['Donovan Price', 'Mamba Black MADE'],
  ['Liam', 'Mambas Gold Made'], ['Mikey', 'Mambas Gold Made'], ['Chikai', 'Mambas Gold Made'],
  ['Jace', 'Mambas Gold Made'], ['Marquis', 'Mambas Gold Made'], ['Los', 'Mambas Gold Made'],
  ['Ant', 'Mambas Gold Made'], ['Mei Lynn', 'Mambas Gold Made'], ['Hisham', 'Mambas Gold Made'],
  ['Cotrell', 'Mambas Gold Made'], ['Malikai', 'Mambas Gold Made'], ['Brett', 'Mambas Gold Made'],
  ['Ayan', 'Mambas Gold'], ['Austin', 'Mambas Gold'],
  ['Gabe', 'Mambas Red'], ['Dom', 'Mambas Red'], ['Kingston', 'Mambas Red'],
  ['Xavier', 'Mambas Red'], ['Matthew', 'Mambas Red']
];
const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
const hues = [18, 46, 86, 150, 198, 242, 286, 326];
const known = new Set(existing.map(p => p.name.toLowerCase()));
let added = 0;
for (const [rawName, team] of roster) {
  const name = rawName.replace(/- Football$/i, '').trim();
  if (known.has(name.toLowerCase())) continue;
  const index = existing.length + added;
  existing.push({
    id: `custom-mambas-${slug(name)}`,
    name,
    classYear: 0,
    position: positions[index % positions.length],
    school: 'Mambas United',
    hometown: null,
    height: 'Not reported',
    weight: null,
    commitment: { status: 'Not reported', school: null, date: null },
    rankings: [],
    sourceSnapshots: [],
    coverage: ['Mambas United Trello roster'],
    isCustom: true,
    isFictional: false,
    team,
    archetype: 'Custom Prospect',
    signatureAbility: 'To be assigned',
    bio: 'Real Mambas United roster name imported from the coach\'s Trello board. Player details pending coach confirmation.',
    gameRatings: { 'Ball Handling': 80, Athleticism: 80, Shooting: 80, Defense: 80, 'Bag Work': 80, 'Basketball IQ': 80 },
    ratingsMethod: 'Provisional game ratings for gameplay only; not scouting grades.',
    avatar: { initials: initials(name), number: (index % 55) + 1, hue: hues[index % hues.length], generated: true },
    photo: null
  });
  added++;
}
for (const [name, team] of [['Tiger Stancil', 'Mamba Black'], ['Harley Hudson', 'Mamba Black'], ['Donovan Price', 'Mamba Black MADE']]) {
  const player = existing.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (player) player.team = team;
}
fs.writeFileSync(path, JSON.stringify(existing, null, 1) + '\n');
console.log(`Added ${added} Mambas roster players; ${existing.length} custom players total.`);
