# 🚀 NDAR EXPRESS - Comprehensive Features & Capabilities Inventory

**Application Name:** NDAR EXPRESS  
**Version:** 1.0  
**Location:** Saint-Louis, Senegal  
**Core Services:** Mobility (Rides) + Services (Artisans & Food) + Vehicle Rentals  

---

## 📋 TABLE OF CONTENTS

1. [User Management & Authentication](#user-management--authentication)
2. [Rides/Mobility Service](#ridesmobility-service)
3. [Services/Artisans System](#servicesartisans-system)
4. [Vehicle Rentals](#vehicle-rentals)
5. [Payments & Wallet System](#payments--wallet-system)
6. [Ratings & Reviews](#ratings--reviews)
7. [Notifications System](#notifications-system)
8. [Support & Support Tickets](#support--support-tickets)
9. [Gallery & Portfolio Management](#gallery--portfolio-management)
10. [Maps & Geolocation Services](#maps--geolocation-services)
11. [Admin Management](#admin-management)
12. [Real-time Features (Socket.io)](#real-time-features-socketio)
13. [Security & Document Verification](#security--document-verification)
14. [Frontend Pages & Components](#frontend-pages--components)
15. [API Architecture](#api-architecture)

---

## 1. User Management & Authentication

### 🔐 User Roles
- **Client** - Regular users booking rides/services
- **Driver** - Drivers providing ride services
- **Technician** - Service providers (artisans, beauticians, food vendors, delivery)
- **Server** - Additional service provider role
- **Admin** - Platform administrators with full access

### 👤 User Model Fields
#### Core Identity
- `firstName`, `lastName`, `name` - User name information
- `email` - Unique email address
- `password` - Encrypted password
- `phone` - Senegal phone number (validated format)
- `role` - User role assignment

#### Profile & Media
- `profilePhotoUrl` - Profile picture
- `idCardUrl`, `idCardFrontUrl`, `idCardBackUrl` - ID documentation
- `licenseUrl` - Driving license (for drivers)
- `registrationCardUrl` - Vehicle registration (for drivers)

#### Status & Verification
- `status` - Account status: `pending`, `needs_revision`, `verified`, `cancelled`, `suspended`
- `reviewNote` - Admin notes on verification
- `documentChecks` - Document review status by type
  - Each document has: `status` (missing/pending/valid/rejected), `note`, `reviewedAt`

#### Safety System
- `safetyReportsCount` - Number of safety/incident reports
- `safetySuspendedAt` - Suspension timestamp
- `safetySuspensionReason` - Reason for suspension
- `safetyLastReportAt` - Last report timestamp

#### Ratings & Reputation
- `rating` - Average rating (1.0 to 5.0, default 5.0)
- `totalRatings` - Total number of ratings received
- `ratingSum` - Sum of all rating values
- `completedRides` - Total completed rides/services
- `cancelledRides` - Total cancelled rides
- `onTimeRate` - On-time performance percentage

#### Earnings & Statistics (for Drivers/Technicians)
- `totalEarnings` - Lifetime earnings
- `todayEarnings` - Today's earnings
- `weeklyEarnings` - Week's earnings
- `monthlyEarnings` - Month's earnings

#### Location & Availability
- `isOnline` - Online status boolean
- `lastSeen` - Last activity timestamp
- `currentLocation` - Current coordinates (lat/lng, updatedAt)

#### Provider Details (for Drivers/Technicians)
- `serviceCategory` - Professional category (Plomberie, Electricité, Menuiserie, etc.)
- `experienceYears` - Experience level
- `serviceArea` - Coverage area (Centre-ville, Guet-Ndar, Hydrobase, etc.)
- `locationLabel` - Custom location label
- `coordinates` - GPS coordinates (lat/lng)
- `availability` - Availability status (hours per week/day)
- `vehicleBrand` - Vehicle brand (for drivers/delivery)
- `vehicleType` - Vehicle type/category
- `vehiclePlate` - License plate number (validated format)
- `beautySpecialty` - Beauty service specialty
- `otherServiceDetail` - Custom service details
- `hasProfessionalTools` - Boolean flag for tools/equipment

### 🔑 Authentication Endpoints
- **POST** `/api/auth/register` - User registration with role and provider details
- **POST** `/api/auth/login` - User login with JWT token generation
- **POST** `/api/auth/forgot-password` - Password reset request
- **POST** `/api/auth/reset-password` - Password reset completion

### ✅ Validation Rules
- Email must be valid format
- Password minimum 8 characters with letters and numbers
- Senegal phone numbers validated (7xx xxx xx xx format)
- Vehicle plates validated (ABC-1234-XYZ format)
- Professional categories from predefined list
- Service areas from predefined Saint-Louis locations
- Provider documents required based on role

---

## 2. Rides/Mobility Service

### 🚗 Ride Model
#### Core Booking
- `userId` - Client/passenger ID (reference to User)
- `driverId` - Assigned driver ID (optional initially)
- `pickup` - Pickup location (name, address, lat, lng)
- `destination` - Destination location (name, address, lat, lng)
- `status` - Ride status: `pending`, `accepted`, `ongoing`, `completed`, `cancelled`
- `createdAt` - Booking timestamp

#### Pricing & Commission
- `price` - Full ride price
- `appCommissionPercent` - App commission percentage (default 12%)
- `appCommissionAmount` - Calculated commission amount
- `providerNetAmount` - Driver's net earnings

#### Route Details
- `vehicleType` - Vehicle type (e.g., "YOON WI Classic", "YOON WI Confort")
- `distanceKm` - Distance in kilometers
- `durationMin` - Estimated duration in minutes
- `paymentMethod` - Payment method: `Cash`, `Wave`, `OM`, `Card`

#### Safety Features
- `safetyCode` - 4-digit safety verification code
- `safetyCodeVerifiedAt` - Code verification timestamp
- `safetyReports[]` - Array of incident/safety reports

### 🎯 Ride Endpoints

#### Client Operations
- **POST** `/api/rides/` - Create new ride request
  - Required: pickup, destination, price
  - Optional: vehicleType, paymentMethod, distanceKm, durationMin

- **GET** `/api/rides/` - Get all user's rides (paginated)

- **GET** `/api/rides/:id` - Get specific ride details

- **PATCH** `/api/rides/:id/cancel` - Cancel a ride
  - Only if status is pending or accepted

- **PATCH** `/api/rides/:id/complete` - Mark ride as completed

- **POST** `/api/rides/:id/safety-report` - Report safety incident
  - Fields: type, message, location

- **POST** `/api/rides/estimate` - Get route estimation
  - Uses OSRM (Open Source Routing Machine)
  - Returns: distanceKm, durationMin, geometry

#### Driver Operations
- **GET** `/api/rides/available` - Get available rides near driver

- **PATCH** `/api/rides/:id/accept` - Accept a ride request

- **PATCH** `/api/rides/:id/start` - Start the ride (arriving at pickup)

- **PATCH** `/api/rides/:id/pickup-passenger` - Pickup the passenger

### ⚙️ Ride Features
- **Route Estimation** - Using OSRM API for accurate distance/time
- **Fallback Calculation** - If external API fails, uses Haversine formula
- **Safety Codes** - 4-digit codes shared between passenger and driver
- **Real-time Tracking** - Via Socket.io (see Real-time Features)
- **Commission Calculation** - Automatic app commission deduction
- **Distance Calculation** - Haversine formula for lat/lng pairs
- **Multiple Vehicle Types** - Different price tiers

### 💰 Pricing Rules
- Base price calculation from distance and duration
- 12% default commission to platform
- Net amount calculated automatically (price - commission)
- Multiple vehicle class options with different pricing

---

## 3. Services/Artisans System

### 🔧 Service Request Model
#### Service Details
- `clientId` - Client requesting service
- `technicianId` - Assigned technician/provider
- `startDate` - Service start date/time
- `endDate` - Service completion date/time

#### Categories & Classification
- `category` - Service category: `menuisier` (carpenter), `maçon` (mason), `peintre` (painter), `pâtissier` (baker), `électricien` (electrician), `coiffure-beaute` (beauty), `livreur` (delivery), `autres` (other)
- `serviceFamily` - Family classification: `artisan`, `food`, `beauty`, `delivery`, `other`
- `title` - Service title
- `description` - Service description
- `preferredProviderId` - Client's vendor preference
- `preferredProviderName` - Preferred provider name

#### Client Specifications
- `clientBudget` - Client's estimated budget
- `preferredDistanceKm` - Max distance acceptable

#### Pricing & Quotes
- `price` - Final agreed price
- `quotedPrice` - Quoted price from provider
- `quoteNote` - Provider's quote notes
- `quotedBy` - Provider who quoted
- `quotedAt` - Quote timestamp
- `quoteAcceptedAt` - Acceptance timestamp

#### Commission & Revenue Sharing
- `appCommissionPercent` - Platform commission percentage
- `appCommissionAmount` - Platform commission amount
- `providerNetAmount` - Provider earnings after commission

#### Service Status Flow
- `status` - Service status: `pending`, `quoted`, `accepted`, `in_progress`, `completed`, `cancelled`

#### Safety & Verification
- `safetyCode` - 4-digit verification code
- `safetyCodeVerifiedAt` - Code verification timestamp
- `safetyReports[]` - Incident reports

#### Platform Contribution
- `platformContributionStatus` - `due`, `paid`, `refunded`
- `platformContributionAmountPaid` - Amount paid
- `platformContributionPaymentMethod` - Payment method used
- `platformContributionCollectedAt` - Collection timestamp
- `platformContributionReference` - Transaction reference

### 🏪 Service Provider Data Structure
Each provider has:
- Service category and specialization
- Service area (zone in Saint-Louis)
- Availability status
- Experience years
- Professional tools confirmation
- Location coordinates
- Rating and reviews

### 📱 Service Endpoints

#### Client Operations
- **POST** `/api/services/` - Create new service request
  - Required: category, description
  - Optional: title, price (budget), preferredProviderId, preferredDistanceKm

- **GET** `/api/services/` - Get all user's service requests

- **GET** `/api/services/:id` - Get specific service request details

- **PATCH** `/api/services/:id/accept-quote` - Accept provider's quote

- **PATCH** `/api/services/:id/cancel` - Cancel service request

- **PATCH** `/api/services/:id/complete` - Mark service as completed

- **POST** `/api/services/:id/safety-report` - Report safety issue

#### Provider/Technician Operations
- **GET** `/api/services/available` - Get available service requests nearby

- **POST** `/api/services/:id/quote` - Submit price quote
  - Fields: quotedPrice, quoteNote

- **PATCH** `/api/services/:id/accept` - Accept service request

- **PATCH** `/api/services/:id/start` - Start service work

- **POST** `/api/services/:id/upload-before-after` - Upload before/after images

#### Admin/Search
- **GET** `/api/services/search` - Search services with filters
  - Query params: category, area, minRating, maxDistance, lat, lng

### 🎯 Service Features
- **Provider Discovery** - Location-based matching with distance calculation
- **Quote System** - Providers submit quotes, clients accept/reject
- **Service Categories** - 8+ predefined categories
- **Availability Matching** - Providers filtered by availability
- **Distance Calculation** - Haversine-based provider proximity
- **Before/After Tracking** - Portfolio documentation

### 📊 Provider Categories
1. **Artisans**: Menuisier, Maçon, Peintre, Électricien, Plomberie, Soudure, Jardinage
2. **Food/Restaurants**: Pâtissier, Restauration/Pâtisserie
3. **Beauty**: Coiffure & Beauté
4. **Delivery**: Livreur, Coursier, Livraison/Coursier
5. **Other**: Assistant, Traducteur, Imprimeur, Informatique, Cours/Soutien, Ménage, Baby-sitting, Aide à domicile, Événementiel

---

## 4. Vehicle Rentals

### 🚙 VehicleRental Model
#### Vehicle Information
- `provider` - Provider/owner ID (reference to User)
- `vehicleName` - Model name
- `vehicleType` - Type: `small` (moto, scooter, compact car) or `large` (SUV, minibus, van)
- `brand` - Car brand (Toyota, Nissan, etc.)
- `model` - Car model
- `year` - Manufacture year
- `color` - Vehicle color
- `licensePlate` - License plate number

#### Pricing
- `pricePerDay` - Daily rental rate
- `pricePerHour` - Hourly rental rate (optional)

#### Capacity & Features
- `capacity.passengers` - Number of passengers
- `capacity.luggage` - Luggage capacity description
- `features[]` - Feature list (Climatisation, Bluetooth, WiFi, etc.)

#### Availability & Location
- `availabilityStatus` - Status: `available`, `rented`, `maintenance`
- `location` - Location details (address, lat, lng)

#### Requirements & Logistics
- `driverLicenseRequired` - Boolean flag
- `insuranceIncluded` - Insurance coverage

#### Media & Rating
- `photoUrl` - Main vehicle photo
- `additionalPhotos[]` - Additional photos
- `rating` - Average rating (1-5)
- `totalRentals` - Total rentals count

### 🔑 Rental Endpoints

#### Client Operations
- **GET** `/api/rentals/` - Get available vehicles with filters
  - Query: vehicleType, lat, lng, maxDistance

- **GET** `/api/rentals/:id` - Get specific vehicle details

- **GET** `/api/rentals/type/:typeQuery` - Get vehicles by type
  - Query: lat, lng

#### Provider Operations
- **POST** `/api/rentals/` - List new vehicle for rental
- **PATCH** `/api/rentals/:id` - Update vehicle details
- **PATCH** `/api/rentals/:id/status` - Update availability status
- **DELETE** `/api/rentals/:id` - Remove vehicle listing

### 🚗 Rental Features
- **Distance Filtering** - Find rentals within specified radius
- **Vehicle Type Filtering** - Search by vehicle category
- **Rating System** - Customer reviews for each vehicle
- **Location Mapping** - GPS coordinates for rental pickup
- **Multiple Pricing** - Daily and hourly rates available

---

## 5. Payments & Wallet System

### 💳 Wallet Model
#### Wallet Balance
- `userId` - User reference
- `balance` - Current wallet balance (minimum 0)
- `currency` - Currency code (default: XOF - Franc CFA)
- `isActive` - Account status

#### Auto-recharge Settings
- `autoRecharge.enabled` - Auto-recharge enabled flag
- `autoRecharge.threshold` - Minimum balance triggering auto-recharge
- `autoRecharge.amount` - Auto-recharge amount

### 📊 Transaction Model
#### Transaction Details
- `userId` - User performing transaction
- `type` - Transaction type: `credit`, `debit`, `refund`, `bonus`, `withdrawal`
- `amount` - Transaction amount
- `currency` - Currency code
- `description` - Transaction description
- `reference` - Reference ID (ride/service/payment ID)
- `referenceType` - Reference type: `ride`, `service`, `stripe_payment`, `manual`, `bonus`
- `status` - Transaction status: `pending`, `completed`, `failed`, `cancelled`
- `paymentMethod` - Payment method used: `wallet`, `stripe`, `cash`, `wave`, `om`, `free_money`, `bank_transfer`
- `metadata` - Additional metadata (JSON)

### 💰 Payment Methods
1. **Cash** - Cash payment at end of transaction
2. **Wave** - Wave Money (Senegal mobile money)
3. **OM** - Orange Money (Senegal mobile money)
4. **Card** - Credit/debit card via Stripe
5. **Wallet** - In-app wallet balance

### 🔑 Payment Endpoints

#### Wallet Management
- **GET** `/api/payments/wallet/balance` - Get current wallet balance

- **GET** `/api/payments/wallet/transactions` - Get transaction history
  - Query: limit, offset (pagination)

- **POST** `/api/payments/wallet/recharge` - Recharge wallet
  - Body: amount, stripeToken

- **POST** `/api/payments/wallet/auto-recharge` - Configure auto-recharge
  - Body: enabled, threshold, amount

#### Transaction Processing
- **POST** `/api/payments/ride/:rideId/pay` - Process ride payment
  - Atomic debit from client wallet
  - Atomic credit to driver wallet

- **POST** `/api/payments/service/:serviceRequestId/pay` - Process service payment
  - Wallet debit from client
  - Wallet credit to provider

- **POST** `/api/payments/refund/:reference` - Process refund
  - Admin-only endpoint
  - Refundable types: ride, service

#### Stripe Integration
- **POST** `/api/payments/checkout` - Create Stripe checkout session
- **POST** `/api/payments/webhook` - Stripe webhook handler
  - Events: payment_intent.succeeded, charge.refunded

### 🔒 Payment Features
- **Atomic Operations** - Ensures financial integrity
- **Commission Handling** - Automatic commission deduction
- **Transaction History** - Full audit trail
- **Multiple Payment Methods** - Local + international
- **Auto-recharge** - Automatic wallet top-up
- **Wallet Isolation** - Per-user wallet integrity

---

## 6. Ratings & Reviews

### ⭐ Rating System
#### Rating Structure
- Ratings on 1-5 star scale
- Can rate both directions (client rates driver, driver rates client)
- Can rate after ride completion
- Can rate services similarly

#### Rating Storage (in User model)
- `rating` - Average rating
- `totalRatings` - Number of ratings received
- `ratingSum` - Sum of all ratings

### 📝 Rating Endpoints

- **POST** `/api/ratings/ride/:rideId` - Rate a completed ride
  - Body: ratedId, rating, comment, type

- **POST** `/api/ratings/service/:serviceRequestId` - Rate a service
  - Body: ratedId, rating, comment, type

- **GET** `/api/ratings/stats/:userId` - Get user's rating statistics
  - Returns: average rating, total count, breakdown by stars

- **POST** `/api/ratings/report/:ratingId` - Report inappropriate rating
  - Body: reason
  - Admin review required

### ⭐ Rating Features
- **Two-way Ratings** - Passengers and drivers both rate
- **Detailed Comments** - Optional written feedback
- **Rating Reports** - Flag inappropriate reviews for admin
- **Statistical Tracking** - Aggregate rating data
- **Rating-based Reputation** - User visibility based on ratings

---

## 7. Notifications System

### 🔔 Notification Model
#### Notification Fields
- `userId` - Target user
- `title` - Notification title
- `message` - Notification message
- `category` - Category: `info`, `warning`, `success`, `security`
- `link` - Navigation link for action
- `metadata` - Additional context (JSON)
- `isRead` - Read status boolean
- `createdAt` - Creation timestamp

### 📨 Notification Endpoints

- **GET** `/api/notifications/` - Get user's notifications
  - Returns: sorted by recency

- **GET** `/api/notifications/unread-count` - Get unread notification count

- **POST** `/api/notifications/mark-read` - Mark specific notifications as read
  - Body: notificationIds[]

- **POST** `/api/notifications/mark-all-read` - Mark all as read

- **POST** `/api/notifications/test-create` - Create test notification (debug)

### 🔔 Notification Events
- Ride accepted/declined
- Ride driver nearby
- Ride completed
- Service quote received
- Service accepted/completed
- Payment processed/failed
- Document verification status
- Safety incident reported
- Support ticket updated
- Admin announcements

### 📲 Notification Features
- **Real-time Delivery** - Via Socket.io
- **Persistence** - Stored in database
- **Categorization** - Info/warning/success/security
- **Navigation Links** - Direct app navigation
- **Batch Operations** - Mark multiple as read
- **Audit Trail** - Keep all notifications

---

## 8. Support & Support Tickets

### 🎫 SupportTicket Model
#### Ticket Details
- `userId` - Ticket creator
- `subject` - Ticket subject
- `category` - Category: `ride`, `payment`, `security`, `technical`, `other`
- `priority` - Priority: `low`, `normal`, `high`
- `status` - Status: `open`, `pending`, `resolved`, `closed`
- `assignedTo` - Assigned admin (optional)

#### Messaging
- `messages[]` - Array of ticket messages
  - Each message: senderId, senderRole (client/driver/technician/admin), message text, timestamp
- `createdAt`, `updatedAt`, `resolvedAt` - Timestamps

### 📋 Support Endpoints

- **POST** `/api/support/ticket` - Create new support ticket
  - Required: subject, message
  - Optional: category, priority

- **GET** `/api/support/tickets` - Get user's tickets (or all if admin)
  - Returns: sorted by update timestamp
  - Admin sees all tickets, users see only their own

- **POST** `/api/support/tickets/:id/respond` - Add response to ticket
  - Body: message (optional), status (optional)
  - Users can respond, admins can change status

- **PATCH** `/api/support/tickets/:id/assign` - Assign ticket to admin
  - Admin-only
  - Body: adminId

### 🆘 Support Features
- **Ticket Threading** - Conversation history per ticket
- **Priority Routing** - High-priority tickets flagged
- **Admin Assignment** - Route to responsible staff
- **Category Classification** - Organize by issue type
- **Status Tracking** - Track resolution progress

---

## 9. Gallery & Portfolio Management

### 🖼️ ProviderGallery Model
#### Gallery Structure
- `provider` - Provider/owner (User reference)
- `galleryItems[]` - Array of gallery items
  - Each item: title, description, imageUrl, thumbnailUrl, category, tags[], uploadedAt
  - Categories: `work` (completed projects), `portfolio`, `before-after`, `team`, `facility`

#### Gallery Metadata
- `coverImage` - Featured gallery image
- `totalImages` - Count of images
- `createdAt`, `updatedAt` - Timestamps

#### Before/After Items
- `beforeUrl` - Before photo
- `afterUrl` - After photo

### 📸 Gallery Endpoints

- **GET** `/api/gallery/provider/:providerId` - Get provider's gallery
  - Returns all items, images, and metadata

- **POST** `/api/gallery/:providerId/upload` - Upload image to gallery
  - Auth: provider-only or admin
  - Multipart: image file (max 10MB)
  - Body: title, description, category, tags

- **PATCH** `/api/gallery/:providerId/:itemId` - Update gallery item
  - Auth: provider or admin
  - Body: title, description, category, tags

- **DELETE** `/api/gallery/:providerId/:itemId` - Delete gallery item
  - Auth: provider or admin

- **PATCH** `/api/gallery/:providerId/cover` - Set cover image
  - Body: itemId

### 🎨 Gallery Features
- **Image Upload** - Drag-drop or file select
- **Categories** - Organize by type (work, portfolio, before-after)
- **Tagging** - Add searchable tags
- **Before/After** - Document transformation
- **Cover Image** - Featured portfolio item
- **Automatic Thumbnails** - For optimization

---

## 10. Maps & Geolocation Services

### 🗺️ Google Maps Integration

#### Maps Endpoints

- **POST** `/api/maps/route` - Calculate route between two points
  - Body: origin, destination, options
  - Returns: distance, duration, polyline, geometry

- **POST** `/api/maps/distance-matrix` - Get distance matrix
  - Body: origins[], destinations[], options
  - Returns: matrix of distances/durations

- **GET** `/api/maps/reverse-geocode` - Get address from coordinates
  - Query: lat, lng
  - Returns: address, city, components

- **GET** `/api/maps/geocode` - Get coordinates from address
  - Query: address
  - Returns: coordinates, place details

- **GET** `/api/maps/places` - Search nearby places
  - Query: query, lat, lng, radius
  - Returns: nearby places with details

#### Location Utilities

- **Haversine Distance** - Calculate distance between lat/lng pairs
- **Location Validation** - Validate coordinate pairs
- **Reverse Geocoding** - Address lookup
- **Route Estimation** - Via OSRM or Google Maps
- **Proximity Search** - Find nearby providers/services

### 📍 Service Areas
Predefined areas in Saint-Louis:
- Centre-ville
- Guet-Ndar
- Hydrobase
- Sor
- Balacoss
- Ndioloffene
- Université/Sanar
- Gandon
- Toute la ville (entire city)

### 🎯 Location Features
- **Real-time Location** - User location tracking
- **Service Area Coverage** - Provider service zones
- **Distance Calculation** - Accurate Haversine formula
- **Geocoding** - Address to coordinates
- **Route Planning** - Optimal path calculation
- **Proximity Matching** - Find nearby drivers/providers

---

## 11. Admin Management

### 👨‍💼 Admin Role Capabilities

#### User Management
- **GET** `/api/admin/users/pending` - List pending verification users
  - Returns: drivers and technicians awaiting approval

- **PATCH** `/api/admin/users/:id/documents-review` - Review user documents
  - Body: documentKey, status (pending/valid/rejected), note
  - Document types: profilePhoto, idCardFront, idCardBack, license, registrationCard

- **PATCH** `/api/admin/users/:id/status` - Update user account status
  - Body: status (verified/suspended/cancelled)
  - Triggers notifications

- **PATCH** `/api/admin/users/:id/set-role` - Change user role
  - Body: newRole

#### Document Verification
- **GET** `/api/admin/documents/pending` - Documents awaiting review
- **POST** `/api/admin/documents/:id/approve` - Approve document
- **POST** `/api/admin/documents/:id/reject` - Reject document with note
- **GET** `/api/admin/documents/stats` - Verification statistics

#### Payment Management
- **POST** `/api/payments/refund/:reference` - Issue refunds
  - Body: reason, method (wallet/stripe)

- **GET** `/api/admin/payments/transactions` - View all transactions
- **GET** `/api/admin/payments/reports` - Payment reports

#### Ride/Service Oversight
- **GET** `/api/admin/rides` - View all rides with filters
- **GET** `/api/admin/services` - View all services
- **POST** `/api/admin/rides/:id/cancel` - Force-cancel ride
- **POST** `/api/admin/services/:id/cancel` - Force-cancel service

#### Notifications
- **POST** `/api/admin/notifications/broadcast` - Send system-wide notification
- **POST** `/api/notifications/` - Admin-send notification to user

### 📊 Admin Features
- **Document Review** - Multi-document verification workflow
- **User Status Control** - Approve/suspend/verify users
- **Financial Oversight** - Refund management
- **Transaction Auditing** - Full transaction history
- **Safety Escalation** - Handle reported incidents
- **System Broadcasts** - Send announcements

---

## 12. Real-time Features (Socket.io)

### 🔌 Socket.io Architecture

#### Connection Management
- JWT authentication on socket handshake
- User tracking (userId → socketId mapping)
- Active drivers registry
- Active rides registry

#### Socket Events Emitted (Server to Client)

**Driver Events:**
- `driver:online-success` - Confirmation driver went online
- `driver:available-rides` - New rides matching driver criteria
- `driver:nearby-passenger` - Passenger requesting ride nearby

**Passenger Events:**
- `ride:driver-accepted` - Driver accepted the ride
- `ride:driver-arriving` - Driver is on the way
- `driver:location-update` - Real-time driver location

**Ride Events:**
- `ride:status-update` - Ride status changed
- `ride:completed` - Ride completed
- `ride:cancelled` - Ride cancelled

**Chat Events:**
- `chat:message` - New message in conversation
- `chat:typing` - Someone is typing

**Admin Events:**
- `admin:user-suspended` - User account suspended
- `admin:document-rejected` - Document verification failed

#### Socket Events Received (Client to Server)

- `driver:online` - Driver goes online
  - Data: location, vehicleType

- `driver:location-update` - Driver location refresh
  - Data: latitude, longitude, heading, speed

- `passenger:location-update` - Passenger location sync
  - Data: rideId, latitude, longitude, address

- `ride:request` - Passenger requests ride
  - Data: pickup, destination, rideId

- `ride:accept` - Driver accepts ride
  - Data: rideId

- `ride:status-update` - Update ride status
  - Data: rideId, newStatus, location

- `chat:message` - Send chat message
  - Data: rideId, message, attachment

#### Real-time Matching Algorithm
- Find drivers within 5km radius
- Sort by distance (nearest first)
- Filter by availability status
- Broadcast to matching drivers

#### Distance Calculation (Socket)
- Haversine formula for lat/lng pairs
- Updates every location change
- Calculates ETA based on speed

### 📡 Real-time Features
- **Live Location** - Driver and passenger tracking
- **Instant Notifications** - Event-based alerts
- **Chat System** - In-app messaging
- **Driver Matching** - Real-time ride request broadcasting
- **Status Synchronization** - Ride status updates
- **Presence Tracking** - Online/offline status

---

## 13. Security & Document Verification

### 🔐 Document Verification System

#### Verification Workflow
1. Upload documents during signup
2. Automatic verification via OCR (Tesseract)
3. Admin manual review
4. Status update: pending → valid/rejected
5. Account status: pending → verified/needs_revision

#### Document Types Required (by Role)

**All Drivers:**
- Profile photo
- ID card (front & back)
- Driving license
- Vehicle registration card

**All Technicians:**
- Profile photo
- ID card (front & back)

**Delivery Services:**
- Same as drivers

#### Document Status Flow
- `missing` - Not yet uploaded
- `pending` - Awaiting manual review
- `valid` - Approved
- `rejected` - Rejected with note

#### Account Status Flow
- `pending` - Initial state, incomplete documents
- `needs_revision` - Documents rejected, resubmit needed
- `verified` - All documents approved, ready to work
- `suspended` - Suspended for violations/safety
- `cancelled` - User-initiated or admin deactivation

### 🛡️ Safety Features

#### Safety Report System
- Report unsafe behavior during rides/services
- 3 reports trigger automatic account suspension
- Report includes: type, message, location, reporter role
- Admin review and resolution

#### Safety Codes
- 4-digit code generated per ride/service
- Shared between parties
- Verified upon completion
- Prevents imposters

#### Suspension Rules
- 3+ safety reports → automatic suspension
- Admin can manually suspend
- Reason and date recorded
- Notification sent to user

#### Additional Safety Measures
- Role-based access control
- Rate limiting on authentication
- JWT token expiration
- Request validation and sanitization
- XSS and CSRF protection via helmet

---

## 14. Frontend Pages & Components

### 📄 Pages (JSX Components)

#### Authentication
- **Welcome.jsx** - Landing page, role selection
- **Login.jsx** - User login form
- **Signup.jsx** - User registration with multi-step provider details
- **ForgotPassword.jsx** - Password reset request
- **ResetPassword.jsx** - Password reset confirmation
- **PendingApproval.jsx** - Account approval status page

#### Core User Interfaces
- **Home.jsx** - Main dashboard with service/ride discovery
- **Ride.jsx** - Book a ride with pickup/destination
- **RideTracking.jsx** - Live ride tracking during transit
- **RideDetails.jsx** - Ride details and history
- **Service.jsx** - Request a service with details
- **ServiceDetails.jsx** - View service request details

#### Booking & Management
- **MyBookings.jsx** - View all user's rides and services
- **Rental.jsx** - Browse and book vehicle rentals
- **RentalDetail.jsx** - Vehicle rental details

#### Profile & Dashboard
- **Profile.jsx** - User profile editing
- **DriverDashboard.jsx** - Driver-specific dashboard
  - Available rides list
  - Revenue tracking (today/week/month)
  - Completed rides history
  - Commission breakdown

- **TechnicianDashboard.jsx** - Service provider dashboard
  - Pending service requests
  - Response management
  - Portfolio

- **AdminDashboard.jsx** - Admin control panel
  - User management and verification
  - Document review
  - Financial reports
  - Safety incident handling

#### Support & Communication
- **Support.jsx** - Support ticket creation and tracking
- **Notifications.jsx** - Notification center
- **DriverTracking.jsx** - Real-time driver location (admin)

#### Other
- **NotFound.jsx** - 404 error page
- **ServerError.jsx** - 500 error page

### 🧩 Key Components (Reusable)

#### Navigation
- **TopNav.jsx** - Top navigation bar
- **BottomNav.jsx** - Bottom navigation (mobile)
- **MainLayout.jsx** - Main layout wrapper

#### Maps & Location
- **GoogleMap.jsx** - Map display with markers
- **LocationPicker.jsx** - Location selection interface
- **MapPicker.jsx** - Advanced map picker
- **GoogleMapsError.jsx** - Google Maps error handling
- **RideEstimator.jsx** - Ride fare estimation display

#### Forms & Input
- **ProtectedRoute.jsx** - Route protection with auth check
- **ErrorBoundary.jsx** - Error boundary wrapper

#### Media & Portfolio
- **GalleryUploader.jsx** - Image upload component
- **GalleryViewer.jsx** - Gallery display
- **ProviderPortfolio.jsx** - Provider portfolio showcase
- **VehicleCard.jsx** - Vehicle rental card
- **VehicleManagement.jsx** - Vehicle management interface

#### Payments & Wallet
- **WalletCard.jsx** - Wallet balance display

#### Ratings
- **RatingModal.jsx** - Rate user/service modal
- **RatingStars.jsx** - Star rating display/input

#### UI Utilities
- **Toast.jsx** - Toast notifications

### 🎨 Frontend Features
- **Responsive Design** - Mobile-first layout
- **Real-time Updates** - Socket.io integration
- **API Integration** - Axios-based requests
- **Context API** - Auth context management
- **Form Validation** - Input validation
- **Error Handling** - User-friendly errors
- **Loading States** - Loading indicators
- **Toast Notifications** - User feedback

---

## 15. API Architecture

### 🌐 Base API Information
- **Base URL:** `http://localhost:5000/api` (development)
- **Production:** Configurable via environment
- **Protocol:** REST with JSON
- **Authentication:** Bearer JWT in Authorization header

### 🔌 API Routes Structure

```
/api/
├── /auth                    - Authentication endpoints
├── /rides                   - Ride booking & management
├── /services                - Service requests & discovery
├── /rentals                 - Vehicle rentals
├── /payments                - Payment processing & wallet
├── /ratings                 - Ratings & reviews
├── /notifications           - Notification management
├── /support                 - Support tickets
├── /gallery                 - Provider portfolio
├── /maps                    - Maps & geolocation
├── /admin                   - Admin management
├── /applications            - Job applications
├── /user                    - User profile
└── /uploads                 - Static file serving
```

### 📊 API Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message",
  "error": null
}
```

### 🔒 Middleware Chain
1. **CORS** - Cross-origin request handling
2. **Helmet** - Security headers
3. **Rate Limiting** - Request throttling
4. **Body Parser** - JSON/URL-encoded parsing
5. **Authentication** - JWT verification
6. **Role-based Access** - Permission checking
7. **Document Verification** - Verified status checking

### ⏱️ Rate Limiting Rules
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 | 15 min |
| Auth (register, forgot-password, reset) | 10 | 1 hour |
| General API | 100 | 1 minute |

### 📝 Request Validation
- Email format validation
- Phone number format (Senegal)
- Vehicle plate format
- Price range (0 to 1,000,000)
- Location coordinates
- Required field checks

### ✅ Response Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Resource created |
| 400 | Bad request / validation error |
| 401 | Unauthorized / missing auth |
| 402 | Payment required / insufficient funds |
| 403 | Forbidden / access denied |
| 404 | Not found |
| 500 | Server error |

---

## 🏗️ Architecture & Technology Stack

### Backend Technologies
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io
- **Payment:** Stripe API
- **Maps:** Google Maps API + OSRM
- **OCR:** Tesseract.js for document verification
- **File Upload:** Multer
- **Security:** Helmet, bcrypt, rate-limit

### Frontend Technologies
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Maps:** Google Maps React
- **Build:** Create React App (or Webpack)

### External Services
- **Google Maps API** - Maps & routing
- **Stripe** - Payment processing
- **OSRM** - Open routing service
- **Tesseract.js** - OCR for documents
- **Wave/Orange Money** - Mobile money integration

---

## 🎯 Key Business Metrics

### Commission Structure
- **Ride Commission:** 12% (platform takes, driver gets 88%)
- **Service Commission:** 1% (platform takes, provider gets 99%)
- **Rental Commission:** Negotiable

### User Roles & Capabilities
| Role | Can Book Rides | Can Offer Service | Can Drive | Can Admin |
|------|--------|---------|-----------|----------|
| Client | ✅ | ❌ | ❌ | ❌ |
| Driver | ✅ | ❌ | ✅ | ❌ |
| Technician | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

### Service Areas
- Primary: Saint-Louis city
- 9+ predefined zones
- Distance-based matching within zones
- Expandable service radius model

### Currency & Markets
- **Currency:** XOF (Franc CFA)
- **Region:** Senegal (Saint-Louis)
- **Payment Methods:** Cash, Wave, Orange Money, Card
- **Price Range:** 1,000 - 1,000,000 XOF per transaction

---

## 📈 Application Completeness

### ✅ Fully Implemented
- User authentication & registration
- Ride booking & management
- Service request system
- Payment wallet integration
- Basic ratings system
- Notification system
- Support tickets
- Maps integration
- Gallery/portfolio system
- Admin verification workflow
- Socket.io real-time features
- Safety reporting system

### 🟡 Partially Implemented
- Vehicle rental management (backend complete, limited frontend)
- Advanced search filters
- Analytics dashboard
- Message threading between parties

### ❌ Not Yet Implemented
- Mobile app (Native iOS/Android)
- Advanced fraud detection
- Machine learning for matching
- Multi-language support (only French)
- SMS notifications
- Push notifications
- Refund management (payment integration)
- Subscription/premium tiers

---

## 🚀 Performance Characteristics

### Database Indexes
- Ride queries by userId, driverId, status
- Service queries by category, status
- User queries by role, status, email
- Message queries by serviceId, senderId

### Caching Opportunities
- Provider location caching
- Service availability caching
- Rating statistics caching
- Geographic zone data

### Optimization Opportunities
- Image compression for gallery
- Route calculation caching
- Pagination for large lists
- Connection pooling
- Database query optimization

---

## 🔗 Data Relationships

### User References
- User → Rides (as client/driver)
- User → Services (as client/technician)
- User → Rentals (as provider)
- User → Gallery (provider)
- User → Wallet (one-to-one)
- User → Notifications
- User → Tickets

### Ride References
- Ride → User (client and driver)
- Ride → Ratings (multiple)
- Ride → Messages
- Ride → Payments

### Service References
- Service → User (client and technician)
- Service → Ratings
- Service → Messages
- Service → Gallery items (provider portfolio)

---

## 📱 Client Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (responsive design)

---

**Last Updated:** April 14, 2026  
**Documented By:** Comprehensive Codebase Analysis  
**Status:** Production-Ready with In-Development Features
