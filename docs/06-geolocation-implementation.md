# Geolocation Implementation

## Overview

CoShop uses PostGIS for geospatial data storage and queries, with OpenStreetMap Nominatim for geocoding addresses to coordinates.

## Geocoding Service

### Address to Coordinates

**Function:** `geocodeAddress(address, city, country)`

**Location:** `backend/src/utils/geocodingUtils.js`

**Process:**
1. Construct full address string: `"${address}, ${city}, ${country}"`
2. Call OpenStreetMap Nominatim API
3. Parse response to extract latitude/longitude
4. If Nominatim fails and Google Maps API key exists, try Google Maps
5. Return coordinates and formatted address

**OpenStreetMap Nominatim:**
- Free, no API key required
- Rate limited (1 request per second recommended)
- Requires User-Agent header
- Endpoint: `https://nominatim.openstreetmap.org/search`

**Google Maps Fallback:**
- Requires API key in `GOOGLE_MAPS_API_KEY` env variable
- More accurate but costs money
- Used only if Nominatim fails
- Endpoint: `https://maps.googleapis.com/maps/api/geocode/json`

**Response Format:**
```javascript
{
  latitude: -1.2921,
  longitude: 36.8219,
  formattedAddress: "123 Main Street, Nairobi, Kenya"
}
```

**Error Handling:**
- 400 GEOCODING_FAILED: Address not found
- 502 GEOCODING_SERVICE_ERROR: Service unavailable

### Coordinates to Address

**Function:** `reverseGeocode(latitude, longitude)`

**Process:**
1. Call Nominatim reverse geocoding endpoint
2. Parse response to extract address components
3. Return structured address

**Response Format:**
```javascript
{
  address: "123 Main Street, Nairobi, Kenya",
  city: "Nairobi",
  country: "Kenya"
}
```

### Coordinate Validation

**Function:** `validateCoordinates(latitude, longitude)`

**Validation Rules:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Must be valid numbers

## PostGIS Storage

### Geography Type

Businesses store location as `GEOGRAPHY(POINT, 4326)`:

- **GEOGRAPHY:** Uses spherical earth model for accurate distance calculations
- **POINT:** Single coordinate pair
- **4326:** WGS84 coordinate system (standard GPS coordinates)

**Why GEOGRAPHY vs GEOMETRY?**
- GEOGRAPHY: Distances in meters, accurate for global data
- GEOMETRY: Distances in coordinate units, faster but less accurate

### Storing Coordinates

**SQL Format:**
```sql
ST_GeogFromText('POINT(longitude latitude)')
```

**Example:**
```sql
INSERT INTO businesses (location) 
VALUES (ST_GeogFromText('POINT(36.8219 -1.2921)'));
```

**Important:** PostGIS uses `POINT(longitude latitude)` order, not `(latitude longitude)`.

### Extracting Coordinates

**SQL:**
```sql
SELECT 
  ST_X(location::geometry) as longitude,
  ST_Y(location::geometry) as latitude
FROM businesses;
```

**Why cast to geometry?** ST_X/ST_Y work on geometry type, not geography.

## Spatial Queries

### Distance Calculation

**Function:** `ST_Distance(geography1, geography2)`

**Returns:** Distance in meters

**Example:**
```sql
SELECT 
  name,
  ST_Distance(
    location,
    ST_GeogFromText('POINT(36.8219 -1.2921)')
  ) / 1000 as distance_km
FROM businesses
ORDER BY distance_km;
```

**Note:** Divide by 1000 to convert meters to kilometers.

### Radius Search

**Function:** `ST_DWithin(geography1, geography2, distance_meters)`

**Returns:** Boolean (true if within distance)

**Example:**
```sql
SELECT name, address
FROM businesses
WHERE ST_DWithin(
  location,
  ST_GeogFromText('POINT(36.8219 -1.2921)'),
  5000  -- 5km radius
);
```

**Performance:** Uses spatial index (GIST) for fast queries.

## Product Search with Geolocation

### Search Implementation

**Function:** `searchProducts(searchParams)`

**Location:** `backend/src/services/productService.js`

**Geolocation Parameters:**
- `latitude`: User's latitude
- `longitude`: User's longitude
- `radius`: Search radius in kilometers

**Query Construction:**

1. **Distance Calculation:**
```sql
ST_Distance(
  b.location,
  ST_GeogFromText('POINT(longitude latitude)')
) / 1000 as distance_km
```

