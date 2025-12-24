import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Trash2, Calendar, User, FileText, Info, DollarSign, Loader2, Check, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

const MoneyFlowPage = () => {
  const { user } = useAuthStore();
  const [balances, setBalances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newPayment, setNewPayment] = useState({
    payer_user_id: user?.user_id || '',
    receiver_user_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, payRes, userRes] = await Promise.all([
        api.get('/payments/balances'),
        api.get('/payments/'),
        api.get('/purchases/users/all')
      ]);
      setBalances(balRes.data);
      setPayments(payRes.data);
      setAllUsers(userRes.data);
    } catch (err) {
      console.error('Failed to fetch money flow data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    if (newPayment.payer_user_id === newPayment.receiver_user_id) {
        alert("Sender and Receiver cannot be the same person.");
        setActionLoading(false);
        return;
    }

    try {
      await api.post('/payments/', {
        ...newPayment,
        payer_user_id: parseInt(newPayment.payer_user_id),
        receiver_user_id: parseInt(newPayment.receiver_user_id),
        amount: parseFloat(newPayment.amount)
      });
      setShowPaymentModal(false);
      setNewPayment({
        payer_user_id: user?.user_id || '',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-deep-blue dark:text-dark-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-charcoal-gray dark:text-dark-text flex items-center gap-3">
          <ArrowRightLeft className="text-deep-blue dark:text-dark-primary" size={32} />
          Money Flow
        </h1>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-deep-blue dark:bg-dark-primary text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balances Section */}
        <section className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-charcoal-gray dark:text-dark-text px-2">Net Balances</h2>
          <div className="space-y-3">
            {balances.length > 0 ? balances.map((bal, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-surface p-5 rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-400 dark:text-dark-text-secondary uppercase tracking-wider">{bal.user_a_name} owes</span>
                  <span className="text-xl font-black text-alert-red dark:text-red-400">{bal.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-charcoal-gray dark:text-dark-text font-bold">
                  <span>to</span>
                  <div className="px-3 py-1 bg-blue-50 dark:bg-dark-primary/20 text-deep-blue dark:text-dark-primary rounded-full text-sm">
                    {bal.user_b_name}
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-gray-50 dark:bg-dark-surface p-8 rounded-3xl border border-dashed border-gray-200 dark:border-dark-border text-center">
                <p className="text-gray-400 dark:text-dark-text-secondary italic">No outstanding balances!</p>
              </div>
            )}
          </div>
        </section>

        {/* Payments History Section */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-charcoal-gray dark:text-dark-text px-2">Payment Tracker</h2>
          <div className="space-y-3">
            {payments.length > 0 ? payments.map((p) => (
              <div key={p.payment_id} className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center gap-4 group">
                <div className={`p-3 rounded-full ${p.payer_user_id === user.user_id ? 'bg-blue-50 dark:bg-dark-primary/20 text-deep-blue dark:text-dark-primary' : 'bg-green-50 dark:bg-green-900/20 text-vibrant-green dark:text-green-400'}`}>
                  {p.payer_user_id === user.user_id ? <ArrowRightLeft size={24} /> : <Check size={24} />}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-charcoal-gray dark:text-dark-text">
                      {p.payer_user_id === user.user_id ? `${user.name} (You)` : allUsers.find(u => u.user_id === p.payer_user_id)?.name} 
                      {' paid '} 
                      {p.receiver_user_id === user.user_id ? `${user.name} (You)` : allUsers.find(u => u.user_id === p.receiver_user_id)?.name}
                    </p>
                    <span className="font-black text-vibrant-green dark:text-green-400">{p.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-gray-400 dark:text-dark-text-secondary flex items-center gap-1">
                      <Calendar size={12} /> {p.payment_date}
                    </span>
                    <span className="text-xs text-deep-blue/60 dark:text-dark-primary/60 flex items-center gap-1 bg-blue-50 dark:bg-dark-primary/20 px-2 py-0.5 rounded-full font-medium">
                      <User size={10} /> Created by: {p.creator_user_id === user.user_id ? `${user.name} (You)` : allUsers.find(u => u.user_id === p.creator_user_id)?.name || 'System'}
                    </span>
                    {p.note && (
                      <span className="text-xs text-gray-400 dark:text-dark-text-secondary flex items-center gap-1">
                        <FileText size={12} /> {p.note}
                      </span>
                    )}
                  </div>
                </div>
                {(p.payer_user_id === user.user_id || p.receiver_user_id === user.user_id || user.administrator) && (
                  <button 
                    onClick={() => handleDeletePayment(p.payment_id)}
                    className="p-2 text-gray-300 dark:text-dark-text-secondary hover:text-alert-red dark:hover:text-red-400 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )) : (
              <div className="bg-gray-50 dark:bg-dark-surface p-12 rounded-3xl border border-dashed border-gray-200 dark:border-dark-border text-center">
                <p className="text-gray-400 dark:text-dark-text-secondary italic">No payments recorded yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-gray/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-dark-border">
            <div className="p-6 border-b border-gray-50 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-surface-hover">
              <h2 className="text-xl font-bold text-charcoal-gray dark:text-dark-text flex items-center gap-2">
                <DollarSign size={20} className="text-deep-blue dark:text-dark-primary" />
                Record a Payment
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 dark:text-dark-text-secondary hover:text-charcoal-gray dark:hover:text-dark-text transition"><X /></button>
            </div>
            <form onSubmit={handleCreatePayment} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-charcoal-gray dark:text-dark-text mb-2">From (Sender)</label>
                  <select
                    required
                    className="w-full p-3 bg-light-gray dark:bg-dark-bg rounded-xl outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    value={newPayment.payer_user_id}
                    onChange={(e) => {
                        const newPayerId = parseInt(e.target.value);
                        setNewPayment(prev => ({
                            ...prev, 
                            payer_user_id: newPayerId,
                            // If sender is not You, Receiver MUST be You
                            receiver_user_id: newPayerId !== user.user_id ? user.user_id : ''
                        }));
                    }}
                  >
                    <option value={user.user_id}>{user.name} (You)</option>
                    {allUsers.filter(u => u.user_id !== user.user_id).map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-charcoal-gray dark:text-dark-text mb-2">To (Receiver)</label>
                  <select
                    required
                    className="w-full p-3 bg-light-gray dark:bg-dark-bg rounded-xl outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    value={newPayment.receiver_user_id}
                    onChange={(e) => setNewPayment({...newPayment, receiver_user_id: parseInt(e.target.value)})}
                  >
                    <option value="">Select Receiver</option>
                    {/* If current user is not sender, they MUST be the receiver */}
                    {parseInt(newPayment.payer_user_id) !== user.user_id ? (
                        <option value={user.user_id}>{user.name} (You)</option>
                    ) : (
                        // If current user is the sender, they can pick anyone else
                        allUsers.filter(u => u.user_id !== user.user_id).map(u => (
                            <option key={u.user_id} value={u.user_id}>{u.name}</option>
                        ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-charcoal-gray dark:text-dark-text mb-2">Amount</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-3 bg-light-gray dark:bg-dark-bg rounded-xl outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-charcoal-gray dark:text-dark-text mb-2">Date</label>
                  <input
                    required
                    type="date"
                    className="w-full p-3 bg-light-gray dark:bg-dark-bg rounded-xl outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    value={newPayment.payment_date}
                    onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-charcoal-gray dark:text-dark-text mb-2">Note (Optional)</label>
                  <textarea
                    className="w-full p-3 bg-light-gray dark:bg-dark-bg rounded-xl outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    placeholder="What's this for?"
                    rows="2"
                    value={newPayment.note}
                    onChange={(e) => setNewPayment({...newPayment, note: e.target.value})}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-4 bg-deep-blue dark:bg-dark-primary text-white font-bold rounded-2xl hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Confirm Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyFlowPage;
