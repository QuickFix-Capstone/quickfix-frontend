import { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import {
    getJobImages,
    uploadJobImage,
    deleteJobImage
} from '../api/jobImages';
import { validateImageFiles } from '../utils/imageValidation';

/**
 * Custom hook for managing job images
 * @param {string} jobId - The job ID
 * @param {Array} initialImages - Optional initial images array
 * @returns {Object} Hook state and methods
 */
export function useJobImages(jobId, initialImages = null) {
    const auth = useAuth();

    // State management
    const [images, setImages] = useState(initialImages || []);
    const [loading, setLoading] = useState(!initialImages);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});

    // Fetch images for the job
    const fetchImages = useCallback(async () => {
        if (!jobId || !auth.isAuthenticated) return;

        setLoading(true);
        setError(null);

        try {
            const fetchedImages = await getJobImages(jobId, auth);
            setImages(fetchedImages);
        } catch (err) {
            console.error('Failed to fetch job images:', err);

            // Provide more specific error messages
            if (err.message.includes('404')) {
                setError('Job not found or no images available.');
            } else if (err.message.includes('401') || err.message.includes('403')) {
                setError('Authentication failed. Please log in again.');
            } else if (err.message.includes('500')) {
                setError('Server error. Please try again later.');
            } else {
                setError(`Failed to load images: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [jobId, auth]);

    // Upload multiple images
    const uploadImages = useCallback(async (files, options = {}) => {
        if (!files || files.length === 0) return;

        // Validate files
        const validation = validateImageFiles(files, images.length);
        if (!validation.isValid) {
            setError(validation.errors.join(' '));
            return { success: false, errors: validation.errors };
        }

        setUploading(true);
        setError(null);

        const results = [];
        const totalFiles = validation.validFiles.length;

        try {
            for (let i = 0; i < validation.validFiles.length; i++) {
                const file = validation.validFiles[i];
                const fileId = `${file.name}-${Date.now()}`;

                // Calculate image order (1-based, next available slot)
                const imageOrder = images.length + i + 1;

                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { progress: 0, status: 'uploading' }
                }));

                try {
                    const uploadOptions = {
                        order: imageOrder,
                        description: options.description || null,
                        ...options
                    };

                    const result = await uploadJobImage(jobId, file, auth, uploadOptions);

                    // Update progress
                    setUploadProgress(prev => ({
                        ...prev,
                        [fileId]: { progress: 100, status: 'completed' }
                    }));

                    results.push({ success: true, file, result });

                    // Add to images state immediately
                    setImages(prev => [...prev, result]);

                } catch (uploadError) {
                    console.error(`Failed to upload ${file.name}:`, uploadError);

                    setUploadProgress(prev => ({
                        ...prev,
                        [fileId]: { progress: 0, status: 'error', error: uploadError.message }
                    }));

                    results.push({
                        success: false,
                        file,
                        error: uploadError.message
                    });
                }
            }

            // Clear progress after delay
            setTimeout(() => {
                setUploadProgress({});
            }, 3000);

            const successCount = results.filter(r => r.success).length;
            const errorCount = results.filter(r => !r.success).length;

            if (errorCount > 0) {
                setError(`${errorCount} of ${totalFiles} files failed to upload.`);
            }

            return {
                success: successCount > 0,
                results,
                successCount,
                errorCount
            };

        } catch (err) {
            console.error('Upload process failed:', err);
            setError('Upload failed. Please try again.');
            return { success: false, error: err.message };
        } finally {
            setUploading(false);
        }
    }, [jobId, auth, images.length]);

    // Delete an image
    const deleteImage = useCallback(async (imageId) => {
        if (!imageId) return;

        try {
            await deleteJobImage(jobId, imageId, auth);

            // Remove from state
            setImages(prev => prev.filter(img => img.image_id !== imageId));

            return { success: true };
        } catch (err) {
            console.error('Failed to delete image:', err);
            setError('Failed to delete image. Please try again.');
            return { success: false, error: err.message };
        }
    }, [jobId, auth]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Refresh images
    const refresh = useCallback(() => {
        fetchImages();
    }, [fetchImages]);

    // Load images on mount and when jobId changes
    useEffect(() => {
        // Only fetch if we didn't start with initial images
        if (!initialImages) {
            fetchImages();
        }
    }, [fetchImages, initialImages]);

    return {
        // State
        images,
        loading,
        uploading,
        error,
        uploadProgress,

        // Methods
        uploadImages,
        deleteImage,
        refresh,
        clearError,

        // Computed values
        imageCount: images.length,
        canUploadMore: images.length < 5, // MAX_FILES_PER_JOB (matching backend limit)
        hasImages: images.length > 0
    };
}
