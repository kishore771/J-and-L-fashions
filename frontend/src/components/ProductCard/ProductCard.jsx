
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowUpRight,
  Heart,
  ImageOff,
} from 'lucide-react';

import { useWishlist } from '../../context/WishlistContext';

import './ProductCard.css';

const ProductCard = ({
  id,
  image,
  name,
  price,
  originalPrice,
  salePrice,
}) => {
  const navigate = useNavigate();

  const {
    isWishlisted,
    toggleWishlist,
    pendingIds,
    wishlistLoading,
  } = useWishlist();

  const [wishlistMessage, setWishlistMessage] =
    useState('');

  const saved = isWishlisted(id);

  const isUpdating = pendingIds.includes(
    String(id)
  );

  const original = Number(originalPrice);
  const sale = Number(salePrice);

  const hasDiscount =
    salePrice != null &&
    originalPrice != null &&
    Number.isFinite(original) &&
    Number.isFinite(sale) &&
    original > 0 &&
    sale < original;

  const discount = hasDiscount
    ? Math.round(
        ((original - sale) / original) * 100
      )
    : 0;

  const formatPrice = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return 'Price unavailable';
    }

    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const handleWishlistClick = async () => {
    setWishlistMessage('');

    const result = await toggleWishlist(id);

    if (result.requiresLogin) {
      navigate('/login', {
        state: {
          from: window.location.pathname +
            window.location.search,
        },
      });

      return;
    }

    if (!result.success) {
      setWishlistMessage(
        result.error ||
          'Unable to update wishlist.'
      );
    }
  };

  return (
    <article className="product-card">
      <div className="product-card-image">
        {hasDiscount && (
          <span className="product-discount-badge">
            {discount}% OFF
          </span>
        )}

        <Link
          to={`/products/${id}`}
          className="product-card-image-link"
          aria-label={`View details for ${name}`}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
            />
          ) : (
            <div className="product-image-placeholder">
              <ImageOff
                size={28}
                strokeWidth={1.4}
              />
              <span>Image coming soon</span>
            </div>
          )}

          <div
            className="product-card-image-overlay"
            aria-hidden="true"
          >
            <span className="product-card-view-button">
              View Details
              <ArrowUpRight size={16} />
            </span>
          </div>
        </Link>

        <button
          type="button"
          className={`product-card-wishlist ${
            saved ? 'is-saved' : ''
          }`}
          onClick={handleWishlistClick}
          disabled={
            isUpdating || wishlistLoading
          }
          aria-label={
            saved
              ? `Remove ${name} from wishlist`
              : `Add ${name} to wishlist`
          }
          aria-pressed={saved}
          title={
            saved
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
        >
          <Heart
            size={19}
            strokeWidth={1.9}
            fill={
              saved ? 'currentColor' : 'none'
            }
          />
        </button>
      </div>

      <div className="product-card-info">
        <span className="product-card-label">
          JANDL FASHIONS
        </span>

        <Link
          to={`/products/${id}`}
          className="product-card-title-link"
        >
          <h3>{name}</h3>
        </Link>

        {price != null && (
          <div className="product-card-prices">
            <span className="product-current-price">
              {formatPrice(price)}
            </span>

            {hasDiscount && (
              <span className="product-original-price">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        )}

        <Link
          to={`/products/${id}`}
          className="product-card-mobile-action"
        >
          View Details
          <ArrowUpRight size={13} />
        </Link>

        {wishlistMessage && (
          <p
            className="product-card-wishlist-error"
            role="alert"
          >
            {wishlistMessage}
          </p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
