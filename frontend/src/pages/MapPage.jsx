import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geolocationService from '../services/geolocationService';
import businessService from '../services/businessService';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different business types
const createCustomIcon = (businessType) => {
  const colors = {
    shop: '#3B82F6', // blue
    business: '#10B981', // green
    service: '#F59E0B', // amber
  };

  const color = colors[businessType] || '#6B7280'; // gray as fallback

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          margin-top: 5px;
          margin-left: 7px;
          font-size: 14px;
          color: white;
        ">
          ${businessType === 'shop' ? '🏪' : businessType === 'service' ? '🔧' : '🏢'}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Component to handle map centering
function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

function MapPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  
  // Filter states
  const [filters, setFilters] = useState({
    businessType: '',
    distance: 10, // km
    minRating: 0,
    verified: false,
  });

  const mapRef = useRef(null);

  // Request user location on mount
  useEffect(() => {
    requestUserLocation();
  }, []);

  // Fetch businesses when location or filters change
  useEffect(() => {
    if (userLocation) {
      fetchNearbyBusinesses();
    }
  }, [userLocation, filters]);

  const requestUserLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await geolocationService.getCurrentLocation();
      setUserLocation({
        lat: location.latitude,
        lng: location.longitude,
      });
      setLocationPermission('granted');
    } catch (err) {
      console.error('Error getting location:', err);
      setLocationPermission('denied');
      setError('Unable to access your location. Please enable location permissions.');
      
      // Use default location (Nairobi, Kenya as fallback)
      setUserLocation({
        lat: -1.286389,
        lng: 36.817223,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {};
      if (filters.businessType) {
        filterParams.business_type = filters.businessType;
      }
      if (filters.minRating > 0) {
        filterParams.min_rating = filters.minRating;
      }
      if (filters.verified) {
        filterParams.verified = true;
      }

      const data = await businessService.getNearbyBusinesses(
        userLocation.lat,
        userLocation.lng,
        filters.distance * 1000, // Convert km to meters
        filterParams
      );

      setBusinesses(data.businesses || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load nearby businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleBusinessClick = (business) => {
    // Center map on selected business
    if (mapRef.current) {
      mapRef.current.setView([business.latitude, business.longitude], 15);
    }
  };

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Requesting location permission...</p>
          {locationPermission === 'denied' && (
            <button
              onClick={requestUserLocation}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Filters Bar */}
      <div className="bg-white shadow-md p-3 sm:p-4 z-10 overflow-y-auto max-h-64 sm:max-h-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Discover Businesses Near You</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Business Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                value={filters.businessType}
                onChange={(e) => handleFilterChange('businessType', e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
              >
                <option value="">All Types</option>
                <option value="shop">Shops</option>
                <option value="business">Businesses</option>
                <option value="service">Services</option>
              </select>
            </div>

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance: {filters.distance} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.distance}
                onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                className="w-full h-8 touch-manipulation"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 touch-manipulation"
                />
                <span className="text-sm font-medium text-gray-700">
                  Verified Only
                </span>
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            {loading ? (
              <span>Loading businesses...</span>
            ) : (
              <span>
                Found {businesses.length} business{businesses.length !== 1 ? 'es' : ''} within {filters.distance} km
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={[userLocation.lat, userLocation.lng]} />

          {/* User Location Marker */}
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="
                  background-color: #3B82F6;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Business Markers */}
          {businesses.map((business) => (
            <Marker
              key={business.id}
              position={[business.latitude, business.longitude]}
              icon={createCustomIcon(business.business_type)}
              eventHandlers={{
                click: () => handleBusinessClick(business),
              }}
            >
              <Popup maxWidth={300}>
                <div className="p-2">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{business.name}</h3>
                    {business.verified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {business.business_type}
                    </span>
                  </div>

                  {business.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  {business.rating > 0 && (
                    <div className="flex items-center mb-2">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="text-sm font-medium text-gray-900">
                        {business.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({business.total_ratings} reviews)
                      </span>
                    </div>
                  )}

                  {business.distance && (
                    <p className="text-sm text-gray-500 mb-2">
                      📍 {(business.distance / 1000).toFixed(1)} km away
                    </p>
                  )}

                  {business.address && (
                    <p className="text-xs text-gray-500 mb-3">
                      {business.address}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/businesses/${business.id}`}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                    >
                      Directions
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading businesses...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend - Hidden on small screens, visible on larger screens */}
      <div className="hidden sm:block absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center text-xs">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
            <span>Shops</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span>Businesses</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
            <span>Services</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white mr-2"></div>
            <span>Your Location</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;
