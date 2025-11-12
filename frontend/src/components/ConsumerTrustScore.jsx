import React, { useEffect, useState } from 'react';
import ratingService from '../services/ratingService';

function ConsumerTrustScore({ consumerId, consumerEmail, compact = false }) {
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (consumerId) {
      fetchTrustScore();
    } else {
      setLoading(false);
    }
  }, [consumerId]);

  const fetchTrustScore = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ratingService.getConsumerTrustScore(consumerId);
      setTrustScore(response.trustScore || response);
    } catch (err) {
      console.error('Error fetching trust score:', err);
      setError('Unable to load trust score');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={compact ? 'text-sm text-gray-500' : 'p-4 bg-gray-50 rounded-lg'}>
        <div className="animate-pulse flex items-center">
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error || !trustScore) {
    return (
      <div className={compact ? 'text-sm text-gray-500' : 'p-4 bg-gray-50 rounded-lg'}>
        <p className="text-gray-500 text-sm">Trust score unavailable</p>
      </div>
    );
  }

  const score = trustScore.overallScore || 0;
  const totalRatings = trustScore.totalRatings || 0;

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 4.5) return 'bg-green-50 border-green-200';
    if (score >= 3.5) return 'bg-blue-50 border-blue-200';
    if (score >= 2.5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Fair';
    if (score > 0) return 'Poor';
    return 'No ratings';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <svg
            className={`w-5 h-5 ${getScoreColor(score)}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className={`ml-1 font-semibold ${getScoreColor(score)}`}>
            {score > 0 ? score.toFixed(1) : 'N/A'}
          </span>
        </div>
        <span className="text-sm text-gray-600">
          ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${getScoreBgColor(score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Customer Trust Score</h3>
          {consumerEmail && (
            <p className="text-sm text-gray-600">{consumerEmail}</p>
          )}
        </div>
        <div className="flex items-center">
          <svg
            className={`w-6 h-6 ${getScoreColor(score)}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score > 0 ? score.toFixed(1) : 'N/A'}
          </span>
          <span className="ml-2 text-sm text-gray-600">/ 5.0</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {getScoreLabel(score)} • {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
        </p>
      </div>

      {trustScore.breakdown && totalRatings > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Rating Breakdown</p>
          
          {trustScore.breakdown.paymentTimeliness > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment Timeliness</span>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(trustScore.breakdown.paymentTimeliness)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-900 font-medium">
                  {trustScore.breakdown.paymentTimeliness.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {trustScore.breakdown.communication > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Communication</span>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(trustScore.breakdown.communication)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-900 font-medium">
                  {trustScore.breakdown.communication.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {trustScore.breakdown.compliance > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Order Compliance</span>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(trustScore.breakdown.compliance)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-900 font-medium">
                  {trustScore.breakdown.compliance.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {totalRatings === 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            This customer hasn't been rated yet. Be the first to provide feedback after completing an order.
          </p>
        </div>
      )}
    </div>
  );
}

export default ConsumerTrustScore;
