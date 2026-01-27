-- ============================================================================
-- QUICKFIX DATABASE SCHEMA REVIEW AND UPDATES
-- Updated: 2026-01-23
-- Purpose: Review and update jobs, job_applications, and bookings tables
--          for the new booking confirmation workflow
-- ============================================================================
USE quickfix;
-- ============================================================================
-- SECTION 1: BOOKINGS TABLE - UPDATED FOR CONFIRMATION WORKFLOW
-- ============================================================================
-- Current Issues Found:
-- 1. provider_id type mismatch: VARCHAR(40) but service_providers.provider_id is BIGINT
-- 2. Missing confirmation workflow fields
-- 3. Missing link to jobs table
-- RECOMMENDED MIGRATION:
ALTER TABLE bookings
MODIFY COLUMN provider_id BIGINT NOT NULL COMMENT 'Fixed type to match service_providers.provider_id';
-- Add confirmation workflow fields
ALTER TABLE bookings
ADD COLUMN confirmation_token VARCHAR(64) NULL COMMENT 'SHA-256 hash token for email confirmation',
    ADD COLUMN confirmation_token_expires_at TIMESTAMP NULL COMMENT 'Token expiration timestamp (7 days from creation)',
    ADD COLUMN confirmed_at TIMESTAMP NULL COMMENT 'When provider confirmed the booking',
    ADD COLUMN job_id BIGINT NULL COMMENT 'Link to job created after confirmation',
    ADD INDEX idx_confirmation_token (confirmation_token),
    ADD CONSTRAINT fk_booking_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE
SET NULL;
-- Update status enum to include new confirmation status
ALTER TABLE bookings
MODIFY COLUMN status ENUM(
        'pending_confirmation',
        -- NEW: Waiting for provider email confirmation
        'pending',
        -- Provider confirmed, awaiting start
        'confirmed',
        -- Explicitly confirmed by both parties
        'in_progress',
        -- Service is being performed
        'completed',
        -- Service completed
        'cancelled' -- Booking cancelled
    ) NOT NULL DEFAULT 'pending_confirmation' COMMENT 'Booking lifecycle status';
-- ============================================================================
-- SECTION 2: JOBS TABLE - REVIEW AND RECOMMENDATIONS
-- ============================================================================
-- Current Issues Found:
-- 1. assigned_provider_id type mismatch: VARCHAR(40) but should be BIGINT
-- 2. Missing link back to bookings table
-- 3. Missing final_price field (bookings has it, jobs should too)
-- RECOMMENDED UPDATES:
ALTER TABLE jobs
MODIFY COLUMN assigned_provider_id BIGINT NULL COMMENT 'Fixed type to match service_providers.provider_id';
-- Add booking reference for jobs created from bookings
ALTER TABLE jobs
ADD COLUMN booking_id BIGINT NULL COMMENT 'Link to booking if job was created from confirmed booking',
    ADD COLUMN final_price DECIMAL(10, 2) NULL COMMENT 'Actual final price charged',
    ADD COLUMN completed_at TIMESTAMP NULL COMMENT 'When job was completed',
    ADD INDEX idx_booking_id (booking_id),
    ADD CONSTRAINT fk_job_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE
