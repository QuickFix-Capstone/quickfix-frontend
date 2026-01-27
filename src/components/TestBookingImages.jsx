import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useBookingImages } from '../hooks/useBookingImages';
import { validateImageFile, formatFileSize } from '../utils/imageValidation';
import Button from './UI/Button';
import Card from './UI/Card';

export default function TestBookingImages() {
    const auth = useAuth();
    const [testBookingId, setTestBookingId] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    
    const {
        images,
        loading,
        uploading,
        error,
        uploadProgress,
        uploadImages,
        deleteImage,
        refresh,
        clearError,
        imageCount,
        canUploadMore,
        hasImages
    } = useBookingImages(testBookingId);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        
        const result = await uploadImages(selectedFiles, {
            description: 'Test upload from component'
        });
        
        console.log('Upload result:', result);
        setSelectedFiles([]);
        
        // Clear file input
        const fileInput = document.getElementById('test-file-input');
        if (fileInput) fileInput.value = '';
    };

    const handleDelete = async (imageId) => {
        if (confirm('Delete this image?')) {
            const result = await deleteImage(imageId);
            console.log('Delete result:', result);
        }
    };

    if (!auth.isAuthenticated) {
        return (
            <Card className="p-6 m-4">
                <p className="text-red-600">Please log in to test booking images.</p>
            </Card>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Card className="p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Test Booking Images API</h2>
                
                {/* Booking ID Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Test Booking ID:
                    </label>
                    <input
                        type="text"
                        value={testBookingId}
                        onChange={(e) => setTestBookingId(e.target.value)}
                        placeholder="Enter a booking ID to test"
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                {/* Status Display */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p><strong>Status:</strong></p>
                    <p>Images: {imageCount}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                    <p>Uploading: {uploading ? 'Yes' : 'No'}</p>
                    <p>Can Upload More: {canUploadMore ? 'Yes' : 'No'}</p>
                    <p>Has Images: {hasImages ? 'Yes' : 'No'}</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-600">{error}</p>
                        <Button onClick={clearError} className="mt-2 text-sm">
                            Clear Error
                        </Button>
                    </div>
                )}

                {/* File Upload */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Select Images to Upload:
                    </label>
                    <input
                        id="test-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                        <p className="font-medium mb-2">Selected Files:</p>
                        {selectedFiles.map((file, index) => {
                            const validation = validateImageFile(file);
                            return (
                                <div key={index} className="text-sm mb-1">
                                    <span className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
                                        {file.name} ({formatFileSize(file.size)})
                                        {!validation.isValid && ` - ${validation.errors.join(', ')}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded">
                        <p className="font-medium mb-2">Upload Progress:</p>
                        {Object.entries(uploadProgress).map(([fileId, progress]) => (
                            <div key={fileId} className="text-sm mb-1">
                                {fileId}: {progress.status} ({progress.progress}%)
                                {progress.error && <span className="text-red-600"> - {progress.error}</span>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6">
                    <Button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading || !testBookingId}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {uploading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                    
                    <Button
                        onClick={refresh}
                        disabled={loading || !testBookingId}
                        variant="outline"
                    >
                        {loading ? 'Loading...' : 'Refresh Images'}
                    </Button>
                </div>
            </Card>

            {/* Images Display */}
            {testBookingId && (
                <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">
                        Images for Booking: {testBookingId}
                    </h3>
                    
                    {loading ? (
                        <p>Loading images...</p>
                    ) : images.length === 0 ? (
                        <p className="text-gray-500">No images found for this booking.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((image) => (
                                <div key={image.image_id} className="border rounded p-3">
                                    <div className="mb-2">
                                        <img
                                            src={image.image_url}
                                            alt={image.description || image.file_name}
                                            className="w-full h-32 object-cover rounded"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA0OEg5M1Y1NEg4N1Y0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+CjwvcGF0aD4KPC9zdmc+';
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm font-medium">{image.file_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(image.file_size)}
                                    </p>
                                    {image.description && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {image.description}
                                        </p>
                                    )}
                                    <Button
                                        onClick={() => handleDelete(image.image_id)}
                                        className="mt-2 text-xs bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}