import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { BOOKING_IMAGES_API_BASE } from '../api/config';
import Button from './UI/Button';
import Card from './UI/Card';

export default function ApiTestPanel({ bookingId }) {
    const auth = useAuth();
    const [testResults, setTestResults] = useState([]);
    const [testing, setTesting] = useState(false);

    const addResult = (test, status, message, details = null) => {
        setTestResults(prev => [...prev, {
            test,
            status,
            message,
            details,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const clearResults = () => {
        setTestResults([]);
    };

    const testApiConnectivity = async () => {
        setTesting(true);
        clearResults();

        // Test 1: Check authentication
        const token = auth.user?.id_token || auth.user?.access_token;
        if (!token) {
            addResult('Authentication', 'error', 'No authentication token available');
            setTesting(false);
            return;
        }
        addResult('Authentication', 'success', 'Token available', { tokenLength: token.length });

        // Test 2: Check booking ID
        if (!bookingId) {
            addResult('Booking ID', 'error', 'No booking ID provided');
            setTesting(false);
            return;
        }
        addResult('Booking ID', 'success', `Using booking ID: ${bookingId}`);

        // Test 3: Test API endpoint
        const apiUrl = `${BOOKING_IMAGES_API_BASE}/bookings/${bookingId}/images`;
        addResult('API URL', 'info', apiUrl);

        try {
            // Test basic connectivity
            addResult('Network Test', 'info', 'Testing API connectivity...');
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            addResult('HTTP Response', 'info', `Status: ${response.status} ${response.statusText}`);

            // Check response headers
            const headers = Object.fromEntries(response.headers.entries());
            addResult('Response Headers', 'info', 'Headers received', headers);

            if (response.ok) {
                try {
                    const data = await response.json();
                    addResult('Response Data', 'success', 'Successfully parsed JSON', data);
                    
                    // Detailed analysis of the response
                    if (data.images && Array.isArray(data.images)) {
                        addResult('Images Array', 'success', `Found ${data.images.length} images`);
                        
                        // Check each image for required fields
                        data.images.forEach((image, index) => {
                            const hasUrl = !!image.url;
                            const hasImageId = !!image.image_id;
                            const hasS3Key = !!image.image_key;
                            
                            addResult(`Image ${index + 1}`, hasUrl ? 'success' : 'warning', 
                                `ID: ${image.image_id || 'missing'}, URL: ${hasUrl ? 'present' : 'MISSING'}, S3 Key: ${image.image_key || 'missing'}`, 
                                image
                            );
                        });
                    } else if (Array.isArray(data)) {
                        addResult('Images Array', 'success', `Found ${data.length} images (direct array)`);
                        
                        // Check each image for required fields
                        data.forEach((image, index) => {
                            const hasUrl = !!image.url;
                            const hasImageId = !!image.image_id;
                            const hasS3Key = !!image.image_key;
                            
                            addResult(`Image ${index + 1}`, hasUrl ? 'success' : 'warning', 
                                `ID: ${image.image_id || 'missing'}, URL: ${hasUrl ? 'present' : 'MISSING'}, S3 Key: ${image.image_key || 'missing'}`, 
                                image
                            );
                        });
                    } else {
                        addResult('Images Array', 'warning', 'Unexpected response format', data);
                    }
                } catch (jsonError) {
                    const text = await response.text();
                    addResult('JSON Parse', 'error', 'Failed to parse JSON response', { error: jsonError.message, text });
                }
            } else {
                try {
                    const errorText = await response.text();
                    addResult('Error Response', 'error', `API returned error: ${response.status}`, { errorText });
                } catch (e) {
                    addResult('Error Response', 'error', `API returned error: ${response.status} (could not read response body)`);
                }
            }

        } catch (fetchError) {
            addResult('Network Error', 'error', 'Failed to connect to API', {
                error: fetchError.message,
                name: fetchError.name,
                stack: fetchError.stack
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
                <h3 className="text-lg font-medium">API Connectivity Test</h3>
                <div className="space-x-2">
                    <Button
                        onClick={testApiConnectivity}
                        disabled={testing}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {testing ? 'Testing...' : 'Test API'}
                    </Button>
                    <Button
                        onClick={clearResults}
                        variant="outline"
                        disabled={testResults.length === 0}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {testResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
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
                                    <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {testResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>Click "Test API" to diagnose connectivity issues</p>
                </div>
            )}
        </Card>
    );
}