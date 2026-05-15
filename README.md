# Folklore Flashcards

A browser game that turns an `.apkg` flashcard deck into a folklore dungeon run. Pick a lore theme, choose a dungeon difficulty, reveal each answer, judge yourself honestly, and push through the deck.

Not affiliated with Anki or AnkiWeb. `.apkg` is used here as a deck file format.

**Live:** [Folklore Flashcards](https://schmidtenoah.github.io/Folklore-Flashcards/)

---

## How to Play

1. In Anki, export your deck: **File → Export**, select **Anki Deck Package (.apkg)**, and make sure **Include Media** is checked — otherwise any images in your cards won't show up.
2. Pick a folklore theme and dungeon on the upload screen, then drop the `.apkg` file (max **100 MB**).
3. For each card: read the question, hit **Draw blade · Reveal**, then judge yourself - **Hit** if you knew it, **Miss** if you didn't.
4. Three dungeon modes:
   - **Practice** - infinite lives, low pressure
   - **Focus** - 3 lives
   - **Final** - 1 life (one miss ends the run)
5. Clear every card to win. In finite-life dungeons, lose all lives and the run ends. You can **Give up** at any time to end the run early.
6. The final card of every run is the **boss** - the card with the longest answer in your deck. Missing the boss ends the run immediately, regardless of remaining lives.

Use the toggles in the top-right corner to switch light/dark theme or mute sound. Hover an enemy glyph during battle (desktop) to read a short folklore tooltip.

---

## What It Does

- Loads Anki `.apkg` decks directly in the browser — no account, no upload.
- Parses the Anki SQLite collection with sql.js.
- Renders question and answer HTML from the deck.
- Three folklore themes (Japanese, Nordic, Celtic) with per-theme glyphs, colors, and enemy rosters.
- Three dungeon difficulties from infinite-life practice to one-life exam mode.
- Self-judged recall: you decide Hit or Miss after seeing the answer.
- Lightweight payoff system with run stats, hit streaks, boss floors, best run, highest floor, cleared dungeons, and last selected dungeon/lore stored locally.
- Boss floor automatically picks the card with the longest answer in the deck — and a miss on the boss is an instant defeat.
- Synthesized sound effects via the Web Audio API (no audio files).
- Light/dark theme and persistent sound mute.
- Static Vite app deployed on GitHub Pages.

---

## Privacy and Security

Everything runs locally. Your deck never leaves your browser.

- No backend, server, database, or account system.
- No network path for sending card data anywhere.
- Run progress and UI preferences are stored only in browser localStorage.
- Anki card HTML is sanitized with DOMPurify before rendering.
- Dangerous tags (`script`, `iframe`, `object`, `embed`, `svg`, `video`, `audio`) are blocked.
- Only `.apkg` files accepted through the upload UI (100 MB file size cap).
- Collection and media limits guard against browser freezes from oversized decks (e.g. 200 MB collection, per-media and total media caps).
- Deck media is served through temporary object URLs and cleaned up when a new deck loads.
- `npm audit` reports `0 vulnerabilities` (production dependencies).

---

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- sql.js
- JSZip
- DOMPurify
- fzstd
- Vitest

---

## Local Development

```bash
npm install
npm run dev
```

```bash
npm test         # unit tests for game rules/config
npm run build    # production build
npm run preview  # preview the build
```

The Vite base path is set to `/Anki-Webgame/` for GitHub Pages. Pushes to `main` trigger a GitHub Actions workflow that builds and publishes `dist`.

---

## A Note on Folklore

The folklore themes are stylized game skins, not academic references. If any description feels inaccurate or disrespectful, please open an issue so it can be improved.

---

## License

MIT
