import express from "express";
import cors from "cors";

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ status: "ok", service: "ORBsignal" }));

// Economic calendar
const HIGH_IMPACT_DATES = {
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
  "2026-01-14": { type: "CPI", label: "CPI Inflation Report" },
  "2026-02-11": { type: "CPI", label: "CPI Inflation Report" },
  "2026-03-11": { type: "CPI", label: "CPI Inflation Report" },
  "2026-04-09": { type: "CPI", label: "CPI Inflation Report" },
  "2026-05-13": { type: "CPI", label: "CPI Inflation Report" },
  "2026-06-10": { type: "CPI", label: "CPI Inflation Report" },
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
  const today = new Date().toISOString().slice(0, 10);
  const event = HIGH_IMPACT_DATES[today];
  return event ? { hasEvent: true, ...event } : { hasEvent: false };
}

async function fetchTickerNews(ticker) {
  try {
    const url = "https://query1.finance.yahoo.com/v1/finance/search?q=" + ticker + "&newsCount=5&enableFuzzyQuery=false";
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
    if (!res.ok) return { hasNews: false, headlines: [] };
    const json = await res.json();
    const news = json?.news || [];
    const keywords = ["earnings","fda","sec","lawsuit","recall","bankruptcy","merger","acquisition","indictment","investigation","beat","miss","guidance","downgrade","upgrade"];
    const flagged = news.filter(n => keywords.some(k => n.title?.toLowerCase().includes(k)));
    return { hasNews: flagged.length > 0, headlines: flagged.slice(0, 2).map(n => n.title), allCount: news.length };
  } catch {
    return { hasNews: false, headlines: [] };
  }
}

// Polygon.io data fetcher
const POLYGON_KEY = process.env.POLYGON_API_KEY || "LnOseGB36TNkPlYRAMclC4ulkZmIzirI";

async function polygonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Polygon " + res.status);
  return res.json();
}

function etDateStr() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return et.toISOString().slice(0, 10);
}

async function fetchCandles(ticker) {
  const date = etDateStr();
  const url = "https://api.polygon.io/v2/aggs/ticker/" + ticker + "/range/1/minute/" + date + "/" + date + "?adjusted=true&sort=asc&limit=500&apiKey=" + POLYGON_KEY;
  const json = await polygonFetch(url);
  if (json.status === "ERROR") throw new Error(json.error || "Polygon error for " + ticker);
  if (!json.results || json.results.length === 0) throw new Error("No candle data for " + ticker + " on " + date);
  return json.results.map(bar => ({
    time: new Date(bar.t), open: bar.o, high: bar.h, low: bar.l, close: bar.c, volume: bar.v || 0,
  }));
}

async function fetchPolygonSnapshot(ticker) {
  try {
    // Use prev close (free tier) - returns previous trading day data
    const url = "https://api.polygon.io/v2/aggs/ticker/" + ticker + "/prev?adjusted=true&apiKey=" + POLYGON_KEY;
    const json = await polygonFetch(url);
    const result = json.results?.[0];
    if (!result) return null;
    return { price: result.c || null, change: result.o > 0 ? +((result.c - result.o) / result.o * 100).toFixed(2) : null, volume: result.v || null };
  } catch { return null; }
}

async function fetchPolygonFuturesQuote(symbol) {
  try {
    // Map futures to ETF/stock proxies available on free tier
    const map = { "ES=F": "SPY", "NQ=F": "QQQ", "YM=F": "DIA", "RTY=F": "IWM", "CL=F": "USO", "GC=F": "GLD", "ZB=F": "TLT" };
    const pt = map[symbol];
    if (!pt) return null;
    const url = "https://api.polygon.io/v2/aggs/ticker/" + pt + "/prev?adjusted=true&apiKey=" + POLYGON_KEY;
    const json = await polygonFetch(url);
    const result = json.results?.[0];
    if (!result) return null;
    const price = result.c || null;
    const change = result.o > 0 ? +((result.c - result.o) / result.o * 100).toFixed(2) : null;
    const high = result.h || null;
    const low = result.l || null;
    return { price, change, high, low };
  } catch { return null; }
}

