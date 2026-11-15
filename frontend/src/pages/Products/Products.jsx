
import './Products.css';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import ProductCard from '../../components/ProductCard/ProductCard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const location = useLocation();
  const department = location.pathname.split('/')[1];

  useEffect(() => {
    // Reset pagination when switching departments
    setCurrentPage(1);
  }, [department]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setIsLoading(true);
      setError('');
      setProducts([]);
      setNextPage(null);
      setPreviousPage(null);

      try {
        const params = new URLSearchParams();

        if (department !== 'collections') {
          params.set('department', department);
        }

        params.set('page', currentPage);

        const apiUrl = `/api/products/?${params.toString()}`;

        const response = await fetch(apiUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        setProducts(data.results);
        setNextPage(data.next);
        setPreviousPage(data.previous);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching products:', error);
          setError('Unable to load products. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [department, currentPage]);

  const pageTitle =
    department === 'collections'
      ? 'Our Collection'
      : `${department.charAt(0).toUpperCase() + department.slice(1)} Collection`;

  const handleNextPage = () => {
    if (nextPage) {
      setCurrentPage((page) => page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (previousPage) {
      setCurrentPage((page) => Math.max(1, page - 1));
    }
  };

  return (
    <section className="products-page">
      <div className="products-heading">
        <h1>{pageTitle}</h1>
        <p>Explore our latest fashion collection.</p>
      </div>

      <div className="products-grid">
        {isLoading && <p>Loading our collection...</p>}

        {!isLoading && error && <p>{error}</p>}

        {!isLoading && !error && products.length === 0 && (
          <p>No products available at the moment.</p>
        )}

        {!isLoading &&
          !error &&
          products.map((product) => {
            const primaryImage = product.images?.find(
              (image) => image.is_primary
            );

            const variant = product.variants?.find(
              (variant) => variant.is_active
            );

            const price = variant?.sale_price ?? variant?.price;

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                image={primaryImage?.image || ''}
                name={product.name}
                price={price}
              />
            );
          })}
      </div>

      {!isLoading && !error && (nextPage || previousPage) && (
        <div className="products-pagination">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={!previousPage}
          >
            Previous
          </button>

          <span>Page {currentPage}</span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={!nextPage}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default Products;
