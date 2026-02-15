# Requirements Document: Customer Public Profile

## Introduction

The Customer Public Profile feature enables service providers in the QuickFix marketplace to view privacy-safe customer profiles containing reviews, ratings, and activity summaries. This helps providers make informed decisions about accepting jobs while protecting customer privacy through access controls and limited data exposure.

## Glossary

- **Customer**: A user who posts jobs and hires service providers
- **Provider**: A service provider who applies for and completes jobs
- **Profile_System**: The backend system managing customer profile data and access control
- **Review**: Feedback and rating given by a customer about a provider's service
- **Connection**: A relationship between a provider and customer established through job interaction (application, acceptance, or completion)
- **Display_Name**: Privacy-safe customer identifier showing first name and last initial (e.g., "Kunpeng Y.")
- **Profile_Visibility**: Customer privacy setting controlling who can view their profile
- **Activity_Summary**: Aggregated statistics about customer behavior (jobs posted, completion rate, cancellation rate)

## Requirements

### Requirement 1: Profile Access Control

**User Story:** As a provider, I want access to customer profiles to be restricted based on my relationship with the customer, so that customer privacy is protected while allowing legitimate profile viewing.

#### Acceptance Criteria

1. WHEN a provider requests a customer profile, THE Profile_System SHALL verify the provider is authenticated via valid JWT token
2. WHEN a provider requests a customer profile AND the customer's profile_visibility is set to 'all_providers', THE Profile_System SHALL grant access
3. WHEN a provider requests a customer profile AND the customer's profile_visibility is set to 'connections_only', THE Profile_System SHALL grant access only if the provider has applied to, accepted, or completed a job for that customer
4. WHEN a provider requests a customer profile AND the customer's profile_visibility is set to 'private', THE Profile_System SHALL deny access
5. WHEN a provider requests a customer profile AND the provider is currently viewing a job posted by that customer, THE Profile_System SHALL grant access regardless of profile_visibility setting
6. WHEN a provider requests a customer profile without proper authorization, THE Profile_System SHALL return a 403 Forbidden error with a descriptive message

### Requirement 2: Profile Data Display

**User Story:** As a provider, I want to view privacy-safe customer information including display name, rating, and activity summary, so that I can assess customer reliability without accessing sensitive personal information.

#### Acceptance Criteria

1. WHEN a customer profile is retrieved, THE Profile_System SHALL return the customer's display_name formatted as first name plus last initial
2. WHEN a customer profile is retrieved AND the customer has an avatar_url, THE Profile_System SHALL include the avatar_url in the response
3. WHEN a customer profile is retrieved, THE Profile_System SHALL calculate and return the average rating from all visible reviews the customer has received
4. WHEN a customer profile is retrieved, THE Profile_System SHALL return the total count of visible reviews the customer has received
5. WHEN a customer profile is retrieved, THE Profile_System SHALL return an activity summary containing jobs posted in the last 6 months, completion rate, and cancellation rate
6. THE Profile_System SHALL NOT include customer address, phone number, exact job locations, full job descriptions, or payment amounts in profile responses

### Requirement 3: Review Display and Pagination

**User Story:** As a provider, I want to view paginated reviews that customers have received, so that I can understand their history and behavior patterns.

#### Acceptance Criteria

1. WHEN a provider requests customer reviews, THE Profile_System SHALL return only reviews where is_visible is true
2. WHEN a provider requests customer reviews, THE Profile_System SHALL include rating, comment, job category, and relative date for each review
3. WHEN a provider requests customer reviews with a sort parameter, THE Profile_System SHALL support sorting by 'recent' (newest first) and 'rating' (highest first)
4. WHEN a provider requests customer reviews with a limit parameter, THE Profile_System SHALL return at most the specified number of reviews
5. WHEN a provider requests customer reviews, THE Profile_System SHALL support pagination with offset and limit parameters
6. THE Profile_System SHALL NOT include provider names, provider contact information, or specific job addresses in review responses

### Requirement 4: Database Schema Extensions

**User Story:** As a system architect, I want the database schema to support customer profiles with privacy settings and cached statistics, so that profile data can be retrieved efficiently.

#### Acceptance Criteria

1. THE Profile_System SHALL store display_name as VARCHAR(100) in the customers table
2. THE Profile_System SHALL store avatar_url as VARCHAR(500) in the customers table
3. THE Profile_System SHALL store profile_visibility as ENUM('private', 'connections_only', 'all_providers') with default 'connections_only' in the customers table
4. WHEN profile statistics are calculated, THE Profile_System SHALL store them in a customer_profile_stats table with fields: customer_id, avg_rating, review_count, jobs_posted_6mo, completion_rate, cancel_rate, updated_at
5. THE Profile_System SHALL create an index on customer_id in the reviews table for efficient query performance
6. THE Profile_System SHALL create an index on customer_id in the customer_profile_stats table for efficient lookup

### Requirement 5: API Endpoint Implementation

**User Story:** As a frontend developer, I want RESTful API endpoints for retrieving customer profiles and reviews, so that I can integrate profile viewing into the provider interface.

#### Acceptance Criteria

