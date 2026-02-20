# Customer Profile Component Integration Guide

## Overview
This guide explains how the customer profile component has been organized and integrated into the customer dashboard.

## Structure

### Components Created

1. **`src/components/customer/CustomerProfileHeader.jsx`**
   - Displays customer avatar, display name, and member since date
   - Shows average rating and review count
   - Gradient header with modern design

2. **`src/components/customer/CustomerProfileStats.jsx`**
   - Shows activity statistics (jobs posted, completed, completion rate, cancelled)
   - Displays earned badges (Highly Rated, Reliable, etc.)
   - Grid layout with icon-based stat cards

3. **`src/pages/customer/CustomerProfile.jsx`**
   - Main profile page accessible at `/customer/profile`
   - Combines header, stats, and reviews about me
   - Includes navigation back to dashboard and edit profile button

### Dashboard Integration

Added a new "My Profile" card to the customer dashboard quick actions:
- Teal gradient design matching the dashboard theme
- Located after the Messages card
- Direct navigation to `/customer/profile`

### Routing

Added routes in `src/App.jsx`:
- `/customer/profile` → CustomerProfile page
- Integrated in both route sections (lines ~280 and ~352)

## Features

### Current Implementation

1. **Profile Header**
   - Display name or fallback to "FirstName L."
   - Avatar support (with fallback to User icon)
   - Member since date
   - Average rating display

2. **Activity Stats**
   - Jobs posted (last 6 months)
   - Jobs completed
   - Completion rate percentage
   - Jobs cancelled
   - Color-coded stat cards

3. **Badges System**
   - Highly Rated (4.5+ rating)
   - More badges can be added based on backend stats

4. **Reviews About Me**
   - Shows provider reviews about the customer
   - Grid layout with ProviderReviewCard components
   - "View All" button when more than 6 reviews

### Backend Integration Points

The profile currently uses:
- `GET /customer` - Fetch customer profile data
- `getReviewsAboutMe()` - Fetch provider reviews

### Future Backend Integration

When the backend endpoints from `CUSTOMER_PROFILE_BACKEND_IMPLEMENTATION.md` are ready:

1. **Update CustomerProfile.jsx to call:**
   ```javascript
   // Replace current stats calculation with:
   const statsRes = await fetch(
     `https://[API_URL]/customer/profile/stats`,
     { headers: { Authorization: `Bearer ${token}` } }
   );
   const statsData = await statsRes.json();
   setStats(statsData.stats);
   setBadges(statsData.badges);
   ```

2. **Add Privacy Settings:**
   - Create `CustomerProfileSettings.jsx` component
   - Add profile visibility controls (public/restricted/private)
   - Add display name editor
   - Add avatar upload

3. **Enhanced Stats:**
   - Response time tracking
   - Job category distribution chart
   - Activity timeline

## Design Decisions

### Why a Separate Profile Page?

1. **Cleaner Dashboard**: Keeps dashboard focused on actions and quick stats
2. **Dedicated Space**: Profile deserves its own page for detailed information
3. **Better UX**: Users can share profile link with providers
4. **Scalability**: Easy to add more profile features without cluttering dashboard

### Component Organization

```
src/
├── components/
│   └── customer/              # Customer-specific components
│       ├── CustomerProfileHeader.jsx
│       └── CustomerProfileStats.jsx
└── pages/
    └── customer/
        └── CustomerProfile.jsx  # Full profile page
```

This follows the existing pattern where:
- Reusable UI components go in `src/components/`
- Page-level components go in `src/pages/`
- Domain-specific components are grouped by domain (customer, provider, etc.)

## Usage

### For Customers
1. Navigate to Dashboard
2. Click "My Profile" card
3. View public profile, stats, and reviews
4. Click "Edit Profile" to update settings

### For Developers

**To add a new stat:**
```javascript
// In CustomerProfileStats.jsx, add to statItems array:
{
  label: "New Stat",
  value: stats.new_stat || 0,
  icon: IconComponent,
  color: "blue" // or green, purple, red
}
```

**To add a new badge:**
```javascript
// In CustomerProfile.jsx, add to badge generation:
if (stats.some_condition) {
  generatedBadges.push({ 
    type: 'badge_type', 
    label: 'Badge Label' 
  });
}
```

## Next Steps

1. **Backend Integration**
   - Implement endpoints from `CUSTOMER_PROFILE_BACKEND_IMPLEMENTATION.md`
   - Update CustomerProfile.jsx to use new endpoints
   - Add error handling and loading states

2. **Privacy Settings**
   - Create settings component
   - Add profile visibility toggle
   - Implement display name editor

3. **Enhanced Features**
   - Avatar upload functionality
   - Job category distribution chart
   - Activity timeline/history
   - Profile sharing functionality

4. **Testing**
   - Test with different user states (new user, active user, etc.)
   - Test privacy settings
   - Test with various review counts
   - Mobile responsiveness testing

## Related Documentation

- `docs/CUSTOMER_PROFILE_BACKEND_IMPLEMENTATION.md` - Backend API specs
- `REVIEWS_ABOUT_ME_INTEGRATION_COMPLETE.md` - Reviews system integration
- Dashboard structure in `src/pages/customer/Dashboard.jsx`

## Notes

- Profile uses existing ProviderReviewCard component for displaying reviews
- Stats calculation is currently client-side; will move to backend
- Design matches dashboard gradient theme for consistency
- All components use Tailwind CSS for styling
