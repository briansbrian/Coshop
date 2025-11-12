# Business Profile Page

## Overview

The Business Profile Page displays comprehensive information about a specific business (SME) on the CoShop platform. It serves as the central hub for consumers to learn about a business, view its products, read reviews, and take actions like contacting the business or getting directions.

## Features

### Business Information Display
- **Business Name & Verification Badge**: Shows the business name with a verified badge if applicable
- **Business Type**: Displays the type (shop, business, or service) as a badge
- **Rating & Reviews**: Shows average star rating and total number of reviews
- **Description**: Full business description
- **Contact Information**: 
  - Phone number
  - Email address
  - Physical address
- **Operating Hours**: Displays business hours for each day of the week (if available)

### Action Buttons
- **Contact Business**: Opens email client to send an email to the business
- **Get Directions**: Opens Google Maps with directions to the business location

### Tabbed Content
The page includes two tabs for organizing content:

#### Products Tab
- Displays all products offered by the business in a responsive grid
- Each product card shows:
  - Product image (or placeholder if no image)
  - Product name
  - Price
  - Category badge
  - Out of stock overlay (if applicable)
- Clicking a product navigates to the product detail page

#### Reviews Tab
- Displays customer reviews and ratings
- Each review shows:
  - Star rating (1-5 stars)
  - Reviewer email and date
  - Review text
  - Detailed criteria ratings (quality, service, value)
- Shows a message if no reviews exist yet

## Data Structure

The page expects business data in the following format:

```javascript
{
  id: "uuid",
  name: "Business Name",
  description: "Business description",
  businessType: "shop" | "business" | "service",
  verified: boolean,
  rating: number, // 0-5
  totalRatings: number,
  location: {
    latitude: number,
    longitude: number,
    address: "Full address"
  },
  contactInfo: {
    email: "email@example.com",
    phone: "+1234567890"
  },
  operatingHours: [
    {
      day: "monday",
      open: "09:00",
      close: "17:00",
      closed: false
    }
  ]
}
```

## API Endpoints Used

- `GET /api/v1/businesses/:id` - Fetch business details
- `GET /api/v1/businesses/:id/products` - Fetch business products
- `GET /api/v1/businesses/:id/ratings` - Fetch business ratings

## Navigation

The page can be accessed via:
- `/businesses/:id` route
- Links from the map page (business markers)
- Links from product detail pages
- Links from search results

## Responsive Design

The page is fully responsive with:
- Mobile-first design approach
- Responsive grid for products (1-4 columns based on screen size)
- Stacked layout on mobile, side-by-side on desktop
- Touch-friendly buttons and interactions

## Error Handling

- Displays loading spinner while fetching data
- Shows error message if business not found
- Provides link to browse businesses if error occurs
- Gracefully handles missing data (e.g., no products, no reviews)

## Future Enhancements

Potential improvements for future iterations:
- Add favorite/bookmark functionality
- Enable direct messaging to business
- Show business photos/gallery
- Display business hours status (open/closed now)
- Add social media links
- Show related businesses
- Enable review filtering and sorting
