import express from "express";
import cors from "cors";
import pg from "pg";
const { Pool } = pg;

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// PostgreSQL setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        report_date DATE NOT NULL,
        report_type VARCHAR(20) NOT NULL,
        ticker VARCHAR(10) NOT NULL,
        dir VARCHAR(10),
        entry NUMERIC,
        exit_price NUMERIC,
        pnl NUMERIC,
        pnl_pct NUMERIC,
        outcome VARCHAR(10),
        conf VARCHAR(10),
        entry_time VARCHAR(20),
        orb_range_pct NUMERIC,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_summaries (
        id SERIAL PRIMARY KEY,
        report_date DATE NOT NULL UNIQUE,
        orb_net NUMERIC,
        orb_wins INTEGER,
        orb_losses INTEGER,
        orb_win_rate NUMERIC,
        reverse_net NUMERIC,
        reverse_wins INTEGER,
        reverse_losses INTEGER,
        edge NUMERIC,
        total_signals INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("DB initialized");
  } catch(e) {
    console.error("DB init error:", e.message);
  }
}
initDB();

async function saveReport(date, results) {
  try {
    for (const r of results) {
      if (!r.dir || r.dir === "none") continue;
      await pool.query(
        `INSERT INTO daily_reports (report_date, report_type, ticker, dir, entry, exit_price, pnl, pnl_pct, outcome, conf, entry_time, orb_range_pct)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT DO NOTHING`,
        [date, "orb", r.ticker, r.dir, r.entry, r.exitPrice, r.pnl, r.pnlPct, r.outcome, r.conf, r.time, r.orbRangePct || null]
      );
    }
    const signals = results.filter(r => r.dir && r.dir !== "none");
    const wins = signals.filter(r => r.outcome === "win").length;
    const losses = signals.filter(r => r.outcome === "loss").length;
    const orbNet = signals.reduce((s, r) => s + (r.pnl || 0), 0);
    const winRate = signals.length > 0 ? Math.round(wins / signals.length * 100) : 0;
    await pool.query(
      `INSERT INTO report_summaries (report_date, orb_net, orb_wins, orb_losses, orb_win_rate, reverse_net, reverse_wins, reverse_losses, edge, total_signals)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (report_date) DO UPDATE SET orb_net=$2, orb_wins=$3, orb_losses=$4, orb_win_rate=$5, reverse_net=$6, reverse_wins=$7, reverse_losses=$8, edge=$9, total_signals=$10`,
      [date, orbNet, wins, losses, winRate, -orbNet, losses, wins, orbNet * 2, signals.length]
    );
    console.log("Saved report for", date);
  } catch(e) {
    console.error("saveReport error:", e.message);
  }
}

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
  const url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker + "?interval=1m&range=1d&includePrePost=false";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    }
  });
  if (!res.ok) throw new Error("Yahoo " + res.status + " for " + ticker);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("No data for " + ticker);
  const { open, high, low, close, volume } = result.indicators.quote[0];
  return result.timestamp.map((ts, i) => ({
    time: new Date(ts * 1000), open: open[i], high: high[i], low: low[i], close: close[i], volume: volume[i] || 0,
  })).filter(c => c.open !== null && c.close !== null);
}

async function fetchPolygonSnapshot(ticker) {
  try {
    const url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker + "?interval=1d&range=2d&includePrePost=true";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.previousClose || null;
    const prevClose = meta.previousClose || null;
    const change = price && prevClose ? +((price - prevClose) / prevClose * 100).toFixed(2) : null;
    return { price, change, volume: meta.regularMarketVolume || null };
  } catch { return null; }
}

