
import { useNavigate } from 'react-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

import OrderHistory from '../../components/OrderHistory/OrderHistory';

import './MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();

  return (
    <main className="my-orders-page">
      <div className="my-orders-container">

        {/* PAGE HEADER */}

        <header className="my-orders-header">
          <div>
            <p className="my-orders-eyebrow">
              YOUR ACCOUNT
            </p>

            <h1>My Orders</h1>

            <p className="my-orders-subtitle">
              Explore your purchases and stay updated
              on your orders.
            </p>
          </div>

          <button
            type="button"
            className="my-orders-back"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft size={17} />
            Back to Profile
          </button>
        </header>

        {/* EMERALD BANNER */}

        <section className="my-orders-banner">
          <div className="my-orders-banner-icon">
            <ShoppingBag size={27} />
          </div>

          <div className="my-orders-banner-content">
            <span>J & L FASHIONS</span>

            <h2>Your Shopping Journey</h2>

            <p>
              Every order tells a story of your style.
              Find all your purchases in one place.
            </p>
          </div>

          <div
            className="my-orders-banner-brand"
            aria-hidden="true"
          >
            J&amp;L
          </div>
        </section>

        {/* ORDER HISTORY */}

        <section className="my-orders-history">
          <div className="my-orders-section-heading">
            <div>
              <p className="my-orders-eyebrow">
                PURCHASE HISTORY
              </p>

              <h2>All Orders</h2>

              <p>
                Review your orders and their current status.
              </p>
            </div>
          </div>

          <OrderHistory />
        </section>

      </div>
    </main>
  );
};

export default MyOrders;
