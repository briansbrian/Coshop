# Frontend Implementation

## Overview

The CoShop frontend is a React-based single-page application (SPA) that provides a complete user interface for consumers and SMEs. Built with modern tooling (Vite, React Router, Zustand), it offers an intuitive, mobile-responsive experience for marketplace interactions.

## Technology Stack

### Core Framework
- **React 18.2.0** - UI library with hooks and functional components
- **Vite 5.0.8** - Fast build tool and development server
- **React Router DOM 6.20.0** - Client-side routing

### State Management
- **Zustand 4.4.7** - Lightweight state management
  - Simpler than Redux
  - No boilerplate
  - React hooks integration

### HTTP Client
- **Axios 1.6.2** - Promise-based HTTP client
  - Request/response interceptors
  - Automatic token injection
  - Error handling

### Mapping
- **Leaflet 1.9.4** - Open-source mapping library
- **React-Leaflet 4.2.1** - React components for Leaflet
  - Interactive maps
  - Custom markers
  - Popups and tooltips

### Styling
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
  - Responsive design utilities
  - Custom color palette
  - Component classes

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── NotificationDropdown.jsx
│   │   ├── RatingModal.jsx
│   │   ├── SMERatingModal.jsx
│   │   ├── ConsumerTrustScore.jsx
│   │   └── LazyImage.jsx
│   ├── pages/               # Page components
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── MapPage.jsx
│   │   ├── ProductSearchPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── BusinessProfilePage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderConfirmationPage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── OrderDetailPage.jsx
│   │   ├── SMEDashboardPage.jsx
│   │   ├── DashboardOverviewPage.jsx
│   │   ├── BusinessProfileManagementPage.jsx
│   │   ├── ProductInventoryPage.jsx
│   │   ├── ProductFormPage.jsx
│   │   ├── SMEOrderManagementPage.jsx
│   │   ├── SMEOrderDetailPage.jsx
│   │   └── NotificationsPage.jsx
│   ├── services/            # API service modules
│   │   ├── authService.js
│   │   ├── businessService.js
│   │   ├── productService.js
│   │   ├── geolocationService.js
│   │   ├── orderService.js
│   │   ├── ratingService.js
│   │   ├── notificationService.js
│   │   ├── uploadService.js
│   │   └── index.js
│   ├── store/               # Zustand stores
│   │   ├── authStore.js
│   │   ├── cartStore.js
│   │   ├── notificationStore.js
│   │   └── index.js
│   ├── utils/               # Utility functions
│   │   └── apiClient.js
│   ├── App.jsx              # Root component with routing
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── package.json             # Dependencies
```

## State Management

### Auth Store (`authStore.js`)

**Purpose:** Manages user authentication state and tokens.

**State:**
```javascript
{
  user: null | {
    id: string,
    email: string,
    userType: 'sme' | 'consumer'
  },
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean
}
```

**Actions:**
- `login(user, accessToken, refreshToken)` - Sets user and tokens
- `logout()` - Clears user and tokens, removes from localStorage
- `updateTokens(accessToken, refreshToken)` - Updates tokens after refresh
- `initializeAuth()` - Loads auth state from localStorage on app start

**Persistence:**
- Tokens stored in localStorage
- Automatically loaded on app initialization
- Cleared on logout

### Cart Store (`cartStore.js`)

**Purpose:** Manages shopping cart state.

**State:**
```javascript
{
  items: [
    {
      product: { /* product object */ },
      quantity: number
    }
  ]
}
```

**Actions:**
- `addItem(product, quantity)` - Adds product to cart or updates quantity
- `removeItem(productId)` - Removes product from cart
- `updateQuantity(productId, quantity)` - Updates item quantity
- `clearCart()` - Empties cart
- `getCartTotal()` - Calculates total price
- `getItemCount()` - Returns total item count

**Business Logic:**
- Prevents duplicate products (updates quantity instead)
- Validates quantity > 0
- Groups items by business for checkout

### Notification Store (`notificationStore.js`)

**Purpose:** Manages notification state and unread count.

**State:**
```javascript
{
  notifications: [],
  unreadCount: 0,
  loading: boolean,
  error: string | null
}
```

**Actions:**
- `fetchNotifications(filters)` - Loads notifications from API
- `markAsRead(notificationId)` - Marks notification as read
- `fetchUnreadCount()` - Updates unread count
- `addNotification(notification)` - Adds new notification (for real-time updates)

**Auto-Refresh:**
- Unread count refreshed every 30 seconds
- Notifications refreshed on page load

## API Client

### Configuration (`apiClient.js`)

**Base Setup:**
```javascript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Request Interceptor:**
- Injects JWT access token from authStore
- Adds `Authorization: Bearer <token>` header
- Skips for public endpoints (login, register)

