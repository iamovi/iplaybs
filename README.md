# iplaybs

Brawl Stars stats by player tag. Static page + one serverless function (`api/player.js`) that holds your API key.

## Deploy (free)
1. Push this folder to a GitHub repo (`.env` is git-ignored).
2. On vercel.com: **Add New → Project**, import the repo.
3. Project Settings → **Environment Variables**: add `BS_KEY` = your key.
4. Deploy. Your key must allow IP `45.79.218.79` (RoyaleAPI proxy).

## Run locally
```
npm i -g vercel
cp .env.example .env   # put your key in .env
vercel dev
```

## Rotate the key
Create a new key at developer.brawlstars.com, update `BS_KEY` in Vercel, redeploy.
