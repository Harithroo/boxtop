// Which ready-made boxes to suggest next to the builder's budget slider.
// Kept on its own so the rule is easy to find and change: it is a selling decision, not plumbing.

export type PricedBox = { id: number; name: string; price: number | null };

/**
 * Boxes we have already packed that sit close to what the customer wants to spend.
 * The builder shows them under the slider as "Boxes we've packed near this price", closest first;
 * tapping one loads it into the builder. An empty list shows "No packed boxes this close to your budget yet."
 *
 * @param budget the slider value in rupees (2,500 to 15,000 in steps of 500)
 * @param boxes  every box on the home shelves; price is null for "ask for price" boxes
 */
export function nearBudget<T extends PricedBox>(budget: number, boxes: T[]): T[] {
  // TODO(human): choose which boxes count as "near" this budget, and in what order.
  void budget; void boxes;
  return [];
}
