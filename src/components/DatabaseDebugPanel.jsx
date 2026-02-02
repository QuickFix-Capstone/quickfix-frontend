import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { BOOKING_IMAGES_API_BASE } from '../api/config';
import Button from './UI/Button';
import Card from './UI/Card';

export default function DatabaseDebugPanel({ bookingId }) {
    const auth = useAuth();
    const [debugResults, setDebugResults] = useState([]);
    const [testing, setTesting] = useState(false);

    const addResult = (test, status, message, details = null) => {
        setDebugResults(prev => [...prev, {
            test,
            status,
            message,
            details,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const clearResults = () => {
        setDebugResults([]);
    };

    const debugImageStorage = async () => {
        if (!bookingId) {
            addResult('Validation', 'error', 'No booking ID provided');
            return;
        }

        setTesting(true);
        clearResults();

        const token = auth.user?.id_token || auth.user?.access_token;
        if (!token) {
            addResult('Authentication', 'error', 'No auth token available');
            setTesting(false);
            return;
        }

        try {
            // Test 1: Check if images exist in database
            addResult('Database Check', 'info', `Checking images for booking ${bookingId}...`);
            
            const response = await fetch(`${BOOKING_IMAGES_API_BASE}/bookings/${bookingId}/images`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            addResult('HTTP Status', response.ok ? 'success' : 'error', `${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                addResult('Raw Response', 'info', 'Full API response', data);

                // Analyze the response structure
                if (data.images && Array.isArray(data.images)) {
                    addResult('Images Found', 'success', `${data.images.length} images in database`);
                    
                    data.images.forEach((image, index) => {
                        addResult(`Image ${index + 1} Analysis`, 'info', 'Database record details', {
                            image_id: image.image_id,
                            image_key: image.image_key,
                            file_name: image.file_name,
                            file_size: image.file_size,
                            content_type: image.content_type,
                            image_order: image.image_order,
                            description: image.description,
                            created_at: image.created_at,
                            url: image.url,
                            url_present: !!image.url,
                            url_length: image.url ? image.url.length : 0
                        });

                        // Check if URL looks like a presigned URL
                        if (image.url) {
                            const isPresignedUrl = image.url.includes('amazonaws.com') && image.url.includes('Signature');
                            addResult(`Image ${index + 1} URL Check`, isPresignedUrl ? 'success' : 'warning', 
                                isPresignedUrl ? 'Valid presigned URL format' : 'URL format may be incorrect',
                                { url_preview: image.url.substring(0, 100) + '...' }
                            );
                        } else {
                            addResult(`Image ${index + 1} URL Check`, 'error', 'No URL field in response');
                        }
                    });
                } else if (Array.isArray(data)) {
                    addResult('Images Found', 'success', `${data.length} images (direct array format)`);
                } else {
                    addResult('Images Found', 'warning', 'Unexpected response format', data);
                }
            } else {
                const errorText = await response.text();
                addResult('API Error', 'error', `Failed to fetch images: ${errorText}`);
            }

        } catch (error) {
            addResult('Network Error', 'error', `Request failed: ${error.message}`, {
                error_name: error.name,
                error_stack: error.stack
            });
        }

        setTesting(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-600 bg-green-50 border-green-200';
            case 'error': return 'text-red-600 bg-red-50 border-red-200';
            case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Database Debug Panel</h3>
                <div className="space-x-2">
                    <Button
                        onClick={debugImageStorage}
                        disabled={testing || !bookingId}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {testing ? 'Debugging...' : 'Debug Database'}
                    </Button>
                    <Button
                        onClick={clearResults}
                        variant="outline"
                        disabled={debugResults.length === 0}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {!bookingId && (
                <div className="text-center py-4 text-gray-500">
                    <p>Enter a booking ID to debug image storage</p>
                </div>
            )}

            {debugResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {debugResults.map((result, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded border text-sm ${getStatusColor(result.status)}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{result.test}</span>
                                <span className="text-xs opacity-75">{result.timestamp}</span>
                            </div>
                            <p className="mt-1">{result.message}</p>
                            {result.details && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-xs opacity-75">
                                        Show details
                                    </summary>
                                    <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {debugResults.length === 0 && bookingId && (
                <div className="text-center py-8 text-gray-500">
                    <p>Click "Debug Database" to analyze image storage for booking {bookingId}</p>
                </div>
            )}
        </Card>
    );
}