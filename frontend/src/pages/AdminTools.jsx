import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  ShieldOff, 
  Trash2, 
  X, 
  AlertTriangle,
  Loader2,
  UserPlus,
  History,
  Eraser,
  FolderLock,
  Receipt,
  Edit2,
  ExternalLink,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const AdminTools = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Users State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', password: '' });
  const [overridePassword, setOverridePassword] = useState('');

  // Projects State
  const [projects, setProjects] = useState([]);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Purchases State
  const [purchases, setPurchases] = useState([]);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await api.get('/auth/users');
        setUsers(response.data);
      } else if (activeTab === 'projects') {
        const response = await api.get('/projects/admin/all');
        setProjects(response.data);
      } else if (activeTab === 'purchases') {
        const response = await api.get('/purchases/admin/all');
        setPurchases(response.data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${activeTab}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- User Management Logic ---
  const handleToggleAdmin = async (user) => {
    setActionLoading(true);
    try {
      const newStatus = !user.administrator;
      await api.patch(`/auth/users/${user.user_id}/role`, null, {
        params: { is_admin: newStatus }
      });
      setUsers(users.map(u => u.user_id === user.user_id ? { ...u, administrator: newStatus } : u));
      setIsUserModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.user_id === currentUser.user_id) {
      alert("You cannot delete your own account.");
      return;
    }
    setActionLoading(true);
    try {
      const response = await api.delete(`/auth/users/${user.user_id}`);
      if (response.data.status === 'anonymized') {
        setUsers(users.map(u => u.user_id === user.user_id ? response.data.user : u));
      } else {
        setUsers(users.filter(u => u.user_id !== user.user_id));
      }
      setIsUserModalOpen(false);
      setIsDeletingUser(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("Remove all unreferenced deleted users?")) return;
    setActionLoading(true);
    try {
      const response = await api.post('/auth/users/cleanup');
      alert(`Cleanup successful. Removed ${response.data.deleted_count} users.`);
      fetchData();
    } catch (err) {
      alert('Cleanup failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.password) return;
    setActionLoading(true);
    try {
      const response = await api.post('/auth/users', newUser);
      setUsers([...users, response.data]);
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverridePassword = async (e) => {
    e.preventDefault();
    if (!overridePassword) return;
    setActionLoading(true);
    try {
      await api.post(`/auth/users/${selectedUser.user_id}/password-override`, {
        new_password: overridePassword
      });
      alert('Password updated successfully');
      setOverridePassword('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Project Management Logic ---
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project and ALL its associated data? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p.project_id !== projectId));
    } catch (err) {
      alert('Failed to delete project');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Purchase Management Logic ---
  const handleDeletePurchase = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.delete(`/purchases/${purchaseId}`);
      setPurchases(purchases.filter(p => p.purchase_id !== purchaseId));
    } catch (err) {
      alert('Failed to delete purchase');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Search Filtering Logic ---
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredPurchases = purchases.filter(p => 
    p.purchase_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.payer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.purchase_id.toString().includes(searchQuery)
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Tools</h1>
            <p className="text-sm text-secondary font-medium">System-wide management and maintenance</p>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="flex gap-3">
            <button 
              onClick={handleCleanup}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-white/5 text-white rounded-xl font-bold shadow-lg hover:bg-white/5 transition active:scale-95 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Eraser size={20} />}
              Cleanup
            </button>
            <button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition active:scale-95"
            >
              <UserPlus size={20} />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
        {/* Tabs */}
        <div className="flex gap-2 bg-surface p-1.5 rounded-2xl w-fit border border-white/5 shadow-sm">
          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'users' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white hover:bg-white/5'}`}
          >
            <Users size={18} />
            Users
          </button>
          <button
            onClick={() => { setActiveTab('projects'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'projects' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white hover:bg-white/5'}`}
          >
            <FolderLock size={18} />
            Projects
          </button>
          <button
            onClick={() => { setActiveTab('purchases'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'purchases' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-white hover:bg-white/5'}`}
          >
            <Receipt size={18} />
            Purchases
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="w-full bg-surface border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-secondary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition shadow-sm"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-secondary hover:text-white transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-surface rounded-3xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {filteredUsers.map((u) => (
                <div key={u.user_id} className={`bg-surface rounded-3xl p-6 shadow-sm border transition group ${u.is_dummy ? 'border-dashed border-white/10 opacity-75' : 'border-white/5 hover:border-primary/20'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${u.is_dummy ? 'bg-secondary/20' : 'bg-background'}`}>
                      {u.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {u.administrator && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-primary/20">
                          <Shield size={12} />
                          Admin
                        </span>
                      )}
                      {u.is_dummy && (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-white/10">
                          <History size={12} />
                          Legacy
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6 truncate">{u.name}</h3>
                  <button 
                    onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); setIsDeletingUser(false); setOverridePassword(''); }}
                    className="w-full py-2.5 bg-background text-white font-bold text-sm rounded-xl hover:bg-primary transition active:scale-95"
                  >
                    Manage User
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Users size={48} className="mx-auto text-secondary/20 mb-4" />
                  <p className="text-secondary font-medium">No users found matching your search</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {filteredProjects.map((p) => (
                <div key={p.project_id} className="bg-surface rounded-3xl p-6 shadow-sm border border-white/5 hover:border-primary/20 transition group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-primary font-bold">
                      {p.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="px-3 py-1 bg-background text-secondary text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/5">
                      ID: {p.project_id}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 truncate">{p.name}</h3>
                  <p className="text-sm text-secondary font-medium mb-6 line-clamp-1">{p.description || 'No description'}</p>
                  
                  <div className="flex gap-2">
                    <Link 
                      to={`/projects/${p.project_id}`}
                      className="flex-1 py-2.5 bg-background text-white font-bold text-sm rounded-xl hover:bg-white/5 transition text-center flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} />
                      View
                    </Link>
                    <button 
                      onClick={() => handleDeleteProject(p.project_id)}
                      className="w-12 h-11 bg-background text-error font-bold rounded-xl hover:bg-error hover:text-white transition flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <FolderLock size={48} className="mx-auto text-secondary/20 mb-4" />
                  <p className="text-secondary font-medium">No projects found matching your search</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {filteredPurchases.map((p) => (
                <div key={p.purchase_id} className="bg-surface rounded-3xl p-6 shadow-sm border border-white/5 hover:border-primary/20 transition group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-info font-bold shrink-0">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">{p.purchase_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-secondary font-medium">{p.purchase_date}</p>
                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                        <p className="text-xs text-secondary font-medium">ID: {p.purchase_id}</p>
                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                        <p className="text-xs text-primary font-bold">Payer: {p.payer_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/edit-purchase/${p.purchase_id}`}
                      state={{ fromAdmin: true }}
                      className="px-4 py-2.5 bg-background text-white font-bold text-sm rounded-xl hover:bg-white/5 transition flex items-center gap-2 border border-white/5"
                    >
                      <Edit2 size={16} />
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeletePurchase(p.purchase_id)}
                      className="w-12 h-10 bg-background text-error font-bold rounded-xl hover:bg-error hover:text-white transition flex items-center justify-center border border-white/5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredPurchases.length === 0 && (
                <div className="py-20 text-center bg-surface rounded-3xl border border-white/5 border-dashed">
                  <Receipt size={48} className="mx-auto text-secondary/20 mb-4" />
                  <p className="text-secondary font-medium">No purchases found matching your search</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* User Management Modals (Add/Manage) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create New Account</h2>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-secondary hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">User Name</label>
                <input type="text" required className="w-full p-4 bg-background rounded-2xl outline-none focus:ring-2 focus:ring-primary text-white" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Password</label>
                <input type="password" required className="w-full p-4 bg-background rounded-2xl outline-none focus:ring-2 focus:ring-primary text-white" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <button type="submit" disabled={actionLoading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center">
                {actionLoading ? <Loader2 className="animate-spin" /> : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Manage Account</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-secondary hover:text-white"><X /></button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8 p-4 bg-background rounded-2xl">
                <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center text-xl font-bold border border-white/5 text-white">
                  {selectedUser.name.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-white leading-tight">{selectedUser.name}</p>
                  <p className="text-xs text-secondary font-bold uppercase tracking-wider">ID: {selectedUser.user_id}</p>
                </div>
              </div>

              {!isDeletingUser ? (
                <div className="space-y-4">
                  {!selectedUser.is_dummy && (
                    <>
                      <button onClick={() => handleToggleAdmin(selectedUser)} disabled={actionLoading} className="w-full p-4 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/5 text-left">
                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-secondary">
                          {selectedUser.administrator ? <ShieldOff size={20} /> : <Shield size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{selectedUser.administrator ? 'Revoke Admin' : 'Make Administrator'}</p>
                          <p className="text-xs text-secondary font-medium">System-wide permissions</p>
                        </div>
                      </button>
                      <form onSubmit={handleOverridePassword} className="p-4 border border-white/5 rounded-2xl space-y-3">
                        <p className="font-bold text-white text-sm">Override Password</p>
                        <div className="flex gap-2">
                          <input type="password" required placeholder="New password..." className="flex-1 p-2 bg-background rounded-lg text-xs text-white" value={overridePassword} onChange={(e) => setOverridePassword(e.target.value)} />
                          <button type="submit" disabled={actionLoading || !overridePassword} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">Set</button>
                        </div>
                      </form>
                      <button onClick={() => setIsDeletingUser(true)} className="w-full p-4 border border-transparent hover:bg-error/10 rounded-2xl flex items-center gap-4 text-left group">
                        <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center group-hover:bg-error group-hover:text-white">
                          <Trash2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white">Delete Account</p>
                          <p className="text-xs text-secondary font-medium">Permanently remove user</p>
                        </div>
                      </button>
                    </>
                  )}
                  {selectedUser.is_dummy && (
                    <p className="text-sm text-secondary text-center p-4">Legacy record. Use Cleanup to remove if unreferenced.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error flex gap-3">
                    <AlertTriangle className="shrink-0" />
                    <div><p className="font-bold">Dangerous Action!</p><p className="text-xs">This cannot be undone.</p></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsDeletingUser(false)} className="flex-1 py-3 bg-background text-white font-bold rounded-xl">Cancel</button>
                    <button onClick={() => handleDeleteUser(selectedUser)} disabled={actionLoading} className="flex-1 py-3 bg-error text-white font-bold rounded-xl">{actionLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Delete User'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTools;
