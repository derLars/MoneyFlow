import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, RotateCw, Crop, Loader2, Check, RotateCcw } from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import api from '../api/axios';

const ImageEditorModal = ({ image, onSave, onCancel }) => {
  const [cropper, setCropper] = useState(null);
  const [rotation, setRotation] = useState(image.rotation || 0);
  const [zoom, setZoom] = useState(1); // 1 is default zoom
  const [isReady, setIsReady] = useState(false);

  // Apply rotation when slider changes
  useEffect(() => {
    if (cropper && isReady) {
      try {
        cropper.rotateTo(rotation);
      } catch (e) {
        console.warn('Cropper rotation failed:', e);
      }
    }
  }, [rotation, cropper, isReady]);

  // Apply zoom when slider changes
  useEffect(() => {
    if (cropper && isReady) {
      try {
        cropper.zoomTo(zoom);
      } catch (e) {
        console.warn('Cropper zoom failed:', e);
      }
    }
  }, [zoom, cropper, isReady]);

  const handleSave = () => {
    if (cropper && isReady) {
      cropper.getCroppedCanvas().toBlob((blob) => {
        if (!blob) {
            console.error('Canvas is empty');
            return;
        }
        const url = URL.createObjectURL(blob);
        onSave({ blob, url }, rotation);
      }, 'image/jpeg');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Edit Image</h3>
          <button onClick={onCancel} className="text-secondary hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 relative bg-black overflow-hidden" style={{ minHeight: '400px' }}>
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          )}
          <Cropper
            src={image.preview}
            style={{ height: '100%', width: '100%' }}
            // Cropper.js options
            guides={true}
            onInitialized={(instance) => {
              setCropper(instance);
            }}
            ready={() => setIsReady(true)}
            viewMode={1}
            dragMode="crop" // Allows drawing box
            zoomable={true}
            zoomOnTouch={false} // Disable gesture zoom
            zoomOnWheel={false} // Disable wheel zoom
            rotatable={true}
            scalable={true}
            background={false}
            autoCropArea={0.8}
            checkOrientation={false}
          />
        </div>

        <div className="p-6 space-y-4 bg-surface">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white">Rotation: {rotation}°</label>
              <div className="flex space-x-2 text-secondary">
                <button 
                  onClick={() => setRotation(r => (r - 90) % 360)}
                  className="p-1 hover:bg-background rounded"
                  title="Rotate Left 90°"
                >
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1 hover:bg-background rounded"
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
              className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white">Zoom</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-white/10 text-white rounded-xl hover:bg-background transition-colors font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center space-x-2"
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
      <h1 className="text-3xl font-bold text-white mb-8">Scan Your Receipt</h1>

      {/* Step 1: Upload Area */}
      <div 
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center bg-surface hover:border-primary transition-colors cursor-pointer group"
        onClick={() => document.getElementById('fileInput').click()}
      >
        <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition duration-300">
            <Upload className="h-10 w-10 text-secondary group-hover:text-primary transition-colors" />
        </div>
        <p className="text-lg text-white mb-2 font-bold">Drag & drop receipt images here</p>
        <p className="text-sm text-secondary mb-6">or click to browse from your device</p>
        <p className="text-xs text-secondary/50 mb-4 font-mono">Max 5 images (JPEG, PNG, HEIC)</p>
        
        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
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
        <div className="mt-4 p-4 bg-error/10 border border-error/20 text-error rounded-2xl font-medium">
          {error}
        </div>
      )}

      {/* Step 2: Image Staging & Preparation */}
      {images.length > 0 && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-white mb-6">Prepare Your Images</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {images.map((img) => (
              <div key={img.id} className="relative bg-surface p-2 rounded-3xl shadow-md border border-white/5 group">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-background flex items-center justify-center relative">
                  <img 
                    src={img.preview} 
                    alt="Receipt preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute top-4 right-4 p-2 bg-error text-white rounded-full hover:bg-opacity-90 shadow-lg transform hover:scale-110 transition"
                >
                  <X size={16} />
                </button>

                <div className="mt-3 flex justify-center">
                  <button 
                    onClick={() => setEditingImage(img)}
                    className="flex items-center space-x-2 text-sm text-white bg-background hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 font-bold transition"
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
              className={`flex items-center space-x-2 bg-primary text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all ${
                (isScanning || images.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
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
