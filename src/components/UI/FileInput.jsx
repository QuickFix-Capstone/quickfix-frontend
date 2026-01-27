import React, { useRef } from 'react';
import { Upload, Image, X } from 'lucide-react';
import Button from './Button';
import { validateImageFiles, formatFileSize, createFilePreview } from '../../utils/imageValidation';

export default function FileInput({
    onFilesSelected,
    multiple = true,
    disabled = false,
    existingCount = 0,
    className = '',
    showPreview = true,
    maxFiles = 10
}) {
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = React.useState([]);
    const [previews, setPreviews] = React.useState([]);
    const [validationErrors, setValidationErrors] = React.useState([]);

    const handleFileSelect = (files) => {
        const fileArray = Array.from(files);
        
        // Validate files
        const validation = validateImageFiles(fileArray, existingCount);
        
        if (validation.isValid) {
            setSelectedFiles(validation.validFiles);
            setValidationErrors([]);
            
            // Create previews if enabled
            if (showPreview) {
                const newPreviews = validation.validFiles.map(file => ({
                    file,
                    url: createFilePreview(file),
                    id: `${file.name}-${Date.now()}`
                }));
                setPreviews(newPreviews);
            }
            
            // Notify parent
            onFilesSelected?.(validation.validFiles);
        } else {
            setValidationErrors(validation.errors);
            setSelectedFiles([]);
            setPreviews([]);
        }
    };

    const handleInputChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const removeFile = (indexToRemove) => {
        const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
        const newPreviews = previews.filter((_, index) => index !== indexToRemove);
        
        // Revoke the preview URL to prevent memory leaks
        if (previews[indexToRemove]) {
            URL.revokeObjectURL(previews[indexToRemove].url);
        }
        
        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
        onFilesSelected?.(newFiles);
    };

    const clearAll = () => {
        // Revoke all preview URLs
        previews.forEach(preview => URL.revokeObjectURL(preview.url));
        
        setSelectedFiles([]);
        setPreviews([]);
        setValidationErrors([]);
        onFilesSelected?.([]);
        
        // Clear the input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    // Clean up preview URLs on unmount
    React.useEffect(() => {
        return () => {
            previews.forEach(preview => URL.revokeObjectURL(preview.url));
        };
    }, []);

    const canAddMore = existingCount + selectedFiles.length < maxFiles;
    const remainingSlots = maxFiles - existingCount - selectedFiles.length;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={openFileDialog}
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${disabled 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : canAddMore
                            ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept="image/*"
                    onChange={handleInputChange}
                    disabled={disabled || !canAddMore}
                    className="hidden"
                />
                
                <div className="flex flex-col items-center space-y-3">
                    <div className={`
                        p-3 rounded-full 
                        ${disabled || !canAddMore 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-blue-100 text-blue-600'
                        }
                    `}>
                        <Upload className="h-6 w-6" />
                    </div>
                    
                    <div>
                        <p className={`text-lg font-medium ${
                            disabled || !canAddMore ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                            {disabled 
                                ? 'Upload disabled'
                                : !canAddMore
                                    ? `Maximum ${maxFiles} images allowed`
                                    : 'Drop images here or click to browse'
                            }
                        </p>
                        
                        {canAddMore && !disabled && (
                            <p className="text-sm text-gray-500 mt-1">
                                Supports JPEG, PNG, WebP up to 5MB each
                                {remainingSlots > 0 && ` • ${remainingSlots} slots remaining`}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                File Validation Errors
                            </h3>
                            <ul className="mt-2 text-sm text-red-700 space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Files Preview */}
            {showPreview && selectedFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                            Selected Files ({selectedFiles.length})
                        </h4>
                        <Button
                            onClick={clearAll}
                            variant="outline"
                            className="text-xs px-3 py-1 h-auto"
                        >
                            Clear All
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {previews.map((preview, index) => (
                            <div key={preview.id} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={preview.url}
                                        alt={preview.file.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                {/* Remove button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                                
                                {/* File info */}
                                <div className="mt-1 text-xs text-gray-600 truncate">
                                    <p className="font-medium truncate">{preview.file.name}</p>
                                    <p className="text-gray-500">{formatFileSize(preview.file.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}