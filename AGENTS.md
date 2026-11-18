# AGENTS.md

## Git
- Never push to `main`; use a feature branch and open a PR. Only touch `main` when explicitly told.
- One PR per task; add commits to an existing PR's branch instead of opening a second one.
- Don't push or open a PR unless asked.
- Author and committer: **Hasan Ovi <hasanovi.human@gmail.com>**. No `Co-authored-by` trailer.

## Project
- `index.html` — static vanilla-JS UI, no build step.
- `api/player.js` — Vercel function; holds the API key and proxies Brawl Stars through `bsproxy.royaleapi.dev`.
- `BS_KEY` is set in Vercel env vars. Never commit it.

## Conventions
- Border radius is `0` everywhere; no rounded corners.
- Escape API strings before inserting into HTML (`esc()`).
- Preserve existing API response fields when extending the payload.
- Keep the function dependency-free.

## Verify
- `node --check api/player.js`, and the same for the inline `<script>` block.
- Remove temp test files and stop test processes when done.
