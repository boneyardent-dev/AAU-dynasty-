# Merge notes: v34 + fictional class, retention, leaderboard, size ratings, card frame
Base: your v34 (circuit, playbook, six rarities, program logos, pack art). Added on top:
- Fictional 2027 class (data/players.json, scripts/generate-fictional-players.py); real recruit photos and the scraper script removed.
- Daily rewards, season pass, collection goals (public/retention.js); server clock (app/api/clock).
- Weekly leaderboard (lib/leaderboard.ts, app/api/leaderboard, drizzle/0002).
- Height/weight ratings, size matchups, growth projections (public/physical.js).
- Holographic cards tied to rarity (public/card-frame.js/.css, public/cards/).
Tests: node scripts/test-*.cjs and node scripts/test-leaderboard.mjs

## Sign-in for real players (guest coach profiles)
- A player taps "Create my coach profile" and gets a 12-character recovery code. No name, email, or photo is collected.
- Entering the code on another phone signs in to the same profile. ChatGPT sign-in still works.
- lib/auth-core.ts (logic + tests), app/session.ts (current user), app/api/auth/route.ts, public/account.js (screen), drizzle/0003.
- Sessions are random tokens in an HttpOnly cookie; only hashes of tokens and codes are stored. Guesses and profile creation are rate limited.
- Saves, the leaderboard, and daily rewards now work for guest profiles as well as ChatGPT accounts.
- scripts/build-preview.py builds the single-file playable preview.
- New tests: scripts/test-auth.mjs, scripts/test-account.cjs

## Weekly leaderboard rewards
- At the end of each week (Monday midnight Pacific) players can claim packs from the leaderboard screen for any of the last 3 completed weeks.
- Packs: 1st place 5, top 3 get 4, top 10 get 3, top quarter 2, 1 for playing 5 games. Minimum 3 games.
- The server works out the reward from the final standings and records each claim once (table weekly_claims, drizzle/0004). The device adds the packs once and then acknowledges.
- Rules live in lib/leaderboard.ts (rewardFor, REWARD_MIN_GAMES, PARTICIPATION_GAMES, CLAIM_WEEKS).
- Tests: scripts/test-weekly-rewards.mjs and .cjs

## Packs held on the server (signed-in players)
- The server now owns each signed-in player's pack count, cards, daily streak, goals, and season pass (tables vaults and vault_cards, drizzle/0005).
- The server draws the five cards for every pack (same odds as before) and decides every grant: games (one pack per 3 recorded games), daily rewards, goals, season levels, weekly leaderboard rewards.
- The phone mirrors the vault into the normal collection screens (public/vault.js). Editing the phone's saved data no longer creates packs or cards on an account.
- Not signed in: everything stays local, as before. When an account first loads, the old local collection is copied once to the key `<collection>:local-backup`.
- Paused for accounts: buying packs with Director Points (points live on the phone). Support items from packs (coaches, trainers) are still kept on the phone.
- Game results are still reported by the phone. They are limited to one per 20 seconds and 60 per week per player, which caps pack farming from games.
- lib/vault-core.ts holds the rules; tests: scripts/test-vault.mjs (also checks the rules match the game files) and scripts/test-vault-client.cjs.
