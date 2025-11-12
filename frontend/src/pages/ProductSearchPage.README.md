# Product Search and Browse Feature

## Overview
This feature implements a comprehensive product search and browse experience for consumers to discover products from local SMEs.

## Components

### ProductSearchPage
- **Location**: `frontend/src/pages/ProductSearchPage.jsx`
- **Route**: `/products`
- **Access**: Public (no authentication required)

#### Features
1. **Search Filters**
   - Keyword search (product name/description)
   - Category filter (predefined categories)
   - Price range filter (min/max)
   - Location-based filter (near user's location with radius)
   
2. **Sorting Options**
   - Sort by: Newest, Price, Name, Distance (when location enabled)
   - Sort order: Ascending/Descending

3. **Product Grid Display**
   - Responsive grid layout (1-3 columns based on screen size)
   - Product cards showing:
     - Product image (or placeholder)
     - Product name and description
     - Price
     - Category badge
     - Business name
     - Distance (when location filter is active)
     - Stock status
   - Quick "Add to Cart" button
   - "View Details" link

4. **User Experience**
   - Loading states with skeleton screens
   - Empty state when no products found
   - Error handling with user-friendly messages
   - Filter persistence via URL query parameters
   - Clear filters functionality

### ProductDetailPage
- **Location**: `frontend/src/pages/ProductDetailPage.jsx`
- **Route**: `/products/:id`
- **Access**: Public (no authentication required)

#### Features
1. **Product Information**
   - Image gallery with thumbnail navigation
   - Product name, description, and category
   - Current price
   - Stock status and quantity available
   - Business information with link to business profile

2. **Shopping Actions**
   - Quantity selector (respects available stock)
   - Add to cart button (redirects to login if not authenticated)
   - Continue shopping link

3. **User Experience**
   - Breadcrumb navigation
   - Loading state
   - Error handling for non-existent products
   - Out of stock overlay on images
   - Responsive design for mobile and desktop

## API Integration

### Search Products
- **Endpoint**: `GET /api/v1/products/search`
- **Parameters**:
  - `keyword`: Search term for product name/description
  - `category`: Filter by product category
  - `minPrice`: Minimum price filter
  - `maxPrice`: Maximum price filter
  - `latitude`: User's latitude (for location-based search)
  - `longitude`: User's longitude (for location-based search)
  - `radius`: Search radius in kilometers
  - `sortBy`: Field to sort by (created_at, price, name, distance)
  - `sortOrder`: Sort direction (ASC, DESC)
  - `limit`: Number of results per page
  - `offset`: Pagination offset

### Get Product Details
- **Endpoint**: `GET /api/v1/products/:id`
- **Returns**: Complete product information including business details

## State Management

### Cart Store Integration
Both pages integrate with the Zustand cart store:
- `addItem(product, quantity)`: Add product to cart
- Cart state persists across page navigation

### Auth Store Integration
- Checks authentication status
- Redirects to login when unauthenticated users try to add to cart

## Responsive Design
- Mobile-first approach using Tailwind CSS
- Breakpoints:
  - Mobile: Single column grid
  - Tablet (sm): 2 column grid
  - Desktop (lg): 3 column grid, sidebar filters

## Future Enhancements
- Pagination for large result sets
- Product ratings display
- Wishlist/favorites functionality
- Product comparison feature
- Advanced filters (ratings, verified businesses)
- Recently viewed products
- Related products suggestions
