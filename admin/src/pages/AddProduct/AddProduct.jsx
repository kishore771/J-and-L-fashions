
import './AddProduct.css';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '../../context/AuthContext';

import {
  getDepartments,
  getCategories,
  getSubcategories,
  getPatterns,
  getFits,
  getSleeveLengths,
  getOccasions,
  getTags,
  getColours,
  createProduct,
  createProductVariant,
  uploadProductImage,
} from '../../services/api';

const createEmptyVariant = () => ({
  sku: '',
  size: '',
  colour: '',
  price: '',
  sale_price: '',
  stock: '0',
  low_stock_threshold: '5',
});

const AddProduct = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [patterns, setPatterns] = useState([]);
  const [fits, setFits] = useState([]);
  const [sleeveLengths, setSleeveLengths] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [tags, setTags] = useState([]);
  const [colours, setColours] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [variants, setVariants] = useState([
    createEmptyVariant(),
  ]);

  const [images, setImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState('0');
  const [altText, setAltText] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    slug: '',
    short_description: '',
    description: '',
    pattern: '',
    fit: '',
    sleeve_length: '',
    occasion: '',
    tags: [],
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [
          departmentData,
          categoryData,
          subcategoryData,
          patternData,
          fitData,
          sleeveLengthData,
          occasionData,
          tagData,
          colourData,
        ] = await Promise.all([
          getDepartments(),
          getCategories(),
          getSubcategories(),
          getPatterns(),
          getFits(),
          getSleeveLengths(),
          getOccasions(),
          getTags(),
          getColours(),
        ]);

        setDepartments(departmentData);
        setCategories(categoryData);
        setSubcategories(subcategoryData);
        setPatterns(patternData);
        setFits(fitData);
        setSleeveLengths(sleeveLengthData);
        setOccasions(occasionData);
        setTags(tagData);
        setColours(colourData);
      } catch (error) {
        console.error('Error fetching form data:', error);
        setSubmitError(error.message);
      }
    };

    fetchFormData();
  }, []);

  const filteredCategories = categories.filter(
    (category) =>
      category.department.id === Number(selectedDepartment)
  );

  const filteredSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.category.id === Number(selectedCategory)
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleVariantChange = (index, event) => {
    const { name, value } = event.target;

    setVariants((previousVariants) =>
      previousVariants.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, [name]: value }
          : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((previousVariants) => [
      ...previousVariants,
      createEmptyVariant(),
    ]);
  };

  const removeVariant = (index) => {
    setVariants((previousVariants) =>
      previousVariants.filter(
        (_, variantIndex) => variantIndex !== index
      )
    );
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setImages(selectedFiles);
    setPrimaryImageIndex('0');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitError('');
      setIsSubmitting(true);

      if (!selectedSubcategory) {
        throw new Error('Please select a subcategory.');
      }

      if (variants.length === 0) {
        throw new Error('Please add at least one product variant.');
      }

      if (images.length === 0) {
        throw new Error('Please upload at least one product image.');
      }

      for (const variant of variants) {
        if (
          !variant.sku.trim() ||
          !variant.size.trim() ||
          !variant.colour ||
          !variant.price ||
          Number(variant.price) <= 0
        ) {
          throw new Error(
            'Complete the SKU, size, colour and valid price for every variant.'
          );
        }

        if (
          variant.sale_price !== '' &&
          (
            Number(variant.sale_price) <= 0 ||
            Number(variant.sale_price) >= Number(variant.price)
          )
        ) {
          throw new Error(
            'Sale price must be greater than zero and lower than regular price.'
          );
        }
      }

      const productData = {
        ...formData,
        subcategory: Number(selectedSubcategory),
        pattern: formData.pattern
          ? Number(formData.pattern)
          : null,
        fit: formData.fit
          ? Number(formData.fit)
          : null,
        sleeve_length: formData.sleeve_length
          ? Number(formData.sleeve_length)
          : null,
        occasion: formData.occasion
          ? Number(formData.occasion)
          : null,
        dimensions: {},
      };

      // 1. Create the main product.
      const createdProduct = await createProduct(
        productData,
        token
      );

      // 2. Create each product variant.
      for (const variant of variants) {
        const variantData = {
          sku: variant.sku.trim(),
          size: variant.size.trim(),
          colour: Number(variant.colour),
          price: Number(variant.price),
          sale_price: variant.sale_price
            ? Number(variant.sale_price)
            : null,
          stock: Number(variant.stock),
          low_stock_threshold: Number(
            variant.low_stock_threshold
          ),
        };

        await createProductVariant(
          createdProduct.id,
          variantData,
          token
        );
      }

      // 3. Upload each product image.
      for (let index = 0; index < images.length; index++) {
        const imageData = new FormData();

        imageData.append('image', images[index]);
        imageData.append(
          'is_primary',
          String(index === Number(primaryImageIndex))
        );
        imageData.append('image_order', String(index));
        imageData.append(
          'alt_text',
          altText.trim() || formData.name
        );

        await uploadProductImage(
          createdProduct.id,
          imageData,
          token
        );
      }

      navigate('/admin/products');
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="add-product-page"
      onSubmit={handleSubmit}
    >
      <h1>Add Product</h1>
      <p>Add a new product to your catalogue.</p>

      {/* CATEGORY SELECTION */}
      <div className="product-form-section">
        <h2>Product Category</h2>

        <div className="product-form-group">
          <label>Department</label>
          <select
            value={selectedDepartment}
            onChange={(event) => {
              setSelectedDepartment(event.target.value);
              setSelectedCategory('');
              setSelectedSubcategory('');
            }}
            required
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="product-form-group">
          <label>Category</label>
          <select
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setSelectedSubcategory('');
            }}
            disabled={!selectedDepartment}
            required
          >
            <option value="">Select Category</option>
            {filteredCategories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="product-form-group">
          <label>Subcategory</label>
          <select
            value={selectedSubcategory}
            onChange={(event) =>
              setSelectedSubcategory(event.target.value)
            }
            disabled={!selectedCategory}
            required
          >
            <option value="">Select Subcategory</option>
            {filteredSubcategories.map((subcategory) => (
              <option
                key={subcategory.id}
                value={subcategory.id}
              >
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BASIC INFORMATION */}
      <div className="product-form-section">
        <h2>Basic Information</h2>

        <div className="product-form-group">
          <label htmlFor="name">Product Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="product-form-group">
          <label htmlFor="sku">Product SKU</label>
          <input
            id="sku"
            name="sku"
            type="text"
            value={formData.sku}
            onChange={handleChange}
            required
          />
        </div>

        <div className="product-form-group">
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            required
          />
        </div>

        <div className="product-form-group">
          <label htmlFor="short_description">
            Short Description
          </label>
          <input
            id="short_description"
            name="short_description"
            type="text"
            value={formData.short_description}
            onChange={handleChange}
          />
        </div>

        <div className="product-form-group">
          <label htmlFor="description">
            Full Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* PRODUCT ATTRIBUTES */}
      <div className="product-form-section">
        <h2>Product Attributes</h2>

        {[
          { name: 'pattern', label: 'Pattern', items: patterns },
          { name: 'fit', label: 'Fit', items: fits },
          {
            name: 'sleeve_length',
            label: 'Sleeve Length',
            items: sleeveLengths,
          },
          {
            name: 'occasion',
            label: 'Occasion',
            items: occasions,
          },
        ].map((attribute) => (
          <div
            className="product-form-group"
            key={attribute.name}
          >
            <label htmlFor={attribute.name}>
              {attribute.label}
            </label>

            <select
              id={attribute.name}
              name={attribute.name}
              value={formData[attribute.name]}
              onChange={handleChange}
            >
              <option value="">
                Select {attribute.label}
              </option>

              {attribute.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* PRODUCT TAGS */}
      <div className="product-form-section">
        <h2>Product Tags</h2>

        <div className="product-form-group">
          <label htmlFor="tags">Select Tags</label>

          <select
            id="tags"
            multiple
            value={formData.tags}
            onChange={(event) => {
              const selectedTags = Array.from(
                event.target.selectedOptions,
                (option) => Number(option.value)
              );

              setFormData((previousData) => ({
                ...previousData,
                tags: selectedTags,
              }));
            }}
          >
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          <small>
            Hold Ctrl (Windows) or Command (Mac) to select
            multiple tags.
          </small>
        </div>
      </div>

      {/* PRODUCT VARIANTS */}
      <div className="product-form-section">
        <h2>Product Variants & Pricing</h2>

        {variants.map((variant, index) => (
          <div
            className="product-form-section"
            key={index}
          >
            <h3>Variant {index + 1}</h3>

            <div className="product-form-group">
              <label>Variant SKU</label>
              <input
                name="sku"
                value={variant.sku}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                placeholder="e.g. KURTI-BLK-M"
                required
              />
            </div>

            <div className="product-form-group">
              <label>Size</label>
              <input
                name="size"
                value={variant.size}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                placeholder="e.g. S, M, L, XL"
                required
              />
            </div>

            <div className="product-form-group">
              <label>Colour</label>
              <select
                name="colour"
                value={variant.colour}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                required
              >
                <option value="">Select Colour</option>
                {colours.map((colour) => (
                  <option
                    key={colour.id}
                    value={colour.id}
                  >
                    {colour.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-form-group">
              <label>Regular Price</label>
              <input
                type="number"
                name="price"
                min="0.01"
                step="0.01"
                value={variant.price}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                placeholder="e.g. 1499"
                required
              />
            </div>

            <div className="product-form-group">
              <label>Sale Price (Optional)</label>
              <input
                type="number"
                name="sale_price"
                min="0.01"
                step="0.01"
                value={variant.sale_price}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                placeholder="e.g. 1199"
              />
            </div>

            <div className="product-form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock"
                min="0"
                value={variant.stock}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                required
              />
            </div>

            <div className="product-form-group">
              <label>Low Stock Threshold</label>
              <input
                type="number"
                name="low_stock_threshold"
                min="0"
                value={variant.low_stock_threshold}
                onChange={(event) =>
                  handleVariantChange(index, event)
                }
                required
              />
            </div>

            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
              >
                Remove Variant
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addVariant}
        >
          + Add Another Variant
        </button>
      </div>

      {/* PRODUCT IMAGES */}
      <div className="product-form-section">
        <h2>Product Images</h2>

        <div className="product-form-group">
          <label htmlFor="product-images">
            Upload Images
          </label>

          <input
            id="product-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
          />

          <small>
            You can select multiple product images.
          </small>
        </div>

        {images.length > 0 && (
          <div className="product-form-group">
            <label>Select Primary Image</label>

            <select
              value={primaryImageIndex}
              onChange={(event) =>
                setPrimaryImageIndex(event.target.value)
              }
            >
              {images.map((image, index) => (
                <option key={index} value={index}>
                  {image.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="product-form-group">
          <label htmlFor="alt-text">Image Alt Text</label>
          <input
            id="alt-text"
            type="text"
            value={altText}
            onChange={(event) =>
              setAltText(event.target.value)
            }
            placeholder="Describe the product image"
          />
        </div>

        {images.length > 0 && (
          <p>{images.length} image(s) selected.</p>
        )}
      </div>

      {/* FORM ACTIONS */}
      <div className="product-form-actions">
        {submitError && (
          <p className="form-error">{submitError}</p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Creating Product...'
            : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProduct;
