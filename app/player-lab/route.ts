import lab from '../../public/player-lab-sandbox/index.html?raw';

export function GET(request: Request) {
  return new Response(lab, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
