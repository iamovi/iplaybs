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

    // The player object has no club badge; it lives on the club resource.
    let clubBadgeId = null;
    if (p.club && p.club.tag) {
      try {
        const clubTag = String(p.club.tag).replace(/^#/, "");
        const cr = await fetch(`${BASE}/clubs/%23${clubTag}`, { headers });
        if (cr.ok) {
          const c = await cr.json();
          clubBadgeId = c.badgeId != null ? c.badgeId : null;
        }
      } catch (e) {}
    }

    const club = p.club
      ? { name: p.club.name, tag: p.club.tag, badgeId: clubBadgeId }
      : null;

    const player = {
      name: p.name,
      tag: p.tag,
      iconId: p.icon && p.icon.id ? p.icon.id : null,
      nameColor: p.nameColor || null,
      trophies: p.trophies,
      highestTrophies: p.highestTrophies,
      expLevel: p.expLevel,
      expPoints: p.expPoints,
      v3: p["3vs3Victories"],
      solo: p.soloVictories,
      duo: p.duoVictories,
      powerPlayPoints: p.powerPlayPoints,
      highestPowerPlayPoints: p.highestPowerPlayPoints,
      bestRoboRumbleTime: p.bestRoboRumbleTime,
      bestTimeAsBigBrawler: p.bestTimeAsBigBrawler,
      championshipQualified: !!p.isQualifiedFromChampionshipChallenge,
      club: club ? club.name : null,
      clubBadgeId: club ? club.badgeId : null,
      clubTag: club ? club.tag : null,
      brawlers: (p.brawlers || []).map((b) => ({
        id: b.id, name: b.name, power: b.power, rank: b.rank,
        trophies: b.trophies, highestTrophies: b.highestTrophies,
        starPowers: (b.starPowers || []).length,
        gadgets: (b.gadgets || []).length,
        gears: (b.gears || []).length,
        hyperCharges: (b.hyperCharges || []).length,
        starPowerNames: (b.starPowers || []).map((x) => x.name),
        gadgetNames: (b.gadgets || []).map((x) => x.name),
        gearNames: (b.gears || []).map((x) => x.name),
        hyperChargeNames: (b.hyperCharges || []).map((x) => x.name),
        buffies: b.buffies || null,
      })),
    };

    const slim = (x) => ({ tag: x.tag, name: x.name, brawler: x.brawler && x.brawler.name, power: x.brawler && x.brawler.power, trophies: x.brawler && x.brawler.trophies, trophyChange: x.brawler && x.brawler.trophyChange });
    const mineOf = (i) => {
      const b = i.battle || {};
      return [].concat(...(b.teams || []), b.players || []).filter((x) => x.tag === p.tag).map((x) => x.brawler)[0];
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
      brawler: (mineOf(i) || {}).name || null,
      teams: ((i.battle && i.battle.teams) || []).map((t) => t.map(slim)),
      players: ((i.battle && i.battle.players) || []).map(slim),
    }));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ player, battles });
  } catch (e) {
    return res.status(502).json({ error: "Couldn’t reach Brawl Stars. Try again." });
  }
};
