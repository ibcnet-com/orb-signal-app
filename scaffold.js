/**
 * scaffold.js
 * ORBsignal Auto-Scaffold Script
 *
 * Run this from your project root:
 *   node scaffold.js
 *
 * Safe to re-run — prompts before overwriting existing files.
 */

import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));
const ROOT = process.cwd();

const FILES = [

  // ── Broker interface ────────────────────────────────────────────────────────
  {
    file: "brokers/broker.interface.js",
    content: `/**
 * broker.interface.js
 * Standard interface all brokers must implement.
 */
export class BrokerInterface {
  constructor(config) {
    if (new.target === BrokerInterface) throw new Error("BrokerInterface is abstract.");
    this.config = config;
    this.name = "base";
  }
  async getAccount()                  { throw new Error(\`\${this.name}.getAccount() not implemented\`); }
  async getPositions()                { throw new Error(\`\${this.name}.getPositions() not implemented\`); }
  async placeOrder(order)             { throw new Error(\`\${this.name}.placeOrder() not implemented\`); }
  async getOrders(status="all",limit=20) { throw new Error(\`\${this.name}.getOrders() not implemented\`); }
  async cancelOrder(orderId)          { throw new Error(\`\${this.name}.cancelOrder() not implemented\`); }
}
`
  },

  // ── Alpaca broker ───────────────────────────────────────────────────────────
  {
    file: "brokers/alpaca.js",
    content: `/**
 * brokers/alpaca.js
 * Full Alpaca implementation — paper and live trading.
 */
import { BrokerInterface } from "./broker.interface.js";
const PAPER_URL = "https://paper-api.alpaca.markets";
const LIVE_URL  = "https://api.alpaca.markets";
export class AlpacaBroker extends BrokerInterface {
  constructor(config) {
    super(config);
    this.name    = "Alpaca";
    this.mode    = config.mode || "paper";
    this.baseURL = this.mode === "live" ? LIVE_URL : PAPER_URL;
    this.headers = { "APCA-API-KEY-ID": config.apiKey, "APCA-API-SECRET-KEY": config.apiSecret, "Content-Type": "application/json" };
  }
  async #request(method, path, body = null) {
    const res  = await fetch(\`\${this.baseURL}\${path}\`, { method, headers: this.headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(\`Alpaca \${method} \${path} → \${res.status}: \${JSON.stringify(json)}\`);
    return json;
  }
  async getAccount() {
    const a = await this.#request("GET", "/v2/account");
    return { broker: this.name, mode: this.mode, id: a.id, equity: parseFloat(a.equity), cash: parseFloat(a.cash), buyingPower: parseFloat(a.buying_power), daytrader: a.pattern_day_trader, status: a.status };
  }
  async getPositions() {
    const p = await this.#request("GET", "/v2/positions");
    return p.map(p => ({ symbol: p.symbol, qty: parseFloat(p.qty), side: parseFloat(p.qty) > 0 ? "long" : "short", entryPrice: parseFloat(p.avg_entry_price), currentPrice: parseFloat(p.current_price), pnl: parseFloat(p.unrealized_pl), pnlPct: parseFloat(p.unrealized_plpc) * 100 }));
  }
  async placeOrder({ symbol, qty, side, type = "market", tif = "day", limitPrice, stopPrice }) {
    const body = { symbol, qty: String(qty), side, type, time_in_force: tif };
    if (limitPrice) body.limit_price = String(limitPrice);
    if (stopPrice)  body.stop_price  = String(stopPrice);
    const o = await this.#request("POST", "/v2/orders", body);
    return { id: o.id, symbol: o.symbol, qty: parseFloat(o.qty), side: o.side, type: o.type, status: o.status, createdAt: o.created_at, filledAt: o.filled_at, filledAvg: o.filled_avg_price ? parseFloat(o.filled_avg_price) : null };
  }
  async getOrders(status = "all", limit = 20) {
    const orders = await this.#request("GET", \`/v2/orders?status=\${status}&limit=\${limit}\`);
    return orders.map(o => ({ id: o.id, symbol: o.symbol, qty: parseFloat(o.qty), side: o.side, type: o.type, status: o.status, createdAt: o.created_at, filledAt: o.filled_at, filledAvg: o.filled_avg_price ? parseFloat(o.filled_avg_price) : null }));
  }
  async cancelOrder(orderId) {
    await this.#request("DELETE", \`/v2/orders/\${orderId}\`);
    return { cancelled: true, orderId };
  }
}
`
  },

  // ── Schwab stub ─────────────────────────────────────────────────────────────
  {
    file: "brokers/schwab.js",
    content: `import { BrokerInterface } from "./broker.interface.js";
export class SchwabBroker extends BrokerInterface {
  constructor(config) { super(config); this.name = "Schwab"; }
  async getAccount()      { throw new Error("Schwab coming soon."); }
  async getPositions()    { throw new Error("Schwab coming soon."); }
  async placeOrder(o)     { throw new Error("Schwab coming soon."); }
  async getOrders(s,l)    { throw new Error("Schwab coming soon."); }
  async cancelOrder(id)   { throw new Error("Schwab coming soon."); }
}
`
  },

  // ── Fidelity stub ───────────────────────────────────────────────────────────
  {
    file: "brokers/fidelity.js",
    content: `import { BrokerInterface } from "./broker.interface.js";
export class FidelityBroker extends BrokerInterface {
  constructor(config) { super(config); this.name = "Fidelity"; }
  async getAccount()      { throw new Error("Fidelity coming soon."); }
  async getPositions()    { throw new Error("Fidelity coming soon."); }
  async placeOrder(o)     { throw new Error("Fidelity coming soon."); }
  async getOrders(s,l)    { throw new Error("Fidelity coming soon."); }
  async cancelOrder(id)   { throw new Error("Fidelity coming soon."); }
}
`
  },

  // ── Broker selector ─────────────────────────────────────────────────────────
  {
    file: "brokers/index.js",
    content: `import { AlpacaBroker }   from "./alpaca.js";
import { SchwabBroker }   from "./schwab.js";
import { FidelityBroker } from "./fidelity.js";
const BROKER = process.env.BROKER || "alpaca";
const MODE   = process.env.ALPACA_MODE || "paper";
const configs = {
  alpaca:   { apiKey: process.env.ALPACA_API_KEY,   apiSecret: process.env.ALPACA_API_SECRET,   mode: MODE },
  schwab:   { apiKey: process.env.SCHWAB_API_KEY,   apiSecret: process.env.SCHWAB_API_SECRET },
  fidelity: { apiKey: process.env.FIDELITY_API_KEY, apiSecret: process.env.FIDELITY_API_SECRET },
};
const brokers = { alpaca: AlpacaBroker, schwab: SchwabBroker, fidelity: FidelityBroker };
if (!brokers[BROKER]) throw new Error(\`Unknown broker "\${BROKER}"\`);
export const broker      = new brokers[BROKER](configs[BROKER]);
export const BROKER_NAME = BROKER;
export const BROKER_MODE = MODE;
`
  },

  // ── Trade log DB ────────────────────────────────────────────────────────────
  {
    file: "db/tradelog.js",
    content: `/**
 * db/tradelog.js
 * SQLite-backed trade log — persists on Railway via a mounted volume.
 * Falls back to in-memory if SQLite is unavailable.
 */
import { existsSync, mkdirSync } from "fs";
import path from "path";

let db;
let useMemory = false;
const memoryLog = [];

async function init() {
  try {
    const { default: Database } = await import("better-sqlite3");
    const dbDir  = process.env.RAILWAY_VOLUME_MOUNT_PATH || "./data";
    if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, "tradelog.db");
    db = new Database(dbPath);
    db.exec(\`
      CREATE TABLE IF NOT EXISTS trades (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker      TEXT    NOT NULL,
        dir         TEXT    NOT NULL,
        entry_price REAL    NOT NULL,
        stop_price  REAL,
        target_price REAL,
        exit_price  REAL,
        qty         REAL    DEFAULT 1,
        outcome     TEXT    DEFAULT 'open',
        pnl_dollar  REAL,
        pnl_pct     REAL,
        confidence  TEXT,
        volume      TEXT,
        reason      TEXT,
        orb_high    REAL,
        orb_low     REAL,
        logged_at   TEXT    NOT NULL,
        closed_at   TEXT
      );
    \`);
    console.log(\`✅ Trade log DB ready at \${dbPath}\`);
  } catch (e) {
    console.warn(\`⚠ SQLite unavailable (\${e.message}) — using in-memory log\`);
    useMemory = true;
  }
}

function logTrade(trade) {
  const {
    ticker, dir, entry_price, stop_price, target_price,
    qty = 1, confidence, volume, reason, orb_high, orb_low,
  } = trade;
  const logged_at  = new Date().toISOString();
  const stop        = stop_price  ?? (dir === "long" ? +(entry_price * 0.99).toFixed(2) : +(entry_price * 1.01).toFixed(2));
  const target      = target_price ?? (dir === "long" ? +(entry_price * 1.02).toFixed(2) : +(entry_price * 0.98).toFixed(2));

  if (useMemory) {
    const id = memoryLog.length + 1;
    memoryLog.push({ id, ticker, dir, entry_price, stop_price: stop, target_price: target, exit_price: null, qty, outcome: "open", pnl_dollar: null, pnl_pct: null, confidence, volume, reason, orb_high, orb_low, logged_at, closed_at: null });
    return id;
  }
  const stmt = db.prepare(\`
    INSERT INTO trades (ticker, dir, entry_price, stop_price, target_price, qty, outcome, confidence, volume, reason, orb_high, orb_low, logged_at)
    VALUES (@ticker, @dir, @entry_price, @stop_price, @target_price, @qty, 'open', @confidence, @volume, @reason, @orb_high, @orb_low, @logged_at)
  \`);
  const result = stmt.run({ ticker, dir, entry_price, stop_price: stop, target_price: target, qty, confidence, volume, reason, orb_high, orb_low, logged_at });
  return result.lastInsertRowid;
}

function closeTrade(id, exit_price, outcome) {
  const closed_at = new Date().toISOString();
  if (useMemory) {
    const t = memoryLog.find(t => t.id === id);
    if (!t) return null;
    const pnl_dollar = outcome !== "cancelled" ? +((exit_price - t.entry_price) * t.qty * (t.dir === "long" ? 1 : -1)).toFixed(2) : 0;
    const pnl_pct    = outcome !== "cancelled" ? +((pnl_dollar / (t.entry_price * t.qty)) * 100).toFixed(2) : 0;
    Object.assign(t, { exit_price, outcome, pnl_dollar, pnl_pct, closed_at });
    return t;
  }
  const t = db.prepare("SELECT * FROM trades WHERE id = ?").get(id);
  if (!t) return null;
  const pnl_dollar = outcome !== "cancelled" ? +((exit_price - t.entry_price) * t.qty * (t.dir === "long" ? 1 : -1)).toFixed(2) : 0;
  const pnl_pct    = outcome !== "cancelled" ? +((pnl_dollar / (t.entry_price * t.qty)) * 100).toFixed(2) : 0;
  db.prepare("UPDATE trades SET exit_price=?, outcome=?, pnl_dollar=?, pnl_pct=?, closed_at=? WHERE id=?")
    .run(exit_price, outcome, pnl_dollar, pnl_pct, closed_at, id);
  return db.prepare("SELECT * FROM trades WHERE id = ?").get(id);
}

function getTrades(limit = 100) {
  if (useMemory) return [...memoryLog].reverse().slice(0, limit);
  return db.prepare("SELECT * FROM trades ORDER BY logged_at DESC LIMIT ?").all(limit);
}

function getStats() {
  const trades  = useMemory ? memoryLog.filter(t => t.outcome !== "open" && t.outcome !== "cancelled") : db.prepare("SELECT * FROM trades WHERE outcome NOT IN ('open','cancelled')").all();
  const total   = trades.length;
  const wins    = trades.filter(t => t.outcome === "win").length;
  const losses  = trades.filter(t => t.outcome === "loss").length;
  const totalPnl = trades.reduce((s, t) => s + (t.pnl_dollar || 0), 0);
  const avgPnl  = total ? +(totalPnl / total).toFixed(2) : 0;
  const winRate = total ? +((wins / total) * 100).toFixed(1) : 0;
  return { total, wins, losses, winRate, totalPnl: +totalPnl.toFixed(2), avgPnl };
}

function toCSV() {
  const trades  = useMemory ? memoryLog : db.prepare("SELECT * FROM trades ORDER BY logged_at DESC").all();
  const headers = ["id","ticker","dir","entry_price","stop_price","target_price","exit_price","qty","outcome","pnl_dollar","pnl_pct","confidence","volume","reason","logged_at","closed_at"];
  const rows    = trades.map(t => headers.map(h => JSON.stringify(t[h] ?? "")).join(","));
  return [headers.join(","), ...rows].join("\\n");
}

await init();
export { logTrade, closeTrade, getTrades, getStats, toCSV };
`
  },

  // ── server.js ───────────────────────────────────────────────────────────────
  {
    file: "server.js",
    content: `/**
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
    const url = \`https://query1.finance.yahoo.com/v1/finance/search?q=\${ticker}&newsCount=5&enableFuzzyQuery=false\`;
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
  const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${ticker}?interval=1m&range=1d&includePrePost=false\`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(\`Yahoo returned \${res.status} for \${ticker}\`);
  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(\`No data for \${ticker}\`);
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
      return { dir: "long",  orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +candle.close.toFixed(2), vol: \`+\${volPct}% avg\`, time, conf, reason: \`Closed above ORB high $\${orbHigh.toFixed(2)} with \${volPct}% avg vol\` };
    if (candle.close < orbLow  && volPct >= volFilterPct)
      return { dir: "short", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +candle.close.toFixed(2), vol: \`+\${volPct}% avg\`, time, conf, reason: \`Closed below ORB low $\${orbLow.toFixed(2)} with \${volPct}% avg vol\` };
  }
  const latest = candles[candles.length - 1];
  return { dir: "none", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), orbRangePct: +orbRangePct.toFixed(3), tinyRange, price: +latest.close.toFixed(2), vol: "—", time: latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), conf: "low", reason: \`No breakout yet. Range: $\${orbLow.toFixed(2)} – $\${orbHigh.toFixed(2)}\` };
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
    const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${symbol}?interval=5m&range=2d&includePrePost=true\`;
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
    const url  = \`https://query1.finance.yahoo.com/v8/finance/chart/\${ticker}?interval=5m&range=2d&includePrePost=true\`;
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

// ─── Trade Log (JSON file persistence) ───────────────────────────────────────
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, "data");
const DB_FILE   = join(DATA_DIR, "trades.json");

function loadTrades() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(DB_FILE))  writeFileSync(DB_FILE, "[]", "utf8");
    return JSON.parse(readFileSync(DB_FILE, "utf8"));
  } catch { return []; }
}

function saveTrades(trades) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DB_FILE, JSON.stringify(trades, null, 2), "utf8");
  } catch (e) { console.error("Save error:", e.message); }
}

function calcStats(trades) {
  const closed = trades.filter(t => t.status === "closed");
  const wins   = closed.filter(t => t.outcome === "win").length;
  const losses = closed.filter(t => t.outcome === "loss").length;
  const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0);
  return {
    total:    closed.length,
    wins,
    losses,
    winRate:  closed.length ? +((wins / closed.length) * 100).toFixed(1) : 0,
    totalPnl: +totalPnl.toFixed(2),
    avgPnl:   closed.length ? +(totalPnl / closed.length).toFixed(2) : 0,
  };
}

app.post("/trades", (req, res) => {
  const trades = loadTrades();
  const trade  = {
    id:        Date.now(),
    ticker:    req.body.ticker    || "",
    dir:       req.body.dir       || "",
    entry:     req.body.entry     || null,
    stop:      req.body.stop      || null,
    target1:   req.body.target1   || null,
    target2:   req.body.target2   || null,
    shares:    req.body.shares    || null,
    riskAmt:   req.body.riskAmt   || null,
    status:    "open",
    outcome:   null,
    exitPrice: null,
    pnl:       null,
    loggedAt:  new Date().toISOString(),
    closedAt:  null,
  };
  trades.unshift(trade);
  saveTrades(trades);
  res.json({ success: true, id: trade.id });
});

app.patch("/trades/:id", (req, res) => {
  const trades = loadTrades();
  const idx    = trades.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const t      = trades[idx];
  t.status     = "closed";
  t.outcome    = req.body.outcome   || "loss";
  t.exitPrice  = req.body.exitPrice || null;
  t.closedAt   = new Date().toISOString();
  if (t.exitPrice && t.entry && t.shares) {
    const diff = t.dir === "long"
      ? (t.exitPrice - t.entry) * t.shares
      : (t.entry - t.exitPrice) * t.shares;
    t.pnl = +diff.toFixed(2);
  }
  trades[idx] = t;
  saveTrades(trades);
  res.json({ success: true, trade: t });
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

app.listen(PORT, () => {
  console.log(\`\n✅ ORBsignal server running on port \${PORT}\`);
  console.log(\`   /scan    → ORB breakout detection\`);
  console.log(\`   /quote   → Live prices\`);
  console.log(\`   /futures → Futures + pre-market data\n\`);
});
`
  },

  // ── package.json ────────────────────────────────────────────────────────────
  {
    file: "package.json",
    content: `{
  "name": "orb-signal-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "build": "node node_modules/vite/bin/vite.js build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "better-sqlite3": "^9.4.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^6.2.0"
  }
}
`
  },

  // ── .env.example ────────────────────────────────────────────────────────────
  {
    file: ".env.example",
    content: `BROKER=alpaca
ALPACA_MODE=paper
ALPACA_API_KEY=your_alpaca_key_here
ALPACA_API_SECRET=your_alpaca_secret_here
# SCHWAB_API_KEY=
# FIDELITY_API_KEY=
`
  },


  // ── React app ───────────────────────────────────────────────────────────────
  {
    file: "src/orb-trading-app.jsx",
    content: `import { useState, useEffect, useRef } from "react";

const FONT = \`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=swap');\`;

const style = \`
  \${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090c10; }
  .app {
    font-family: 'Space Mono', monospace;
    background: #090c10;
    color: #e2e8f0;
    min-height: 100vh;
    padding: 0;
  }
  .header {
    border-bottom: 1px solid #1e2a3a;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(9,12,16,0.95);
    backdrop-filter: blur(10px);
    position: sticky; top: 0; z-index: 100;
    overflow: hidden;
  }
  .logo {
    font-family: 'Instrument Serif', serif;
    font-size: 22px;
    letter-spacing: 0.02em;
    color: #f0f4f8;
    flex-shrink: 0;
  }
  .logo span { color: #00d4aa; font-style: italic; }
  .ticker-bar {
    display: flex; gap: 16px; font-size: 11px; color: #64748b;
    flex-wrap: nowrap; overflow: hidden; min-width: 0;
    align-items: center;
  }
  .ticker-item { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
  .ticker-item .up { color: #00d4aa; }
  .ticker-item .down { color: #ff4d6d; }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #00d4aa;
    animation: pulse 1.5s infinite;
    display: inline-block; margin-right: 6px;
  }
  @keyframes pulse {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:0.4;transform:scale(0.8)}
  }
  .main { max-width: 1100px; margin: 0 auto; padding: 36px 24px; }
  .hero {
    text-align: center;
    margin-bottom: 48px;
    padding: 48px 24px 36px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,170,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-label {
    font-size: 10px; letter-spacing: 0.25em;
    color: #00d4aa; text-transform: uppercase;
    margin-bottom: 14px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .hero h1 {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 400;
    line-height: 1.1;
    color: #f0f4f8;
    margin-bottom: 16px;
  }
  .hero h1 em { color: #00d4aa; font-style: italic; }
  .hero p {
    font-size: 13px; color: #64748b;
    max-width: 480px; margin: 0 auto;
    line-height: 1.8;
  }
  /* Nav Tabs */
  .tabs {
    display: flex; gap: 4px;
    background: #0f1520;
    border: 1px solid #1e2a3a;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 36px;
  }
  .tab {
    flex: 1; padding: 10px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px; letter-spacing: 0.1em;
    text-transform: uppercase;
    background: transparent; border: none;
    color: #475569; cursor: pointer;
    border-radius: 7px;
    transition: all 0.2s;
  }
  .tab.active {
    background: #1a2540;
    color: #00d4aa;
    border: 1px solid #00d4aa33;
  }
  .tab:hover:not(.active) { color: #94a3b8; }

  /* Cards */
  .card {
    background: #0f1520;
    border: 1px solid #1e2a3a;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }
  .card-title {
    font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase; color: #00d4aa;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .card-title::after {
    content: ''; flex: 1;
    height: 1px; background: #1e2a3a;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

  /* ── Mobile bottom tab bar ── */
  .bottom-nav {
    display: none;
  }

  @media(max-width:768px) {
    /* Global */
    body { padding-bottom: 72px; }

    /* Header — fix horizontal overflow */
    .header { padding: 10px 14px; }
    .logo { font-size: 18px; flex-shrink: 0; }
    .ticker-bar { gap: 8px; font-size: 10px; }
    .ticker-item:nth-child(3) { display: none; } /* hide VIX on mobile */

    /* Hero — hide on non-learn tabs */
    .hero-mobile-hide { display: none !important; }
    .hero { padding: 24px 16px 20px; }
    .hero h1 { font-size: 24px; }
    .hero p  { font-size: 12px; }

    /* Hide desktop tabs, show bottom nav */
    .tabs { display: none !important; }
    .bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(9,12,16,0.97);
      border-top: 1px solid #1e2a3a;
      z-index: 100;
      padding: 0;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .bottom-nav button {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 3px;
      padding: 10px 4px 8px;
      background: transparent; border: none;
      color: #475569; cursor: pointer;
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.05em;
      text-transform: uppercase;
      transition: color 0.2s;
    }
    .bottom-nav button.active { color: #00d4aa; }
    .bottom-nav button .nav-icon { font-size: 18px; line-height: 1; }

    /* Layout */
    .app-wrap { padding: 0 12px; }
    main { padding: 12px 0 0; }

    /* Cards */
    .card { padding: 16px; border-radius: 10px; margin-bottom: 14px; }
    .card-title { font-size: 9px; }

    /* Grids */
    .grid-2 { grid-template-columns: 1fr; gap: 12px; }
    .grid-3 { grid-template-columns: 1fr 1fr; gap: 10px; }

    /* Header bar */
    .quote-bar { gap: 12px; padding: 10px 12px; font-size: 10px; flex-wrap: wrap; }
    .header-actions { gap: 8px; }

    /* Signal cards */
    .signal-card { padding: 14px; }
    .tb-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .rule-badges { gap: 6px; }
    .rule-badge { font-size: 9px; padding: 3px 6px; }

    /* Trade log table — stack on mobile */
    table { font-size: 11px; }
    table th, table td { padding: 8px 6px; }

    /* Footer — hide on mobile (bottom nav replaces it) */
    .app-footer { display: none; }

    /* Config sliders */
    .slider-row { margin: 12px 0; }

    /* Futures grid */
    .futures-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }

    /* Stats bar */
    .stats-bar { gap: 10px; flex-wrap: wrap; }
    .stat-pill { font-size: 10px; padding: 6px 10px; }

    /* Watchlist chips */
    .ticker-chip { font-size: 10px; padding: 4px 8px; }
  }

  @media(max-width:400px) {
    .grid-3 { grid-template-columns: 1fr; }
    .futures-grid { grid-template-columns: 1fr !important; }
    .tb-grid { grid-template-columns: 1fr; }
  }

  /* ORB Chart Visual */
  .chart-wrap {
    background: #080b10;
    border: 1px solid #1e2a3a;
    border-radius: 10px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }
  .chart-wrap svg { width: 100%; height: auto; display: block; }

  /* Steps */
  .step {
    display: flex; gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #1a2030;
  }
  .step:last-child { border-bottom: none; }
  .step-num {
    width: 32px; height: 32px; border-radius: 50%;
    background: #1a2540;
    border: 1px solid #00d4aa44;
    color: #00d4aa;
    font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .step-body h4 { font-size: 13px; color: #e2e8f0; margin-bottom: 6px; }
  .step-body p { font-size: 12px; color: #64748b; line-height: 1.7; }

  /* Signal Alerts */
  .signal-card {
    background: #0f1520;
    border-radius: 12px;
    border: 1px solid #1e2a3a;
    padding: 20px;
    margin-bottom: 16px;
    animation: slideIn 0.4s ease both;
    transition: border-color 0.2s;
  }
  .signal-card.long  { border-left: 3px solid #00d4aa; }
  .signal-card.short { border-left: 3px solid #ff4d6d; }
  .signal-card:hover { border-color: #2a3a55; }
  @keyframes slideIn {
    from { opacity:0; transform: translateY(-8px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .signal-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .signal-ticker {
    display: flex; align-items: center; gap: 10px;
  }
  .signal-dir {
    width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .signal-dir.long  { background: rgba(0,212,170,0.12); border: 1px solid #00d4aa44; }
  .signal-dir.short { background: rgba(255,77,109,0.12); border: 1px solid #ff4d6d44; }
  .signal-ticker h3 { font-size: 18px; color: #f0f4f8; }
  .signal-ticker p  { font-size: 11px; color: #64748b; margin-top: 2px; }
  .signal-timer {
    font-size: 11px; color: #475569;
    background: #0a0f18; border: 1px solid #1e2a3a;
    border-radius: 6px; padding: 4px 10px;
    font-family: 'Space Mono', monospace;
  }
  .signal-timer.urgent { color: #facc15; border-color: #facc1544; }
  .trade-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 10px; margin-bottom: 14px;
  }
  .trade-box {
    background: #080b10; border: 1px solid #1a2030;
    border-radius: 8px; padding: 10px 12px;
  }
  .trade-box .tb-label { font-size: 9px; color: #475569; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom:4px; }
  .trade-box .tb-value { font-size: 14px; color: #e2e8f0; font-weight: 700; }
  .trade-box .tb-sub   { font-size: 10px; color: #475569; margin-top: 2px; }
  .trade-box.entry  .tb-value { color: #f0f4f8; }
  .trade-box.stop   .tb-value { color: #ff4d6d; }
  .trade-box.size   .tb-value { color: #facc15; }
  .targets-row {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; margin-bottom: 14px;
  }
  .target-box {
    background: rgba(0,212,170,0.05);
    border: 1px solid #00d4aa22;
    border-radius: 8px; padding: 10px 14px;
  }
  .target-box .t-label { font-size: 9px; color: #00d4aa88; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom:4px; }
  .target-box .t-price { font-size: 15px; color: #00d4aa; font-weight: 700; }
  .target-box .t-meta  { font-size: 10px; color: #475569; margin-top: 3px; }
  .signal-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px; border-top: 1px solid #1a2030;
    flex-wrap: wrap; gap: 8px;
  }
  .signal-footer .meta-text { font-size: 10px; color: #475569; }
  .action-btn {
    font-family: 'Space Mono', monospace;
    font-size: 12px; font-weight: 700;
    padding: 10px 24px; border-radius: 8px;
    border: none; cursor: pointer;
    letter-spacing: 0.08em; text-transform: uppercase;
    transition: all 0.2s;
  }
  .action-btn.buy  { background: #00d4aa; color: #090c10; }
  .action-btn.sell { background: #ff4d6d; color: #fff; }
  .action-btn.buy:hover  { background: #00e8bb; transform: translateY(-1px); }
  .action-btn.sell:hover { background: #ff6b85; transform: translateY(-1px); }
  .time-warning {
    font-size: 10px; color: #facc15;
    background: rgba(250,204,21,0.08);
    border: 1px solid #facc1533;
    border-radius: 4px; padding: 3px 8px;
  }
  .badge {
    font-size: 9px; letter-spacing: 0.15em;
    padding: 3px 8px; border-radius: 4px;
    text-transform: uppercase; font-weight: 700;
  }
  .badge.high { background: rgba(0,212,170,0.15); color: #00d4aa; }
  .badge.med { background: rgba(250,204,21,0.15); color: #facc15; }
  .badge.low { background: rgba(100,116,139,0.15); color: #64748b; }

  /* Settings / Alert Config */
  .config-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 0; border-bottom: 1px solid #1a2030;
    font-size: 12px;
  }
  .config-row:last-child { border-bottom: none; }
  .config-label { color: #94a3b8; }
  .config-value { color: #e2e8f0; font-weight: 700; }
  .toggle {
    width: 40px; height: 22px; border-radius: 11px;
    background: #1e2a3a; border: none; cursor: pointer;
    position: relative; transition: background 0.3s;
  }
  .toggle.on { background: #00d4aa33; border: 1px solid #00d4aa66; }
  .toggle::after {
    content: ''; position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #475569; top: 3px; left: 3px;
    transition: all 0.3s;
  }
  .toggle.on::after { background: #00d4aa; transform: translateX(18px); }

  /* Stats Row */
  .stat-box {
    background: #080b10;
    border: 1px solid #1e2a3a;
    border-radius: 10px; padding: 18px;
    text-align: center;
  }
  .stat-box .val {
    font-family: 'Instrument Serif', serif;
    font-size: 32px; color: #00d4aa;
    display: block; margin-bottom: 6px;
  }
  .stat-box .lbl { font-size: 10px; color: #475569; letter-spacing: 0.15em; text-transform: uppercase; }

  /* Tooltip rule chip */
  .rule-chip {
    display: inline-flex; align-items: center; gap: 8px;
    background: #1a2540; border: 1px solid #2a3a55;
    border-radius: 6px; padding: 8px 14px;
    font-size: 11px; color: #94a3b8;
    margin: 4px;
  }
  .rule-chip .dot { width: 6px; height: 6px; border-radius: 50%; background: #00d4aa; }
  .pill-warning { background: rgba(255,77,109,0.1); border-color: #ff4d6d33; }
  .pill-warning .dot { background: #ff4d6d; }

  /* Chart annotation */
  .chart-legend {
    display: flex; gap: 16px; flex-wrap: wrap;
    margin-top: 12px;
  }
  .legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; color: #64748b;
  }
  .legend-line {
    width: 20px; height: 2px;
  }
  .btn {
    font-family: 'Space Mono', monospace;
    font-size: 11px; letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 10px 20px;
    border-radius: 7px; border: none;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-primary {
    background: #00d4aa; color: #090c10; font-weight: 700;
  }
  .btn-primary:hover { background: #00e8bb; transform: translateY(-1px); }
  .btn-ghost {
    background: transparent; color: #64748b;
    border: 1px solid #1e2a3a;
  }
  .btn-ghost:hover { color: #94a3b8; border-color: #2a3a55; }

  /* Simulate btn */
  .simulate-btn {
    width: 100%; padding: 14px;
    margin-top: 16px;
  }

  /* ── Performance Chart & Yesterday Report ── */
  .perf-section {
    background: #080b10; border: 1px solid #1e2a3a;
    border-radius: 14px; padding: 20px; margin-bottom: 20px;
  }
  .perf-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
  }
  .perf-title { font-size: 13px; font-weight: 700; color: #f0f4f8; }
  .perf-subtitle { font-size: 10px; color: #475569; margin-top: 2px; }
  .perf-toggles { display: flex; gap: 6px; flex-wrap: wrap; }
  .perf-toggle {
    padding: 4px 10px; border-radius: 6px; font-size: 10px;
    border: 1px solid #2a3a55; background: transparent; color: #64748b;
    cursor: pointer; font-family: 'Space Mono', monospace;
    transition: all 0.2s;
  }
  .perf-toggle.active {
    background: rgba(0,212,170,0.12); border-color: #00d4aa44; color: #00d4aa;
  }
  .perf-stats-strip {
    display: flex; gap: 20px; flex-wrap: wrap;
    padding: 10px 14px; background: #0d1623;
    border-radius: 8px; margin-bottom: 16px; font-size: 11px;
  }
  .perf-stat { display: flex; flex-direction: column; gap: 2px; }
  .perf-stat-val { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #f0f4f8; }
  .perf-stat-lbl { font-size: 9px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }

  /* Yesterday rows */
  .yday-row {
    display: grid; grid-template-columns: 60px 80px 1fr 80px 60px;
    align-items: center; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid #0f1520;
  }
  .yday-row:last-child { border-bottom: none; }
  .yday-ticker { font-size: 13px; font-weight: 700; color: #f0f4f8; font-family: 'Instrument Serif', serif; }
  .yday-dir { font-size: 10px; font-family: 'Space Mono', monospace; }
  .yday-bar-wrap { position: relative; height: 8px; background: #1e2a3a; border-radius: 4px; overflow: hidden; }
  .yday-bar-fill { position: absolute; top: 0; height: 100%; border-radius: 4px; transition: width 0.8s ease; }
  .yday-pnl { font-size: 12px; font-family: 'Space Mono', monospace; font-weight: 700; text-align: right; }
  .yday-outcome { text-align: right; }
  .yday-exit-type { font-size: 9px; color: #475569; margin-top: 2px; }
  .yday-summary {
    display: flex; gap: 16px; flex-wrap: wrap;
    padding: 12px 14px; background: #0d1623;
    border-radius: 8px; margin-top: 16px; font-size: 11px;
  }

  @media(max-width:768px) {
    .yday-row { grid-template-columns: 50px 70px 1fr 70px; }
    .yday-row > :last-child { display: none; }
    .perf-stats-strip { gap: 12px; }
  }
  .sim-card {
    background: #080b10;
    border: 1px solid #1e2a3a;
    border-radius: 14px;
    padding: 20px;
    margin-top: 20px;
    animation: fadeIn 0.4s ease;
  }
  .sim-card-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .sim-ticker {
    font-size: 22px; font-weight: 700; color: #f0f4f8;
    font-family: 'Instrument Serif', serif;
  }
  .sim-dir-badge {
    padding: 4px 12px; border-radius: 6px; font-size: 11px;
    font-family: 'Space Mono', monospace; font-weight: 700;
  }
  .sim-dir-badge.long { background: rgba(0,212,170,0.15); color: #00d4aa; border: 1px solid #00d4aa44; }
  .sim-dir-badge.short { background: rgba(255,77,109,0.15); color: #ff4d6d; border: 1px solid #ff4d6d44; }
  .sim-dir-badge.watch { background: rgba(71,85,105,0.2); color: #64748b; border: 1px solid #47556944; }

  /* Annotated row */
  .sim-row {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 0 20px;
    align-items: start;
    padding: 14px 0;
    border-bottom: 1px solid #0f1520;
    position: relative;
  }
  .sim-row:last-child { border-bottom: none; }
  .sim-row-left { }
  .sim-row-label {
    font-size: 9px; color: #475569;
    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px;
  }
  .sim-row-value {
    font-size: 18px; font-weight: 700; color: #f0f4f8;
    font-family: 'Space Mono', monospace;
  }
  .sim-row-value.green { color: #00d4aa; }
  .sim-row-value.red   { color: #ff4d6d; }
  .sim-row-value.yellow{ color: #facc15; }
  .sim-row-sub {
    font-size: 10px; color: #475569; margin-top: 3px;
  }
  .sim-annotation {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 14px;
    background: #0d1623;
    border: 1px solid #1e2a3a;
    border-left: 3px solid #00d4aa44;
    border-radius: 8px;
    position: relative;
  }
  .sim-annotation::before {
    content: '←';
    position: absolute; left: -18px; top: 50%; transform: translateY(-50%);
    color: #00d4aa44; font-size: 14px;
  }
  .sim-annotation-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .sim-annotation-text { font-size: 11px; color: #64748b; line-height: 1.6; }
  .sim-annotation-text strong { color: #94a3b8; }

  /* Checks section */
  .sim-checks { margin-top: 16px; }
  .sim-check-row {
    display: grid; grid-template-columns: 180px 1fr;
    gap: 0 16px; align-items: center;
    padding: 10px 0; border-bottom: 1px solid #0f1520;
  }
  .sim-check-row:last-child { border-bottom: none; }
  .sim-check-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; padding: 5px 10px; border-radius: 6px;
    font-family: 'Space Mono', monospace;
  }
  .sim-check-badge.pass { background: rgba(0,212,170,0.1); color: #00d4aa; border: 1px solid #00d4aa33; }
  .sim-check-badge.fail { background: rgba(255,77,109,0.1); color: #ff4d6d; border: 1px solid #ff4d6d33; }
  .sim-check-badge.warn { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid #facc1533; }
  .sim-check-badge.na   { background: rgba(71,85,105,0.1);  color: #475569; border: 1px solid #47556933; }
  .sim-check-explain { font-size: 11px; color: #475569; line-height: 1.5; }
  .sim-check-explain strong { color: #64748b; }

  /* Score bar */
  .sim-score-bar {
    margin-top: 20px; padding: 16px;
    background: #0d1623; border-radius: 10px;
    border: 1px solid #1e2a3a;
  }
  .sim-score-label { font-size: 9px; color: #475569; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 10px; }
  .sim-score-track {
    height: 8px; background: #1e2a3a; border-radius: 4px; overflow: hidden; margin-bottom: 8px;
  }
  .sim-score-fill {
    height: 100%; border-radius: 4px; transition: width 1s ease;
  }
  .sim-score-nums {
    display: flex; justify-content: space-between;
    font-size: 10px; color: #475569;
    font-family: 'Space Mono', monospace;
  }

  @media(max-width:768px) {
    .sim-row { grid-template-columns: 1fr; gap: 8px; }
    .sim-annotation::before { display: none; }
    .sim-check-row { grid-template-columns: 1fr; gap: 6px; }
  }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%; height: 4px;
    background: #1e2a3a; border-radius: 2px; outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%; background: #00d4aa; cursor: pointer;
  }
  .slider-row { margin: 16px 0; }
  .slider-row label { font-size: 11px; color: #64748b; display: flex; justify-content: space-between; margin-bottom: 8px; }
  .slider-row label span { color: #00d4aa; }

  select {
    background: #1a2540; border: 1px solid #2a3a55;
    color: #e2e8f0; font-family: 'Space Mono', monospace;
    font-size: 11px; padding: 8px 12px;
    border-radius: 6px; cursor: pointer; outline: none;
  }

  .empty-state {
    text-align: center; padding: 48px 24px;
    color: #475569; font-size: 12px;
  }
  .empty-state .icon { font-size: 32px; margin-bottom: 12px; }

  .alert-sim-result {
    background: #0a1520;
    border: 1px solid #00d4aa44;
    border-radius: 10px;
    padding: 20px;
    margin-top: 16px;
    animation: fadeIn 0.4s ease;
  }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .result-row { display: flex; justify-content: space-between; font-size: 12px; padding: 7px 0; border-bottom: 1px solid #1a2030; }
  .result-row:last-child { border-bottom: none; }
  .result-row .label { color: #64748b; }
  .result-row .value { color: #e2e8f0; }
  .result-row .value.green { color: #00d4aa; }
  .result-row .value.red { color: #ff4d6d; }

  .ticker-chip-input:focus { border-color: #00d4aa !important; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Morning Brief ── */
  .morning-brief {
    background: linear-gradient(135deg, #080f1a 0%, #0a1628 100%);
    border: 1px solid #00d4aa33;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .morning-brief::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 0% 50%, rgba(0,212,170,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .brief-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }
  .brief-title {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #00d4aa; display: flex; align-items: center; gap: 8px;
  }
  .brief-time {
    font-size: 10px; color: #2a3a55; font-family: 'Space Mono', monospace;
  }
  .brief-dismiss {
    background: none; border: none; color: #2a3a55; cursor: pointer;
    font-size: 16px; padding: 2px 6px; transition: color 0.2s;
  }
  .brief-dismiss:hover { color: #475569; }
  .brief-futures {
    display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .brief-future {
    background: #0f1520; border: 1px solid #1e2a3a;
    border-radius: 8px; padding: 10px 14px;
    min-width: 110px; flex: 1;
  }
  .brief-future.up   { border-color: #00d4aa33; }
  .brief-future.down { border-color: #ff4d6d33; }
  .brief-future-name { font-size: 9px; color: #475569; margin-bottom: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
  .brief-future-price { font-size: 15px; font-weight: 700; color: #f0f4f8; }
  .brief-future-chg { font-size: 11px; margin-top: 2px; }
  .brief-future-chg.up   { color: #00d4aa; }
  .brief-future-chg.down { color: #ff4d6d; }
  .brief-future-chg.flat { color: #475569; }
  .brief-movers { margin-bottom: 16px; }
  .brief-movers-title { font-size: 9px; color: #475569; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
  .brief-mover-row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 0; border-bottom: 1px solid #0f1520;
    font-size: 12px;
  }
  .brief-mover-row:last-child { border-bottom: none; }
  .brief-mover-ticker { font-weight: 700; color: #f0f4f8; width: 60px; }
  .brief-mover-price  { color: #94a3b8; flex: 1; }
  .brief-mover-gap    { font-weight: 600; min-width: 60px; text-align: right; }
  .brief-mover-gap.up   { color: #00d4aa; }
  .brief-mover-gap.down { color: #ff4d6d; }
  .brief-mover-gap.flat { color: #475569; }
  .brief-summary {
    background: #0a0f18; border-radius: 8px; padding: 12px 14px;
    font-size: 11px; color: #64748b; line-height: 1.7;
  }
  .brief-summary strong { color: #e2e8f0; }
  .brief-summary .tag {
    display: inline-block; font-size: 9px; padding: 2px 7px;
    border-radius: 4px; margin: 0 3px; font-weight: 600;
    letter-spacing: 0.05em;
  }
  .brief-summary .tag.bull { background: rgba(0,212,170,0.1); color: #00d4aa; border: 1px solid #00d4aa33; }
  .brief-summary .tag.bear { background: rgba(255,77,109,0.1); color: #ff4d6d; border: 1px solid #ff4d6d33; }
  .brief-summary .tag.warn { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid #facc1533; }

  .app-footer {
    border-top: 1px solid #1e2a3a;
    padding: 28px 32px;
    margin-top: 48px;
    background: rgba(9,12,16,0.95);
  }
  .footer-inner {
    max-width: 1100px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 16px;
  }
  .footer-nav {
    display: flex; gap: 24px; flex-wrap: wrap;
  }
  .footer-nav a {
    font-size: 11px; color: #475569;
    text-decoration: none; letter-spacing: 0.08em;
    transition: color 0.2s;
  }
  .footer-nav a:hover { color: #00d4aa; }
  .footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .footer-copy {
    font-size: 10px; color: #2a3a55;
  }
  .footer-copy a { color: #2a3a55; text-decoration: none; transition: color 0.2s; }
  .footer-copy a:hover { color: #475569; }
  .footer-version a {
    font-size: 10px; color: #2a3a55;
    text-decoration: none; transition: color 0.2s;
    font-family: 'Space Mono', monospace;
  }
  .footer-version a:hover { color: #00d4aa; }
\`;

// --- ORB Chart SVG ---
function ORBChart({ orbHigh = 182.5, orbLow = 179.8, breakout = true }) {
  const W = 540, H = 220;
  const pad = { l: 50, r: 20, t: 20, b: 30 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const priceMin = 178.5, priceMax = 185.5;
  const py = p => pad.t + ch * (1 - (p - priceMin) / (priceMax - priceMin));

  const orbHighY = py(orbHigh);
  const orbLowY = py(orbLow);

  // Simulated candles
  const candles = [
    { o: 180.1, h: 181.2, l: 179.6, c: 180.8, t: "9:30" },
    { o: 180.8, h: 181.8, l: 180.2, c: 181.5, t: "9:35" },
    { o: 181.5, h: 182.5, l: 181.0, c: 182.2, t: "9:40" },
    { o: 182.2, h: 182.6, l: 181.8, c: 179.9, t: "9:45" },
    { o: 179.9, h: 180.5, l: 179.7, c: 180.1, t: "9:50" },
    { o: 180.1, h: 180.4, l: 179.8, c: 180.0, t: "9:55" },
    { o: 180.0, h: 180.2, l: 179.8, c: 179.9, t: "10:00" },
    { o: 179.9, h: 181.0, l: 179.6, c: 181.0, t: "10:05" },
    { o: 181.0, h: 183.2, l: 180.8, c: 182.9, t: "10:10" },
    { o: 182.9, h: 184.0, l: 182.5, c: 183.8, t: "10:15" },
    { o: 183.8, h: 184.8, l: 183.4, c: 184.5, t: "10:20" },
    { o: 184.5, h: 185.2, l: 184.0, c: 185.0, t: "10:25" },
  ];
  const cWidth = 28;
  const gap = (cw - cWidth * candles.length) / (candles.length + 1);

  return (
    <svg viewBox={\`0 0 \${W} \${H}\`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="breakoutFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* ORB Zone */}
      <rect x={pad.l} y={orbHighY} width={cw} height={orbLowY - orbHighY}
        fill="rgba(250,204,21,0.06)" />

      {/* ORB High line */}
      <line x1={pad.l} y1={orbHighY} x2={pad.l + cw} y2={orbHighY}
        stroke="#facc15" strokeWidth="1.5" strokeDasharray="5,4" />
      <text x={pad.l - 4} y={orbHighY + 4} textAnchor="end" fontSize="9" fill="#facc15">H {orbHigh}</text>

      {/* ORB Low line */}
      <line x1={pad.l} y1={orbLowY} x2={pad.l + cw} y2={orbLowY}
        stroke="#facc15" strokeWidth="1.5" strokeDasharray="5,4" />
      <text x={pad.l - 4} y={orbLowY + 4} textAnchor="end" fontSize="9" fill="#facc15">L {orbLow}</text>

      {/* ORB Window shading */}
      <rect x={pad.l} y={pad.t} width={cWidth * 7 + gap * 8} height={ch}
        fill="rgba(250,204,21,0.03)" />
      <line x1={pad.l + cWidth * 7 + gap * 8} y1={pad.t}
            x2={pad.l + cWidth * 7 + gap * 8} y2={pad.t + ch}
        stroke="#facc1555" strokeWidth="1" strokeDasharray="3,3"/>
      <text x={pad.l + cWidth * 7 + gap * 8 - 2} y={pad.t + 12} textAnchor="end" fontSize="9" fill="#facc1588">ORB Window</text>

      {/* Breakout fill */}
      {breakout && (
        <rect x={pad.l + cWidth * 8 + gap * 9} y={orbHighY}
          width={cw - (cWidth * 8 + gap * 9)} height={pad.t + ch - orbHighY}
          fill="url(#breakoutFill)" />
      )}

      {/* Candles */}
      {candles.map((c, i) => {
        const cx = pad.l + gap * (i + 1) + cWidth * i + cWidth / 2;
        const x = pad.l + gap * (i + 1) + cWidth * i;
        const isGreen = c.c >= c.o;
        const color = i >= 8 ? (isGreen ? "#00d4aa" : "#ff4d6d") : (isGreen ? "#4ade80" : "#f87171");
        return (
          <g key={i}>
            <line x1={cx} y1={py(c.h)} x2={cx} y2={py(c.l)} stroke={color} strokeWidth="1.5"/>
            <rect x={x} y={py(Math.max(c.o, c.c))}
              width={cWidth} height={Math.max(2, Math.abs(py(c.o) - py(c.c)))}
              fill={color} opacity={i >= 8 ? 1 : 0.7}/>
          </g>
        );
      })}

      {/* Breakout arrow */}
      {breakout && (
        <g transform={\`translate(\${pad.l + cWidth * 9 + gap * 10 + cWidth / 2}, \${orbHighY - 18})\`}>
          <polygon points="0,-10 -7,0 7,0" fill="#00d4aa"/>
          <text y="20" textAnchor="middle" fontSize="9" fill="#00d4aa" fontWeight="bold">BREAKOUT</text>
        </g>
      )}

      {/* Time axis */}
      {candles.map((c, i) => {
        if (i % 3 !== 0) return null;
        const cx = pad.l + gap * (i + 1) + cWidth * i + cWidth / 2;
        return (
          <text key={i} x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="#475569">{c.t}</text>
        );
      })}
    </svg>
  );
}

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DEFAULT_WATCHLIST = ["SPY", "QQQ", "AAPL", "TSLA"];

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

// --- Main App ---
export default function ORBApp() {
  const [tab, setTab] = useState("learn");
  const [signals, setSignals] = useState([]);
  const [noBreakout, setNoBreakout] = useState([]);
  const [spyTrend, setSpyTrend]           = useState(null);
  const [economicEvent, setEconomicEvent] = useState(null);
  const [futures, setFutures]             = useState([]);
  const [premarket, setPremarket]         = useState([]);
  const [futuresLoading, setFuturesLoading] = useState(false);

  // Morning brief: visible 4AM–9:45AM ET
  const [briefDismissed, setBriefDismissed] = useState(false);
  const [briefForced, setBriefForced]       = useState(false);
  function isPreMarketHours() {
    const now = new Date();
    const et  = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const h   = et.getHours(), m = et.getMinutes();
    const mins = h * 60 + m;
    return mins >= 4 * 60 && mins < 9 * 60 + 45; // 4:00AM–9:45AM ET
  }
  function showBrief() {
    setBriefForced(true);
    setBriefDismissed(false);
    setTab("signals");
    window.scrollTo(0, 0);
    fetchFutures();
  }

  async function fetchFutures() {
    setFuturesLoading(true);
    try {
      const tickers = watchlist.join(",");
      const r    = await fetch(\`\${API}/futures?tickers=\${tickers}\`);
      const data = await r.json();
      setFutures(data.futures || []);
      setPremarket(data.premarket || []);
    } catch {}
    setFuturesLoading(false);
  }
  const [quotes, setQuotes] = useState({});
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [orbWindow, setOrbWindow] = useState(() => loadFromStorage("orb_window", 15));
  const [volFilter, setVolFilter] = useState(() => loadFromStorage("orb_volfilter", 150));
  const [maxRisk, setMaxRisk]     = useState(() => loadFromStorage("orb_maxrisk", 1000));
  const [alertSound, setAlertSound] = useState(() => loadFromStorage("orb_alertsound", true));
  const [alertEmail, setAlertEmail] = useState(() => loadFromStorage("orb_alertemail", false));
  const [alertPush, setAlertPush] = useState(() => loadFromStorage("orb_alertpush", true));
  const [watchlist, setWatchlist] = useState(() => loadFromStorage("orb_watchlist", DEFAULT_WATCHLIST));
  const [tickerInput, setTickerInput] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [newSignalFlash, setNewSignalFlash] = useState(false);
  const timerRef        = useRef(null);
  const audioCtxRef     = useRef(null);
  const alertedTickers  = useRef(new Set()); // tickers we've already sounded an alert for
  const signalFireTimes = useRef({});         // ticker -> timestamp when signal first appeared

  // ─── Sound engine (Web Audio API — no files needed) ──────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function playSignalAlert() {
    if (!alertSound) return;
    try {
      const ctx     = getAudioCtx();
      const now     = ctx.currentTime;
      // Three rising tones — "opportunity knocking"
      [[440, 0], [554, 0.15], [659, 0.30]].forEach(([freq, delay]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type      = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.4, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
        osc.start(now + delay);
        osc.stop(now  + delay + 0.4);
      });
    } catch {}
  }

  function playWatchingChime() {
    if (!alertSound) return;
    try {
      const ctx  = getAudioCtx();
      const now  = ctx.currentTime;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  function addTicker() {
    const t = tickerInput.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (!t || watchlist.includes(t)) { setTickerInput(""); return; }
    setWatchlist(prev => [...prev, t]);
    setTickerInput("");
  }

  function removeTicker(t) {
    setWatchlist(prev => prev.filter(x => x !== t));
  }

  function saveConfig() {
    try {
      localStorage.setItem("orb_watchlist", JSON.stringify(watchlist));
      localStorage.setItem("orb_window", JSON.stringify(orbWindow));
      localStorage.setItem("orb_volfilter", JSON.stringify(volFilter));
      localStorage.setItem("orb_maxrisk", JSON.stringify(maxRisk));
      localStorage.setItem("orb_alertsound", JSON.stringify(alertSound));
      localStorage.setItem("orb_alertemail", JSON.stringify(alertEmail));
      localStorage.setItem("orb_alertpush", JSON.stringify(alertPush));
    } catch {}
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }

  function resetConfig() {
    setWatchlist(DEFAULT_WATCHLIST);
    setOrbWindow(15);
    setVolFilter(150);
    setMaxRisk(1000);
    setAlertSound(true);
    setAlertEmail(false);
    setAlertPush(true);
    try {
      ["orb_watchlist","orb_window","orb_volfilter","orb_maxrisk","orb_alertsound","orb_alertemail","orb_alertpush"]
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  // Fetch live quotes for header bar
  async function fetchQuotes() {
    try {
      const r = await fetch(\`\${API}/quote?tickers=SPY,QQQ,VIX\`);
      const data = await r.json();
      const map = {};
      data.quotes.forEach(q => { map[q.ticker] = q; });
      setQuotes(map);
    } catch {}
  }

  // Scan watchlist for ORB breakouts
  async function runScan() {
    if (scanning) return;
    setScanning(true);
    setScanError(null);
    try {
      const tickers = watchlist.join(",");
      const r = await fetch(\`\${API}/scan?tickers=\${tickers}&orbWindow=\${orbWindow}&volFilter=\${volFilter}\`);
      const data = await r.json();
      setSignals(data.signals || []);
      setNoBreakout(data.noBreakout || []);
      if (data.spyTrend)      setSpyTrend(data.spyTrend);
      if (data.economicEvent) setEconomicEvent(data.economicEvent);
      setLastScanned(new Date().toLocaleTimeString());
      // Only alert for tickers we haven't seen before this session
      const newTickers = (data.signals || []).filter(s => !alertedTickers.current.has(s.ticker));
      if (newTickers.length > 0) {
        newTickers.forEach(s => {
          alertedTickers.current.add(s.ticker);
          signalFireTimes.current[s.ticker] = Date.now(); // record when it first fired
        });
        setNewSignalFlash(true);
        setTimeout(() => setNewSignalFlash(false), 1200);
        playSignalAlert();
      } else if ((data.noBreakout || []).length > 0) {
        playWatchingChime();
      }
      if (data.errors?.length) setScanError(data.errors.join(", "));
    } catch (e) {
      setScanError("Cannot reach server. Is server.js running on port 3001?");
    } finally {
      setScanning(false);
    }
  }

  // Trade log state
  const [tradeLog, setTradeLog]     = useState([]);
  const [tradeStats, setTradeStats] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [closeModal, setCloseModal] = useState(null);
  const [exitPrice, setExitPrice]   = useState("");

  // ── Yesterday ORB Report ──────────────────────────────────────────────────
  const [yesterdayReport, setYesterdayReport] = useState(null);
  const [yesterdayLoading, setYesterdayLoading] = useState(false);

  async function fetchYesterdayReport() {
    setYesterdayLoading(true);
    try {
      const tickers = watchlist.join(",");
      const r = await fetch(\`\${API}/yesterday?tickers=\${tickers}&orbWindow=\${orbWindow}&maxRisk=\${maxRisk}\`);
      const data = await r.json();
      setYesterdayReport(data);
    } catch(e) {
      setYesterdayReport({ error: e.message });
    }
    setYesterdayLoading(false);
  }

  async function fetchTradeLog() {
    setLogLoading(true);
    try {
      const r    = await fetch(\`\${API}/trades\`);
      const data = await r.json();
      setTradeLog(data.trades || []);
      setTradeStats(data.stats || null);
    } catch {}
    setLogLoading(false);
  }

  async function logSignalAsTrade(signal) {
    try {
      await fetch(\`\${API}/trades\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker:      signal.ticker,
          dir:         signal.dir,
          entry_price: signal.price,
          confidence:  signal.conf,
          volume:      signal.vol,
          reason:      signal.reason,
          orb_high:    signal.orbHigh,
          orb_low:     signal.orbLow,
        }),
      });
      fetchTradeLog();
    } catch {}
  }

  async function closeTrade(id, exit_price, outcome) {
    try {
      await fetch(\`\${API}/trades/\${id}\`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exit_price: parseFloat(exit_price), outcome }),
      });
      setCloseModal(null);
      setExitPrice("");
      fetchTradeLog();
    } catch {}
  }

  // Auto-scan on mount and every 60 seconds
  useEffect(() => {
    alertedTickers.current.clear();
    signalFireTimes.current = {};
    fetchQuotes();
    runScan();
    fetchTradeLog();
    fetchFutures();
    const quoteInt   = setInterval(fetchQuotes, 30000);
    const scanInt    = setInterval(runScan, 60000);
    const logInt     = setInterval(fetchTradeLog, 60000);
    const futuresInt = setInterval(fetchFutures, 60000);
    return () => { clearInterval(quoteInt); clearInterval(scanInt); clearInterval(logInt); clearInterval(futuresInt); };
  }, [watchlist, orbWindow, volFilter]);

  const MAG7 = ["AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA"];
  const [simTicker, setSimTicker] = useState(null);

  async function runSim() {
    setSimLoading(true);
    setSimResult(null);
    const ticker = MAG7[Math.floor(Math.random() * MAG7.length)];
    setSimTicker(ticker);
    try {
      const url  = \`\${API}/scan?tickers=\${ticker}&orbWindow=\${orbWindow}&volFilter=100\`;
      const r    = await fetch(url);
      const data = await r.json();
      const all  = [...(data.signals || []), ...(data.noBreakout || [])];
      const s    = all[0];
      if (s) {
        setSimResult({ ...s, ticker });
      } else {
        setSimResult({ error: "No data returned — market may be closed." });
      }
    } catch(e) {
      setSimResult({ error: e.message });
    }
    setSimLoading(false);
  }

  const confBadge = c => <span className={\`badge \${c}\`}>{c === "high" ? "High Conf" : c === "med" ? "Med Conf" : "Low Conf"}</span>;

  // ── Confidence Score (max 97%) ──────────────────────────────────────────────
  // Weight distribution (see CHANGELOG for full rationale):
  //   Breakout confirmed      20%  — core signal
  //   Volume surge            18%  — real buying/selling interest
  //   SPY trend aligned       15%  — market tailwind
  //   ORB range healthy       12%  — avoids false breakouts
  //   Entry before 11 AM      12%  — timing edge
  //   No major news           10%  — avoids news-driven chaos
  //   No economic event        8%  — avoids macro distortion
  //   Pre-market gap aligned   3%  — bonus confirmation
  //   TOTAL MAX               97%  — 100% certainty never exists
  function calcConfidenceScore(s) {
    const now = new Date();
    const et  = new Date(now.toLocaleString("en-US", { timeZone:"America/New_York" }));
    const h   = et.getHours(), m = et.getMinutes();
    const isBeforeEleven = h < 11 || (h === 11 && m === 0);

    // SPY aligned = trend matches trade direction
    const spyAligned = s.dir === "long"
      ? spyTrend?.trend === "up"
      : spyTrend?.trend === "down";

    // Pre-market gap aligned with trade direction
    const pmEntry = premarket.find(p => p.ticker === s.ticker);
    const gapAligned = pmEntry
      ? (s.dir === "long" ? pmEntry.gapPct > 0.3 : pmEntry.gapPct < -0.3)
      : null;

    const checks = [
      { label: "Breakout confirmed",      weight: 20, pass: true                          },
      { label: "Volume surge",            weight: 18, pass: s.vol >= volFilter            },
      { label: "SPY trend aligned",       weight: 15, pass: spyAligned                    },
      { label: "ORB range healthy",       weight: 12, pass: !s.tinyRange                  },
      { label: "Entry before 11 AM",      weight: 12, pass: isBeforeEleven                },
      { label: "No major news",           weight: 10, pass: !s.news?.hasNews              },
      { label: "No economic event",       weight:  8, pass: !economicEvent?.hasEvent      },
      { label: "Pre-market gap aligned",  weight:  3, pass: gapAligned === true, na: gapAligned === null },
    ];

    const score = checks.reduce((sum, c) => sum + (c.pass && !c.na ? c.weight : 0), 0);
    return { score, checks };
  }

  function ConfScoreBadge({ s }) {
    const [open, setOpen] = useState(false);
    const { score, checks } = calcConfidenceScore(s);
    const color = score >= 80 ? "#00d4aa" : score >= 60 ? "#facc15" : "#ff4d6d";
    const bg    = score >= 80 ? "rgba(0,212,170,0.12)" : score >= 60 ? "rgba(250,204,21,0.12)" : "rgba(255,77,109,0.12)";
    const border= score >= 80 ? "#00d4aa33" : score >= 60 ? "#facc1533" : "#ff4d6d33";
    return (
      <span style={{position:"relative", display:"inline-block"}}>
        <span
          onClick={() => setOpen(o => !o)}
          style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background:bg, border:\`1px solid \${border}\`, color,
            borderRadius:6, padding:"3px 10px", fontSize:11,
            fontFamily:"'Space Mono',monospace", cursor:"pointer",
            userSelect:"none", transition:"all 0.2s",
          }}>
          ⬡ {score}%
        </span>
        {open && (
          <div style={{
            position:"absolute", top:"calc(100% + 6px)", left:0,
            background:"#0d1623", border:"1px solid #1e2a3a",
            borderRadius:10, padding:"12px 14px", zIndex:200,
            minWidth:230, boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{fontSize:9, color:"#475569", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10}}>
              Confidence Breakdown
            </div>
            {checks.map((c,i) => (
              <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"5px 0", borderBottom:"1px solid #0f1520", fontSize:11}}>
                <span style={{color: c.na ? "#2a3a55" : c.pass ? "#94a3b8" : "#475569"}}>
                  {c.na ? "~" : c.pass ? "✓" : "⚠"} {c.label}
                </span>
                <span style={{
                  fontFamily:"'Space Mono',monospace", fontSize:10,
                  color: c.na ? "#2a3a55" : c.pass ? color : "#2a3a55",
                  fontWeight: c.pass ? 700 : 400,
                }}>
                  {c.na ? "n/a" : c.pass ? \`+\${c.weight}%\` : \`+0%\`}
                </span>
              </div>
            ))}
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8,
              paddingTop:8, borderTop:"1px solid #1e2a3a"}}>
              <span style={{fontSize:11, color:"#64748b"}}>Confidence Score</span>
              <span style={{fontFamily:"'Space Mono',monospace", fontSize:12, color, fontWeight:700}}>{score}%</span>
            </div>
            <div style={{fontSize:9, color:"#2a3a55", marginTop:6}}>
              Max 97% — 100% certainty never exists
            </div>
          </div>
        )}
      </span>
    );
  }

  function calcTrade(s) {
    const entry    = s.price;
    const orbRange = s.orbHigh - s.orbLow;
    // Stop: just inside ORB level
    const stop     = s.dir === "long"
      ? +(s.orbHigh - orbRange * 0.1).toFixed(2)
      : +(s.orbLow  + orbRange * 0.1).toFixed(2);
    const riskPerShare = Math.abs(entry - stop);
    const shares   = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
    // Target 1: 2:1 fixed R/R
    const t1 = s.dir === "long"
      ? +(entry + riskPerShare * 2).toFixed(2)
      : +(entry - riskPerShare * 2).toFixed(2);
    // Target 2: 2x ORB range extension
    const t2 = s.dir === "long"
      ? +(entry + orbRange * 2).toFixed(2)
      : +(entry - orbRange * 2).toFixed(2);
    const reward1 = +(Math.abs(t1 - entry) * shares).toFixed(0);
    const reward2 = +(Math.abs(t2 - entry) * shares).toFixed(0);
    const rr1     = riskPerShare > 0 ? (Math.abs(t1 - entry) / riskPerShare).toFixed(1) : "—";
    const rr2     = riskPerShare > 0 ? (Math.abs(t2 - entry) / riskPerShare).toFixed(1) : "—";
    return { entry, stop, shares, t1, t2, reward1, reward2, rr1, rr2, riskPerShare: +riskPerShare.toFixed(2) };
  }

  // ── Annotated Simulator Card ────────────────────────────────────────────────
  function SimulatorCard({ s }) {
    if (s.error) return (
      <div style={{marginTop:16, padding:16, background:"#0a1520", borderRadius:10,
        border:"1px solid #ff4d6d44", color:"#ff4d6d", fontSize:12}}>
        ⚠ {s.error}
      </div>
    );

    const t   = calcTrade(s);
    const { score, checks } = calcConfidenceScore(s);
    const scoreColor = score >= 80 ? "#00d4aa" : score >= 60 ? "#facc15" : "#ff4d6d";
    const isLong  = s.dir === "long";
    const isWatch = !s.dir || s.dir === "watch";
    const dirLabel = isWatch ? "👁 WATCHING" : isLong ? "▲ LONG" : "▼ SHORT";
    const dirClass = isWatch ? "watch" : isLong ? "long" : "short";

    const rows = [
      {
        label: "Entry Price",
        value: \`$\${t.entry?.toFixed(2) ?? "—"}\`,
        cls: "green",
        icon: "🎯",
        explain: <>Price just <strong>broke above the ORB High</strong> (or below ORB Low for shorts). This is your trigger — the moment momentum is confirmed.</>
      },
      {
        label: "ORB Range",
        value: \`$\${s.orbLow?.toFixed(2)} – $\${s.orbHigh?.toFixed(2)}\`,
        cls: "",
        sub: \`\${s.orbRangePct ?? "—"}% range · \${s.tinyRange ? "⚠ Tiny" : "✓ Healthy"}\`,
        icon: "📏",
        explain: <>The <strong>Opening Range</strong> is the high/low formed in the first {orbWindow} minutes. A range ≥ 0.2% is required — tiny ranges create noisy, unreliable breakouts.</>
      },
      {
        label: "Stop Loss",
        value: \`$\${t.stop?.toFixed(2) ?? "—"}\`,
        cls: "red",
        sub: \`Risk: $\${t.riskPerShare} / share · \${t.shares} shares\`,
        icon: "🛑",
        explain: <>Placed <strong>just inside the ORB</strong>. If price falls back into the range, the breakout has failed. Max risk is capped at <strong>\${maxRisk}</strong> based on your config.</>
      },
      {
        label: "Target 1  (2:1 R/R)",
        value: \`$\${t.t1?.toFixed(2) ?? "—"}\`,
        cls: "green",
        sub: \`Potential gain: $\${t.reward1}\`,
        icon: "🥇",
        explain: <>Your <strong>first profit target</strong> — reward is exactly 2× your risk. This is the minimum acceptable R/R for an ORB trade. Take partial profits here.</>
      },
      {
        label: "Target 2  (2× Range)",
        value: \`$\${t.t2?.toFixed(2) ?? "—"}\`,
        cls: "yellow",
        sub: \`Potential gain: $\${t.reward2}\`,
        icon: "🚀",
        explain: <>Extended move of <strong>2× the ORB range</strong> added to entry. Let your remaining position run here if momentum is strong — but only after T1 is hit.</>
      },
    ];

    const checkExplain = {
      "Breakout confirmed":     "Price closed above ORB High (long) or below ORB Low (short) on a real candle — not just a wick.",
      "Volume surge":           \`Breakout candle volume was ≥ \${volFilter}% of the average. Low-volume breakouts fail far more often.\`,
      "SPY trend aligned":      "SPY is trending in the same direction as your trade. Fighting the market trend is one of the biggest ORB mistakes.",
      "ORB range healthy":      "The range is ≥ 0.2% — wide enough to produce a meaningful breakout without excessive noise.",
      "Entry before 11 AM":     "ORB setups taken before 11 AM ET have historically much higher win rates. Momentum fades after the morning session.",
      "No major news":          "No earnings, upgrades, or major headlines on this ticker today. News-driven moves are unpredictable.",
      "No economic event":      "No FOMC, CPI, or NFP today. Macro events create sudden reversals that can blow through stops.",
      "Pre-market gap aligned": "The stock was already gapping in the same direction pre-market — extra confirmation of institutional interest.",
    };

    return (
      <div className="sim-card">

        {/* Header */}
        <div className="sim-card-header">
          <span className="sim-ticker">{s.ticker}</span>
          <span className={\`sim-dir-badge \${dirClass}\`}>{dirLabel}</span>
          <span className={\`badge \${s.conf}\`} style={{fontSize:11}}>
            {s.conf === "high" ? "High Conf" : s.conf === "med" ? "Med Conf" : "Low Conf"}
          </span>
          <span style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background: score >= 80 ? "rgba(0,212,170,0.12)" : score >= 60 ? "rgba(250,204,21,0.12)" : "rgba(255,77,109,0.12)",
            border:\`1px solid \${scoreColor}44\`, color:scoreColor,
            borderRadius:6, padding:"3px 10px", fontSize:11,
            fontFamily:"'Space Mono',monospace",
          }}>⬡ {score}%</span>
          <span style={{fontSize:11, color:"#475569", marginLeft:"auto"}}>
            Sim · {new Date().toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit"})} ET
          </span>
        </div>

        {/* Annotated rows */}
        {rows.map((row, i) => (
          <div className="sim-row" key={i}>
            <div className="sim-row-left">
              <div className="sim-row-label">{row.label}</div>
              <div className={\`sim-row-value \${row.cls}\`}>{row.value}</div>
              {row.sub && <div className="sim-row-sub">{row.sub}</div>}
            </div>
            <div className="sim-annotation">
              <div className="sim-annotation-icon">{row.icon}</div>
              <div className="sim-annotation-text">{row.explain}</div>
            </div>
          </div>
        ))}

        {/* Rule checks with explanations */}
        <div style={{marginTop:24, marginBottom:8, fontSize:9, color:"#475569", letterSpacing:"0.12em", textTransform:"uppercase"}}>
          Signal Checklist — what each rule means
        </div>
        <div className="sim-checks">
          {checks.map((c, i) => (
            <div className="sim-check-row" key={i}>
              <span className={\`sim-check-badge \${c.na ? "na" : c.pass ? "pass" : "fail"}\`}>
                {c.na ? "~" : c.pass ? "✓" : "⚠"} {c.label}
              </span>
              <span className="sim-check-explain">
                {checkExplain[c.label]}
                {!c.na && <> <strong style={{color: c.pass ? "#00d4aa" : "#ff4d6d"}}>{c.pass ? \`+\${c.weight}% confidence\` : "Not met — 0%"}</strong></>}
                {c.na && <strong style={{color:"#2a3a55"}}> — n/a (no pre-market data)</strong>}
              </span>
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div className="sim-score-bar">
          <div className="sim-score-label">Overall Confidence Score</div>
          <div className="sim-score-track">
            <div className="sim-score-fill" style={{width:\`\${score}%\`, background:scoreColor}}/>
          </div>
          <div className="sim-score-nums">
            <span>0%</span>
            <span style={{color:scoreColor, fontWeight:700}}>{score}% / 97% max</span>
            <span>97%</span>
          </div>
          <div style={{fontSize:10, color:"#2a3a55", marginTop:8}}>
            {score >= 80 ? "✓ Strong setup — most indicators aligned" :
             score >= 60 ? "⚠ Moderate — review failing checks before trading" :
             "✗ Weak setup — too many indicators missing"}
          </div>
        </div>

      </div>
    );
  }

  function SignalCard({ s, idx }) {
    const [elapsed, setElapsed] = useState("");
    // Use the persistent fire time from parent — survives re-renders across scans
    const firedAt = signalFireTimes.current[s.ticker] || Date.now();

    useEffect(() => {
      const update = () => {
        const secs = Math.floor((Date.now() - firedAt) / 1000);
        if (secs < 60)        setElapsed(\`\${secs}s ago\`);
        else if (secs < 3600) setElapsed(\`\${Math.floor(secs/60)}m \${secs%60}s ago\`);
        else                  setElapsed(\`\${Math.floor(secs/3600)}h ago\`);
      };
      update();
      const int = setInterval(update, 1000);
      return () => clearInterval(int);
    }, [firedAt]);

    const t  = calcTrade(s);
    const now = new Date();
    const late = now.getHours() >= 11;
    const orderType = "Market Order";

    return (
      <div className={\`signal-card \${s.dir}\`} key={\`\${s.id}-\${idx}\`}>
        {/* Header */}
        <div className="signal-header">
          <div className="signal-ticker">
            <div className={\`signal-dir \${s.dir}\`}>{s.dir === "long" ? "▲" : "▼"}</div>
            <div>
              <h3>{s.ticker} &nbsp; {confBadge(s.conf)} &nbsp; <ConfScoreBadge s={s} /></h3>
              <p>{s.dir === "long" ? "LONG — Buy Breakout" : "SHORT — Sell Breakout"} · {orderType}</p>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6}}>
            <span className={\`signal-timer \${late ? "urgent" : ""}\`}>⏱ {elapsed}</span>
            {late && <span className="time-warning">⚠ Late entry — use caution</span>}
          </div>
        </div>

        {/* Entry / Stop / Size */}
        <div className="trade-grid">
          <div className="trade-box entry">
            <div className="tb-label">Entry Price</div>
            <div className="tb-value">\${t.entry}</div>
            <div className="tb-sub">Market order now</div>
          </div>
          <div className="trade-box stop">
            <div className="tb-label">Stop Loss</div>
            <div className="tb-value">\${t.stop}</div>
            <div className="tb-sub">-\${t.riskPerShare}/share</div>
          </div>
          <div className="trade-box size">
            <div className="tb-label">Position Size</div>
            <div className="tb-value">{t.shares} shares</div>
            <div className="tb-value">\${(t.shares * t.entry).toLocaleString("en-US", {maximumFractionDigits:0})}</div>
            <div className="tb-sub">~\${maxRisk.toLocaleString()} max risk</div>
          </div>
        </div>

        {/* Targets */}
        <div className="targets-row">
          <div className="target-box">
            <div className="t-label">Target 1 — 2:1 R/R</div>
            <div className="t-price">\${t.t1}</div>
            <div className="t-meta">+\${t.reward1} reward · {t.rr1}:1 R/R</div>
          </div>
          <div className="target-box">
            <div className="t-label">Target 2 — 2× ORB Range</div>
            <div className="t-price">\${t.t2}</div>
            <div className="t-meta">+\${t.reward2} reward · {t.rr2}:1 R/R</div>
          </div>
        </div>

        {/* Rule checks */}
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:14}}>
          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
            background: s.tinyRange ? "rgba(255,77,109,0.1)" : "rgba(0,212,170,0.08)",
            border: \`1px solid \${s.tinyRange ? "#ff4d6d44" : "#00d4aa33"}\`,
            color: s.tinyRange ? "#ff4d6d" : "#00d4aa"}}>
            {s.tinyRange ? "⚠ Tiny range (<0.2%)" : \`✓ Range OK (\${s.orbRangePct}%)\`}
          </span>
          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
            background: spyTrend?.trend === "sideways" ? "rgba(250,204,21,0.08)" : spyTrend?.trend === "unknown" ? "rgba(71,85,105,0.2)" : "rgba(0,212,170,0.08)",
            border: \`1px solid \${spyTrend?.trend === "sideways" ? "#facc1544" : spyTrend?.trend === "unknown" ? "#47556944" : "#00d4aa33"}\`,
            color: spyTrend?.trend === "sideways" ? "#facc15" : spyTrend?.trend === "unknown" ? "#475569" : "#00d4aa"}}>
            {spyTrend?.trend === "up"       ? \`✓ SPY trending up (+\${spyTrend.spyChange}%)\` :
             spyTrend?.trend === "down"     ? \`✓ SPY trending down (\${spyTrend.spyChange}%)\` :
             spyTrend?.trend === "sideways" ? \`⚠ SPY sideways (\${spyTrend?.spyChange}%)\` :
             "— SPY trend unknown"}
          </span>
          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
            background: late ? "rgba(255,77,109,0.08)" : "rgba(0,212,170,0.08)",
            border: \`1px solid \${late ? "#ff4d6d44" : "#00d4aa33"}\`,
            color: late ? "#ff4d6d" : "#00d4aa"}}>
            {late ? "⚠ Entry after 11 AM" : "✓ Entry window open"}
          </span>
          {economicEvent?.hasEvent && (
            <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
              background:"rgba(250,204,21,0.08)", border:"1px solid #facc1544", color:"#facc15"}}>
              ⚠ {economicEvent.label}
            </span>
          )}
          {s.news?.hasNews && (
            <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
              background:"rgba(255,77,109,0.08)", border:"1px solid #ff4d6d44", color:"#ff4d6d"}}
              title={s.news.headlines?.join(" | ")}>
              ⚠ Major news — hover to see
            </span>
          )}
          {s.news && !s.news.hasNews && (
            <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
              background:"rgba(0,212,170,0.08)", border:"1px solid #00d4aa33", color:"#00d4aa"}}>
              ✓ No major news
            </span>
          )}
        </div>
        <div className="signal-footer">
          <div>
            <div className="meta-text">ORB Range: \${s.orbLow} – \${s.orbHigh} &nbsp;·&nbsp; Vol: {s.vol} &nbsp;·&nbsp; Fired: {s.time}</div>
            <div className="meta-text" style={{marginTop:3}}>{s.reason}</div>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <button className="btn btn-ghost" onClick={() => logSignalAsTrade(s)}
              style={{fontSize:9, padding:"6px 12px"}}>
              + Log
            </button>
            <button className={\`action-btn \${s.dir === "long" ? "buy" : "sell"}\`}>
              {s.dir === "long" ? "▲ BUY" : "▼ SELL"} {s.ticker}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{style}</style>
      <header className="header">
        <div className="logo">ORB<span>signal</span></div>
        <div className="ticker-bar">
          {["SPY","QQQ","VIX"].map(t => {
            const q = quotes[t];
            if (!q) return <div key={t} className="ticker-item">{t} <span style={{color:"#475569"}}>--</span></div>;
            const up = q.change >= 0;
            return (
              <div key={t} className="ticker-item">
                {t} <span className={up ? "up" : "down"}>{up ? "▲" : "▼"} {q.price} ({up ? "+" : ""}{q.change}%)</span>
              </div>
            );
          })}
          <div className="ticker-item"><span className="live-dot"/>LIVE</div>
          <button onClick={() => setAlertSound(v => !v)}
            style={{background:"none", border:"none", cursor:"pointer", fontSize:16, color: alertSound ? "#00d4aa" : "#475569"}}
            title={alertSound ? "Mute alerts" : "Unmute alerts"}>
            {alertSound ? "🔔" : "🔕"}
          </button>
        </div>
      </header>

      <main className="main">
        <div className={\`hero\${tab !== "learn" ? " hero-mobile-hide" : ""}\`}>
          <div className="hero-label">
            <span>Day Trading Intelligence</span>
          </div>
          <h1>Master the<br/><em>Opening Range Breakout</em></h1>
          <p>Learn the rules, understand the logic, and receive real-time breakout signals — all in one place.</p>
        </div>

        {/* Stats */}
        <div className={\`grid-3\${tab !== "learn" ? " hero-mobile-hide" : ""}\`} style={{marginBottom: 32}}>
          <div className="stat-box">
            <span className="val">68%</span>
            <span className="lbl">Historical Win Rate</span>
          </div>
          <div className="stat-box">
            <span className="val">2.1x</span>
            <span className="lbl">Avg Risk/Reward</span>
          </div>
          <div className="stat-box">
            <span className="val">9:30–10:00</span>
            <span className="lbl">ORB Window</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { id: "learn",     label: "📖 How It Works" },
            { id: "signals",   label: <span>⚡ Live Signals {newSignalFlash ? "🟢" : ""}</span> },
            { id: "futures",   label: "📈 Futures" },
            { id: "tradelog",  label: "📋 Trade Log" },
            { id: "configure", label: "⚙️ Alert Config" },
          ].map(t => (
            <button key={t.id} className={\`tab \${tab===t.id?"active":""}\`} onClick={()=>{ setTab(t.id); if(t.id==="tradelog") { fetchTradeLog(); fetchYesterdayReport(); } if(t.id==="futures") fetchFutures(); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* === LEARN TAB === */}
        {tab === "learn" && (
          <div>
            <div className="card">
              <div className="card-title">What is the Opening Range Breakout?</div>
              <p style={{fontSize:13, color:"#94a3b8", lineHeight:1.8, marginBottom:20}}>
                The ORB strategy captures the directional move that often follows the first burst of market activity. The "opening range" is simply the high and low formed in the first 15–30 minutes of trading. When price breaks decisively above or below that range, it signals institutional momentum that day traders can ride.
              </p>
              <div className="chart-wrap">
                <ORBChart />
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-line" style={{background:"#facc15"}}/>
                    <span>ORB High / Low</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{background:"rgba(250,204,21,0.3)", height:8}}/>
                    <span>ORB Zone</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{background:"#00d4aa"}}/>
                    <span>Breakout Candles</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Step-by-Step Rules</div>
                <div className="step">
                  <div className="step-num">1</div>
                  <div className="step-body">
                    <h4>Wait for the Opening Range</h4>
                    <p>Let the first 15 or 30 minutes trade freely. Mark the highest high and lowest low of that window — that's your range.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div className="step-body">
                    <h4>Wait for a Clean Breakout</h4>
                    <p>A candle must close above the ORB high (bullish) or below the ORB low (bearish). Don't enter on a wick alone.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div className="step-body">
                    <h4>Confirm with Volume</h4>
                    <p>The breakout candle should show at least 1.5× average volume. Low-volume breakouts fail far more often.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">4</div>
                  <div className="step-body">
                    <h4>Enter and Set Stops</h4>
                    <p>Enter at close of breakout candle. Stop loss goes just inside the ORB range (below high for longs, above low for shorts).</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">5</div>
                  <div className="step-body">
                    <h4>Target 2:1 Risk/Reward</h4>
                    <p>Set take profit at 2× the size of your stop. Trail stop after 1R is captured. Exit before 3:30 PM.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="card-title">Entry Rules Checklist</div>
                  <div style={{display:"flex", flexWrap:"wrap"}}>
                    {[
                      "Candle closes above/below ORB",
                      "Volume > 1.5× 20-bar avg",
                      "No major news event pending",
                      "Market trending (not sideways)",
                      "Entry before 11:00 AM",
                      "Risk max 1% of account",
                    ].map((r,i) => <div key={i} className="rule-chip"><div className="dot"/>{r}</div>)}
                  </div>
                </div>
                <div className="card" style={{marginTop:0}}>
                  <div className="card-title">⚠ Avoid These Setups</div>
                  <div style={{display:"flex", flexWrap:"wrap"}}>
                    {[
                      "Wick-only breakout (no close)",
                      "Low volume < 1× average",
                      "Entry after 11:30 AM",
                      "FOMC / CPI days (volatility)",
                      "Tiny ORB range (< 0.2%)",
                    ].map((r,i) => <div key={i} className="rule-chip pill-warning"><div className="dot"/>{r}</div>)}
                  </div>
                </div>
                <div className="card" style={{marginTop:0}}>
                  <div className="card-title">🧪 Signal Simulator</div>
                  <p style={{fontSize:12, color:"#64748b", marginBottom:16, lineHeight:1.6}}>
                    Picks a random <strong style={{color:"#94a3b8"}}>Mag 7</strong> stock, fetches real market data, and renders a fully annotated signal card — so you can learn exactly what each number means before going live.
                  </p>
                  <button className="btn btn-primary simulate-btn" onClick={runSim} disabled={simLoading}>
                    {simLoading
                      ? \`⟳ Fetching \${simTicker ?? "..."}...\`
                      : simResult
                        ? \`▶ Run Again  (\${MAG7.join(" · ")})\`
                        : "▶ Run Simulator"}
                  </button>
                  {simResult && <SimulatorCard s={simResult} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SIGNALS TAB === */}
        {tab === "signals" && (
          <div>

            {/* ── Morning Brief ── */}
            {(isPreMarketHours() || briefForced) && !briefDismissed && (
              <div className="morning-brief">
                <div className="brief-header">
                  <div className="brief-title">
                    🌅 Pre-Market Morning Brief
                    <span className="brief-time">
                      {new Date().toLocaleDateString("en-US", { timeZone:"America/New_York", weekday:"short", month:"short", day:"numeric" })}
                      {" · "}
                      {new Date().toLocaleTimeString("en-US", { timeZone:"America/New_York", hour:"2-digit", minute:"2-digit" })} ET
                    </span>
                  </div>
                  <button className="brief-dismiss" onClick={() => { setBriefDismissed(true); setBriefForced(false); }} title="Dismiss">✕</button>
                </div>

                {futures.length === 0 && (
                  <div style={{color:"#475569", fontSize:12, padding:"12px 0"}}>⟳ Loading futures data...</div>
                )}

                {futures.length > 0 && (<>
                {/* Index futures */}
                <div className="brief-futures">
                  {futures.filter(f => f.category === "index").map(f => (
                    <div key={f.symbol} className={\`brief-future \${f.trend}\`}>
                      <div className="brief-future-name">{f.name}</div>
                      <div className="brief-future-price">{f.price ? \`$\${f.price.toLocaleString()}\` : "—"}</div>
                      <div className={\`brief-future-chg \${f.trend === "up" ? "up" : f.trend === "down" ? "down" : "flat"}\`}>
                        {f.change != null ? \`\${f.change > 0 ? "▲" : f.change < 0 ? "▼" : "—"} \${Math.abs(f.change)}%\` : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gap movers */}
                {premarket.filter(p => Math.abs(p.gapPct || 0) > 0.3).length > 0 && (
                  <div className="brief-movers">
                    <div className="brief-movers-title">Gap Movers — Your Watchlist</div>
                    {premarket
                      .filter(p => Math.abs(p.gapPct || 0) > 0.3)
                      .sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct))
                      .map(p => (
                        <div key={p.ticker} className="brief-mover-row">
                          <span className="brief-mover-ticker">{p.ticker}</span>
                          <span className="brief-mover-price">\${p.prePrice}</span>
                          <span className={\`brief-mover-gap \${p.gapDir}\`}>
                            {p.gapPct > 0 ? "▲" : "▼"} {Math.abs(p.gapPct)}%
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Auto-generated text summary */}
                <div className="brief-summary">
                  {(() => {
                    const es  = futures.find(f => f.symbol === "ES=F");
                    const nq  = futures.find(f => f.symbol === "NQ=F");
                    const cl  = futures.find(f => f.symbol === "CL=F");
                    const gapUp   = premarket.filter(p => p.gapPct > 0.5).length;
                    const gapDown = premarket.filter(p => p.gapPct < -0.5).length;
                    const mktBias = (es?.trend === "up" && nq?.trend === "up") ? "bull"
                                  : (es?.trend === "down" && nq?.trend === "down") ? "bear"
                                  : "warn";
                    return (
                      <span>
                        <strong>Market bias:</strong>
                        <span className={\`tag \${mktBias}\`}>
                          {mktBias === "bull" ? "BULLISH" : mktBias === "bear" ? "BEARISH" : "MIXED"}
                        </span>
                        {es && <> — S&P futures <strong>{es.change > 0 ? "up" : "down"} {Math.abs(es.change)}%</strong></>}
                        {nq && <>, Nasdaq <strong>{nq.change > 0 ? "up" : "down"} {Math.abs(nq.change)}%</strong></>}.
                        {cl && <> Crude oil at <strong>\${cl.price}</strong> ({cl.change > 0 ? "+" : ""}{cl.change}%).</>}
                        {economicEvent?.hasEvent && <> <span className="tag warn">⚠ {economicEvent.label}</span> today — trade smaller.</>}
                        {(gapUp > 0 || gapDown > 0) && <> {gapUp > 0 && <><strong>{gapUp}</strong> ticker{gapUp > 1 ? "s" : ""} gapping up.</>} {gapDown > 0 && <><strong>{gapDown}</strong> gapping down.</>}</>}
                        {" "}ORB window opens at <strong>9:30 AM ET</strong>.
                      </span>
                    );
                  })()}
                </div>
                </>)}
              </div>
            )}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-title">Today's ORB Signals</div>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
                <p style={{fontSize:11, color:"#475569"}}>
                  <span className="live-dot"/>
                  {lastScanned ? \`Last scanned: \${lastScanned} · Auto-refreshes every 60s\` : "Scanning watchlist..."}
                </p>
                <button className="btn btn-ghost" onClick={runScan} disabled={scanning}
                  style={{fontSize:10, padding:"6px 12px"}}>
                  {scanning ? "⟳ Scanning..." : "↺ Scan Now"}
                </button>
              </div>

              {scanError && (
                <div style={{background:"rgba(255,77,109,0.08)", border:"1px solid #ff4d6d33",
                  borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:11, color:"#ff4d6d"}}>
                  ⚠ {scanError}
                </div>
              )}

              {economicEvent?.hasEvent && (
                <div style={{background:"rgba(250,204,21,0.06)", border:"1px solid #facc1544",
                  borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:11, color:"#facc15",
                  display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:16}}>⚠</span>
                  <div>
                    <strong>{economicEvent.label} today</strong>
                    <span style={{color:"#94a3b8", marginLeft:8}}>— High volatility expected. ORB signals less reliable.</span>
                  </div>
                </div>
              )}

              {scanning && !signals.length && (
                <div className="empty-state">
                  <div className="icon">📡</div>
                  <p>Scanning {watchlist.join(", ")}...</p>
                </div>
              )}

              {!scanning && !scanError && signals.length === 0 && noBreakout.length === 0 && (
                <div className="empty-state">
                  <div className="icon">📡</div>
                  <p>No signals yet.<br/>Click "Scan Now" or wait for auto-refresh.</p>
                </div>
              )}

              {signals.map((s, idx) => (
                <SignalCard key={\`\${s.id}-\${idx}\`} s={s} idx={idx} />
              ))}

              {noBreakout.length > 0 && (
                <div style={{marginTop: signals.length ? 20 : 0}}>
                  <div style={{fontSize:10, color:"#475569", letterSpacing:"0.15em",
                    textTransform:"uppercase", marginBottom:10}}>Watching — No Breakout Yet</div>
                  {noBreakout.map((s, idx) => (
                    <div key={\`nb-\${idx}\`} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 14px", background:"#080b10", borderRadius:8,
                      border:"1px solid #1a2030", marginBottom:8, fontSize:11
                    }}>
                      <span style={{color:"#94a3b8", fontWeight:"bold"}}>{s.ticker}</span>
                      <span style={{color:"#475569"}}>Range: \${s.orbLow} – \${s.orbHigh}</span>
                      <span style={{color:"#64748b"}}>\${s.price}</span>
                      <span style={{color:"#475569"}}>{s.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-title">Signal Key</div>
              <div style={{display:"flex", gap:24, flexWrap:"wrap", fontSize:12, color:"#64748b"}}>
                <div>🟢 <span style={{color:"#00d4aa"}}>Long</span> — Breakout above ORB High</div>
                <div>🔴 <span style={{color:"#ff4d6d"}}>Short</span> — Breakdown below ORB Low</div>
                <div><span className="badge high">High Conf</span> 200%+ volume</div>
                <div><span className="badge med">Med Conf</span> 120–200% volume</div>
                <div><span className="badge low">Low Conf</span> Under 120% — caution</div>
              </div>
            </div>
          </div>
        )}

        {/* === FUTURES TAB === */}
        {tab === "futures" && (
          <div>
            {/* Futures grid */}
            <div className="card" style={{marginBottom:20}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                <div className="card-title">Futures Markets</div>
                <button className="btn btn-ghost" onClick={fetchFutures}
                  style={{fontSize:10, padding:"6px 12px"}}>
                  {futuresLoading ? "⟳ Loading..." : "↺ Refresh"}
                </button>
              </div>
              {futures.length === 0 && !futuresLoading && (
                <div className="empty-state">
                  <div className="icon">📈</div>
                  <p>Loading futures data...</p>
                </div>
              )}
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10}}>
                {futures.map(f => (
                  <div key={f.symbol} style={{
                    background:"#080b10", border:\`1px solid \${f.trend==="up"?"#00d4aa33":f.trend==="down"?"#ff4d6d33":"#1a2030"}\`,
                    borderRadius:10, padding:"14px 16px"
                  }}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
                      <div>
                        <div style={{fontSize:11, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2}}>{f.name}</div>
                        <div style={{fontSize:10, color:"#2a3a55"}}>{f.symbol}</div>
                      </div>
                      <span style={{fontSize:9, padding:"2px 7px", borderRadius:4,
                        background: f.trend==="up"?"rgba(0,212,170,0.1)":f.trend==="down"?"rgba(255,77,109,0.1)":"rgba(71,85,105,0.2)",
                        color: f.trend==="up"?"#00d4aa":f.trend==="down"?"#ff4d6d":"#475569",
                        border: \`1px solid \${f.trend==="up"?"#00d4aa33":f.trend==="down"?"#ff4d6d33":"#1a2030"}\`
                      }}>
                        {f.trend==="up"?"▲ UP":f.trend==="down"?"▼ DOWN":"— FLAT"}
                      </span>
                    </div>
                    <div style={{fontSize:20, fontWeight:700, color:"#f0f4f8", marginBottom:4}}>
                      {f.price ? \`$\${f.price.toLocaleString()}\` : "—"}
                    </div>
                    <div style={{fontSize:11, color: f.change > 0 ? "#00d4aa" : f.change < 0 ? "#ff4d6d" : "#475569"}}>
                      {f.change != null ? \`\${f.change > 0 ? "+" : ""}\${f.change}%\` : "—"}
                      {f.prevClose && <span style={{color:"#2a3a55", marginLeft:8}}>prev \${f.prevClose.toLocaleString()}</span>}
                    </div>
                    {f.high && f.low && (
                      <div style={{fontSize:10, color:"#2a3a55", marginTop:4}}>
                        H: \${f.high.toLocaleString()} · L: \${f.low.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-market watchlist */}
            <div className="card">
              <div className="card-title" style={{marginBottom:16}}>Pre-Market — Your Watchlist</div>
              {premarket.length === 0 && (
                <div className="empty-state" style={{padding:"20px 0"}}>
                  <div className="icon">🌅</div>
                  <p>No pre-market data yet.<br/>Available from ~4:00 AM ET.</p>
                </div>
              )}
              {premarket.length > 0 && (
                <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid #1e2a3a", color:"#475569", textAlign:"left"}}>
                      {["Ticker","Pre-Market Price","Prev Close","Gap %","Direction"].map(h => (
                        <th key={h} style={{padding:"8px 12px", fontWeight:"normal", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {premarket.map(p => (
                      <tr key={p.ticker} style={{borderBottom:"1px solid #0f1520"}}>
                        <td style={{padding:"12px", color:"#f0f4f8", fontWeight:"bold"}}>{p.ticker}</td>
                        <td style={{padding:"12px", color:"#e2e8f0"}}>{p.prePrice ? \`$\${p.prePrice}\` : "—"}</td>
                        <td style={{padding:"12px", color:"#475569"}}>{p.prevClose ? \`$\${p.prevClose}\` : "—"}</td>
                        <td style={{padding:"12px", color: p.gapPct > 0.5 ? "#00d4aa" : p.gapPct < -0.5 ? "#ff4d6d" : "#475569"}}>
                          {p.gapPct != null ? \`\${p.gapPct > 0 ? "+" : ""}\${p.gapPct}%\` : "—"}
                        </td>
                        <td style={{padding:"12px"}}>
                          <span style={{fontSize:10, padding:"3px 8px", borderRadius:4,
                            background: p.gapDir==="up"?"rgba(0,212,170,0.1)":p.gapDir==="down"?"rgba(255,77,109,0.1)":"rgba(71,85,105,0.15)",
                            color: p.gapDir==="up"?"#00d4aa":p.gapDir==="down"?"#ff4d6d":"#475569",
                            border: \`1px solid \${p.gapDir==="up"?"#00d4aa33":p.gapDir==="down"?"#ff4d6d33":"#1a203044"}\`
                          }}>
                            {p.gapDir==="up"?"▲ Gap Up":p.gapDir==="down"?"▼ Gap Down":"— Flat"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* === TRADE LOG TAB === */}
        {tab === "tradelog" && (() => {
          // ── My Performance chart data ──────────────────────────────────────
          const [perfView, setPerfView] = useState("pnl");
          const closed = tradeLog.filter(t => t.outcome !== "open" && t.pnl_dollar != null);
          // Cumulative P&L over time
          let running = 0;
          const pnlSeries = closed.map(t => {
            running += t.pnl_dollar;
            return { date: new Date(t.logged_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}), pnl: +running.toFixed(0), trade: t };
          });
          // Win rate rolling (all trades so far)
          const wrSeries = closed.map((t, i) => {
            const slice = closed.slice(0, i + 1);
            const wins  = slice.filter(x => x.outcome === "win").length;
            return { date: new Date(t.logged_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}), wr: +((wins / slice.length) * 100).toFixed(0) };
          });
          // By ticker
          const byTicker = {};
          for (const t of closed) {
            if (!byTicker[t.ticker]) byTicker[t.ticker] = 0;
            byTicker[t.ticker] += t.pnl_dollar;
          }
          const tickerSeries = Object.entries(byTicker).sort((a,b) => b[1]-a[1]).map(([ticker, pnl]) => ({ ticker, pnl: +pnl.toFixed(0) }));
          const maxAbs = Math.max(...tickerSeries.map(x => Math.abs(x.pnl)), 1);

          // best trade
          const best = closed.reduce((b, t) => t.pnl_dollar > (b?.pnl_dollar ?? -Infinity) ? t : b, null);

          // ── Yesterday ORB data ──────────────────────────────────────────────
          const ydayResults = yesterdayReport?.results?.filter(r => r.dir !== "none" || r.orbHigh) || [];
          const ydayDate    = yesterdayReport?.date ? new Date(yesterdayReport.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : "—";
          const ydaySignals = ydayResults.filter(r => r.dir !== "none");
          const ydayWins    = ydaySignals.filter(r => r.outcome === "win").length;
          const ydayLosses  = ydaySignals.filter(r => r.outcome === "loss").length;
          const ydayNet     = ydaySignals.reduce((s, r) => s + (r.pnl ?? 0), 0);
          const ydayMaxAbs  = Math.max(...ydaySignals.map(r => Math.abs(r.pnlPct ?? 0)), 1);

          return (
          <div>
            {/* ── Section 1: My Performance ── */}
            <div className="perf-section">
              <div className="perf-header">
                <div>
                  <div className="perf-title">📈 My Performance</div>
                  <div className="perf-subtitle">Based on {closed.length} closed trade{closed.length !== 1 ? "s" : ""}</div>
                </div>
                <div className="perf-toggles">
                  {[["pnl","Cumulative P&L"],["wr","Win Rate"],["ticker","By Ticker"]].map(([v,l]) => (
                    <button key={v} className={\`perf-toggle \${perfView===v?"active":""}\`} onClick={()=>setPerfView(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {closed.length === 0 ? (
                <div className="empty-state" style={{padding:"32px 0"}}>
                  <div className="icon">📊</div>
                  <p>No closed trades yet — log and close trades to see your performance chart.</p>
                </div>
              ) : (<>
                {/* Stats strip */}
                <div className="perf-stats-strip">
                  <div className="perf-stat">
                    <span className="perf-stat-val" style={{color: tradeStats?.totalPnl >= 0 ? "#00d4aa" : "#ff4d6d"}}>
                      {tradeStats?.totalPnl >= 0 ? "+" : ""}\${tradeStats?.totalPnl ?? 0}
                    </span>
                    <span className="perf-stat-lbl">Total P&L</span>
                  </div>
                  <div className="perf-stat">
                    <span className="perf-stat-val">{tradeStats?.winRate ?? 0}%</span>
                    <span className="perf-stat-lbl">Win Rate</span>
                  </div>
                  <div className="perf-stat">
                    <span className="perf-stat-val">{tradeStats?.total ?? 0}</span>
                    <span className="perf-stat-lbl">{tradeStats?.wins ?? 0}W / {tradeStats?.losses ?? 0}L</span>
                  </div>
                  {best && (
                    <div className="perf-stat">
                      <span className="perf-stat-val" style={{color:"#00d4aa"}}>+\${best.pnl_dollar}</span>
                      <span className="perf-stat-lbl">Best · {best.ticker}</span>
                    </div>
                  )}
                </div>

                {/* ── P&L Chart ── */}
                {perfView === "pnl" && (
                  <div style={{overflowX:"auto"}}>
                    <div style={{minWidth: Math.max(pnlSeries.length * 60, 300), height:160, position:"relative", padding:"0 8px"}}>
                      {/* Grid lines */}
                      {[0,25,50,75,100].map(p => (
                        <div key={p} style={{position:"absolute", left:0, right:0, top:\`\${100-p}%\`,
                          borderTop:"1px solid #0f1520", pointerEvents:"none"}}/>
                      ))}
                      {/* Zero line */}
                      <div style={{position:"absolute", left:0, right:0,
                        top: \`\${100 - ((0 - Math.min(...pnlSeries.map(x=>x.pnl),0)) / (Math.max(...pnlSeries.map(x=>x.pnl),1) - Math.min(...pnlSeries.map(x=>x.pnl),0)) * 100)}%\`,
                        borderTop:"1px solid #2a3a55"}}/>
                      {/* SVG line chart */}
                      {(() => {
                        const vals = pnlSeries.map(x => x.pnl);
                        const minV = Math.min(...vals, 0);
                        const maxV = Math.max(...vals, 0);
                        const range = maxV - minV || 1;
                        const w = Math.max(pnlSeries.length * 60, 300);
                        const h = 140;
                        const pts = pnlSeries.map((x, i) => {
                          const cx = (i / Math.max(pnlSeries.length - 1, 1)) * (w - 20) + 10;
                          const cy = h - ((x.pnl - minV) / range) * h;
                          return { cx, cy, ...x };
                        });
                        const polyline = pts.map(p => \`\${p.cx},\${p.cy}\`).join(" ");
                        return (
                          <svg width="100%" height={h} viewBox={\`0 0 \${w} \${h}\`} style={{overflow:"visible"}}>
                            <defs>
                              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="#00d4aa" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <polygon
                              points={\`10,\${h} \${polyline} \${pts[pts.length-1].cx},\${h}\`}
                              fill="url(#pnlGrad)"
                            />
                            <polyline points={polyline} fill="none" stroke="#00d4aa" strokeWidth="2" strokeLinejoin="round"/>
                            {pts.map((p, i) => (
                              <g key={i}>
                                <circle cx={p.cx} cy={p.cy} r={4}
                                  fill={p.pnl >= 0 ? "#00d4aa" : "#ff4d6d"} stroke="#080b10" strokeWidth={2}/>
                                <text x={p.cx} y={h + 14} textAnchor="middle" fontSize={9} fill="#475569">{p.date}</text>
                              </g>
                            ))}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── Win Rate Chart ── */}
                {perfView === "wr" && (
                  <div style={{overflowX:"auto"}}>
                    <div style={{minWidth: Math.max(wrSeries.length * 60, 300), height:160, display:"flex", alignItems:"flex-end", gap:4, paddingBottom:20, position:"relative"}}>
                      <div style={{position:"absolute", left:0, right:0, top:"50%", borderTop:"1px dashed #2a3a55", fontSize:9, color:"#2a3a55"}}> &nbsp;50%</div>
                      {wrSeries.map((x, i) => (
                        <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:50}}>
                          <div style={{fontSize:9, color: x.wr >= 50 ? "#00d4aa" : "#ff4d6d", fontFamily:"'Space Mono',monospace"}}>{x.wr}%</div>
                          <div style={{
                            width:"100%", borderRadius:"4px 4px 0 0",
                            height:\`\${x.wr}%\`, maxHeight:120,
                            background: x.wr >= 60 ? "#00d4aa" : x.wr >= 45 ? "#facc15" : "#ff4d6d",
                            opacity:0.7, transition:"height 0.6s ease",
                          }}/>
                          <div style={{fontSize:9, color:"#475569"}}>{x.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── By Ticker Chart ── */}
                {perfView === "ticker" && (
                  <div style={{display:"flex", flexDirection:"column", gap:10}}>
                    {tickerSeries.map((x, i) => (
                      <div key={i} style={{display:"grid", gridTemplateColumns:"60px 1fr 80px", alignItems:"center", gap:12}}>
                        <span style={{fontSize:12, fontWeight:700, color:"#f0f4f8", fontFamily:"'Instrument Serif',serif"}}>{x.ticker}</span>
                        <div style={{position:"relative", height:8, background:"#1e2a3a", borderRadius:4, overflow:"hidden"}}>
                          <div style={{
                            position:"absolute", top:0, height:"100%", borderRadius:4,
                            width:\`\${(Math.abs(x.pnl) / maxAbs) * 100}%\`,
                            background: x.pnl >= 0 ? "#00d4aa" : "#ff4d6d",
                            left: x.pnl >= 0 ? 0 : "auto", right: x.pnl < 0 ? 0 : "auto",
                          }}/>
                        </div>
                        <span style={{fontSize:12, fontFamily:"'Space Mono',monospace", fontWeight:700,
                          color: x.pnl >= 0 ? "#00d4aa" : "#ff4d6d", textAlign:"right"}}>
                          {x.pnl >= 0 ? "+" : ""}\${x.pnl}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>)}
            </div>

            {/* ── Section 2: Yesterday's ORB Report ── */}
            <div className="perf-section">
              <div className="perf-header">
                <div>
                  <div className="perf-title">📊 Yesterday's ORB Report</div>
                  <div className="perf-subtitle">
                    {yesterdayLoading ? "Loading..." : ydayDate ? \`\${ydayDate} · If you had acted on every signal\` : "No data yet"}
                  </div>
                </div>
                <button className="perf-toggle" onClick={fetchYesterdayReport} disabled={yesterdayLoading}
                  style={{fontSize:10}}>
                  {yesterdayLoading ? "⟳" : "↻ Refresh"}
                </button>
              </div>

              {yesterdayLoading && (
                <div style={{color:"#475569", fontSize:12, padding:"20px 0", textAlign:"center"}}>
                  ⟳ Fetching yesterday's data for {watchlist.length} tickers...
                </div>
              )}

              {!yesterdayLoading && yesterdayReport?.error && (
                <div style={{color:"#ff4d6d", fontSize:12, padding:"12px 0"}}>⚠ {yesterdayReport.error}</div>
              )}

              {!yesterdayLoading && ydayResults.length === 0 && !yesterdayReport?.error && (
                <div className="empty-state" style={{padding:"32px 0"}}>
                  <div className="icon">📊</div>
                  <p>Switch to the Trade Log tab to load yesterday's report,<br/>or click Refresh above.</p>
                </div>
              )}

              {!yesterdayLoading && ydayResults.length > 0 && (<>
                {/* All tickers */}
                {ydayResults.map((r, i) => {
                  const isLong  = r.dir === "long";
                  const isShort = r.dir === "short";
                  const noSig   = r.dir === "none";
                  const barPct  = noSig ? 0 : Math.min((Math.abs(r.pnlPct ?? 0) / ydayMaxAbs) * 100, 100);
                  const color   = r.outcome === "win" ? "#00d4aa" : r.outcome === "loss" ? "#ff4d6d" : "#475569";
                  return (
                    <div className="yday-row" key={i}>
                      <span className="yday-ticker">{r.ticker}</span>
                      <span className="yday-dir" style={{color: isLong ? "#00d4aa" : isShort ? "#ff4d6d" : "#475569"}}>
                        {noSig ? "— No signal" : isLong ? "▲ LONG" : "▼ SHORT"}
                      </span>
                      <div>
                        <div className="yday-bar-wrap">
                          {!noSig && (
                            <div className="yday-bar-fill" style={{
                              width:\`\${barPct}%\`, background:color,
                              left: isLong ? 0 : "auto", right: isShort ? 0 : "auto",
                            }}/>
                          )}
                        </div>
                        {!noSig && (
                          <div className="yday-exit-type">
                            Entry \${r.entry} → {r.exitType} \${r.exitPrice}
                          </div>
                        )}
                        {noSig && <div className="yday-exit-type">ORB {r.orbLow}–{r.orbHigh}</div>}
                      </div>
                      <div>
                        {!noSig && (
                          <div className="yday-pnl" style={{color}}>
                            {r.pnl >= 0 ? "+" : ""}\${r.pnl}
                          </div>
                        )}
                        <div className="yday-exit-type" style={{textAlign:"right"}}>
                          {!noSig && \`\${r.pnlPct > 0 ? "+" : ""}\${r.pnlPct}%\`}
                        </div>
                      </div>
                      <div className="yday-outcome">
                        {!noSig && (
                          <span className={\`badge \${r.outcome === "win" ? "high" : r.outcome === "loss" ? "low" : "med"}\`}>
                            {r.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Summary */}
                {ydaySignals.length > 0 && (
                  <div className="yday-summary">
                    <div className="perf-stat">
                      <span className="perf-stat-val">{ydaySignals.length}</span>
                      <span className="perf-stat-lbl">Signals fired</span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-stat-val" style={{color:"#00d4aa"}}>{ydayWins}W</span>
                      <span className="perf-stat-lbl">Wins</span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-stat-val" style={{color:"#ff4d6d"}}>{ydayLosses}L</span>
                      <span className="perf-stat-lbl">Losses</span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-stat-val" style={{color: ydayNet >= 0 ? "#00d4aa" : "#ff4d6d"}}>
                        {ydayNet >= 0 ? "+" : ""}\${ydayNet.toFixed(0)}
                      </span>
                      <span className="perf-stat-lbl">Net P&L</span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-stat-val">
                        {ydaySignals.length > 0 ? Math.round((ydayWins / ydaySignals.length) * 100) : 0}%
                      </span>
                      <span className="perf-stat-lbl">Win rate</span>
                    </div>
                    <div className="perf-stat" style={{marginLeft:"auto", fontSize:9, color:"#2a3a55", alignSelf:"center"}}>
                      Exit = T1 if hit, else EOD close
                    </div>
                  </div>
                )}
              </>)}
            </div>

            {/* ── Trade History Table ── */}
            <div className="card">
              <div className="card-title">Trade History</div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                <p style={{fontSize:11, color:"#475569"}}>
                  {logLoading ? "Loading..." : \`\${tradeLog.length} trades recorded\`}
                </p>
                <a href={\`\${API}/trades/export\`} target="_blank"
                  className="btn btn-ghost" style={{fontSize:10, padding:"6px 12px", textDecoration:"none"}}>
                  ⬇ Export CSV
                </a>
              </div>

              {tradeLog.length === 0 && !logLoading && (
                <div className="empty-state">
                  <div className="icon">📋</div>
                  <p>No trades logged yet.<br/>Click "+ Log Trade" on any signal to record it.</p>
                </div>
              )}

              {tradeLog.length > 0 && (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%", borderCollapse:"collapse", fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #1e2a3a", color:"#475569", textAlign:"left"}}>
                        {["Ticker","Dir","Entry","Stop","Target","Exit","Outcome","P&L","Conf","Logged"].map(h => (
                          <th key={h} style={{padding:"8px 10px", fontWeight:"normal", letterSpacing:"0.1em", textTransform:"uppercase", fontSize:10}}>{h}</th>
                        ))}
                        <th style={{padding:"8px 10px"}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeLog.map(t => (
                        <tr key={t.id} style={{borderBottom:"1px solid #0f1520"}}>
                          <td style={{padding:"10px", color:"#f0f4f8", fontWeight:"bold"}}>{t.ticker}</td>
                          <td style={{padding:"10px", color: t.dir === "long" ? "#00d4aa" : "#ff4d6d"}}>{t.dir === "long" ? "▲ Long" : "▼ Short"}</td>
                          <td style={{padding:"10px", color:"#94a3b8"}}>\${t.entry_price}</td>
                          <td style={{padding:"10px", color:"#ff4d6d"}}>\${t.stop_price}</td>
                          <td style={{padding:"10px", color:"#00d4aa"}}>\${t.target_price}</td>
                          <td style={{padding:"10px", color:"#94a3b8"}}>{t.exit_price ? \`$\${t.exit_price}\` : "—"}</td>
                          <td style={{padding:"10px"}}>
                            <span className={\`badge \${t.outcome === "win" ? "high" : t.outcome === "loss" ? "low" : "med"}\`}>
                              {t.outcome}
                            </span>
                          </td>
                          <td style={{padding:"10px", color: t.pnl_dollar > 0 ? "#00d4aa" : t.pnl_dollar < 0 ? "#ff4d6d" : "#475569"}}>
                            {t.pnl_dollar != null ? \`\${t.pnl_dollar > 0 ? "+" : ""}$\${t.pnl_dollar} (\${t.pnl_pct}%)\` : "—"}
                          </td>
                          <td style={{padding:"10px"}}>
                            <span className={\`badge \${t.confidence}\`}>{t.confidence}</span>
                          </td>
                          <td style={{padding:"10px", color:"#475569"}}>
                            {new Date(t.logged_at).toLocaleDateString("en-US", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}
                          </td>
                          <td style={{padding:"10px"}}>
                            {t.outcome === "open" && (
                              <button className="btn btn-ghost" onClick={() => setCloseModal(t)}
                                style={{fontSize:9, padding:"4px 10px"}}>
                                Close
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Close Trade Modal */}
            {closeModal && (
              <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}}>
                <div className="card" style={{width:340, margin:0}}>
                  <div className="card-title">Close Trade — {closeModal.ticker}</div>
                  <p style={{fontSize:12, color:"#94a3b8", marginBottom:16}}>
                    {closeModal.dir === "long" ? "▲ Long" : "▼ Short"} · Entry: \${closeModal.entry_price}
                  </p>
                  <div className="slider-row">
                    <label>Exit Price</label>
                    <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)}
                      placeholder={\`e.g. \${closeModal.target_price}\`}
                      style={{width:"100%", background:"#0f1520", border:"1px solid #2a3a55", borderRadius:6,
                        padding:"8px 12px", color:"#e2e8f0", fontFamily:"'Space Mono', monospace", fontSize:12, outline:"none"}} />
                  </div>
                  <div style={{display:"flex", gap:8, marginTop:12}}>
                    <button className="btn btn-primary" style={{flex:1}}
                      onClick={() => closeTrade(closeModal.id, exitPrice, parseFloat(exitPrice) > closeModal.entry_price === (closeModal.dir === "long") ? "win" : "loss")}>
                      ✓ Close as {exitPrice && (parseFloat(exitPrice) > closeModal.entry_price === (closeModal.dir === "long") ? "WIN" : "LOSS")}
                    </button>
                    <button className="btn btn-ghost" onClick={() => closeTrade(closeModal.id, closeModal.entry_price, "cancelled")}>
                      Cancel Trade
                    </button>
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%", marginTop:8}}
                    onClick={() => { setCloseModal(null); setExitPrice(""); }}>
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* === CONFIG TAB === */}
        {tab === "configure" && (
          <div className="grid-2">
            <div>
              <div className="card">
                <div className="card-title">ORB Strategy Settings</div>
                <div className="slider-row">
                  <label>ORB Window <span>{orbWindow} min</span></label>
                  <input type="range" min="5" max="60" step="5" value={orbWindow}
                    onChange={e => setOrbWindow(Number(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Min Volume Filter <span>{volFilter}% of avg</span></label>
                  <input type="range" min="100" max="400" step="10" value={volFilter}
                    onChange={e => setVolFilter(Number(e.target.value))} />
                </div>
                <div className="slider-row">
                  <label>Max Risk Per Trade <span style={{color:"#facc15"}}>\${maxRisk.toLocaleString()}</span></label>
                  <input type="range" min="100" max="10000" step="100" value={maxRisk}
                    onChange={e => setMaxRisk(Number(e.target.value))} />
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:10, color:"#2a3a55", marginTop:4}}>
                    <span>$100</span>
                    <span>$2,500</span>
                    <span>$5,000</span>
                    <span>$10,000</span>
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <div className="card-title" style={{marginBottom:10}}>Watchlist</div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:10}}>
                    {watchlist.map(t => (
                      <div key={t} style={{
                        display:"flex", alignItems:"center", gap:5,
                        background:"#1a2540", border:"1px solid #2a3a55",
                        borderRadius:6, padding:"5px 10px", fontSize:11, color:"#e2e8f0"
                      }}>
                        {t}
                        <button onClick={() => removeTicker(t)} style={{
                          background:"none", border:"none", color:"#ff4d6d",
                          cursor:"pointer", fontSize:13, lineHeight:1, padding:0, marginLeft:2
                        }}>×</button>
                      </div>
                    ))}
                    {watchlist.length === 0 && (
                      <span style={{fontSize:11, color:"#475569"}}>No tickers — add one below</span>
                    )}
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={e => setTickerInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && addTicker()}
                      placeholder="Add ticker e.g. NVDA"
                      maxLength={5}
                      style={{
                        flex:1, background:"#0f1520", border:"1px solid #2a3a55",
                        borderRadius:6, padding:"8px 12px", color:"#e2e8f0",
                        fontFamily:"'Space Mono', monospace", fontSize:11, outline:"none"
                      }}
                    />
                    <button className="btn btn-primary" onClick={addTicker} style={{padding:"8px 14px"}}>
                      + Add
                    </button>
                  </div>
                </div>
                <div className="config-row">
                  <span className="config-label">Signal Cutoff Time</span>
                  <select>
                    <option>11:00 AM</option>
                    <option>11:30 AM</option>
                    <option>12:00 PM</option>
                  </select>
                </div>
                <div className="config-row">
                  <span className="config-label">Confidence Filter</span>
                  <select>
                    <option>All Signals</option>
                    <option>Medium + High Only</option>
                    <option>High Confidence Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="card">
                <div className="card-title">Alert Notifications</div>
                <div className="config-row">
                  <span className="config-label">
                    {alertSound ? "🔔 Sound Alert" : "🔕 Sound Muted"}
                  </span>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <button className="btn btn-ghost" onClick={() => { playSignalAlert(); }}
                      style={{fontSize:10, padding:"4px 10px"}} title="Preview signal sound">
                      ▶ Preview
                    </button>
                    <button className={\`toggle \${alertSound?"on":""}\`} onClick={() => setAlertSound(v => !v)}/>
                  </div>
                </div>
                <div className="config-row">
                  <span className="config-label">📧 Email Alerts</span>
                  <button className={\`toggle \${alertEmail?"on":""}\`} onClick={() => setAlertEmail(v => !v)}/>
                </div>
                <div className="config-row">
                  <span className="config-label">📱 Push Notifications</span>
                  <button className={\`toggle \${alertPush?"on":""}\`} onClick={() => setAlertPush(v => !v)}/>
                </div>
                <div className="config-row">
                  <span className="config-label">Current ORB Window</span>
                  <span className="config-value">{orbWindow} min</span>
                </div>
                <div className="config-row">
                  <span className="config-label">Volume Threshold</span>
                  <span className="config-value">{volFilter}%</span>
                </div>
                <div className="config-row">
                  <span className="config-label">Max Risk Per Trade</span>
                  <span className="config-value" style={{color:"#facc15"}}>\${maxRisk.toLocaleString()}</span>
                </div>
                <button className="btn btn-primary" onClick={saveConfig} style={{marginTop:20, width:"100%"}}>
                  {saveFlash ? "✓ Saved!" : "Save Configuration"}
                </button>
                <button className="btn btn-ghost" onClick={resetConfig} style={{marginTop:8, width:"100%"}}>
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <nav className="footer-nav">
            <a href="#" onClick={e => { e.preventDefault(); setTab("learn"); window.scrollTo(0,0); }}>📖 How It Works</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("signals"); window.scrollTo(0,0); }}>⚡ Live Signals</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("futures"); fetchFutures(); window.scrollTo(0,0); }}>📈 Futures</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("tradelog"); fetchTradeLog(); window.scrollTo(0,0); }}>📋 Trade Log</a>
            <a href="#" onClick={e => { e.preventDefault(); setTab("configure"); window.scrollTo(0,0); }}>⚙️ Alert Config</a>
            <a href="#" onClick={e => { e.preventDefault(); showBrief(); }}>🌅 Morning Brief</a>
          </nav>
          <div className="footer-bottom">
            <div className="footer-copy">
              © {new Date().getFullYear()} <a href="https://ibcnet.com" target="_blank" rel="noopener noreferrer">IBCnet</a>. All rights reserved.
            </div>
            <div className="footer-version">
              <a href="https://github.com/ibcnet-com/orb-signal-app/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">
                v2.3.0
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="bottom-nav">
        {[
          { id: "learn",     icon: "📖", label: "How To" },
          { id: "signals",   icon: "⚡", label: "Signals" },
          { id: "futures",   icon: "📈", label: "Futures" },
          { id: "tradelog",  icon: "📋", label: "Log" },
          { id: "configure", icon: "⚙️", label: "Config" },
        ].map(t => (
          <button key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              setTab(t.id);
              if (t.id === "tradelog") { fetchTradeLog(); fetchYesterdayReport(); }
              if (t.id === "futures")  fetchFutures();
              window.scrollTo(0, 0);
            }}>
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
`
  },


];

// ─── Scaffold runner ──────────────────────────────────────────────────────────
async function scaffold() {
  console.log("\n🔧 ORBsignal Scaffold Script");
  console.log(`   Project root: ${ROOT}\n`);
  let created = 0, skipped = 0;

  for (const { file, content } of FILES) {
    const fullPath = path.join(ROOT, file);
    const dir      = path.dirname(fullPath);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log(`  📁 Created: ${path.relative(ROOT, dir)}/`); }
    if (fs.existsSync(fullPath)) {
      const answer = await ask(`  ⚠  ${file} already exists. Overwrite? (y/n): `);
      if (answer.trim().toLowerCase() !== "y") { console.log(`  ⏭  Skipped: ${file}`); skipped++; continue; }
    }
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`  ✅ Created: ${file}`);
    created++;
  }

  rl.close();
  console.log(`\n✨ Done! ${created} file(s) created, ${skipped} skipped.`);
  console.log("\n📋 Next steps:");
  console.log("  1. npm install");
  console.log("  2. npm run build");
  console.log("  3. git add . && git commit -m 'update from scaffold' && git push\n");
}

scaffold().catch(err => { console.error(err); process.exit(1); });
