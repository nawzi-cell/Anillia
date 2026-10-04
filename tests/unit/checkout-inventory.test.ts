/**
 * Unit tests for checkInventory in ../../lib/orders/checkout
 * (checkout inventory guard owned by the backend engineer)
 *
 * Contract:
 *   checkInventory(
 *     items: Array<{ sku: string; quantity: number; available: number }>
 *   ): Array<{ sku: string; requested: number; available: number }>
 *
 * Returns one problem per line that cannot be fulfilled; an empty array
 * means everything is in stock.
 */
import { describe, it, expect } from "vitest";
import { checkInventory } from "../../lib/orders/checkout";

describe("checkInventory", () => {
  it("returns no problems when stock is sufficient", () => {
    const problems = checkInventory([
      { sku: "AMD-CGH-IVO-OS", quantity: 2, available: 60 },
      { sku: "AMD-JUS-BLA-OS", quantity: 1, available: 100 },
    ]);
    expect(problems).toEqual([]);
  });

  it("returns no problems when stock exactly covers the request", () => {
    const problems = checkInventory([
      { sku: "AMD-CGH-BLA-OS", quantity: 4, available: 4 },
    ]);
    expect(problems).toEqual([]);
  });

  it("reports sku, requested and available when stock is short", () => {
    const problems = checkInventory([
      { sku: "AMD-CGH-BLA-OS", quantity: 6, available: 4 },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toEqual({
      sku: "AMD-CGH-BLA-OS",
      requested: 6,
      available: 4,
    });
  });

  it("treats zero availability as a problem", () => {
    const problems = checkInventory([
      { sku: "AMD-NOPE-OS", quantity: 1, available: 0 },
    ]);
    expect(problems).toEqual([
      { sku: "AMD-NOPE-OS", requested: 1, available: 0 },
    ]);
  });

  it("reports multiple problems", () => {
    const problems = checkInventory([
      { sku: "AMD-CGH-BLA-OS", quantity: 6, available: 4 },
      { sku: "AMD-JUS-BLA-OS", quantity: 1, available: 100 },
      { sku: "AMD-PMB-TAU-OS", quantity: 40, available: 30 },
    ]);
    expect(problems).toHaveLength(2);
    expect(problems).toContainEqual({
      sku: "AMD-CGH-BLA-OS",
      requested: 6,
      available: 4,
    });
    expect(problems).toContainEqual({
      sku: "AMD-PMB-TAU-OS",
      requested: 40,
      available: 30,
    });
  });

  it("returns no problems for an empty request", () => {
    expect(checkInventory([])).toEqual([]);
  });
});
