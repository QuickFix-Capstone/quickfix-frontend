# Design Document: Customer Public Profile

## Overview

The Customer Public Profile feature provides service providers with controlled access to customer information through a privacy-first architecture. The system implements three-tier access control (private, connections-only, all providers), displays privacy-safe customer data (display name, ratings, activity summaries), and uses cached statistics for performance optimization.

The architecture follows QuickFix's existing patterns: AWS Lambda functions behind API Gateway, MySQL database with proper indexing, JWT-based authentication via Cognito, and React frontend components consuming RESTful APIs.

## Architecture

### System Components

```
┌─────────────────┐
│  React Frontend │
│  - CustomerProfilePage
│  - CustomerProfileHeader
│  - CustomerReviewsList
│  - CustomerActivitySummary
└────────┬────────┘
         │ HTTPS + JWT
         ▼
┌─────────────────┐
│  API Gateway    │
│  /provider/customers/{id}/profile
│  /provider/customers/{id}/reviews
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lambda Functions│
│  - getCustomerProfile
│  - getCustomerReviews
│  - verifyAccess
│  - calculateStats
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL Database │
│  - customers
│  - customer_profile_stats
│  - reviews
│  - jobs
│  - job_applications
│  - bookings
└─────────────────┘
```

### Data Flow

1. **Profile Request Flow**:
   - Provider clicks customer name → Frontend sends GET /provider/customers/{id}/profile with JWT
   - API Gateway validates JWT → Lambda extracts provider_id from token
   - Lambda checks access control (visibility + connection + job context)
   - If authorized: Lambda retrieves profile data + stats + recent reviews → Returns JSON
   - If unauthorized: Returns 403 with error message

2. **Access Control Flow**:
   - Extract customer's profile_visibility setting
   - If 'all_providers': Grant access
   - If 'connections_only': Check job_applications, jobs.assigned_provider_id, bookings
   - If 'private': Deny access (unless viewing active job)
   - Check if provider is viewing a job posted by customer (job context)

3. **Statistics Calculation Flow**:
   - Check customer_profile_stats.updated_at
   - If > 24 hours old: Recalculate from source tables
   - Calculate: avg_rating (from reviews), jobs_posted_6mo (from jobs), completion_rate, cancel_rate
   - Update customer_profile_stats table
   - Return cached stats

## Components and Interfaces

### Backend Components

#### 1. Lambda: getCustomerProfile

**Purpose**: Retrieve complete customer profile with stats and recent reviews

**Input**:
```typescript
{
  pathParameters: {
    customer_id: string
  },
  headers: {
    Authorization: string  // Bearer {jwt_token}
  },
  queryStringParameters?: {
    job_id?: string  // Optional: job context for access control
  }
}
```

**Output**:
```typescript
{
  statusCode: 200 | 403 | 404 | 401,
  body: {
    customer_id: number,
    display_name: string,
    avatar_url: string | null,
    avg_rating: number | null,
    review_count: number,
    activity_summary: {
      jobs_posted_6mo: number,
      completion_rate: number | null,
      cancel_rate: number | null
    },
    recent_reviews: Array<{
      review_id: number,
      rating: number,
      comment: string,
      job_category: string,
      created_at: string,
      relative_date: string
    }>
  } | {
    error: string
  }
}
```

**Logic**:
1. Extract provider_id from JWT token
2. Verify customer exists
3. Check access control (verifyAccess function)
4. Retrieve customer basic info (display_name, avatar_url)
5. Get or calculate profile stats (getProfileStats function)
6. Fetch recent 5 reviews (getRecentReviews function)
7. Return combined response

#### 2. Lambda: getCustomerReviews

**Purpose**: Retrieve paginated customer reviews with sorting

**Input**:
```typescript
{
  pathParameters: {
    customer_id: string
  },
  headers: {
    Authorization: string
  },
  queryStringParameters: {
    sort?: 'recent' | 'rating',  // Default: 'recent'
    limit?: string,               // Default: '10', Max: '50'
    offset?: string               // Default: '0'
  }
}
```

**Output**:
```typescript
{
  statusCode: 200 | 403 | 404 | 401,
  body: {
    reviews: Array<{
      review_id: number,
      rating: number,
      comment: string,
      job_category: string,
      created_at: string,
      relative_date: string
    }>,
    total_count: number,
    has_more: boolean
  } | {
    error: string
  }
}
```

