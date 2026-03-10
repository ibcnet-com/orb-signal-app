/**
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
