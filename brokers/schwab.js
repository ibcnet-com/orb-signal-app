import { BrokerInterface } from "./broker.interface.js";
export class SchwabBroker extends BrokerInterface {
  constructor(config) { super(config); this.name = "Schwab"; }
  async getAccount()      { throw new Error("Schwab coming soon."); }
  async getPositions()    { throw new Error("Schwab coming soon."); }
  async placeOrder(o)     { throw new Error("Schwab coming soon."); }
  async getOrders(s,l)    { throw new Error("Schwab coming soon."); }
  async cancelOrder(id)   { throw new Error("Schwab coming soon."); }
}
