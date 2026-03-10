"""
paper_broker.py — Local paper trading engine backed by yfinance.

Usage:
    from paper_broker import PaperBroker

    broker = PaperBroker(starting_cash=100_000)
    broker.buy("AAPL", qty=10)
    broker.sell("AAPL", qty=5)
    print(broker.portfolio())
    print(broker.history())
"""

import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Literal, Optional

try:
    import yfinance as yf
except ImportError:
    raise ImportError("Run: pip install yfinance")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _get_price(ticker: str) -> float:
    """Fetch latest price via yfinance. Uses fast_info for speed."""
    t = yf.Ticker(ticker)
    try:
        price = t.fast_info["last_price"]
        if price and price > 0:
            return float(price)
    except Exception:
        pass
    # fallback: 1-day history
    hist = t.history(period="1d")
    if hist.empty:
        raise ValueError(f"Could not fetch price for {ticker!r}")
    return float(hist["Close"].iloc[-1])


# ---------------------------------------------------------------------------
# PaperBroker
# ---------------------------------------------------------------------------

class PaperBroker:
    """
    In-memory paper trading broker.

    Parameters
    ----------
    starting_cash : float
        Initial cash balance (default 1,000,000).
    state_file : str | None
        If given, state is persisted to/from this JSON file so it
        survives restarts.
    commission : float
        Flat commission per trade in dollars (default 0.0).
    """

    def __init__(
        self,
        starting_cash: float = 1_000_000.0,
        state_file: Optional[str] = "paper_broker_state.json",
        commission: float = 0.0,
    ):
        self.commission = commission
        self.state_file = Path(state_file) if state_file else None

        if self.state_file and self.state_file.exists():
            self._load()
        else:
            self.cash: float = starting_cash
            self.starting_cash: float = starting_cash
            # { ticker: {"qty": int, "avg_cost": float} }
            self.positions: dict = {}
            # list of order dicts
            self.orders: list = []
            # pending stop/limit orders
            self.pending_orders: list = []

    # ------------------------------------------------------------------
    # Core order execution
    # ------------------------------------------------------------------

    def _execute(
        self,
        action: Literal["buy", "sell"],
        ticker: str,
        qty: int,
        price: float,
        order_type: str = "market",
        order_id: Optional[str] = None,
    ) -> dict:
        ticker = ticker.upper()
        cost = price * qty + self.commission

        if action == "buy":
            if cost > self.cash:
                raise ValueError(
                    f"Insufficient cash: need ${cost:,.2f}, have ${self.cash:,.2f}"
                )
            self.cash -= cost
            pos = self.positions.get(ticker, {"qty": 0, "avg_cost": 0.0})
            total_qty = pos["qty"] + qty
            total_cost = pos["qty"] * pos["avg_cost"] + qty * price
            self.positions[ticker] = {
                "qty": total_qty,
                "avg_cost": total_cost / total_qty,
            }

        elif action == "sell":
            pos = self.positions.get(ticker)
            if not pos or pos["qty"] < qty:
                held = pos["qty"] if pos else 0
                raise ValueError(
                    f"Insufficient shares of {ticker}: need {qty}, have {held}"
                )
            self.cash += price * qty - self.commission
            new_qty = pos["qty"] - qty
            if new_qty == 0:
                del self.positions[ticker]
            else:
                self.positions[ticker]["qty"] = new_qty

        record = {
            "id": order_id or str(uuid.uuid4())[:8],
            "timestamp": _now(),
            "action": action,
            "ticker": ticker,
            "qty": qty,
            "price": price,
            "total": price * qty,
            "commission": self.commission,
            "type": order_type,
            "status": "filled",
        }
        self.orders.append(record)
        self._save()
        return record

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def buy(self, ticker: str, qty: int) -> dict:
        """Market buy `qty` shares of `ticker`."""
        if qty <= 0:
            raise ValueError("qty must be positive")
        price = _get_price(ticker)
        return self._execute("buy", ticker, qty, price, "market")

    def sell(self, ticker: str, qty: int) -> dict:
        """Market sell `qty` shares of `ticker`."""
        if qty <= 0:
            raise ValueError("qty must be positive")
        price = _get_price(ticker)
        return self._execute("sell", ticker, qty, price, "market")

    def place_limit_order(
        self, action: Literal["buy", "sell"], ticker: str, qty: int, limit_price: float
    ) -> dict:
        """Place a limit order. Checked on next call to check_pending_orders()."""
        ticker = ticker.upper()
        order = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": _now(),
            "action": action,
            "ticker": ticker,
            "qty": qty,
            "limit_price": limit_price,
            "stop_price": None,
            "type": "limit",
            "status": "pending",
        }
        self.pending_orders.append(order)
        self._save()
        return order

    def place_stop_order(
        self, action: Literal["buy", "sell"], ticker: str, qty: int, stop_price: float
    ) -> dict:
        """Place a stop order. Triggered when price crosses stop_price."""
        ticker = ticker.upper()
        order = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": _now(),
            "action": action,
            "ticker": ticker,
            "qty": qty,
            "limit_price": None,
            "stop_price": stop_price,
            "type": "stop",
            "status": "pending",
        }
        self.pending_orders.append(order)
        self._save()
        return order

    def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending order by ID. Returns True if found and cancelled."""
        for o in self.pending_orders:
            if o["id"] == order_id and o["status"] == "pending":
                o["status"] = "cancelled"
                self.pending_orders = [
                    x for x in self.pending_orders if x["status"] == "pending"
                ]
                # Archive cancelled order in history
                o["timestamp_cancelled"] = _now()
                self.orders.append(o)
                self._save()
                return True
        return False

    def check_pending_orders(self) -> list[dict]:
        """
        Fetch current prices and fill any triggered pending orders.
        Returns list of newly filled orders.
        Call this periodically (e.g. in a loop or scheduler).
        """
        if not self.pending_orders:
            return []

        # Batch fetch unique tickers
        tickers = list({o["ticker"] for o in self.pending_orders})
        prices = {}
        for t in tickers:
            try:
                prices[t] = _get_price(t)
            except Exception:
                pass

        filled = []
        remaining = []
        for order in self.pending_orders:
            ticker = order["ticker"]
            price = prices.get(ticker)
            if price is None:
                remaining.append(order)
                continue

            triggered = False
            fill_price = price

            if order["type"] == "limit":
                lp = order["limit_price"]
                if order["action"] == "buy" and price <= lp:
                    triggered, fill_price = True, lp
                elif order["action"] == "sell" and price >= lp:
                    triggered, fill_price = True, lp

            elif order["type"] == "stop":
                sp = order["stop_price"]
                if order["action"] == "sell" and price <= sp:
                    triggered, fill_price = True, sp
                elif order["action"] == "buy" and price >= sp:
                    triggered, fill_price = True, sp

            if triggered:
                try:
                    record = self._execute(
                        order["action"],
                        ticker,
                        order["qty"],
                        fill_price,
                        order["type"],
                        order_id=order["id"],
                    )
                    filled.append(record)
                except ValueError as e:
                    order["status"] = "rejected"
                    order["reject_reason"] = str(e)
                    self.orders.append(order)
            else:
                remaining.append(order)

        self.pending_orders = remaining
        self._save()
        return filled

    # ------------------------------------------------------------------
    # Portfolio & reporting
    # ------------------------------------------------------------------

    def get_prices(self) -> dict[str, float]:
        """Return current market prices for all held positions."""
        prices = {}
        for ticker in self.positions:
            try:
                prices[ticker] = _get_price(ticker)
            except Exception:
                prices[ticker] = self.positions[ticker]["avg_cost"]
        return prices

    def portfolio(self) -> dict:
        """Return a full portfolio snapshot."""
        prices = self.get_prices()
        positions_detail = []
        market_value = 0.0

        for ticker, pos in self.positions.items():
            price = prices.get(ticker, pos["avg_cost"])
            mv = price * pos["qty"]
            cost_basis = pos["avg_cost"] * pos["qty"]
            pnl = mv - cost_basis
            pnl_pct = (pnl / cost_basis * 100) if cost_basis else 0
            market_value += mv
            positions_detail.append(
                {
                    "ticker": ticker,
                    "qty": pos["qty"],
                    "avg_cost": round(pos["avg_cost"], 4),
                    "current_price": round(price, 4),
                    "market_value": round(mv, 2),
                    "cost_basis": round(cost_basis, 2),
                    "unrealized_pnl": round(pnl, 2),
                    "unrealized_pnl_pct": round(pnl_pct, 2),
                }
            )

        total_equity = self.cash + market_value
        total_pnl = total_equity - self.starting_cash
        total_pnl_pct = (total_pnl / self.starting_cash * 100) if self.starting_cash else 0

        return {
            "cash": round(self.cash, 2),
            "market_value": round(market_value, 2),
            "total_equity": round(total_equity, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_pct": round(total_pnl_pct, 2),
            "positions": positions_detail,
            "pending_orders": len(self.pending_orders),
        }

    def history(self, ticker: Optional[str] = None) -> list[dict]:
        """Return order history, optionally filtered by ticker."""
        if ticker:
            return [o for o in self.orders if o.get("ticker") == ticker.upper()]
        return list(self.orders)

    def pending(self) -> list[dict]:
        """Return all pending orders."""
        return list(self.pending_orders)

    def reset(self, starting_cash: Optional[float] = None) -> None:
        """Reset broker to initial state."""
        cash = starting_cash or self.starting_cash
        self.cash = cash
        self.starting_cash = cash
        self.positions = {}
        self.orders = []
        self.pending_orders = []
        self._save()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _save(self):
        if not self.state_file:
            return
        state = {
            "cash": self.cash,
            "starting_cash": self.starting_cash,
            "positions": self.positions,
            "orders": self.orders,
            "pending_orders": self.pending_orders,
        }
        self.state_file.write_text(json.dumps(state, indent=2))

    def _load(self):
        state = json.loads(self.state_file.read_text())
        self.cash = state["cash"]
        self.starting_cash = state["starting_cash"]
        self.positions = state["positions"]
        self.orders = state["orders"]
        self.pending_orders = state.get("pending_orders", [])

    def __repr__(self):
        p = self.portfolio()
        return (
            f"PaperBroker(equity=${p['total_equity']:,.2f}, "
            f"cash=${p['cash']:,.2f}, "
            f"positions={len(self.positions)}, "
            f"pnl={p['total_pnl_pct']:+.2f}%)"
        )