async function fetchPolygonFuturesQuote(symbol) {
  try {
    const url = "https://query2.finance.yahoo.com/v8/finance/chart/" + symbol + "?interval=1d&range=2d&includePrePost=true";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.previousClose || null;
    const prevClose = meta.previousClose || null;
    const change = price && prevClose ? +((price - prevClose) / prevClose * 100).toFixed(2) : null;
    const quotes = result.indicators?.quote?.[0];
    const high = quotes?.high?.[quotes.high.length - 1] || null;
    const low = quotes?.low?.[quotes.low.length - 1] || null;
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
  const forceOverride = req.query.force === "true";
  const errors = [];
  const signals = [];
  const noBreakout = [];
  let spyTrend = { trend: "unknown", spyChange: null };
  const economicEvent = checkEconomicCalendar();

  // Market hours check (9:30am - 4:00pm ET, Mon-Fri)
  const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nowET.getDay();
  const h = nowET.getHours();
  const m = nowET.getMinutes();
  const mins = h * 60 + m;
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = isWeekday && mins >= 9 * 60 + 30 && mins < 16 * 60;
  const isPreMarket = isWeekday && mins >= 4 * 60 && mins < 9 * 60 + 30;
  const marketStatus = isMarketHours ? "open" : isPreMarket ? "premarket" : !isWeekday ? "weekend" : "closed";

  if (!isMarketHours && !forceOverride) {
    return res.json({
      signals: [], noBreakout: [], errors: [],
      spyTrend: { trend: "unknown", spyChange: null },
      economicEvent,
      marketClosed: true,
      marketStatus,
      scannedAt: new Date().toISOString(),
      message: marketStatus === "weekend" ? "Markets closed — weekend" :
                marketStatus === "premarket" ? "Pre-market hours — ORB signals start at 9:30 AM ET" :
                "Markets closed — ORB signals available Mon-Fri 9:30 AM - 4:00 PM ET"
    });
  }
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
  const hour = et.getHours();
  const minute = et.getMinutes();
  const day = et.getDay(); // 0=Sun, 1=Mon, 6=Sat
  const marketClosed = hour > 16 || (hour === 16 && minute >= 30);

  // If market has closed today (after 4:30pm ET) on a weekday, show today's session
  // Otherwise show the previous trading day
  if (day >= 1 && day <= 5 && marketClosed) {
    // Use today - market is closed, today's data is complete
  } else {
    // Go back to last trading day
    if (day === 1) et.setDate(et.getDate() - 3);      // Monday -> Friday
    else if (day === 0) et.setDate(et.getDate() - 2); // Sunday -> Friday
    else if (day === 6) et.setDate(et.getDate() - 1); // Saturday -> Friday
    else et.setDate(et.getDate() - 1);                // Weekday before close -> yesterday
  }
  const yesterday = et.toISOString().slice(0, 10);
  console.log("Yesterday report date:", yesterday, "ET hour:", hour, "marketClosed:", marketClosed);
  const results = await Promise.allSettled(tickers.map(async ticker => {
    const url = "https://query2.finance.yahoo.com/v8/finance/chart/" + ticker + "?interval=1m&range=5d&includePrePost=false";
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" } });
    if (!res.ok) throw new Error("Yahoo " + res.status + " for " + ticker);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return { ticker, dir: "none", date: yesterday };
    const { open, high, low, close, volume } = result.indicators.quote[0];
    // Filter to just the target date
    const allCandles = result.timestamp.map((ts, i) => ({
      time: new Date(ts * 1000), open: open[i], high: high[i], low: low[i], close: close[i], volume: volume[i] || 0
    })).filter(c => c.open !== null && c.close !== null);
    const candles = allCandles.filter(c => c.time.toISOString().slice(0,10) === yesterday);
    if (!candles.length) return { ticker, dir: "none", date: yesterday };
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
  const finalResults = results.map(r => r.status === "fulfilled" ? r.value : { ticker: "?", dir: "none", error: r.reason?.message });
  if (date) saveReport(date, finalResults).catch(() => {});
  res.json({ date, results: finalResults });
});

app.post("/ai-postmortem", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt" });
    const KEY = process.env.GROQ_API_KEY;
    if (!KEY) return res.status(500).json({ error: "GROQ_API_KEY not set" });
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: "Groq error " + r.status + ": " + err });
    }
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || "";
    res.json({ text });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Analytics: historical summaries for trend chart
app.get("/analytics/summaries", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM report_summaries ORDER BY report_date DESC LIMIT 30");
    res.json({ summaries: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Analytics: signal quality by confidence
app.get("/analytics/quality", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT conf,
        COUNT(*) as total,
        SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END) as wins,
        ROUND(AVG(pnl)::numeric, 2) as avg_pnl,
        ROUND(SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as win_rate
      FROM daily_reports WHERE conf IS NOT NULL
      GROUP BY conf ORDER BY win_rate DESC
    `);
    res.json({ quality: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Analytics: time of day
app.get("/analytics/timeofday", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT entry_time,
        COUNT(*) as total,
        SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END) as wins,
        ROUND(SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as win_rate,
        ROUND(AVG(pnl)::numeric, 2) as avg_pnl
      FROM daily_reports WHERE entry_time IS NOT NULL
      GROUP BY entry_time ORDER BY entry_time
    `);
    res.json({ timeofday: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Analytics: ticker scorecard
app.get("/analytics/tickers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ticker,
        COUNT(*) as total,
        SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END) as wins,
        ROUND(SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as win_rate,
        ROUND(SUM(pnl)::numeric, 2) as total_pnl,
        ROUND(AVG(pnl)::numeric, 2) as avg_pnl
      FROM daily_reports
      GROUP BY ticker ORDER BY win_rate DESC
    `);
    res.json({ tickers: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Analytics: ORB range analysis
app.get("/analytics/ranges", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        CASE
          WHEN orb_range_pct < 0.2 THEN 'Tiny (<0.2%)'
          WHEN orb_range_pct < 0.5 THEN 'Small (0.2-0.5%)'
          WHEN orb_range_pct < 1.0 THEN 'Medium (0.5-1%)'
          ELSE 'Large (>1%)'
        END as range_bucket,
        COUNT(*) as total,
        SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END) as wins,
        ROUND(SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as win_rate,
        ROUND(AVG(pnl)::numeric, 2) as avg_pnl
      FROM daily_reports WHERE orb_range_pct IS NOT NULL
      GROUP BY range_bucket ORDER BY win_rate DESC
    `);
    res.json({ ranges: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log("ORBsignal server running on port " + PORT);
});
