/**
 * ORBsignal - Yahoo Finance Proxy Server
 * Run with: node server.js
 * Fetches real intraday candle data and detects ORB breakouts.
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ─── Fetch 1-min candles from Yahoo Finance (no API key needed) ───────────────
async function fetchCandles(ticker) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}` +
    `?interval=1m&range=1d&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Yahoo returned ${res.status} for ${ticker}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${ticker}`);

  const timestamps = result.timestamp;
  const { open, high, low, close, volume } = result.indicators.quote[0];

  return timestamps.map((ts, i) => ({
    time: new Date(ts * 1000),
    open: open[i],
    high: high[i],
    low: low[i],
    close: close[i],
    volume: volume[i],
  })).filter(c => c.open !== null && c.close !== null);
}

// ─── ORB detection logic ───────────────────────────────────────────────────────
function detectORB(candles, orbMinutes = 15, volFilterPct = 150) {
  if (!candles.length) return null;

  // Find market open (first candle of the day)
  const first = candles[0].time;
  const marketOpen = new Date(first);
  marketOpen.setSeconds(0, 0);

  const orbEnd = new Date(marketOpen.getTime() + orbMinutes * 60 * 1000);

  // Split candles into ORB window vs post-ORB
  const orbCandles = candles.filter(c => c.time <= orbEnd);
  const postOrb = candles.filter(c => c.time > orbEnd);

  if (!orbCandles.length || !postOrb.length) return null;

  const orbHigh = Math.max(...orbCandles.map(c => c.high));
  const orbLow  = Math.min(...orbCandles.map(c => c.low));

  // Average volume during ORB window
  const avgOrbVol = orbCandles.reduce((s, c) => s + c.volume, 0) / orbCandles.length;

  // Scan post-ORB candles for first breakout
  for (const candle of postOrb) {
    const volRatio = candle.volume / avgOrbVol;
    const volPct   = Math.round(volRatio * 100);

    if (candle.close > orbHigh && volPct >= volFilterPct) {
      const conf = volPct >= 200 ? "high" : volPct >= 120 ? "med" : "low";
      return {
        dir: "long",
        orbHigh: +orbHigh.toFixed(2),
        orbLow:  +orbLow.toFixed(2),
        price:   +candle.close.toFixed(2),
        vol:     `+${volPct}% avg`,
        time:    candle.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        conf,
        reason:  `Closed above ORB high $${orbHigh.toFixed(2)} with ${volPct}% of avg volume`,
      };
    }

    if (candle.close < orbLow && volPct >= volFilterPct) {
      const conf = volPct >= 200 ? "high" : volPct >= 120 ? "med" : "low";
      return {
        dir: "short",
        orbHigh: +orbHigh.toFixed(2),
        orbLow:  +orbLow.toFixed(2),
        price:   +candle.close.toFixed(2),
        vol:     `+${volPct}% avg`,
        time:    candle.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        conf,
        reason:  `Closed below ORB low $${orbLow.toFixed(2)} with ${volPct}% of avg volume`,
      };
    }
  }

  // No breakout yet — return range info only
  const latest = candles[candles.length - 1];
  return {
    dir: "none",
    orbHigh: +orbHigh.toFixed(2),
    orbLow:  +orbLow.toFixed(2),
    price:   +latest.close.toFixed(2),
    vol:     "—",
    time:    latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    conf:    "low",
    reason:  `No breakout yet. Range: $${orbLow.toFixed(2)} – $${orbHigh.toFixed(2)}`,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /scan?tickers=SPY,QQQ,AAPL&orbWindow=15&volFilter=150
app.get("/scan", async (req, res) => {
  const tickers   = (req.query.tickers || "SPY,QQQ").split(",").map(t => t.trim().toUpperCase());
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const volFilter = parseInt(req.query.volFilter) || 150;

  const results = await Promise.allSettled(
    tickers.map(async ticker => {
      const candles = await fetchCandles(ticker);
      const signal  = detectORB(candles, orbWindow, volFilter);
      return { ticker, ...signal };
    })
  );

  const signals = results
    .filter(r => r.status === "fulfilled" && r.value.dir !== "none")
    .map((r, i) => ({ id: Date.now() + i, ...r.value }));

  const noBreakout = results
    .filter(r => r.status === "fulfilled" && r.value.dir === "none")
    .map((r, i) => ({ id: Date.now() + 1000 + i, ...r.value }));

  const errors = results
    .filter(r => r.status === "rejected")
    .map(r => r.reason?.message || "Unknown error");

  res.json({ signals, noBreakout, errors, scannedAt: new Date().toISOString() });
});

// GET /quote?tickers=SPY,QQQ,VIX  — latest price for header bar
app.get("/quote", async (req, res) => {
  const tickers = (req.query.tickers || "SPY,QQQ,VIX").split(",").map(t => t.trim().toUpperCase());

  const results = await Promise.allSettled(
    tickers.map(async ticker => {
      const candles = await fetchCandles(ticker);
      if (!candles.length) return { ticker, price: null, change: null };
      const latest = candles[candles.length - 1];
      const prev   = candles[candles.length - 2] ?? candles[0];
      const change = (((latest.close - prev.close) / prev.close) * 100).toFixed(2);
      return { ticker, price: +latest.close.toFixed(2), change: +change };
    })
  );

  const quotes = results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);

  res.json({ quotes });
});

app.listen(PORT, () => {
  console.log(`\n✅ ORBsignal proxy server running at http://localhost:${PORT}`);
  console.log(`   /scan   → ORB breakout detection`);
  console.log(`   /quote  → Live prices for header bar\n`);
});
