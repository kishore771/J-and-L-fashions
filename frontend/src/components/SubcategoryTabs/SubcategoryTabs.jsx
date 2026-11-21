
import { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import './SubcategoryTabs.css';

const SubcategoryTabs = ({
  subcategories,
  department,
  selectedSubcategory,
  onSubcategoryChange,
}) => {
  const scrollRef = useRef(null);

  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.is_active &&
      subcategory.category?.department?.slug === department
  );

  if (availableSubcategories.length === 0) {
    return null;
  }

  const scrollTabs = (direction) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction * 250,
      behavior: 'smooth',
    });
  };

  return (
    <div className="subcategory-section">

      {/* SECTION HEADER */}

      <div className="subcategory-section-header">
        <div className="subcategory-section-title">
          <Sparkles
            size={15}
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <span>Explore Categories</span>
        </div>

        {/* SCROLL CONTROLS */}

        <div className="subcategory-scroll-controls">
          <button
            type="button"
            onClick={() => scrollTabs(-1)}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={() => scrollTabs(1)}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* SUBCATEGORY TABS */}

      <div
        ref={scrollRef}
        className="subcategory-tabs"
        role="group"
        aria-label={`${department} subcategories`}
      >
        <button
          type="button"
          className={`subcategory-tab ${
            !selectedSubcategory ? 'active' : ''
          }`}
          aria-pressed={!selectedSubcategory}
          onClick={() => onSubcategoryChange('')}
        >
          All Products
        </button>

        {availableSubcategories.map((subcategory) => {
          const isActive =
            String(selectedSubcategory) ===
            String(subcategory.id);

          return (
            <button
              key={subcategory.id}
              type="button"
              className={`subcategory-tab ${
                isActive ? 'active' : ''
              }`}
              aria-pressed={isActive}
              onClick={() =>
                onSubcategoryChange(
                  String(subcategory.id)
                )
              }
            >
              {subcategory.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubcategoryTabs;
