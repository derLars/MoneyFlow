import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  ShieldOff, 
  Trash2, 
  MoreVertical, 
  X, 
  AlertTriangle,
  Loader2,
  Check,
  Plus,
  UserPlus
} from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const UserManagement = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    password: ''
  });

  const [overridePassword, setOverridePassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = async (user) => {
    setActionLoading(true);
    try {
      const newStatus = !user.administrator;
      await api.patch(`/auth/users/${user.user_id}/role`, null, {
        params: { is_admin: newStatus }
      });
      setUsers(users.map(u => u.user_id === user.user_id ? { ...u, administrator: newStatus } : u));
      setIsModalOpen(false);
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
      await api.delete(`/auth/users/${user.user_id}`);
      setUsers(users.filter(u => u.user_id !== user.user_id));
      setIsModalOpen(false);
      setIsDeleting(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const openManageModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setIsDeleting(false);
    setOverridePassword('');
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.password) return;

    setActionLoading(true);
    try {
      const response = await api.post('/auth/users', newUser);
      setUsers([...users, response.data]);
      setIsAddModalOpen(false);
      setNewUser({ name: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-deep-blue rounded-xl flex items-center justify-center text-white shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-charcoal-gray">User Management</h1>
            <p className="text-sm text-gray-400 font-medium">Manage permissions and system access</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-deep-blue text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition active:scale-95"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white/50 rounded-2xl animate-pulse border border-gray-100 shadow-sm"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.user_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-light-gray rounded-full flex items-center justify-center text-charcoal-gray font-bold text-lg">
                  {user.name.substring(0, 1).toUpperCase()}
                </div>
                {user.administrator ? (
                  <span className="px-3 py-1 bg-blue-50 text-deep-blue text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-blue-100">
                    <Shield size={12} />
                    Admin
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-gray-100">
                    User
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-charcoal-gray mb-6 truncate">{user.name}</h3>
              
              <button 
                onClick={() => openManageModal(user)}
                className="w-full py-2.5 bg-light-gray text-charcoal-gray font-bold text-sm rounded-xl hover:bg-deep-blue hover:text-white transition active:scale-95"
              >
                Manage User
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-gray/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal-gray">Create New Account</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-charcoal-gray transition"><X /></button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">User Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-light-gray rounded-2xl outline-none focus:ring-2 focus:ring-deep-blue border-none"
                  placeholder="Enter unique name..."
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Preliminary Password</label>
                <input
                  type="password"
                  required
                  className="w-full p-4 bg-light-gray rounded-2xl outline-none focus:ring-2 focus:ring-deep-blue border-none"
                  placeholder="Enter initial password..."
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-4 bg-deep-blue text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Management Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-gray/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal-gray">Manage Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-charcoal-gray transition"><X /></button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-2xl">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-xl font-bold border border-gray-100">
                  {selectedUser.name.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-charcoal-gray leading-tight">{selectedUser.name}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">ID: {selectedUser.user_id}</p>
                </div>
              </div>

              {!isDeleting ? (
                <div className="space-y-4">
                  <button
                    onClick={() => handleToggleAdmin(selectedUser)}
                    disabled={actionLoading}
                    className={`
                      w-full p-4 rounded-2xl flex items-center gap-4 transition group border-2
                      ${selectedUser.administrator 
                        ? 'border-gray-100 hover:border-alert-red hover:bg-red-50' 
                        : 'border-gray-100 hover:border-deep-blue hover:bg-blue-50'}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${selectedUser.administrator ? 'bg-gray-100 text-gray-400 group-hover:bg-alert-red group-hover:text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-deep-blue group-hover:text-white'}
                    `}>
                      {selectedUser.administrator ? <ShieldOff size={20} /> : <Shield size={20} />}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-charcoal-gray">{selectedUser.administrator ? 'Revoke Admin' : 'Make Administrator'}</p>
                      <p className="text-xs text-gray-400 font-medium">Change system-wide permissions</p>
                    </div>
                  </button>

                  <form onSubmit={handleOverridePassword} className="p-4 border-2 border-gray-100 rounded-2xl space-y-4">
                    <div className="text-left">
                      <p className="font-bold text-charcoal-gray text-sm">Override Password</p>
                      <p className="text-[10px] text-gray-400 font-medium mb-3">Set a new preliminary password</p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          required
                          placeholder="New password..."
                          className="flex-1 p-2 bg-light-gray rounded-lg text-xs outline-none focus:ring-1 focus:ring-deep-blue"
                          value={overridePassword}
                          onChange={(e) => setOverridePassword(e.target.value)}
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || !overridePassword}
                          className="px-4 py-2 bg-deep-blue text-white rounded-lg text-xs font-bold shadow hover:opacity-90 disabled:opacity-50"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </form>

                  <button
                    onClick={() => setIsDeleting(true)}
                    className="w-full p-4 border-2 border-transparent hover:border-alert-red/20 hover:bg-red-50 rounded-2xl flex items-center gap-4 transition group"
                  >
                    <div className="w-10 h-10 bg-red-50 text-alert-red rounded-xl flex items-center justify-center group-hover:bg-alert-red group-hover:text-white">
                      <Trash2 size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-charcoal-gray">Delete Account</p>
                      <p className="text-xs text-gray-400 font-medium">Permanently remove this user</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-200">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-alert-red">
                    <AlertTriangle className="shrink-0" size={24} />
                    <div>
                      <p className="font-bold">Dangerous Action!</p>
                      <p className="text-xs font-medium leading-relaxed opacity-80">This will delete all data for this user. This cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsDeleting(false)} 
                      className="flex-1 py-3 bg-gray-100 text-charcoal-gray font-bold rounded-xl hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(selectedUser)} 
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-alert-red text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Delete User'}
                    </button>
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

export default UserManagement;
