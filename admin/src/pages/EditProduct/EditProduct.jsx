
import './EditProduct.css';
import '../AddProduct/AddProduct.css';

import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';

import { AuthContext } from '../../context/AuthContext';

import {
  getProductById,
  updateProduct,
  getDepartments,
  getCategories,
  getSubcategories,
  getPatterns,
  getFits,
  getSleeveLengths,
  getOccasions,
  getTags,
  getColours,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
} from '../../services/api';

const createEmptyVariant = () => ({
  id: null,
  sku: '',
  size: '',
  colour: '',
  price: '',
  sale_price: '',
  stock: '0',
  low_stock_threshold: '5',
});

const EditProduct = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

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

  const [variants, setVariants] = useState([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);

  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [primaryImage, setPrimaryImage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          productData,
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
          getProductById(id),
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

        setProduct(productData);

        setDepartments(departmentData);
        setCategories(categoryData);
        setSubcategories(subcategoryData);
        setPatterns(patternData);
        setFits(fitData);
        setSleeveLengths(sleeveLengthData);
        setOccasions(occasionData);
        setTags(tagData);
        setColours(colourData);

        setSelectedDepartment(
          String(productData.subcategory.category.department.id)
        );

        setSelectedCategory(
          String(productData.subcategory.category.id)
        );

        setSelectedSubcategory(
          String(productData.subcategory.id)
        );

        setFormData({
          name: productData.name,
          sku: productData.sku,
          slug: productData.slug,
          short_description: productData.short_description,
          description: productData.description,
          pattern: productData.pattern?.id
            ? String(productData.pattern.id)
            : '',
          fit: productData.fit?.id
            ? String(productData.fit.id)
            : '',
          sleeve_length: productData.sleeve_length?.id
            ? String(productData.sleeve_length.id)
            : '',
          occasion: productData.occasion?.id
            ? String(productData.occasion.id)
            : '',
          tags: productData.tags?.map((tag) => tag.id) || [],
        });

        setVariants(
          (productData.variants || []).map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            size: variant.size,
            colour: String(variant.colour.id),
            price: String(variant.price),
            sale_price: variant.sale_price == null
              ? ''
              : String(variant.sale_price),
            stock: String(variant.stock),
            low_stock_threshold: String(
              variant.low_stock_threshold
            ),
          }))
        );

        const loadedImages = (productData.images || []).map(
          (image) => ({
            ...image,
            image: image.image,
            is_primary: image.is_primary,
            alt_text: image.alt_text || '',
            file: null,
          })
        );

        setExistingImages(loadedImages);

        const primary = loadedImages.find(
          (image) => image.is_primary
        );

        setPrimaryImage(
          primary ? `existing-${primary.id}` : ''
        );

      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  // VARIANT HANDLERS

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
    const variant = variants[index];

    if (variant.id) {
      setDeletedVariantIds((previousIds) => [
        ...previousIds,
        variant.id,
      ]);
    }

    setVariants((previousVariants) =>
      previousVariants.filter(
        (_, variantIndex) => variantIndex !== index
      )
    );
  };

  // IMAGE HANDLERS

  const handleNewImageChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    const addedImages = selectedFiles.map((file) => ({
      file,
      alt_text: formData.name,
      is_primary: false,
    }));

    setNewImages((previousImages) => [
      ...previousImages,
      ...addedImages,
    ]);

    event.target.value = '';
  };

  const handleExistingImageChange = (imageId, event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setExistingImages((previousImages) =>
      previousImages.map((image) =>
        image.id === imageId
          ? { ...image, file }
          : image
      )
    );
  };

  const handleExistingImageAltChange = (imageId, value) => {
    setExistingImages((previousImages) =>
      previousImages.map((image) =>
        image.id === imageId
          ? { ...image, alt_text: value }
          : image
      )
    );
  };

  const handleNewImageAltChange = (index, value) => {
    setNewImages((previousImages) =>
      previousImages.map((image, imageIndex) =>
        imageIndex === index
          ? { ...image, alt_text: value }
          : image
      )
    );
  };

  const removeExistingImage = (imageId) => {
    setDeletedImageIds((previousIds) => [
      ...previousIds,
      imageId,
    ]);

    setExistingImages((previousImages) =>
      previousImages.filter(
        (image) => image.id !== imageId
      )
    );

    if (primaryImage === `existing-${imageId}`) {
      setPrimaryImage('');
    }
  };

  const removeNewImage = (index) => {
    setNewImages((previousImages) =>
      previousImages.filter(
        (_, imageIndex) => imageIndex !== index
      )
    );

    if (primaryImage === `new-${index}`) {
      setPrimaryImage('');
    }

    // Keep the selected new-image index in sync.
    setPrimaryImage((previousPrimary) => {
      if (previousPrimary === `new-${index}`) return '';

      if (previousPrimary?.startsWith('new-')) {
        const selectedIndex = Number(
          previousPrimary.replace('new-', '')
        );

        if (selectedIndex > index) {
          return `new-${selectedIndex - 1}`;
        }
      }

      return previousPrimary;
    });
  };

  // SUBMIT

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setIsSubmitting(true);

      if (!selectedSubcategory) {
        throw new Error('Please select a subcategory.');
      }

      if (variants.length === 0) {
        throw new Error('A product must have at least one variant.');
      }

      if (existingImages.length + newImages.length === 0) {
        throw new Error('A product must have at least one image.');
      }

      if (
        existingImages.length + newImages.length > 0 &&
        !primaryImage
      ) {
        throw new Error('Please select a primary product image.');
      }

      // Validate all variants before sending requests.
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

      // 1. Update main product information.
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

        dimensions: product.dimensions || {},
      };

      await updateProduct(id, productData, token);

      // 2. Update existing variants and create new ones.
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

        if (variant.id) {
          await updateProductVariant(
            variant.id,
            variantData,
            token
          );
        } else {
          await createProductVariant(
            id,
            variantData,
            token
          );
        }
      }

      // 3. Delete removed variants.
      for (const variantId of deletedVariantIds) {
        await deleteProductVariant(variantId, token);
      }

      // 4. Delete removed images.
      for (const imageId of deletedImageIds) {
        await deleteProductImage(imageId, token);
      }

      // 5. Update existing images.
      // First save them as non-primary. We set the chosen
      // primary image separately after all uploads.
      for (const image of existingImages) {
        const imageData = new FormData();

        if (image.file) {
          imageData.append('image', image.file);
        }

        imageData.append('is_primary', 'false');
        imageData.append('alt_text', image.alt_text);
        imageData.append(
          'image_order',
          String(image.image_order || 0)
        );

        await updateProductImage(
          image.id,
          imageData,
          token
        );
      }

      // 6. Upload new images as non-primary initially.
      const createdImageIds = [];

      for (let index = 0; index < newImages.length; index++) {
        const image = newImages[index];
        const imageData = new FormData();

        imageData.append('image', image.file);
        imageData.append('is_primary', 'false');
        imageData.append(
          'image_order',
          String(existingImages.length + index)
        );
        imageData.append('alt_text', image.alt_text);

        const createdImage = await uploadProductImage(
          id,
          imageData,
          token
        );

        createdImageIds.push(createdImage.id);
      }

      // 7. Set the selected image as primary.
      if (primaryImage.startsWith('existing-')) {
        const primaryId = Number(
          primaryImage.replace('existing-', '')
        );

        const primaryData = new FormData();
        primaryData.append('is_primary', 'true');

        await updateProductImage(
          primaryId,
          primaryData,
          token
        );
      }

      if (primaryImage.startsWith('new-')) {
        const selectedIndex = Number(
          primaryImage.replace('new-', '')
        );

        const primaryId = createdImageIds[selectedIndex];

        if (!primaryId) {
          throw new Error('Unable to identify the primary image.');
        }

        const primaryData = new FormData();
        primaryData.append('is_primary', 'true');

        await updateProductImage(
          primaryId,
          primaryData,
          token
        );
      }

      navigate('/admin/products');

    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <p className="edit-product-message">
        Loading product details...
      </p>
    );
  }

  if (!product) {
    return (
      <p className="edit-product-error">
        {error || 'Product not found.'}
      </p>
    );
  }

  return (
    <div className="edit-product-page">

      <div className="edit-product-header">
        <h1>Edit Product</h1>
        <p>Update the details for {product.name}.</p>
      </div>

      <form
        className="edit-product-form"
        onSubmit={handleSubmit}
      >

        {error && (
          <p className="edit-product-error">{error}</p>
        )}

        {/* CATEGORY INFORMATION */}

        <section className="product-form-section">
          <h2>Category Information</h2>

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
                <option key={department.id} value={department.id}>
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
              required
            >
              <option value="">Select Category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
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
              required
            >
              <option value="">Select Subcategory</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* BASIC INFORMATION */}

        <section className="product-form-section">
          <h2>Basic Information</h2>

          {[
            ['name', 'Product Name'],
            ['sku', 'Product SKU'],
            ['slug', 'Slug'],
            ['short_description', 'Short Description'],
          ].map(([name, label]) => (
            <div className="product-form-group" key={name}>
              <label>{label}</label>
              <input
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="product-form-group">
            <label>Description</label>
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
        </section>

        {/* PRODUCT ATTRIBUTES */}

        <section className="product-form-section">
          <h2>Product Attributes</h2>

          {[
            ['pattern', 'Pattern', patterns],
            ['fit', 'Fit', fits],
            ['sleeve_length', 'Sleeve Length', sleeveLengths],
            ['occasion', 'Occasion', occasions],
          ].map(([name, label, options]) => (
            <div className="product-form-group" key={name}>
              <label>{label}</label>
              <select
                name={name}
                value={formData[name]}
                onChange={handleChange}
              >
                <option value="">Select {label}</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="product-form-group">
            <label>Tags</label>
            <select
              multiple
              value={formData.tags.map(String)}
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
            <small>Hold Ctrl to select multiple tags.</small>
          </div>
        </section>

        {/* VARIANTS AND PRICING */}

        <section className="product-form-section">
          <h2>Product Variants & Pricing</h2>

          {variants.map((variant, index) => (
            <div className="product-form-section" key={variant.id || `new-${index}`}>
              <h3>
                Variant {index + 1}
                {variant.id ? ` (ID: ${variant.id})` : ' (New)'}
              </h3>

              {[
                ['sku', 'Variant SKU'],
                ['size', 'Size'],
                ['price', 'Regular Price'],
                ['sale_price', 'Sale Price'],
                ['stock', 'Stock Quantity'],
                ['low_stock_threshold', 'Low Stock Threshold'],
              ].map(([name, label]) => (
                <div className="product-form-group" key={name}>
                  <label>{label}</label>
                  <input
                    type={
                      ['price', 'sale_price'].includes(name)
                        ? 'number'
                        : ['stock', 'low_stock_threshold'].includes(name)
                          ? 'number'
                          : 'text'
                    }
                    name={name}
                    min={
                      ['price', 'sale_price'].includes(name)
                        ? '0.01'
                        : ['stock', 'low_stock_threshold'].includes(name)
                          ? '0'
                          : undefined
                    }
                    step={
                      ['price', 'sale_price'].includes(name)
                        ? '0.01'
                        : undefined
                    }
                    value={variant[name]}
                    onChange={(event) =>
                      handleVariantChange(index, event)
                    }
                    required={
                      name !== 'sale_price'
                    }
                  />
                </div>
              ))}

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
                    <option key={colour.id} value={colour.id}>
                      {colour.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => removeVariant(index)}
                disabled={variants.length === 1}
              >
                Remove Variant
              </button>
            </div>
          ))}

          <button type="button" onClick={addVariant}>
            + Add Another Variant
          </button>
        </section>

        {/* EXISTING PRODUCT IMAGES */}

        <section className="product-form-section">
          <h2>Existing Product Images</h2>

          {existingImages.length === 0 && (
            <p>No existing images.</p>
          )}

          {existingImages.map((image) => (
            <div className="product-form-section" key={image.id}>
              <h3>Image {image.id}</h3>

              <img
                src={image.file
                  ? URL.createObjectURL(image.file)
                  : image.image}
                alt={image.alt_text || product.name}
                style={{
                  width: '180px',
                  height: '180px',
                  objectFit: 'cover',
                }}
              />

              <p>
                {image.is_primary
                  ? 'Current primary image'
                  : 'Additional image'}
              </p>

              <div className="product-form-group">
                <label>Replace Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleExistingImageChange(image.id, event)
                  }
                />
              </div>

              <div className="product-form-group">
                <label>Alt Text</label>
                <input
                  value={image.alt_text}
                  onChange={(event) =>
                    handleExistingImageAltChange(
                      image.id,
                      event.target.value
                    )
                  }
                />
              </div>

              <label>
                <input
                  type="radio"
                  name="primary-image"
                  checked={primaryImage === `existing-${image.id}`}
                  onChange={() =>
                    setPrimaryImage(`existing-${image.id}`)
                  }
                />
                Set as primary image
              </label>

              <button
                type="button"
                onClick={() => removeExistingImage(image.id)}
              >
                Delete Image
              </button>
            </div>
          ))}
        </section>

        {/* NEW PRODUCT IMAGES */}

        <section className="product-form-section">
          <h2>Add More Images</h2>

          <div className="product-form-group">
            <label>Select Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewImageChange}
            />
          </div>

          {newImages.map((image, index) => (
            <div className="product-form-section" key={index}>
              <h3>{image.file.name}</h3>

              <div className="product-form-group">
                <label>Alt Text</label>
                <input
                  value={image.alt_text}
                  onChange={(event) =>
                    handleNewImageAltChange(index, event.target.value)
                  }
                />
              </div>

              <label>
                <input
                  type="radio"
                  name="primary-image"
                  checked={primaryImage === `new-${index}`}
                  onChange={() =>
                    setPrimaryImage(`new-${index}`)
                  }
                />
                Set as primary image
              </label>

              <button
                type="button"
                onClick={() => removeNewImage(index)}
              >
                Remove Image
              </button>
            </div>
          ))}
        </section>

        {/* FORM ACTIONS */}

        <div className="edit-product-actions">
          <button
            type="button"
            className="edit-product-cancel"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="edit-product-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditProduct;
