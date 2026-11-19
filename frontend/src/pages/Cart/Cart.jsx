
import { Link } from 'react-router';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = () => {
  const {
    cartItems,
    cartSubtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const formatPrice = (amount) =>
    Number(amount).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });

  if (cartItems.length === 0) {
    return (
      <section className="cart-page">
        <div className="cart-empty">
          <ShoppingCart size={64} strokeWidth={1.5} />

          <h1>Your Cart Is Empty</h1>
          <p>Looks like you haven't added anything yet.</p>

          <Link to="/collections" className="cart-shop-btn">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1 className="cart-title">Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map((item) => (
            <article
              key={item.variantId}
              className="cart-item"
            >
              <Link to={`/products/${item.productId}`}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />
                ) : (
                  <div className="cart-image-placeholder">
                    No image
                  </div>
                )}
              </Link>

              <div className="cart-item-details">
                <Link
                  to={`/products/${item.productId}`}
                  className="cart-item-name"
                >
                  {item.name}
                </Link>

                <p>Color: {item.colour || 'N/A'}</p>
                <p>Size: {item.size || 'N/A'}</p>

                <p className="cart-item-price">
                  {formatPrice(item.price)}
                </p>

                <div className="cart-item-actions">
                  <div className="cart-quantity">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() =>
                        updateQuantity(
                          item.variantId,
                          item.quantity - 1
                        )
                      }
                    >
                      <Minus size={16} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                        }
                        disabled={
                            !Number.isFinite(Number(item.stock)) ||
                            Number(item.stock) <= 0 ||
                            item.quantity >= Number(item.stock)
                        }
                        title={
                            item.quantity >= Number(item.stock)
                            ? 'Maximum available stock reached'
                            : 'Increase quantity'
                        }
                        >
                        <Plus size={16} />
                        </button>
                  </div>

                  <button
                    type="button"
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(item.variantId)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={18} />
                    Remove
                  </button>
                </div>
              </div>

              <div className="cart-item-total">
                {formatPrice(
                  Number(item.price) * item.quantity
                )}
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cartSubtotal)}</span>
          </div>

          <div className="cart-summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="cart-summary-total">
            <span>Subtotal</span>
            <strong>{formatPrice(cartSubtotal)}</strong>
          </div>

          <p className="cart-summary-note">
            Final prices, stock availability, and shipping
            will be confirmed at checkout.
          </p>

          <Link
            to="/checkout"
            className="cart-checkout-btn"
          >
            Proceed to Checkout
          </Link>

          <Link
            to="/collections"
            className="cart-continue-link"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
};

export default Cart;
