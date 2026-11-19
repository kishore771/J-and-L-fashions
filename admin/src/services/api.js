const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";


export const adminLogin = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Login failed. Please try again.');
  }

  return data.token;
};




export const getProducts = async (token, page = 1) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/products/?page=${page}`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Unable to fetch admin products.');
  }

  const data = await response.json();

  return data;
};



export const createProduct = async (productData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      JSON.stringify(data) || 'Unable to create product.'
    );
  }

  return data;
};

export const getDepartments = async () => {
  const response = await fetch(`${API_BASE_URL}/api/departments/`);
  if (!response.ok) {
    throw new Error('Unable to fetch departments.');
  }

  const data = await response.json();
  return data.results || data;
};

export const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/api/categories/`);

  if (!response.ok) {
    throw new Error('Unable to fetch categories.');
  }

  const data = await response.json();
  return data.results || data;
};

export const getSubcategories = async () => {
  let url = `${API_BASE_URL}/api/subcategories/`;
  const subcategories = [];

  while (url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Unable to fetch subcategories.');
    }

    const data = await response.json();

    subcategories.push(...(data.results || data));
    url = data.next;
  }

  return subcategories;
};

export const getPatterns = async () => {
  const response = await fetch(`${API_BASE_URL}/api/patterns/`);
  if (!response.ok) throw new Error('Unable to fetch patterns.');
  const data = await response.json();
  return data.results || data;
};

export const getFits = async () => {
  const response = await fetch(`${API_BASE_URL}/api/fits/`);
  if (!response.ok) throw new Error('Unable to fetch fits.');
  const data = await response.json();
  return data.results || data;
};

export const getSleeveLengths = async () => {
  const response = await fetch(`${API_BASE_URL}/api/sleeve-lengths/`);
  if (!response.ok) throw new Error('Unable to fetch sleeve lengths.');
  const data = await response.json();
  return data.results || data;
};

export const getOccasions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/occasions/`);
  if (!response.ok) throw new Error('Unable to fetch occasions.');
  const data = await response.json();
  return data.results || data;
};

export const getColours = async () => {
  let url = `${API_BASE_URL}/api/colours/`;
  const colours = [];

  while (url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Unable to fetch colours.');
    }

    const data = await response.json();

    colours.push(...(data.results || data));
    url = data.next || null;
  }

  return colours;
};

export const getTags = async () => {
  const response = await fetch(`${API_BASE_URL}/api/tags/`);

  if (!response.ok) {
    throw new Error('Unable to fetch tags.');
  }

  const data = await response.json();
  return data.results || data;
};

export const getProductById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${id}/`);

  if (!response.ok) {
    throw new Error('Unable to fetch product details.');
  }

  return await response.json();
};


export const updateProduct = async (id, productData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/update/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data) || 'Unable to update product.');
  }

  return data;
};

export const deactivateProduct = async (id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/products/${id}/deactivate/`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || 'Unable to deactivate product.'
    );
  }

  return data;
};

export const adminLogout = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Logout failed.');
  }

  return data;
};

export const createProductVariant = async (productId, variantData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/products/${productId}/variants/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(variantData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data) || 'Unable to create product variant.');
  }

  return data;
};


export const uploadProductImage = async (productId, imageData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/products/${productId}/images/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: imageData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data) || 'Unable to upload product image.');
  }

  return data;
};

export const updateProductImage = async (imageId, imageData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/product-images/${imageId}/update/`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: imageData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data) || 'Unable to update product image.');
  }

  return data;
};

export const deleteProductImage = async (imageId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/product-images/${imageId}/delete/`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Unable to delete product image.');
  }
};

export const updateProductVariant = async (variantId, variantData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/product-variants/${variantId}/update/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(variantData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data) || 'Unable to update variant.');
  }

  return data;
};

export const deleteProductVariant = async (variantId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/product-variants/${variantId}/delete/`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Unable to delete variant.');
  }

};



export const uploadBulkProducts = async (excelFile, token) => {
  const formData = new FormData();

  formData.append('file', excelFile);

  const response = await fetch(
    `${API_BASE_URL}/api/admin/products/bulk-upload/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (Array.isArray(data.errors)) {
      throw new Error(data.errors.join('\n'));
    }

    throw new Error(
      data.error ||
      data.detail ||
      'Unable to upload Excel file.'
    );
  }

  return data;
};


export const getOrders = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/manage/`,
    {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      'Unable to fetch customer orders.'
    );
  }

  const data = await response.json();

  return data;
};
