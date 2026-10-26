const cartLines = document.querySelector(".cart-lines");
const cartEmpty = document.querySelector(".cart-empty");
const cartError = document.querySelector(".cart-error");
const clearCartButton = document.querySelector(".clear-cart");
const checkoutLink = document.querySelector(".checkout-link");
const checkoutForm = document.querySelector(".checkout-form");
const checkoutFeedback = document.querySelector(".checkout-feedback");
const placeOrderButton = document.querySelector(".place-order");
const submitLabel = placeOrderButton.textContent;
let submitTimer;

function createCartLine(item) {
  const line = document.createElement("article");
  line.className = "cart-line";

  const image = document.createElement("img");
  image.className = "cart-line__image";
  image.src = item.image;
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.classList.add("cart-line__image--unavailable");
    image.removeAttribute("src");
  }, { once: true });

  const details = document.createElement("div");
  details.className = "cart-line__details";

  const name = document.createElement("h3");
  name.textContent = item.name;
  const unitPrice = document.createElement("p");
  unitPrice.className = "cart-line__unit-price";
  unitPrice.textContent = `${MegaMartCart.formatCurrency(item.unitPrice)} each`;

  const actions = document.createElement("div");
  actions.className = "cart-line__actions";
  actions.setAttribute("aria-label", `Quantity for ${item.name}`);
  actions.append(
    createActionButton("decrease", item.id, `Decrease ${item.name} quantity`, "−"),
    createQuantity(item.quantity, item.name),
    createActionButton("increase", item.id, `Increase ${item.name} quantity`, "+"),
    createActionButton("remove", item.id, `Remove ${item.name} from cart`, "Remove")
  );

  const lineTotal = document.createElement("strong");
  lineTotal.className = "cart-line__total";
  lineTotal.textContent = MegaMartCart.formatCurrency(item.unitPrice * item.quantity);

  details.append(name, unitPrice, actions);
  line.append(image, details, lineTotal);
  return line;
}

function createActionButton(action, id, label, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = action === "remove" ? "cart-line__remove" : "quantity-button";
  button.dataset.action = action;
  button.dataset.id = id;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function createQuantity(quantity, name) {
  const output = document.createElement("span");
  output.className = "quantity-value";
  output.setAttribute("aria-label", `Quantity: ${quantity}`);
  output.textContent = String(quantity);
  output.dataset.productName = name;
  return output;
}

function renderCart() {
  try {
    const items = MegaMartCart.read();
    const count = MegaMartCart.count(items);
    const subtotal = MegaMartCart.subtotal(items);

    cartLines.replaceChildren(...items.map(createCartLine));
    cartLines.hidden = items.length === 0;
    cartEmpty.hidden = items.length > 0;
    clearCartButton.hidden = items.length === 0;
    checkoutLink.setAttribute("aria-disabled", String(items.length === 0));
    checkoutLink.classList.toggle("is-disabled", items.length === 0);
    checkoutLink.tabIndex = items.length === 0 ? -1 : 0;
    placeOrderButton.disabled = items.length === 0;
    document.querySelector(".checkout-cart-count").textContent = String(count);
    document.querySelector(".summary-subtotal").textContent = MegaMartCart.formatCurrency(subtotal);
    document.querySelector(".summary-total__amount").textContent = MegaMartCart.formatCurrency(subtotal);
    cartError.hidden = true;
    cartError.textContent = "";
  } catch (error) {
    cartLines.replaceChildren();
    cartLines.hidden = true;
    cartEmpty.hidden = true;
    clearCartButton.hidden = true;
    checkoutLink.setAttribute("aria-disabled", "true");
    checkoutLink.classList.add("is-disabled");
    checkoutLink.tabIndex = -1;
    placeOrderButton.disabled = true;
    cartError.textContent = error.message;
    cartError.hidden = false;
  }
}

cartLines.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  try {
    if (button.dataset.action === "remove") {
      MegaMartCart.remove(button.dataset.id);
    } else {
      const items = MegaMartCart.read();
      const item = items.find((entry) => entry.id === button.dataset.id);
      if (!item) throw new Error("That item is no longer in your cart.");
      const nextQuantity = item.quantity + (button.dataset.action === "increase" ? 1 : -1);
      if (nextQuantity < 1) {
        MegaMartCart.remove(button.dataset.id);
      } else {
        MegaMartCart.setQuantity(button.dataset.id, nextQuantity);
      }
    }
    renderCart();
  } catch (error) {
    cartError.textContent = error.message;
    cartError.hidden = false;
  }
});

clearCartButton.addEventListener("click", () => {
  try {
    MegaMartCart.clear();
    checkoutFeedback.hidden = true;
    renderCart();
  } catch (error) {
    cartError.textContent = error.message;
    cartError.hidden = false;
  }
});

checkoutLink.addEventListener("click", (event) => {
  if (checkoutLink.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    cartEmpty.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  try {
    if (MegaMartCart.read().length === 0) {
      event.preventDefault();
      renderCart();
    }
  } catch (error) {
    event.preventDefault();
    renderCart();
  }
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  checkoutFeedback.hidden = true;

  let items;
  try {
    items = MegaMartCart.read();
  } catch (error) {
    checkoutFeedback.textContent = error.message;
    checkoutFeedback.hidden = false;
    renderCart();
    return;
  }

  if (items.length === 0) {
    renderCart();
    checkoutFeedback.textContent = "Add an item to your cart before continuing.";
    checkoutFeedback.hidden = false;
    return;
  }

  if (!checkoutForm.reportValidity()) return;

  placeOrderButton.disabled = true;
  placeOrderButton.textContent = "Preparing demo checkout…";
  checkoutFeedback.textContent = "Validating your delivery details…";
  checkoutFeedback.hidden = false;
  window.clearTimeout(submitTimer);
  submitTimer = window.setTimeout(() => {
    placeOrderButton.disabled = false;
    placeOrderButton.textContent = submitLabel;
    checkoutFeedback.textContent = "Demo only: no order was submitted or confirmed, and no payment was taken. Your cart has been kept. A backend must be connected before real orders can be accepted.";
  }, 700);
});

window.addEventListener("storage", (event) => {
  if (event.key === "megamart-cart") renderCart();
});

renderCart();
