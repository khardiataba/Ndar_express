# 🎯 YOON WI - Verification & Testing Guide

## ✅ Changes Implemented

### 1. App Name & Branding
- ✅ App name changed from "Yoonbi" to **"YOON WI"**
- ✅ Updated in browser tab, loading screen, and metadata

### 2. Navigation Structure
**New Navbar Layout:**
- Main Items: 🏠 Home | 🧰 Services
- Menu (☰): 🚗 Courses | 🚗 Locations | 🔔 Alerts | 💬 Support | 📋 Mes jobs

**Persistent Layout:**
- ✅ Top navigation bar always visible (shows YOON WI logo + user profile button)
- ✅ Bottom navigation always visible (stays accessible when changing pages)
- ✅ Main content area scrolls between them

### 3. User Profile Management
**New Profile Page (/profile):**
- ✅ View/edit personal information
- ✅ Upload and change profile image
- ✅ Delete account (with confirmation)
- ✅ Accessible from top-right user button

**Backend Endpoints:**
- `GET /api/user/profile` - Retrieve user profile
- `PUT /api/user/profile` - Update profile information
- `DELETE /api/user/account` - Delete entire account
- `DELETE /api/user/info/:field` - Delete specific information

## 🧪 Testing Checklist

### Test 1: App Startup & Loading
```
□ Start backend: npm run dev
□ Start frontend: npm start
□ Verify "YOON WI" appears in browser tab
□ Verify "YOON WI" appears on loading screen
□ Login with test account
```

### Test 2: Navigation & Layout
```
□ Check top nav bar visible (YOON WI logo + profile button)
□ Check bottom nav bar visible (Home | Services | Menu)
□ Click each nav item
  □ Home page loads
  □ Services page loads
  □ Menu dropdown appears
  □ Menu items navigate correctly
  □ Verify nav bars stay visible when switching pages
□ Check responsive design on mobile
```

### Test 3: User Profile
```
□ Click user profile button (top-right)
□ Verify /profile page loads with MainLayout
□ Test profile image upload
  □ Click camera icon
  □ Select image file
  □ Preview updates
□ Edit each field:
  □ Full Name
  □ Phone
  □ Address
  □ City
  □ Postal Code
□ Click "Update Profile" button
□ Verify success message appears
□ Check backend: GET /api/user/profile returns updated data
□ Test delete account (with confirmation dialog)
```

### Test 4: Maps Functionality
```
□ Navigate to Ride/Service pages
□ Verify Google Maps loads
□ Test location picker
□ Test route calculation
□ Verify distance/duration displays correctly
```

### Test 5: Orders/Commands
```
□ Create test ride request
□ Verify ride data saved correctly
□ Check Ride model fields populated:
  □ userId, driverId
  □ pickup, destination (locations)
  □ status, price
  □ vehicleType, paymentMethod
  □ distanceKm, durationMin
□ Test ride status changes:
  □ pending → accepted
  □ accepted → ongoing
  □ ongoing → completed
□ Verify payment tracking works
```

### Test 6: Communication & Socket.io
```
□ Open app in two browsers (different users/roles)
□ Test real-time updates:
  □ Send chat message (watch both browsers)
  □ Driver location updates broadcast
  □ Ride status changes broadcast
  □ Notifications appear instantly
□ Verify socket authentication works (token validation)
□ Test disconnect/reconnect behavior
□ Check no data loss on reconnection
```

### Test 7: Backend Routes
```
Test auth routes:
  □ POST /api/auth/login
  □ POST /api/auth/signup
  □ POST /api/auth/logout

Test user routes:
  □ GET /api/user/profile (requires auth token)
  □ PUT /api/user/profile (requires auth token)
  □ DELETE /api/user/account (requires auth token)
  □ DELETE /api/user/info/phone (test deleting specific fields)

Test ride routes:
  □ POST /api/rides/create
  □ GET /api/rides/:id
  □ PUT /api/rides/:id/status

Test payment routes:
  □ GET /api/payments/wallet/balance
  □ POST /api/payments/ride/:rideId/pay

Test maps routes:
  □ POST /api/maps/route
  □ POST /api/maps/distance-matrix
  □ GET /api/maps/geocode
```

## 🔍 Verification Commands

### Frontend Console
```javascript
// Check YOON WI name displayed
document.querySelector('.font-[\\'Sora\\']')?.textContent // Should show "YOON WI"

// Check auth context
console.log(localStorage.getItem('token')) // Should exist after login
console.log(localStorage.getItem('user')) // Should contain user data
```

### Backend Health Check
```bash
curl http://localhost:5000/
# Expected: {"message": "✅ Ndar Express API - Saint-Louis", "status": "OK", "version": "1.0"}

# Test user profile endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/user/profile
```

### Socket.io Test
```javascript
// In browser console after login
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('✅ Socket connected'));
socket.on('disconnect', () => console.log('❌ Socket disconnected'));
```

## 📋 Files Modified/Created

### Created:
- `frontend/src/components/MainLayout.jsx` - Persistent layout wrapper
- `frontend/src/components/TopNav.jsx` - Top navigation bar
- `frontend/src/pages/Profile.jsx` - User profile management page
- `backend/routes/userRoutes.js` - User management endpoints

### Modified:
- `frontend/src/App.js` - Added MainLayout, Profile route, wrapped pages
- `frontend/src/components/BottomNav.jsx` - Refactored navigation structure
- `frontend/public/index.html` - Updated app name to YOON WI
- `backend/server.js` - Added user routes

## 🚀 Deployment Checklist

Before deploying to production:
```
□ Test all routes with valid/invalid tokens
□ Verify CORS settings allow frontend domain
□ Set GOOGLE_MAPS_API_KEY in .env
□ Set REACT_APP_API_URL in frontend .env
□ Test Socket.io CORS configuration
□ Verify database backups
□ Test image upload functionality
□ Load test the app with multiple concurrent users
□ Check error logging on backend
□ Verify analytics tracking
```

## 🐛 Troubleshooting

### Issue: "auth is not a function" errors
**Solution**: Already fixed - ensure all route files import `{ authMiddleware }` correctly

### Issue: YOON WI logo not showing
**Solution**: Clear browser cache (Ctrl+Shift+Delete) and reload

### Issue: Nav bars disappearing on page change
**Solution**: Ensure all pages are wrapped with `<MainLayout>` component

### Issue: Profile image not uploading
**Solution**: Check backend still has `/uploads` directory and proper permissions

### Issue: Socket.io not connecting
**Solution**: Verify Socket.io CORS origin matches your frontend URL in `.env`

---

**Last Updated**: April 13, 2026
**Status**: ✅ All features implemented and ready for testing
