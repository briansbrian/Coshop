import Joi from 'joi';
import pool from '../config/database.js';
import { getCached, setCached, deleteCachedPattern, generateSearchCacheKey } from '../utils/cacheUtils.js';

/**
 * Product Service
 * Handles product CRUD operations, inventory management, and product search
 */

// Predefined product categories
export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'food',
  'beverages',
  'home',
  'beauty',
  'health',
  'sports',
  'books',
  'toys',
  'automotive',
  'office',
  'garden',
  'pets',
  'other'
];

// Validation schemas
const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('').max(5000),
  price: Joi.number().positive().precision(2).required(),
  quantity: Joi.number().integer().min(0).required(),
  category: Joi.string().valid(...PRODUCT_CATEGORIES).required(),
  images: Joi.array().items(Joi.string().uri()).max(10).default([])
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  description: Joi.string().allow('').max(5000),
  price: Joi.number().positive().precision(2),
  quantity: Joi.number().integer().min(0),
  category: Joi.string().valid(...PRODUCT_CATEGORIES),
  images: Joi.array().items(Joi.string().uri()).max(10)
}).min(1);

const inventoryUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required()
});

/**
 * Create a new product
 */
export const createProduct = async (businessId, productData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = productCreateSchema.validate(productData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid product data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Verify business exists
    const businessResult = await client.query(
      'SELECT id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'BUSINESS_NOT_FOUND',
        message: 'Business not found'
      };
    }

    // Insert product
    const productResult = await client.query(
      `INSERT INTO products (
        business_id, name, description, price, quantity, category, images, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, business_id, name, description, price, quantity, category, images, in_stock, created_at`,
      [
        businessId,
        value.name,
        value.description || '',
        value.price,
        value.quantity,
        value.category,
        value.images
      ]
    );

    await client.query('COMMIT');

    // Invalidate search cache when new product is created
    await deleteCachedPattern('products:search:*');

    const product = productResult.rows[0];
    
    return {
      id: product.id,
      businessId: product.business_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      quantity: product.quantity,
      category: product.category,
      images: product.images,
      inStock: product.in_stock,
      createdAt: product.created_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId) => {
  const result = await pool.query(
    `SELECT p.id, p.business_id, p.name, p.description, p.price, p.quantity, 
            p.category, p.images, p.in_stock, p.created_at, p.updated_at,
            b.name as business_name, b.rating as business_rating
     FROM products p
     JOIN businesses b ON p.business_id = b.id
     WHERE p.id = $1`,
    [productId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product not found'
    };
  }

  const product = result.rows[0];
  
  return {
    id: product.id,
    businessId: product.business_id,
    businessName: product.business_name,
    businessRating: parseFloat(product.business_rating),
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    quantity: product.quantity,
    category: product.category,
    images: product.images,
    inStock: product.in_stock,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
};

/**
 * Update product
 */
export const updateProduct = async (productId, businessId, updateData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = productUpdateSchema.validate(updateData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid product update data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Check if product exists and belongs to the business
    const productResult = await client.query(
      'SELECT id, business_id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found'
      };
    }

    if (productResult.rows[0].business_id !== businessId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this product'
      };
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (value.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(value.name);
    }

    if (value.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(value.description);
    }

    if (value.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(value.price);
    }

    if (value.quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(value.quantity);
    }

    if (value.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(value.category);
    }

    if (value.images !== undefined) {
      updates.push(`images = $${paramCount++}`);
      values.push(value.images);
    }

    if (updates.length === 0) {
      throw {
        status: 400,
        code: 'NO_UPDATES',
        message: 'No valid fields to update'
      };
    }

    // Add productId to values
    values.push(productId);

    // Execute update
    const updateQuery = `
      UPDATE products 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, business_id, name, description, price, quantity, category, images, in_stock, created_at, updated_at
    `;

    const result = await client.query(updateQuery, values);

    await client.query('COMMIT');

    // Invalidate search cache when product is updated
    await deleteCachedPattern('products:search:*');

    const product = result.rows[0];
    
    return {
      id: product.id,
      businessId: product.business_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      quantity: product.quantity,
      category: product.category,
      images: product.images,
      inStock: product.in_stock,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId, businessId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if product exists and belongs to the business
    const productResult = await client.query(
      'SELECT id, business_id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found'
      };
    }

    if (productResult.rows[0].business_id !== businessId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this product'
      };
    }

    // Delete product
    await client.query('DELETE FROM products WHERE id = $1', [productId]);

    await client.query('COMMIT');

    // Invalidate search cache when product is deleted
    await deleteCachedPattern('products:search:*');

    return { message: 'Product deleted successfully' };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update product inventory quantity
 */
export const updateInventory = async (productId, businessId, quantityData) => {
  const client = await pool.connect();
  
  try {
    // Validate input
    const { error, value } = inventoryUpdateSchema.validate(quantityData, { abortEarly: false });
    if (error) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid inventory data',
        details: error.details.map(d => d.message)
      };
    }

    await client.query('BEGIN');

    // Check if product exists and belongs to the business
    const productResult = await client.query(
      'SELECT id, business_id, quantity FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found'
      };
    }

    if (productResult.rows[0].business_id !== businessId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this product inventory'
      };
    }

    // Update inventory
    const result = await client.query(
      `UPDATE products 
       SET quantity = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, business_id, name, quantity, in_stock, updated_at`,
      [value.quantity, productId]
    );

    await client.query('COMMIT');

    // Invalidate search cache when inventory is updated
    await deleteCachedPattern('products:search:*');

    const product = result.rows[0];
    
    return {
      id: product.id,
      businessId: product.business_id,
      name: product.name,
      quantity: product.quantity,
      inStock: product.in_stock,
      updatedAt: product.updated_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get products by business ID
 */
export const getProductsByBusiness = async (businessId) => {
  const result = await pool.query(
    `SELECT id, business_id, name, description, price, quantity, category, images, in_stock, created_at, updated_at
     FROM products
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId]
  );

  return result.rows.map(product => ({
    id: product.id,
    businessId: product.business_id,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    quantity: product.quantity,
    category: product.category,
    images: product.images,
    inStock: product.in_stock,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  }));
};

/**
 * Search products with filters
 */
export const searchProducts = async (searchParams) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    latitude,
    longitude,
    radius, // in kilometers
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 50,
    offset = 0
  } = searchParams;

  // Generate cache key
  const cacheKey = generateSearchCacheKey(searchParams);
  
  // Try to get from cache
  const cachedResults = await getCached(cacheKey);
  if (cachedResults) {
    return cachedResults;
  }

  // Build WHERE clauses
  const whereClauses = [];
  const values = [];
  let paramCount = 1;

  // Keyword search (name or description)
  if (keyword) {
    whereClauses.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
    values.push(`%${keyword}%`);
    paramCount++;
  }

  // Category filter
  if (category) {
    whereClauses.push(`p.category = $${paramCount}`);
    values.push(category);
    paramCount++;
  }

  // Price range filters
  if (minPrice !== undefined) {
    whereClauses.push(`p.price >= $${paramCount}`);
    values.push(minPrice);
    paramCount++;
  }

  if (maxPrice !== undefined) {
    whereClauses.push(`p.price <= $${paramCount}`);
    values.push(maxPrice);
    paramCount++;
  }

  // Build SELECT clause with distance calculation if location provided
  let selectClause = `
    p.id, p.business_id, p.name, p.description, p.price, p.quantity, 
    p.category, p.images, p.in_stock, p.created_at,
    b.name as business_name, b.rating as business_rating,
    b.verified as business_verified,
    ST_Y(b.location::geometry) as business_latitude,
    ST_X(b.location::geometry) as business_longitude
  `;

  let distanceClause = '';
  if (latitude !== undefined && longitude !== undefined) {
    selectClause += `, ST_Distance(
      b.location,
      ST_GeogFromText('POINT(${longitude} ${latitude})')
    ) / 1000 as distance_km`;
    
    // Add radius filter if provided
    if (radius !== undefined) {
      whereClauses.push(`ST_DWithin(
        b.location,
        ST_GeogFromText('POINT(${longitude} ${latitude})'),
        ${radius * 1000}
      )`);
    }
  }

  // Build ORDER BY clause
  let orderByClause;
  const validSortFields = {
    'price': 'p.price',
    'created_at': 'p.created_at',
    'name': 'p.name',
    'rating': 'b.rating'
  };

  if (latitude !== undefined && longitude !== undefined && sortBy === 'distance') {
    orderByClause = `distance_km ${sortOrder}`;
  } else if (validSortFields[sortBy]) {
    orderByClause = `${validSortFields[sortBy]} ${sortOrder}`;
  } else {
    orderByClause = 'p.created_at DESC';
  }

  // Build final query
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  const query = `
    SELECT ${selectClause}
    FROM products p
    JOIN businesses b ON p.business_id = b.id
    ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  values.push(limit, offset);

  const result = await pool.query(query, values);

  const products = result.rows.map(product => ({
    id: product.id,
    businessId: product.business_id,
    businessName: product.business_name,
    businessRating: parseFloat(product.business_rating),
    businessVerified: product.business_verified,
    businessLocation: {
      latitude: product.business_latitude,
      longitude: product.business_longitude
    },
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    quantity: product.quantity,
    category: product.category,
    images: product.images,
    inStock: product.in_stock,
    createdAt: product.created_at,
    ...(product.distance_km !== undefined && { distanceKm: parseFloat(product.distance_km.toFixed(2)) })
  }));

  // Cache results for 5 minutes (300 seconds)
  await setCached(cacheKey, products, 300);

  return products;
};

/**
 * Get business owner ID by product ID
 * Helper function for authorization middleware
 */
export const getProductBusinessOwnerId = async (productId) => {
  const result = await pool.query(
    `SELECT b.owner_id
     FROM products p
     JOIN businesses b ON p.business_id = b.id
     WHERE p.id = $1`,
    [productId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product not found'
    };
  }

  return result.rows[0].owner_id;
};
