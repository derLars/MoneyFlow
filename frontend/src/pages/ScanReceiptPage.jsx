import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, RotateCw, Crop, Loader2 } from 'lucide-react';
import axios from '../api/axios';

const ScanReceiptPage = () => {
  const [images, setImages] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => 
      ['image/jpeg', 'image/png', 'image/heic'].includes(file.type) || 
      file.name.toLowerCase().endsWith('.heic')
    );

    if (images.length + validFiles.length > 5) {
      setError('You can upload up to 5 images.');
      return;
    }

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      rotation: 0
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const rotateImage = (id) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ));
  };

  const handleScan = async () => {
    if (images.length === 0) return;

    setIsScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      images.forEach(img => {
        formData.append('files', img.file);
      });

      // Note: Rotation and cropping info should ideally be processed here or on the backend
      // For now, we send the files as they are. 
      // In a real scenario, we might want to process them in canvas before sending.

      const response = await axios.post('/ocr/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("DEBUG: Scan response data:", response.data);
      alert(`${response.data.length} items were extracted.`);

      // Redirect to PurchaseEditor with the extracted data
      navigate('/create-purchase', { state: { extractedData: response.data } });
    } catch (err) {
      console.error('Scan failed:', err);
      setError('Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-charcoal-gray mb-8">Scan Your Receipt</h1>

      {/* Step 1: Upload Area */}
      <div 
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white hover:border-deep-blue transition-colors cursor-pointer"
        onClick={() => document.getElementById('fileInput').click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-charcoal-gray mb-2">Drag & drop receipt images here, or click to browse</p>
        <p className="text-sm text-gray-500 mb-4">You can upload up to 5 images (JPEG, PNG, HEIC)</p>
        <button className="bg-deep-blue text-white px-6 py-2 rounded-md font-bold hover:opacity-90 transition-opacity">
          Upload Images
        </button>
        <input 
          id="fileInput"
          type="file" 
          multiple 
          accept="image/jpeg,image/png" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-alert-red bg-opacity-10 border border-alert-red text-alert-red rounded-md">
          {error}
        </div>
      )}

      {/* Step 2: Image Staging & Preparation */}
      {images.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-charcoal-gray mb-6">Prepare Your Images</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {images.map((img) => (
              <div key={img.id} className="relative bg-white p-2 rounded-lg shadow-md border border-gray-200">
                <div className="aspect-[3/4] overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                  <img 
                    src={img.preview} 
                    alt="Receipt preview" 
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${img.rotation}deg)` }}
                  />
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute top-4 right-4 p-1 bg-alert-red text-white rounded-full hover:bg-opacity-90 shadow-sm"
                >
                  <X size={16} />
                </button>

                <div className="mt-3 flex justify-center space-x-4">
                  <button 
                    onClick={() => rotateImage(img.id)}
                    className="flex items-center space-x-1 text-sm text-deep-blue hover:underline"
                  >
                    <RotateCw size={16} />
                    <span>Rotate</span>
                  </button>
                  <button 
                    className="flex items-center space-x-1 text-sm text-deep-blue hover:underline"
                    onClick={() => alert('Crop functionality coming soon!')}
                  >
                    <Crop size={16} />
                    <span>Crop</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="mt-12 flex justify-end">
            <button 
              onClick={handleScan}
              disabled={isScanning || images.length === 0}
              className={`flex items-center space-x-2 bg-deep-blue text-white px-8 py-3 rounded-md font-bold text-lg shadow-lg transition-all ${
                (isScanning || images.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:transform active:scale-95'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Scan Receipt</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanReceiptPage;
