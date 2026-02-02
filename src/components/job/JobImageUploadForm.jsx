import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../UI/Button';
import { useJobImages } from '../../hooks/useJobImages';
import { validateImageFiles, formatFileSize, createFilePreview, revokeFilePreview, MAX_FILES_PER_JOB } from '../../utils/imageValidation';

/**
 * Job Image Upload Form Component
 * Allows uploading new images to an existing job
 */
export default function JobImageUploadForm({
    jobId,
    onUploadComplete,
    className = ''
}) {
    const {
        images,
        uploading,
        uploadImages,
        canUploadMore,
        imageCount
    } = useJobImages(jobId);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const remainingSlots = MAX_FILES_PER_JOB - imageCount;

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setError(null);
        setUploadSuccess(false);

        // Validate files considering existing images
        const validation = validateImageFiles(files, imageCount + selectedFiles.length);

        if (!validation.isValid) {
            setError(validation.errors.join(' '));
            return;
        }

        // Create previews for new files
        const newPreviews = validation.validFiles.map(file => ({
            file,
            url: createFilePreview(file),
            name: file.name,
            size: file.size
        }));

        const updatedFiles = [...selectedFiles, ...validation.validFiles];
        const updatedPreviews = [...previews, ...newPreviews];

        setSelectedFiles(updatedFiles);
        setPreviews(updatedPreviews);

        // Reset input
        e.target.value = '';
    };

    const handleRemoveFile = (index) => {
        // Revoke preview URL to free memory
        revokeFilePreview(previews[index].url);

        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);

        setSelectedFiles(updatedFiles);
        setPreviews(updatedPreviews);
    };

    const handleClearAll = () => {
        // Revoke all preview URLs
        previews.forEach(preview => revokeFilePreview(preview.url));

        setSelectedFiles([]);
        setPreviews([]);
        setError(null);
        setUploadSuccess(false);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image to upload');
            return;
        }

        setError(null);
        setUploadSuccess(false);

        try {
            const result = await uploadImages(selectedFiles);

            if (result.success) {
                // Clear selections
                previews.forEach(preview => revokeFilePreview(preview.url));
                setSelectedFiles([]);
                setPreviews([]);
                setUploadSuccess(true);

                // Notify parent component
                if (onUploadComplete) {
                    onUploadComplete(result);
                }

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setUploadSuccess(false);
                }, 3000);
            } else {
                setError(result.error || 'Failed to upload images. Please try again.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('An error occurred while uploading images. Please try again.');
        }
    };

    if (!canUploadMore && selectedFiles.length === 0) {
        return (
            <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center ${className}`}>
                <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Maximum Images Reached
                </h3>
                <p className="text-neutral-600">
                    This job already has {MAX_FILES_PER_JOB} images (the maximum allowed).
                    Delete some images to upload new ones.
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-neutral-900">
                        Upload New Images
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                        {remainingSlots > 0 ? (
                            `You can upload up to ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`
                        ) : (
                            'Maximum images reached'
                        )}
                    </p>
                </div>
                {selectedFiles.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClearAll}
                        disabled={uploading}
                        className="text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Success Message */}
            {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                            Images uploaded successfully!
                        </p>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* File Input */}
            {canUploadMore && (
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors">
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleFileSelect}
                        disabled={uploading || !canUploadMore}
                        className="hidden"
                        id="job-image-upload-form"
                    />
                    <label
                        htmlFor="job-image-upload-form"
                        className="cursor-pointer flex flex-col items-center gap-3"
                    >
                        <div className="bg-neutral-100 p-4 rounded-full">
                            <Upload className="h-8 w-8 text-neutral-600" />
                        </div>
                        <div>
                            <p className="text-base font-medium text-neutral-700">
                                Click to upload images
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">
                                JPEG, PNG, or WebP • Max 5MB each • Up to {remainingSlots} more images
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* Preview Grid */}
            {previews.length > 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {previews.map((preview, index) => (
                            <div
                                key={index}
                                className="relative group border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50"
                            >
                                {/* Image Preview */}
                                <div className="aspect-square">
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    disabled={uploading}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                {/* File Info */}
                                <div className="p-2 bg-white border-t border-neutral-200">
                                    <p className="text-xs text-neutral-700 truncate" title={preview.name}>
                                        {preview.name}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {formatFileSize(preview.size)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-neutral-600">
                            {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleClearAll}
                                disabled={uploading}
                                variant="outline"
                            >
                                Clear All
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={uploading || selectedFiles.length === 0}
                                className="bg-neutral-900 hover:bg-neutral-800"
                            >
                                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
