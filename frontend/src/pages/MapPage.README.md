# MapPage Component

## Overview
The MapPage component provides an interactive map interface for discovering nearby businesses using Leaflet and React-Leaflet.

## Features Implemented

### 1. Leaflet Integration
- Uses React-Leaflet for React integration
- OpenStreetMap tiles for map display
- Responsive map container that fills available space

### 2. User Location Permission
- Requests browser geolocation permission on mount
- Displays loading state while requesting permission
- Falls back to default location (Nairobi, Kenya) if permission denied
- Provides retry button if location access fails

### 3. Custom Business Markers
- Different colored markers for business types:
  - Blue (🏪) for Shops
  - Green (🏢) for Businesses
  - Amber (🔧) for Services
- Custom teardrop-shaped markers with icons
- User location marked with blue circle

### 4. Business Preview Popups
- Click on any marker to view business details
- Popup displays:
  - Business name and verification badge
  - Business type
  - Description (truncated to 2 lines)
  - Rating and review count
  - Distance from user
  - Address
  - "View Profile" button
  - "Directions" button (opens Google Maps)

### 5. Map Filters
- **Business Type**: Filter by shop, business, or service
- **Distance**: Adjustable radius slider (1-50 km)
- **Min Rating**: Filter by minimum star rating (3+, 4+, 4.5+)
- **Verified Only**: Toggle to show only verified businesses
- Real-time filter updates with results count

### 6. Additional Features
- Map legend showing marker colors
- Loading overlay during data fetch
- Error messages for failed operations
- Responsive design for mobile and desktop
- Touch-friendly controls

## Usage

```jsx
import MapPage from './pages/MapPage';

// In your router
<Route path="/map" element={<MapPage />} />
```

## API Dependencies

The component relies on:
- `geolocationService.getCurrentLocation()` - Get user's browser location
- `businessService.getNearbyBusinesses(lat, lng, radius, filters)` - Fetch nearby businesses

## Styling

Custom styles are added to `index.css`:
- Leaflet container styles
- Custom marker styles
- Popup styling
- Text truncation utilities

## Browser Permissions

The component requires:
- Geolocation API access
- User must grant location permission for full functionality
- Works with denied permission but uses default location

## Performance Considerations

- Businesses are fetched only when location or filters change
- Map markers are efficiently rendered using React-Leaflet
- Loading states prevent multiple simultaneous requests

## Future Enhancements

Potential improvements:
- Clustering for large numbers of markers
- Search by address/location
- Save favorite locations
- Real-time business updates
- Custom map styles/themes
