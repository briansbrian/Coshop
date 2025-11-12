import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import productRoutes from './routes/productRoutes.js';
import geolocationRoutes from './routes/geolocationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { requestLogger } from './utils/logger.js';
import { 
  enhancedErrorHandler, 
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException
} from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up global error handlers
handleUnhandledRejection();
handleUncaughtException();

const app = express();

// Make database pool available to routes
app.locals.pool = pool;
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CoShop API is running' });
});

// API routes
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({ 
    message: 'CoShop Marketplace API',
    version: API_VERSION
  });
});

// Authentication routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// Business routes
app.use(`/api/${API_VERSION}/businesses`, businessRoutes);

// Product routes
app.use(`/api/${API_VERSION}/products`, productRoutes);

// Geolocation routes
app.use(`/api/${API_VERSION}/geolocation`, geolocationRoutes);

// Order routes
app.use(`/api/${API_VERSION}/orders`, orderRoutes);

// Rating routes
app.use(`/api/${API_VERSION}/ratings`, ratingRoutes);

// Notification routes
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

// Upload routes
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Enhanced error handling middleware
app.use(enhancedErrorHandler);

app.listen(PORT, () => {
  console.log(`CoShop Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
