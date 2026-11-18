# AGENTS.md

Persistent memory for agents working in this repository. Read this before making changes.

## Git workflow (hard rules)

- **NEVER push directly to `main`.** Always create a feature branch and open a pull request.
- Only push to `main` when the user explicitly says so for that specific action.
- One pull request per issue/task. When updating an existing PR, add commits to its branch — do not open a second PR for the same work.
- Do not push to the remote or open a PR unless the user asks for it.

### Branch and PR convention

```bash
git switch -c <type>/<short-slug>      # e.g. feat/battle-summary, fix/tag-validation
git add -A
git commit -m "<imperative summary>"
git push -u origin <branch>
# then open a PR against main
```

## Commit identity

- Author and committer must be the repository owner: **Hasan Ovi <hasanovi.human@gmail.com>**.
- Do **not** add a `Co-authored-by` trailer unless the user asks for it.
- Apply identity per commit rather than changing global config:

```bash
git -c user.name="Hasan Ovi" -c user.email="hasanovi.human@gmail.com" commit -m "..."
```

## Project overview

`iplaybs` — a fan-made Brawl Stars player-stats site.

- `index.html` — static single-page UI (vanilla JS, no build step, no framework).
- `api/player.js` — Vercel serverless function. Holds the API key and proxies the Brawl Stars API.
- Deployed on Vercel (project auto-detects `index.html` + `api/`). No `vercel.json` is required.

### Architecture

```
Browser -> /api/player (Vercel function) -> bsproxy.royaleapi.dev -> api.brawlstars.com
```

- The browser never calls Brawl Stars directly; the serverless function does.
- The app routes through the RoyaleAPI proxy because Vercel functions have rotating
  outbound IPs that cannot be allowlisted. The proxy has one fixed IP: `45.79.218.79`.

## Configuration

- `BS_KEY` — Brawl Stars API token. Set in Vercel → Settings → Environment Variables.
  Never commit it. `.env` is git-ignored.
- `BS_BASE` — optional override for the API base URL. Defaults to
  `https://bsproxy.royaleapi.dev/v1`. Do not switch to `api.brawlstars.com` directly;
  requests will 403 because the allowlist cannot cover Vercel's IPs.
- The API key's allowed IP (`45.79.218.79`) is configured at key creation on
  developer.brawlstars.com — **not** in Vercel.

## Code conventions

- No build step. Keep the UI in a single `index.html` unless asked otherwise.
- **Border radius is capped at `1px`** everywhere. Do not introduce larger radii.
- Escape all API-provided strings before inserting into HTML (`esc()` helper in `index.html`).
- Preserve existing API response fields when extending the payload; the UI depends on them.
- Keep the serverless function dependency-free (no npm packages).
- Asset CDN: `https://cdn.brawlify.com` — brawler images (`/brawlers/borderless/<id>.png`),
  profile icons (`/profile-icons/regular/<id>.png`), club badges (`/club-badges/regular/<id>.png`).
  Rank image paths are not available there; render rank as text.

## Verification

- Syntax check: `node --check api/player.js`.
- For the inline UI script, extract the `<script>` block and run `node --check` on it.
- Test the function locally without real credentials by pointing `BS_BASE` at a local mock
  and setting a dummy `BS_KEY`, since a plain Node `res` lacks Vercel's `.status()`/`.json()`
  helpers (shim them in the harness).
- Delete any temporary test files and stop any test processes when finished.
