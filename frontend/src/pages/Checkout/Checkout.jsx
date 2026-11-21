import { Link } from 'react-router';
import {
  ShoppingCart,
  LockKeyhole,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';


import {
  getCheckoutAttempt,
  clearCheckoutAttempt,
} from '../../utils/checkoutIdempotency';

import './Checkout.css';

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  pincode: '',
};

const Checkout = () => {
  const { user } = useAuth();
  const {
    cartItems,
    cartSubtotal,
    clearCart,
  } = useCart();

  const [formData, setFormData] = useState(initialFormData);


useEffect(() => {
  if (!user) return;

  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  setFormData((previous) => ({
    ...previous,
    fullName: previous.fullName || fullName,
    email: previous.email || user.email || '',
  }));
}, [user]);


  const [errors, setErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

 const [pendingOrder, setPendingOrder] = useState(() => {
  try {
    const saved = sessionStorage.getItem(
      'jl_confirmed_cod_order'
    );

    const confirmed = saved ? JSON.parse(saved) : null;

    if (
      !confirmed?.order_id ||
      !confirmed?.idempotency_key
    ) {
      return null;
    }

    const attempt = JSON.parse(
      sessionStorage.getItem('jl_checkout_attempt') ||
        'null'
    );

    if (attempt?.key !== confirmed.idempotency_key) {
      return null;
    }

    // A non-empty cart indicates the customer has
    // started shopping again.
    const savedCart = JSON.parse(
      localStorage.getItem('jl_fashions_cart') || '[]'
    );

    if (Array.isArray(savedCart) && savedCart.length > 0) {
      return null;
    }

    return confirmed;
  } catch {
    return null;
  }
});

useEffect(() => {
  if (cartItems.length === 0 || pendingOrder) {
    return;
  }

  const savedConfirmation = sessionStorage.getItem(
    'jl_confirmed_cod_order'
  );

  if (!savedConfirmation) {
    return;
  }

  try {
    const confirmed = JSON.parse(savedConfirmation);

    const attempt = JSON.parse(
      sessionStorage.getItem('jl_checkout_attempt') ||
        'null'
    );

    if (
      confirmed?.idempotency_key &&
      attempt?.key === confirmed.idempotency_key
    ) {
      clearCheckoutAttempt();
    }
  } catch {
    // Ignore invalid stored confirmation data.
  }

  sessionStorage.removeItem('jl_confirmed_cod_order');
}, [cartItems, pendingOrder]);

  // Format currency in Indian Rupees
  const formatPrice = (amount) =>
    Number(amount).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
      submit: '',
    }));
  };

  // Validate checkout form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Please enter your street address.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Please enter your city.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Please enter your state.';
    }

    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit PIN code.';
    }

    if (cartItems.length === 0) {
      newErrors.submit = 'Your shopping cart is empty.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit COD order to Django
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      isSubmitting ||
      pendingOrder ||
      !validateForm()
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        apartment: formData.apartment.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),

        items: cartItems.map((item) => ({
          variant_id: Number(item.variantId),
          quantity: Number(item.quantity),
        })),
      };

      // Reuse the UUID when retrying the same checkout
      payload.idempotency_key = getCheckoutAttempt(payload);


    // Step 1: Initialize Django's CSRF cookie.
const csrfResponse = await fetch('/api/accounts/csrf/', {
  credentials: 'include',
});

if (!csrfResponse.ok) {
  throw new Error('Unable to initialize checkout security.');
}

// Step 2: Read the CSRF token.
const csrfToken = document.cookie
  .split('; ')
  .find((cookie) => cookie.startsWith('csrftoken='))
  ?.split('=')[1];

if (!csrfToken) {
  throw new Error('Checkout security token was not found.');
}

