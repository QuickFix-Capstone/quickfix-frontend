import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useBookingImages } from '../hooks/useBookingImages';
import { validateImageFile, formatFileSize } from '../utils/imageValidation';
import { API_BASE, BOOKING_IMAGES_API_BASE } from '../api/config';
import Button from './UI/Button';
import Card from './UI/Card';
import ImageUpload from './booking/ImageUpload';
import ImageGallery from './booking/ImageGallery';
import ApiTestPanel from './ApiTestPanel';
import DatabaseDebugPanel from './DatabaseDebugPanel';

export default function TestBookingImages() {
    const auth = useAuth();
    const [testBookingId, setTestBookingId] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    
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

    const handleUploadComplete = (result) => {
        console.log('Upload completed:', result);
    };

    const handleUploadStart = () => {
        console.log('Upload started');
    };

    if (!auth.isAuthenticated) {
        return (
            <Card className="p-6 m-4">
                <p className="text-red-600">Please log in to test booking images.</p>
            </Card>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Test Booking Images System</h2>
                
                {/* Quick Test for Booking 81 */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Quick Test - Booking 81</h3>
                    <p className="text-sm text-blue-600 mb-3">
                        Test the specific booking that should have images
                    </p>
                    <Button
                        onClick={() => setTestBookingId('81')}
                        className="bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                        Test Booking 81
                    </Button>
                </div>
                
                {/* Booking ID Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Test Booking ID:
                    </label>
                    <input
                        type="text"
                        value={testBookingId}
                        onChange={(e) => setTestBookingId(e.target.value)}
                        placeholder="Enter a booking ID to test (e.g., 75, 123, etc.)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Enter a numeric booking ID from your existing bookings. You can find booking IDs in the "My Bookings" page.
                        <br />
                        <a 
                            href="/customer/bookings" 
                            className="text-blue-600 hover:text-blue-800 underline"
                            target="_blank"
                        >
                            Open My Bookings in new tab →
                        </a>
                    </p>
                </div>

                {/* Quick Stats */}
                {testBookingId && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{imageCount}</p>
                            <p className="text-sm text-gray-600">Images</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{canUploadMore ? 'Yes' : 'No'}</p>
                            <p className="text-sm text-gray-600">Can Upload</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{uploading ? 'Yes' : 'No'}</p>
                            <p className="text-sm text-gray-600">Uploading</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{5 - imageCount}</p>
                            <p className="text-sm text-gray-600">Slots Left</p>
                        </div>
                    </div>
                )}

                {/* Toggle Advanced View */}
                <div className="mb-4 flex gap-2">
                    <Button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        variant="outline"
                        className="text-sm"
                    >
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Debug Info
                    </Button>
                    
                    <Button
                        onClick={async () => {
                            try {
                                // Test the booking images API base
                                const response = await fetch(`${BOOKING_IMAGES_API_BASE}/health`);
                                alert(`Booking Images API Health Check: ${response.ok ? 'OK' : 'Failed'} (${response.status})`);
                            } catch (e) {
                                alert(`Booking Images API Health Check Failed: ${e.message}`);
                            }
                        }}
                        variant="outline"
                        className="text-sm"
                    >
                        Test API Connection
                    </Button>
                </div>

                {/* Advanced Debug Info */}
                {showAdvanced && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium mb-2">Debug Information:</h3>
                        <div className="text-sm space-y-1 font-mono">
                            <p><strong>Booking ID:</strong> {testBookingId || 'Not set'}</p>
                            <p><strong>Auth Status:</strong> {auth.isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
                            <p><strong>User Email:</strong> {auth.user?.profile?.email || 'Not available'}</p>
                            <p><strong>Token Present:</strong> {(auth.user?.id_token || auth.user?.access_token) ? 'Yes' : 'No'}</p>
                            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                            <p><strong>Error:</strong> {error || 'None'}</p>
                            <p><strong>Upload Progress:</strong> {Object.keys(uploadProgress).length} active</p>
                            <p><strong>API Base:</strong> {BOOKING_IMAGES_API_BASE}</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* API Test Panel */}
            {testBookingId && (
                <ApiTestPanel bookingId={testBookingId} />
            )}

            {/* Database Debug Panel */}
            {testBookingId && (
                <DatabaseDebugPanel bookingId={testBookingId} />
            )}

            {/* Upload Section */}
            {testBookingId && (
                <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">Upload Images</h3>
                    <ImageUpload
                        bookingId={testBookingId}
                        onUploadComplete={handleUploadComplete}
                        onUploadStart={handleUploadStart}
                        allowMultiple={true}
                        maxFiles={5}
                    />
                </Card>
            )}

            {/* Gallery Section */}
            {testBookingId && (
                <Card className="p-6">
                    <ImageGallery
                        bookingId={testBookingId}
                        showUpload={false}
                        showSearch={true}
                        showSort={true}
                        allowDelete={true}
                        allowEdit={false}
                        cardSize="medium"
                        columns={{ sm: 2, md: 3, lg: 4 }}
                    />
                </Card>
            )}
        </div>
    );
}