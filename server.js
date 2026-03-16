/**
 * ORBsignal - Yahoo Finance Proxy Server
 * Run with: node server.js
 */

import express from "express";
import cors from "cors";
import yahooFinance from "yahoo-finance2";

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// â”€â”€â”€ Health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/", (req, res) => res.json({ status: "ok", service: "ORBsignal" }));

// â”€â”€â”€ FOMC / CPI / High-Impact Economic Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sources: federalreserve.gov, bls.gov â€” updated for 2025-2026
const HIGH_IMPACT_DATES = {
  // FOMC Meeting dates (decision days)
  "2025-01-29": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-03-19": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-05-07": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-06-18": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-07-30": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-09-17": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-10-29": { type: "FOMC", label: "FOMC Rate Decision" },
  "2025-12-10": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-01-28": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-03-18": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-04-29": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-06-17": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-07-29": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-09-16": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-11-04": { type: "FOMC", label: "FOMC Rate Decision" },
  "2026-12-16": { type: "FOMC", label: "FOMC Rate Decision" },
  // CPI release dates 2025
  "2025-01-15": { type: "CPI", label: "CPI Inflation Report" },
  "2025-02-12": { type: "CPI", label: "CPI Inflation Report" },
  "2025-03-12": { type: "CPI", label: "CPI Inflation Report" },
  "2025-04-10": { type: "CPI", label: "CPI Inflation Report" },
  "2025-05-13": { type: "CPI", label: "CPI Inflation Report" },
  "2025-06-11": { type: "CPI", label: "CPI Inflation Report" },
  "2025-07-15": { type: "CPI", label: "CPI Inflation Report" },
  "2025-08-12": { type: "CPI", label: "CPI Inflation Report" },
  "2025-09-10": { type: "CPI", label: "CPI Inflation Report" },
  "2025-10-15": { type: "CPI", label: "CPI Inflation Report" },
  "2025-11-13": { type: "CPI", label: "CPI Inflation Report" },
  "2025-12-10": { type: "CPI", label: "CPI Inflation Report" },
  // CPI release dates 2026
  "2026-01-14": { type: "CPI", label: "CPI Inflation Report" },
  "2026-02-11": { type: "CPI", label: "CPI Inflation Report" },
  "2026-03-11": { type: "CPI", label: "CPI Inflation Report" },
  "2026-04-09": { type: "CPI", label: "CPI Inflation Report" },
  "2026-05-13": { type: "CPI", label: "CPI Inflation Report" },
  "2026-06-10": { type: "CPI", label: "CPI Inflation Report" },
  // NFP (Jobs Report) - first Friday of each month
  "2025-01-10": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-02-07": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-03-07": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-04-04": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-05-02": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-06-06": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-07-03": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-08-01": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-09-05": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-10-03": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-11-07": { type: "NFP", label: "Jobs Report (NFP)" },
  "2025-12-05": { type: "NFP", label: "Jobs Report (NFP)" },
  "2026-01-09": { type: "NFP", label: "Jobs Report (NFP)" },
  "2026-02-06": { type: "NFP", label: "Jobs Report (NFP)" },
  "2026-03-06": { type: "NFP", label: "Jobs Report (NFP)" },
  "2026-04-03": { type: "NFP", label: "Jobs Report (NFP)" },
  "2026-05-01": { type: "NFP", label: "Jobs Report (NFP)" },
  "2026-06-05": { type: "NFP", label: "Jobs Report (NFP)" },
};

function checkEconomicCalendar() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const event = HIGH_IMPACT_DATES[today];
  return event ? { hasEvent: true, ...event } : { hasEvent: false };
}