// Step 3: Submit the COD order.
const response = await fetch('/api/orders/checkout/', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': decodeURIComponent(csrfToken),
  },
  body: JSON.stringify(payload),
});


      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error ||
          Object.entries(data)
            .map(([field, messages]) => {
              const text = Array.isArray(messages)
                ? messages.join(', ')
                : typeof messages === 'object'
                  ? JSON.stringify(messages)
                  : String(messages);

              return `${field}: ${text}`;
            })
            .join(' | ') ||
          'Unable to place your order.';

        throw new Error(errorMessage);
      }

      // Store confirmation with its checkout UUID
      const confirmedOrder = {
        ...data,
        idempotency_key: payload.idempotency_key,
      };

      sessionStorage.setItem(
          'jl_confirmed_cod_order',
          JSON.stringify(confirmedOrder)
        );

        // Clear the cart only after Django confirms the order.
        clearCart();

        // Display the order confirmation screen.
        setPendingOrder(confirmedOrder);

        console.log('COD order confirmed:', confirmedOrder);

    } catch (error) {
      console.error('Checkout error:', error);

      setErrors({
        submit:
          error.message ||
          'Something went wrong. Please try again.',
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  // Start a completely new shopping order
  const handleStartNewOrder = () => {
  clearCheckoutAttempt();

  sessionStorage.removeItem(
    'jl_confirmed_cod_order'
  );

  setPendingOrder(null);
  setErrors({});
  setFormData({ ...initialFormData });
};
  // ==========================================
// 2. EMPTY CART SCREEN
// ==========================================

if (pendingOrder) {
  return (
    <section className="checkout-page">
      <div className="checkout-order-success">

        <div className="checkout-success-icon">
          <CheckCircle2 size={42} strokeWidth={1.5} />
        </div>

        <p className="checkout-success-eyebrow">
          J&L FASHIONS
        </p>

        <h1>Order Confirmed</h1>

        <p className="checkout-success-message">
          Thank you for shopping with J&L Fashions.
          Your order has been successfully placed.
        </p>

        <div className="checkout-success-order-number">
          <span>YOUR ORDER NUMBER</span>

          <strong>
            #{pendingOrder.order_id}
          </strong>
        </div>

        <div className="checkout-success-details">

          <div className="checkout-success-detail">
            <div className="checkout-success-detail-icon">
              <PackageCheck size={20} />
            </div>

            <div>
              <span>Order Status</span>
              <strong>
                {pendingOrder.status || 'Confirmed'}
              </strong>
            </div>
          </div>

          <div className="checkout-success-detail">
            <div className="checkout-success-detail-icon">
              <CreditCard size={20} />
            </div>

            <div>
              <span>Payment Method</span>
              <strong>Cash on Delivery</strong>
            </div>
          </div>

          <div className="checkout-success-detail">
            <div className="checkout-success-detail-icon">
              <LockKeyhole size={20} />
            </div>

            <div>
              <span>Payment Status</span>
              <strong>Pending</strong>
            </div>
          </div>

        </div>

        <div className="checkout-success-total">
          <span>Order Total</span>

          <strong>
            {formatPrice(pendingOrder.total_amount)}
          </strong>
        </div>

        <p className="checkout-success-reminder">
          Please keep the payment ready when your
          order is delivered.
        </p>

        <div className="checkout-success-actions">

          <Link
            to={`/my-orders/${pendingOrder.order_id}`}
            className="checkout-button checkout-view-order"
          >
            View Order
            <ArrowRight size={17} />
          </Link>

          <button
            type="button"
            className="checkout-button checkout-new-order"
            onClick={handleStartNewOrder}
          >
            <ShoppingBag size={17} />
            Start New Order
          </button>

        </div>

        <Link
          to="/collections"
          className="checkout-success-shopping-link"
        >
          Continue Browsing Collections
        </Link>

      </div>
    </section>
  );
}


  // ==========================================
  // 2. EMPTY CART SCREEN
  // ==========================================

  if (cartItems.length === 0) {
    return (
      <section className="checkout-page">
        <div className="checkout-empty">
          <ShoppingCart
            size={56}
            strokeWidth={1.5}
          />

          <h1>Your cart is empty</h1>

          <p>
            Add some products before proceeding
            to checkout.
          </p>

          <Link
            to="/collections"
            className="checkout-button"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <h1 className="checkout-title">
        Checkout
      </h1>

      <div className="checkout-layout">

        {/* CUSTOMER DETAILS */}

        <form
          id="checkout-form"
          className="checkout-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2>Contact Information</h2>

          <div className="checkout-field">
            <label htmlFor="fullName">
              Full Name *
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
            />

            {errors.fullName && (
              <p className="checkout-error">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="checkout-field">
            <label htmlFor="email">
              Email Address *
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />

            {errors.email && (
              <p className="checkout-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="checkout-field">
            <label htmlFor="phone">
              Mobile Number *
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
            />

            {errors.phone && (
              <p className="checkout-error">
                {errors.phone}
              </p>
            )}
          </div>

          {/* DELIVERY ADDRESS */}

          <h2>Delivery Address</h2>

          <div className="checkout-field">
            <label htmlFor="address">
              Street Address *
            </label>

            <input
              id="address"
              name="address"
              type="text"
              autoComplete="address-line1"
              value={formData.address}
              onChange={handleChange}
            />

            {errors.address && (
              <p className="checkout-error">
                {errors.address}
              </p>
            )}
          </div>

          <div className="checkout-field">
            <label htmlFor="apartment">
              Apartment, Suite, or Landmark (Optional)
            </label>

            <input
              id="apartment"
              name="apartment"
              type="text"
              autoComplete="address-line2"
              value={formData.apartment}
              onChange={handleChange}
            />
          </div>

          <div className="checkout-row">

            <div className="checkout-field">
              <label htmlFor="city">
                City *
              </label>

              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                value={formData.city}
                onChange={handleChange}
              />

              {errors.city && (
                <p className="checkout-error">
                  {errors.city}
                </p>
              )}
            </div>

            <div className="checkout-field">
              <label htmlFor="state">
                State *
              </label>

              <input
                id="state"
                name="state"
                type="text"
                autoComplete="address-level1"
                value={formData.state}
                onChange={handleChange}
              />

              {errors.state && (
                <p className="checkout-error">
                  {errors.state}
                </p>
              )}
            </div>

          </div>

          <div className="checkout-field">
            <label htmlFor="pincode">
              PIN Code *
            </label>

            <input
              id="pincode"
              name="pincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={formData.pincode}
              onChange={handleChange}
            />

            {errors.pincode && (
              <p className="checkout-error">
                {errors.pincode}
              </p>
            )}
          </div>

          {errors.submit && (
            <p
              className="checkout-error"
              role="alert"
            >
              {errors.submit}
            </p>
          )}
        </form>

        {/* ORDER SUMMARY */}

        <aside className="checkout-summary">
          <h2>Order Summary</h2>

          {cartItems.map((item) => (
            <div
              key={item.variantId}
              className="checkout-summary-item"
            >
              <div>
                <strong>{item.name}</strong>

                <p>
                  {item.colour} / {item.size}
                </p>

                <p>
                  Quantity: {item.quantity}
                </p>
              </div>

              <span>
                {formatPrice(
                  Number(item.price) * item.quantity
                )}
              </span>
            </div>
          ))}

          <div className="checkout-summary-row">
            <span>Subtotal</span>

            <strong>
              {formatPrice(cartSubtotal)}
            </strong>
          </div>

          <div className="checkout-summary-row">
            <span>Shipping</span>

            <span>â‚¹0.00 (Free)</span>
          </div>

          <p className="checkout-note">
            Final prices and stock availability
            are verified by our backend before
            your COD order is confirmed.
          </p>

          <button
            type="submit"
            form="checkout-form"
            className="checkout-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Placing Order...'
              : 'Place COD Order'}
          </button>

          <p className="checkout-secure">
            <LockKeyhole size={15} />
            Pay cash when your order is delivered.
          </p>
        </aside>

      </div>
    </section>
  );
};

export default Checkout;
