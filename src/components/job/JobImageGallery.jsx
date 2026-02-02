import React, { useState } from 'react';
import { Image as ImageIcon, X, Trash2, Eye, RefreshCw } from 'lucide-react';
import Button from '../UI/Button';
import { useJobImages } from '../../hooks/useJobImages';

/**
 * Job Image Gallery Component
 * Displays images for a job with view and delete functionality
 */
export default function JobImageGallery({
    jobId,
    initialImages = null,
    allowDelete = true,
    className = ''
}) {
    const {
        images,
        loading,
        error,
        deleteImage,
        refresh,
        hasImages
    } = useJobImages(jobId, initialImages);

    const [selectedImage, setSelectedImage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const handleImageView = (image) => {
        setSelectedImage(image);
        setShowModal(true);
    };

    const handleImageDelete = async (imageId) => {
        if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            return;
        }

        setDeleting(imageId);
        try {
            const result = await deleteImage(imageId);
            if (result.success) {
                // Image removed from state by the hook
            }
        } catch (err) {
            console.error('Failed to delete image:', err);
            alert('Failed to delete image. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedImage(null);
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-500">Loading images...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={refresh} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasImages) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="bg-neutral-50 rounded-lg p-8">
                    <ImageIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        No Images Yet
                    </h3>
                    <p className="text-neutral-500">
                        No images have been uploaded for this job
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">
                    Images ({images.length})
                </h3>
                <Button
                    onClick={refresh}
                    variant="outline"
                    className="p-2"
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                    <div
                        key={image.image_id}
                        className="relative group border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 hover:shadow-md transition-shadow"
                    >
                        {/* Image */}
                        <div className="aspect-square">
                            <img
                                src={image.url}
                                alt={image.description || `Job image ${image.image_order}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleImageView(image)}
                            />
                        </div>

                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                                onClick={() => handleImageView(image)}
                                className="bg-white text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"
                                title="View image"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            {allowDelete && (
                                <button
                                    onClick={() => handleImageDelete(image.image_id)}
                                    disabled={deleting === image.image_id}
                                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                                    title="Delete image"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Image Info */}
                        {image.description && (
                            <div className="p-2 bg-white border-t border-neutral-200">
                                <p className="text-xs text-neutral-700 truncate" title={image.description}>
                                    {image.description}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Image Modal */}
            {showModal && selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
                    <div className="relative max-w-5xl max-h-[90vh] w-full bg-white rounded-lg overflow-hidden">
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 bg-white text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors shadow-lg"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Image */}
                        <div className="flex items-center justify-center p-8">
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.description || 'Job image'}
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                        </div>

                        {/* Image Details */}
                        <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    {selectedImage.description && (
                                        <p className="text-sm font-medium text-neutral-900 mb-1">
                                            {selectedImage.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-neutral-500">
                                        Uploaded {new Date(selectedImage.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {allowDelete && (
                                    <Button
                                        onClick={() => {
                                            closeModal();
                                            handleImageDelete(selectedImage.image_id);
                                        }}
                                        variant="outline"
                                        className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
