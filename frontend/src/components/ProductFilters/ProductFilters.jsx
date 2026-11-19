
import './ProductFilters.css';


const ProductFilters = ({
    isOpen,
    onClose,
    selectedTags,
    onTagsChange,
    minPrice,
    maxPrice,
    onMinPriceChange,
    onMaxPriceChange,
    selectedColour,
    onColourChange,
    selectedSize,
    onSizeChange,
    categories,
    subcategories,
    department,
    selectedCategory,
    onCategoryChange,
    selectedSubcategory,
    onSubcategoryChange,
    onClearFilters
    }) => {
        const availableTags = [
        { label: 'New Arrival', slug: 'new-arrival' },
        { label: 'Best Seller', slug: 'best-seller' },
        { label: 'Trending', slug: 'trending' },
        { label: 'Featured', slug: 'featured' },
        { label: 'Sale', slug: 'sale' },
        { label: 'Exclusive', slug: 'exclusive' },
        { label: 'Limited Edition', slug: 'limited-edition' },
        { label: 'Premium', slug: 'premium' },
    ];
    const availableColours = [
        { id: 1, name: 'Black', hex: '#000000' },
        { id: 2, name: 'White', hex: '#FFFFFF' },
        { id: 6, name: 'Navy Blue', hex: '#1B2951' },
    ];
    const availableSizes = [
        'XS',
        'S',
        'M',
        'L',
        'XL',
        'XXL',
        'XXXL',
    ];

    const handleTagChange = (slug) => {
    const updatedTags = selectedTags.includes(slug)
        ? selectedTags.filter((tag) => tag !== slug)
        : [...selectedTags, slug];

    onTagsChange(updatedTags);
    };

    const filteredCategories = categories.filter(
    (category) =>
        category.is_active &&
        (department === 'collections' ||
        category.department.slug === department)
    );

    const filteredSubcategories = subcategories.filter(
    (subcategory) =>
        subcategory.is_active &&
        (selectedCategory
        ? subcategory.category.id === Number(selectedCategory)
        : department === 'collections' ||
            subcategory.category.department.slug === department)
    );
  if (!isOpen) return null;

  return (
    <div className="product-filters-overlay">
      <aside className="product-filters-panel">
        <div className="product-filters-header">
          <h2>Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        <div className="product-filters-body">

            <section >
            <h3>Category</h3>

            <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className='product-filter-select'
            >
                <option value="">All Categories</option>

                {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                    {department === 'collections'
                    ? `${category.department.name} - ${category.name}`
                    : category.name}
                </option>
                ))}
            </select>
            </section>

            <section >
            <h3>Subcategory</h3>

            <select
                value={selectedSubcategory}
                onChange={(e) => onSubcategoryChange(e.target.value)}
                className='product-filter-select'
            >
                <option value="">All Subcategories</option>

                {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                    {department === 'collections'
                    ? `${subcategory.category.department.name} - ${subcategory.name}`
                    : subcategory.name}
                </option>
                ))}
            </select>
            </section>



        <section>
        <h3>Price Range</h3>

        <div className="product-filter-price">
            <label>
            <span>Minimum Price</span>
            <input
                type="number"
                min="0"
                placeholder="₹ Min"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
            />
            </label>

            <label>
            <span>Maximum Price</span>
            <input
                type="number"
                min="0"
                placeholder="₹ Max"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
            />
            </label>
        </div>
        </section>


          <section>
            <h3>Color</h3>

            <div className="product-filter-colours">
                {availableColours.map((colour) => (
                <label key={colour.id}>
                    <input
                    type="radio"
                    name="product-colour"
                    value={colour.id}
                    checked={selectedColour === colour.id}
                    onChange={() => onColourChange(colour.id)}
                    />

                    <span
                    className="product-filter-colour-swatch"
                    style={{ backgroundColor: colour.hex }}
                    />

                    <span>{colour.name}</span>
                </label>
                ))}
            </div>
            </section>

            <section>
            <h3>Size</h3>

            <div className="product-filter-sizes">
                {availableSizes.map((size) => (
                <button
                    key={size}
                    type="button"
                    className={`product-filter-size ${
                    selectedSize === size ? 'active' : ''
                    }`}
                    aria-pressed={selectedSize === size}
                    onClick={() =>
                    onSizeChange(selectedSize === size ? '' : size)
                    }
                >
                    {size}
                </button>
                ))}
            </div>
            </section>

          <section>
            <h3>Tags</h3>

            <div className="product-filter-options">
                {availableTags.map((tag) => (
                <label key={tag.slug}>
                    <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.slug)}
                    onChange={() => handleTagChange(tag.slug)}
                    />
                    <span>{tag.label}</span>
                </label>
                ))}
            </div>
            </section>
        </div>

        <div className="product-filters-footer">
          <button type="button" onClick={onClearFilters}>Clear All</button>
          <button type="button" onClick={onClose}>
            Show Products
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ProductFilters;
