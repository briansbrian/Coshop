import React, { useState } from 'react';

/**
 * LazyImage component with loading placeholder and error handling
 * Optimized for mobile performance with native lazy loading
 */
function LazyImage({ src, alt, className = '', placeholderClassName = '', onLoad, onError }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError(e);
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${placeholderClassName || className}`}>
        <svg
          className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`animate-pulse bg-gray-300 ${placeholderClassName || className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : 'block'}`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
}

export default LazyImage;