**Response Interceptor:**
- Handles 401 errors (token expired)
- Attempts token refresh using refresh token
- Retries original request with new token
- Logs out user if refresh fails

**Error Handling:**
- Extracts error message from response
- Provides fallback error messages
- Logs errors to console

## Service Modules

### Auth Service (`authService.js`)

**Functions:**
- `register(userData)` - POST /auth/register
- `login(credentials)` - POST /auth/login
- `refreshToken(refreshToken)` - POST /auth/refresh

**Integration:**
- Updates authStore on successful login/register
- Stores tokens in localStorage
- Handles authentication errors

### Business Service (`businessService.js`)

**Functions:**
- `createBusiness(businessData)` - POST /businesses
- `getBusinessById(id)` - GET /businesses/:id
- `updateBusiness(id, updateData)` - PUT /businesses/:id
- `deleteBusiness(id)` - DELETE /businesses/:id
- `getBusinessesByOwner(ownerId)` - GET /businesses/owner/:ownerId
- `getBusinessProducts(id)` - GET /businesses/:id/products

### Product Service (`productService.js`)

**Functions:**
- `createProduct(productData)` - POST /products
- `getProductById(id)` - GET /products/:id
- `updateProduct(id, updateData)` - PUT /products/:id
- `deleteProduct(id)` - DELETE /products/:id
- `updateInventory(id, quantity)` - PATCH /products/:id/inventory
- `searchProducts(searchParams)` - GET /products/search

**Search Parameters:**
- keyword, category, minPrice, maxPrice
- latitude, longitude, radius
- sortBy, sortOrder, limit, offset

### Geolocation Service (`geolocationService.js`)

**Functions:**
- `findNearbyBusinesses(params)` - GET /geolocation/nearby
- `calculateDistance(from, to)` - GET /geolocation/distance
- `getBusinessesInBounds(bounds)` - GET /geolocation/in-bounds
- `geocodeAddress(address)` - GET /geolocation/geocode
- `reverseGeocode(lat, lon)` - GET /geolocation/reverse-geocode

### Order Service (`orderService.js`)

**Functions:**
- `createOrder(orderData)` - POST /orders
- `getOrderById(id)` - GET /orders/:id
- `getUserOrders(filters)` - GET /orders
- `updateOrderStatus(id, status)` - PATCH /orders/:id/status

### Rating Service (`ratingService.js`)

**Functions:**
- `createConsumerRating(ratingData)` - POST /ratings/consumer
- `createSMERating(ratingData)` - POST /ratings/sme
- `getBusinessRatings(businessId, filters)` - GET /ratings/business/:id
- `getConsumerTrustScore(consumerId)` - GET /ratings/consumer/:id/trust-score

### Notification Service (`notificationService.js`)

**Functions:**
- `getNotifications(filters)` - GET /notifications
- `markAsRead(id)` - PATCH /notifications/:id/read
- `getUnreadCount()` - GET /notifications/unread/count

### Upload Service (`uploadService.js`)

**Functions:**
- `uploadFile(file)` - POST /upload
- `uploadFiles(files)` - POST /upload (multiple)

**File Handling:**
- Creates FormData for file upload
- Validates file type and size
- Returns file URLs

## Routing

### Route Structure

```javascript
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/map" element={<MapPage />} />
  <Route path="/products" element={<ProductSearchPage />} />
  <Route path="/products/:id" element={<ProductDetailPage />} />
  <Route path="/businesses/:id" element={<BusinessProfilePage />} />

  {/* Protected Consumer Routes */}
  <Route element={<ProtectedRoute allowedRoles={['consumer']} />}>
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
    <Route path="/orders" element={<OrderHistoryPage />} />
    <Route path="/orders/:id" element={<OrderDetailPage />} />
  </Route>

  {/* Protected SME Routes */}
  <Route element={<ProtectedRoute allowedRoles={['sme']} />}>
    <Route path="/dashboard" element={<SMEDashboardPage />}>
      <Route index element={<DashboardOverviewPage />} />
      <Route path="profile" element={<BusinessProfileManagementPage />} />
      <Route path="products" element={<ProductInventoryPage />} />
      <Route path="products/new" element={<ProductFormPage />} />
      <Route path="products/:id/edit" element={<ProductFormPage />} />
      <Route path="orders" element={<SMEOrderManagementPage />} />
      <Route path="orders/:id" element={<SMEOrderDetailPage />} />
    </Route>
  </Route>

  {/* Protected Routes (Any Authenticated User) */}
  <Route element={<ProtectedRoute />}>
    <Route path="/notifications" element={<NotificationsPage />} />
  </Route>
</Routes>
```

