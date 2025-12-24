import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, RotateCw, Crop, Loader2, Check, RotateCcw } from 'lucide-react';
import Cropper from 'react-easy-crop';
import api from '../api/axios';

const ImageEditorModal = ({ image, onSave, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(image.rotation || 0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bWidth, height: bHeight } = {
      width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
      height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
    };

    canvas.width = bWidth;
    canvas.height = bHeight;

    ctx.translate(bWidth / 2, bHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.putImageData(data, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((file) => {
        resolve({
          blob: file,
          url: URL.createObjectURL(file)
        });
      }, 'image/jpeg');
    });
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(
        image.preview,
        croppedAreaPixels,
        rotation
      );
      onSave(croppedImage, rotation);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Edit Image</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 relative bg-gray-200">
          <Cropper
            image={image.preview}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Rotation: {rotation}°</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setRotation(r => (r - 90) % 360)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Rotate Left 90°"
                >
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Rotate Right 90°"
                >
                  <RotateCw size={20} />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-deep-blue"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Zoom</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-deep-blue"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-deep-blue text-white rounded-md font-bold hover:opacity-90 transition-opacity flex items-center space-x-2"
            >
              <Check size={20} />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScanReceiptPage = () => {
  const [images, setImages] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
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
      rotation: 0,
      isEdited: false
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed && !removed.isOriginalPreview) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handleSaveEditedImage = (croppedImage, rotation) => {
    setImages(prev => prev.map(img => {
      if (img.id === editingImage.id) {
        // Revoke old preview if it was already an edited one
        if (img.isEdited) URL.revokeObjectURL(img.preview);
        
        return {
          ...img,
          preview: croppedImage.url,
          file: new File([croppedImage.blob], img.file.name, { type: 'image/jpeg' }),
          rotation: rotation,
          isEdited: true
        };
      }
      return img;
    }));
    setEditingImage(null);
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

      const response = await api.post('/ocr/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("DEBUG: Scan response data:", response.data);
      
      // Store the image blobs/urls for later use in PurchaseEditor
      const receiptImages = images.map(img => ({
        url: img.preview,
        blob: img.file
      }));

      // Redirect to PurchaseEditor with the extracted data and the images
      navigate('/create-purchase', { 
        state: { 
          extractedData: response.data,
          receiptImages: receiptImages
        } 
      });
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
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute top-4 right-4 p-1 bg-alert-red text-white rounded-full hover:bg-opacity-90 shadow-sm"
                >
                  <X size={16} />
                </button>

                <div className="mt-3 flex justify-center">
                  <button 
                    onClick={() => setEditingImage(img)}
                    className="flex items-center space-x-1 text-sm text-deep-blue hover:underline bg-gray-50 px-4 py-2 rounded-md border"
                  >
                    <Crop size={16} />
                    <span>Crop & Rotate</span>
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

      {editingImage && (
        <ImageEditorModal
          image={editingImage}
          onSave={handleSaveEditedImage}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
};

export default ScanReceiptPage;
