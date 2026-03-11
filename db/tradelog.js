/**
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
    db.exec(`
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
    `);
    console.log(`✅ Trade log DB ready at ${dbPath}`);
  } catch (e) {
    console.warn(`⚠ SQLite unavailable (${e.message}) — using in-memory log`);
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
  const stmt = db.prepare(`
    INSERT INTO trades (ticker, dir, entry_price, stop_price, target_price, qty, outcome, confidence, volume, reason, orb_high, orb_low, logged_at)
    VALUES (@ticker, @dir, @entry_price, @stop_price, @target_price, @qty, 'open', @confidence, @volume, @reason, @orb_high, @orb_low, @logged_at)
  `);
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
  return [headers.join(","), ...rows].join("\n");
}

await init();
export { logTrade, closeTrade, getTrades, getStats, toCSV };
