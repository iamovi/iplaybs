// Vercel serverless function: keeps your API key on the server.
const BASE = process.env.BS_BASE || "https://bsproxy.royaleapi.dev/v1";

module.exports = async (req, res) => {
  const key = process.env.BS_KEY;
  if (!key) return res.status(500).json({ error: "Server is missing BS_KEY." });

  const tag = String(req.query.tag || "").trim().toUpperCase().replace(/^#/, "").replace(/O/g, "0");
  if (!/^[0289PYLQGRJCUV]{3,15}$/.test(tag)) {
    return res.status(400).json({ error: "That doesn’t look like a valid player tag." });
  }

  const headers = { Authorization: `Bearer ${key}` };
  const url = `${BASE}/players/%23${tag}`;

  try {
    const [pr, br] = await Promise.all([
      fetch(url, { headers }),
      fetch(`${url}/battlelog`, { headers }),
    ]);

    if (pr.status === 404) return res.status(404).json({ error: "Player not found. Check the tag and try again." });
    if (pr.status === 403) return res.status(502).json({ error: "API key rejected. Check the key and its allowed IP." });
    if (pr.status === 429) return res.status(429).json({ error: "Too many requests. Wait a moment and retry." });
    if (pr.status === 503) return res.status(503).json({ error: "Brawl Stars is under maintenance. Try later." });
    if (!pr.ok) return res.status(502).json({ error: "Brawl Stars API error. Try again." });

    const p = await pr.json();
    const log = br.ok ? await br.json() : { items: [] };

    const club = p.club
      ? { name: p.club.name, tag: p.club.tag, badgeId: p.club.badgeId }
      : null;

    const player = {
      name: p.name,
      tag: p.tag,
      iconId: p.icon && p.icon.id ? p.icon.id : null,
      trophies: p.trophies,
      highestTrophies: p.highestTrophies,
      expLevel: p.expLevel,
      v3: p["3vs3Victories"],
      solo: p.soloVictories,
      duo: p.duoVictories,
      club: club ? club.name : null,
      clubBadgeId: club ? club.badgeId : null,
      clubTag: club ? club.tag : null,
      brawlers: (p.brawlers || []).map((b) => ({
        id: b.id, name: b.name, power: b.power, rank: b.rank,
        trophies: b.trophies, highestTrophies: b.highestTrophies,
      })),
    };

    const battles = (log.items || []).slice(0, 25).map((i) => ({
      time: i.battleTime,
      mode: (i.event && i.event.mode) || (i.battle && i.battle.mode) || "",
      type: (i.battle && i.battle.type) || "",
      map: (i.event && i.event.map) || "",
      result: i.battle && i.battle.result,
      rank: i.battle && i.battle.rank,
      trophyChange: i.battle && i.battle.trophyChange,
      duration: i.battle && i.battle.duration,
      starPlayer: i.battle && i.battle.starPlayer ? i.battle.starPlayer.tag : null,
    }));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ player, battles });
  } catch (e) {
    return res.status(502).json({ error: "Couldn’t reach Brawl Stars. Try again." });
  }
};
