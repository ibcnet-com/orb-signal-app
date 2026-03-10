/**
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
