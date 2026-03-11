/**
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
    const res  = await fetch(`${this.baseURL}${path}`, { method, headers: this.headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(`Alpaca ${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
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
    const orders = await this.#request("GET", `/v2/orders?status=${status}&limit=${limit}`);
    return orders.map(o => ({ id: o.id, symbol: o.symbol, qty: parseFloat(o.qty), side: o.side, type: o.type, status: o.status, createdAt: o.created_at, filledAt: o.filled_at, filledAvg: o.filled_avg_price ? parseFloat(o.filled_avg_price) : null }));
  }
  async cancelOrder(orderId) {
    await this.#request("DELETE", `/v2/orders/${orderId}`);
    return { cancelled: true, orderId };
  }
}
