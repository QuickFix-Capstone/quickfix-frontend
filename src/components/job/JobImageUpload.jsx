import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../UI/Button';
import { validateImageFiles, formatFileSize, createFilePreview, revokeFilePreview } from '../../utils/imageValidation';
import { MAX_FILES_PER_JOB } from '../../utils/imageValidation';

/**
 * Simple job image upload component for PostJob form
 * Allows image selection during job creation, actual upload happens after job is posted
 */
export default function JobImageUpload({
    onFilesSelected,
    disabled = false,
    className = ''
}) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setError(null);

        // Validate files
        const validation = validateImageFiles(files, selectedFiles.length);

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

        // Notify parent component
        if (onFilesSelected) {
            onFilesSelected(updatedFiles);
        }

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

        // Notify parent component
        if (onFilesSelected) {
            onFilesSelected(updatedFiles);
        }
    };

    const handleClearAll = () => {
        // Revoke all preview URLs
        previews.forEach(preview => revokeFilePreview(preview.url));

        setSelectedFiles([]);
        setPreviews([]);
        setError(null);

        // Notify parent component
        if (onFilesSelected) {
            onFilesSelected([]);
        }
    };

    const canAddMore = selectedFiles.length < MAX_FILES_PER_JOB;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <ImageIcon className="h-4 w-4" />
                    Job Images (Optional)
                </label>
                {selectedFiles.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-sm text-neutral-600 hover:text-neutral-900"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
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
            {canAddMore && (
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-neutral-400 transition-colors">
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleFileSelect}
                        disabled={disabled || !canAddMore}
                        className="hidden"
                        id="job-image-upload"
                    />
                    <label
                        htmlFor="job-image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        <Upload className="h-8 w-8 text-neutral-400" />
                        <div>
                            <p className="text-sm font-medium text-neutral-700">
                                Click to upload images
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                JPEG, PNG, or WebP • Max 5MB each • Up to {MAX_FILES_PER_JOB} images
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* Preview Grid */}
            {previews.length > 0 && (
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
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
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
            )}

            {/* File Count Info */}
            {selectedFiles.length > 0 && (
                <div className="text-sm text-neutral-600">
                    {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                    {selectedFiles.length < MAX_FILES_PER_JOB && (
                        <span className="text-neutral-500">
                            {' '}• You can add {MAX_FILES_PER_JOB - selectedFiles.length} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
