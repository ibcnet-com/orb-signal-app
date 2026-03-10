/**
 * scaffold.js
 * ORBsignal Auto-Scaffold Script
 *
 * Run this from your project root:
 *   node scaffold.js
 *
 * It will create all files in the correct directories automatically.
 * Safe to re-run — prompts before overwriting existing files.
 */

import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

const ROOT = process.cwd();

// ─── File definitions ─────────────────────────────────────────────────────────
// Each entry: { file: relative path, content: file content }

const FILES = [

    // ── Broker interface ────────────────────────────────────────────────────────
    {
        file: "brokers/broker.interface.js",
        content: `/**
 * broker.interface.js
 * Standard interface all brokers must implement.
 * Adding a new broker = implement these 5 methods.
 */

export class BrokerInterface {
  constructor(config) {
    if (new.target === BrokerInterface) {
      throw new Error("BrokerInterface is abstract — use a concrete broker.");
    }
    this.config = config;
    this.name = "base";
  }

  async getAccount() { throw new Error(\`\${this.name}.getAccount() not implemented\`); }
  async getPositions() { throw new Error(\`\${this.name}.getPositions() not implemented\`); }
  async placeOrder(order) { throw new Error(\`\${this.name}.placeOrder() not implemented\`); }
  async getOrders(status = "all", limit = 20) { throw new Error(\`\${this.name}.getOrders() not implemented\`); }
  async cancelOrder(orderId) { throw new Error(\`\${this.name}.cancelOrder() not implemented\`); }
}
`
    },

    // ── Alpaca broker ───────────────────────────────────────────────────────────
    {
        file: "brokers/alpaca.js",
        content: `/**
 * brokers/alpaca.js
 * Full Alpaca implementation — supports paper and live trading.
 * Switch modes via ALPACA_MODE=paper|live in your .env file.
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
    this.headers = {
      "APCA-API-KEY-ID":     config.apiKey,
      "APCA-API-SECRET-KEY": config.apiSecret,
      "Content-Type":        "application/json",
    };
  }

  async #request(method, path, body = null) {
    const res = await fetch(\`\${this.baseURL}\${path}\`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(\`Alpaca \${method} \${path} → \${res.status}: \${JSON.stringify(json)}\`);
    return json;
  }

  async getAccount() {
    const a = await this.#request("GET", "/v2/account");
    return {
      broker:      this.name,
      mode:        this.mode,
      id:          a.id,
      equity:      parseFloat(a.equity),
      cash:        parseFloat(a.cash),
      buyingPower: parseFloat(a.buying_power),
      daytrader:   a.pattern_day_trader,
      status:      a.status,
    };
  }

  async getPositions() {
    const positions = await this.#request("GET", "/v2/positions");
    return positions.map(p => ({
      symbol:       p.symbol,
      qty:          parseFloat(p.qty),
      side:         parseFloat(p.qty) > 0 ? "long" : "short",
      entryPrice:   parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      pnl:          parseFloat(p.unrealized_pl),
      pnlPct:       parseFloat(p.unrealized_plpc) * 100,
    }));
  }

  async placeOrder({ symbol, qty, side, type = "market", tif = "day", limitPrice, stopPrice }) {
    const body = { symbol, qty: String(qty), side, type, time_in_force: tif };
    if (limitPrice) body.limit_price = String(limitPrice);
    if (stopPrice)  body.stop_price  = String(stopPrice);
    const order = await this.#request("POST", "/v2/orders", body);
    return {
      id:        order.id,
      symbol:    order.symbol,
      qty:       parseFloat(order.qty),
      side:      order.side,
      type:      order.type,
      status:    order.status,
      createdAt: order.created_at,
      filledAt:  order.filled_at,
      filledAvg: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
    };
  }

  async getOrders(status = "all", limit = 20) {
    const orders = await this.#request("GET", \`/v2/orders?status=\${status}&limit=\${limit}\`);
    return orders.map(o => ({
      id:        o.id,
      symbol:    o.symbol,
      qty:       parseFloat(o.qty),
      side:      o.side,
      type:      o.type,
      status:    o.status,
      createdAt: o.created_at,
      filledAt:  o.filled_at,
      filledAvg: o.filled_avg_price ? parseFloat(o.filled_avg_price) : null,
    }));
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
        content: `/**
 * brokers/schwab.js
 * Charles Schwab broker stub — ready for future implementation.
 * API docs: https://developer.schwab.com
 */

import { BrokerInterface } from "./broker.interface.js";

export class SchwabBroker extends BrokerInterface {
  constructor(config) { super(config); this.name = "Schwab"; }
  async getAccount()        { throw new Error("Schwab integration coming soon."); }
  async getPositions()      { throw new Error("Schwab integration coming soon."); }
  async placeOrder(order)   { throw new Error("Schwab integration coming soon."); }
  async getOrders(s, l)     { throw new Error("Schwab integration coming soon."); }
  async cancelOrder(id)     { throw new Error("Schwab integration coming soon."); }
}
`
    },

    // ── Fidelity stub ───────────────────────────────────────────────────────────
    {
        file: "brokers/fidelity.js",
        content: `/**
 * brokers/fidelity.js
 * Fidelity broker stub — ready for future implementation.
 * API docs: https://developer.fidelity.com
 */

import { BrokerInterface } from "./broker.interface.js";

export class FidelityBroker extends BrokerInterface {
  constructor(config) { super(config); this.name = "Fidelity"; }
  async getAccount()        { throw new Error("Fidelity integration coming soon."); }
  async getPositions()      { throw new Error("Fidelity integration coming soon."); }
  async placeOrder(order)   { throw new Error("Fidelity integration coming soon."); }
  async getOrders(s, l)     { throw new Error("Fidelity integration coming soon."); }
  async cancelOrder(id)     { throw new Error("Fidelity integration coming soon."); }
}
`
    },

    // ── Broker selector ─────────────────────────────────────────────────────────
    {
        file: "brokers/index.js",
        content: `/**
 * brokers/index.js
 * Broker selector — change BROKER in .env to switch providers.
 * Supported: "alpaca" | "schwab" | "fidelity"
 */

import { AlpacaBroker }   from "./alpaca.js";
import { SchwabBroker }   from "./schwab.js";
import { FidelityBroker } from "./fidelity.js";

const BROKER = process.env.BROKER || "alpaca";
const MODE   = process.env.ALPACA_MODE || "paper";

const configs = {
  alpaca:   { apiKey: process.env.ALPACA_API_KEY, apiSecret: process.env.ALPACA_API_SECRET, mode: MODE },
  schwab:   { apiKey: process.env.SCHWAB_API_KEY,  apiSecret: process.env.SCHWAB_API_SECRET },
  fidelity: { apiKey: process.env.FIDELITY_API_KEY, apiSecret: process.env.FIDELITY_API_SECRET },
};

const brokers = { alpaca: AlpacaBroker, schwab: SchwabBroker, fidelity: FidelityBroker };

if (!brokers[BROKER]) throw new Error(\`Unknown broker "\${BROKER}". Valid: \${Object.keys(brokers).join(", ")}\`);

export const broker      = new brokers[BROKER](configs[BROKER]);
export const BROKER_NAME = BROKER;
export const BROKER_MODE = MODE;
`
    },

    // ── server.js ───────────────────────────────────────────────────────────────
    {
        file: "server.js",
        content: `/**
 * ORBsignal - Yahoo Finance Proxy + Broker API Server
 * Run with: node server.js
 */

import express from "express";
import cors from "cors";
import { broker, BROKER_NAME, BROKER_MODE } from "./brokers/index.js";

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Yahoo Finance helpers ────────────────────────────────────────────────────
async function fetchCandles(ticker) {
  const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${ticker}?interval=1m&range=1d&includePrePost=false\`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
  if (!res.ok) throw new Error(\`Yahoo returned \${res.status} for \${ticker}\`);
  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(\`No data for \${ticker}\`);
  const timestamps = result.timestamp;
  const { open, high, low, close, volume } = result.indicators.quote[0];
  return timestamps.map((ts, i) => ({
    time: new Date(ts * 1000), open: open[i], high: high[i], low: low[i], close: close[i], volume: volume[i],
  })).filter(c => c.open !== null && c.close !== null);
}

function detectORB(candles, orbMinutes = 15, volFilterPct = 150) {
  if (!candles.length) return null;
  const marketOpen = new Date(candles[0].time); marketOpen.setSeconds(0, 0);
  const orbEnd     = new Date(marketOpen.getTime() + orbMinutes * 60 * 1000);
  const orbCandles = candles.filter(c => c.time <= orbEnd);
  const postOrb    = candles.filter(c => c.time > orbEnd);
  if (!orbCandles.length || !postOrb.length) return null;
  const orbHigh   = Math.max(...orbCandles.map(c => c.high));
  const orbLow    = Math.min(...orbCandles.map(c => c.low));
  const avgOrbVol = orbCandles.reduce((s, c) => s + c.volume, 0) / orbCandles.length;
  for (const candle of postOrb) {
    const volPct = Math.round((candle.volume / avgOrbVol) * 100);
    const conf   = volPct >= 200 ? "high" : volPct >= 120 ? "med" : "low";
    const time   = candle.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (candle.close > orbHigh && volPct >= volFilterPct) {
      return { dir: "long",  orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), price: +candle.close.toFixed(2), vol: \`+\${volPct}% avg\`, time, conf, reason: \`Closed above ORB high $\${orbHigh.toFixed(2)} with \${volPct}% of avg volume\` };
    }
    if (candle.close < orbLow && volPct >= volFilterPct) {
      return { dir: "short", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), price: +candle.close.toFixed(2), vol: \`+\${volPct}% avg\`, time, conf, reason: \`Closed below ORB low $\${orbLow.toFixed(2)} with \${volPct}% of avg volume\` };
    }
  }
  const latest = candles[candles.length - 1];
  return { dir: "none", orbHigh: +orbHigh.toFixed(2), orbLow: +orbLow.toFixed(2), price: +latest.close.toFixed(2), vol: "—", time: latest.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), conf: "low", reason: \`No breakout yet. Range: $\${orbLow.toFixed(2)} – $\${orbHigh.toFixed(2)}\` };
}

// ─── Market data routes ───────────────────────────────────────────────────────
app.get("/scan", async (req, res) => {
  const tickers   = (req.query.tickers || "SPY,QQQ").split(",").map(t => t.trim().toUpperCase());
  const orbWindow = parseInt(req.query.orbWindow) || 15;
  const volFilter = parseInt(req.query.volFilter) || 150;
  const results   = await Promise.allSettled(tickers.map(async ticker => {
    const candles = await fetchCandles(ticker);
    return { ticker, ...detectORB(candles, orbWindow, volFilter) };
  }));
  res.json({
    signals:     results.filter(r => r.status === "fulfilled" && r.value.dir !== "none").map((r, i) => ({ id: Date.now() + i, ...r.value })),
    noBreakout:  results.filter(r => r.status === "fulfilled" && r.value.dir === "none").map((r, i) => ({ id: Date.now() + 1000 + i, ...r.value })),
    errors:      results.filter(r => r.status === "rejected").map(r => r.reason?.message),
    scannedAt:   new Date().toISOString(),
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

// ─── Broker routes ────────────────────────────────────────────────────────────
app.get("/broker",    (req, res) => res.json({ broker: BROKER_NAME, mode: BROKER_MODE }));

app.get("/account", async (req, res) => {
  try { res.json({ account: await broker.getAccount() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/positions", async (req, res) => {
  try { res.json({ positions: await broker.getPositions() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/orders", async (req, res) => {
  try { res.json({ orders: await broker.getOrders(req.query.status || "all", req.query.limit || 20) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/trade", async (req, res) => {
  try {
    const { symbol, qty, side, type, tif, limitPrice, stopPrice } = req.body;
    if (!symbol || !qty || !side) return res.status(400).json({ error: "symbol, qty and side are required" });
    const order = await broker.placeOrder({ symbol, qty, side, type, tif, limitPrice, stopPrice });
    res.json({ order, broker: BROKER_NAME, mode: BROKER_MODE });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/order/:id", async (req, res) => {
  try { res.json(await broker.cancelOrder(req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(\`\\n✅ ORBsignal server running at http://localhost:\${PORT}\`);
  console.log(\`   Broker: \${BROKER_NAME} (\${BROKER_MODE} mode)\\n\`);
});
`
    },

    // ── .env.example ────────────────────────────────────────────────────────────
    {
        file: ".env.example",
        content: `# ── Broker Selection ─────────────────────────────────────────
# Options: "alpaca" | "schwab" | "fidelity"
BROKER=alpaca

# ── Alpaca ────────────────────────────────────────────────────
# Get keys at: https://app.alpaca.markets → API Keys
# Mode: "paper" = no real money | "live" = real trading
ALPACA_MODE=paper
ALPACA_API_KEY=your_alpaca_key_here
ALPACA_API_SECRET=your_alpaca_secret_here

# ── Schwab (future) ───────────────────────────────────────────
# SCHWAB_API_KEY=
# SCHWAB_API_SECRET=

# ── Fidelity (future) ─────────────────────────────────────────
# FIDELITY_API_KEY=
# FIDELITY_API_SECRET=
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
        const dir = path.dirname(fullPath);

        // Create directory if needed
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`  📁 Created directory: ${path.relative(ROOT, dir)}/`);
        }

        // Check if file exists
        if (fs.existsSync(fullPath)) {
            const answer = await ask(`  ⚠  ${file} already exists. Overwrite? (y/n): `);
            if (answer.trim().toLowerCase() !== "y") {
                console.log(`  ⏭  Skipped: ${file}`);
                skipped++;
                continue;
            }
        }

        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`  ✅ Created: ${file}`);
        created++;
    }

    rl.close();

    console.log(`\n✨ Done! ${created} file(s) created, ${skipped} skipped.`);
    console.log("\n📋 Next steps:");
    console.log("  1. Copy .env.example → .env and add your Alpaca keys");
    console.log("  2. Add ALPACA_API_KEY and ALPACA_API_SECRET to Railway Variables");
    console.log("  3. git add . && git commit -m 'add broker layer' && git push\n");
}

scaffold().catch(err => { console.error(err); process.exit(1); });
