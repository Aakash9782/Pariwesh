import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Cart Selection Cleanup Logic", () => {
  // Test helper simulating client-side removePurchasedItems reducer
  const removePurchasedItems = (cartItems, purchasedItems) => {
    // Return a fresh copy of cartItems after removing purchased quantities
    const stateItems = JSON.parse(JSON.stringify(cartItems));
    purchasedItems.forEach((purchased) => {
      const pId = purchased.productId;
      const pSize = purchased.size;
      const pColor = purchased.color;
      const itemIndex = stateItems.findIndex(
        (item) =>
          (item.product._id || item.product) === pId &&
          item.variant.color === pColor &&
          item.variant.size === pSize,
      );
      if (itemIndex > -1) {
        const remainingQty =
          stateItems[itemIndex].quantity - purchased.quantity;
        if (remainingQty <= 0) {
          stateItems.splice(itemIndex, 1);
        } else {
          stateItems[itemIndex].quantity = remainingQty;
        }
      }
    });
    return stateItems;
  };

  it("should decrement quantity correctly for partial purchases of the same item", () => {
    const initialCart = [
      {
        product: { _id: "prod-A", name: "Dress A" },
        quantity: 3,
        variant: { size: "M", color: "Red" },
      },
      {
        product: { _id: "prod-B", name: "Dress B" },
        quantity: 2,
        variant: { size: "L", color: "Blue" },
      },
    ];

    const purchased = [
      {
        productId: "prod-A",
        size: "M",
        color: "Red",
        quantity: 1,
      },
    ];

    const finalCart = removePurchasedItems(initialCart, purchased);

    assert.equal(finalCart.length, 2);
    assert.equal(finalCart[0].product._id, "prod-A");
    assert.equal(
      finalCart[0].quantity,
      2,
      "Partial quantity should decrement from 3 to 2",
    );
    assert.equal(finalCart[1].product._id, "prod-B");
    assert.equal(
      finalCart[1].quantity,
      2,
      "Unselected item should remain untouched",
    );
  });

  it("should completely remove item from cart when purchased quantity meets or exceeds cart quantity", () => {
    const initialCart = [
      {
        product: { _id: "prod-A", name: "Dress A" },
        quantity: 3,
        variant: { size: "M", color: "Red" },
      },
    ];

    const purchased = [
      {
        productId: "prod-A",
        size: "M",
        color: "Red",
        quantity: 3,
      },
    ];

    const finalCart = removePurchasedItems(initialCart, purchased);
    assert.equal(finalCart.length, 0, "Item should be removed completely");
  });

  it("should preserve variant identities and separate size combinations", () => {
    const initialCart = [
      {
        product: { _id: "prod-A", name: "Dress A" },
        quantity: 2,
        variant: { size: "M", color: "Red" },
      },
      {
        product: { _id: "prod-A", name: "Dress A" },
        quantity: 2,
        variant: { size: "L", color: "Red" },
      },
    ];

    const purchased = [
      {
        productId: "prod-A",
        size: "M",
        color: "Red",
        quantity: 2,
      },
    ];

    const finalCart = removePurchasedItems(initialCart, purchased);
    assert.equal(finalCart.length, 1);
    assert.equal(
      finalCart[0].variant.size,
      "L",
      "Size L should be preserved since only M was purchased",
    );
    assert.equal(finalCart[0].quantity, 2);
  });
});
