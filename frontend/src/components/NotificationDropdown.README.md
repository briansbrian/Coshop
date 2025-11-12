# NotificationDropdown Component

## Overview

The `NotificationDropdown` component provides a notification center in the navigation bar that displays real-time notifications to users. It includes an unread count badge, a dropdown menu with recent notifications, and the ability to mark notifications as read.

## Features

- **Notification Bell Icon**: Displays in the navigation bar with an unread count badge
- **Dropdown Menu**: Shows up to 20 recent notifications when clicked
- **Unread Count Badge**: Red badge showing the number of unread notifications (displays "99+" for counts over 99)
- **Mark as Read**: Individual notifications can be marked as read
- **Mark All as Read**: Bulk action to mark all notifications as read
- **Auto-refresh**: Polls for new notifications every 30 seconds
- **Type-specific Icons**: Different icons for each notification type (orders, messages, reviews, etc.)
- **Time Formatting**: Shows relative time (e.g., "5 minutes ago", "2 hours ago")
- **Click-outside to Close**: Dropdown closes when clicking outside
- **Mobile Responsive**: Works on both desktop and mobile devices

## Notification Types

The component supports the following notification types with corresponding icons:

- `new_order` - Blue shopping bag icon
- `message` - Green chat bubble icon
- `review` - Yellow star icon
- `low_inventory` - Orange warning icon
- `payment` - Purple credit card icon
- `delivery_update` - Indigo truck icon

## Usage

```jsx
import NotificationDropdown from './components/NotificationDropdown';

// In your Navbar or header component
<NotificationDropdown />
```

## Integration

The component is integrated into the `Navbar` component and appears:
- In the desktop navigation bar (between Messages and Cart/User menu)
- In the mobile navigation bar (next to the hamburger menu)

## State Management

Uses Zustand store (`useNotificationStore`) for state management:
- `notifications` - Array of notification objects
- `unreadCount` - Number of unread notifications
- `setNotifications()` - Updates the notifications list
- `markAsRead(id)` - Marks a single notification as read
- `markAllAsRead()` - Marks all notifications as read

## API Integration

Connects to the backend notification service:
- `GET /api/v1/notifications` - Fetch notifications
- `GET /api/v1/notifications/unread/count` - Get unread count
- `PATCH /api/v1/notifications/:id/read` - Mark notification as read
- `PATCH /api/v1/notifications/read-all` - Mark all as read

## Notification Data Structure

```javascript
{
  id: "uuid",
  userId: "uuid",
  type: "new_order" | "message" | "review" | "low_inventory" | "payment" | "delivery_update",
  title: "Notification title",
  message: "Notification message content",
  priority: "low" | "medium" | "high",
  read: boolean,
  createdAt: "ISO timestamp"
}
```

## Navigation Links

Clicking on a notification navigates to the relevant page based on type:
- `new_order` → `/orders`
- `message` → `/messages`
- `review` → `/orders`
- `low_inventory` → `/dashboard/inventory`
- `payment` → `/orders`
- `delivery_update` → `/orders`

## Styling

- Uses Tailwind CSS for styling
- Unread notifications have a blue background (`bg-blue-50`)
- Dropdown has a maximum height of 32rem with scrolling
- Responsive width: 320px on mobile, 384px on desktop

## Accessibility

- Proper ARIA labels on buttons
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Related Components

- `NotificationsPage` - Full-page view of all notifications
- `Navbar` - Parent component containing the dropdown
- `useNotificationStore` - Zustand store for notification state

## Requirements Satisfied

- **Requirement 20.1**: Displays notifications for new orders, messages, reviews, and low inventory
- **Requirement 20.5**: Provides notification history and unread count
