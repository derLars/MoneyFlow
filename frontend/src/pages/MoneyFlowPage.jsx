import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Trash2, Calendar, User, FileText, DollarSign, Loader2, Check, X } from 'lucide-react';
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
        api.get('/payments'),
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
      await api.post('/payments', {
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
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <ArrowRightLeft className="text-primary" size={22} />
          Money Flow
        </h1>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-md text-xs"
        >
          <Plus size={14} />
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Balances Section */}
        <section className="lg:col-span-1 space-y-3">
          <h2 className="text-sm md:text-base font-bold text-white">Net Balances</h2>
          <div className="space-y-1.5">
            {balances.length > 0 ? balances.map((bal, idx) => (
              <div key={idx} className="bg-surface p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{bal.user_a_name} owes</span>
                  <span className="text-base font-black text-error">€{bal.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white text-xs font-bold mt-0.5">
                  <span className="text-secondary font-normal">to</span>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-md text-[10px]">{bal.user_b_name}</span>
                </div>
              </div>
            )) : (
              <div className="bg-surface p-4 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-secondary italic text-xs">No outstanding balances!</p>
              </div>
            )}
          </div>
        </section>

        {/* Payments History Section */}
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-sm md:text-base font-bold text-white">Payment Tracker</h2>
          <div className="space-y-1.5">
            {payments.length > 0 ? payments.map((p) => (
              <div key={p.payment_id} className="bg-surface p-3 rounded-xl border border-white/5 flex items-center gap-3 group">
                <div className={`p-2 rounded-full flex-shrink-0 ${p.payer_user_id === user.user_id ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'}`}>
                  {p.payer_user_id === user.user_id ? <ArrowRightLeft size={16} /> : <Check size={16} />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs text-white truncate">
                      {p.payer_user_id === user.user_id ? `${user.name} (You)` : allUsers.find(u => u.user_id === p.payer_user_id)?.name} 
                      <span className="text-secondary font-normal mx-0.5">paid</span>
                      {p.receiver_user_id === user.user_id ? `${user.name} (You)` : allUsers.find(u => u.user_id === p.receiver_user_id)?.name}
                    </p>
                    <span className="font-black text-success text-sm flex-shrink-0">€{p.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-secondary">
                    <span>{p.payment_date}</span>
                    {p.note && <span>• {p.note}</span>}
                  </div>
                </div>
                {(p.payer_user_id === user.user_id || p.receiver_user_id === user.user_id || user.administrator) && (
                  <button onClick={() => handleDeletePayment(p.payment_id)} className="p-1 text-secondary hover:text-error transition flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )) : (
              <div className="bg-surface p-6 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-secondary italic text-xs">No payments recorded yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/5">
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
                  <select required className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                    value={newPayment.payer_user_id}
                    onChange={(e) => {
                        const id = parseInt(e.target.value);
                        setNewPayment(prev => ({...prev, payer_user_id: id, receiver_user_id: id !== user.user_id ? user.user_id : ''}));
                    }}>
                    <option value={user.user_id}>{user.name} (You)</option>
                    {allUsers.filter(u => u.user_id !== user.user_id).map(u => (<option key={u.user_id} value={u.user_id}>{u.name}</option>))}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">To (Receiver)</label>
                  <select required className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                    value={newPayment.receiver_user_id}
                    onChange={(e) => setNewPayment({...newPayment, receiver_user_id: parseInt(e.target.value)})}>
                    <option value="">Select</option>
                    {parseInt(newPayment.payer_user_id) !== user.user_id ? (
                        <option value={user.user_id}>{user.name} (You)</option>
                    ) : (
                        allUsers.filter(u => u.user_id !== user.user_id).map(u => (<option key={u.user_id} value={u.user_id}>{u.name}</option>))
                    )}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary font-bold text-sm">€</span>
                    <input required type="number" step="0.01" className="w-full pl-6 pr-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="0.00" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Date</label>
                  <input required type="date" className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary" value={newPayment.payment_date} onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Note</label>
                  <input className="w-full px-2.5 py-1.5 bg-background border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="What's this for?" value={newPayment.note} onChange={(e) => setNewPayment({...newPayment, note: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm">
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Confirm Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyFlowPage;
