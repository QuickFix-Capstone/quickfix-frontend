import { JOB_IMAGES_API_BASE } from "./config";

/**
 * Get S3 upload URL for job image
 * @param {string} jobId - The job ID
 * @param {string} fileName - Original file name
 * @param {string} contentType - MIME type
 * @param {number} imageOrder - Display order (1-5)
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Object>} Upload URL and metadata
 */
export async function getUploadUrl(jobId, fileName, contentType, imageOrder, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;

    console.log('Getting upload URL for job image:', { jobId, fileName, contentType, imageOrder });

    const response = await fetch(`${JOB_IMAGES_API_BASE}/jobs/${jobId}/images/upload-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            file_name: fileName,
            content_type: contentType,
            image_order: imageOrder,
        }),
    });

    console.log('Upload URL response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload URL error:', response.status, errorText);
        throw new Error(`Failed to get upload URL (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Upload URL response:', data);
    return data;
}

/**
 * Upload file directly to S3 using presigned URL and form fields
 * @param {string} uploadUrl - Pre-signed S3 URL
 * @param {Object} fields - Form fields from the upload URL response
 * @param {File} file - File to upload
 * @returns {Promise<Response>}
 */
export async function uploadToS3(uploadUrl, fields, file) {
    console.log('Uploading to S3:', { uploadUrl, fields: Object.keys(fields), fileSize: file.size });

    // Create form data with all the required fields
    const formData = new FormData();

    // Add all the fields from the presigned URL response
    Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
    });

    // Add the file last (this is important for S3)
    formData.append('file', file);

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
    });

    console.log('S3 upload response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('S3 upload error:', response.status, errorText);
        throw new Error(`Failed to upload to S3 (${response.status}): ${response.statusText}`);
    }

    return response;
}

/**
 * Save image metadata after S3 upload
 * @param {string} jobId - The job ID
 * @param {Object} imageData - Image metadata
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Object>} Saved image data
 */
export async function saveImageMetadata(jobId, imageData, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;

    console.log('Saving job image metadata:', { jobId, imageData });

    const response = await fetch(`${JOB_IMAGES_API_BASE}/jobs/${jobId}/images`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(imageData),
    });

    console.log('Save metadata response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Save metadata error:', response.status, errorText);
        throw new Error(`Failed to save image metadata (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Save metadata response:', data);
    return data;
}

/**
 * Get all images for a job
 * @param {string} jobId - The job ID
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Array>} Array of image objects
 */
export async function getJobImages(jobId, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;

    console.log('=== GET JOB IMAGES DEBUG ===');
    console.log('Job ID:', jobId);
    console.log('Token present:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    console.log('API URL:', `${JOB_IMAGES_API_BASE}/jobs/${jobId}/images`);

    if (!token) {
        throw new Error('No authentication token available');
    }

    if (!jobId) {
        throw new Error('Job ID is required');
    }

    try {
        const response = await fetch(`${JOB_IMAGES_API_BASE}/jobs/${jobId}/images`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                console.error('Error response body:', errorText);
            } catch (e) {
                errorText = 'Could not read error response';
            }

            // Provide specific error messages based on status code
            switch (response.status) {
                case 401:
                    throw new Error('Authentication failed. Please log in again.');
                case 403:
                    throw new Error('You do not have permission to view images for this job.');
                case 404:
                    throw new Error('Job not found or no images available.');
                case 500:
                    throw new Error('Server error. Please try again later.');
                default:
                    throw new Error(`API Error (${response.status}): ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
            }
        }

        const data = await response.json();
        console.log('Success response data:', data);

        // Handle different response formats
        if (data.images && Array.isArray(data.images)) {
            return data.images;
        } else if (Array.isArray(data)) {
            return data;
        } else {
            console.warn('Unexpected response format:', data);
            return [];
        }

    } catch (error) {
        console.error('Fetch error details:', error);

        // Handle network errors specifically
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to the API. Check your internet connection and API server status.');
        }

        // Re-throw our custom errors
        throw error;
    }
}

/**
 * Delete a job image
 * @param {string} jobId - The job ID
 * @param {string} imageId - The image ID to delete
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteJobImage(jobId, imageId, auth) {
    const token = auth.user?.id_token || auth.user?.access_token;

    const response = await fetch(`${JOB_IMAGES_API_BASE}/jobs/${jobId}/images/${imageId}`, {
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
 * @param {string} jobId - The job ID
 * @param {File} file - File to upload
 * @param {Object} auth - Auth object from useAuth hook
 * @param {Object} options - Upload options (order, description)
 * @returns {Promise<Object>} Complete upload result
 */
export async function uploadJobImage(jobId, file, auth, options = {}) {
    try {
        console.log('Starting job image upload workflow:', { jobId, fileName: file.name, fileSize: file.size, options });

        // Step 1: Get upload URL
        const uploadData = await getUploadUrl(
            jobId,
            file.name,
            file.type,
            options.order || 1,
            auth
        );

        // Step 2: Upload to S3
        await uploadToS3(uploadData.upload_url, uploadData.fields, file);

        // Step 3: Save metadata
        const imageMetadata = {
            image_key: uploadData.image_key,
            image_order: options.order || 1,
            content_type: file.type,
            file_size: file.size,
            description: options.description || null,
        };

        const savedImage = await saveImageMetadata(jobId, imageMetadata, auth);

        console.log('Job image upload workflow completed:', savedImage);
        return savedImage;
    } catch (error) {
        console.error('Job image upload workflow failed:', error);
        throw error;
    }
}
