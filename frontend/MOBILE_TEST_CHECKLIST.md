# Mobile Responsive Testing Checklist

## Quick Test Guide

### How to Test Mobile Responsiveness

#### Using Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. Click the device toolbar icon (Ctrl+Shift+M / Cmd+Shift+M)
3. Select different device presets or set custom dimensions
4. Test both portrait and landscape orientations

#### Recommended Test Devices
- **Mobile Small**: iPhone SE (375x667)
- **Mobile Medium**: iPhone 12 (390x844)
- **Mobile Large**: iPhone 14 Pro Max (430x932)
- **Tablet**: iPad (768x1024)
- **Desktop**: 1920x1080

## Page-by-Page Testing

### ✅ Navigation (All Pages)
- [ ] Hamburger menu appears on mobile (< 768px)
- [ ] Menu items are easily tappable
- [ ] Search bar is visible and functional
- [ ] Cart icon shows item count
- [ ] User menu works correctly
- [ ] Mobile menu closes when clicking outside

### ✅ Home Page (/)
- [ ] Hero text is readable on all screen sizes
- [ ] Search bar is full-width on mobile
- [ ] CTA buttons are full-width on mobile
- [ ] Feature cards stack vertically on mobile
- [ ] "How It Works" section displays 1-2 columns on mobile
- [ ] No horizontal scrolling

### ✅ Map Page (/map)
- [ ] Filters are scrollable on mobile
- [ ] Map takes up remaining screen height
- [ ] Filter controls are touch-friendly
- [ ] Range slider works with touch
- [ ] Business markers are tappable
- [ ] Popup information is readable
- [ ] Legend is hidden on mobile (< 640px)
- [ ] Results count is visible

### ✅ Product Search (/products)
- [ ] Filters sidebar is scrollable on mobile
- [ ] Product grid shows 1 column on mobile
- [ ] Product cards are touch-friendly
- [ ] Filter buttons are full-width
- [ ] Price range inputs are usable
- [ ] Category dropdown is accessible
- [ ] "Add to Cart" buttons are easily tappable
- [ ] Product images load with lazy loading

### ✅ Product Detail (/products/:id)
- [ ] Image gallery is usable on mobile
- [ ] Product info is readable
- [ ] Quantity controls are large enough (44x44px)
- [ ] "Add to Cart" button is full-width on mobile
- [ ] Thumbnail images are tappable
- [ ] Price is prominently displayed
- [ ] Business info is accessible

### ✅ Business Profile (/businesses/:id)
- [ ] Business header is readable
- [ ] Action buttons are full-width on mobile
- [ ] Tabs are horizontally scrollable if needed
- [ ] Product grid shows 2 columns on mobile
- [ ] Contact information is formatted correctly
- [ ] Operating hours are readable
- [ ] Reviews are easy to read

### ✅ Cart (/cart)
- [ ] Cart items stack vertically on mobile
- [ ] Product images are appropriately sized
- [ ] Quantity controls are touch-friendly
- [ ] Remove button is easily accessible
- [ ] Order summary is visible
- [ ] Checkout button is prominent
- [ ] Business grouping is clear

### ✅ Login/Register Pages
- [ ] Forms are centered and readable
- [ ] Input fields are large enough
- [ ] Buttons are full-width on mobile
- [ ] User type toggle is accessible
- [ ] Error messages are visible
- [ ] No zoom on input focus

### ✅ SME Dashboard (/dashboard)
- [ ] Sidebar collapses to hamburger on mobile
- [ ] Mobile menu overlay works
- [ ] Dashboard cards are responsive
- [ ] Tables scroll horizontally if needed
- [ ] Action buttons are accessible
- [ ] Forms are mobile-friendly

## Touch Interaction Tests

### Tap Targets
- [ ] All buttons are at least 44x44px
- [ ] Links have adequate spacing
- [ ] Form inputs are easy to tap
- [ ] Checkboxes/radios are large enough

### Gestures
- [ ] Map supports pinch-to-zoom
- [ ] Map supports pan/drag
- [ ] Scrolling is smooth
- [ ] No accidental double-tap zoom

### Feedback
- [ ] Buttons show active state on tap
- [ ] Links show active state on tap
- [ ] Loading states are visible
- [ ] Error states are clear

## Performance Tests

### Loading
- [ ] Images load progressively (lazy loading)
- [ ] Page loads in < 3 seconds on 4G
- [ ] No layout shift during load
- [ ] Skeleton screens show while loading

### Scrolling
- [ ] Smooth scrolling throughout
- [ ] No janky animations
- [ ] Infinite scroll works (if applicable)
- [ ] Pull-to-refresh disabled (unless implemented)

## Visual Tests

### Layout
- [ ] No horizontal scrolling
- [ ] Content fits within viewport
- [ ] Proper spacing on all screen sizes
- [ ] Images don't overflow containers

### Typography
- [ ] Text is readable without zooming
- [ ] Font sizes scale appropriately
- [ ] Line heights are comfortable
- [ ] Text doesn't break awkwardly

### Images
- [ ] Images are responsive
- [ ] Aspect ratios are maintained
- [ ] Placeholders show while loading
- [ ] Error states show for failed images

## Browser-Specific Tests

### iOS Safari
- [ ] No zoom on input focus
- [ ] Safe area insets respected (notch)
- [ ] Smooth scrolling works
- [ ] Touch events work correctly

### Chrome Android
- [ ] Address bar hides on scroll
- [ ] Touch events work correctly
- [ ] Viewport height adjusts correctly
- [ ] No layout issues

### Samsung Internet
- [ ] All features work
- [ ] Layout is correct
- [ ] Touch events work

## Accessibility Tests

### Screen Reader
- [ ] Navigation is logical
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Form inputs have labels

### Keyboard Navigation
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] All interactive elements are reachable
- [ ] Escape closes modals/menus

## Common Issues to Check

### Layout Issues
- ❌ Horizontal scrolling
- ❌ Content overflow
- ❌ Overlapping elements
- ❌ Broken grids

### Touch Issues
- ❌ Buttons too small
- ❌ Accidental taps
- ❌ No touch feedback
- ❌ Double-tap zoom

### Performance Issues
- ❌ Slow page load
- ❌ Janky scrolling
- ❌ Large images
- ❌ Too many requests

### Visual Issues
- ❌ Text too small
- ❌ Poor contrast
- ❌ Broken images
- ❌ Misaligned elements

## Testing Tools

### Browser DevTools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- Safari Web Inspector

### Online Tools
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

### Physical Devices
- Test on actual devices when possible
- Use BrowserStack or similar for device testing
- Test on different OS versions

## Sign-Off

### Tested By: _______________
### Date: _______________
### Devices Tested: _______________
### Issues Found: _______________
### Status: ⬜ Pass ⬜ Fail ⬜ Needs Review

## Notes
_Add any additional observations or issues here_
