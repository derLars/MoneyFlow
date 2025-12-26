import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scan, PlusCircle, Clock, ChevronRight, Receipt, Calendar, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const MainPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, summaryRes] = await Promise.all([
          api.get('/purchases/recent'),
          api.get('/purchases/summary')
        ]);
        setRecentPurchases(recentRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateTotal = (purchase) => {
    if (!purchase.items) return "0.00";
    return purchase.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* KPI Section */}
      <section className="flex justify-center">
        <div className="bg-surface p-8 rounded-3xl shadow-sm border border-white/5 flex items-center gap-6 min-w-[300px] w-full sm:w-auto">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-secondary uppercase tracking-wider">My Spending (This Month)</p>
            <p className="text-4xl font-bold text-white mt-1">
              {loading ? "..." : `€${summary?.month_total?.toFixed(2) || "0.00"}`}
            </p>
          </div>
        </div>
      </section>

      {/* Primary Action Hub */}
      <section className="space-y-6">
        <h1 className="text-2xl font-bold text-white px-2">
          Quick Actions
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/scan"
            className="flex flex-col items-center justify-center p-8 bg-surface rounded-3xl shadow-sm border border-white/5 hover:bg-white/5 transition group active:scale-95"
          >
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 shadow-lg shadow-primary/20">
              <Scan size={32} />
            </div>
            <span className="font-bold text-white text-lg">Scan Receipt</span>
            <p className="text-xs text-secondary mt-2">Upload and extract data</p>
          </Link>

          <Link
            to="/create-purchase"
            className="flex flex-col items-center justify-center p-8 bg-surface rounded-3xl shadow-sm border border-white/5 hover:bg-white/5 transition group active:scale-95"
          >
            <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 shadow-lg shadow-success/20">
              <PlusCircle size={32} />
            </div>
            <span className="font-bold text-white text-lg">Create Purchase</span>
            <p className="text-xs text-secondary mt-2">Manual entry workflow</p>
          </Link>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Recent Purchases
          </h2>
          <Link to="/purchases" className="text-sm font-bold text-primary hover:text-white transition">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface rounded-3xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : recentPurchases.length > 0 ? (
          <div className="space-y-4">
            {recentPurchases.map((p) => (
              <Link
                key={p.purchase_id}
                to={`/edit-purchase/${p.purchase_id}`}
                className="flex items-center justify-between p-5 bg-surface rounded-3xl shadow-sm border border-white/5 hover:bg-white/5 active:scale-[0.98] transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-primary transition line-clamp-1">
                      {p.purchase_name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(p.purchase_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-tertiary">
                         {p.items?.length || 0} items
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white flex items-center justify-end">
                      {calculateTotal(p)}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-secondary font-bold">Total</p>
                  </div>
                  <ChevronRight size={20} className="text-secondary group-hover:text-primary transition" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-background text-secondary rounded-full mb-4">
              <Receipt size={32} />
            </div>
            <p className="text-white font-medium">No recent purchases found.</p>
            <p className="text-sm text-secondary mt-1 mb-6">Ready to scan your first receipt?</p>
            <Link 
              to="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default MainPage;
