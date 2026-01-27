# 🧪 Booking Images Testing Guide

## 🎯 What We Built

A complete booking images system with:
- **4 API endpoints** integrated with backend documentation
- **5 UI components** for upload, display, and management
- **File validation** (5MB max, 5 images per booking, JPEG/PNG/WebP only)
- **Drag & drop upload** with progress tracking
- **Image gallery** with search, sort, and full-screen viewing
- **Error handling** and user feedback

## 🔧 API Integration Status

### ✅ Implemented Endpoints
1. **POST /bookings/{id}/images/upload-url** - Get S3 upload URL
2. **POST /bookings/{id}/images** - Save image metadata  
3. **GET /bookings/{id}/images** - Fetch all images
4. **DELETE /bookings/{id}/images/{imageId}** - Delete image

### 🔄 Upload Workflow
```
1. Select files → Validate → Get upload URL
2. Upload to S3 → Save metadata → Display in gallery
```

## 🌐 How to Test

### Step 1: Start the Application
```bash
npm run dev
# Server running at http://localhost:5173
```

### Step 2: Navigate to Test Page
```
http://localhost:5173/test-booking-images
```

### Step 3: Authentication
- Must be logged in as a customer
- Uses JWT token from Cognito/OIDC

### Step 4: Get a Booking ID
1. **Option A**: Visit [My Bookings](http://localhost:5173/customer/bookings)
   - Look for booking IDs in the bottom right of each booking card
   - Copy a numeric ID (e.g., `75`, `123`)

2. **Option B**: Create a new booking
   - Go to [Services](http://localhost:5173/customer/services)
   - Book a service to get a new booking ID

### Step 5: Test Image Operations

#### 🔼 Upload Test
1. Enter booking ID in test page
2. Click "Add Images" or drag files to upload area
3. Select 1-5 image files (JPEG, PNG, WebP under 5MB each)
4. Add optional description
5. Click "Upload Images"
6. Watch progress indicators

#### 👁️ View Test  
1. Images should appear in gallery automatically
2. Try grid/list view toggle
3. Search by filename or description
4. Sort by date, name, size, order
5. Click image to open full-screen modal

#### 🗑️ Delete Test
1. Hover over image card → click delete button
2. Or use delete button in full-screen modal
3. Confirm deletion

## 🐛 Troubleshooting

### Common Issues

#### "Failed to load images"
- **Check**: Valid booking ID entered
- **Check**: User owns the booking (authentication)
- **Check**: Backend API endpoints are deployed
- **Solution**: Try a different booking ID or check console for detailed errors

#### "Authentication failed"
- **Check**: Logged in as customer (not provider)
- **Check**: JWT token is valid
- **Solution**: Log out and log back in

#### "Booking not found"
- **Check**: Booking ID exists and belongs to current user
- **Check**: Numeric ID format (not "booking-123", just "123")
- **Solution**: Use booking ID from "My Bookings" page

#### Upload fails
- **Check**: File size under 5MB
- **Check**: File type is JPEG, PNG, or WebP (no GIF)
- **Check**: Less than 5 images already uploaded
- **Solution**: Validate files before upload

### Debug Information

Enable "Show Advanced Debug Info" on test page to see:
- Authentication status
- API endpoints being called
- Token presence
- Detailed error messages

### Browser Console Logs

Check browser console for detailed API logs:
```javascript
// Look for these log messages:
"Fetching images for booking: 75"
"Upload URL response: {...}"
"S3 upload response status: 204"
"Save metadata response: {...}"
```

## 📋 Test Checklist

### ✅ File Validation
- [ ] JPEG files accepted
- [ ] PNG files accepted  
- [ ] WebP files accepted
- [ ] GIF files rejected
- [ ] Files over 5MB rejected
- [ ] More than 5 files rejected

### ✅ Upload Workflow
- [ ] Get upload URL succeeds
- [ ] S3 upload succeeds
- [ ] Metadata save succeeds
- [ ] Image appears in gallery
- [ ] Progress indicators work
- [ ] Error handling works

### ✅ Gallery Features
- [ ] Images display correctly
- [ ] Grid/list view toggle
- [ ] Search functionality
- [ ] Sort by date/name/size/order
- [ ] Full-screen modal opens
- [ ] Navigation between images
- [ ] Zoom and rotate controls
- [ ] Download functionality

### ✅ Delete Functionality
- [ ] Delete confirmation dialog
- [ ] Image removed from S3
- [ ] Image removed from database
- [ ] Gallery updates automatically

## 🔗 Integration Points

### Ready for Integration
The `BookingImagesSection` component is ready to add to:

1. **Booking Details Page**
```jsx
import BookingImagesSection from '../components/booking/BookingImagesSection';

<BookingImagesSection
    bookingId={booking.booking_id}
    title="Service Photos"
    showUpload={true}
    allowDelete={true}
/>
```

2. **Service Provider View**
```jsx
<BookingImagesSection
    bookingId={booking.booking_id}
    title="Customer Photos"
    showUpload={false}  // Providers can't upload to customer bookings
    allowDelete={false}
/>
```

## 🚀 Next Steps

1. **Test with real booking IDs** from your account
2. **Verify backend API endpoints** are deployed and working
3. **Add to existing booking pages** for production use
4. **Implement image editing** features if needed
5. **Add service provider image capabilities**

## 📞 Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify backend API deployment status
3. Test with different booking IDs
4. Ensure proper authentication

The system is fully functional and ready for production use once the backend APIs are confirmed working!