// â”€â”€â”€ Yahoo Finance news check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchTickerNews(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${ticker}&newsCount=5&enableFuzzyQuery=false`;
    const res  = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });
    if (!res.ok) return { hasNews: false, headlines: [] };
    const json = await res.json();
    const news = json?.news || [];
    // Flag if any headline contains high-impact keywords
    const keywords = ["earnings", "fda", "sec", "lawsuit", "recall", "bankruptcy", "merger", "acquisition", "indictment", "investigation", "beat", "miss", "guidance", "downgrade", "upgrade"];
    const flagged  = news.filter(n => keywords.some(k => n.title?.toLowerCase().includes(k)));
    return {
      hasNews:   flagged.length > 0,
      headlines: flagged.slice(0, 2).map(n => n.title),
      allCount:  news.length,
    };
  } catch {
    return// Polygon.io data fetcher
const POLYGON_KEY = process.env.POLYGON_API_KEY || "LnOseGB36TNkPlYRAMclC4ulkZmIzirI";

async function polygonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Polygon " + res.status);
  return res.json();
}

function etDateStr() {
  const now = new Date();
  const et  = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return et.toISOString().slice(0, 10);
}

function detectORB(candles, orbMinutes = 15, volFilterPct = 150) {
  if (!candles.length) return null;
  const marketOpen = new Date(candles[0].time);
  marketOpen.setSeconds(0, 0);
  const orbEnd     = new Date(marketOpen.getTime() + orbMinutes * 60 * 1000);
  const orbCandles = candles.filter(c => c.time <= orbEnd);
  const postOrb    = candles.filter(c => c.time >  orbEnd);
  if (!orbCandles.length || !postOrb.length) return null;
  const orbHigh    = Math.max(...orbCandles.map(c => c.high));
  const orbLow     = Math.min(...orbCandles.map(c => c.low));
  const avgOrbVol  = orbCandles.reduce((s, c) => s + c.volume, 0) / orbCandles.length;

  // â”€â”€ Avoid rule: tiny ORB range < 0.2% â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const orbRangePct = ((orbHigh - orbLow) / orbLow) * 100;
  const tinyRange   = orbRangePct < 0.2;

  for (const candle of postOrb) {
    const volPct = Math.round((candle.volume / avgOrbVol) * 100);
    const conf   = volPct >= 200 ? "high" : volPct >= 120 ? "med" : "low";
    const time   = candle.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (candle.close > orbHigh && volPct >= volFilterPct)
      return { dir: "long",  orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +candle.close.toFixed(2), vol: `+${volPct}% avg`, time, conf, reason: `Closed above ORB high $${orbHigh.toFixed(2)} with ${volPct}% avg vol` };
    if (candle.close < orbLow  && volPct >= volFilterPct)
      return { dir: "short", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +candle.close.toFixed(2), vol: `+${volPct}% avg`, time, conf, reason: `Closed below ORB low $${orbLow.toFixed(2)} with ${volPct}% avg vol` };
  }
  const latest = candles[candles.length - 1];
  return { dir: "none", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +latest.close.toFixed(2), vol: "â€”", time: latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), conf: "low", reason: `No breakout yet. Range: $${orbLow.toFixed(2)} â€“ $${orbHigh.toFixed(2)}` };
}

// â”€â”€ SPY trend helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getSpyTrend() {
  try {
    const candles = await fetchCandles("SPY");
    if (candles.length < 2) return { trend: "unknown", spyChange: null };
    const open  = candles[0].open;
    const last  = candles[candles.length - 1].close;
    const chg   = ((last - open) / open) * 100;
    const trend = chg > 0.3 ? "up" : chg < -0.3 ? "down" : "sideways";
    return { trend, spyChange: +chg.toFixed(2) };
  } catch {
    return { trend: "unknown", spyChange: null };
  }
}

// â”€â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/scan", async (req, res) => {
  const tickers   = (req.query.tickers || "SPY,QQQ").split(",").map(t => t.trim().toUpperCase());
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const volFilter = parseInt(req.query.volFilter) || 150;

  const [results, spyTrend, economicEvent] = await Promise.all([
    Promise.allSettled(
      tickers.map(async ticker => {
        const [candles, news] = await Promise.all([
          fetchCandles(ticker),
          fetchTickerNews(ticker),
        ]);
        return { ticker, news, ...detectORB(candles, orbWindow, volFilter) };
      })
    ),
    getSpyTrend(),
    Promise.resolve(checkEconomicCalendar()),
  ]);

  res.json({
    signals:       results.filter(r => r.status === "fulfilled" && r.value.dir !== "none").map((r, i) => ({ id: Date.now() + i, ...r.value })),
    noBreakout:    results.filter(r => r.status === "fulfilled" && r.value.dir === "none").map((r, i) => ({ id: Date.now() + 1000 + i, ...r.value })),
    errors:        results.filter(r => r.status === "rejected").map(r => r.reason?.message),
    spyTrend,
    economicEvent,
    scannedAt:     new Date().toISOString(),
  });
});

