
import './SubcategoryTabs.css';

const SubcategoryTabs = ({
  subcategories,
  department,
  selectedSubcategory,
  onSubcategoryChange,
}) => {
  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.is_active &&
      subcategory.category?.department?.slug === department
  );

  if (availableSubcategories.length === 0) return null;

  return (
    <div
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

      {availableSubcategories.map((subcategory) => (
        <button
          key={subcategory.id}
          type="button"
          className={`subcategory-tab ${
            String(selectedSubcategory) === String(subcategory.id)
              ? 'active'
              : ''
          }`}
          aria-pressed={
            String(selectedSubcategory) === String(subcategory.id)
          }
          onClick={() =>
            onSubcategoryChange(String(subcategory.id))
          }
        >
          {subcategory.name}
        </button>
      ))}
    </div>
  );
};

export default SubcategoryTabs;
