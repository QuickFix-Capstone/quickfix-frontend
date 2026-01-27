import { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import {
    getBookingImages,
    uploadBookingImage,
    deleteBookingImage
} from '../api/bookingImages';
import { validateImageFiles } from '../utils/imageValidation';

/**
 * Custom hook for managing booking images
 * @param {string} bookingId - The booking ID
 * @returns {Object} Hook state and methods
 */
export function useBookingImages(bookingId) {
    const auth = useAuth();
    
    // State management
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});

    // Fetch images for the booking
    const fetchImages = useCallback(async () => {
        if (!bookingId || !auth.isAuthenticated) return;

        setLoading(true);
        setError(null);
        
        try {
            const fetchedImages = await getBookingImages(bookingId, auth);
            setImages(fetchedImages);
        } catch (err) {
            console.error('Failed to fetch images:', err);
            setError('Failed to load images. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [bookingId, auth]);

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
                
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { progress: 0, status: 'uploading' }
                }));

                try {
                    const uploadOptions = {
                        order: images.length + i,
                        description: options.description || '',
                        ...options
                    };

                    const result = await uploadBookingImage(bookingId, file, auth, uploadOptions);
                    
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
    }, [bookingId, auth, images.length]);

    // Delete an image
    const deleteImage = useCallback(async (imageId) => {
        if (!imageId) return;

        try {
            await deleteBookingImage(bookingId, imageId, auth);
            
            // Remove from state
            setImages(prev => prev.filter(img => img.image_id !== imageId));
            
            return { success: true };
        } catch (err) {
            console.error('Failed to delete image:', err);
            setError('Failed to delete image. Please try again.');
            return { success: false, error: err.message };
        }
    }, [bookingId, auth]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Refresh images
    const refresh = useCallback(() => {
        fetchImages();
    }, [fetchImages]);

    // Load images on mount and when bookingId changes
    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

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
        canUploadMore: images.length < 10, // MAX_FILES_PER_BOOKING
        hasImages: images.length > 0
    };
}