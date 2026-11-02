# Mambas United roster import

The real roster names were read from the Mambas United Trello board's roster cards and imported into the game as custom players.

Imported groups:

- Mamba Black
- Mamba Black MADE
- Mambas Gold
- Mambas Gold Made
- Mambas Red

The import deduplicates repeated names across teams. Existing custom cards for Tiger Stancil, Harley Hudson, and Donovan Price were retained and tagged with their Mambas team. Twenty-eight additional names were added, for thirty-one distinct Mambas roster players in total.

Each imported player has a card-ready catalog entry, a generated placeholder portrait using the game's existing illustrated avatar grid, and clearly marked provisional gameplay ratings. No race or ethnicity was inferred from a player's name; placeholder art is randomized across the available visual palette so the roster is represented without claiming to depict anyone's actual appearance.

Source data:

- `data/custom-players.json`
- `data/players.json` (regenerated catalog)
- `scripts/add-mambas-roster.cjs`

Verification: pack-premium tests, Chibi integration tests, build, and whitespace checks passed. Names, positions, measurements, ratings, and real photos remain pending coach confirmation.
