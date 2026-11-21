
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Heart,
} from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import './ProductDetails.css';

const formatPrice = (amount) =>
  Number(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

const getStockAvailability = (stock) => {
  const quantity = Number(stock);

  if (quantity <= 0) {
    return {
      message: 'Out of stock',
      className: 'out-of-stock',
    };
  }

  if (quantity <= 5) {
    return {
      message: 'Only a few left',
      className: 'low-stock',
    };
  }

  return {
    message: 'In stock',
    className: 'in-stock',
  };
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const {
    isWishlisted,
    toggleWishlist,
    pendingIds,
    wishlistLoading,
  } = useWishlist();

  const savedToWishlist = isWishlisted(id);
  const wishlistUpdating = pendingIds.includes(String(id));

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedColourId, setSelectedColourId] =
    useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] =
    useState(null);

  const [activeImageIndex, setActiveImageIndex] =
    useState(0);
  const [cartMessage, setCartMessage] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [wishlistMessageError, setWishlistMessageError] = useState(false);

  // Fetch product details
  useEffect(() => {
    const controller = new AbortController();

    const fetchProduct = async () => {
      setIsLoading(true);
      setError('');
      setProduct(null);
      setSelectedVariant(null);
      setSelectedColourId(null);
      setSelectedSize('');
      setActiveImageIndex(0);
      setCartMessage('');
      setWishlistMessage('');
      setWishlistMessageError(false);

      try {
        const response = await fetch(
          `/api/products/${id}/`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status}`
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        setProduct(data);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error(
            'Error fetching product:',
            fetchError
          );

          setError(
            'Unable to load product details.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchProduct();

    return () => controller.abort();
  }, [id]);

  // Active variants
  const activeVariants =
    product?.variants?.filter(
      (variant) => variant.is_active
    ) || [];

  // Unique available colours
  const availableColours = [
    ...new Map(
      activeVariants
        .filter((variant) => variant.colour)
        .map((variant) => [
          variant.colour.id,
          variant.colour,
        ])
    ).values(),
  ];

  // Sizes for selected colour
  const availableSizes = [
    ...new Set(
      activeVariants
        .filter(
          (variant) =>
            variant.colour?.id === selectedColourId
        )
        .map((variant) => variant.size)
    ),
  ];

  // Image gallery: primary image first
  const productImages = [
    ...(product?.images || []),
  ].sort(
    (a, b) =>
      Number(Boolean(b.is_primary)) -
      Number(Boolean(a.is_primary))
  );

  const activeImage =
    productImages[activeImageIndex]?.image || '';

  const handlePreviousImage = () => {
    setActiveImageIndex((index) =>
      index === 0
        ? productImages.length - 1
        : index - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((index) =>
      (index + 1) % productImages.length
    );
  };

  // Colour selection
  const handleColourChange = (colourId) => {
    setSelectedColourId(colourId);
    setCartMessage('');

    const matchingVariant = activeVariants.find(
      (variant) =>
        variant.colour?.id === colourId &&
        variant.size === selectedSize
    );

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    } else {
      setSelectedSize('');
      setSelectedVariant(null);
    }
  };

  // Size selection
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setCartMessage('');

    const matchingVariant = activeVariants.find(
      (variant) =>
        variant.colour?.id === selectedColourId &&
        variant.size === size
    );

    setSelectedVariant(matchingVariant || null);
  };

  // Add or remove product from wishlist
const handleToggleWishlist = async () => {
  if (!product) return;

  setWishlistMessage('');
  setWishlistMessageError(false);

  const result = await toggleWishlist(product.id);

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
      result.error || 'Unable to update your wishlist.'
    );
    setWishlistMessageError(true);
    return;
  }

  setWishlistMessage(
    result.added
      ? 'Added to your wishlist!'
      : 'Removed from your wishlist.'
  );
};

  // Add to cart
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    if (
      !selectedVariant.is_active ||
      Number(selectedVariant.stock) <= 0
    ) {
      return;
    }

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image:
        product.images?.find(
          (image) => image.is_primary
        )?.image ||
        product.images?.[0]?.image ||
        '',
      colour: selectedVariant.colour?.name || '',
      size: selectedVariant.size,
      price:
        selectedVariant.sale_price ??
        selectedVariant.price,
      stock: Number(selectedVariant.stock),
    });

    setCartMessage(
      'Added to your bag successfully!'
    );
  };

  // Loading
  if (isLoading) {
    return (
      <div
        className="product-details-loading"
        role="status"
      >
        <div className="product-details-spinner" />
        <p>Preparing your product details...</p>
      </div>
    );
  }

  // Error
  if (error || !product) {
    return (
      <div className="product-details-error">
        <ImageOff size={38} strokeWidth={1.4} />

        <h2>Product Unavailable</h2>

        <p>
          {error || 'Product not found.'}
        </p>

        <Link to="/collections">
          <ArrowLeft size={16} />
          Back to Collection
        </Link>
      </div>
    );
  }

  // Selected variant pricing
  const displayPrice = selectedVariant
    ? selectedVariant.sale_price ??
      selectedVariant.price
    : null;

  const originalPrice = selectedVariant?.price;
  const salePrice = selectedVariant?.sale_price;

  const hasDiscount =
    selectedVariant &&
    salePrice != null &&
    originalPrice != null &&
    Number(originalPrice) > 0 &&
    Number(salePrice) < Number(originalPrice);

  const discount = hasDiscount
    ? Math.round(
        ((Number(originalPrice) -
          Number(salePrice)) /
          Number(originalPrice)) *
          100
      )
    : 0;

  const isOutOfStock =
    selectedVariant &&
    Number(selectedVariant.stock) <= 0;

  const stockStatus = selectedVariant
    ? getStockAvailability(selectedVariant.stock)
    : null;

  const canAddToCart =
    selectedVariant &&
    selectedVariant.is_active &&
    Number(selectedVariant.stock) > 0;

  return (
    <div className="product-details-wrapper">

      {/* BREADCRUMB */}

      <div className="product-details-breadcrumb">
        <Link to="/collections">
          Collections
        </Link>

        <span>/</span>

        <span>{product.name}</span>
      </div>

      <section className="product-details-page">

        {/* IMAGE GALLERY */}

        <div className="product-details-gallery">

          <div className="product-details-image">

            {hasDiscount && (
              <span className="product-details-discount">
                {discount}% OFF
              </span>
            )}

            {activeImage ? (
              <img
                src={activeImage}
                alt={`${product.name} - Image ${
                  activeImageIndex + 1
                }`}
              />
            ) : (
              <div className="product-details-placeholder">
                <ImageOff
                  size={36}
                  strokeWidth={1.3}
                />
                <span>No image available</span>
              </div>
            )}

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-gallery-arrow previous"
                  onClick={handlePreviousImage}
                  aria-label="Previous product image"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  className="product-gallery-arrow next"
                  onClick={handleNextImage}
                  aria-label="Next product image"
                >
                  <ChevronRight size={20} />
                </button>

                <span className="product-gallery-counter">
                  {activeImageIndex + 1} /{' '}
                  {productImages.length}
                </span>
              </>
            )}
          </div>

          {/* IMAGE THUMBNAILS */}

          {productImages.length > 1 && (
            <div className="product-gallery-thumbnails">
              {productImages.map((image, index) => (
                <button
                  key={image.id ?? index}
                  type="button"
                  className={`product-gallery-thumbnail ${
                    activeImageIndex === index
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setActiveImageIndex(index)
                  }
                  aria-label={`View product image ${
                    index + 1
                  }`}
                  aria-pressed={
                    activeImageIndex === index
                  }
                >
                  <img
                    src={image.image}
                    alt=""
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT INFORMATION */}

        <div className="product-details-info">

          <div className="product-details-brand">
            <Sparkles size={14} />
            J & L FASHIONS
          </div>

          <h1>{product.name}</h1>

          {product.short_description && (
            <p className="product-details-short-description">
              {product.short_description}
            </p>
          )}

          <div className="product-details-divider" />

          {/* PRICE */}

          <div className="product-details-pricing">
            {displayPrice != null ? (
              <>
                <div className="product-details-price-row">
                  <span className="product-details-current-price">
                    {formatPrice(displayPrice)}
                  </span>

                  {hasDiscount && (
                    <span className="product-details-original-price">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>

                {hasDiscount && (
                  <span className="product-details-savings">
                    Save {discount}%
                  </span>
                )}
              </>
            ) : (
              <span className="product-details-price-prompt">
                Select a colour and size to see price
              </span>
            )}
          </div>

          {/* COLOUR SELECTION */}

          <div className="product-variant-section">
            <div className="product-variant-heading">
              <h3>Choose Colour</h3>

              {selectedColourId !== null && (
                <span className="product-variant-selection">
                  {
                    availableColours.find(
                      (colour) =>
                        colour.id === selectedColourId
                    )?.name
                  }
                </span>
              )}
            </div>

            <div className="variant-options">
              {availableColours.map((colour) => (
                <button
                  key={colour.id}
                  type="button"
                  className={
                    selectedColourId === colour.id
                      ? 'selected'
                      : ''
                  }
                  aria-pressed={
                    selectedColourId === colour.id
                  }
                  onClick={() =>
                    handleColourChange(colour.id)
                  }
                >
                  {colour.name}
                </button>
              ))}
            </div>
          </div>

          {/* SIZE SELECTION */}

          <div className="product-variant-section">
            <div className="product-variant-heading">
              <h3>Choose Size</h3>

              {selectedSize && (
                <span className="product-variant-selection">
                  {selectedSize}
                </span>
              )}
            </div>

            <div className="variant-options">
              {availableSizes.map((size) => {
                const variant = activeVariants.find(
                  (item) =>
                    item.colour?.id === selectedColourId &&
                    item.size === size
                );

                const unavailable =
                  !variant ||
                  Number(variant.stock) <= 0;

                return (
                  <button
                    key={size}
                    type="button"
                    className={
                      selectedSize === size
                        ? 'selected'
                        : ''
                    }
                    aria-pressed={
                      selectedSize === size
                    }
                    disabled={unavailable}
                    onClick={() =>
                      handleSizeChange(size)
                    }
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {!selectedColourId && (
              <p className="product-variant-hint">
                Please select a colour first.
              </p>
            )}
          </div>

          {/* STOCK STATUS */}

          {stockStatus && (
            <p
              className={`product-stock-status ${
                stockStatus.className
              }`}
            >
              <span className="product-stock-dot" />
              {stockStatus.message}
            </p>
          )}

          {/* ADD TO CART */}

          {/* SHOPPING ACTIONS */}

<div className="product-details-actions">
  <button
    type="button"
    className="add-to-cart-btn"
    onClick={handleAddToCart}
    disabled={!canAddToCart}
  >
    <ShoppingBag
      size={19}
      strokeWidth={1.8}
    />

    {!selectedVariant
      ? 'Select Colour & Size'
      : isOutOfStock
        ? 'Out of Stock'
        : 'Add to Bag'}
  </button>

  <button
    type="button"
    className={`product-details-wishlist-btn ${
      savedToWishlist ? 'is-saved' : ''
    }`}
    onClick={handleToggleWishlist}
    disabled={wishlistLoading || wishlistUpdating}
    aria-pressed={savedToWishlist}
    aria-label={
      savedToWishlist
        ? `Remove ${product.name} from wishlist`
        : `Add ${product.name} to wishlist`
    }
  >
    <Heart
      size={20}
      strokeWidth={1.8}
      fill={savedToWishlist ? 'currentColor' : 'none'}
    />

    <span>
      {wishlistUpdating
        ? 'Updating...'
        : savedToWishlist
          ? 'Saved to Wishlist'
          : 'Add to Wishlist'}
    </span>
  </button>
</div>

{/* WISHLIST CONFIRMATION */}

{wishlistMessage && (
  <p
    className={`product-details-wishlist-message ${
      wishlistMessageError ? 'is-error' : ''
    }`}
    role={wishlistMessageError ? 'alert' : 'status'}
  >
    {!wishlistMessageError && (
      <CheckCircle2 size={17} />
    )}
    {wishlistMessage}
  </p>
)}

          {/* CART CONFIRMATION */}

          {cartMessage && (
            <p
              className="cart-success-message"
              role="status"
            >
              <CheckCircle2 size={18} />
              {cartMessage}
            </p>
          )}

          {/* SHOPPING HIGHLIGHTS */}

          <div className="product-details-highlights">
            <div>
              <ShieldCheck size={19} />
              <span>Carefully selected styles</span>
            </div>

            <div>
              <PackageCheck size={19} />
              <span>Shop with confidence</span>
            </div>
          </div>

          {/* DESCRIPTION */}

          {product.description && (
            <div className="product-details-description">
              <h2>Product Details</h2>
              <p>{product.description}</p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
