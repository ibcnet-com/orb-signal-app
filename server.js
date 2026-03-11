/**
 * ORBsignal Server — Yahoo Finance + Broker API + Trade Log
 */
import express from "express";
import cors    from "cors";
import { broker, BROKER_NAME, BROKER_MODE } from "./brokers/index.js";
import { logTrade, closeTrade, getTrades, getStats, toCSV } from "./db/tradelog.js";

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// ─── Yahoo Finance ────────────────────────────────────────────────────────────
async function fetchCandles(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d&includePrePost=false`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${ticker}`);
  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result)  throw new Error(`No data for ${ticker}`);
  const { open, high, low, close, volume } = result.indicators.quote[0];
  return result.timestamp.map((ts, i) => ({ time: new Date(ts * 1000), open: open[i], high: high[i], low: low[i], close: close[i], volume: volume[i] })).filter(c => c.open !== null && c.close !== null);
}

function detectORB(candles, orbMinutes = 15, volFilterPct = 150) {
  if (!candles.length) return null;
  const marketOpen = new Date(candles[0].time); marketOpen.setSeconds(0, 0);
  const orbEnd     = new Date(marketOpen.getTime() + orbMinutes * 60 * 1000);
  const orbCandles = candles.filter(c => c.time <= orbEnd);
  const postOrb    = candles.filter(c => c.time >  orbEnd);
  if (!orbCandles.length || !postOrb.length) return null;
  const orbHigh   = Math.max(...orbCandles.map(c => c.high));
  const orbLow    = Math.min(...orbCandles.map(c => c.low));
  const avgOrbVol = orbCandles.reduce((s, c) => s + c.volume, 0) / orbCandles.length;
  for (const candle of postOrb) {
    const volPct = Math.round((candle.volume / avgOrbVol) * 100);
    const conf   = volPct >= 200 ? "high" : volPct >= 120 ? "med" : "low";
    const time   = candle.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (candle.close > orbHigh && volPct >= volFilterPct)
      return { dir: "long",  orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), price: +candle.close.toFixed(2), vol: `+${volPct}% avg`, time, conf, reason: `Closed above ORB high $${orbHigh.toFixed(2)} with ${volPct}% avg vol` };
    if (candle.close < orbLow  && volPct >= volFilterPct)
      return { dir: "short", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), price: +candle.close.toFixed(2), vol: `+${volPct}% avg`, time, conf, reason: `Closed below ORB low $${orbLow.toFixed(2)} with ${volPct}% avg vol` };
  }
  const latest = candles[candles.length - 1];
  return { dir: "none", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), price: +latest.close.toFixed(2), vol: "—", time: latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), conf: "low", reason: `No breakout yet. Range: $${orbLow.toFixed(2)} – $${orbHigh.toFixed(2)}` };
}

// ─── Market data routes ───────────────────────────────────────────────────────
app.get("/scan", async (req, res) => {
  const tickers   = (req.query.tickers || "SPY,QQQ").split(",").map(t => t.trim().toUpperCase());
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const volFilter = parseInt(req.query.volFilter) || 150;
  const results   = await Promise.allSettled(tickers.map(async ticker => ({ ticker, ...detectORB(await fetchCandles(ticker), orbWindow, volFilter) })));
  res.json({
    signals:    results.filter(r => r.status === "fulfilled" && r.value.dir !== "none").map((r, i) => ({ id: Date.now() + i, ...r.value })),
    noBreakout: results.filter(r => r.status === "fulfilled" && r.value.dir === "none").map((r, i) => ({ id: Date.now() + 1000 + i, ...r.value })),
    errors:     results.filter(r => r.status === "rejected").map(r => r.reason?.message),
    scannedAt:  new Date().toISOString(),
  });
});

app.get("/quote", async (req, res) => {
  const tickers = (req.query.tickers || "SPY,QQQ,VIX").split(",").map(t => t.trim().toUpperCase());
  const results = await Promise.allSettled(tickers.map(async ticker => {
    const candles = await fetchCandles(ticker);
    if (!candles.length) return { ticker, price: null, change: null };
    const latest = candles[candles.length - 1], prev = candles[candles.length - 2] ?? candles[0];
    return { ticker, price: +latest.close.toFixed(2), change: +(((latest.close - prev.close) / prev.close) * 100).toFixed(2) };
  }));
  res.json({ quotes: results.filter(r => r.status === "fulfilled").map(r => r.value) });
});

// ─── Trade log routes ─────────────────────────────────────────────────────────

// POST /trades — log a new trade signal
app.post("/trades", (req, res) => {
  try {
    const id = logTrade(req.body);
    res.json({ success: true, id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /trades/:id — close a trade with outcome
app.patch("/trades/:id", (req, res) => {
  try {
    const { exit_price, outcome } = req.body;
    if (!exit_price || !outcome) return res.status(400).json({ error: "exit_price and outcome required" });
    const trade = closeTrade(parseInt(req.params.id), exit_price, outcome);
    if (!trade) return res.status(404).json({ error: "Trade not found" });
    res.json({ success: true, trade });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /trades — get trade history
app.get("/trades", (req, res) => {
  try {
    const trades = getTrades(parseInt(req.query.limit) || 100);
    const stats  = getStats();
    res.json({ trades, stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /trades/export — download as CSV
app.get("/trades/export", (req, res) => {
  try {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="tradelog-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(toCSV());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Broker routes ────────────────────────────────────────────────────────────
app.get("/broker",    (req, res) => res.json({ broker: BROKER_NAME, mode: BROKER_MODE }));
app.get("/account",   async (req, res) => { try { res.json({ account:   await broker.getAccount()   }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/positions", async (req, res) => { try { res.json({ positions: await broker.getPositions() }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/orders",    async (req, res) => { try { res.json({ orders:    await broker.getOrders(req.query.status||"all", req.query.limit||20) }); } catch (e) { res.status(500).json({ error: e.message }); } });

app.post("/trade", async (req, res) => {
  try {
    const { symbol, qty, side, type, tif, limitPrice, stopPrice } = req.body;
    if (!symbol || !qty || !side) return res.status(400).json({ error: "symbol, qty and side required" });
    const order = await broker.placeOrder({ symbol, qty, side, type, tif, limitPrice, stopPrice });
    res.json({ order, broker: BROKER_NAME, mode: BROKER_MODE });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/order/:id", async (req, res) => {
  try { res.json(await broker.cancelOrder(req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n✅ ORBsignal server running at http://localhost:${PORT}`);
  console.log(`   Broker: ${BROKER_NAME} (${BROKER_MODE} mode)\n`);
});
