# Caching Strategy

## Overview

Redis is used for caching frequently accessed data to reduce database load and improve response times.

## Redis Configuration

**Location:** `backend/src/config/redis.js`

**Connection:**
- Host: `process.env.REDIS_HOST` (default: localhost)
- Port: `process.env.REDIS_PORT` (default: 6379)
- Password: `process.env.REDIS_PASSWORD` (optional)

**Client:** `redis` npm package (v4+)

## Cache Utilities

**Location:** `backend/src/utils/cacheUtils.js`

### getCached(key)

Retrieves and parses cached value.

**Returns:** Parsed JSON object or null if not found

**Error Handling:** Returns null on error (cache miss treated as failure)

### setCached(key, value, ttl)

Stores value with time-to-live.

**Parameters:**
- `key` (string): Cache key
- `value` (any): Value to cache (will be JSON stringified)
- `ttl` (number): Time to live in seconds (default: 300)

**Returns:** Boolean success status

### deleteCached(key)

Removes single cache entry.

**Returns:** Boolean success status

### deleteCachedPattern(pattern)

Removes all keys matching pattern.

**Example:** `deleteCachedPattern('products:search:*')`

**Process:**
1. Find all keys matching pattern with `KEYS` command
2. Delete all matching keys with `DEL` command

**Warning:** `KEYS` command can be slow on large datasets. Consider using `SCAN` in production.

### generateSearchCacheKey(params)

Creates consistent cache key from search parameters.

**Process:**
1. Sort parameters alphabetically
2. Filter out undefined/null values
3. JSON stringify sorted object
4. Prefix with `products:search:`

**Example:**
```javascript
generateSearchCacheKey({
  keyword: 'phone',
  category: 'electronics',
  minPrice: 100
})
// Returns: "products:search:{"category":"electronics","keyword":"phone","minPrice":100}"
```

## Implemented Caching

### Product Search Results

**Cache Key:** `products:search:${JSON.stringify(sortedParams)}`

**TTL:** 5 minutes (300 seconds)

**Cached Data:** Complete search results array

**Invalidation:** On product create, update, delete, or inventory change

**Why 5 minutes?**
- Product data changes frequently (inventory, prices)
- Balance between freshness and performance
- Reduces database load for popular searches

**Implementation:**
```javascript
// Try cache first
const cacheKey = generateSearchCacheKey(searchParams);
const cachedResults = await getCached(cacheKey);
if (cachedResults) {
  return cachedResults;
}

// Query database
const results = await pool.query(/* ... */);

// Cache results
await setCached(cacheKey, results, 300);

return results;
```

**Cache Invalidation:**
```javascript
// After product create/update/delete
await deleteCachedPattern('products:search:*');
```

## Recommended Caching (Not Implemented)

### Geocoding Results

**Cache Key:** `geocode:${address}:${city}:${country}`

**TTL:** 24 hours or longer

**Why cache?**
- Nominatim rate limits (1 req/sec)
- Google Maps costs money
- Addresses don't change frequently
- Same addresses geocoded repeatedly

**Implementation:**
```javascript
const cacheKey = `geocode:${address}:${city}:${country}`;
const cached = await getCached(cacheKey);
if (cached) return cached;

const coords = await callGeocodingAPI(address, city, country);
await setCached(cacheKey, coords, 86400); // 24 hours
return coords;
```

### Business Profiles

**Cache Key:** `business:${businessId}`

**TTL:** 1 hour (3600 seconds)

**Why cache?**
- Business data changes infrequently
- Frequently accessed for product listings
- Reduces database joins

**Invalidation:** On business update

### User Sessions

**Cache Key:** `session:${userId}`

**TTL:** Match access token expiration (15 minutes)

**Why cache?**
- Avoid database query on every authenticated request
- Store user permissions and roles
- Fast session validation

**Note:** Current implementation is stateless (no session storage). This would be needed for features like "remember me" or session management.

### Product Details

**Cache Key:** `product:${productId}`

**TTL:** 5 minutes

**Why cache?**
- Product pages frequently viewed
- Reduces database load
- Includes business data (join)

**Invalidation:** On product update or inventory change

## Cache Patterns

### Cache-Aside (Lazy Loading)

**Current implementation for product search**

**Pattern:**
1. Check cache
2. If hit: Return cached data
3. If miss: Query database
4. Store in cache
5. Return data

