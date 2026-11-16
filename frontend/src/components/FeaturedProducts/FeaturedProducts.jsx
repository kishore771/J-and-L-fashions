
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import ProductCard from '../ProductCard/ProductCard';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch(
            '/api/products/?tags=trending',
            { signal: controller.signal }
            );

        if (!response.ok) {
          throw new Error('Failed to load trending products');
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setProducts(data.results.slice(0, 8));
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError('Unable to load featured products.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchFeaturedProducts();

    return () => controller.abort();
  }, []);

  return (
    <section className="featured-products">
      <div className="featured-products-heading">
        <div>
          <p className="featured-products-subtitle">
            TRENDING NOW
            </p>
        <h2>Featured Products</h2>
          <p>Discover our selected fashion favorites.</p>
        </div>

        <Link to="/collections" className="featured-view-all">
          View All
        </Link>
      </div>

      {isLoading && <p>Loading featured products...</p>}

      {!isLoading && error && <p>{error}</p>}

      {!isLoading && !error && products.length === 0 && (
        <p>No featured products available yet.</p>
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="featured-products-grid">
          {products.map((product) => {
            const primaryImage = product.images?.find(
              (image) => image.is_primary
            );

            const variant = product.variants?.find(
              (variant) => variant.is_active
            );

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                image={primaryImage?.image || ''}
                name={product.name}
                price={variant?.sale_price ?? variant?.price}
                originalPrice={variant?.price}
                salePrice={variant?.sale_price}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
