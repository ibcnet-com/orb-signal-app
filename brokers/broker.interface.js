/**
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

  async getAccount() { throw new Error(`${this.name}.getAccount() not implemented`); }
  async getPositions() { throw new Error(`${this.name}.getPositions() not implemented`); }
  async placeOrder(order) { throw new Error(`${this.name}.placeOrder() not implemented`); }
  async getOrders(status = "all", limit = 20) { throw new Error(`${this.name}.getOrders() not implemented`); }
  async cancelOrder(orderId) { throw new Error(`${this.name}.cancelOrder() not implemented`); }
}
