/**
 * File Upload Routes
 * Handles file upload endpoints
 * Requirements: 1.4, 2.1
 */

import express from 'express';
import { authenticate } from '../middleware/index.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';
import { saveFile, saveFiles } from '../services/fileStorageService.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * POST /api/v1/upload
 * Upload single or multiple files
 * Requires authentication
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res, next) => {
    // Determine if single or multiple files based on query parameter
    const uploadType = req.query.type || 'single';
    
    if (uploadType === 'multiple') {
      // Handle multiple file upload
      const multipleUpload = uploadMultiple('files', 10);
      multipleUpload(req, res, async (err) => {
        if (err) {
          return next(err);
        }
        
        if (!req.files || req.files.length === 0) {
          return next(new ValidationError('No files uploaded'));
        }
        
        const fileInfos = saveFiles(req.files, req);
        
        res.status(201).json({
          message: 'Files uploaded successfully',
          files: fileInfos,
          count: fileInfos.length
        });
      });
    } else {
      // Handle single file upload
      const singleUpload = uploadSingle('file');
      singleUpload(req, res, async (err) => {
        if (err) {
          return next(err);
        }
        
        if (!req.file) {
          return next(new ValidationError('No file uploaded'));
        }
        
        const fileInfo = saveFile(req.file, req);
        
        res.status(201).json({
          message: 'File uploaded successfully',
          file: fileInfo
        });
      });
    }
  })
);

/**
 * POST /api/v1/upload/single
 * Upload a single file
 * Requires authentication
 */
router.post(
  '/single',
  authenticate,
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }
    
    const fileInfo = saveFile(req.file, req);
    
    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  })
);

/**
 * POST /api/v1/upload/multiple
 * Upload multiple files (max 10)
 * Requires authentication
 */
router.post(
  '/multiple',
  authenticate,
  uploadMultiple('files', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }
    
    const fileInfos = saveFiles(req.files, req);
    
    res.status(201).json({
      message: 'Files uploaded successfully',
      files: fileInfos,
      count: fileInfos.length
    });
  })
);

export default router;