function detectORB(candles, orbMinutes = 15, volFilterPct = 150) {
  if (!candles.length) return null;
  const marketOpen = new Date(candles[0].time);
  marketOpen.setSeconds(0, 0);
  const orbEnd = new Date(marketOpen.getTime() + orbMinutes * 60 * 1000);
  const orbCandles = candles.filter(c => c.time <= orbEnd);
  const postOrb = candles.filter(c => c.time > orbEnd);
  if (!orbCandles.length || !postOrb.length) return null;
  const orbHigh = Math.max(...orbCandles.map(c => c.high));
  const orbLow = Math.min(...orbCandles.map(c => c.low));
  const avgOrbVol = orbCandles.reduce((s, c) => s + c.volume, 0) / orbCandles.length;
  const orbRangePct = ((orbHigh - orbLow) / orbLow) * 100;
  const tinyRange = orbRangePct < 0.2;
  for (const candle of postOrb) {
    const volPct = Math.round((candle.volume / avgOrbVol) * 100);
    const conf = volPct >= 200 ? "high" : volPct >= 120 ? "med" : "low";
    const time = candle.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (candle.close > orbHigh && volPct >= volFilterPct)
      return { dir: "long", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +candle.close.toFixed(2), vol: "+" + volPct + "% avg", time, conf, reason: "Closed above ORB high $" + orbHigh.toFixed(2) + " with " + volPct + "% avg vol" };
    if (candle.close < orbLow && volPct >= volFilterPct)
      return { dir: "short", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +candle.close.toFixed(2), vol: "+" + volPct + "% avg", time, conf, reason: "Closed below ORB low $" + orbLow.toFixed(2) + " with " + volPct + "% avg vol" };
  }
  const latest = candles[candles.length - 1];
  return { dir: "none", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +latest.close.toFixed(2), vol: "--", time: latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), conf: "low", reason: "No breakout yet. Range: $" + orbLow.toFixed(2) + " -- $" + orbHigh.toFixed(2) };
}

// Trade storage
import { readFileSync, writeFileSync, existsSync } from "fs";
const TRADES_FILE = "./data/trades.json";
function loadTrades() {
  try { return existsSync(TRADES_FILE) ? JSON.parse(readFileSync(TRADES_FILE, "utf8")) : []; } catch { return []; }
}
function saveTrades(trades) {
  try { writeFileSync(TRADES_FILE, JSON.stringify(trades, null, 2)); } catch {}
}

// Routes
app.get("/scan", async (req, res) => {
  const tickers = (req.query.tickers || "SPY,QQQ,AAPL,TSLA").split(",");
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const volFilter = parseInt(req.query.volFilter) || 150;
  const errors = [];
  const signals = [];
  const noBreakout = [];
  let spyTrend = { trend: "unknown", spyChange: null };
  const economicEvent = checkEconomicCalendar();
  const results = await Promise.allSettled(tickers.map(async ticker => {
    try {
      const candles = await fetchCandles(ticker);
      const news = await fetchTickerNews(ticker);
      const orb = detectORB(candles, orbWindow, volFilter);
      if (!orb) return;
      if (ticker === "SPY" || ticker === "QQQ") {
        const first = candles[0]?.close, last = candles[candles.length - 1]?.close;
        if (first && last) {
          const chg = +((last - first) / first * 100).toFixed(2);
          spyTrend = { trend: chg > 0.1 ? "up" : chg < -0.1 ? "down" : "sideways", spyChange: chg };
        }
      }
      const id = ticker + "-" + Date.now();
      const signal = { id, ticker, ...orb, news };
      if (orb.dir !== "none") signals.push(signal);
      else noBreakout.push(signal);
    } catch(e) {
      errors.push(e.message || "fetch failed");
    }
  }));
  res.json({ signals, noBreakout, errors, spyTrend, economicEvent, scannedAt: new Date().toISOString() });
});

