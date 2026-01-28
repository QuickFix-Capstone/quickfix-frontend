import React, { useState } from 'react';
import { Grid, List, Search, Filter, SortAsc, SortDesc, RefreshCw, Image as ImageIcon } from 'lucide-react';
import Button from '../UI/Button';
import ImageCard from './ImageCard';
import ImageModal from './ImageModal';
import { useBookingImages } from '../../hooks/useBookingImages';

export default function ImageGallery({
    bookingId,
    initialImages = null,
    showUpload = false,
    showSearch = true,
    showSort = true,
    allowDelete = true,
    allowEdit = false,
    className = '',
    cardSize = 'medium',
    columns = { sm: 2, md: 3, lg: 4 }
}) {
    const {
        images,
        loading,
        error,
        deleteImage,
        refresh,
        clearError,
        hasImages
    } = useBookingImages(bookingId, initialImages);

    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size' | 'order'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
    const [selectedImage, setSelectedImage] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Filter and sort images
    const filteredAndSortedImages = React.useMemo(() => {
        let filtered = images;

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(image =>
                image.file_name?.toLowerCase().includes(term) ||
                image.description?.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = (a.file_name || '').localeCompare(b.file_name || '');
                    break;
                case 'size':
                    comparison = (a.file_size || 0) - (b.file_size || 0);
                    break;
                case 'order':
                    comparison = (a.image_order || 0) - (b.image_order || 0);
                    break;
                case 'date':
                default:
                    comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [images, searchTerm, sortBy, sortOrder]);

    const handleImageView = (image) => {
        setSelectedImage(image);
        setShowModal(true);
    };

    const handleImageDelete = async (imageId) => {
        try {
            await deleteImage(imageId);
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    const handleImageEdit = (image) => {
        // TODO: Implement edit functionality
        console.log('Edit image:', image);
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const gridColumns = {
        sm: `grid-cols-${columns.sm}`,
        md: `md:grid-cols-${columns.md}`,
        lg: `lg:grid-cols-${columns.lg}`
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading images...</p>
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
                <div className="bg-gray-50 rounded-lg p-8">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Images Yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {showUpload
                            ? 'Upload some images to get started'
                            : 'No images have been uploaded for this booking'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Images ({filteredAndSortedImages.length})
                    </h3>

                    {/* View Mode Toggle */}
                    <div className="flex border border-gray-300 rounded-md">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Search */}
                    {showSearch && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search images..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Sort Controls */}
                    {showSort && (
                        <div className="flex items-center space-x-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="date">Date</option>
                                <option value="name">Name</option>
                                <option value="size">Size</option>
                                <option value="order">Order</option>
                            </select>

                            <button
                                onClick={toggleSortOrder}
                                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortOrder === 'asc' ?
                                    <SortAsc className="h-4 w-4" /> :
                                    <SortDesc className="h-4 w-4" />
                                }
                            </button>
                        </div>
                    )}

                    {/* Refresh Button */}
                    <Button
                        onClick={refresh}
                        variant="outline"
                        className="p-2"
                        title="Refresh"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Images Grid/List */}
            {viewMode === 'grid' ? (
                <div className={`grid gap-4 ${gridColumns.sm} ${gridColumns.md} ${gridColumns.lg}`}>
                    {filteredAndSortedImages.map((image) => (
                        <ImageCard
                            key={image.image_id}
                            image={image}
                            onView={handleImageView}
                            onDelete={allowDelete ? handleImageDelete : undefined}
                            onEdit={allowEdit ? handleImageEdit : undefined}
                            size={cardSize}
                            showActions={true}
                            showDetails={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAndSortedImages.map((image) => (
                        <div key={image.image_id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={image.url}
                                        alt={image.description || image.file_name}
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => handleImageView(image)}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {image.file_name}
                                    </p>
                                    {image.description && (
                                        <p className="text-sm text-gray-600 truncate">
                                            {image.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {new Date(image.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={() => handleImageView(image)}
                                        variant="outline"
                                        className="text-xs px-3 py-1"
                                    >
                                        View
                                    </Button>

                                    {allowDelete && (
                                        <Button
                                            onClick={() => handleImageDelete(image.image_id)}
                                            className="text-xs px-3 py-1 bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {filteredAndSortedImages.length === 0 && searchTerm && (
                <div className="text-center py-8">
                    <p className="text-gray-500">
                        No images found matching "{searchTerm}"
                    </p>
                    <Button
                        onClick={() => setSearchTerm('')}
                        variant="outline"
                        className="mt-2"
                    >
                        Clear Search
                    </Button>
                </div>
            )}

            {/* Image Modal */}
            {showModal && selectedImage && (
                <ImageModal
                    image={selectedImage}
                    images={filteredAndSortedImages}
                    onClose={() => setShowModal(false)}
                    onDelete={allowDelete ? handleImageDelete : undefined}
                    onEdit={allowEdit ? handleImageEdit : undefined}
                />
            )}
        </div>
    );
}