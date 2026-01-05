import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Settings, Users, Plus, Scan, 
  Receipt, ArrowRightLeft, PieChart, Trash2, UserPlus, X, Loader2, LogOut, Search, Check
} from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProjectDetails, deleteProject, addParticipant, removeParticipant, loading } = useProjectStore();
  const { user: currentUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [moneyFlow, setMoneyFlow] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId);
      fetchData();
    }
  }, [projectId]);

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
      const [purchasesRes, moneyFlowRes, statsRes] = await Promise.all([
        api.get('/purchases', { params: { project_id: projectId, search: searchTerm } }),
        api.get(`/projects/${projectId}/moneyflow`),
        api.get(`/projects/${projectId}/stats`)
      ]);
      setPurchases(purchasesRes.data);
      setMoneyFlow(moneyFlowRes.data);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="relative h-48 sm:h-64 rounded-b-3xl sm:rounded-3xl overflow-hidden -mx-4 sm:mx-0">
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
        
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex justify-between items-end">
          <div>
            <Link to="/" className="text-white/80 hover:text-white flex items-center gap-2 text-sm mb-2 font-bold">
              <ArrowLeft size={16} /> Back
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">{currentProject.name}</h1>
            <p className="text-white/80 max-w-xl">{currentProject.description}</p>
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
      <div className="flex p-1 bg-surface rounded-2xl mx-4 sm:mx-0 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap px-4 ${activeTab === 'purchases' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
        >
          <Receipt size={16} className="inline mr-2" /> Purchases
        </button>
        <button 
          onClick={() => setActiveTab('moneyflow')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap px-4 ${activeTab === 'moneyflow' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
        >
          <ArrowRightLeft size={16} className="inline mr-2" /> Money Flow
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap px-4 ${activeTab === 'stats' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
        >
          <PieChart size={16} className="inline mr-2" /> Statistics
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap px-4 ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
        >
          <Settings size={16} className="inline mr-2" /> Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="px-4 sm:px-0 min-h-[400px]">
        {activeTab === 'purchases' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to={`/scan?project_id=${projectId}`} 
                className="bg-surface border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition group"
              >
                <div className="bg-primary/20 p-2 rounded-xl text-primary group-hover:scale-110 transition"><Scan size={20} /></div>
                <span className="font-bold text-white">Scan Receipt</span>
              </Link>
              <Link 
                to={`/create-purchase?project_id=${projectId}`} 
                className="bg-surface border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition group"
              >
                <div className="bg-success/20 p-2 rounded-xl text-success group-hover:scale-110 transition"><Plus size={20} /></div>
                <span className="font-bold text-white">Add Manually</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                <input 
                    type="text"
                    placeholder="Search purchases in this project..."
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-primary text-white text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loadingData ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />)}
              </div>
            ) : purchases.length > 0 ? (
              <div className="space-y-3">
                {purchases.map(p => (
                  <Link key={p.purchase_id} to={`/edit-purchase/${p.purchase_id}`} className="bg-surface p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center">
                        <Receipt size={20} className="text-secondary group-hover:text-primary transition" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{p.purchase_name}</h3>
                        <p className="text-xs text-secondary">{new Date(p.purchase_date).toLocaleDateString()} • {p.payer_name}</p>
                      </div>
                    </div>
                    <span className="font-bold text-white">€{p.items.reduce((acc, i) => acc + (i.price * i.quantity) - i.discount, 0).toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary">No purchases yet. Add one above!</div>
            )}
          </div>
        )}

        {activeTab === 'moneyflow' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {loadingData ? <Loader2 className="animate-spin mx-auto text-primary" /> : moneyFlow.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moneyFlow.map((flow, idx) => (
                  <div key={idx} className="bg-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{flow.user_a_name}</span>
                      <span className="text-xs text-secondary uppercase">Owes</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-primary">€{flow.amount.toFixed(2)}</span>
                      <span className="text-xs text-secondary">to {flow.user_b_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary bg-surface rounded-3xl border border-dashed border-white/10">
                Everything is settled up!
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {loadingData ? <Loader2 className="animate-spin mx-auto text-primary" /> : stats ? (
              <>
                <div className="bg-surface p-6 rounded-3xl border border-white/5">
                  <h3 className="text-secondary text-sm font-bold uppercase mb-2">Total Project Spending</h3>
                  <p className="text-4xl font-black text-white">€{stats.total_spending?.toFixed(2)}</p>
                </div>
                
                {stats.user_spending && (
                  <div className="space-y-3">
                    <h3 className="text-white font-bold px-2">Spending by User</h3>
                    {stats.user_spending.map(us => (
                      <div key={us.user_id} className="bg-surface p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                        <span className="font-medium text-white">{us.name}</span>
                        <span className="font-bold text-white">€{us.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-secondary">No statistics available.</div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><Users size={20} /> Participants</h3>
                <button onClick={loadAllUsers} className="text-primary hover:text-white text-sm font-bold flex items-center gap-1 transition">
                    <UserPlus size={16} /> Add User
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {currentProject.participants.map(p => (
                  <div key={p.participant_id} className={`p-4 flex items-center justify-between hover:bg-white/5 transition ${!p.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.is_active ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                        {p.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {p.user_name}
                          {!p.is_active && <span className="ml-2 text-[10px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-secondary">Removed</span>}
                        </p>
                        <p className="text-xs text-secondary">Joined {new Date(p.joined_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* Any participant can remove others (and self) - only if active */}
                    {p.is_active && p.user_id !== currentUser.user_id && (
                      <button onClick={() => handleRemoveUser(p.user_id)} className="text-secondary hover:text-red-500 transition p-2">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {showAddUser && (
              <div className="bg-surface rounded-3xl border border-white/5 p-6 animate-in fade-in slide-in-from-top-2">
                <h4 className="font-bold text-white mb-4">Add Participant</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a user...</option>
                    {allUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddUser}
                      disabled={!selectedUserToAdd}
                      className="flex-1 sm:flex-none px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Add
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddUser(false);
                        setSelectedUserToAdd('');
                      }} 
                      className="flex-1 sm:flex-none px-6 py-3 bg-white/5 text-secondary font-bold rounded-xl hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {allUsers.length === 0 && (
                  <p className="text-secondary text-xs mt-3 italic">No other users available to add.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