app.get("/quote", async (req, res) => {
  const tickers = (req.query.tickers || "SPY,QQQ,VIX").split(",");
  const quotes  = {};
  await Promise.all(tickers.map(async t => {
    try {
      const snap = await fetchPolygonSnapshot(t);
      if (snap) quotes[t] = snap;
    } catch {}
  }));
  res.json({ quotes, fetchedAt: new Date().toISOString() });
});


app.get("/futures", async (req, res) => {
  const FUTURES = [
    { symbol: "ES=F",  name: "S&P 500",      category: "index"     },
    { symbol: "NQ=F",  name: "Nasdaq 100",   category: "index"     },
    { symbol: "YM=F",  name: "Dow Jones",    category: "index"     },
    { symbol: "RTY=F", name: "Russell 2000", category: "index"     },
    { symbol: "CL=F",  name: "Crude Oil",    category: "commodity" },
    { symbol: "GC=F",  name: "Gold",         category: "commodity" },
    { symbol: "ZB=F",  name: "Treasury 30Y", category: "bond"      },
  ];
  const tickers = (req.query.tickers || "").split(",").filter(Boolean);
  const futuresData = await Promise.all(FUTURES.map(async f => {
    try {
      const q = await fetchPolygonFuturesQuote(f.symbol);
      return { ...f, price: q?.price || null, change: q?.change || null,
               high: q?.high || null, low: q?.low || null,
               trend: q?.change > 0.1 ? "up" : q?.change < -0.1 ? "down" : "flat",
               error: q ? null : "no data" };
    } catch(e) { return { ...f, price: null, change: null, error: e.message }; }
  }));
  const premarket = await Promise.all(tickers.map(async ticker => {
    try {
      const snap = await fetchPolygonSnapshot(ticker);
      return { ticker, prePrice: snap?.price || null, prevClose: null, gapPct: null, gapDir: null };
    } catch { return { ticker, prePrice: null, prevClose: null, gapPct: null }; }
  }));
  res.json({ futures: futuresData, premarket, fetchedAt: new Date().toISOString() });
});


app.get("/trades", (req, res) => {
  const trades = loadTrades();
  res.json({ trades, stats: calcStats(trades) });
});

app.get("/trades/export", (req, res) => {
  const trades = loadTrades();
  const header = "id,ticker,dir,entry,stop,target1,shares,status,outcome,exitPrice,pnl,loggedAt,closedAt";
  const rows   = trades.map(t =>
    [t.id,t.ticker,t.dir,t.entry,t.stop,t.target1,t.shares,t.status,t.outcome,t.exitPrice,t.pnl,t.loggedAt,t.closedAt].join(",")
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=trades.csv");
  res.send([header, ...rows].join("\r\n"));
});

// â”€â”€â”€ Yesterday's ORB Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchYesterdayCandles(ticker) {
  // range=5d gives us multiple days of 1m data â€” we extract yesterday's session
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=5d&includePrePost=false`;
  const res  = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${ticker}`);
  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result)  throw new Error(`No data for ${ticker}`);
  const { open, high, low, close, volume } = result.indicators.quote[0];
  const allCandles = result.timestamp.map((ts, i) => ({
    time: new Date(ts * 1000), open: open[i], high: high[i],
    low: low[i], close: close[i], volume: volume[i],
  })).filter(c => c.open !== null && c.close !== null);

  // Group by date, pick the most recent completed session (not today)
  const today = new Date().toDateString();
  const byDate = {};
  for (const c of allCandles) {
    const d = c.time.toDateString();
    if (d === today) continue; // skip today
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(c);
  }
  const dates = Object.keys(byDate).sort((a,b) => new Date(b) - new Date(a));
  return { candles: byDate[dates[0]] || [], date: dates[0] || null };
}

