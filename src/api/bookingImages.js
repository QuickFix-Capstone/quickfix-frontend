import { API_BASE } from "./config";

/**
 * Get S3 upload URL for booking image
 * @param {string} bookingId - The booking ID
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Object>} Upload URL and metadata
 */
export async function getUploadUrl(bookingId, fileName, fileType, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;
    
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/images/upload-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            file_name: fileName,
            file_type: fileType,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Upload file directly to S3
 * @param {string} uploadUrl - Pre-signed S3 URL
 * @param {File} file - File to upload
 * @param {string} fileType - MIME type
 * @returns {Promise<Response>}
 */
export async function uploadToS3(uploadUrl, file, fileType) {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': fileType,
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload to S3: ${response.statusText}`);
    }

    return response;
}

/**
 * Save image metadata after S3 upload
 * @param {string} bookingId - The booking ID
 * @param {Object} imageData - Image metadata
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Object>} Saved image data
 */
export async function saveImageMetadata(bookingId, imageData, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;
    
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/images`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(imageData),
    });

    if (!response.ok) {
        throw new Error(`Failed to save image metadata: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get all images for a booking
 * @param {string} bookingId - The booking ID
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Array>} Array of image objects
 */
export async function getBookingImages(bookingId, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;
    
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/images`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images || [];
}

/**
 * Delete a booking image
 * @param {string} bookingId - The booking ID
 * @param {string} imageId - The image ID to delete
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteBookingImage(bookingId, imageId, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;
    
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Complete image upload workflow
 * @param {string} bookingId - The booking ID
 * @param {File} file - File to upload
 * @param {Object} auth - Auth object from useAuth hook
 * @param {Object} options - Upload options (order, description)
 * @returns {Promise<Object>} Complete upload result
 */
export async function uploadBookingImage(bookingId, file, auth, options = {}) {
    try {
        // Step 1: Get upload URL
        const uploadData = await getUploadUrl(bookingId, file.name, file.type, auth);
        
        // Step 2: Upload to S3
        await uploadToS3(uploadData.upload_url, file, file.type);
        
        // Step 3: Save metadata
        const imageMetadata = {
            s3_key: uploadData.s3_key,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            display_order: options.order || 0,
            description: options.description || '',
        };
        
        const savedImage = await saveImageMetadata(bookingId, imageMetadata, auth);
        
        return savedImage;
    } catch (error) {
        console.error('Upload workflow failed:', error);
        throw error;
    }
}