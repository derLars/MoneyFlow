import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-base font-bold text-white">Edit Image</h3>
          <button onClick={onCancel} className="text-secondary hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 relative bg-black overflow-hidden" style={{ minHeight: '300px' }}>
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

        <div className="p-3 md:p-4 space-y-3 bg-surface">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white">Rotation: {rotation}°</label>
            <div className="flex gap-1 text-secondary">
              <button onClick={() => setRotation(r => (r - 90) % 360)} className="p-1 hover:bg-background rounded" title="Rotate Left 90°">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1 hover:bg-background rounded" title="Rotate Right 90°">
                <RotateCw size={16} />
              </button>
            </div>
          </div>
          <input type="range" min="0" max="360" step="1" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary" />
          <label className="text-xs font-medium text-white">Zoom: {zoom.toFixed(1)}x</label>
          <input type="range" min="0.1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary" />
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button onClick={onCancel} className="px-4 py-1.5 border border-white/10 text-white rounded-lg hover:bg-background transition-colors font-bold text-xs">Cancel</button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-1 text-xs">
              <Check size={14} />
              <span>Apply</span>
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
  const location = useLocation();

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
      const queryParams = new URLSearchParams(location.search);
      const projectId = queryParams.get('project_id');

      navigate('/create-purchase', { 
        state: { 
          extractedData: response.data,
          receiptImages: receiptImages,
          project_id: projectId
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
    <div className="mx-auto px-4 py-4 max-w-4xl">
      <h1 className="text-xl md:text-2xl font-bold text-white mb-4">Scan Receipt</h1>

      {/* Step 1: Upload Area */}
      <div 
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="border-2 border-dashed border-white/10 rounded-xl p-6 md:p-8 text-center bg-surface hover:border-primary transition-colors cursor-pointer group"
        onClick={() => document.getElementById('fileInput').click()}
      >
        <div className="bg-background w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition duration-300">
            <Upload className="h-6 w-6 md:h-8 md:w-8 text-secondary group-hover:text-primary transition-colors" />
        </div>
        <p className="text-sm md:text-base text-white mb-1 font-bold">Upload receipt images</p>
        <p className="text-[11px] md:text-xs text-secondary mb-3">Drag & drop or click to browse</p>
        <p className="text-[10px] text-secondary/50 mb-3 font-mono">Max 5 images (JPEG, PNG, HEIC)</p>
        
        <button className="bg-primary text-white px-5 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity text-sm">
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
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-base md:text-lg font-bold text-white mb-3">Images ({images.length})</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative bg-surface p-1.5 rounded-xl shadow-sm border border-white/5 group">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-background flex items-center justify-center relative">
                  <img 
                    src={img.preview} 
                    alt="Receipt preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute top-2 right-2 p-1 bg-error/90 text-white rounded-full shadow-md hover:scale-110 transition"
                >
                  <X size={12} />
                </button>

                <div className="mt-1.5 flex justify-center">
                  <button 
                    onClick={() => setEditingImage(img)}
                    className="flex items-center gap-1 text-[10px] text-white bg-background hover:bg-white/10 px-2 py-1 rounded-lg border border-white/5 font-bold transition w-full justify-center"
                  >
                    <Crop size={12} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleScan}
              disabled={isScanning || images.length === 0}
              className={`flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all ${
                (isScanning || images.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
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