app.get("/yesterday", async (req, res) => {
  const tickers   = (req.query.tickers || "SPY").split(",").map(t => t.trim().toUpperCase());
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const maxRisk   = parseFloat(req.query.maxRisk) || 1000;

  const results = await Promise.allSettled(tickers.map(async ticker => {
    const { candles, date } = await fetchYesterdayCandles(ticker);
    if (!candles.length) return { ticker, dir: "none", date, error: "No data" };

    const orb = detectORB(candles, orbWindow, 100); // volFilter=100 for yesterday (no filter)
    if (!orb || orb.dir === "none") return { ticker, dir: "none", date, orbHigh: orb?.orbHigh, orbLow: orb?.orbLow, price: orb?.price };

    // Entry = breakout candle close
    const entry = orb.price;
    const orbRange = orb.orbHigh - orb.orbLow;
    const stop  = orb.dir === "long"
      ? +(orb.orbHigh - orbRange * 0.1).toFixed(2)
      : +(orb.orbLow  + orbRange * 0.1).toFixed(2);
    const riskPerShare = Math.abs(entry - stop);
    const shares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
    const t1 = orb.dir === "long"
      ? +(entry + riskPerShare * 2).toFixed(2)
      : +(entry - riskPerShare * 2).toFixed(2);
    const eod = candles[candles.length - 1].close;

    // Find the breakout candle index
    const breakoutTime = candles.find(c =>
      orb.dir === "long" ? c.close > orb.orbHigh : c.close < orb.orbLow
    )?.time;
    const postBreakout = breakoutTime
      ? candles.filter(c => c.time >= breakoutTime)
      : [];

    // Check if T1 was hit
    let t1Hit = false;
    let exitPrice = +eod.toFixed(2);
    for (const c of postBreakout) {
      if (orb.dir === "long"  && c.high  >= t1) { t1Hit = true; exitPrice = t1; break; }
      if (orb.dir === "short" && c.low   <= t1) { t1Hit = true; exitPrice = t1; break; }
    }

    const pnl = orb.dir === "long"
      ? +((exitPrice - entry) * shares).toFixed(0)
      : +((entry - exitPrice) * shares).toFixed(0);
    const pnlPct = entry > 0 ? +(((exitPrice - entry) / entry) * 100 * (orb.dir === "short" ? -1 : 1)).toFixed(2) : 0;
    const outcome = pnl > 0 ? "win" : pnl < 0 ? "loss" : "flat";

    return {
      ticker, date, dir: orb.dir,
      orbHigh: orb.orbHigh, orbLow: orb.orbLow, orbRangePct: orb.orbRangePct,
      entry: +entry.toFixed(2), stop: +stop.toFixed(2), t1: +t1.toFixed(2),
      exitPrice, exitType: t1Hit ? "T1 hit" : "EOD close",
      eod: +eod.toFixed(2), shares, pnl, pnlPct, outcome,
      conf: orb.conf, time: orb.time,
    };
  }));

  const date = results.find(r => r.status === "fulfilled" && r.value.date)?.value?.date || null;
  res.json({
    date,
    results: results.map(r => r.status === "fulfilled" ? r.value : { ticker: "?", dir: "none", error: r.reason?.message }),
  });
});

// AI Postmortem proxy (avoids CORS on direct browser->Anthropic calls)
app.post("/ai-postmortem", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt" });
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    res.json({ text });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});


app.listen(PORT, () => {
  console.log(`\nâœ… ORBsignal server running on port ${PORT}`);
  console.log(`   /scan    â†’ ORB breakout detection`);
  console.log(`   /quote   â†’ Live prices`);
  console.log(`   /futures â†’ Futures + pre-market data\n`);
});






