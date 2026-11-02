# Chibi player spotlight

The Chibi court now includes a `Player Lab` mode. It locks onto the current ball-handler, moves to a close courtside angle, and hides the other actors so one selected player fills the frame while their live animation pose remains visible. The player stays locked while the match continues, making it useful for reviewing proportions, facial readability, footwork, gathers, shots, rebounds and finishes.

The mode is presentation-only: the existing five-on-five engine remains the scoring authority, and the lab does not change possessions, saves, rewards, or roster state. Open the Chibi court and press `Player lab: off`; press it again to return to the normal match view. The Camera button still cycles the four standard views plus the one-player spotlight angle.

Source paths:

- `gameplay/chibi/renderer.js`
- `gameplay/chibi/engine.cjs`
- generated output: `public/chibi-v0.6/index.html`

Verification: Chibi simulation, renderer adapter, integration and build checks passed.
