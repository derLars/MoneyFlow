import React, { useState, useEffect } from 'react';
import { X, Upload, Users, Loader2 } from 'lucide-react';
import FloatingInput from './ui/FloatingInput';
import MultiSelect from './ui/MultiSelect';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';

const CreateProjectModal = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuthStore();
  const { createProject } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    participants: [],
    image: null
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch users for participant selection
      api.get('/purchases/users/all').then(res => {
        setUsers(res.data.filter(u => u.user_id !== currentUser?.user_id && !u.is_dummy));
      }).catch(console.error);
    }
  }, [isOpen, currentUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('participants', JSON.stringify(formData.participants));
      if (formData.image) {
        data.append('file', formData.image);
      }

      await createProject(data);
      onClose();
      // Reset form
      setFormData({ name: '', description: '', participants: [], image: null });
      setPreview(null);
    } catch (err) {
      alert("Failed to create project: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (userId) => {
    setFormData(prev => {
      if (prev.participants.includes(userId)) {
        return { ...prev, participants: prev.participants.filter(id => id !== userId) };
      } else {
        return { ...prev, participants: [...prev.participants, userId] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create New Project</h2>
          <button onClick={onClose} className="p-2 text-secondary hover:text-white hover:bg-white/5 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed ${preview ? 'border-primary' : 'border-white/20'} flex items-center justify-center bg-background/50 hover:bg-background transition`}>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-secondary group-hover:text-primary transition" size={24} />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-center text-secondary mt-2">Project Image</p>
            </div>
          </div>

          <FloatingInput 
            label="Project Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <FloatingInput 
            label="Description (Optional)" 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          {/* Participants */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary flex items-center gap-2">
              <Users size={16} /> Participants
            </label>
            <MultiSelect 
                options={users.map(u => ({ value: u.user_id, label: u.name }))}
                value={formData.participants}
                onChange={(updated) => setFormData({...formData, participants: updated})}
                placeholder="Select users..."
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
