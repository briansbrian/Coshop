/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks user roles and permissions for protected routes
 */

/**
 * Require specific user type(s)
 * @param {...string} allowedTypes - Allowed user types (e.g., 'sme', 'consumer')
 * @returns {Function} Express middleware function
 */
export const requireRole = (...allowedTypes) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be authenticated to access this resource',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check if user has required role
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required role: ${allowedTypes.join(' or ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    next();
  };
};

/**
 * Require SME role
 * Shorthand for requireRole('sme')
 */
export const requireSME = requireRole('sme');

/**
 * Require consumer role
 * Shorthand for requireRole('consumer')
 */
export const requireConsumer = requireRole('consumer');

/**
 * Check if user owns the resource
 * @param {Function} getResourceOwnerId - Function that extracts owner ID from request
 * @returns {Function} Express middleware function
 */
export const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'You must be authenticated to access this resource',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Get resource owner ID
      const ownerId = await getResourceOwnerId(req);
      
      // Check if user owns the resource
      if (req.user.id !== ownerId) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to access this resource',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is SME and owns the business
 * @param {Function} getBusinessOwnerId - Function that extracts business owner ID
 * @returns {Function} Express middleware function
 */
export const requireBusinessOwnership = (getBusinessOwnerId) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'You must be authenticated to access this resource',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Check if user is SME
      if (req.user.userType !== 'sme') {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only SME users can access this resource',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Get business owner ID
      const ownerId = await getBusinessOwnerId(req);
      
      // Check if user owns the business
      if (req.user.id !== ownerId) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to manage this business',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Allow multiple roles or ownership
 * @param {Array<string>} allowedRoles - Allowed user types
 * @param {Function} getResourceOwnerId - Function to get resource owner ID
 * @returns {Function} Express middleware function
 */
export const requireRoleOrOwnership = (allowedRoles, getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'You must be authenticated to access this resource',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Check if user has required role
      if (allowedRoles.includes(req.user.userType)) {
        return next();
      }
      
      // Check if user owns the resource
      const ownerId = await getResourceOwnerId(req);
      if (req.user.id === ownerId) {
        return next();
      }
      
      // Neither role nor ownership matched
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  };
};
