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
    return purchase.items.reduce((acc, item) => acc + (item.price * item.quantity) - item.discount, 0).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-white">Purchase Archive</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by title..."
                className="pl-9 pr-3 py-2 bg-surface border border-white/5 rounded-lg outline-none focus:ring-2 focus:ring-primary w-full sm:w-56 text-white placeholder:text-secondary text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" size={14} />
            <select
              className="pl-8 pr-6 py-2 bg-surface border border-white/5 rounded-lg outline-none focus:ring-2 focus:ring-primary appearance-none text-white text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 md:h-20 bg-surface rounded-xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : purchases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {purchases.map((p) => (
            <Link
              key={p.purchase_id}
              to={`/edit-purchase/${p.purchase_id}`}
              className="bg-surface rounded-xl md:rounded-2xl shadow-sm border border-white/5 hover:border-primary/40 hover:shadow-md transition flex group"
            >
              <div className="p-3 md:p-4 flex-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <Receipt size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-primary transition">
                        {p.purchase_name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-secondary mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} />
                          {new Date(p.purchase_date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{p.items?.length || 0} items</span>
                        {p.images?.length > 0 && <Paperclip size={10} className="text-tertiary" />}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-bold text-white">€{calculateTotal(p)}</div>
                      <div className="text-[9px] text-secondary">Paid by {p.payer_name || 'Deleted'}</div>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-secondary/30 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-white/10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-background text-secondary rounded-full mb-3">
            <Search size={22} />
          </div>
          <p className="text-white text-sm font-medium">No purchases found.</p>
          <p className="text-xs text-secondary mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseList;
