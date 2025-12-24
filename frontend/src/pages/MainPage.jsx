import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scan, PlusCircle, Clock, ChevronRight, Receipt, Calendar } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const MainPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get('/purchases/recent');
        setRecentPurchases(response.data);
      } catch (err) {
        console.error('Failed to fetch recent purchases', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const calculateTotal = (purchase) => {
    return purchase.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Primary Action Hub */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-charcoal-gray">
          What would you like to do?
        </h1>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link
            to="/scan"
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group w-full sm:w-64"
          >
            <div className="w-16 h-16 bg-blue-50 text-deep-blue rounded-full flex items-center justify-center mb-4 group-hover:bg-deep-blue group-hover:text-white transition duration-300">
              <Scan size={32} />
            </div>
            <span className="font-bold text-deep-blue text-lg">Scan Receipt</span>
            <p className="text-xs text-gray-400 mt-2">Upload and extract data</p>
          </Link>

          <Link
            to="/create-purchase"
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group w-full sm:w-64"
          >
            <div className="w-16 h-16 bg-green-50 text-vibrant-green rounded-full flex items-center justify-center mb-4 group-hover:bg-vibrant-green group-hover:text-white transition duration-300">
              <PlusCircle size={32} />
            </div>
            <span className="font-bold text-vibrant-green text-lg">Create Purchase</span>
            <p className="text-xs text-gray-400 mt-2">Manual entry workflow</p>
          </Link>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-charcoal-gray flex items-center gap-2">
            <Clock size={20} className="text-deep-blue" />
            Recent Purchases
          </h2>
          <Link to="/purchases" className="text-sm font-bold text-deep-blue hover:underline">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/50 rounded-xl animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : recentPurchases.length > 0 ? (
          <div className="space-y-4">
            {recentPurchases.map((p) => (
              <Link
                key={p.purchase_id}
                to={`/edit-purchase/${p.purchase_id}`}
                className="flex items-center justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-deep-blue/20 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-light-gray rounded-lg flex items-center justify-center text-deep-blue group-hover:bg-blue-50 transition">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal-gray group-hover:text-deep-blue transition">
                      {p.purchase_name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(p.purchase_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-gray-500">
                         {p.items?.length || 0} items
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-lg font-bold text-deep-blue flex items-center justify-end">
                      {calculateTotal(p)}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Amount</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-deep-blue transition" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 text-gray-300 rounded-full mb-4">
              <Receipt size={32} />
            </div>
            <p className="text-gray-500 font-medium">No recent purchases found.</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Ready to scan your first receipt?</p>
            <Link 
              to="/scan"
              className="inline-flex items-center gap-2 px-6 py-2 bg-deep-blue text-white rounded-md font-bold text-sm hover:opacity-90 transition"
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
