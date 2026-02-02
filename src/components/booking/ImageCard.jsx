import React, { useState } from 'react';
import { Trash2, Eye, Download, Edit3, Calendar, FileText } from 'lucide-react';
import Button from '../UI/Button';
import { formatFileSize } from '../../utils/imageValidation';

export default function ImageCard({
    image,
    onDelete,
    onView,
    onEdit,
    showActions = true,
    showDetails = true,
    className = '',
    size = 'medium' // 'small', 'medium', 'large'
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleDelete = async () => {
        if (!onDelete) return;
        
        const confirmed = window.confirm(
            `Are you sure you want to delete "${image.file_name || 'this image'}"?`
        );
        
        if (confirmed) {
            setIsDeleting(true);
            try {
                await onDelete(image.image_id);
            } catch (error) {
                console.error('Failed to delete image:', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleView = () => {
        onView?.(image);
    };

    const handleEdit = () => {
        onEdit?.(image);
    };

    const handleDownload = () => {
        if (image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = image.file_name || 'image';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const sizeClasses = {
        small: 'w-24 h-24',
        medium: 'w-32 h-32 md:w-40 md:h-40',
        large: 'w-48 h-48 md:w-56 md:h-56'
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
            {/* Image Container */}
            <div className={`relative ${sizeClasses[size]} bg-gray-100 overflow-hidden group`}>
                {!imageError ? (
                    <img
                        src={image.url}
                        alt={image.description || image.file_name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={handleView}
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <FileText className="h-8 w-8" />
                    </div>
                )}
                
                {/* Hover Overlay */}
                {showActions && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <Button
                            onClick={handleView}
                            className="p-2 bg-white text-gray-700 hover:bg-gray-100"
                            title="View full size"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                            onClick={handleDownload}
                            className="p-2 bg-white text-gray-700 hover:bg-gray-100"
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        
                        {onEdit && (
                            <Button
                                onClick={handleEdit}
                                className="p-2 bg-white text-gray-700 hover:bg-gray-100"
                                title="Edit details"
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        )}
                        
                        {onDelete && (
                            <Button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                                title="Delete image"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
                
                {/* Display Order Badge */}
                {image.image_order !== undefined && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        #{image.image_order}
                    </div>
                )}
            </div>

            {/* Image Details */}
            {showDetails && (
                <div className="p-3 space-y-2">
                    {/* File Name */}
                    <div>
                        <p className="text-sm font-medium text-gray-900 truncate" title={image.file_name}>
                            {image.file_name}
                        </p>
                        
                        {/* File Size */}
                        <p className="text-xs text-gray-500">
                            {formatFileSize(image.file_size)}
                        </p>
                    </div>

                    {/* Description */}
                    {image.description && (
                        <div className="text-xs text-gray-600">
                            <p className="line-clamp-2" title={image.description}>
                                {image.description}
                            </p>
                        </div>
                    )}

                    {/* Upload Date */}
                    {image.created_at && (
                        <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(image.created_at)}
                        </div>
                    )}

                    {/* Action Buttons (Mobile) */}
                    {showActions && size === 'small' && (
                        <div className="flex space-x-1 pt-2">
                            <Button
                                onClick={handleView}
                                variant="outline"
                                className="flex-1 text-xs py-1 px-2 h-auto"
                            >
                                View
                            </Button>
                            
                            {onDelete && (
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-xs py-1 px-2 h-auto bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                                >
                                    {isDeleting ? '...' : 'Delete'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}