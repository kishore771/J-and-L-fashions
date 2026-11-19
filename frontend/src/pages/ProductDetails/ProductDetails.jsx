
import './ProductDetails.css';
import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [cartMessage, setCartMessage] = useState('');
  const [error, setError] = useState('');

  // Stock availability
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

  // Fetch product details
  useEffect(() => {
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError('');
        setProduct(null);
        setSelectedVariant(null);
        setCartMessage('');

        const response = await fetch(
          `/api/products/${id}/`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        setProduct(data);

        // Require customers to select their variant.
        setSelectedVariant(null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching product:', error);
          setError('Unable to load product details.');
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

  // Get active variants
  const activeVariants = product?.variants?.filter(
    (variant) => variant.is_active
  ) || [];

  // Available colors
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

  // Track selected color separately from selected variant.
  const [selectedColourId, setSelectedColourId] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');

  // Reset selections when product changes
  useEffect(() => {
    setSelectedColourId(null);
    setSelectedSize('');
  }, [id]);

  // Available sizes for selected color
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

  // Handle color selection
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

  // Handle size selection
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setCartMessage('');

    const variant = activeVariants.find(
      (item) =>
        item.colour?.id === selectedColourId &&
        item.size === size
    );

    setSelectedVariant(variant || null);
  };

  // Add selected variant to cart
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

    setCartMessage('✓ Added to cart successfully!');
  };

  // Loading state
  if (isLoading) {
    return <p>Loading product details...</p>;
  }

  // Error state
  if (error || !product) {
    return (
      <p>{error || 'Product not found.'}</p>
    );
  }

  const primaryImage =
    product.images?.find(
      (image) => image.is_primary
    )?.image ||
    product.images?.[0]?.image ||
    '';

  const displayPrice = selectedVariant
    ? selectedVariant.sale_price ??
      selectedVariant.price
    : null;

  const isOutOfStock =
    selectedVariant &&
    Number(selectedVariant.stock) <= 0;

  return (
    <section className="product-details-page">

      {/* Product Image */}
      <div className="product-details-image">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
          />
        ) : (
          <div className="product-image-placeholder">
            No image available
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="product-details-info">

        <h1>{product.name}</h1>

        <p>{product.short_description}</p>

        {/* Color Selection */}
        <div className="product-variant-section">
          <h3>Colour</h3>

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

        {/* Size Selection */}
        <div className="product-variant-section">
          <h3>Size</h3>

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
            <p>Please select a colour first.</p>
          )}
        </div>

        {/* Product Price */}
        <h2>
          {displayPrice != null
            ? Number(displayPrice).toLocaleString(
                'en-IN',
                {
                  style: 'currency',
                  currency: 'INR',
                }
              )
            : 'Select a colour and size'}
        </h2>

        {/* Stock Availability */}
        {selectedVariant && (
          <p
            className={`product-stock-status ${
              getStockAvailability(
                selectedVariant.stock
              ).className
            }`}
          >
            {
              getStockAvailability(
                selectedVariant.stock
              ).message
            }
          </p>
        )}

        {/* Add to Cart */}
        <button
          type="button"
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={
            !selectedVariant ||
            !selectedVariant.is_active ||
            Number(selectedVariant.stock) <= 0
          }
        >
          {!selectedVariant
            ? 'Select Colour & Size'
            : isOutOfStock
              ? 'Out of Stock'
              : 'Add to Cart'}
        </button>

        {/* Cart Confirmation */}
        {cartMessage && (
          <p
            className="cart-success-message"
            role="status"
          >
            {cartMessage}
          </p>
        )}

        {/* Product Description */}
        <p>{product.description}</p>

      </div>
    </section>
  );
};

export default ProductDetails;