2. **Radius Filtering:**
```sql
WHERE ST_DWithin(
  b.location,
  ST_GeogFromText('POINT(longitude latitude)'),
  radius * 1000  -- Convert km to meters
)
```

3. **Distance Sorting:**
```sql
ORDER BY distance_km ASC
```

**Example Query:**
```sql
SELECT 
  p.*,
  b.name as business_name,
  ST_Distance(
    b.location,
    ST_GeogFromText('POINT(36.8219 -1.2921)')
  ) / 1000 as distance_km
FROM products p
JOIN businesses b ON p.business_id = b.id
WHERE ST_DWithin(
  b.location,
  ST_GeogFromText('POINT(36.8219 -1.2921)'),
  10000  -- 10km
)
ORDER BY distance_km ASC;
```

## Business Registration Flow

### Geocoding During Registration

1. User submits business with address, city, country
2. `businessService.registerBusiness()` calls `geocodeAddress()`
3. Geocoding service returns coordinates
4. Coordinates stored as PostGIS POINT
5. If geocoding fails, registration fails with 400 error

**Why fail on geocoding error?** Location is critical for the platform's geolocation-based discovery feature.

### Geocoding During Updates

1. User updates address, city, or country
2. Service fetches current location data
3. Constructs new full address (using new + existing fields)
4. Re-geocodes address
5. Updates location in database
6. If geocoding fails, update fails with 400 error

## Spatial Indexing

### GIST Index

**Created on:** `businesses.location`

**SQL:**
```sql
CREATE INDEX idx_businesses_location 
ON businesses USING GIST(location);
```

**Purpose:**
- Accelerates spatial queries (ST_Distance, ST_DWithin)
- Essential for performance with large datasets
- Uses R-tree data structure

**Query Performance:**
- Without index: O(n) - scans all rows
- With index: O(log n) - uses spatial tree

## Caching Strategy

### Geocoding Cache

**Not implemented yet**, but recommended:

- Cache geocoding results in Redis
- Key: `geocode:${address}:${city}:${country}`
- TTL: 24 hours or longer
- Reduces API calls to Nominatim/Google

**Why cache?**
- Nominatim rate limits (1 req/sec)
- Google Maps costs money
- Same addresses geocoded repeatedly

### Search Results Cache

**Implemented:** Product search results cached in Redis

- Key: `products:search:${JSON.stringify(params)}`
- TTL: 5 minutes (300 seconds)
- Invalidated on product create/update/delete

**Why short TTL?**
- Product inventory changes frequently
- Prices may change
- New products added regularly

## Coordinate System Details

### WGS84 (SRID 4326)

- Standard GPS coordinate system
- Used by Google Maps, OpenStreetMap, mobile devices
- Latitude: -90 (South Pole) to 90 (North Pole)
- Longitude: -180 (West) to 180 (East)
- Equator: latitude 0
- Prime Meridian: longitude 0

### Distance Accuracy

PostGIS GEOGRAPHY type uses spherical earth model:
- Accurate for distances up to ~500km
- Error < 0.5% for most use cases
- More accurate than flat GEOMETRY calculations

## Future Enhancements

Not yet implemented:

### Nearby Businesses Endpoint

**Planned:** `GET /api/v1/businesses/nearby`

**Parameters:**
- latitude, longitude (required)
- radius (default: 10km)
- businessType filter
- verified filter
- rating filter

**Response:** List of businesses with distances

### Map Bounds Search

**Planned:** Search businesses within map viewport

**Parameters:**
- northEast: {lat, lng}
- southWest: {lat, lng}

**Query:** `ST_Within()` or bounding box query

### Directions Integration

**Planned:** Integration with Google Maps Directions API

**Purpose:** Provide turn-by-turn directions to businesses

### Geofencing

**Planned:** Notify users when businesses are nearby

**Implementation:** Background location tracking + ST_DWithin queries

## Performance Considerations

### Query Optimization

1. Always use spatial index (GIST)
2. Limit radius searches to reasonable distances (< 50km)
3. Use ST_DWithin for filtering before ST_Distance for sorting
4. Cache frequently accessed locations

### Scaling Strategies

1. **Read Replicas:** Offload spatial queries to read replicas
2. **Partitioning:** Partition businesses table by region
3. **Caching:** Cache popular search results
4. **CDN:** Cache static map tiles

### Rate Limiting

**Nominatim:**
- 1 request per second recommended
- Implement request queuing if needed
- Cache results aggressively

**Google Maps:**
- Costs per request
- Use only as fallback
- Cache results to minimize costs
