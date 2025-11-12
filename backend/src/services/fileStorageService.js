/**
 * File Storage Service
 * Handles file storage operations and URL generation
 * Requirements: 1.4, 2.1, 5.3
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { NotFoundError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

/**
 * Generate file URL from filename
 * @param {string} filename - The stored filename
 * @param {object} req - Express request object (to get base URL)
 * @returns {string} - Full URL to access the file
 */
export const generateFileUrl = (filename, req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * Generate file URLs for multiple files
 * @param {Array<string>} filenames - Array of stored filenames
 * @param {object} req - Express request object
 * @returns {Array<string>} - Array of full URLs
 */
export const generateFileUrls = (filenames, req) => {
  return filenames.map(filename => generateFileUrl(filename, req));
};

/**
 * Save uploaded file and return URL
 * @param {object} file - Multer file object
 * @param {object} req - Express request object
 * @returns {object} - File information with URL
 */
export const saveFile = (file, req) => {
  if (!file) {
    return null;
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: generateFileUrl(file.filename, req)
  };
};

/**
 * Save multiple uploaded files and return URLs
 * @param {Array<object>} files - Array of Multer file objects
 * @param {object} req - Express request object
 * @returns {Array<object>} - Array of file information with URLs
 */
export const saveFiles = (files, req) => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map(file => saveFile(file, req));
};

/**
 * Delete a file from storage
 * @param {string} filename - The filename to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const deleteFile = async (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('File not found');
    }
    throw error;
  }
};

/**
 * Delete multiple files from storage
 * @param {Array<string>} filenames - Array of filenames to delete
 * @returns {Promise<object>} - Results of deletion operations
 */
export const deleteFiles = async (filenames) => {
  const results = {
    deleted: [],
    failed: []
  };

  for (const filename of filenames) {
    try {
      await deleteFile(filename);
      results.deleted.push(filename);
    } catch (error) {
      results.failed.push({ filename, error: error.message });
    }
  }

  return results;
};

/**
 * Check if file exists
 * @param {string} filename - The filename to check
 * @returns {Promise<boolean>} - True if file exists
 */
export const fileExists = async (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file information
 * @param {string} filename - The filename
 * @returns {Promise<object>} - File stats
 */
export const getFileInfo = async (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename);
    const stats = await fs.stat(filePath);
    return {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('File not found');
    }
    throw error;
  }
};
