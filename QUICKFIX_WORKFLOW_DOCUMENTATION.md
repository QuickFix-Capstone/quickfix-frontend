# QuickFix Platform - Complete Workflow Documentation for Chatbot

**Version:** 1.0
**Last Updated:** 2026-01-22
**Purpose:** Guide users through QuickFix workflows accurately

---

## Table of Contents

1. [Customer Workflows](#customer-workflows)
2. [Service Provider Workflows](#service-provider-workflows)
3. [Admin Workflows](#admin-workflows)
4. [Navigation Reference](#navigation-reference)
5. [Common Scenarios](#common-scenarios)

---

# CUSTOMER WORKFLOWS

## 1. Customer Registration & Login

### First-Time User Registration
**Starting Point:** Landing page (/)

1. Click "Login" or navigate to `/customer/login`
2. Select role: "Customer"
3. Enter email and password
4. Submit login credentials
5. System automatically redirects to `/customer/entry`
6. Entry page checks if profile exists:
   - **If New User (404):** Redirected to `/customer/register`
   - **If Existing User (200):** Redirected to `/customer/services`

### Registration Form (`/customer/register`)
**Required Fields:**
- Full Name
- Email (pre-filled from auth)
- Phone Number
- Address (Street, City, State/Province, Postal Code)

**Next Step:** After registration → Navigate to `/customer/dashboard`

### Returning Customer Login
1. Go to `/customer/login`
2. Enter credentials
3. Redirected to `/customer/entry` → `/customer/services` (dashboard area)

---

## 2. How to Post/Create a New Job Request

**Starting Point:** Customer Dashboard or Jobs Page

### Step-by-Step Process:

1. **Navigate to Post Job Page:**
   - From Dashboard: Click "Post Job" button
   - From Navigation: Click "Post Job" in nav bar
   - Direct URL: `/customer/post-job`

2. **Fill Out Job Form:**

   **Required Fields:**
   - **Job Title** (e.g., "Fix leaking kitchen sink")
   - **Category** - Select from dropdown:
     - Plumber
     - Electrician
     - Carpenter
     - Painter
     - Cleaner
     - Landscaper
     - Handyman
     - Other
   - **Job Description** (detailed description of work needed)
   - **Preferred Date** (minimum: today's date)
   - **Preferred Time** (HH:MM format)
   - **Location:**
     - Street Address
     - City
     - State/Province
     - Postal Code
   - **Budget Range:**
     - Minimum Budget ($)
     - Maximum Budget ($)

3. **Submit Job:**
   - Click "Post Job" button
   - System sends POST request to API
   - On success: Alert "Job posted successfully! Service providers can now apply."
   - Automatically redirects to `/customer/jobs` (My Jobs page)

**API Endpoint:** `POST /prod/job`

**Job Statuses:**
- **open** - Accepting applications
- **assigned** - Provider accepted
- **in_progress** - Work started
- **completed** - Work finished
- **cancelled** - Job cancelled

---

## 3. How to Browse and Search for Services

**Starting Point:** `/customer/services`

### Service Browsing Workflow:

1. **Access Services Page:**
   - From Dashboard: Click "Services" or "Browse Services"
   - From Navigation: Click "Services" in nav bar
   - Direct URL: `/customer/services`

2. **Search & Filter Services:**

   **Search Bar:**
   - Enter keywords in search box
   - Searches across: service title, description, category

   **Category Filter:**
   - Click category buttons: All Services, Plumbing, Electrical, HVAC, Cleaning, Handyman, Pest Control
   - Only shows services in selected category

   **Available Categories:**
   - PLUMBING
   - ELECTRICAL
   - HVAC
   - CLEANING
   - HANDYMAN
   - PEST_CONTROL

3. **View Service Cards:**
   Each service displays:
   - Service image (if uploaded)
   - Service title
   - Category badge
   - Star rating
   - Description preview (2 lines)
   - Price (with /hr indicator for hourly services)

4. **Pagination:**
   - Shows 9 services per page (3 columns × 3 rows)
   - Navigate using Previous/Next buttons
   - Shows page X of Y indicator

5. **Service Actions:**
   - **"Book Now"** button - Navigates to `/customer/book` with service data
   - **Message icon** - Opens conversation with provider

**API Endpoint:** `GET /prod/get_all_service_offering`

---

## 4. How to View and Accept Provider Applications

**Starting Point:** My Jobs Page (`/customer/jobs`)

### View Applications Workflow:

1. **Navigate to Job Applications:**
   - Go to "My Jobs" (`/customer/jobs`)
   - Find the job you posted
   - Click "View Applications (X)" button on job card
   - System navigates to `/customer/jobs/:job_id/applications`

2. **Applications Page Shows:**
   - Job title header
   - List of all applications for this job
   - Each application displays:
     - Provider name and avatar
     - Email and phone number
     - Star rating (if available)
     - Cover letter
     - Proposed price
     - Application date/time
     - Status badge (PENDING, ACCEPTED, REJECTED)

3. **Review Application Details:**
   - Read provider's cover letter
   - Review proposed price
   - Check provider rating
   - View contact information

4. **Accept or Reject Applications:**

   **For Pending Applications:**
   - **Accept Button** (green):
     - Click "Accept"
     - Confirmation prompt: "Are you sure you want to accept this application?"
     - On confirm: API updates application status to "accepted"
     - Job status changes to "assigned"
     - Alert: "Application accepted successfully!"
     - Applications list refreshes

   - **Reject Button** (red outline):
     - Click "Reject"
     - Confirmation prompt: "Are you sure you want to reject this application?"
     - On confirm: API updates application status to "rejected"
     - Alert: "Application rejected successfully!"

   **For Accepted Applications:**
   - Shows "Unassign Job" button
   - Shows "Reject Application" button
   - Can unassign job to return it to "open" status

5. **Unassign a Job:**
   - Click "Unassign Job" button
   - Confirmation: "Are you sure you want to unassign this job? The job will return to 'open' status and you can consider other applications."
   - On confirm: Job status returns to "open"
   - Redirects to `/customer/jobs`

**API Endpoints:**
- View applications: `GET /prod/job/:job_id/applications`
- Update application: `PUT /prod/job/:job_id/applications/:application_id`
- Unassign job: `PUT /prod/job/:job_id/unassign`

---

## 5. How to Track an Active Job's Progress

**Starting Point:** My Jobs Page

### Job Tracking Workflow:

1. **View All Your Jobs:**
   - Navigate to `/customer/jobs`
   - See list of all posted jobs

2. **Job Card Information:**
   Each job displays:
   - Job title
   - Status badge (color-coded)
   - Description
   - Category
   - Location (city, state)
   - Preferred date
   - Preferred time
   - Budget range
   - Number of applications received

3. **Job Statuses & What They Mean:**

   - **OPEN** (Green badge):
     - Job is accepting applications
     - Service providers can apply
     - You can view and accept applications

   - **ASSIGNED** (Blue badge):
     - You've accepted a provider's application
     - Provider has been notified
     - Job is assigned to specific provider

   - **IN_PROGRESS** (Yellow badge):
     - Provider has started the work
     - Job is actively being worked on

   - **COMPLETED** (Gray badge):
     - Work has been finished
     - Ready for review and payment

   - **CANCELLED** (Red badge):
     - Job has been cancelled

4. **View Detailed Job Information:**
   - Click "View Details" button
   - Navigate to `/customer/jobs/:job_id`
   - See full job details including:
     - All job information
     - Current status
     - Assigned provider (if any)
     - Timeline

5. **Edit Job (if Open):**
   - From job details page
   - Click "Edit Job"
   - Navigate to `/customer/jobs/:job_id/edit`
   - Modify job details
   - Save changes

**API Endpoint:** `GET /prod/customer/jobs`

---

## 6. How to Communicate with a Service Provider

**Starting Point:** Multiple entry points

### Messaging Workflow:

1. **Start a Conversation:**

   **Option A: From Services Page**
   - Browse services at `/customer/services`
   - Click message icon on service card
   - Creates conversation with provider
   - Redirects to `/customer/messages`

   **Option B: From Bookings Page**
   - Go to `/customer/bookings`
   - Find your booking
   - Click "Message" button
   - Creates/opens conversation
   - Redirects to `/customer/messages`

   **Option C: Direct New Message**
   - Go to `/customer/messages`
   - Click "New" button (+ icon)
   - Opens "New Message Modal"
   - Select provider from dropdown
   - Optionally select job/service
   - Type first message
   - Click "Start Conversation"

2. **Messages Page Layout (`/customer/messages`):**

   **Left Sidebar (30%):**
   - Header: "Messages" with conversation count
   - "New" button to start new conversation
   - List of all conversations:
     - Provider avatar (first letter)
     - Provider name
     - Job title (if linked to job)
     - Last message preview
     - Timestamp
     - Unread badge (red dot with count)

   **Right Panel (70%):**
   - Conversation header:
     - Provider name and avatar
     - Job title (if applicable)
   - Message thread (scrollable):
     - Your messages (right side, blue)
     - Provider messages (left side, gray)
     - Timestamps
   - Message input box at bottom

3. **Send a Message:**
   - Click on conversation in left sidebar
   - Type message in input box
   - Press Enter or click Send button
   - Message appears immediately in thread
   - Conversation list updates with latest message

4. **Message Features:**
   - Auto-polling: Updates every 10 seconds
   - Unread count: Shows in navbar badge (polls every 30 seconds)
   - Read receipts: Conversations marked as read when opened
   - Real-time updates: New messages appear automatically

5. **Empty State:**
   - If no conversation selected: Shows "Select a conversation" placeholder
   - If no conversations exist: Shows "No conversations yet"

**API Endpoints:**
- Get conversations: `GET /prod/messaging/conversations`
- Get messages: `GET /prod/messaging/conversations/:id/messages`
- Send message: `POST /prod/messaging/conversations/:id/messages`
- Mark as read: `PUT /prod/messaging/conversations/:id/read`
- Create conversation: `POST /prod/messaging/conversations`

---

## 7. How to Make Payments

**Current Status:** Payment functionality is in development

**Expected Workflow (Future):**
1. Job marked as "completed" by provider
2. Customer receives notification
3. Review completed work
4. Approve payment or request changes
5. Process payment via integrated payment system
6. Payment released to provider

---

## 8. How to Rate and Review a Completed Job

**Current Status:** Rating/review functionality is in development

**Expected Workflow (Future):**
1. Navigate to completed job
2. Click "Rate & Review" button
3. Provide star rating (1-5 stars)
4. Write review text
5. Submit review
6. Review appears on provider's profile
7. Provider rating updated

---

## 9. How to Cancel a Booking

**Starting Point:** Bookings Page (`/customer/bookings`)

### Cancellation Workflow:

1. **Navigate to Bookings:**
   - Go to `/customer/bookings`
   - View all your service bookings

2. **Filter Bookings (Optional):**
   Click filter buttons:
   - All
   - Pending
   - Confirmed
   - In Progress
   - Completed
   - Cancelled

3. **Find Booking to Cancel:**
   Each booking displays:
   - Service description
   - Category and status badges
   - Scheduled date and time
   - Service address
   - Provider name
   - Notes
   - Price (estimated or final)

4. **Cancel Pending Booking:**
   - Only "pending" bookings can be cancelled
   - Click "Cancel Booking" button (red)
   - Confirmation prompt: "Are you sure you want to cancel this booking?"
   - Click "OK" to confirm
   - System updates booking status to "CANCELLED"
   - Alert: "Booking cancelled successfully"
   - Bookings list refreshes

5. **Booking Statuses:**
   - **pending** (Yellow) - Can be cancelled
   - **confirmed** (Blue) - Cannot be cancelled easily
   - **in_progress** (Purple) - Work started, contact provider
   - **completed** (Green) - Work finished
   - **cancelled** (Red) - Already cancelled

**API Endpoint:** `PUT /prod/booking/:booking_id`

**Note:** For confirmed or in-progress bookings, contact the provider via messaging to discuss cancellation.

---

## 10. How to View Booking History

**Starting Point:** `/customer/bookings`

### Booking History Workflow:

1. **Access Bookings Page:**
   - From Dashboard: Click "Bookings"
   - From Navigation: Click "Bookings" in nav bar
   - Direct URL: `/customer/bookings`

2. **View All Bookings:**
   - Displays all bookings (past and upcoming)
   - Shows 20 bookings per page
   - Pagination available for more bookings

3. **Filter by Status:**
   Click status filter buttons:
   - **All** - Shows all bookings
   - **Pending** - Awaiting provider confirmation
   - **Confirmed** - Provider confirmed the booking
   - **In Progress** - Service is being performed
   - **Completed** - Service finished
   - **Cancelled** - Cancelled bookings

4. **Booking Information Displayed:**
   - Service description and category
   - Scheduled date and time
   - Full service address
   - Provider name (if assigned)
   - Any special notes
   - Estimated/final price
   - Booking ID
   - Status badge (color-coded)

5. **Booking Actions:**
   - **View Details** - See full booking information
   - **Message** - Contact the provider
   - **Cancel Booking** - Cancel pending bookings

6. **Navigate Booking Details:**
   - Click "View Details" button
   - Navigate to `/customer/bookings/:booking_id`
   - See complete booking information

7. **Pagination:**
   - Shows "Showing X to Y of Z results"
   - Previous/Next buttons
   - Page indicator

**API Endpoint:** `GET /prod/customer/bookings?status={status}&limit={limit}&offset={offset}`

---

## 11. How to Update Profile and Payment Methods

### Update Customer Profile

**Starting Point:** Customer Dashboard

1. **Access Profile Edit:**
   - From Dashboard: Click "Edit Profile" or profile settings
   - Direct URL: `/customer/edit`

2. **Edit Profile Form:**

   **Available Fields:**
   - Full Name
   - Email (usually read-only, set during registration)
   - Phone Number
   - Address Line
   - City
   - State/Province
   - Postal Code

3. **Update Information:**
   - Modify any field
   - Click "Save Changes" or "Update Profile"
   - System validates input
   - On success: Profile updated, redirected to dashboard
   - On error: Shows error message, stays on form

4. **Cancel Changes:**
   - Click "Cancel" button
   - Returns to dashboard without saving

**API Endpoint:** `PUT /prod/customer` (expected)

### Update Payment Methods

**Current Status:** Payment method management is in development

**Expected Features:**
- Add/remove credit/debit cards
- Set default payment method
- View payment history
- Manage billing address

---

## 12. How to Book a Service

**Starting Point:** Services Page (`/customer/services`)

### Service Booking Workflow:

1. **Find a Service:**
   - Browse services at `/customer/services`
   - Use search or category filters
   - Find desired service

2. **Book the Service:**
   - Click "Book Now" button on service card
   - System navigates to `/customer/book`
   - Service information passed as state

3. **Review Service Summary:**
   Page displays:
   - Service title
   - Description
   - Category badge
   - Price (with /hr indicator if hourly)

4. **Fill Booking Form:**

   **Required Fields:**

   **Schedule:**
   - **Service Date** (minimum: tomorrow)
   - **Service Time** (HH:MM format)

   **Service Location:**
   - **Service Address** (street address)
   - **City**
   - **State/Province**
   - **Postal Code** (optional but recommended)

   **Additional Information:**
   - **Notes** (optional) - Any special instructions or requirements

5. **Submit Booking:**
   - Review all information
   - Click "Confirm Booking" button
   - System sends POST request to API
   - On success:
     - Alert: "Booking created successfully!"
     - Redirects to `/customer/bookings`
   - On error:
     - Alert: "Failed to create booking. Please try again."
     - Stays on form for corrections

6. **After Booking:**
   - Booking appears in bookings list with "pending" status
   - Provider receives notification
   - Wait for provider to confirm
   - Can message provider if needed

**Booking Data Sent:**
```
- provider_id (from service)
- service_category (from service)
- service_description (service title)
- scheduled_date
- scheduled_time
- service_address
- service_city
- service_state
- service_postal_code
- notes
```

**API Endpoint:** `POST /prod/booking`

---

# SERVICE PROVIDER WORKFLOWS

## 1. Service Provider Registration & Account Setup

### First-Time Provider Registration

**Starting Point:** Landing page or provider signup

1. **Initial Signup:**
   - Navigate to `/service-provider/signup`
   - Enter email and create password
   - Submit signup form
   - Account created in authentication system

2. **Entry Point Check:**
   - After authentication: Redirect to `/service-provider/entry`
   - System checks if provider profile exists:
     - **If New (404):** Redirect to `/provider/register`
     - **If Exists (200):** Redirect to `/service-provider/dashboard`

3. **Provider Registration Form:**
   Complete provider profile with required information

4. **Onboarding Process:**
   - Navigate to `/service-provider/onboarding`
   - Complete additional setup steps
   - Submit profile information

5. **Verification Pending:**
   - Profile created with "unverified" status
   - Admin review required before full platform access
   - Receive notification when verified

### Returning Provider Login

1. Navigate to `/service-provider/login`
2. Enter credentials
3. System redirects to `/service-provider/entry`
4. Entry check → `/service-provider/dashboard`

---

## 2. How to Complete Account Verification

### Verification Status Check

**Starting Point:** Provider Dashboard/Profile

1. **Check Verification Status:**
   - View profile page: `/service-provider/profile`
   - Look for verification badge/status indicator
   - Status options:
     - **Verified** (green checkmark) - Full access
     - **Pending** (yellow clock) - Under review
     - **Unverified** (red X) - Need to submit info

2. **What Admins Review:**
   - Business name and information
   - Contact details (phone, email)
   - Service location
   - Business credentials (if applicable)
   - Profile completeness

3. **Verification Process:**
   - Admin views your profile in "Unverified Service Providers" list
   - Admin reviews all provided information
   - Admin can:
     - **Approve** - Account becomes verified
     - **Reject** - Notification sent with reason
     - **Request More Info** - Admin contacts for clarification

4. **After Verification:**
   - Receive notification/email
   - Verification badge appears on profile
   - Full access to platform features
   - Can appear in search results
   - Can accept job assignments

**Provider Dashboard Navigation:** Top navigation shows verification status with badge

**Admin Review Location:** `/admin/unverified-service-provider`

---

## 3. How to Upload Certifications and Licenses

**Current Status:** Certification/license upload is in development

**Expected Workflow (Future):**

1. Navigate to Profile Settings
2. Find "Certifications & Licenses" section
3. Click "Add Certification"
4. Upload document (PDF, JPG, PNG)
5. Provide certification details:
   - Certification name
   - Issuing organization
   - Issue date
   - Expiration date (if applicable)
   - Certification number
6. Submit for admin verification
7. Admin reviews and approves
8. Appears on provider profile

**Recommended Documents:**
- Trade licenses
- Insurance certificates
- Professional certifications
- Background check results
- Business registration documents

---

## 4. How to Browse Available Job Postings

**Starting Point:** Service Provider Home Page

### Job Browsing Workflow:

1. **Access Job Listings:**
   - From Navigation: Click "Home"
   - Direct URL: `/service-provider/home`
   - This is the main job board for providers

2. **Job Listings Page Features:**

   **Search Functionality:**
   - Search bar with icon
   - Search by: job title, category, city
   - Live filtering as you type

   **Category Filter:**
   - Click category tags to filter jobs
   - Available categories:
     - ALL (shows all jobs)
     - PLUMBING
     - ELECTRICAL
     - CLEANING
     - HANDYMAN
     - LANDSCAPING
     - HVAC
     - PAINTING
     - CARPENTRY
     - ROOFING
     - FLOORING
     - SNOW_REMOVAL
     - PEST_CONTROL
     - APPLIANCE_INSTALLATION
     - FURNITURE_ASSEMBLY
     - TV_MOUNTING
     - SMART_HOME_INSTALLATION
     - MOVING_SERVICES
     - JUNK_REMOVAL
     - IT_SUPPORT
     - OTHER

   **Clear Filters:**
   - "Clear" button resets all filters
   - Shows all available jobs again

3. **Job Card Display:**
   Each job shows:
   - **Title** and category badge
   - **Status badge** (OPEN in green)
   - **Description** (3-line preview)
   - **Location** (city, state with map pin icon)
   - **Budget range** (min - max in dollars)
   - **Preferred date and time** (if specified)
   - **"View Job"** button

4. **Grid Layout:**
   - 3 columns on desktop
   - Responsive layout for mobile
   - Card hover effect (slight lift and shadow)

5. **View Job Count:**
   - Header shows: "Available jobs (X)"
   - Updates based on filters

6. **Job States:**
   - **OPEN** - Available for applications
   - **ASSIGNED** - Customer accepted an application (not shown to other providers)
   - **IN_PROGRESS** - Work started
   - **COMPLETED** - Work finished
   - **CANCELLED** - Job cancelled

7. **Click to View Details:**
   - Click "View Job" button
   - Navigate to `/service-provider/job/:jobId`
   - See full job details and apply

**API Endpoint:** `GET /prod/get_available_jobs`

**Auto-Refresh:** Jobs update when you navigate back to the page

---

## 5. How to Apply for a Job

**Starting Point:** Job Details Page

### Job Application Workflow:

1. **View Job Details:**
   - From job listings: Click "View job"
   - Navigate to `/service-provider/job/:jobId`

2. **Job Details Page Shows:**

   **Job Information Card:**
   - Job image placeholder
   - Job title
   - Full description
   - Location (with address if provided)
   - Budget range
   - Job status
   - Preferred date/time

   **Status Badges:**
   - **"Assigned to you"** (green) - You got the job!
   - **"Application sent"** (blue) - Already applied
   - No badge - Can apply

3. **Apply to Job (If Eligible):**

   **Eligibility Check:**
   - Job status must be "open"
   - You haven't already applied
   - Job not assigned to another provider

4. **Application Process:**

   **Step 1: Click "Apply to Job" Button**
   - Black button at bottom of job details
   - Opens application form inline

   **Step 2: Fill Application Form**

   **Required Fields:**
   - **Proposed Price** (number field)
     - Enter your price for the job
     - Consider customer's budget range
     - Include all costs

   - **Message** (textarea, REQUIRED)
     - Explain why you're a good fit
     - Highlight relevant experience
     - Professional introduction
     - Minimum length recommended: 50+ characters

   **Step 3: Submit Application**
   - Click "Submit Application" button (green)
   - System validates message is not empty
   - Sends POST request to API
   - Shows loading state: "Submitting..."

5. **After Submission:**

   **On Success:**
   - Application status changes to "Application sent"
   - Blue badge appears: "Application sent"
   - "Apply to Job" button disappears
   - Application appears in customer's applications list
   - Customer can view and accept/reject

   **On Error:**
   - Error message displays
   - Form remains open for corrections
   - Fix issues and resubmit

6. **Cancel Application:**
   - Before submitting: Click "Cancel" button
   - Returns to view-only mode
   - No application sent

**API Endpoint:** `POST /prod/job/:jobId/applications`

**Application Data Sent:**
```json
{
  "proposed_price": 150.00,
  "message": "I have 5 years experience in plumbing..."
}
```

**Note:** Once application is sent, you cannot edit it. Customer sees it immediately.

---

## 6. How to Accept a Job Offer from a Customer

**Starting Point:** Notifications or Dashboard

### Job Acceptance Workflow:

1. **Receive Notification:**
   - Customer accepts your application
   - System updates job assignment
   - Notification sent (email/in-app)

2. **View Assigned Job:**
   - Navigate to job details page
   - See green badge: "Assigned to you"
   - Job status changes to "assigned"

3. **What "Assigned" Means:**
   - Customer has chosen you for the job
   - Other applications are automatically rejected
   - Job is exclusively yours
   - You can now start work coordination

4. **Next Steps After Assignment:**

   **Immediate Actions:**
   - Review job details again carefully
   - Note the preferred date/time
   - Note the exact location
   - Check any special notes

   **Communication:**
   - Contact customer via messaging
   - Confirm availability
   - Discuss any specific requirements
   - Confirm final price if needed
   - Schedule exact time

   **Preparation:**
   - Gather necessary tools/materials
   - Plan logistics
   - Confirm access to location

5. **View Your Assigned Jobs:**
   - Check "My Job Applications" widget on dashboard
   - Filter for "accepted" status
   - See all jobs you're assigned to

**Important Notes:**
- Assignment is not automatic acceptance on your part
- If you cannot complete the job, contact customer immediately
- Customer can still unassign the job if needed
- Professional communication is key

---

## 7. How to Update Job Status (In Progress, Completed)

**Current Status:** Job status updates are managed through backend/admin

**Expected Workflow (Future Feature):**

### Update to "In Progress"

1. **Navigate to Assigned Job:**
   - View your assigned jobs
   - Select the job you're starting

2. **Mark as In Progress:**
   - Click "Start Job" or "Mark In Progress"
   - Confirms you've begun work
   - Sends notification to customer
   - Job status → "in_progress"

3. **While In Progress:**
   - Update customer via messages
   - Share progress photos (future feature)
   - Report any issues or changes

### Update to "Completed"

1. **When Work is Finished:**
   - Navigate to the job
   - Click "Mark as Completed"
   - Optional: Upload completion photos
   - Optional: Add completion notes

2. **System Actions:**
   - Job status → "completed"
   - Notification sent to customer
   - Customer can review and approve
   - Triggers payment process

3. **After Completion:**
   - Wait for customer review
   - Receive payment
   - Customer may leave rating/review

**Interim Solution:**
- Contact customer via messaging to update on progress
- Use notes field to document status
- Admin may update status if needed

---

## 8. How to Request Payment

**Current Status:** Payment request feature is in development

**Expected Workflow (Future):**

1. **After Completing Job:**
   - Mark job as "completed"
   - System automatically notifies customer

2. **Payment Request Options:**

   **Option A: Automatic Payment Release**
   - Customer approves completed work
   - Payment automatically processed
   - Funds transferred to your account

   **Option B: Manual Payment Request**
   - Navigate to completed job
   - Click "Request Payment"
   - Enter final amount (if different from estimate)
   - Add itemized breakdown
   - Submit request

3. **Payment Tracking:**
   - View payment status in dashboard
   - Statuses: Pending, Processing, Completed
   - Receive confirmation when paid

4. **Dispute Resolution:**
   - If customer disputes payment
   - Provide documentation
   - Admin mediates if needed

**Interim Solution:**
- Coordinate payment directly with customer
- Use messaging to discuss payment
- Confirm receipt of payment

---

## 9. How to View Earnings and Payment History

**Current Status:** Earnings dashboard is in development

**Expected Features (Future):**

### Earnings Dashboard

1. **Navigate to Earnings:**
   - Click "Earnings" in navigation
   - Direct URL: `/service-provider/earnings`

2. **Dashboard Displays:**

   **Summary Statistics:**
   - Total earnings (all time)
   - This month's earnings
   - Pending payments
   - Completed jobs count
   - Average job value

   **Earnings Chart:**
   - Monthly earnings graph
   - Trend analysis
   - Year-over-year comparison

3. **Payment History Table:**
   - Date received
   - Job reference
   - Customer name
   - Amount paid
   - Payment method
   - Transaction ID

4. **Filter Options:**
   - By date range
   - By customer
   - By job category
   - By payment status

5. **Export Features:**
   - Download CSV
   - Generate PDF reports
   - Tax documents

**Interim Solution:**
- Track payments manually
- Use completed jobs list as reference
- Keep personal records of earnings

---

## 10. How to Manage Availability/Schedule

**Current Status:** Schedule management is in development

**Expected Features (Future):**

### Availability Calendar

1. **Access Schedule:**
   - Navigate to "Schedule" or "Availability"
   - Direct URL: `/service-provider/schedule`

2. **Set Availability:**

   **Working Hours:**
   - Set regular working days
   - Define hours per day
   - Mark recurring schedule

   **Block Off Time:**
   - Mark unavailable dates
   - Add vacation periods
   - Block specific time slots

   **Set Busy Status:**
   - Temporary unavailability
   - Auto-reject new jobs during period

3. **Calendar Features:**
   - Month/week/day views
   - Drag-and-drop scheduling
   - Color-coded job statuses
   - Sync with external calendars

4. **Job Scheduling:**
   - View all upcoming jobs
   - See overlapping appointments
   - Get conflict warnings
   - Reschedule if needed

**Interim Solution:**
- Manually check job dates before applying
- Use external calendar app
- Communicate availability in messages
- Decline jobs if schedule conflicts

---

## 11. How to View and Respond to Ratings/Reviews

**Current Status:** Rating/review system is in development

**Expected Workflow (Future):**

### View Your Ratings

1. **Access Ratings:**
   - Navigate to Profile page
   - See overall rating (star average)
   - View rating breakdown

2. **Rating Display:**
   - Overall average (e.g., 4.8 ★)
   - Total review count
   - Star distribution (5-star: X, 4-star: Y, etc.)

3. **Read Reviews:**
   - List of all reviews
   - Customer name
   - Date
   - Star rating
   - Review text
   - Associated job

### Respond to Reviews

1. **Review Response:**
   - Click "Respond" on review
   - Write professional response
   - Thank customer or address concerns
   - Submit response

2. **Best Practices:**
   - Respond to all reviews (good and bad)
   - Thank customers for positive feedback
   - Address negative reviews professionally
   - Offer solutions to problems
   - Keep responses brief and courteous

3. **Rating Impact:**
   - Ratings affect search visibility
   - Higher ratings → more job opportunities
   - Consistently good reviews → verified badge
   - Poor ratings may trigger admin review

**Interim Solution:**
- Build reputation through quality work
- Request feedback via messaging
- Keep personal records of customer satisfaction

---

## 12. How to Create a Service Offering

**Starting Point:** Service Provider Dashboard

### Service Offering Creation Workflow:

1. **Navigate to Create Service:**
   - From Navigation: Click "Create Service"
   - From Dashboard: Click "Create Service Offering"
   - Direct URL: `/service-provider/create-service-offering`

2. **Create Service Offering Page:**

### Service Details Section

**Required Fields:**

**Title** (text input)
- Example: "Emergency Plumbing Repair"
- Clear, descriptive name
- What customers will see first

**Description** (textarea)
- Detailed explanation of service
- What's included
- Your unique value proposition
- Why customers should choose you
- Minimum 120 characters recommended

**Category** (dropdown)
Select from:
- PLUMBING
- ELECTRICAL
- CLEANING
- HANDYMAN
- LANDSCAPING
- HVAC
- PAINTING
- CARPENTRY
- ROOFING
- FLOORING
- SNOW_REMOVAL
- PEST_CONTROL
- APPLIANCE_INSTALLATION
- FURNITURE_ASSEMBLY
- TV_MOUNTING
- SMART_HOME_INSTALLATION
- MOVING_SERVICES
- JUNK_REMOVAL
- IT_SUPPORT
- OTHER

**Pricing Type** (dropdown)
- **HOURLY** - Price per hour
- **FIXED** - One-time flat rate
- **PER_DAY** - Daily rate
- **PER_PROJECT** - Project-based pricing

### Pricing Section

**Price** (number input)
- Enter price amount (USD)
- Format: 0.00 (decimal allowed)
- Dollar sign ($) automatically shown
- Required field

**Pricing Display:**
- Hourly: Shows as "$X.XX /hr"
- Fixed: Shows as "$X.XX"
- Per Day: Shows as "$X.XX /day"
- Per Project: Shows as "$X.XX /project"

### Media Section

**Main Image** (file upload - OPTIONAL)

**Accepted Formats:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)

**Upload Process:**
1. Click "Choose File" button
2. Select image from device
3. File name displays: "Selected: [filename]"
4. Image uploads when form submitted

**Image Upload Flow:**
- System requests presigned S3 URL
- Image uploaded to S3 bucket
- S3 key stored in database (not full URL)
- Image displayed on service card

**Note:** Image is optional but highly recommended. Services with images get more bookings.

3. **Form Validation:**

**Before Submitting:**
- All required fields must be filled
- Price must be a valid number
- Description should be meaningful
- Image must be correct format (if uploading)

4. **Submit Service Offering:**

   **Create Button:**
   - Click "Create Service" button
   - System validates all fields
   - Shows loading state

   **During Upload:**
   - If image included: "Uploading image..."
   - Then: "Creating..."
   - Button disabled during process

   **On Success:**
   - Service offering created
   - Added to service catalog
   - Visible to customers immediately
   - Redirects to `/service-provider/dashboard`

   **On Error:**
   - Error message displays in red banner
   - Form data retained
   - Fix errors and resubmit

5. **Cancel Creation:**
   - Click "Cancel" button
   - Returns to dashboard
   - No data saved
   - Confirmation prompt may appear if form filled

**API Endpoints:**
- Create service: `POST /prod/service_offering`
- Upload image: `POST /prod/upload_image_URL` (gets presigned URL)

**Image Storage:**
- S3 Bucket: `quickfix-app-files`
- Region: `us-east-2`
- Path stored as: `service-offerings/[provider-id]/[image-name]`

---

## 13. How to Edit Your Profile

**Starting Point:** Service Provider Dashboard

### Profile Editing Workflow:

1. **Navigate to Profile:**
   - From Navigation: Click "Profile" or profile icon
   - Direct URL: `/service-provider/profile`

2. **Profile Page Header:**
   - Sticky header with "Service Provider Profile"
   - Subtitle: "Keep your details accurate so customers can trust you"

3. **Profile Form Fields:**

**Personal Information:**

**Your Name** (text input)
- Legal or professional name
- Required field
- Used for customer communication

**Business Name** (text input)
- Company or DBA name
- Optional but recommended
- Appears in search results

**Phone Number** (text input)
- Contact number
- Required field
- Validation: Must be valid phone format (7+ digits, allows +, -, spaces, parentheses)
- Helper text: "Used for customer contact"

**Contact Address:**

**Address Line** (text input)
- Street address
- Optional

**City** (text input)
- City location
- Optional

**Province** (text input)
- State/Province
- Optional

**Postal Code** (text input)
- Zip/Postal code
- Maximum 10 characters
- Optional

**Professional Bio:**

**Bio** (textarea)
- About your business and experience
- Why customers should hire you
- Specialties and certifications
- 4 rows tall
- Maximum 500 characters
- Character counter shows: "X/500"

4. **Form Validation:**

**Real-Time Validation:**
- Name cannot be empty
- Phone must match pattern: `/^[0-9+\-\s()]{7,}$/`
- Postal code max 10 characters
- Bio max 500 characters

**Error Messages:**
- "Your name is required"
- "Enter a valid phone number"
- "Postal code looks too long"

5. **Change Detection:**
- "Save Changes" button disabled if no changes made
- Button enabled only when form differs from original
- Visual indicator: Disabled button has reduced opacity

6. **Save Profile:**

   **Save Process:**
   - Click "Save Changes" button
   - Form validates all fields
   - If errors: Alert displays error message
   - If valid: Sends PUT request to API
   - Button shows "Saving..." during request

   **On Success:**
   - Green success alert: "Profile updated successfully"
   - Alert auto-dismisses after 1.2 seconds
   - Redirects to `/service-provider/dashboard`

   **On Error:**
   - Red error alert displays
   - Error message: "Failed to update profile. Please try again."
   - Form remains open for corrections
   - User can fix and retry

7. **Cancel Changes:**
   - Click "Cancel" button
   - Returns to previous page (uses browser back)
   - Changes discarded
   - No confirmation prompt

**API Endpoint:** `PUT /prod/service_provider`

**Data Sent:**
```json
{
  "name": "John Smith",
  "business_name": "Smith Plumbing Services",
  "phone_number": "+1 (555) 123-4567",
  "address_line": "123 Main St",
  "city": "Toronto",
  "province": "ON",
  "postal_code": "M5H 1J9",
  "bio": "Licensed plumber with 10 years experience..."
}
```

**Profile Impact:**
- Updated information visible to customers immediately
- Appears in search results
- Shows on job applications
- Displayed in messaging

---

# ADMIN WORKFLOWS

## 1. Admin Login and Authentication

**Starting Point:** Admin Login Page

### Admin Login Workflow:

1. **Navigate to Admin Login:**
   - Direct URL: `/admin/login`
   - Separate from customer/provider login

2. **Admin Login Form:**
   - Enter admin email
   - Enter admin password
   - Submit credentials

3. **First-Time Login:**
   - If forced password change required:
   - Redirects to `/admin/set-password`
   - Enter new password
   - Confirm new password
   - Submit to update

4. **Authentication Check:**
   - System validates credentials via AWS Cognito
   - Checks Cognito groups for "Administrator" role
   - If not admin: Access denied, redirect to login
   - If admin: Redirect to `/admin/dashboard`

5. **Admin Route Protection:**
   - All `/admin/*` routes protected by `AdminRoute.jsx` wrapper
   - Verifies Cognito ID token contains "Administrator" group
   - Shows "Checking admin access..." during verification
   - Unauthorized access: Redirects to `/admin/login`

**Authentication System:**
- AWS Cognito with groups
- ID token required for all admin API calls
- Token passed as Authorization header

---

## 2. How to Review and Approve Provider Verifications

**Starting Point:** Admin Dashboard

### Provider Verification Workflow:

1. **Access Admin Dashboard:**
   - Navigate to `/admin/dashboard`
   - See tabbed interface

2. **Admin Dashboard Tabs:**
   - **All Service Providers** - View all registered providers
   - **Unverified Providers** - Providers pending verification
   - **System Dashboard** - Platform health metrics

3. **View Unverified Providers:**
   - Click "Unverified Providers" tab
   - System loads list from API: `GET /prod/admin/unverified_service_provider`

4. **Unverified Providers Page Features:**

**Header:**
- Title: "Unverified Service Providers"
- Subtitle: "Review and manage pending service provider applications"
- Refresh button (with spinning icon when refreshing)

**Stats Card:**
- Shows count: "Pending Verification: X"
- Yellow warning icon
- Updates in real-time

**Provider Table Columns:**
- **Business** - Business name, active status indicator
- **Contact** - Email and phone number
- **Location** - City and province
- **Status** - Yellow "Pending" badge with clock icon
- **Rating** - Star rating if available (or "No ratings")
- **Actions** - Review, Approve, Reject buttons

5. **Provider Information Displayed:**

**For Each Provider:**
- Business initial letter avatar (colored circle)
- Business name
- Active status: "● Active" (green) or "○ Inactive" (gray)
- Email address
- Phone number (if provided)
- City and province
- Current verification status
- Average rating (star icon with number)

6. **Verification Actions:**

**Review Button (Blue):**
- Click to view full provider details
- See complete profile
- Review certifications
- Check background info

**Approve Button (Green):**
- Click to approve provider
- Confirmation prompt recommended
- Provider status → "verified"
- Provider receives notification
- Provider gains full platform access
- Removed from unverified list

**Reject Button (Red):**
- Click to reject application
- Should provide reason
- Provider notified
- May require reapplication

7. **Empty State:**
   If no unverified providers:
   - Green checkmark icon
   - "All Clear!" message
   - "No unverified providers at the moment 🎉"

8. **Refresh Data:**
   - Click "Refresh" button
   - Re-fetches provider list
   - Shows "Refreshing..." during load
   - Updates count and table

**API Endpoints:**
- List unverified: `GET /prod/admin/unverified_service_provider`
- Approve (expected): `PUT /prod/admin/service_provider/:id/approve`
- Reject (expected): `PUT /prod/admin/service_provider/:id/reject`

**Error Handling:**
- If API fails: Shows error card
- Error icon and message
- "Try Again" button to retry
- Error details logged

---

## 3. How to View All Service Providers

**Starting Point:** Admin Dashboard

### All Providers Workflow:

1. **Access All Providers Tab:**
   - Navigate to `/admin/dashboard`
   - Click "All Service Providers" tab
   - Component: `AdminServiceProviders` (AllServiceProvider.jsx)

2. **Expected Features:**
   (Component implementation may vary)

   **Provider List Display:**
   - All registered providers (verified and unverified)
   - Sortable columns
   - Filterable by status
   - Search functionality

   **Provider Information:**
   - Business name and contact
   - Verification status
   - Registration date
   - Number of completed jobs
   - Average rating
   - Active/inactive status
   - Account standing

3. **Filtering Options:**
   - All providers
   - Verified only
   - Unverified only
   - Active providers
   - Inactive providers
   - By location
   - By category/service type

4. **Sorting:**
   - By registration date
   - By rating
   - By number of jobs
   - By business name
   - Alphabetically

5. **Provider Actions:**
   - View full profile
   - Edit provider information
   - Suspend account
   - Delete account
   - Send message/notification
   - View job history
   - View customer reviews

**API Endpoint:** `GET /prod/admin/service_providers` (expected)

---

## 4. How to Handle Disputes

**Current Status:** Dispute resolution system is in development

**Expected Workflow (Future):**

### Dispute Management

1. **View Disputes:**
   - Navigate to "Disputes" section
   - See list of open disputes
   - Sorted by urgency/date

2. **Dispute Information:**
   - Dispute ID
   - Date filed
   - Customer name
   - Provider name
   - Related job
   - Dispute type (payment, quality, cancellation, etc.)
   - Status (Open, Under Review, Resolved)

3. **Review Dispute:**
   - Click on dispute
   - See both parties' statements
   - View job details
   - Review messages/communications
   - Check payment status
   - View evidence (photos, documents)

4. **Dispute Resolution Actions:**

   **Gather Information:**
   - Request more details from customer
   - Request more details from provider
   - Review platform records
   - Check completion photos
   - Verify payment trail

   **Communication:**
   - Message both parties
   - Schedule mediation call
   - Request additional documentation
   - Set response deadlines

   **Make Decision:**
   - Side with customer (refund, partial refund)
   - Side with provider (release payment)
   - Split decision (partial payment to both)
   - Suggest compromise

5. **Resolution Options:**
   - Issue full refund to customer
   - Release payment to provider
   - Partial refund/payment split
   - Require job completion
   - Assign new provider
   - Close dispute (no action)

6. **After Resolution:**
   - Update dispute status
   - Process refund/payment
   - Notify both parties
   - Document decision
   - Flag accounts if needed
   - Monitor for appeals

**Dispute Types:**
- Payment disputes
- Quality of work issues
- Cancellation disagreements
- Property damage claims
- Scope creep complaints
- Timing/scheduling conflicts

---

## 5. How to View Platform Metrics (System Health)

**Starting Point:** Admin Dashboard

### System Health Workflow:

1. **Access System Dashboard:**
   - Navigate to `/admin/dashboard`
   - Click "System Dashboard" tab
   - Loads `SystemHealth.jsx` component

2. **Expected System Metrics:**

**Platform Statistics:**
- Total users (customers + providers)
- Active users (last 30 days)
- New registrations (this week/month)
- Total jobs posted
- Jobs in progress
- Completed jobs
- Total bookings
- Active bookings

**Revenue Metrics:**
- Total platform revenue
- Revenue this month
- Revenue this week
- Average job value
- Total transaction volume
- Pending payments
- Completed payments

**User Growth:**
- User growth chart (weekly/monthly)
- Customer vs Provider ratio
- Registration trends
- Retention rates

**Job Metrics:**
- Job posting trends
- Job completion rate
- Average time to assignment
- Average time to completion
- Job categories breakdown
- Geographic distribution

**Service Provider Metrics:**
- Total providers
- Verified providers
- Pending verification
- Active providers
- Provider ratings distribution
- Top-rated providers

**Customer Metrics:**
- Total customers
- Active customers
- Customer satisfaction
- Repeat customer rate
- Average jobs per customer

**Platform Health:**
- API response times
- Error rates
- System uptime
- Database performance
- Peak usage times

3. **Visual Displays:**
   - Charts and graphs
   - Real-time updates
   - Color-coded indicators
   - Trend lines
   - Comparison metrics

4. **Alerts & Warnings:**
   - High error rates
   - System slowdowns
   - Unusual activity
   - Security concerns
   - Payment processing issues

**API Endpoint:** `GET /prod/admin/system_health` (expected)

---

## 6. How to Manage Users

**Current Status:** User management features in development

**Expected Features (Future):**

### User Management Dashboard

1. **Access User Management:**
   - Navigate to user management section
   - Search for specific user
   - Filter by type (customer/provider)

2. **User Search:**
   - Search by email
   - Search by name
   - Search by user ID
   - Search by phone number

3. **User Profile View:**
   - Complete user information
   - Account status
   - Registration date
   - Activity history
   - Associated jobs/bookings
   - Payment history

4. **User Actions:**

   **Account Status:**
   - Activate account
   - Deactivate/suspend account
   - Delete account (with confirmation)
   - Reset password
   - Unlock account

   **Verification:**
   - Manually verify email
   - Manually verify phone
   - Override verification requirements

   **Communication:**
   - Send email notification
   - Send in-app message
   - Add admin notes

   **Data Management:**
   - Edit user profile
   - Update contact information
   - Correct errors
   - Merge duplicate accounts

5. **Bulk Actions:**
   - Export user data
   - Send mass notifications
   - Apply bulk updates
   - Generate reports

---

# NAVIGATION REFERENCE

## Customer Navigation

**Main Navigation Bar** (CustomerNav.jsx):
- Dashboard - `/customer/dashboard`
- My Jobs - `/customer/jobs`
- Post Job - `/customer/post-job`
- Bookings - `/customer/bookings`
- Services - `/customer/services`
- Messages - `/customer/messages` (with unread badge)
- Profile Icon - User menu
- Logout - Sign out

**User Display:**
- Shows name/email
- Profile icon with initials

---

## Service Provider Navigation

**Top Navigation** (ServiceProviderTopNav.jsx):
- Home - `/service-provider/home`
- Dashboard - `/service-provider/dashboard`
- Create Service - `/service-provider/create-service-offering`
- Profile Icon - Profile menu
  - Profile - `/service-provider/profile`
  - Logout
- Verification badge (if verified)

**Mobile:**
- Hamburger menu toggle
- Collapsed menu with all options

---

## Admin Navigation

**Admin Dashboard Tabs:**
- All Service Providers
- Unverified Providers
- System Dashboard

**Admin Routes:**
- Dashboard - `/admin/dashboard`
- Login - `/admin/login`
- Set Password - `/admin/set-password`

---

# COMMON SCENARIOS

## Scenario 1: Customer Posts Job and Hires Provider

**Complete Workflow:**

1. **Customer:** Login → Dashboard → Click "Post Job"
2. **Customer:** Fill job form (title, category, description, location, date, budget)
3. **Customer:** Submit job → Redirected to "My Jobs"
4. **Provider:** Login → Home page → Browse jobs → Find job
5. **Provider:** Click "View job" → Read details → Click "Apply to Job"
6. **Provider:** Enter proposed price + message → Submit application
7. **Customer:** Go to "My Jobs" → See "1 Application" → Click "View Applications"
8. **Customer:** Review application → Click "Accept"
9. **System:** Job status → "assigned", Provider notified
10. **Provider:** See "Assigned to you" badge on job
11. **Both:** Use messaging to coordinate details
12. **Provider:** Complete work → Update status (future)
13. **Customer:** Approve completion → Process payment (future)
14. **Customer:** Leave rating/review (future)

---

## Scenario 2: Customer Books a Service Offering

**Complete Workflow:**

1. **Provider:** Create service offering (title, description, price, image)
2. **Customer:** Login → Click "Services" → Browse service catalog
3. **Customer:** Use search/filter → Find desired service
4. **Customer:** Click "Book Now" on service card
5. **Customer:** Fill booking form (date, time, address, notes)
6. **Customer:** Submit booking → Redirected to "Bookings"
7. **Booking:** Status "pending" → Provider notified
8. **Provider:** Review booking → Confirm availability (future)
9. **Booking:** Status → "confirmed"
10. **Customer:** Receive confirmation
11. **Both:** Message to coordinate final details
12. **Provider:** Arrive and complete service
13. **Provider:** Mark as completed (future)
14. **Customer:** Approve and pay (future)

---

## Scenario 3: Provider Gets Verified

**Complete Workflow:**

1. **Provider:** Sign up → Complete registration
2. **Provider:** Fill profile completely
3. **Provider:** Submit for verification
4. **Admin:** Login → Dashboard → "Unverified Providers" tab
5. **Admin:** See provider in list → Review details
6. **Admin:** Check business info, contact details, credentials
7. **Admin:** Click "Approve" → Confirm action
8. **System:** Provider status → "verified"
9. **Provider:** Receive notification
10. **Provider:** Verification badge appears on profile
11. **Provider:** Full platform access granted
12. **Provider:** Can now receive job assignments

---

## Scenario 4: Customer Cancels Booking

**Complete Workflow:**

1. **Customer:** Login → "Bookings" page
2. **Customer:** Filter to "Pending" bookings
3. **Customer:** Find booking to cancel
4. **Customer:** Click "Cancel Booking" button
5. **System:** Confirmation prompt appears
6. **Customer:** Click "OK" to confirm
7. **System:** Booking status → "cancelled"
8. **Provider:** Notified of cancellation
9. **Customer:** Booking moved to cancelled list
10. **System:** No payment processed (if pending)

**Note:** For confirmed/in-progress bookings, customer should message provider first.

---

## Scenario 5: Two Users Communicate via Messages

**Complete Workflow:**

1. **Customer:** Click message icon on service/booking
2. **System:** Creates conversation (if doesn't exist)
3. **Customer:** Redirected to `/customer/messages`
4. **Customer:** Conversation selected automatically
5. **Customer:** Type message → Press Enter/Send
6. **System:** Message appears in thread
7. **Provider:** Receives notification (future)
8. **Provider:** Opens messages page
9. **Provider:** Sees unread badge on conversation
10. **Provider:** Clicks conversation → Unread count clears
11. **Provider:** Reads message → Types reply → Sends
12. **Customer:** Auto-polling updates (10 sec) → Sees reply
13. **Both:** Continue conversation in real-time

---

# API ENDPOINTS REFERENCE

## Customer Endpoints

**Jobs:**
- `GET /prod/customer/jobs` - List customer's jobs
- `POST /prod/job` - Create new job
- `GET /prod/job/:job_id` - Get job details
- `PUT /prod/job/:job_id` - Update job
- `DELETE /prod/job/:job_id` - Delete job
- `GET /prod/job/:job_id/applications` - View applications
- `PUT /prod/job/:job_id/applications/:app_id` - Accept/reject application
- `PUT /prod/job/:job_id/unassign` - Unassign job

**Bookings:**
- `GET /prod/customer/bookings` - List bookings
- `POST /prod/booking` - Create booking
- `PUT /prod/booking/:booking_id` - Update booking status

**Services:**
- `GET /prod/get_all_service_offering` - Browse services

**Messaging:**
- `GET /prod/messaging/conversations` - List conversations
- `GET /prod/messaging/conversations/:id/messages` - Get messages
- `POST /prod/messaging/conversations/:id/messages` - Send message
- `POST /prod/messaging/conversations` - Create conversation
- `PUT /prod/messaging/conversations/:id/read` - Mark as read

**Profile:**
- `GET /prod/customer` - Get customer profile
- `PUT /prod/customer` - Update profile

---

## Service Provider Endpoints

**Jobs:**
- `GET /prod/get_available_jobs` - Browse available jobs
- `GET /prod/job_information/:jobId` - Get job details
- `POST /prod/job/:jobId/applications` - Apply to job

**Services:**
- `POST /prod/service_offering` - Create service offering
- `GET /prod/service_offering` - List provider's services
- `PUT /prod/service_offering/:id` - Update service
- `DELETE /prod/service_offering/:id` - Delete service

**Profile:**
- `GET /prod/service_provider` - Get provider profile
- `PUT /prod/service_provider` - Update profile

**Media:**
- `POST /prod/upload_image_URL` - Get S3 presigned URL

---

## Admin Endpoints

**Providers:**
- `GET /prod/admin/service_providers` - All providers
- `GET /prod/admin/unverified_service_provider` - Unverified providers
- `PUT /prod/admin/service_provider/:id/verify` - Approve provider
- `PUT /prod/admin/service_provider/:id/reject` - Reject provider

**System:**
- `GET /prod/admin/system_health` - Platform metrics

---

# TECHNICAL NOTES

## Authentication

**Primary System:** AWS Cognito (OIDC/OAuth)
- ID Token used for API authorization
- Access Token for resource access
- Tokens passed in Authorization header: `Bearer {token}`

**User Roles:**
- Customer
- Service Provider
- Administrator (Cognito group-based)

**Token Retrieval:**
```javascript
const token = auth.user?.id_token || auth.user?.access_token;
```

---

## API Base URL

```
https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod
```

All endpoints use this base URL.

---

## Status Code Handling

**200 OK:** Success, process response
**201 Created:** Resource created successfully
**400 Bad Request:** Validation error
**401 Unauthorized:** Not authenticated
**403 Forbidden:** Not authorized for this resource
**404 Not Found:** Resource doesn't exist
**409 Conflict:** Resource already exists
**500 Server Error:** Backend error

---

## File Upload (S3)

**Process:**
1. Request presigned URL from API
2. Upload file directly to S3 using presigned URL
3. Store S3 key (not full URL) in database
4. Retrieve images using: `https://quickfix-app-files.s3.us-east-2.amazonaws.com/{s3_key}`

**Bucket:** `quickfix-app-files`
**Region:** `us-east-2`

---

## Polling Intervals

**Conversations List:** 10 seconds
**Navbar Unread Badge:** 30 seconds

---

## Pagination

**Default Limits:**
- Jobs: 10 per page
- Bookings: 20 per page
- Services: 9 per page
- Conversations: 50

---

# CONCLUSION

This documentation provides comprehensive workflow guidance for the QuickFix chatbot. Use these workflows to:

1. Answer user questions accurately
2. Guide users step-by-step through processes
3. Troubleshoot issues
4. Explain platform features
5. Provide navigation assistance

**Always:**
- Reference exact URLs for navigation
- Mention required fields
- Explain what happens after actions
- Note current implementation status
- Provide alternative workflows when features are in development

**For Best Results:**
- Understand user's role (Customer, Provider, Admin)
- Identify their current location/page
- Determine their goal
- Provide step-by-step guidance with exact navigation paths
- Use the terminology from this documentation

---

**Document Version:** 1.0
**Created:** 2026-01-22
**Platform:** QuickFix - Service Marketplace
**Maintainer:** Development Team