**Logic**:
1. Extract provider_id from JWT token
2. Verify access control (same as getCustomerProfile)
3. Parse and validate query parameters
4. Build SQL query with sorting and pagination
5. Execute query with LIMIT and OFFSET
6. Calculate relative dates (e.g., "2 months ago")
7. Return paginated results with metadata

#### 3. Function: verifyAccess

**Purpose**: Centralized access control logic

**Input**:
```typescript
{
  provider_id: number,
  customer_id: number,
  job_id?: number  // Optional job context
}
```

**Output**:
```typescript
{
  authorized: boolean,
  reason?: string  // For logging/debugging
}
```

**Logic**:
```
1. Retrieve customer.profile_visibility
2. If job_id provided:
   - Query jobs table: WHERE job_id = ? AND customer_id = ?
   - If match found: GRANT ACCESS (viewing active job)
3. If profile_visibility = 'all_providers': GRANT ACCESS
4. If profile_visibility = 'private': DENY ACCESS
5. If profile_visibility = 'connections_only':
   - Check connection (hasConnection function)
   - If connected: GRANT ACCESS
   - Else: DENY ACCESS
```

#### 4. Function: hasConnection

**Purpose**: Determine if provider has interacted with customer

**Input**:
```typescript
{
  provider_id: number,
  customer_id: number
}
```

**Output**:
```typescript
boolean
```

**Logic**:
```sql
-- Check job applications
SELECT COUNT(*) FROM job_applications ja
JOIN jobs j ON ja.job_id = j.job_id
WHERE ja.provider_id = ? AND j.customer_id = ?

-- Check assigned jobs
SELECT COUNT(*) FROM jobs
WHERE assigned_provider_id = ? AND customer_id = ?

-- Check bookings
SELECT COUNT(*) FROM bookings b
JOIN jobs j ON b.job_id = j.job_id
WHERE b.provider_id = ? AND j.customer_id = ?

-- Return true if any count > 0
```

**Optimization**: Cache result for 5 minutes using Lambda memory or ElastiCache

#### 5. Function: getProfileStats

**Purpose**: Retrieve or calculate customer statistics

**Input**:
```typescript
{
  customer_id: number
}
```

**Output**:
```typescript
{
  avg_rating: number | null,
  review_count: number,
  jobs_posted_6mo: number,
  completion_rate: number | null,
  cancel_rate: number | null
}
```

**Logic**:
```
1. Query customer_profile_stats WHERE customer_id = ?
2. If exists AND updated_at < 24 hours ago:
   - Return cached stats
3. Else:
   - Calculate avg_rating: AVG(rating) FROM reviews WHERE customer_id = ? AND is_visible = true
   - Calculate review_count: COUNT(*) FROM reviews WHERE customer_id = ? AND is_visible = true
   - Calculate jobs_posted_6mo: COUNT(*) FROM jobs WHERE customer_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
   - Calculate completion_rate: COUNT(status='completed') / COUNT(status IN ('completed','cancelled'))
   - Calculate cancel_rate: COUNT(status='cancelled') / COUNT(status IN ('completed','cancelled'))
   - INSERT or UPDATE customer_profile_stats
   - Return calculated stats
```

#### 6. Function: getRecentReviews

**Purpose**: Fetch recent reviews with relative dates

**Input**:
```typescript
{
  customer_id: number,
  limit: number
}
```

**Output**:
```typescript
Array<{
  review_id: number,
  rating: number,
  comment: string,
  job_category: string,
  created_at: string,
  relative_date: string
}>
```

**Logic**:
```sql
SELECT r.review_id, r.rating, r.comment, j.category, r.created_at
FROM reviews r
JOIN jobs j ON r.job_id = j.job_id
WHERE r.customer_id = ? AND r.is_visible = true
ORDER BY r.created_at DESC
LIMIT ?
```

Then calculate relative_date for each review using date-fns or similar library.

### Frontend Components

#### 1. CustomerProfilePage

**Purpose**: Main container for customer profile view

**Props**:
```typescript
{
  customerId: number,
  jobId?: number  // Optional: for access control context
}
```

**State**:
```typescript
{
  profile: CustomerProfile | null,
  loading: boolean,
  error: string | null
}
```

