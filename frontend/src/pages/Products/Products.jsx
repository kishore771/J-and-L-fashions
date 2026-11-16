
import './Products.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductToolbar from '../../components/ProductToolbar/ProductToolbar';
import ProductFilters from '../../components/ProductFilters/ProductFilters';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const location = useLocation();
  const department = location.pathname.split('/')[1];
  const searchQuery =
    new URLSearchParams(location.search).get('search')?.trim() || '';

  useEffect(() => {
    // Reset pagination when department or search changes
    setCurrentPage(1);
  }, [department, searchQuery]);

useEffect(() => {
  const controller = new AbortController();

  const fetchAllPages = async (url) => {
    const items = [];
    let nextUrl = url;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      items.push(...data.results);

      // Use the local Vite proxy for subsequent pages.
      nextUrl = data.next
        ? new URL(data.next).pathname +
          new URL(data.next).search
        : null;
    }

    return items;
  };

  const loadFilterOptions = async () => {
    try {
      const [categoryData, subcategoryData] = await Promise.all([
        fetchAllPages('/api/categories/'),
        fetchAllPages('/api/subcategories/'),
      ]);

      if (controller.signal.aborted) return;

      setCategories(categoryData);
      setSubcategories(subcategoryData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading filter options:', error);
      }
    }
  };

  loadFilterOptions();

  return () => controller.abort();
}, []);

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

        if (searchQuery) {
          params.set('search', searchQuery);
        }

        if (department !== 'collections') {
          params.set('department', department);
        }

        params.set('page', currentPage);
        if (selectedCategory) {
          params.set('category', selectedCategory);
        }

        if (selectedSubcategory) {
          params.set('subcategory', selectedSubcategory);
        }

        if (selectedSize) {
          params.set('size', selectedSize);
        }
        if (selectedColour !== null) {
          params.set('colour', selectedColour);
        }
        if (minPrice !== '' && Number(minPrice) >= 0) {
            params.set('min_price', minPrice);
          }

          if (maxPrice !== '' && Number(maxPrice) >= 0) {
            params.set('max_price', maxPrice);
          }
        if (selectedTags.length > 0) {
            params.set('tags', selectedTags.join(','));
          }
        const orderingMap = {
          'price-low': 'lowest_variant_price',
          'price-high': '-lowest_variant_price',
          newest: '-created_at',
        };

        if (orderingMap[sortBy]) {
          params.set('ordering', orderingMap[sortBy]);
        }

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
    }, [
        department,
        currentPage,
        sortBy,
        selectedTags,
        minPrice,
        maxPrice,
        selectedColour,
        selectedSize,
        selectedCategory,
        selectedSubcategory,
        searchQuery,
      ]);
  const pageTitle = searchQuery
  ? `Search results for "${searchQuery}"`
  : department === 'collections'
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

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleTagsChange = (tags) => {
    setSelectedTags(tags);
    setCurrentPage(1);
  };

  const handleMinPriceChange = (value) => {
    setMinPrice(value);
    setCurrentPage(1);
  };

  const handleMaxPriceChange = (value) => {
    setMaxPrice(value);
    setCurrentPage(1);
  };

  const handleColourChange = (colourId) => {
    setSelectedColour(colourId);
    setCurrentPage(1);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setCurrentPage(1);
  };

  const handleSubcategoryChange = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedTags([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedColour(null);
    setSelectedSize('');
    setCurrentPage(1);
  };

  return (
    <section className="products-page">
      <div className="products-heading">
        <h1>{pageTitle}</h1>
        <p>Explore our latest fashion collection.</p>
      </div>
      <ProductToolbar
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onFilterClick={() => setIsFilterOpen(true)}
        />
        <ProductFilters
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
          selectedColour={selectedColour}
          onColourChange={handleColourChange}
          selectedSize={selectedSize}
          onSizeChange={handleSizeChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={handleSubcategoryChange}
          categories={categories}
          subcategories={subcategories}
          department={department}
          onClearFilters={handleClearFilters}
        />

      <div className="products-grid">
        {isLoading && <p>Loading our collection...</p>}

        {!isLoading && error && <p>{error}</p>}


        {!isLoading && !error && products.length === 0 && (
          <div className="products-empty">
            <h2>
              {searchQuery
                ? 'No search results found'
                : 'No products found'}
            </h2>

            <p>
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}".`
                : 'No products match your selected filters.'}
            </p>

            <Link to="/collections" className="products-empty-link">
              Browse All Products
            </Link>
          </div>
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
            const originalPrice = variant?.price;
            const salePrice = variant?.sale_price;

            return (
              <ProductCard
                  key={product.id}
                  id={product.id}
                  image={primaryImage?.image || ''}
                  name={product.name}
                  price={price}
                  originalPrice={originalPrice}
                  salePrice={salePrice}
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