**Pros:**
- Only caches requested data
- Resilient to cache failures

**Cons:**
- First request always slow (cache miss)
- Stale data possible

### Write-Through

**Not implemented**

**Pattern:**
1. Write to database
2. Write to cache
3. Return success

**Pros:**
- Cache always fresh
- No cache misses

**Cons:**
- Slower writes
- Caches unused data

### Write-Behind (Write-Back)

**Not implemented**

**Pattern:**
1. Write to cache
2. Asynchronously write to database
3. Return success immediately

**Pros:**
- Fast writes
- Reduced database load

**Cons:**
- Risk of data loss
- Complex implementation

## Cache Invalidation Strategies

### Time-Based (TTL)

**Current implementation**

**How:** Set expiration time when caching

**Pros:**
- Simple
- Automatic cleanup
- Predictable memory usage

**Cons:**
- May serve stale data
- May cache miss on fresh data

### Event-Based

**Current implementation for product search**

**How:** Invalidate cache when data changes

**Pros:**
- Always fresh data
- No unnecessary cache misses

**Cons:**
- Must track all data changes
- Can miss invalidation events

### Hybrid Approach

**Recommended**

**How:** Use TTL + event-based invalidation

**Example:**
- Set 1-hour TTL on business profiles
- Invalidate immediately on business update
- If update event missed, cache expires anyway

## Performance Considerations

### Cache Hit Ratio

**Target:** > 80% for product searches

**Monitoring:**
- Track cache hits vs misses
- Identify frequently missed keys
- Adjust TTLs based on hit ratio

### Memory Usage

**Redis Memory:**
- Monitor with `INFO memory` command
- Set `maxmemory` limit
- Configure eviction policy (e.g., `allkeys-lru`)

**Eviction Policies:**
- `allkeys-lru`: Evict least recently used keys
- `volatile-ttl`: Evict keys with shortest TTL
- `noeviction`: Return errors when memory full

### Cache Stampede

**Problem:** Many requests hit cache miss simultaneously, all query database

**Solution (not implemented):**
- Use cache locking
- First request locks key, others wait
- Or use probabilistic early expiration

### Network Latency

**Redis on same server:** < 1ms latency

**Redis on separate server:** 1-10ms latency

**Recommendation:** Co-locate Redis with application servers

## Error Handling

### Cache Failures

**Current approach:** Treat as cache miss

**Process:**
1. Try to get from cache
2. If error: Log and continue
3. Query database as fallback
4. Try to cache result (may fail silently)

**Why?** Cache should never break the application. Database is source of truth.

### Redis Connection Loss

**Behavior:**
- Operations return errors
- Treated as cache misses
- Application continues functioning
- Performance degrades but no downtime

**Recommendation:** Monitor Redis health and alert on connection failures

## Cache Keys Naming Convention

**Pattern:** `{namespace}:{identifier}:{subkey}`

**Examples:**
- `products:search:{params}` - Product search results
- `business:{id}` - Business profile
- `product:{id}` - Product details
- `geocode:{address}:{city}:{country}` - Geocoding results
- `session:{userId}` - User session

**Benefits:**
- Easy to identify data type
- Easy to invalidate by pattern
- Prevents key collisions

## Monitoring and Debugging

### Redis CLI Commands

**Check key exists:**
```bash
EXISTS products:search:{params}
```

**Get TTL:**
```bash
TTL products:search:{params}
```

**View value:**
```bash
GET products:search:{params}
```

**List all keys (development only):**
```bash
KEYS *
```

**Clear all cache:**
```bash
FLUSHALL
```

### Application Logging

**Log cache operations:**
```javascript
console.log(`Cache hit: ${key}`);
console.log(`Cache miss: ${key}`);
console.log(`Cache invalidated: ${pattern}`);
```

**Metrics to track:**
- Cache hit rate
- Cache miss rate
- Average response time (cached vs uncached)
- Cache memory usage

## Future Enhancements

Not yet implemented:

- Cache warming (pre-populate cache)
- Cache locking (prevent stampede)
- Distributed caching (multiple Redis instances)
- Cache analytics dashboard
- Automatic cache tuning (adjust TTLs based on usage)
- Cache versioning (invalidate on schema changes)
- Compression for large cached values
- Cache partitioning by region/tenant
