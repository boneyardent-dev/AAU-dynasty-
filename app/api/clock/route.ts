// Server clock for daily rewards and season dates. Reset happens at midnight Pacific for every player.
export async function GET() {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return Response.json({ now: now.toISOString(), date }, { headers: { 'Cache-Control': 'no-store' } });
}
