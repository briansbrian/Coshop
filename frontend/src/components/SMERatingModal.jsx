import React, { useState } from 'react';
import ratingService from '../services/ratingService';

function SMERatingModal({ order, consumer, onClose, onSubmit }) {
  const [rating, setRating] = useState({
    stars: 0,
    feedback: '',
    paymentTimeliness: 0,
    communication: 0,
    compliance: 0,
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleStarClick = (field, value) => {
    setRating((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating.stars === 0) {
      setError('Please select an overall rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ratingData = {
        orderId: order.id,
        consumerId: consumer.id || order.consumerId,
        stars: rating.stars,
        feedback: rating.feedback,
        criteria: {
          paymentTimeliness: rating.paymentTimeliness || rating.stars,
          communication: rating.communication || rating.stars,
          compliance: rating.compliance || rating.stars,
        },
      };

      await ratingService.createRating(ratingData);
      onSubmit();
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err.response?.data?.error?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label, hoverValue, onHover }) => {
    return (
      <div className="mb-4">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => onHover && onHover(star)}
              onMouseLeave={() => onHover && onHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= (hoverValue || value)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Rate Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Customer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Rating for</p>
            <p className="text-lg font-semibold text-gray-900">
              {consumer.email || order.consumerEmail || 'Customer'}
            </p>
            <p className="text-sm text-gray-600">
              Order #{order.id.slice(0, 8)}
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-blue-800">
                Your rating helps build a trustworthy marketplace. Rate customers based on their behavior during the transaction.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Overall Rating */}
          <div className="mb-6">
            <StarRating
              value={rating.stars}
              onChange={(value) => handleStarClick('stars', value)}
              label="Overall Customer Rating *"
              hoverValue={hoveredStar}
              onHover={setHoveredStar}
            />
            {rating.stars > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating.stars === 1 && 'Poor - Significant issues'}
                {rating.stars === 2 && 'Fair - Some concerns'}
                {rating.stars === 3 && 'Good - Acceptable'}
                {rating.stars === 4 && 'Very Good - Reliable'}
                {rating.stars === 5 && 'Excellent - Highly trustworthy'}
              </p>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Rate Specific Aspects (Optional)
            </h3>
            
            <StarRating
              value={rating.paymentTimeliness}
              onChange={(value) => handleStarClick('paymentTimeliness', value)}
              label="Payment Timeliness"
            />
            <p className="text-xs text-gray-500 mb-4 -mt-2">
              Did the customer pay on time and without issues?
            </p>
            
            <StarRating
              value={rating.communication}
              onChange={(value) => handleStarClick('communication', value)}
              label="Communication"
            />
            <p className="text-xs text-gray-500 mb-4 -mt-2">
              Was the customer responsive and clear in communication?
            </p>
            
            <StarRating
              value={rating.compliance}
              onChange={(value) => handleStarClick('compliance', value)}
              label="Order Compliance"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Did the customer follow pickup/delivery instructions?
            </p>
          </div>

          {/* Feedback Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              value={rating.feedback}
              onChange={(e) => setRating((prev) => ({ ...prev, feedback: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share any additional feedback about this customer..."
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              This feedback helps other businesses make informed decisions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={submitting || rating.stars === 0}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SMERatingModal;
