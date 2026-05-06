import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Settings, Users, Plus, Scan, 
  Receipt, ArrowRightLeft, PieChart, Trash2, UserPlus, X, Loader2, LogOut, Search, Check, DollarSign, Calendar, User, FileText, Banknote, Edit2, Upload, Save
} from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import CompactInput from '../components/ui/CompactInput';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProjectDetails, deleteProject, addParticipant, removeParticipant, updateProject, loading } = useProjectStore();
  const { user: currentUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [moneyFlow, setMoneyFlow] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [newPayment, setNewPayment] = useState({
    payer_user_id: currentUser?.user_id || '',
    receiver_user_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId).then(project => {
          if (project) {
              setEditName(project.name);
              setEditDescription(project.description || '');
          }
      });
      fetchData();
    }
  }, [projectId]);

  // Sync edit state when project changes (e.g. after update)
  useEffect(() => {
    if (currentProject && !editMode) {
      setEditName(currentProject.name);
      setEditDescription(currentProject.description || '');
    }
  }, [currentProject, editMode]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [purchasesRes, moneyFlowRes, paymentsRes, statsRes] = await Promise.all([
        api.get('/purchases', { params: { project_id: projectId, search: searchTerm } }),
        api.get(`/projects/${projectId}/moneyflow`),
        api.get('/payments', { params: { project_id: projectId } }),
        api.get(`/projects/${projectId}/stats`)
      ]);
      setPurchases(purchasesRes.data);
      setMoneyFlow(moneyFlowRes.data);
      
      // Map user names for payments
      const userMap = {};
      if (currentProject && currentProject.participants) {
        currentProject.participants.forEach(p => {
          userMap[p.user_id] = p.user_name;
        });
      }

      const enhancedPayments = paymentsRes.data.map(p => ({
        ...p,
        payer_name: userMap[p.payer_user_id] || 'Unknown',
        receiver_name: userMap[p.receiver_user_id] || 'Unknown',
        creator_name: userMap[p.creator_user_id] || 'System'
      }));

      setPayments(enhancedPayments);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch project data", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserToAdd) return;
    try {
      await addParticipant(projectId, parseInt(selectedUserToAdd));
      setSelectedUserToAdd('');
      setShowAddUser(false);
      // Logic B: Refresh details immediately to update the list in the frontend
      await fetchProjectDetails(projectId);
    } catch (err) {
      alert("Failed to add user");
    }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm("Are you sure? The user will be marked as removed but remain in historical records.")) {
      try {
        await removeParticipant(projectId, userId);
        // Refresh
        fetchProjectDetails(projectId);
      } catch (err) {
        alert("Failed to remove user");
      }
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm("Delete this project? ALL purchases inside will be permanently deleted!")) {
      await deleteProject(projectId);
      navigate('/');
    }
  };

  const handleLeaveProject = async () => {
    if (window.confirm("Leave this project? You will lose access to it, but remain in historical records.")) {
        try {
            await removeParticipant(projectId, currentUser.user_id);
            navigate('/');
        } catch (err) {
            alert("Failed to leave project");
        }
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
        const formData = new FormData();
        formData.append('name', editName);
        formData.append('description', editDescription);
        if (editFile) {
            formData.append('file', editFile);
        }
        await updateProject(projectId, formData);
        setEditMode(false);
        setEditFile(null);
        setPreviewUrl(null);
    } catch (err) {
        alert("Failed to update project: " + err.message);
    } finally {
        setActionLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setEditFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    if (newPayment.payer_user_id === newPayment.receiver_user_id) {
        alert("Sender and Receiver cannot be the same person.");
        setActionLoading(false);
        return;
    }

    try {
      await api.post('/payments', {
        ...newPayment,
        project_id: parseInt(projectId),
        payer_user_id: parseInt(newPayment.payer_user_id),
        receiver_user_id: parseInt(newPayment.receiver_user_id),
        amount: parseFloat(newPayment.amount)
      });
      setShowPaymentModal(false);
      setNewPayment({
        payer_user_id: currentUser?.user_id || '',
        receiver_user_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        note: ''
      });
      fetchData();
    } catch (err) {
      alert("Failed to create payment: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await api.delete(`/payments/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete payment");
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await api.get('/purchases/users/all');
      // Only filter out users who are CURRENTLY active participants
      setAllUsers(res.data.filter(u => !u.is_dummy && !currentProject.participants.some(p => p.user_id === u.user_id && p.is_active)));
      setShowAddUser(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const isCreator = currentProject.created_by_user_id === currentUser?.user_id || currentUser?.administrator;

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="relative h-36 md:h-52 rounded-b-2xl md:rounded-2xl overflow-hidden -mx-4 md:mx-0">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
        {currentProject.image_path ? (
          <img 
            src={currentProject.image_path.startsWith('http') || currentProject.image_path.startsWith('/') ? currentProject.image_path : `/api/purchases/images/${currentProject.image_path}`} 
            className="w-full h-full object-cover" 
            alt={currentProject.name}
          />
        ) : (
          <div className="w-full h-full bg-surface" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20 flex justify-between items-end">
          <div>
            <Link to="/" className="text-white/80 hover:text-white flex items-center gap-1.5 text-xs md:text-sm mb-1 font-bold">
              <ArrowLeft size={14} /> Back
            </Link>
            <h1 className="text-xl md:text-3xl font-black text-white drop-shadow-lg">{currentProject.name}</h1>
            <p className="text-white/80 max-w-xl text-xs md:text-sm line-clamp-1">{currentProject.description}</p>
          </div>
          
          <div className="flex gap-2">
            <button 
                onClick={handleLeaveProject}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition backdrop-blur-md"
                title="Leave Project"
            >
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-0.5 bg-surface rounded-xl mx-4 sm:mx-0 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 py-2 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition whitespace-nowrap px-2 md:px-3 ${activeTab === 'purchases' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white'}`}
        >
          <Receipt size={14} className="inline mr-1 md:mr-1.5" /> Purchases
        </button>
        <button 
          onClick={() => setActiveTab('moneyflow')}
          className={`flex-1 py-2 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition whitespace-nowrap px-2 md:px-3 ${activeTab === 'moneyflow' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white'}`}
        >
          <ArrowRightLeft size={14} className="inline mr-1 md:mr-1.5" /> Flow
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition whitespace-nowrap px-2 md:px-3 ${activeTab === 'stats' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white'}`}
        >
          <PieChart size={14} className="inline mr-1 md:mr-1.5" /> Stats
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition whitespace-nowrap px-2 md:px-3 ${activeTab === 'settings' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white'}`}
        >
          <Settings size={14} className="inline mr-1 md:mr-1.5" /> Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="px-4 sm:px-0 min-h-[400px]">
        {activeTab === 'purchases' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Link 
                to={`/scan?project_id=${projectId}`} 
                className="bg-surface border border-white/5 p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition group"
              >
                <div className="bg-primary/20 p-1.5 rounded-lg text-primary group-hover:scale-110 transition"><Scan size={16} /></div>
                <span className="font-bold text-white text-xs">Scan Receipt</span>
              </Link>
              <Link 
                to={`/create-purchase?project_id=${projectId}`} 
                className="bg-surface border border-white/5 p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition group"
              >
                <div className="bg-success/20 p-1.5 rounded-lg text-success group-hover:scale-110 transition"><Plus size={16} /></div>
                <span className="font-bold text-white text-xs">Add Manually</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                <input 
                    type="text"
                    placeholder="Search purchases..."
                    className="w-full pl-9 pr-3 py-2 bg-surface border border-white/5 rounded-lg outline-none focus:ring-1 focus:ring-primary text-white text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loadingData ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}
              </div>
            ) : purchases.length > 0 ? (
              <div className="space-y-1.5">
                {purchases.map(p => (
                  <Link key={p.purchase_id} to={`/edit-purchase/${p.purchase_id}`} className="bg-surface p-3 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                        <Receipt size={16} className="text-secondary group-hover:text-primary transition" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{p.purchase_name}</h3>
                        <p className="text-[10px] text-secondary">{new Date(p.purchase_date).toLocaleDateString()} • {p.payer_name}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-white">€{p.items.reduce((acc, i) => acc + (i.price * i.quantity) - i.discount, 0).toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary text-xs">No purchases yet. Add one above!</div>
            )}
          </div>
        )}

        {activeTab === 'moneyflow' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-base md:text-lg font-bold text-white">Balances</h2>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-md text-xs"
              >
                <Plus size={14} />
                Record Payment
              </button>
            </div>

            {loadingData ? <Loader2 className="animate-spin mx-auto text-primary" /> : moneyFlow.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {moneyFlow.map((flow, idx) => (
                  <div key={idx} className="bg-surface p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{flow.user_a_name}</span>
                      <span className="text-[10px] text-secondary uppercase tracking-wider">Owes</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-error">€{flow.amount.toFixed(2)}</span>
                      <span className="text-[10px] text-secondary">to {flow.user_b_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-secondary text-xs bg-surface rounded-xl border border-dashed border-white/10">
                Everything is settled up!
              </div>
            )}

            {/* Payment History inside Project */}
            <div className="space-y-3 pt-2">
              <h2 className="text-base md:text-lg font-bold text-white">Payments</h2>
              <div className="space-y-1.5">
                {payments.length > 0 ? payments.map((p) => (
                  <div key={p.payment_id} className="bg-surface p-3 rounded-xl border border-white/5 flex items-center gap-3 group">
                    <div className={`p-2 rounded-full flex-shrink-0 ${p.payer_user_id === currentUser.user_id ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'}`}>
                      <Banknote size={16} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-xs text-white truncate">
                          {p.payer_user_id === currentUser.user_id ? `${currentUser.name} (You)` : p.payer_name} 
                          <span className="text-secondary font-normal mx-1">paid</span>
                          {p.receiver_user_id === currentUser.user_id ? `${currentUser.name} (You)` : p.receiver_name}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-black text-success text-sm whitespace-nowrap">€{p.amount.toFixed(2)}</span>
                          {(p.payer_user_id === currentUser.user_id || p.receiver_user_id === currentUser.user_id || currentUser.administrator) ? (
                            <button 
                              onClick={() => handleDeletePayment(p.payment_id)}
                              className="p-1 text-secondary hover:text-error transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : <div className="w-6" />}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-secondary">{p.payment_date}</span>
                        {p.note && (
                          <span className="text-[10px] text-secondary">• {p.note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-surface p-6 rounded-xl border border-dashed border-white/10 text-center">
                    <p className="text-secondary italic text-xs">No payments recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {loadingData ? <Loader2 className="animate-spin mx-auto text-primary" /> : stats ? (
              <>
                <div className="bg-surface p-4 rounded-xl border border-white/5">
                  <h3 className="text-[10px] text-secondary font-bold uppercase mb-1 tracking-wider">Total Spending</h3>
                  <p className="text-2xl md:text-3xl font-black text-white">€{stats.total_spending?.toFixed(2)}</p>
                </div>
                
                {stats.user_spending && (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white">Spending by User</h3>
                    {stats.user_spending.map(us => (
                      <div key={us.user_id} className="bg-surface p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="font-medium text-sm text-white">{us.name}</span>
                        <span className="font-bold text-sm text-white">€{us.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-secondary text-xs">No statistics available.</div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Project Settings */}
            <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
              <div className="p-3 md:p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Settings size={16} /> Project Info</h3>
                {!editMode && (
                  <button 
                    onClick={() => setEditMode(true)}
                    className="text-primary hover:text-white text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
              <div className="p-3 md:p-4">
                {editMode ? (
                  <form onSubmit={handleUpdateProject} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-3">
                        <CompactInput
                          label="Project Name"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Description</label>
                          <textarea 
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[60px]"
                            placeholder="What is this project about?"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Project Image</label>
                        <div className="relative group aspect-video rounded-xl overflow-hidden bg-background border border-dashed border-white/20 flex items-center justify-center">
                          {previewUrl || currentProject.image_path ? (
                            <>
                              <img 
                                src={previewUrl || (currentProject.image_path?.startsWith('http') || currentProject.image_path?.startsWith('/') ? currentProject.image_path : `/api/purchases/images/${currentProject.image_path}`)} 
                                className="w-full h-full object-cover" 
                                alt="Preview" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-full transition">
                                  <Upload size={18} />
                                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-1.5 text-secondary hover:text-white transition p-4">
                              <Upload size={20} />
                              <span className="font-bold text-xs">Upload Image</span>
                              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setEditName(currentProject.name);
                          setEditDescription(currentProject.description || '');
                          setEditFile(null);
                          setPreviewUrl(null);
                        }}
                        className="px-4 py-1.5 bg-white/5 text-secondary font-bold rounded-lg hover:bg-white/10 transition text-xs"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 text-xs"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Name</h4>
                        <p className="text-base font-bold text-white">{currentProject.name}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Description</h4>
                        <p className="text-sm text-white/80">{currentProject.description || <span className="italic opacity-50">No description</span>}</p>
                      </div>
                    </div>
                    {currentProject.image_path && (
                      <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden border border-white/5">
                        <img 
                          src={currentProject.image_path.startsWith('http') || currentProject.image_path.startsWith('/') ? currentProject.image_path : `/api/purchases/images/${currentProject.image_path}`} 
                          className="w-full h-full object-cover" 
                          alt={currentProject.name}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
              <div className="p-3 md:p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5"><Users size={16} /> Participants</h3>
                <button onClick={loadAllUsers} className="text-primary hover:text-white text-xs font-bold flex items-center gap-1 transition">
                    <UserPlus size={14} /> Add
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {currentProject.participants.map(p => (
                  <div key={p.participant_id} className={`p-2.5 md:p-3 flex items-center justify-between hover:bg-white/5 transition ${!p.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${p.is_active ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                        {p.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">
                          {p.user_name}
                          {p.user_id === currentUser.user_id && <span className="ml-1 text-[10px] text-primary/60">(You)</span>}
                          {!p.is_active && <span className="ml-1 text-[9px] uppercase tracking-wider bg-white/10 px-1 py-0.5 rounded text-secondary">Removed</span>}
                        </p>
                        <p className="text-[10px] text-secondary">Joined {new Date(p.joined_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {p.is_active && p.user_id !== currentUser.user_id && (
                      <button onClick={() => handleRemoveUser(p.user_id)} className="text-secondary hover:text-red-500 transition p-1">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {showAddUser && (
              <div className="bg-surface rounded-xl border border-white/5 p-3 md:p-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="font-bold text-xs text-white mb-2">Add Participant</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    className="flex-1 bg-background border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a user...</option>
                    {allUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handleAddUser}
                      disabled={!selectedUserToAdd}
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-xs"
                    >
                      <Check size={14} /> Add
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddUser(false);
                        setSelectedUserToAdd('');
                      }} 
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-white/5 text-secondary font-bold rounded-lg hover:bg-white/10 transition text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {allUsers.length === 0 && (
                  <p className="text-secondary text-[10px] mt-2 italic">No other users available to add.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200 border border-white/5">
            <div className="p-3 md:p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <DollarSign size={16} className="text-primary" />
                Record Payment
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-secondary hover:text-white transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePayment} className="p-4 space-y-3">
              <div className="space-y-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">From (Sender)</label>
                  <select
                    required
                    className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                    value={newPayment.payer_user_id}
                    onChange={(e) => {
                        const newPayerId = parseInt(e.target.value);
                        setNewPayment(prev => ({
                            ...prev, 
                            payer_user_id: newPayerId,
                            receiver_user_id: prev.receiver_user_id == newPayerId ? '' : prev.receiver_user_id
                        }));
                    }}
                  >
                    <option value="">Select Sender</option>
                    {currentProject.participants.map(p => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.user_id === currentUser.user_id ? `${p.user_name} (You)` : p.user_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">To (Receiver)</label>
                  <select
                    required
                    className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                    value={newPayment.receiver_user_id}
                    onChange={(e) => setNewPayment({...newPayment, receiver_user_id: parseInt(e.target.value)})}
                  >
                    <option value="">Select Receiver</option>
                    {currentProject.participants
                      .filter(p => p.user_id !== parseInt(newPayment.payer_user_id))
                      .map(p => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.user_id === currentUser.user_id ? `${p.user_name} (You)` : p.user_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary font-bold text-sm">€</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full pl-6 pr-2.5 py-1.5 bg-background rounded-lg outline-none focus:ring-1 focus:ring-primary text-white text-sm border border-white/10"
                      placeholder="0.00"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    />
                  </div>
                </div>
                <CompactInput
                  label="Date"
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                />
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Note</label>
                  <input
                    className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                    placeholder="What's this for?"
                    value={newPayment.note}
                    onChange={(e) => setNewPayment({...newPayment, note: e.target.value})}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Confirm Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