**Behavior**:
- On mount: Fetch profile data from API
- Display CustomerProfileHeader, CustomerActivitySummary, CustomerReviewsList
- Handle loading and error states
- Show "Profile not available" message on 403 error

#### 2. CustomerProfileHeader

**Purpose**: Display customer identity and rating summary

**Props**:
```typescript
{
  displayName: string,
  avatarUrl: string | null,
  avgRating: number | null,
  reviewCount: number
}
```

**Rendering**:
```
┌─────────────────────────────────┐
│  [Avatar]  Kunpeng Y.           │
│            ⭐⭐⭐⭐⭐ 4.8 (24 reviews) │
└─────────────────────────────────┘
```

#### 3. CustomerActivitySummary

**Purpose**: Display customer activity statistics

**Props**:
```typescript
{
  activitySummary: {
    jobs_posted_6mo: number,
    completion_rate: number | null,
    cancel_rate: number | null
  }
}
```

**Rendering**:
```
┌─────────────────────────────────┐
│  Activity Summary               │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  12  │ │ 95%  │ │  5%  │   │
│  │ Jobs │ │ Done │ │Cancel│   │
│  └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────┘
```

#### 4. CustomerReviewsList

**Purpose**: Display paginated reviews with sorting

**Props**:
```typescript
{
  customerId: number,
  initialReviews?: Review[]  // From profile API
}
```

**State**:
```typescript
{
  reviews: Review[],
  sort: 'recent' | 'rating',
  page: number,
  hasMore: boolean,
  loading: boolean
}
```

**Behavior**:
- Display initial reviews from profile API
- Support "Load More" pagination
- Support sort toggle (Recent / Highest Rated)
- Fetch additional reviews from /provider/customers/{id}/reviews API

**Rendering**:
```
┌─────────────────────────────────┐
│  Reviews (24)  [Recent ▼]       │
│                                 │
│  ⭐⭐⭐⭐⭐ 5.0                      │
│  "Great customer, clear..."     │
│  Plumbing • 2 months ago        │
│  ─────────────────────────      │
│  ⭐⭐⭐⭐ 4.0                        │
│  "Responsive and fair..."       │
│  Electrical • 3 months ago      │
│                                 │
│  [Load More]                    │
└─────────────────────────────────┘
```

## Data Models

### Database Schema Changes

#### customers table (modifications)

```sql
ALTER TABLE customers
ADD COLUMN display_name VARCHAR(100) AFTER last_name,
ADD COLUMN avatar_url VARCHAR(500) AFTER display_name,
ADD COLUMN profile_visibility ENUM('private', 'connections_only', 'all_providers') 
  DEFAULT 'connections_only' AFTER avatar_url;

-- Generate display_name for existing customers
UPDATE customers
SET display_name = CONCAT(first_name, ' ', LEFT(last_name, 1), '.')
WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

UPDATE customers
SET display_name = 'Anonymous User'
WHERE display_name IS NULL;
```

#### customer_profile_stats table (new)

```sql
CREATE TABLE customer_profile_stats (
  customer_id BIGINT PRIMARY KEY,
  avg_rating DECIMAL(3,2) NULL,
  review_count INT NOT NULL DEFAULT 0,
  jobs_posted_6mo INT NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2) NULL,
  cancel_rate DECIMAL(5,2) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Indexes (new)

```sql
-- Improve review queries by customer
CREATE INDEX idx_reviews_customer_visible 
ON reviews(customer_id, is_visible, created_at DESC);

-- Improve connection verification queries
CREATE INDEX idx_job_applications_provider_job 
ON job_applications(provider_id, job_id);

CREATE INDEX idx_jobs_customer_assigned 
ON jobs(customer_id, assigned_provider_id);

