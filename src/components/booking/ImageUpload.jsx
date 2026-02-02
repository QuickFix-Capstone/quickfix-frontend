import React, { useState, useRef } from 'react';
import { Upload, Plus, AlertCircle, CheckCircle, X } from 'lucide-react';
import Button from '../UI/Button';
import FileInput from '../UI/FileInput';
import { useBookingImages } from '../../hooks/useBookingImages';

export default function ImageUpload({
    bookingId,
    onUploadComplete,
    onUploadStart,
    disabled = false,
    className = '',
    showProgress = true,
    allowMultiple = true,
    maxFiles = 10
}) {
    const {
        images,
        uploading,
        uploadProgress,
        error,
        uploadImages,
        clearError,
        imageCount,
        canUploadMore
    } = useBookingImages(bookingId);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadDescription, setUploadDescription] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);

    const handleFilesSelected = (files) => {
        setSelectedFiles(files);
        if (files.length > 0 && !showUploadForm) {
            setShowUploadForm(true);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        onUploadStart?.();

        try {
            const result = await uploadImages(selectedFiles, {
                description: uploadDescription.trim()
            });

            if (result.success) {
                // Clear form
                setSelectedFiles([]);
                setUploadDescription('');
                setShowUploadForm(false);
                
                onUploadComplete?.(result);
            }
        } catch (err) {
            console.error('Upload failed:', err);
        }
    };

    const handleCancel = () => {
        setSelectedFiles([]);
        setUploadDescription('');
        setShowUploadForm(false);
        clearError();
    };

    const remainingSlots = maxFiles - imageCount;
    const canUpload = canUploadMore && selectedFiles.length > 0 && !uploading;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Upload Status */}
            {imageCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">
                                {imageCount} image{imageCount !== 1 ? 's' : ''} uploaded
                            </p>
                            <p className="text-xs text-blue-600">
                                {remainingSlots > 0 
                                    ? `${remainingSlots} more can be added`
                                    : 'Maximum images reached'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Upload Error</p>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-400 hover:text-red-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* File Input */}
            <FileInput
                onFilesSelected={handleFilesSelected}
                multiple={allowMultiple}
                disabled={disabled || !canUploadMore || uploading}
                existingCount={imageCount}
                maxFiles={maxFiles}
                showPreview={true}
            />

            {/* Upload Form */}
            {showUploadForm && selectedFiles.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                            Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
                        </h3>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={uploading}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            placeholder="Add a description for these images..."
                            disabled={uploading}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This description will be applied to all selected images
                        </p>
                    </div>

                    {/* Upload Progress */}
                    {uploading && showProgress && Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
                            <div className="space-y-2">
                                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                                    <div key={fileId} className="bg-white rounded p-3 border">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="truncate flex-1 mr-2">
                                                {fileId.split('-')[0]}
                                            </span>
                                            <span className={`font-medium ${
                                                progress.status === 'completed' ? 'text-green-600' :
                                                progress.status === 'error' ? 'text-red-600' :
                                                'text-blue-600'
                                            }`}>
                                                {progress.status === 'completed' ? 'Complete' :
                                                 progress.status === 'error' ? 'Failed' :
                                                 `${progress.progress}%`}
                                            </span>
                                        </div>
                                        
                                        {progress.status === 'uploading' && (
                                            <div className="mt-2 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        
                                        {progress.error && (
                                            <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            onClick={handleUpload}
                            disabled={!canUpload}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {uploading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Uploading...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Images
                                </div>
                            )}
                        </Button>
                        
                        <Button
                            onClick={handleCancel}
                            variant="outline"
                            disabled={uploading}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Quick Upload Button (when no files selected) */}
            {!showUploadForm && canUploadMore && !uploading && (
                <div className="text-center">
                    <Button
                        onClick={() => document.querySelector('input[type="file"]')?.click()}
                        variant="outline"
                        className="inline-flex items-center"
                        disabled={disabled}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Images
                    </Button>
                </div>
            )}
        </div>
    );
}