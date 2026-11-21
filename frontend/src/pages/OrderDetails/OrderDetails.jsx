
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  ArrowLeft,
  Package,
  CalendarDays,
  CreditCard,
  ShoppingBag,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

import './OrderDetails.css';

const formatPrice = (amount) => {
  const value = Number(amount);

  return Number.isFinite(value)
    ? `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : 'Unavailable';
};

const formatDate = (date) => {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? 'Unavailable'
    : parsed.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

const formatLabel = (value) => {
  if (!value) return 'Unavailable';

  return String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const getCookie = (name) => {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.substring(name.length + 1))
    : null;
};

const OrderDetails = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      setOrder(null);

      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}/`,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (response.status === 404) {
          throw new Error(
            'Order not found or access denied.'
          );
        }

        if (!response.ok) {
          throw new Error(
            'Unable to load order details.'
          );
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setOrder(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || 'Something went wrong.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => controller.abort();
  }, [orderId]);

  const canCancel =
    order?.payment_method === 'cod' &&
    order?.payment_status === 'pending' &&
    ['pending', 'confirmed'].includes(order?.status);

  const handleCancelOrder = async () => {
    if (!order || !canCancel || cancelling) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${order.id}?`
    );

    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setCancelError('');
    setCancelSuccess('');

    try {
      // Initialize CSRF cookie.
      const csrfResponse = await fetch(
        '/api/accounts/csrf/',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!csrfResponse.ok) {
        throw new Error(
          'Unable to initialize security verification.'
        );
      }

      const csrfToken = getCookie('csrftoken');

      if (!csrfToken) {
        throw new Error(
          'Security verification failed. Please refresh the page and try again.'
        );
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/customer-cancel/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-CSRFToken': csrfToken,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            'Unable to cancel this order.'
        );
      }

      // Fetch updated order from server.
      const updatedResponse = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/`,
        {
          credentials: 'include',
        }
      );

      if (!updatedResponse.ok) {
        throw new Error(
          'Cancellation succeeded, but the order details could not be refreshed. Please reload the page.'
        );
      }

      const updatedOrder = await updatedResponse.json();

      setOrder(updatedOrder);

      setCancelSuccess(
        data.message ||
          'Your order has been cancelled successfully.'
      );
    } catch (err) {
      setCancelError(
        err.message ||
          'Something went wrong while cancelling the order.'
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="order-details-container">
          <div
            className="order-details-feedback"
            role="status"
          >
            <div className="order-details-spinner" />
            <p>Loading your order details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="order-details-page">
        <div className="order-details-container">
          <div
            className="order-details-feedback"
            role="alert"
          >
            <AlertCircle size={32} />

            <h1>Unable to Load Order</h1>

            <p>{error}</p>

            <Link
              to="/my-orders"
              className="order-details-primary-link"
            >
              Back to My Orders
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const status = String(
    order.status || 'unknown'
  ).toLowerCase();

  const paymentStatus = String(
    order.payment_status || 'unknown'
  ).toLowerCase();

  const paymentMethod =
    order.payment_method === 'cod'
      ? 'Cash on Delivery'
      : order.payment_method === 'razorpay'
        ? 'Razorpay'
        : formatLabel(order.payment_method);

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const itemCount = items.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 0),
    0
  );

  return (
    <main className="order-details-page">
      <div className="order-details-container">

        {/* BACK NAVIGATION */}

        <Link
          to="/my-orders"
          className="order-details-back"
        >
          <ArrowLeft size={17} />
          Back to My Orders
        </Link>

        {/* PAGE HEADER */}

        <div className="order-details-heading">
          <div>
            <p className="order-details-eyebrow">
              ORDER INFORMATION
            </p>

            <h1>Order #{order.id}</h1>

            <p>
              Review your purchase and order status.
            </p>
          </div>
        </div>

        {/* EMERALD HERO */}

        <section className="order-details-hero">
          <div className="order-details-hero-icon">
            <Package size={28} />
          </div>

          <div className="order-details-hero-content">
            <span>J & L FASHIONS</span>

            <h2>Your Order Details</h2>

            <p>
              Thank you for shopping with us.
              Here's a summary of your purchase.
            </p>
          </div>

          <div
            className="order-details-hero-brand"
            aria-hidden="true"
          >
            J&amp;L
          </div>
        </section>

        {/* ORDER OVERVIEW */}

        <section className="order-details-overview">

          <div className="order-details-overview-item">
            <CalendarDays size={19} />

            <div>
              <span>ORDER DATE</span>
              <strong>
                {formatDate(order.created_at)}
              </strong>
            </div>
          </div>

          <div className="order-details-overview-item">
            <Truck size={19} />

            <div>
              <span>ORDER STATUS</span>

              <span
                className={
                  `order-details-badge ` +
                  `order-details-badge--${status}`
                }
              >
                {formatLabel(order.status)}
              </span>
            </div>
          </div>

          <div className="order-details-overview-item">
            <CreditCard size={19} />

            <div>
              <span>PAYMENT STATUS</span>

              <span
                className={
                  `order-details-badge ` +
                  `order-details-badge--${paymentStatus}`
                }
              >
                {formatLabel(order.payment_status)}
              </span>
            </div>
          </div>

        </section>

        {/* MAIN GRID */}

        <div className="order-details-grid">

          {/* LEFT COLUMN */}

          <div className="order-details-main-column">

            {/* PURCHASED ITEMS */}

            <section className="order-details-card">
              <div className="order-details-card-heading">
                <div className="order-details-heading-icon">
                  <ShoppingBag size={20} />
                </div>

                <div>
                  <h2>Purchased Items</h2>

                  <p>
                    {itemCount}{' '}
                    {itemCount === 1 ? 'item' : 'items'}
                    {' '}in this order
                  </p>
                </div>
              </div>

              {items.length > 0 ? (
                <ul className="order-details-items">
                  {items.map((item, index) => (
                    <li
                      key={
                        item.id ??
                        `${order.id}-${index}`
                      }
                    >
                      <div className="order-details-item-icon">
                        <ShoppingBag size={22} />
                      </div>

                      <div className="order-details-item-content">
                        <h3>
                          {item.product_name || 'Product'}
                        </h3>

                        <div className="order-details-item-attributes">
                          <span>
                            Colour:{' '}
                            {item.colour || 'Not specified'}
                          </span>

                          <span>
                            Size: {item.size || 'One Size'}
                          </span>

                          <span>
                            Qty: {item.quantity}
                          </span>
                        </div>

                        <p>
                          Unit price:{' '}
                          {formatPrice(item.unit_price)}
                        </p>
                      </div>

                      <div className="order-details-item-price">
                        <span>ITEM TOTAL</span>

                        <strong>
                          {formatPrice(item.total_price)}
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="order-details-empty-items">
                  No items available for this order.
                </p>
              )}
            </section>

            {/* ORDER INFORMATION */}

            <section className="order-details-card">
              <div className="order-details-card-heading">
                <div className="order-details-heading-icon">
                  <Package size={20} />
                </div>

                <div>
                  <h2>Order Information</h2>
                  <p>Your purchase details</p>
                </div>
              </div>

              <div className="order-details-info-grid">

                <div className="order-details-info-item">
                  <span>Order Number</span>
                  <strong>#{order.id}</strong>
                </div>

                <div className="order-details-info-item">
                  <span>Payment Method</span>
                  <strong>{paymentMethod}</strong>
                </div>

                <div className="order-details-info-item">
                  <span>Order Status</span>
                  <strong>
                    {formatLabel(order.status)}
                  </strong>
                </div>

                <div className="order-details-info-item">
                  <span>Payment Status</span>
                  <strong>
                    {formatLabel(order.payment_status)}
                  </strong>
                </div>

              </div>

              {/* CANCELLATION */}

              {canCancel && (
                <div className="order-details-cancel-section">
                  <div>
                    <h3>Need to cancel this order?</h3>

                    <p>
                      This order is currently eligible
                      for cancellation.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="order-details-cancel-button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                  >
                    <XCircle size={17} />

                    {cancelling
                      ? 'Cancelling Order...'
                      : 'Cancel Order'}
                  </button>
                </div>
              )}

              {cancelSuccess && (
                <div
                  className="order-details-cancel-success"
                  role="status"
                >
                  <CheckCircle2 size={18} />
                  <span>{cancelSuccess}</span>
                </div>
              )}

              {cancelError && (
                <div
                  className="order-details-cancel-error"
                  role="alert"
                >
                  <AlertCircle size={18} />
                  <span>{cancelError}</span>
                </div>
              )}

            </section>

          </div>

          {/* RIGHT COLUMN */}

          <aside className="order-details-sidebar">

            {/* PAYMENT SUMMARY */}

            <section className="order-details-card">
              <div className="order-details-card-heading">
                <div className="order-details-heading-icon">
                  <CreditCard size={20} />
                </div>

                <div>
                  <h2>Payment Summary</h2>
                  <p>Order total breakdown</p>
                </div>
              </div>

              <div className="order-details-summary-row">
                <span>Subtotal</span>

                <strong>
                  {formatPrice(order.subtotal)}
                </strong>
              </div>

              <div className="order-details-summary-row">
                <span>Shipping</span>

                <strong>
                  {formatPrice(order.shipping_charge)}
                </strong>
              </div>

              <div className="order-details-summary-total">
                <span>Total Amount</span>

                <strong>
                  {formatPrice(order.total_amount)}
                </strong>
              </div>
            </section>

            {/* SECURITY NOTE */}

            <div className="order-details-security">
              <ShieldCheck size={22} />

              <div>
                <h3>Order Information</h3>

                <p>
                  Your order details are available
                  through your shopping session.
                </p>
              </div>
            </div>

          </aside>

        </div>

      </div>
    </main>
  );
};

export default OrderDetails;