CREATE INDEX idx_bookings_provider 
ON bookings(provider_id, job_id);
```

### API Response Models

#### CustomerProfile

```typescript
interface CustomerProfile {
  customer_id: number;
  display_name: string;
  avatar_url: string | null;
  avg_rating: number | null;
  review_count: number;
  activity_summary: ActivitySummary;
  recent_reviews: Review[];
}
```

#### ActivitySummary

```typescript
interface ActivitySummary {
  jobs_posted_6mo: number;
  completion_rate: number | null;  // Percentage (0-100)
  cancel_rate: number | null;      // Percentage (0-100)
}
```

#### Review

```typescript
interface Review {
  review_id: number;
  rating: number;              // 1-5
  comment: string;
  job_category: string;
  created_at: string;          // ISO 8601 format
  relative_date: string;       // e.g., "2 months ago"
}
```

#### ReviewsResponse

```typescript
interface ReviewsResponse {
  reviews: Review[];
  total_count: number;
  has_more: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication Required for Profile Access
*For any* profile request without a valid JWT token, the system should return HTTP 401 with authentication error message.
**Validates: Requirements 1.1**

### Property 2: All Providers Visibility Grants Universal Access
*For any* provider and customer where profile_visibility is 'all_providers', the system should grant profile access regardless of connection status.
**Validates: Requirements 1.2**

### Property 3: Connections-Only Visibility Enforces Connection Check
*For any* provider and customer where profile_visibility is 'connections_only', the system should grant access if and only if the provider has a job application, assignment, or booking with that customer.
**Validates: Requirements 1.3, 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 4: Private Visibility Denies Access
*For any* provider and customer where profile_visibility is 'private' and no job context is provided, the system should deny profile access.
**Validates: Requirements 1.4**

### Property 5: Job Context Overrides Visibility Settings
*For any* provider viewing a job posted by a customer, the system should grant profile access regardless of the customer's profile_visibility setting.
**Validates: Requirements 1.5**

### Property 6: Display Name Format Consistency
*For any* customer with non-null first_name and last_name, the display_name should be formatted as "{first_name} {first_letter_of_last_name}." (e.g., "Kunpeng Y.").
**Validates: Requirements 2.1, 10.1, 10.2**

### Property 7: Avatar URL Inclusion When Present
*For any* customer profile with a non-null avatar_url, the profile response should include the avatar_url field.
**Validates: Requirements 2.2**

### Property 8: Average Rating Calculation Accuracy
*For any* customer with visible reviews, the avg_rating should equal the arithmetic mean of all visible review ratings.
**Validates: Requirements 2.3, 6.1**

### Property 9: Visible Review Count Accuracy
*For any* customer, the review_count should equal the number of reviews where is_visible is true.
**Validates: Requirements 2.4**

### Property 10: Activity Summary Calculation Accuracy
*For any* customer, the activity summary should contain accurate counts for jobs_posted_6mo (jobs created within 180 days), completion_rate (completed jobs / (completed + cancelled)), and cancel_rate (cancelled jobs / (completed + cancelled)).
**Validates: Requirements 2.5, 6.2, 6.3, 6.4**

### Property 11: Privacy-Safe Profile Response
*For any* profile response, the response should not contain customer address, phone number, exact job locations, full job descriptions, or payment amounts.
**Validates: Requirements 2.6**

### Property 12: Visible Reviews Filter
*For any* customer reviews request, all returned reviews should have is_visible set to true.
**Validates: Requirements 3.1**

### Property 13: Review Response Structure Completeness
*For any* review in a reviews response, the review should contain rating, comment, job_category, created_at, and relative_date fields.
**Validates: Requirements 3.2**

### Property 14: Review Sort Order Correctness
*For any* reviews request with sort='recent', reviews should be ordered by created_at descending; for sort='rating', reviews should be ordered by rating descending.
**Validates: Requirements 3.3**

### Property 15: Review Limit Enforcement
*For any* reviews request with a limit parameter, the number of returned reviews should be at most the specified limit value.
**Validates: Requirements 3.4**

### Property 16: Pagination Offset and Limit Correctness
*For any* reviews request with offset and limit parameters, the returned reviews should represent the correct subset of all reviews starting at the offset position.
**Validates: Requirements 3.5**

### Property 17: Privacy-Safe Review Response
*For any* review response, the response should not contain provider names, provider contact information, or specific job addresses.
**Validates: Requirements 3.6**

### Property 18: Profile API Response Structure
*For any* successful profile request, the response should contain customer_id, display_name, avatar_url, avg_rating, review_count, activity_summary, and recent_reviews fields.
**Validates: Requirements 5.1**

### Property 19: Six Month Job Count Accuracy
*For any* customer, jobs_posted_6mo should equal the count of jobs where created_at is within 180 days of the current date.
**Validates: Requirements 6.2**

### Property 20: Profile Stats Cache Invalidation
*For any* customer profile stats with updated_at older than 24 hours, the system should recalculate statistics from source tables before returning them.
**Validates: Requirements 6.6**

### Property 21: Profile Visibility Input Validation
*For any* profile_visibility update with a value not in {'private', 'connections_only', 'all_providers'}, the system should reject the update with a validation error.
**Validates: Requirements 7.2**

### Property 22: Immediate Visibility Setting Application
*For any* customer whose profile_visibility is updated, subsequent access control checks should immediately reflect the new setting without cache delay.
**Validates: Requirements 7.6**

### Property 23: Connection Verification Cache Consistency
*For any* provider-customer pair, repeated connection verification checks within 5 minutes should return consistent results.
**Validates: Requirements 9.6**

### Property 24: Display Name Auto-Regeneration
*For any* customer whose first_name or last_name is updated, the display_name should be automatically regenerated to reflect the new name.
**Validates: Requirements 10.4**

### Property 25: Display Name Retrieval Consistency
*For any* customer, the display_name returned in API responses should exactly match the display_name stored in the database without additional formatting.
**Validates: Requirements 10.6**

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
{
  statusCode: number,
  body: {
    error: string,
    message: string,
    details?: any
  }
}
```

### Error Scenarios

#### 1. Authentication Errors (401)

**Trigger**: Missing or invalid JWT token

**Response**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Handling**: Frontend redirects to login page

#### 2. Authorization Errors (403)

**Trigger**: Valid authentication but insufficient permissions

**Response**:
```json
{
  "error": "Forbidden",
  "message": "Access denied: insufficient permissions to view this profile"
}
```

**Handling**: Frontend displays "This customer's profile is not available" message

#### 3. Not Found Errors (404)

**Trigger**: Customer ID does not exist

**Response**:
```json
{
  "error": "Not Found",
  "message": "Customer not found"
}
```

**Handling**: Frontend displays "Customer not found" message

#### 4. Validation Errors (400)

**Trigger**: Invalid query parameters (e.g., limit > 50, invalid sort value)

**Response**:
```json
{
  "error": "Bad Request",
  "message": "Invalid parameter: limit must be between 1 and 50",
  "details": {
    "parameter": "limit",
    "value": "100",
    "constraint": "max: 50"
  }
}
```

**Handling**: Frontend displays validation error message

#### 5. Server Errors (500)

**Trigger**: Database connection failure, unexpected exceptions

**Response**:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Handling**: Frontend displays generic error message and logs error for debugging

### Error Handling Strategy

**Backend**:
- Wrap all Lambda functions in try-catch blocks
- Log all errors to CloudWatch with context (provider_id, customer_id, request_id)
- Return appropriate HTTP status codes
- Never expose internal implementation details in error messages
- Sanitize error messages to prevent information leakage

**Frontend**:
- Display user-friendly error messages
- Provide retry mechanisms for transient errors
- Log errors to frontend monitoring (e.g., Sentry)
- Gracefully degrade functionality when profile data unavailable
- Show loading states during API calls

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and edge cases with property-based tests for universal correctness properties. Both approaches are complementary and necessary for comprehensive coverage.

### Unit Testing

Unit tests focus on:
- **Specific examples**: Concrete scenarios demonstrating correct behavior
- **Edge cases**: Boundary conditions (null names, empty review lists, zero jobs)
- **Error conditions**: Invalid inputs, missing data, authorization failures
- **Integration points**: Database queries, JWT token parsing, date calculations

**Example Unit Tests**:
```javascript
// Edge case: Customer with no reviews
test('profile with no reviews returns null avg_rating', async () => {
  const profile = await getCustomerProfile(customerId);
  expect(profile.avg_rating).toBeNull();
  expect(profile.review_count).toBe(0);
});

// Error condition: Invalid customer ID
test('non-existent customer returns 404', async () => {
  const response = await request.get('/provider/customers/999999/profile');
  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Not Found');
});

// Specific example: Display name formatting
test('display name formats correctly', () => {
  const displayName = generateDisplayName('Kunpeng', 'Yang');
  expect(displayName).toBe('Kunpeng Y.');
});
```

### Property-Based Testing

Property tests verify universal properties across many generated inputs using a property-based testing library.

**Library Selection**:
- **Backend (Node.js/JavaScript)**: fast-check
- **Frontend (React/JavaScript)**: fast-check with Jest

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: customer-public-profile, Property {N}: {property_text}`

**Example Property Tests**:
```javascript
// Property 3: Connections-Only Visibility Enforces Connection Check
// Feature: customer-public-profile, Property 3
test('connections-only visibility grants access iff connection exists', () => {
  fc.assert(
    fc.property(
      fc.record({
        provider_id: fc.integer({ min: 1, max: 10000 }),
        customer_id: fc.integer({ min: 1, max: 10000 }),
        has_connection: fc.boolean()
      }),
      async ({ provider_id, customer_id, has_connection }) => {
        // Setup: Create customer with connections_only visibility
        await setupCustomer(customer_id, 'connections_only');
        if (has_connection) {
          await createJobApplication(provider_id, customer_id);
        }
        
        // Test: Verify access matches connection status
        const result = await verifyAccess(provider_id, customer_id);
        expect(result.authorized).toBe(has_connection);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 8: Average Rating Calculation Accuracy
// Feature: customer-public-profile, Property 8
test('avg_rating equals mean of visible review ratings', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 50 }),
      async (ratings) => {
        // Setup: Create customer with reviews
        const customer_id = await createCustomer();
        for (const rating of ratings) {
          await createReview(customer_id, rating, true);
        }
        
        // Test: Verify avg_rating calculation
        const profile = await getCustomerProfile(customer_id);
        const expectedAvg = ratings.reduce((a, b) => a + b) / ratings.length;
        expect(profile.avg_rating).toBeCloseTo(expectedAvg, 2);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 14: Review Sort Order Correctness
// Feature: customer-public-profile, Property 14
test('reviews sorted correctly by recent and rating', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          rating: fc.integer({ min: 1, max: 5 }),
          created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() })
        }),
        { minLength: 2, maxLength: 20 }
      ),
      fc.constantFrom('recent', 'rating'),
      async (reviews, sortBy) => {
        // Setup: Create customer with reviews
        const customer_id = await createCustomer();
        for (const review of reviews) {
          await createReview(customer_id, review.rating, true, review.created_at);
        }
        
        // Test: Verify sort order
        const response = await getCustomerReviews(customer_id, { sort: sortBy });
        const returned = response.reviews;
        
        if (sortBy === 'recent') {
          for (let i = 0; i < returned.length - 1; i++) {
            expect(new Date(returned[i].created_at) >= new Date(returned[i+1].created_at)).toBe(true);
          }
        } else {
          for (let i = 0; i < returned.length - 1; i++) {
            expect(returned[i].rating >= returned[i+1].rating).toBe(true);
          }
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Goals

- **Unit tests**: 80%+ code coverage
- **Property tests**: All 25 correctness properties implemented
- **Integration tests**: End-to-end API flows (profile retrieval, review pagination)
- **Edge cases**: All identified edge cases covered (null names, empty lists, zero stats)

### Testing Environment

- **Local**: MySQL test database with seed data
- **CI/CD**: Automated test runs on every commit
- **Staging**: Integration tests against staging API
- **Production**: Monitoring and alerting for error rates

## Implementation Notes

### Performance Considerations

1. **Database Indexing**: Ensure all indexes are created before deployment
2. **Stats Caching**: customer_profile_stats table reduces repeated calculations
3. **Connection Caching**: Cache connection verification for 5 minutes
4. **Query Optimization**: Use EXPLAIN to verify query performance
5. **Pagination**: Limit maximum page size to 50 to prevent large result sets

### Security Considerations

1. **JWT Validation**: Verify token signature and expiration on every request
2. **SQL Injection**: Use parameterized queries for all database operations
3. **Rate Limiting**: Implement rate limiting on API endpoints (e.g., 100 requests/minute per provider)
4. **Data Sanitization**: Sanitize all user inputs before database storage
5. **Privacy Protection**: Never expose PII beyond display name and avatar

### Migration Strategy

1. **Phase 1**: Add new columns to customers table with default values
2. **Phase 2**: Create customer_profile_stats table and indexes
3. **Phase 3**: Backfill display_name for existing customers
4. **Phase 4**: Deploy Lambda functions and API endpoints
5. **Phase 5**: Deploy frontend components
6. **Phase 6**: Monitor error rates and performance metrics

### Rollback Plan

- Database changes are additive (no data loss on rollback)
- API endpoints can be disabled via API Gateway configuration
- Frontend components can be feature-flagged
- customer_profile_stats table can be dropped if needed