1. WHEN a GET request is made to /provider/customers/{customer_id}/profile, THE Profile_System SHALL return customer profile data including identity, statistics, and recent reviews
2. WHEN a GET request is made to /provider/customers/{customer_id}/reviews, THE Profile_System SHALL return paginated reviews with support for sort, limit, and offset query parameters
3. WHEN an API request fails authorization checks, THE Profile_System SHALL return HTTP 403 with error message "Access denied: insufficient permissions to view this profile"
4. WHEN an API request references a non-existent customer_id, THE Profile_System SHALL return HTTP 404 with error message "Customer not found"
5. WHEN an API request is made without a valid JWT token, THE Profile_System SHALL return HTTP 401 with error message "Authentication required"
6. THE Profile_System SHALL include appropriate CORS headers in all API responses to support frontend integration

### Requirement 6: Profile Statistics Calculation

**User Story:** As a provider, I want to see accurate and up-to-date customer statistics, so that I can make informed decisions based on recent customer behavior.

#### Acceptance Criteria

1. WHEN calculating average rating, THE Profile_System SHALL compute the mean of all visible review ratings for the customer
2. WHEN calculating jobs posted in last 6 months, THE Profile_System SHALL count jobs where created_at is within 180 days of the current date
3. WHEN calculating completion rate, THE Profile_System SHALL divide the count of jobs with status 'completed' by the total count of jobs with status 'completed' or 'cancelled'
4. WHEN calculating cancellation rate, THE Profile_System SHALL divide the count of jobs with status 'cancelled' by the total count of jobs with status 'completed' or 'cancelled'
5. WHEN a customer has no completed or cancelled jobs, THE Profile_System SHALL return completion_rate and cancel_rate as null
6. WHEN profile statistics are older than 24 hours, THE Profile_System SHALL recalculate and update the customer_profile_stats table

### Requirement 7: Privacy Setting Management

**User Story:** As a customer, I want to control who can view my profile through privacy settings, so that I can manage my visibility to service providers.

#### Acceptance Criteria

1. WHEN a customer account is created, THE Profile_System SHALL set profile_visibility to 'connections_only' by default
2. WHEN a customer updates their profile_visibility setting, THE Profile_System SHALL validate the value is one of 'private', 'connections_only', or 'all_providers'
3. WHEN a customer sets profile_visibility to 'private', THE Profile_System SHALL prevent all providers from viewing the profile except when viewing an active job posting
4. WHEN a customer sets profile_visibility to 'connections_only', THE Profile_System SHALL allow only providers with prior job interactions to view the profile
5. WHEN a customer sets profile_visibility to 'all_providers', THE Profile_System SHALL allow any authenticated provider to view the profile
6. THE Profile_System SHALL apply profile_visibility settings immediately without requiring cache invalidation

### Requirement 8: Frontend Component Integration

**User Story:** As a provider using the QuickFix interface, I want to view customer profiles through intuitive UI components, so that I can easily access and understand customer information.

#### Acceptance Criteria

1. WHEN a provider views a customer profile, THE Frontend SHALL display a CustomerProfileHeader component showing avatar, display name, average rating, and review count
2. WHEN a provider views a customer profile, THE Frontend SHALL display a CustomerActivitySummary component showing jobs posted, completion rate, and cancellation rate
3. WHEN a provider views a customer profile, THE Frontend SHALL display a CustomerReviewsList component with paginated reviews
4. WHEN a provider clicks on a customer name in a job posting, THE Frontend SHALL navigate to the CustomerProfilePage for that customer
5. WHEN the API returns a 403 error for profile access, THE Frontend SHALL display a message "This customer's profile is not available"
6. WHEN loading profile data, THE Frontend SHALL display loading indicators and handle errors gracefully with user-friendly messages

### Requirement 9: Connection Verification

**User Story:** As a system administrator, I want the system to accurately determine provider-customer connections, so that access control rules are enforced correctly.

#### Acceptance Criteria

1. WHEN verifying a connection, THE Profile_System SHALL check if the provider has any job_applications for jobs posted by the customer
2. WHEN verifying a connection, THE Profile_System SHALL check if the provider is the assigned_provider_id for any jobs posted by the customer
3. WHEN verifying a connection, THE Profile_System SHALL check if the provider has any completed bookings with the customer
4. WHEN a provider has at least one job application, assignment, or booking with a customer, THE Profile_System SHALL consider them connected
5. WHEN a provider has no job applications, assignments, or bookings with a customer, THE Profile_System SHALL consider them not connected
6. THE Profile_System SHALL cache connection verification results for 5 minutes to improve performance

### Requirement 10: Display Name Generation

**User Story:** As a customer, I want my display name to protect my privacy while remaining identifiable, so that providers can recognize me without accessing my full name.

#### Acceptance Criteria

1. WHEN generating a display name, THE Profile_System SHALL use the customer's first_name and the first character of last_name
2. WHEN generating a display name, THE Profile_System SHALL format it as "{first_name} {last_initial}." (e.g., "Kunpeng Y.")
3. WHEN a customer's first_name or last_name is null, THE Profile_System SHALL use "Anonymous User" as the display_name
4. WHEN a customer updates their first_name or last_name, THE Profile_System SHALL automatically regenerate the display_name
5. THE Profile_System SHALL store the generated display_name in the customers table for efficient retrieval
6. WHEN a display_name is retrieved, THE Profile_System SHALL return it exactly as stored without additional formatting
