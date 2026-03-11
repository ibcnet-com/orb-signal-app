/**
 * ORBsignal - Yahoo Finance Proxy Server
 * Run with: node server.js
 */

import express from "express";
import cors from "cors";

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", service: "ORBsignal" }));

// ─── FOMC / CPI / High-Impact Economic Calendar ───────────────────────────────
// Sources: federalreserve.gov, bls.gov — updated for 2025-2026
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

// ─── Yahoo Finance news check ─────────────────────────────────────────────────
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
    return { hasNews: false, headlines: [] };
  }
}

async function fetchCandles(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo returned ${res.status} for ${ticker}`);
  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${ticker}`);
  const { open, high, low, close, volume } = result.indicators.quote[0];
  return result.timestamp.map((ts, i) => ({
    time: new Date(ts * 1000), open: open[i], high: high[i],
    low: low[i], close: close[i], volume: volume[i],
  })).filter(c => c.open !== null && c.close !== null);
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

  // ── Avoid rule: tiny ORB range < 0.2% ──────────────────────────────────────
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
  return { dir: "none", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +latest.close.toFixed(2), vol: "—", time: latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), conf: "low", reason: `No breakout yet. Range: $${orbLow.toFixed(2)} – $${orbHigh.toFixed(2)}` };
}

// ── SPY trend helper ──────────────────────────────────────────────────────────
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

// ─── Routes ───────────────────────────────────────────────────────────────────
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
  const tickers = (req.query.tickers || "SPY,QQQ,VIX").split(",").map(t => t.trim().toUpperCase());
  const results = await Promise.allSettled(tickers.map(async ticker => {
    const candles = await fetchCandles(ticker);
    if (!candles.length) return { ticker, price: null, change: null };
    const latest = candles[candles.length - 1];
    const prev   = candles[candles.length - 2] ?? candles[0];
    return { ticker, price: +latest.close.toFixed(2), change: +(((latest.close - prev.close) / prev.close) * 100).toFixed(2) };
  }));
  res.json({ quotes: results.filter(r => r.status === "fulfilled").map(r => r.value) });
});

// ─── Futures quotes ───────────────────────────────────────────────────────────
const FUTURES = [
  { symbol: "ES=F",  name: "S&P 500",      category: "index" },
  { symbol: "NQ=F",  name: "Nasdaq 100",   category: "index" },
  { symbol: "YM=F",  name: "Dow Jones",    category: "index" },
  { symbol: "RTY=F", name: "Russell 2000", category: "index" },
  { symbol: "CL=F",  name: "Crude Oil",    category: "commodity" },
  { symbol: "GC=F",  name: "Gold",         category: "commodity" },
  { symbol: "ZB=F",  name: "Treasury 30Y", category: "bond" },
];

async function fetchFuturesQuote(symbol, name, category) {
  try {
    // Use longer range to get prev close for accurate change %
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=2d&includePrePost=true`;
    const res  = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });
    if (!res.ok) return { symbol, name, category, price: null, change: null, prevClose: null };
    const json     = await res.json();
    const result   = json?.chart?.result?.[0];
    if (!result)   return { symbol, name, category, price: null, change: null };
    const closes   = result.indicators.quote[0].close.filter(Boolean);
    const meta     = result.meta;
    const price    = +(meta.regularMarketPrice ?? closes[closes.length - 1]).toFixed(2);
    const prevClose = +(meta.chartPreviousClose ?? meta.previousClose ?? closes[0]).toFixed(2);
    const change   = prevClose ? +(((price - prevClose) / prevClose) * 100).toFixed(2) : null;
    const high     = meta.regularMarketDayHigh ? +meta.regularMarketDayHigh.toFixed(2) : null;
    const low      = meta.regularMarketDayLow  ? +meta.regularMarketDayLow.toFixed(2)  : null;
    const trend    = change > 0.3 ? "up" : change < -0.3 ? "down" : "flat";
    return { symbol, name, category, price, prevClose, change, high, low, trend };
  } catch (e) {
    return { symbol, name, category, price: null, change: null, error: e.message };
  }
}

async function fetchPremarket(ticker) {
  try {
    const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=2d&includePrePost=true`;
    const res  = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
    if (!res.ok) return { ticker, prePrice: null, gapPct: null };
    const json   = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return { ticker, prePrice: null, gapPct: null };
    const meta      = result.meta;
    const prevClose = +(meta.chartPreviousClose ?? meta.previousClose ?? 0).toFixed(2);
    const prePrice  = +(meta.preMarketPrice ?? meta.regularMarketPrice ?? 0).toFixed(2);
    const gapPct    = prevClose ? +(((prePrice - prevClose) / prevClose) * 100).toFixed(2) : null;
    const gapDir    = gapPct > 0.5 ? "up" : gapPct < -0.5 ? "down" : "flat";
    return { ticker, prePrice, prevClose, gapPct, gapDir };
  } catch {
    return { ticker, prePrice: null, gapPct: null };
  }
}

app.get("/futures", async (req, res) => {
  const watchlist = (req.query.tickers || "").split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
  const [futuresResults, premarketResults] = await Promise.all([
    Promise.allSettled(FUTURES.map(f => fetchFuturesQuote(f.symbol, f.name, f.category))),
    Promise.allSettled(watchlist.map(t => fetchPremarket(t))),
  ]);
  res.json({
    futures:   futuresResults.filter(r => r.status === "fulfilled").map(r => r.value),
    premarket: premarketResults.filter(r => r.status === "fulfilled").map(r => r.value),
    fetchedAt: new Date().toISOString(),
  });
});

// Trade log stubs — will be replaced when SQLite is added back
app.post("/trades",         (req, res) => res.json({ success: true, id: Date.now() }));
app.patch("/trades/:id",    (req, res) => res.json({ success: true }));
app.get("/trades",          (req, res) => res.json({ trades: [], stats: { total:0, wins:0, losses:0, winRate:0, totalPnl:0, avgPnl:0 } }));
app.get("/trades/export",   (req, res) => { res.setHeader("Content-Type","text/csv"); res.send("id,ticker
"); });

app.listen(PORT, () => {
  console.log(`
✅ ORBsignal server running on port ${PORT}`);
  console.log(`   /scan    → ORB breakout detection`);
  console.log(`   /quote   → Live prices`);
  console.log(`   /futures → Futures + pre-market data
`);
});
