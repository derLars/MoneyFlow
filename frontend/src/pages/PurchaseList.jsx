import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown, Calendar, Receipt, ChevronRight, User, Paperclip } from 'lucide-react';
import api from '../api/axios';

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      try {
        const response = await api.get('/purchases', {
          params: { search, sort_by: sortBy }
        });
        setPurchases(response.data);
      } catch (err) {
        console.error('Failed to fetch purchases', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPurchases();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, sortBy]);

  const calculateTotal = (purchase) => {
    if (!purchase.items) return "0.00";
    return purchase.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Purchase Archive</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
            <input
              type="text"
              placeholder="Search by title..."
              className="pl-10 pr-4 py-3 md:py-2 bg-surface border border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-primary w-full sm:w-64 text-white placeholder:text-secondary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
            <select
              className="pl-10 pr-8 py-3 md:py-2 bg-surface border border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-primary appearance-none text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="total_desc">Highest Price</option>
              <option value="total_asc">Lowest Price</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-surface rounded-3xl animate-pulse border border-white/5 shadow-sm"></div>
          ))}
        </div>
      ) : purchases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((p) => (
            <Link
              key={p.purchase_id}
              to={`/edit-purchase/${p.purchase_id}`}
              className="bg-surface rounded-3xl shadow-sm border border-white/5 hover:border-primary/40 hover:shadow-md transition flex flex-col overflow-hidden group"
            >
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition">
                    <Receipt size={24} />
                  </div>
                  <div className="text-right">
                  <div className="text-2xl font-bold text-white flex items-center justify-end">
                    {calculateTotal(p)}
                  </div>
                    <p className="text-[10px] uppercase tracking-wider text-secondary font-bold">Total</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-white line-clamp-1 group-hover:text-primary transition">
                    {p.purchase_name}
                  </h3>
                  {p.images && p.images.length > 0 && (
                    <Paperclip size={16} className="text-secondary" title="Receipt images attached" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(p.purchase_date).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-tertiary">
                    {p.items?.length || 0} items
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                  <User size={14} className="text-secondary" />
                  <span>Paid by <span className="text-white font-bold">{p.payer_name || 'Deleted account'}</span></span>
                </div>
                <ChevronRight size={16} className="text-secondary group-hover:text-primary transition" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-white/10 shadow-inner">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-background text-secondary rounded-full mb-6">
            <Search size={40} />
          </div>
          <p className="text-white text-lg font-medium">No purchases found matching your search.</p>
          <p className="text-sm text-secondary mt-2">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseList;
