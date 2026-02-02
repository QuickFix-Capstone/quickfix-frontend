import React, { useState } from 'react';
import { Camera, Upload, Grid } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import JobImageGallery from './JobImageGallery';
import JobImageUploadForm from './JobImageUploadForm';

/**
 * Complete Job Images Section Component
 * Combines gallery and upload functionality with tab switching
 */
export default function JobImagesSection({
    jobId,
    initialImages = null,
    title = "Job Images",
    showUpload = true,
    allowDelete = true,
    className = ''
}) {
    const [activeTab, setActiveTab] = useState('gallery');

    if (!jobId) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="text-center text-neutral-500">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
                    <p>No job selected</p>
                </div>
            </Card>
        );
    }

    const handleUploadComplete = (result) => {
        // Switch to gallery tab after successful upload
        setActiveTab('gallery');
    };

    return (
        <Card className={className}>
            {/* Header */}
            <div className="border-b border-neutral-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900 flex items-center">
                        <Camera className="h-5 w-5 mr-2" />
                        {title}
                    </h3>

                    {showUpload && (
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => setActiveTab('gallery')}
                                variant={activeTab === 'gallery' ? 'default' : 'outline'}
                                className="text-sm px-3 py-1.5 h-auto"
                            >
                                <Grid className="h-4 w-4 mr-1.5" />
                                Gallery
                            </Button>
                            <Button
                                onClick={() => setActiveTab('upload')}
                                variant={activeTab === 'upload' ? 'default' : 'outline'}
                                className="text-sm px-3 py-1.5 h-auto"
                            >
                                <Upload className="h-4 w-4 mr-1.5" />
                                Upload
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'gallery' ? (
                    <JobImageGallery
                        jobId={jobId}
                        initialImages={initialImages}
                        allowDelete={allowDelete}
                    />
                ) : (
                    <JobImageUploadForm
                        jobId={jobId}
                        onUploadComplete={handleUploadComplete}
                    />
                )}
            </div>
        </Card>
    );
}
