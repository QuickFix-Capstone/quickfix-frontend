import React, { useState } from 'react';
import { Camera, Upload, Grid } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';

/**
 * Complete booking images section component
 * Ready to integrate into booking detail pages
 */
export default function BookingImagesSection({
    bookingId,
    initialImages = null,
    title = "Booking Images",
    showUpload = true,
    allowDelete = true,
    allowEdit = false,
    className = '',
    cardSize = 'medium',
    maxFiles = 10
}) {
    const [activeTab, setActiveTab] = useState('gallery');

    if (!bookingId) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="text-center text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No booking selected</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`${className}`}>
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Camera className="h-5 w-5 mr-2" />
                        {title}
                    </h3>

                    {showUpload && (
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => setActiveTab('gallery')}
                                variant={activeTab === 'gallery' ? 'default' : 'outline'}
                                className="text-sm px-3 py-1 h-auto"
                            >
                                <Grid className="h-4 w-4 mr-1" />
                                Gallery
                            </Button>
                            <Button
                                onClick={() => setActiveTab('upload')}
                                variant={activeTab === 'upload' ? 'default' : 'outline'}
                                className="text-sm px-3 py-1 h-auto"
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                Upload
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'gallery' ? (
                    <ImageGallery
                        bookingId={bookingId}
                        initialImages={initialImages}
                        showUpload={false}
                        showSearch={true}
                        showSort={true}
                        allowDelete={allowDelete}
                        allowEdit={allowEdit}
                        cardSize={cardSize}
                        columns={{ sm: 2, md: 3, lg: 4 }}
                    />
                ) : (
                    <ImageUpload
                        bookingId={bookingId}
                        onUploadComplete={() => setActiveTab('gallery')}
                        allowMultiple={true}
                        maxFiles={maxFiles}
                    />
                )}
            </div>
        </Card>
    );
}