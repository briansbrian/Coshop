import express from 'express';
import {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  updateInventory,
  getProductsByBusiness,
  searchProducts
} from '../services/productService.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * POST /api/v1/products
 * Create a new product (SME only)
 */
router.post('/', authenticate, requireRole('sme'), async (req, res, next) => {
  try {
    const productData = req.body;
    const { businessId } = req.body;
    
    if (!businessId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_BUSINESS_ID',
          message: 'Business ID is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify the business belongs to the authenticated user
    const businessCheckResult = await req.app.locals.pool.query(
      'SELECT owner_id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessCheckResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'BUSINESS_NOT_FOUND',
          message: 'Business not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (businessCheckResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to create products for this business',
          timestamp: new Date().toISOString()
        }
      });
    }

    const product = await createProduct(businessId, productData);
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/products/search
 * Search products with filters (public)
 * Query params: keyword, category, minPrice, maxPrice, latitude, longitude, radius, sortBy, sortOrder, limit, offset
 */
router.get('/search', async (req, res, next) => {
  try {
    const searchParams = {
      keyword: req.query.keyword,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      latitude: req.query.latitude ? parseFloat(req.query.latitude) : undefined,
      longitude: req.query.longitude ? parseFloat(req.query.longitude) : undefined,
      radius: req.query.radius ? parseFloat(req.query.radius) : undefined,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const products = await searchProducts(searchParams);
    
    res.status(200).json({
      products,
      count: products.length,
      params: searchParams
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/products/:id
 * Get product details by ID (public)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await getProductById(id);
    
    res.status(200).json({
      product
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/products/:id
 * Update product (business owner only)
 */
router.put('/:id', authenticate, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get the business ID for this product
    const productResult = await req.app.locals.pool.query(
      `SELECT p.business_id, b.owner_id
       FROM products p
       JOIN businesses b ON p.business_id = b.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { business_id, owner_id } = productResult.rows[0];

    if (owner_id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this product',
          timestamp: new Date().toISOString()
        }
      });
    }

    const product = await updateProduct(id, business_id, updateData);
    
    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/products/:id
 * Delete product (business owner only)
 */
router.delete('/:id', authenticate, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the business ID for this product
    const productResult = await req.app.locals.pool.query(
      `SELECT p.business_id, b.owner_id
       FROM products p
       JOIN businesses b ON p.business_id = b.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { business_id, owner_id } = productResult.rows[0];

    if (owner_id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this product',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await deleteProduct(id, business_id);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/products/:id/inventory
 * Update product inventory quantity (business owner only)
 */
router.patch('/:id/inventory', authenticate, requireRole('sme'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const quantityData = req.body;
    
    // Get the business ID for this product
    const productResult = await req.app.locals.pool.query(
      `SELECT p.business_id, b.owner_id
       FROM products p
       JOIN businesses b ON p.business_id = b.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { business_id, owner_id } = productResult.rows[0];

    if (owner_id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this product inventory',
          timestamp: new Date().toISOString()
        }
      });
    }

    const product = await updateInventory(id, business_id, quantityData);
    
    res.status(200).json({
      message: 'Inventory updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

export default router;
