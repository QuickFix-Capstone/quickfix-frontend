import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, Edit3, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import Button from '../UI/Button';
import { formatFileSize } from '../../utils/imageValidation';

export default function ImageModal({
    image,
    images = [],
    onClose,
    onDelete,
    onEdit,
    onNavigate
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentImage, setCurrentImage] = useState(image);
    const [isDeleting, setIsDeleting] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [imageError, setImageError] = useState(false);

    // Find current image index
    useEffect(() => {
        const index = images.findIndex(img => img.image_id === image.image_id);
        setCurrentIndex(index >= 0 ? index : 0);
        setCurrentImage(image);
    }, [image, images]);

    // Update current image when index changes
    useEffect(() => {
        if (images[currentIndex]) {
            setCurrentImage(images[currentIndex]);
            setZoom(1);
            setRotation(0);
            setImageError(false);
        }
    }, [currentIndex, images]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
                case 'r':
                case 'R':
                    handleRotate();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length]);

    const handlePrevious = () => {
        if (images.length > 1) {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
            setCurrentIndex(newIndex);
            onNavigate?.(images[newIndex]);
        }
    };

    const handleNext = () => {
        if (images.length > 1) {
            const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
            setCurrentIndex(newIndex);
            onNavigate?.(images[newIndex]);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !currentImage) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${currentImage.file_name}"?`
        );

        if (confirmed) {
            setIsDeleting(true);
            try {
                await onDelete(currentImage.image_id);
                
                // Navigate to next image or close modal if no more images
                if (images.length > 1) {
                    const nextIndex = currentIndex < images.length - 1 ? currentIndex : currentIndex - 1;
                    if (images[nextIndex] && images[nextIndex].image_id !== currentImage.image_id) {
                        setCurrentIndex(nextIndex);
                    } else {
                        onClose();
                    }
                } else {
                    onClose();
                }
            } catch (error) {
                console.error('Failed to delete image:', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleDownload = () => {
        if (currentImage?.url) {
            const link = document.createElement('a');
            link.href = currentImage.url;
            link.download = currentImage.file_name || 'image';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.25));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const resetView = () => {
        setZoom(1);
        setRotation(0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!currentImage) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
            {/* Modal Content */}
            <div className="relative w-full h-full flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-medium truncate">
                                {currentImage.file_name}
                            </h2>
                            <p className="text-sm text-gray-300">
                                {images.length > 1 && `${currentIndex + 1} of ${images.length} • `}
                                {formatFileSize(currentImage.file_size)}
                                {currentImage.uploaded_at && ` • ${formatDate(currentImage.uploaded_at)}`}
                            </p>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="ml-4 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-colors"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-colors"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}

                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-20 overflow-hidden">
                    {!imageError ? (
                        <img
                            src={currentImage.url}
                            alt={currentImage.description || currentImage.file_name}
                            className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing"
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            }}
                            onError={() => setImageError(true)}
                            draggable={false}
                        />
                    ) : (
                        <div className="text-white text-center">
                            <p className="text-xl mb-2">Failed to load image</p>
                            <p className="text-gray-400">The image may have been moved or deleted</p>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center justify-between">
                        {/* Image Info */}
                        <div className="text-white text-sm">
                            {currentImage.description && (
                                <p className="mb-1">{currentImage.description}</p>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-2">
                            {/* Zoom Controls */}
                            <div className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-lg p-1">
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 0.25}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </button>
                                
                                <span className="text-white text-sm px-2 min-w-[3rem] text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 3}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Rotate */}
                            <button
                                onClick={handleRotate}
                                className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg"
                                title="Rotate (R)"
                            >
                                <RotateCw className="h-4 w-4" />
                            </button>

                            {/* Reset View */}
                            {(zoom !== 1 || rotation !== 0) && (
                                <button
                                    onClick={resetView}
                                    className="px-3 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg text-sm"
                                >
                                    Reset
                                </button>
                            )}

                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg"
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </button>

                            {/* Edit */}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(currentImage)}
                                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg"
                                    title="Edit"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            )}

                            {/* Delete */}
                            {onDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="p-2 bg-red-600 bg-opacity-80 hover:bg-opacity-100 text-white rounded-lg disabled:opacity-50"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Help */}
                <div className="absolute top-20 right-4 bg-black bg-opacity-50 text-white text-xs p-3 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                    <p className="font-medium mb-2">Keyboard Shortcuts:</p>
                    <div className="space-y-1">
                        <p>← → Navigate</p>
                        <p>+ - Zoom</p>
                        <p>R Rotate</p>
                        <p>Esc Close</p>
                    </div>
                </div>
            </div>
        </div>
    );
}