### Protected Route Component

**Purpose:** Restricts access based on authentication and role.

**Logic:**
```javascript
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
```

## Key Pages

### Map Page

**Purpose:** Interactive map for discovering businesses by location.

**Features:**
- Leaflet map with OpenStreetMap tiles
- User location detection (with permission)
- Business markers with custom icons by type
- Marker clustering for performance
- Click marker to show business preview popup
- Filters: business type, distance, ratings
- Pan and zoom controls

**Implementation:**
```javascript
<MapContainer center={[lat, lon]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <MarkerClusterGroup>
    {businesses.map(business => (
      <Marker
        key={business.id}
        position={[business.location.latitude, business.location.longitude]}
        icon={getBusinessIcon(business.businessType)}
      >
        <Popup>
          <BusinessPreview business={business} />
        </Popup>
      </Marker>
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

### Product Search Page

**Purpose:** Search and filter products across all businesses.

**Features:**
- Keyword search input
- Category dropdown filter
- Price range sliders
- Location-based filtering (radius)
- Sort options (price, date, rating, distance)
- Grid layout with product cards
- Pagination controls
- Loading states

**Search Flow:**
1. User enters search criteria
2. Debounced API call to /products/search
3. Results displayed in grid
4. Click product card to view details

### Shopping Cart Page

**Purpose:** Review cart items and proceed to checkout.

**Features:**
- Items grouped by business
- Quantity adjustment controls
- Remove item button
- Subtotal per business
- Grand total calculation
- Empty cart state
- Proceed to checkout button

**Multi-Vendor Handling:**
- Cart items grouped by businessId
- Separate order created for each business
- Clear indication of multiple orders

### Checkout Page

**Purpose:** Finalize order and select delivery method.

**Features:**
- Order summary by business
- Delivery method selection (pickup/delivery)
- Total amount display
- Place order button
- Loading state during order creation
- Error handling

**Order Creation Flow:**
1. User selects delivery method
2. Click "Place Order"
3. API call to POST /orders
4. Backend splits cart into separate orders
5. Redirect to order confirmation page

### SME Dashboard

**Purpose:** Central hub for SME business management.

**Layout:**
- Sidebar navigation
- Main content area
- Nested routes for different sections

**Sections:**
- Overview - Quick stats and recent activity
- Profile - Edit business information
- Products - Manage product inventory
- Orders - View and process orders
- Notifications - View all notifications

### Order Management (SME)

**Purpose:** Process incoming orders and update status.

**Features:**
- Order list with status filters
- Order detail view
- Status update buttons
- Consumer trust score display
- Order items with product details
- Status transition validation

**Status Workflow:**
```
pending → confirmed → ready → out_for_delivery → delivered
   ↓          ↓         ↓            ↓
