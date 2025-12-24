import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Calendar, Receipt, ChevronRight, User } from 'lucide-react';
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
        const response = await api.get('/purchases/', {
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
    return purchase.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-charcoal-gray dark:text-dark-text">Purchase Archive</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary" size={18} />
            <input
              type="text"
              placeholder="Search by title..."
              className="pl-10 pr-4 py-3 md:py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary w-full sm:w-64 text-charcoal-gray dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-secondary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary" size={18} />
            <select
              className="pl-10 pr-8 py-3 md:py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg outline-none focus:ring-2 focus:ring-deep-blue dark:focus:ring-dark-primary appearance-none text-charcoal-gray dark:text-dark-text"
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
            <div key={i} className="h-48 bg-white/50 dark:bg-dark-surface/50 rounded-xl animate-pulse border border-gray-100 dark:border-dark-border shadow-sm"></div>
          ))}
        </div>
      ) : purchases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((p) => (
            <Link
              key={p.purchase_id}
              to={`/edit-purchase/${p.purchase_id}`}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-dark-border hover:border-deep-blue/20 dark:hover:border-dark-primary/40 hover:shadow-md transition flex flex-col overflow-hidden group"
            >
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-light-gray dark:bg-dark-bg rounded-lg flex items-center justify-center text-deep-blue dark:text-dark-primary group-hover:bg-blue-50 dark:group-hover:bg-dark-primary/20 transition">
                    <Receipt size={20} />
                  </div>
                  <div className="text-right">
                  <div className="text-xl font-bold text-deep-blue dark:text-dark-primary flex items-center justify-end">
                    {calculateTotal(p)}
                  </div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-dark-text-secondary font-bold">Total</p>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-charcoal-gray dark:text-dark-text mb-1 line-clamp-1 group-hover:text-deep-blue dark:group-hover:text-dark-primary transition">
                  {p.purchase_name}
                </h3>

                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-dark-text-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(p.purchase_date).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-gray-500 dark:text-dark-text-secondary">
                    {p.items?.length || 0} items
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 dark:bg-dark-surface-hover border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-dark-text-secondary">
                  <User size={14} className="text-gray-400 dark:text-dark-text-secondary" />
                  <span>Paid by <span className="text-charcoal-gray dark:text-dark-text font-bold">Payer {p.payer_user_id}</span></span>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-dark-text-secondary group-hover:text-deep-blue dark:group-hover:text-dark-primary transition" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-dark-border shadow-inner">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 dark:bg-dark-bg text-gray-300 dark:text-dark-text-secondary rounded-full mb-6">
            <Search size={40} />
          </div>
          <p className="text-gray-500 dark:text-dark-text-secondary text-lg font-medium">No purchases found matching your search.</p>
          <p className="text-sm text-gray-400 dark:text-dark-text-secondary mt-2">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseList;