app.get("/quote", async (req, res) => {
  const tickers = (req.query.tickers || "SPY,QQQ,VIX").split(",");
  const quotes = {};
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
    { symbol: "ES=F", name: "S&P 500", category: "index" },
    { symbol: "NQ=F", name: "Nasdaq 100", category: "index" },
    { symbol: "YM=F", name: "Dow Jones", category: "index" },
    { symbol: "RTY=F", name: "Russell 2000", category: "index" },
    { symbol: "CL=F", name: "Crude Oil", category: "commodity" },
    { symbol: "GC=F", name: "Gold", category: "commodity" },
    { symbol: "ZB=F", name: "Treasury 30Y", category: "bond" },
  ];
  const tickers = (req.query.tickers || "").split(",").filter(Boolean);
  const futuresData = await Promise.all(FUTURES.map(async f => {
    try {
      const q = await fetchPolygonFuturesQuote(f.symbol);
      return { ...f, price: q?.price || null, change: q?.change || null, high: q?.high || null, low: q?.low || null, trend: q?.change > 0.1 ? "up" : q?.change < -0.1 ? "down" : "flat", error: q ? null : "no data" };
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

app.post("/trades", (req, res) => {
  const trades = loadTrades();
  const trade = { id: Date.now(), ...req.body, outcome: "open", logged_at: new Date().toISOString() };
  trades.unshift(trade);
  saveTrades(trades);
  res.json({ ok: true, trade });
});

app.patch("/trades/:id", (req, res) => {
  const trades = loadTrades();
  const idx = trades.findIndex(t => t.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const t = trades[idx];
  const exit = parseFloat(req.body.exit_price);
  const exitType = req.body.exit_type || (exit > t.entry_price === (t.dir === "long") ? "win" : "loss");
  const pnlRaw = t.dir === "long" ? (exit - t.entry_price) * (t.shares || 1) : (t.entry_price - exit) * (t.shares || 1);
  const pnl = +pnlRaw.toFixed(2);
  const pnlPct = +(((exit - t.entry_price) / t.entry_price) * 100 * (t.dir === "long" ? 1 : -1)).toFixed(2);
  trades[idx] = { ...t, exit_price: exit, exit_type: exitType, outcome: exitType === "cancelled" ? "cancelled" : pnl > 0 ? "win" : "loss", pnl_dollar: pnl, pnl_pct: pnlPct, closed_at: new Date().toISOString() };
  saveTrades(trades);
  res.json({ ok: true });
});

app.get("/trades", (req, res) => {
  const trades = loadTrades();
  const closed = trades.filter(t => t.outcome !== "open");
  const totalPnl = +closed.reduce((s, t) => s + (t.pnl_dollar || 0), 0).toFixed(2);
  const wins = closed.filter(t => t.outcome === "win").length;
  const losses = closed.filter(t => t.outcome === "loss").length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
  res.json({ trades, stats: { totalPnl, wins, losses, winRate, total: trades.length } });
});

app.get("/trades/export", (req, res) => {
  const trades = loadTrades();
  const header = "id,ticker,dir,entry_price,exit_price,pnl_dollar,pnl_pct,outcome,logged_at,closed_at";
  const rows = trades.map(t => [t.id,t.ticker,t.dir,t.entry_price,t.exit_price||"",t.pnl_dollar||"",t.pnl_pct||"",t.outcome,t.logged_at,t.closed_at||""].join(","));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=trades.csv");
  res.send([header, ...rows].join("\n"));
});

app.get("/yesterday", async (req, res) => {
  const tickers = (req.query.tickers || "SPY,QQQ,AAPL,TSLA").split(",");
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const maxRisk = parseInt(req.query.maxRisk) || 1000;
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  et.setDate(et.getDate() - (et.getDay() === 1 ? 3 : et.getDay() === 0 ? 2 : 1));
  const yesterday = et.toISOString().slice(0, 10);
  const results = await Promise.allSettled(tickers.map(async ticker => {
    const url = "https://api.polygon.io/v2/aggs/ticker/" + ticker + "/range/1/minute/" + yesterday + "/" + yesterday + "?adjusted=true&sort=asc&limit=500&apiKey=" + POLYGON_KEY;
    const json = await polygonFetch(url);
    if (!json.results?.length) return { ticker, dir: "none", date: yesterday };
    const candles = json.results.map(bar => ({ time: new Date(bar.t), open: bar.o, high: bar.h, low: bar.l, close: bar.c, volume: bar.v || 0 }));
    const orb = detectORB(candles, orbWindow, 100);
    if (!orb || orb.dir === "none") return { ticker, dir: "none", orbHigh: orb?.orbHigh, orbLow: orb?.orbLow, date: yesterday };
    const entry = orb.price;
    const orbRange = orb.orbHigh - orb.orbLow;
    const stop = orb.dir === "long" ? +(orb.orbHigh - orbRange * 0.1).toFixed(2) : +(orb.orbLow + orbRange * 0.1).toFixed(2);
    const riskPerShare = Math.abs(entry - stop);
    const shares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
    const t1 = orb.dir === "long" ? +(entry + riskPerShare * 2).toFixed(2) : +(entry - riskPerShare * 2).toFixed(2);
    const postOrb = candles.filter(c => c.time > new Date(candles[0].time.getTime() + orbWindow * 60000));
    let exitPrice = postOrb[postOrb.length - 1]?.close || entry;
    let t1Hit = false;
    for (const c of postOrb) {
      if (orb.dir === "long" && c.high >= t1) { exitPrice = t1; t1Hit = true; break; }
      if (orb.dir === "short" && c.low <= t1) { exitPrice = t1; t1Hit = true; break; }
      if (orb.dir === "long" && c.low <= stop) { exitPrice = stop; break; }
      if (orb.dir === "short" && c.high >= stop) { exitPrice = stop; break; }
    }
    const eod = postOrb[postOrb.length - 1]?.close || entry;
    const pnlPerShare = orb.dir === "long" ? exitPrice - entry : entry - exitPrice;
    const pnl = +(pnlPerShare * shares).toFixed(2);
    const pnlPct = +(pnlPerShare / entry * 100 * (orb.dir === "long" ? 1 : -1)).toFixed(2);
    const outcome = pnl > 0 ? "win" : pnl < 0 ? "loss" : "flat";
    return { ticker, date: yesterday, dir: orb.dir, entry: +entry.toFixed(2), stop: +stop.toFixed(2), t1: +t1.toFixed(2), exitPrice, exitType: t1Hit ? "T1 hit" : "EOD close", eod: +eod.toFixed(2), shares, pnl, pnlPct, outcome, conf: orb.conf, time: orb.time };
  }));
  const date = results.find(r => r.status === "fulfilled" && r.value.date)?.value?.date || null;
  res.json({ date, results: results.map(r => r.status === "fulfilled" ? r.value : { ticker: "?", dir: "none", error: r.reason?.message }) });
});

app.post("/ai-postmortem", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt" });
    const KEY = process.env.ANTHROPIC_API_KEY;
    if (!KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await r.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    res.json({ text });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("ORBsignal server running on port " + PORT);
});
