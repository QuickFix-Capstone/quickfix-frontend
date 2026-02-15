# Backend Implementation Plan: Reviews About Me

## Overview
Implement endpoint for customers to view reviews that service providers have written about them.

---

## Endpoint Specification

### GET /prod/customer/reviews-about-me

**Purpose:** Retrieve all reviews that service providers have written about the authenticated customer.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:**
- `limit` (optional): Maximum number of reviews to return (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

---

## Implementation Steps

### 1. Extract Customer ID from JWT Token
```python
# Decode the Authorization Bearer token
# Extract customer_id from token claims (sub field)
customer_id = event['requestContext']['authorizer']['claims']['sub']
```

### 2. Parse Query Parameters
```python
limit = int(query_params.get('limit', 20))
limit = min(limit, 100)  # Cap at 100
offset = int(query_params.get('offset', 0))
```

### 3. Database Query

**Assumption:** You have a `provider_reviews` or similar table where providers review customers.

```sql
SELECT 
    pr.review_id,
    pr.rating,
    pr.comment,
    pr.created_at,
    pr.booking_id,
    pr.job_id,
    sp.provider_id,
    sp.business_name as provider_name,
    COALESCE(b.service_description, j.title) as service_title
FROM provider_reviews pr
LEFT JOIN service_providers sp ON pr.provider_id = sp.provider_id
LEFT JOIN bookings b ON pr.booking_id = b.booking_id
LEFT JOIN jobs j ON pr.job_id = j.job_id
WHERE pr.customer_id = %s
ORDER BY pr.created_at DESC
LIMIT %s OFFSET %s
```

**Note:** If you don't have a `provider_reviews` table yet, you'll need to create it first.

### 4. Get Total Count (for pagination)
```sql
SELECT COUNT(*) as total
FROM provider_reviews
WHERE customer_id = %s
```

### 5. Response Format
```json
{
  "reviews": [
    {
      "review_id": "uuid-here",
      "rating": 5,
      "comment": "Great customer, very communicative and respectful",
      "created_at": "2024-01-15T10:30:00Z",
      "provider_id": "provider-uuid",
      "provider_name": "John's Plumbing",
      "service_title": "Leaking water test",
      "booking_id": "booking-uuid",
      "job_id": null
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

## Database Schema (if not exists)

### Create `provider_reviews` Table

```sql
CREATE TABLE provider_reviews (
    review_id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36),
    job_id VARCHAR(36),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Lambda Function Structure

```python
import json
import pymysql
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        # 1. Extract customer_id from JWT
        customer_id = event['requestContext']['authorizer']['claims']['sub']
        
        # 2. Parse query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        limit = min(int(query_params.get('limit', 20)), 100)
        offset = int(query_params.get('offset', 0))
        
        # 3. Connect to database
        connection = pymysql.connect(
            host=os.environ['DB_HOST'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD'],
            database=os.environ['DB_NAME'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # 4. Get reviews
            sql = """
                SELECT 
                    pr.review_id,
                    pr.rating,
                    pr.comment,
                    pr.created_at,
                    pr.booking_id,
                    pr.job_id,
                    sp.provider_id,
                    sp.business_name as provider_name,
                    COALESCE(b.service_description, j.title) as service_title
                FROM provider_reviews pr
                LEFT JOIN service_providers sp ON pr.provider_id = sp.provider_id
                LEFT JOIN bookings b ON pr.booking_id = b.booking_id
                LEFT JOIN jobs j ON pr.job_id = j.job_id
                WHERE pr.customer_id = %s
                ORDER BY pr.created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, (customer_id, limit, offset))
            reviews = cursor.fetchall()
            
            # 5. Get total count
            cursor.execute(
                "SELECT COUNT(*) as total FROM provider_reviews WHERE customer_id = %s",
                (customer_id,)
            )
            total = cursor.fetchone()['total']
            
            # 6. Format dates
            for review in reviews:
                if review['created_at']:
                    review['created_at'] = review['created_at'].isoformat()
        
        connection.close()
        
        # 7. Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'reviews': reviews,
                'pagination': {
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                    'has_more': (offset + limit) < total
                }
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal server error while retrieving reviews'
            })
        }
```

---

## API Gateway Configuration

1. **Create Lambda function:** `get_customer_reviews_about_me`
2. **Add to API Gateway:**
   - Method: `GET`
   - Path: `/customer/reviews-about-me`
   - Authorization: Cognito User Pool
3. **Deploy to `prod` stage**

---

## Testing

### Test Script
```bash
#!/bin/bash

# Get JWT token
TOKEN=$(./get_customer_token.sh)

# Test endpoint
curl -X GET \
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/reviews-about-me?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Expected Response (Empty State)
```json
{
  "reviews": [],
  "pagination": {
    "total": 0,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

### Expected Response (With Reviews)
```json
{
  "reviews": [
    {
      "review_id": "abc-123",
      "rating": 5,
      "comment": "Excellent customer!",
      "created_at": "2024-01-15T10:30:00",
      "provider_id": "provider-123",
      "provider_name": "John's Plumbing",
      "service_title": "Fix leaking pipe",
      "booking_id": "booking-456",
      "job_id": null
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

---

## Additional Feature: Provider Review Submission

You'll also need an endpoint for providers to submit reviews about customers:

### POST /prod/provider/review-customer

**Request Body:**
```json
{
  "customer_id": "customer-uuid",
  "booking_id": "booking-uuid",
  "job_id": "job-uuid",
  "rating": 5,
  "comment": "Great customer to work with"
}
```

This allows providers to rate customers after completing a job/booking.

---

## Summary

1. ✅ Frontend already updated with new section
2. ⏳ Create `provider_reviews` table (if not exists)
3. ⏳ Implement Lambda function `get_customer_reviews_about_me`
4. ⏳ Configure API Gateway endpoint
5. ⏳ Deploy and test
6. ⏳ (Optional) Implement provider review submission endpoint

The frontend will gracefully handle the endpoint not existing yet (shows empty state).