cancelled  cancelled  cancelled  cancelled
```

## Components

### Navbar

**Purpose:** Main navigation bar with user menu and notifications.

**Features:**
- Logo and branding
- Search bar (on larger screens)
- Navigation links (Map, Products)
- Notification dropdown
- User menu dropdown
- Login/Register buttons (when not authenticated)
- Logout button (when authenticated)
- Mobile responsive (hamburger menu)

**Role-Based Menu:**
- Consumer: Cart, Orders
- SME: Dashboard, Orders

### Notification Dropdown

**Purpose:** Quick access to recent notifications.

**Features:**
- Bell icon with unread count badge
- Dropdown with recent notifications
- Mark as read on click
- Link to full notifications page
- Auto-refresh unread count
- Empty state

**Implementation:**
- Fetches notifications on mount
- Polls unread count every 30 seconds
- Updates badge in real-time

### Rating Modal

**Purpose:** Consumer rates SME after order completion.

**Features:**
- Star rating input (1-5)
- Review text area
- Criteria ratings (product quality, service, value)
- Submit button
- Validation
- Success/error messages

**Trigger:**
- Automatically shown after order delivered
- Can be accessed from order detail page

### SME Rating Modal

**Purpose:** SME rates consumer's transaction behavior.

**Features:**
- Star rating input (1-5)
- Feedback text area
- Criteria ratings (payment timeliness, communication, compliance)
- Submit button
- Validation

**Use Case:**
- Helps SMEs identify trustworthy customers
- Contributes to consumer trust score

### Consumer Trust Score

**Purpose:** Display consumer's trustworthiness rating.

**Features:**
- Overall score (0-5 stars)
- Rating breakdown by criteria
- Total ratings count
- Visual indicators

**Display Location:**
- Order detail page (for SMEs)
- Consumer profile (future)

### Lazy Image

**Purpose:** Optimize image loading with lazy loading.

**Features:**
- Intersection Observer API
- Placeholder while loading
- Error fallback image
- Fade-in animation

**Usage:**
```javascript
<LazyImage
  src={product.images[0]}
  alt={product.name}
  className="w-full h-48 object-cover"
/>
```

## Mobile Responsiveness

### Tailwind Breakpoints

- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

### Mobile Optimizations

**Navigation:**
- Hamburger menu on mobile
- Full-screen menu overlay
- Touch-friendly tap targets

**Map:**
- Touch gestures (pinch to zoom, drag to pan)
- Simplified controls
- Larger markers

**Forms:**
- Full-width inputs on mobile
- Larger touch targets
- Simplified layouts

**Product Grid:**
- 1 column on mobile
- 2 columns on tablet
- 3-4 columns on desktop

**Cart:**
- Stacked layout on mobile
- Side-by-side on desktop

## Performance Optimizations

### Code Splitting

- React Router lazy loading
- Dynamic imports for large components
- Separate bundles for routes

### Image Optimization

- Lazy loading with Intersection Observer
- Responsive images with srcset
- WebP format support
- Placeholder images

### API Optimization

- Debounced search inputs (300ms)
- Pagination for large lists
- Caching in Zustand stores
- Optimistic UI updates

### Build Optimization

- Vite production build
- Tree shaking
- Minification
- Gzip compression

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your-api-key (optional)
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

## Future Enhancements

### Planned Features

1. **Real-Time Messaging**
   - WebSocket integration
   - Chat interface
   - Message notifications

2. **Payment Integration**
   - Stripe checkout
   - M-Pesa integration
   - Payment confirmation

3. **Delivery Tracking**
   - Real-time tracking map
   - Delivery status updates
   - ETA display

4. **Analytics Dashboard**
   - Sales charts
   - Customer insights
   - Performance metrics

5. **Progressive Web App (PWA)**
   - Offline support
   - Install prompt
   - Push notifications

6. **Accessibility Improvements**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

7. **Internationalization**
   - Multi-language support
   - Currency conversion
   - Locale-specific formatting

## Testing Strategy

### Unit Tests (Planned)

- Component rendering
- User interactions
- State management
- Utility functions

### Integration Tests (Planned)

- User flows (registration, login, checkout)
- API integration
- Route navigation

### E2E Tests (Planned)

- Complete user journeys
- Cross-browser testing
- Mobile device testing

## Deployment

### Build Process

```bash
npm run build
```

**Output:**
- `dist/` directory with optimized assets
- HTML, CSS, JS bundles
- Static assets

### Hosting Options

- **Vercel** - Recommended for Vite apps
- **Netlify** - Easy deployment with Git integration
- **AWS S3 + CloudFront** - Scalable static hosting
- **Nginx** - Self-hosted option

### Environment Configuration

- Set `VITE_API_BASE_URL` to production API URL
- Configure CORS on backend for production domain
- Enable HTTPS for secure communication

## Conclusion

The CoShop frontend provides a complete, modern user experience for marketplace interactions. Built with React and modern tooling, it offers:

- **Intuitive UI** - Easy navigation and clear information hierarchy
- **Mobile-First** - Responsive design that works on all devices
- **Performance** - Optimized loading and smooth interactions
- **Scalability** - Clean architecture ready for future features

The frontend successfully integrates with all implemented backend services and provides a solid foundation for the MVP launch.
