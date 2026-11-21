
import { useEffect, useRef } from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

import './ProductFilters.css';

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
  onClearFilters,
}) => {
  const closeButtonRef = useRef(null);
  const panelRef = useRef(null);

  // Close with Escape and prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement = document.activeElement;

    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }

      // Keep keyboard focus inside the open filter panel
      if (event.key === 'Tab' && panelRef.current) {
        const focusableElements = [
          ...panelRef.current.querySelectorAll(
            'button:not([disabled]), select:not([disabled]), input:not([disabled])'
          ),
        ];

        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      previouslyFocusedElement?.focus?.();
    };
  }, [isOpen, onClose]);

  const handleTagChange = (slug) => {
    const updatedTags = selectedTags.includes(slug)
      ? selectedTags.filter((tag) => tag !== slug)
      : [...selectedTags, slug];

    onTagsChange(updatedTags);
  };

  // Preserve department-based category filtering
  const filteredCategories = categories.filter(
    (category) =>
      category.is_active &&
      (department === 'collections' ||
        category.department?.slug === department)
  );

  const filteredSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.is_active &&
      (selectedCategory
        ? subcategory.category?.id === Number(selectedCategory)
        : department === 'collections' ||
          subcategory.category?.department?.slug === department)
  );

  // Number of active filter groups/values
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedSubcategory ? 1 : 0) +
    (minPrice !== '' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0) +
    (selectedColour !== null ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    selectedTags.length;

  if (!isOpen) return null;

  return (
    <div
      className="product-filters-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        ref={panelRef}
        className="product-filters-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-filters-title"
      >
        {/* HEADER */}

        <div className="product-filters-header">
          <div className="product-filters-header-content">
            <span className="product-filters-eyebrow">
              <Sparkles size={13} />
              REFINE YOUR STYLE
            </span>

            <div className="product-filters-title-row">
              <SlidersHorizontal
                size={20}
                strokeWidth={1.8}
              />

              <h2 id="product-filters-title">
                Filters
              </h2>

              {activeFilterCount > 0 && (
                <span className="product-filters-count">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="product-filters-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X size={21} />
          </button>
        </div>

        {/* SCROLLABLE FILTER CONTENT */}

        <div className="product-filters-body">

          {/* CATEGORY */}

          <section className="product-filter-section">
            <h3>Category</h3>

            <div className="product-filter-select-wrap">
              <select
                value={selectedCategory}
                onChange={(event) =>
                  onCategoryChange(event.target.value)
                }
                className="product-filter-select"
                aria-label="Filter by category"
              >
                <option value="">
                  All Categories
                </option>

                {filteredCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {department === 'collections'
                      ? `${category.department?.name || ''} - ${category.name}`
                      : category.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="product-filter-select-chevron"
                aria-hidden="true"
              />
            </div>
          </section>

          {/* SUBCATEGORY */}

          <section className="product-filter-section">
            <h3>Subcategory</h3>

            <div className="product-filter-select-wrap">
              <select
                value={selectedSubcategory}
                onChange={(event) =>
                  onSubcategoryChange(event.target.value)
                }
                className="product-filter-select"
                aria-label="Filter by subcategory"
              >
                <option value="">
                  All Subcategories
                </option>

                {filteredSubcategories.map((subcategory) => (
                  <option
                    key={subcategory.id}
                    value={subcategory.id}
                  >
                    {department === 'collections'
                      ? `${subcategory.category?.department?.name || ''} - ${subcategory.name}`
                      : subcategory.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="product-filter-select-chevron"
                aria-hidden="true"
              />
            </div>
          </section>

          {/* PRICE RANGE */}

          <section className="product-filter-section">
            <h3>Price Range</h3>

            <p className="product-filter-hint">
              Set your preferred shopping budget.
            </p>

            <div className="product-filter-price">
              <label>
                <span>Minimum Price</span>

                <input
                  type="number"
                  min="0"
                  placeholder="₹ Min"
                  value={minPrice}
                  onChange={(event) =>
                    onMinPriceChange(event.target.value)
                  }
                />
              </label>

              <label>
                <span>Maximum Price</span>

                <input
                  type="number"
                  min="0"
                  placeholder="₹ Max"
                  value={maxPrice}
                  onChange={(event) =>
                    onMaxPriceChange(event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          {/* COLOUR */}

          <section className="product-filter-section">
            <div className="product-filter-section-heading">
              <h3>Colour</h3>

              {selectedColour !== null && (
                <button
                  type="button"
                  className="product-filter-inline-clear"
                  onClick={() => onColourChange(null)}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="product-filter-colours">
              {availableColours.map((colour) => (
                <label
                  key={colour.id}
                  className={
                    selectedColour === colour.id
                      ? 'selected'
                      : ''
                  }
                >
                  <input
                    type="radio"
                    name="product-colour"
                    value={colour.id}
                    checked={selectedColour === colour.id}
                    onChange={() =>
                      onColourChange(colour.id)
                    }
                  />

                  <span
                    className="product-filter-colour-swatch"
                    style={{
                      backgroundColor: colour.hex,
                    }}
                  />

                  <span>{colour.name}</span>
                </label>
              ))}
            </div>
          </section>

          {/* SIZE */}

          <section className="product-filter-section">
            <div className="product-filter-section-heading">
              <h3>Size</h3>

              {selectedSize && (
                <button
                  type="button"
                  className="product-filter-inline-clear"
                  onClick={() => onSizeChange('')}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="product-filter-sizes">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`product-filter-size ${
                    selectedSize === size
                      ? 'active'
                      : ''
                  }`}
                  aria-pressed={selectedSize === size}
                  onClick={() =>
                    onSizeChange(
                      selectedSize === size ? '' : size
                    )
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* TAGS */}

          <section className="product-filter-section">
            <h3>Shop By</h3>

            <p className="product-filter-hint">
              Explore collections that match your taste.
            </p>

            <div className="product-filter-options">
              {availableTags.map((tag) => (
                <label
                  key={tag.slug}
                  className={
                    selectedTags.includes(tag.slug)
                      ? 'selected'
                      : ''
                  }
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.slug)}
                    onChange={() =>
                      handleTagChange(tag.slug)
                    }
                  />

                  <span>{tag.label}</span>
                </label>
              ))}
            </div>
          </section>

        </div>

        {/* FOOTER */}

        <div className="product-filters-footer">
          <button
            type="button"
            className="product-filters-clear"
            onClick={onClearFilters}
          >
            <RotateCcw size={15} />
            Clear All
          </button>

          <button
            type="button"
            className="product-filters-apply"
            onClick={onClose}
          >
            Show Products
            <ArrowRight size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ProductFilters;