SET NULL;
-- Add foreign key for assigned_provider_id (if not exists)
ALTER TABLE jobs
ADD CONSTRAINT fk_job_assigned_provider FOREIGN KEY (assigned_provider_id) REFERENCES service_providers(provider_id) ON DELETE
SET NULL;
-- ============================================================================
-- SECTION 3: JOB_APPLICATIONS TABLE - REVIEW AND RECOMMENDATIONS
-- ============================================================================
-- Current Issues Found:
-- 1. provider_id type mismatch: VARCHAR(40) but should be BIGINT
-- 2. Missing foreign key constraint to service_providers
-- 3. Missing timestamps for status changes
-- RECOMMENDED UPDATES:
ALTER TABLE job_applications
MODIFY COLUMN provider_id BIGINT NOT NULL COMMENT 'Fixed type to match service_providers.provider_id';
-- Add foreign key constraint
ALTER TABLE job_applications
ADD CONSTRAINT fk_application_provider FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE;
-- Add status tracking timestamps
ALTER TABLE job_applications
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    ADD COLUMN responded_at TIMESTAMP NULL COMMENT 'When application was accepted/rejected';
-- ============================================================================
-- SECTION 4: COMPLETE UPDATED SCHEMA (FOR REFERENCE)
-- ============================================================================
-- If you need to recreate tables from scratch, here are the corrected versions:
/*
 -- BOOKINGS TABLE (CORRECTED)
 CREATE TABLE bookings (
 booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
 customer_id BIGINT NOT NULL,
 provider_id BIGINT NOT NULL,  -- FIXED: Changed from VARCHAR(40) to BIGINT
 
 -- Service details
 service_category VARCHAR(100) NOT NULL,
 service_description TEXT NOT NULL,
 
 -- Scheduling
 scheduled_date DATE NOT NULL,
 scheduled_time TIME NOT NULL,
 
 -- Status tracking
 status ENUM(
 'pending_confirmation',  -- NEW: Waiting for provider confirmation
 'pending',
 'confirmed',
 'in_progress',
 'completed',
 'cancelled'
 ) NOT NULL DEFAULT 'pending_confirmation',
 
 -- Service location
 service_address VARCHAR(255) NOT NULL,
 service_city VARCHAR(100) NOT NULL,
 service_state VARCHAR(100) NOT NULL,
 service_postal_code VARCHAR(20) NOT NULL,
 
 -- Pricing
 estimated_price DECIMAL(10, 2) NULL,
 final_price DECIMAL(10, 2) NULL,
 
 -- Confirmation workflow (NEW)
 confirmation_token VARCHAR(64) NULL,
 confirmation_token_expires_at TIMESTAMP NULL,
 confirmed_at TIMESTAMP NULL,
 job_id BIGINT NULL,  -- Link to created job
 
 -- Additional information
 notes TEXT NULL,
 
 -- Timestamps
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 completed_at TIMESTAMP NULL,
 
 -- Foreign key constraints
 CONSTRAINT fk_booking_customer 
 FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
 CONSTRAINT fk_booking_provider 
 FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
 CONSTRAINT fk_booking_job 
 FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE SET NULL,
 
 -- Indexes
 INDEX idx_customer_id (customer_id),
 INDEX idx_provider_id (provider_id),
 INDEX idx_status (status),
 INDEX idx_scheduled_date (scheduled_date),
 INDEX idx_confirmation_token (confirmation_token)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
 -- JOBS TABLE (CORRECTED)
 CREATE TABLE jobs (
 job_id BIGINT AUTO_INCREMENT PRIMARY KEY,
 customer_id BIGINT NOT NULL,
 
 -- Job details
 title VARCHAR(255) NOT NULL,
 description TEXT NOT NULL,
 category VARCHAR(100) NULL,
 
 -- Location
 location_address VARCHAR(500) NOT NULL,
 location_city VARCHAR(100) NULL,
 location_state VARCHAR(50) NULL,
 location_zip VARCHAR(20) NULL,
 
 -- Scheduling
 preferred_date DATE NULL,
 preferred_time TIME NULL,
 
 -- Budget
 budget_min DECIMAL(10, 2) NULL,
 budget_max DECIMAL(10, 2) NULL,
 final_price DECIMAL(10, 2) NULL,  -- NEW: Actual final price
 
 -- Status tracking
 status ENUM(
 'open',          -- Job posted, accepting applications
 'assigned',      -- Provider assigned (from booking or application)
 'in_progress',   -- Work in progress
 'completed',     -- Job completed
 'cancelled'      -- Job cancelled
 ) NOT NULL DEFAULT 'open',
 
 -- Assignment
 assigned_provider_id BIGINT NULL,  -- FIXED: Changed from VARCHAR(40) to BIGINT
 booking_id BIGINT NULL,  -- NEW: Link to booking if created from booking
 
 -- Timestamps
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 completed_at TIMESTAMP NULL,  -- NEW: Completion timestamp
 
 -- Foreign key constraints
 CONSTRAINT fk_job_customer 
 FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
 CONSTRAINT fk_job_assigned_provider 
 FOREIGN KEY (assigned_provider_id) REFERENCES service_providers(provider_id) ON DELETE SET NULL,
 CONSTRAINT fk_job_booking 
 FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
 
 -- Indexes
 INDEX idx_customer_id (customer_id),
 INDEX idx_status (status),
 INDEX idx_category (category),
 INDEX idx_assigned_provider_id (assigned_provider_id),
 INDEX idx_booking_id (booking_id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
 -- JOB_APPLICATIONS TABLE (CORRECTED)
 CREATE TABLE job_applications (
 application_id BIGINT AUTO_INCREMENT PRIMARY KEY,
 job_id BIGINT NOT NULL,
 provider_id BIGINT NOT NULL,  -- FIXED: Changed from VARCHAR(40) to BIGINT
 
 -- Application details
 proposed_price DECIMAL(10, 2) NULL,
 message TEXT NULL,
 
 -- Status tracking
 status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
 
 -- Timestamps
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- NEW
 responded_at TIMESTAMP NULL,  -- NEW: When accepted/rejected
 
 -- Foreign key constraints
 CONSTRAINT fk_application_job 
 FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
 CONSTRAINT fk_application_provider 
 FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
 
 -- Unique constraint
 UNIQUE KEY unique_application (job_id, provider_id),
 
 -- Indexes
 INDEX idx_job_id (job_id),
 INDEX idx_provider_id (provider_id),
 INDEX idx_status (status)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 */
