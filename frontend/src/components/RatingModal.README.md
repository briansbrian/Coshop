# Rating and Review System

This directory contains components for the bidirectional rating system in CoShop marketplace.

## Components

### RatingModal.jsx
Consumer-facing rating modal for rating SMEs and products after order completion.

**Features:**
- Overall star rating (1-5 stars)
- Detailed criteria ratings:
  - Product Quality
  - Service
  - Value for Money
- Written review text
- Visual feedback with star hover effects
- Error handling and loading states

**Usage:**
```jsx
import RatingModal from '../components/RatingModal';

<RatingModal
  order={orderObject}
  onClose={() => setShowModal(false)}
  onSubmit={() => handleRatingSubmitted()}
/>
```

### SMERatingModal.jsx
SME-facing rating modal for rating customers after order completion.

**Features:**
- Overall customer rating (1-5 stars)
- Detailed criteria ratings:
  - Payment Timeliness
  - Communication
  - Order Compliance
- Written feedback text
- Informational guidance for SMEs
- Error handling and loading states

**Usage:**
```jsx
import SMERatingModal from '../components/SMERatingModal';

<SMERatingModal
  order={orderObject}
  consumer={{ id: consumerId, email: consumerEmail }}
  onClose={() => setShowModal(false)}
  onSubmit={() => handleRatingSubmitted()}
/>
```

### ConsumerTrustScore.jsx
Displays consumer trust score for SMEs to view customer reliability.

**Features:**
- Overall trust score display (0-5 scale)
- Color-coded score indicators:
  - Green (4.5+): Excellent
  - Blue (3.5-4.4): Good
  - Yellow (2.5-3.4): Fair
  - Red (<2.5): Poor
- Detailed breakdown of criteria scores
- Compact and full display modes
- Loading and error states

**Usage:**
```jsx
import ConsumerTrustScore from '../components/ConsumerTrustScore';

// Full display
<ConsumerTrustScore
  consumerId={consumerId}
  consumerEmail={consumerEmail}
/>

// Compact display
<ConsumerTrustScore
  consumerId={consumerId}
  compact={true}
/>
```

## Integration Points

### Consumer Flow
1. **Order Completion**: After order is marked as "delivered"
2. **Rating Prompt**: Green banner appears on OrderDetailPage
3. **Rating Modal**: Consumer clicks "Rate Order" button
4. **Submission**: Rating is saved and business profile is updated

### SME Flow
1. **Order Completion**: After order is marked as "delivered"
2. **Rating Prompt**: Blue banner appears on SMEOrderDetailPage
3. **Rating Modal**: SME clicks "Rate Customer" button
4. **Submission**: Rating is saved and consumer trust score is updated

### Display Locations

**Consumer Ratings (for SMEs):**
- Business profile page (reviews tab)
- Product listings (average rating)
- Search results (rating filter)

**Consumer Trust Scores (for SMEs):**
- SME order management page (compact view)
- SME order detail page (full view)
- Order processing decisions

## API Integration

All rating components use the `ratingService` from `../services/ratingService.js`:

- `createRating(ratingData)` - Submit new rating
- `getBusinessRatings(businessId)` - Fetch business ratings
- `getConsumerTrustScore(consumerId)` - Fetch consumer trust score

## Requirements Fulfilled

This implementation satisfies the following requirements:

- **11.1**: Consumer rating prompt after order completion
- **11.2**: Consumer rating form with stars and review text
- **11.3**: Display ratings on business profiles
- **11.4**: SME response to reviews (backend support)
- **11A.1**: SME rating form for consumers
- **11A.2**: Consumer trust score calculation and display

## Design Considerations

1. **Bidirectional Trust**: Both consumers and SMEs can rate each other
2. **Criteria-based Ratings**: Specific aspects help provide actionable feedback
3. **Visual Clarity**: Color-coded scores and star ratings for quick assessment
4. **Contextual Display**: Compact vs full views based on use case
5. **Error Handling**: Graceful degradation when data is unavailable
