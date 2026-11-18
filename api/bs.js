// Vercel serverless function: read-only proxy for the other Brawl Stars API resources (club, members, rankings, events, brawlers).
const BASE = process.env.BS_BASE || "https://bsproxy.royaleapi.dev/v1";
const clean = (s) => String(s || "").trim().toUpperCase().replace(/^#/, "").replace(/O/g, "0");
const TAG = /^[0289PYLQGRJCUV]{3,15}$/;

module.exports = async (req, res) => {
  const key = process.env.BS_KEY;
  if (!key) return res.status(500).json({ error: "Server is missing BS_KEY." });
  const q = req.query, t = clean(q.tag), cc = String(q.cc || "global").toLowerCase();
  const id = String(q.id || ""), kind = String(q.kind || "players");
  let path = null;
  if (q.r === "club" || q.r === "members") { if (TAG.test(t)) path = `/clubs/%23${t}` + (q.r === "members" ? "/members" : ""); }
  else if (q.r === "rank") {
    if (/^(global|[a-z]{2})$/.test(cc) && /^(players|clubs|brawlers)$/.test(kind) && (kind !== "brawlers" || /^\d{1,10}$/.test(id)))
      path = `/rankings/${cc}/${kind}` + (kind === "brawlers" ? `/${id}` : "");
  }
  else if (q.r === "events") path = "/events/rotation";
  else if (q.r === "brawlers") path = "/brawlers";
  else if (q.r === "brawler") { if (/^\d{1,10}$/.test(id)) path = `/brawlers/${id}`; }
  if (!path) return res.status(400).json({ error: "Bad request. Check the tag, country code or brawler." });
  try {
    const r = await fetch(BASE + path, { headers: { Authorization: `Bearer ${key}` } });
    const E = { 404: [404, "Not found."], 403: [502, "API key rejected. Check the key and its allowed IP."], 429: [429, "Too many requests. Wait a moment and retry."], 503: [503, "Brawl Stars is under maintenance. Try later."] }[r.status];
    if (E) return res.status(E[0]).json({ error: E[1] });
    if (!r.ok) return res.status(502).json({ error: "Brawl Stars API error. Try again." });
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(await r.json());
  } catch (e) {
    return res.status(502).json({ error: "Couldn’t reach Brawl Stars. Try again." });
  }
};
