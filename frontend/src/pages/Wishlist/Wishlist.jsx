
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ImageOff,
  LoaderCircle,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

import './Wishlist.css';

const formatPrice = (amount) =>
  Number(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

const Wishlist = () => {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    authLoading,
  } = useAuth();

  const {
    wishlistItems,
    wishlistCount,
    wishlistLoading,
    wishlistError,
    pendingIds,
    toggleWishlist,
  } = useWishlist();

  const handleRemove = async (productId) => {
    const result = await toggleWishlist(productId);

    if (result.requiresLogin) {
      navigate('/login');
    }
  };

  if (authLoading || (isAuthenticated && wishlistLoading)) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-status" role="status">
          <LoaderCircle
            size={34}
            className="wishlist-spinner"
          />
          <h2>Preparing Your Wishlist</h2>
          <p>Gathering your favourite finds...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-status">
          <div className="wishlist-status-icon">
            <Heart size={34} strokeWidth={1.5} />
          </div>

          <span className="wishlist-eyebrow">
            YOUR PERSONAL COLLECTION
          </span>

          <h1>Your Wishlist Awaits</h1>

          <p>
            Sign in to save the styles you love and
            find them again whenever inspiration strikes.
          </p>

          <Link
            to="/login"
            state={{ from: '/wishlist' }}
            className="wishlist-primary-link"
          >
            Sign In
            <ArrowRight size={17} />
          </Link>

          <Link
            to="/collections"
            className="wishlist-secondary-link"
          >
            Explore Collections
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-container">
        <nav
          className="wishlist-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Wishlist</span>
        </nav>

        <header className="wishlist-header">
          <span className="wishlist-eyebrow">
            J & L FASHIONS
          </span>

          <div className="wishlist-heading-row">
            <div>
              <h1>My Wishlist</h1>
              <p>
                A curated collection of the styles
                that caught your eye.
              </p>
            </div>

            <div className="wishlist-count">
              <Heart size={17} />
              <span>
                {wishlistCount}{' '}
                {wishlistCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>
        </header>

        <div className="wishlist-divider" />

        {wishlistError && (
          <p className="wishlist-error" role="alert">
            {wishlistError}
          </p>
        )}

        {wishlistItems.length === 0 && !wishlistError ? (
          <section className="wishlist-empty">
            <div className="wishlist-status-icon">
              <Heart size={36} strokeWidth={1.4} />
            </div>

            <h2>Your Wishlist Is Empty</h2>

            <p>
              Beautiful things deserve a second look.
              Explore our collections and save the
              pieces you love.
            </p>

            <Link
              to="/collections"
              className="wishlist-primary-link"
            >
              Explore Collections
              <ArrowRight size={17} />
            </Link>
          </section>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((item) => {
              const updating = pendingIds.includes(
                String(item.product_id)
              );

              return (
                <article
                  className="wishlist-card"
                  key={item.id}
                >
                  <div className="wishlist-card-image">
                    <Link
                      to={`/products/${item.product_id}`}
                      aria-label={`View ${item.name}`}
                    >
                        {item.discount_percentage > 0 && (
                            <span className="wishlist-discount-badge">
                                {item.discount_percentage}% OFF
                            </span>
                            )}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="wishlist-image-placeholder">
                          <ImageOff
                            size={30}
                            strokeWidth={1.4}
                          />
                          <span>
                            Image coming soon
                          </span>
                        </div>
                      )}
                    </Link>

                    <button
                      type="button"
                      className="wishlist-remove"
                      onClick={() =>
                        handleRemove(item.product_id)
                      }
                      disabled={updating}
                      aria-label={`Remove ${item.name} from wishlist`}
                      title="Remove from wishlist"
                    >
                      {updating ? (
                        <LoaderCircle
                          size={18}
                          className="wishlist-spinner"
                        />
                      ) : (
                        <Trash2
                          size={18}
                          strokeWidth={1.7}
                        />
                      )}
                    </button>
                  </div>

                  <div className="wishlist-card-content">
                    <span className="wishlist-card-brand">
                      J & L FASHIONS
                    </span>

                    <Link
                      to={`/products/${item.product_id}`}
                      className="wishlist-card-title"
                    >
                      <h3>{item.name}</h3>
                    </Link>
                    <div className="wishlist-card-pricing">
                        {item.starting_price != null ? (
                            <>
                            <span className="wishlist-price-prefix">
                                From
                            </span>

                            <span className="wishlist-current-price">
                                {formatPrice(item.starting_price)}
                            </span>

                            {item.original_price != null && (
                                <span className="wishlist-original-price">
                                {formatPrice(item.original_price)}
                                </span>
                            )}
                            </>
                        ) : (
                            <span className="wishlist-price-unavailable">
                            Currently unavailable
                            </span>
                        )}
                        </div>

                    <Link
                      to={`/products/${item.product_id}`}
                      className="wishlist-card-action"
                    >
                      <ShoppingBag size={17} />
                      Select Options
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="wishlist-footer">
          <Link to="/collections">
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
