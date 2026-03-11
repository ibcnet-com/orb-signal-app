import { BrokerInterface } from "./broker.interface.js";
export class FidelityBroker extends BrokerInterface {
  constructor(config) { super(config); this.name = "Fidelity"; }
  async getAccount()      { throw new Error("Fidelity coming soon."); }
  async getPositions()    { throw new Error("Fidelity coming soon."); }
  async placeOrder(o)     { throw new Error("Fidelity coming soon."); }
  async getOrders(s,l)    { throw new Error("Fidelity coming soon."); }
  async cancelOrder(id)   { throw new Error("Fidelity coming soon."); }
}