-- ============================================================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================================================
-- Check current table structures
DESCRIBE bookings;
DESCRIBE jobs;
DESCRIBE job_applications;
-- Check foreign key constraints
SELECT TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'quickfix'
    AND TABLE_NAME IN ('bookings', 'jobs', 'job_applications')
    AND REFERENCED_TABLE_NAME IS NOT NULL;
-- Check indexes
SHOW INDEX
FROM bookings;
SHOW INDEX
FROM jobs;
SHOW INDEX
FROM job_applications;
-- ============================================================================
-- SECTION 6: DATA TYPE CONSISTENCY CHECK
-- ============================================================================
-- Verify all provider_id columns are consistent
SELECT TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'quickfix'
    AND COLUMN_NAME LIKE '%provider_id%'
ORDER BY TABLE_NAME;
-- ============================================================================
-- SECTION 7: MIGRATION SCRIPT (SAFE EXECUTION ORDER)
-- ============================================================================
/*
 -- Execute in this order to avoid foreign key conflicts:
 
 -- Step 1: Drop existing foreign keys that reference provider_id
 ALTER TABLE bookings DROP FOREIGN KEY fk_booking_provider;
 ALTER TABLE job_applications DROP FOREIGN KEY IF EXISTS fk_application_provider;
 
 -- Step 2: Modify provider_id columns to BIGINT
 ALTER TABLE bookings MODIFY COLUMN provider_id BIGINT NOT NULL;
 ALTER TABLE jobs MODIFY COLUMN assigned_provider_id BIGINT NULL;
 ALTER TABLE job_applications MODIFY COLUMN provider_id BIGINT NOT NULL;
 
 -- Step 3: Re-add foreign key constraints
 ALTER TABLE bookings
 ADD CONSTRAINT fk_booking_provider 
 FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE;
 
 ALTER TABLE jobs
 ADD CONSTRAINT fk_job_assigned_provider 
 FOREIGN KEY (assigned_provider_id) REFERENCES service_providers(provider_id) ON DELETE SET NULL;
 
 ALTER TABLE job_applications
 ADD CONSTRAINT fk_application_provider 
 FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE;
 
 -- Step 4: Add new columns for booking confirmation workflow
 ALTER TABLE bookings
 ADD COLUMN confirmation_token VARCHAR(64) NULL,
 ADD COLUMN confirmation_token_expires_at TIMESTAMP NULL,
 ADD COLUMN confirmed_at TIMESTAMP NULL,
 ADD COLUMN job_id BIGINT NULL,
 ADD INDEX idx_confirmation_token (confirmation_token);
 
 -- Step 5: Add job-booking relationship
 ALTER TABLE jobs
 ADD COLUMN booking_id BIGINT NULL,
 ADD COLUMN final_price DECIMAL(10, 2) NULL,
 ADD COLUMN completed_at TIMESTAMP NULL,
 ADD INDEX idx_booking_id (booking_id);
 
 -- Step 6: Add cross-references between bookings and jobs
 ALTER TABLE bookings
 ADD CONSTRAINT fk_booking_job 
 FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE SET NULL;
 
 ALTER TABLE jobs
 ADD CONSTRAINT fk_job_booking 
 FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL;
 
 -- Step 7: Update status enums
 ALTER TABLE bookings 
 MODIFY COLUMN status ENUM(
 'pending_confirmation',
 'pending',
 'confirmed',
 'in_progress',
 'completed',
 'cancelled'
 ) NOT NULL DEFAULT 'pending_confirmation';
 
 -- Step 8: Add timestamps to job_applications
 ALTER TABLE job_applications
 ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 ADD COLUMN responded_at TIMESTAMP NULL;
 */
-- ============================================================================
-- END OF SCHEMA REVIEW
-- ============================================================================
SELECT customer_id,
    cognito_sub,
    email,
    first_name,
    last_name
FROM customers
ORDER BY created_at DESC
LIMIT 10;
DELETE FROM customers
WHERE customer_id = 10;


DELETE FROM customers WHERE customer_id = 3;

DELETE FROM customers WHERE customer_id = 11;