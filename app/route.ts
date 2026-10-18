import game from '../game.html?raw';
import archetypes from '../data/archetypes.json';
export function GET(){return new Response(game.replace('__AAU_ARCHETYPE_DATA__',JSON.stringify(archetypes)),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});}
