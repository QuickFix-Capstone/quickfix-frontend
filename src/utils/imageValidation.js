// Image validation constants
export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_BOOKING = 10;

/**
 * Validate a single file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateImageFile(file) {
    const errors = [];

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed. Please use JPEG, PNG, WebP, or GIF.`);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
        errors.push('Selected file is not an image.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        file
    };
}

/**
 * Validate multiple files
 * @param {FileList|Array} files - Files to validate
 * @param {number} existingCount - Number of existing images
 * @returns {Object} Validation result
 */
export function validateImageFiles(files, existingCount = 0) {
    const fileArray = Array.from(files);
    const results = fileArray.map(validateImageFile);
    const validFiles = results.filter(r => r.isValid).map(r => r.file);
    const allErrors = results.flatMap(r => r.errors);

    // Check total count limit
    if (existingCount + validFiles.length > MAX_FILES_PER_BOOKING) {
        allErrors.push(`Cannot upload ${validFiles.length} files. Maximum ${MAX_FILES_PER_BOOKING} images allowed per booking (${existingCount} already uploaded).`);
        return {
            isValid: false,
            errors: allErrors,
            validFiles: [],
            invalidCount: fileArray.length
        };
    }

    return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        validFiles,
        invalidCount: results.filter(r => !r.isValid).length
    };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a preview URL for a file
 * @param {File} file - File to preview
 * @returns {string} Object URL for preview
 */
export function createFilePreview(file) {
    return URL.createObjectURL(file);
}

/**
 * Clean up preview URL
 * @param {string} url - Object URL to revoke
 */
export function revokeFilePreview(url) {
    URL.revokeObjectURL(url);
}