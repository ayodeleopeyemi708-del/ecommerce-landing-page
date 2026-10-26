(() => {
  const storageKey = "megamart-cart";
  const quantityLimit = 99;

  function read() {
    const savedCart = localStorage.getItem(storageKey);
    if (!savedCart) return [];

    let items;
    try {
      items = JSON.parse(savedCart);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Your saved cart could not be read. Clear the browser's saved MegaMart cart to continue.");
      }
      throw error;
    }

    if (!Array.isArray(items)) {
      throw new Error("Your saved cart has an invalid format. Clear the browser's saved MegaMart cart to continue.");
    }

    return items.filter((item) =>
      item
      && typeof item.id === "string"
      && typeof item.name === "string"
      && Number.isSafeInteger(item.unitPrice)
      && item.unitPrice > 0
      && Number.isInteger(item.quantity)
      && item.quantity > 0
      && item.quantity <= quantityLimit
      && typeof item.image === "string"
      && item.image.startsWith("images/")
    );
  }

  function write(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function add(product) {
    const items = read();
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= quantityLimit) {
        throw new Error(`You can add up to ${quantityLimit} of this item.`);
      }
      existingItem.quantity += 1;
    } else {
      items.push({ ...product, quantity: 1 });
    }

    write(items);
    return items;
  }

  function setQuantity(id, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > quantityLimit) {
      throw new Error(`Quantity must be between 1 and ${quantityLimit}.`);
    }

    const items = read();
    const item = items.find((entry) => entry.id === id);
    if (!item) throw new Error("That item is no longer in your cart.");
    item.quantity = quantity;
    write(items);
    return items;
  }

  function remove(id) {
    const items = read().filter((item) => item.id !== id);
    write(items);
    return items;
  }

  function clear() {
    localStorage.removeItem(storageKey);
  }

  function count(items = read()) {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  function subtotal(items = read()) {
    return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "uSD",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  window.MegaMartCart = Object.freeze({
    add,
    clear,
    count,
    formatCurrency,
    read,
    remove,
    setQuantity,
    subtotal,
  });
})();
