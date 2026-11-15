
import './ProductDetails.css';
import { useParams } from 'react-router';
import { useEffect, useState } from 'react';

const ProductDetails = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const getStockAvailability = (stock) => {
      if (stock === 0) {
        return {
          message: 'Out of stock',
          className: 'out-of-stock',
        };
      }

      if (stock <= 5) {
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/products/${id}/`);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        setProduct(data);
        setSelectedVariant(data.variants?.[0] || null);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return <p>Loading product details...</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <section className="product-details-page">

      <div className="product-details-image">
        <img
          src={
            product.images.find(image => image.is_primary)?.image || ''
          }
          alt={product.name}
        />
      </div>

      <div className="product-details-info">

        <h1>{product.name}</h1>

        <p>{product.short_description}</p>

        {/* Colour Selection */}
        <div className="product-variant-section">
  <h3>Colour</h3>

  <div className="variant-options">
    {[...new Map(
      product.variants.map(variant => [
        variant.colour.id,
        variant.colour
      ])
    ).values()].map(colour => (
      <button
        key={colour.id}
        onClick={() => {
          const variant = product.variants.find(
            item => item.colour.id === colour.id
          );

          setSelectedVariant(variant);
        }}
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
    {[...new Set(
      product.variants
        .filter(
          variant =>
            variant.colour.id === selectedVariant?.colour.id
        )
        .map(variant => variant.size)
    )].map(size => (
      <button
        key={size}
        onClick={() => {
          const variant = product.variants.find(
            item =>
              item.colour.id === selectedVariant?.colour.id &&
              item.size === size
          );

          setSelectedVariant(variant);
        }}
      >
        {size}
      </button>
    ))}
  </div>
</div>

        <h2>
          ₹{selectedVariant?.sale_price || selectedVariant?.price || 'N/A'}
        </h2>
        {selectedVariant && (
        <p className={`product-stock-status ${getStockAvailability(selectedVariant.stock).className}`}>
          {getStockAvailability(selectedVariant.stock).message}
        </p>
      )}

        <p>{product.description}</p>

      </div>
    </section>
  );
};

export default ProductDetails;
