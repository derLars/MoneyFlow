import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  ShoppingBag, 
  Calculator,
  Filter,
  X,
  LayoutDashboard
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Sankey,
  Layer
} from 'recharts';
import api from '../api/axios';

const SankeyNode = ({ x, y, width, height, index, payload, containerWidth }) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <Layer key={`sankey-node-${index}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#003366"
        fillOpacity="0.8"
      />
      <text
        x={x + (isOut ? -6 : width + 6)}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        verticalAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#475569"
      >
        {payload.name.replace(/^L\d: |^Item: /, '')}
        <tspan fill="#003366" dx="5">
          ({payload.value.toFixed(2)})
        </tspan>
      </text>
    </Layer>
  );
};

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState('cumulative');
  const [stats, setStats] = useState({
    summary: { total_spending: 0, num_purchases: 0, avg_cost: 0 },
    chart_data: [],
    scatter_data: [],
    sankey_data: []
  });

  const [filters, setFilters] = useState({
    time_frame: 'year',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    search: '',
    item_search: '',
    cat1: '',
    cat2: '',
    cat3: '',
  });

  const [categories, setCategories] = useState([]);

  const getCumulativeData = (data) => {
    let runningTotal = 0;
    return data.map(item => {
      runningTotal += item.cost;
      return {
        ...item,
        daily_cost: item.cost, // Store original for tooltip
        cost: runningTotal      // Update cost to cumulative for the chart
      };
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchases/stats/analytics', { params: filters });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleAnalyze();
  }, []);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/purchases/users/all'); // Placeholder for categories endpoint
        // In a real app, we'd have a specific endpoint for unique categories
      } catch (err) {}
    };
    fetchCats();
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCumulative = viewType === 'cumulative';
      
      return (
        <div className="bg-white dark:bg-dark-surface p-3 border border-gray-100 dark:border-dark-border shadow-xl rounded-lg min-w-[180px]">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-secondary mb-1">
            {new Date(data.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>
          
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-xs text-gray-500 dark:text-dark-text-secondary">{isCumulative ? 'Total to date:' : 'Daily cost:'}</span>
            <span className="text-xl font-bold text-deep-blue dark:text-dark-primary">{data.cost.toFixed(2)}</span>
          </div>

          {isCumulative && data.daily_cost !== undefined && (
            <div className="flex justify-between items-baseline gap-4 mt-1">
              <span className="text-xs text-gray-500 dark:text-dark-text-secondary">Spend this day:</span>
              <span className="text-sm font-bold text-charcoal-gray dark:text-dark-text">{data.daily_cost.toFixed(2)}</span>
            </div>
          )}

          {data.purchases && data.purchases.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Purchases Breakdown</p>
              {data.purchases.map((p, i) => (
                <div key={i} className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-charcoal-gray dark:text-dark-text truncate">• {p.name}</span>
                  <span className="font-bold text-deep-blue dark:text-dark-primary">{p.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto py-6">
      {/* Sidebar Filters */}
      <aside className={`
        fixed inset-0 z-50 bg-white dark:bg-dark-bg lg:relative lg:bg-transparent lg:block lg:w-72 lg:inset-auto
        ${showFilters ? 'block' : 'hidden'}
      `}>
        <div className="h-full flex flex-col p-6 lg:p-0">
          <div className="flex items-center justify-between lg:hidden mb-6">
            <h2 className="text-xl font-bold text-charcoal-gray dark:text-dark-text">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 dark:text-dark-text-secondary hover:text-charcoal-gray dark:hover:text-dark-text"><X /></button>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border space-y-6">
            <div className="flex items-center gap-2 text-deep-blue dark:text-dark-primary font-bold mb-2">
              <Filter size={18} />
              <span>Filters</span>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-2">Time Frame</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'period', label: 'Period' },
                  { id: 'month', label: 'Month' },
                  { id: 'year', label: 'Year' },
                  { id: 'all', label: 'All' }
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setFilters({ ...filters, time_frame: tf.id })}
                    className={`
                      px-3 py-2 rounded-md text-xs font-bold capitalize transition
                      ${filters.time_frame === tf.id ? 'bg-deep-blue dark:bg-dark-primary text-white' : 'bg-light-gray dark:bg-dark-bg text-gray-500 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-surface-hover'}
                    `}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {filters.time_frame === 'period' && (
                <div className="mt-3 space-y-2">
                  <input
                    type="date"
                    className="w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-xs outline-none text-charcoal-gray dark:text-dark-text"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                  <input
                    type="date"
                    className="w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-xs outline-none text-charcoal-gray dark:text-dark-text"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </div>
              )}

              {filters.time_frame === 'month' && (
                <input
                  type="month"
                  className="mt-3 w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none text-charcoal-gray dark:text-dark-text"
                  value={filters.start_date.substring(0, 7)}
                  onChange={(e) => setFilters({ ...filters, start_date: `${e.target.value}-01` })}
                />
              )}

              {filters.time_frame === 'year' && (
                <input
                  type="number"
                  placeholder="YYYY"
                  min="2000"
                  max="2100"
                  className="mt-3 w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none text-charcoal-gray dark:text-dark-text"
                  value={filters.start_date.substring(0, 4)}
                  onChange={(e) => setFilters({ ...filters, start_date: `${e.target.value}-01-01` })}
                />
              )}
            </div>

            {/* Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-2">Search Title</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary" />
                  <input
                    type="text"
                    placeholder="Purchase name..."
                    className="w-full pl-9 pr-3 py-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none focus:ring-1 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-2">Search Items</label>
                <div className="relative">
                  <ShoppingBag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-secondary" />
                  <input
                    type="text"
                    placeholder="Item name (e.g. Milk)..."
                    className="w-full pl-9 pr-3 py-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none focus:ring-1 focus:ring-deep-blue dark:focus:ring-dark-primary text-charcoal-gray dark:text-dark-text"
                    value={filters.item_search}
                    onChange={(e) => setFilters({ ...filters, item_search: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary mb-1">Categories</label>
              <input
                type="text"
                placeholder="Category 1"
                className="w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none text-charcoal-gray dark:text-dark-text"
                value={filters.cat1}
                onChange={(e) => setFilters({ ...filters, cat1: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category 2"
                className="w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none text-charcoal-gray dark:text-dark-text"
                value={filters.cat2}
                onChange={(e) => setFilters({ ...filters, cat2: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category 3"
                className="w-full p-2 bg-light-gray dark:bg-dark-bg rounded-md text-sm outline-none text-charcoal-gray dark:text-dark-text"
                value={filters.cat3}
                onChange={(e) => setFilters({ ...filters, cat3: e.target.value })}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 bg-deep-blue dark:bg-dark-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-charcoal-gray dark:text-dark-text flex items-center gap-3">
            <LayoutDashboard className="text-deep-blue dark:text-dark-primary" size={32} />
            Analytics
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-1 flex">
              <button
                onClick={() => setViewType('cumulative')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${viewType === 'cumulative' ? 'bg-deep-blue dark:bg-dark-primary text-white shadow-sm' : 'text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surface-hover'}`}
              >
                Cumulative
              </button>
              <button
                onClick={() => setViewType('individual')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${viewType === 'individual' ? 'bg-deep-blue dark:bg-dark-primary text-white shadow-sm' : 'text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surface-hover'}`}
              >
                Individual
              </button>
              <button
                onClick={() => setViewType('sankey')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${viewType === 'sankey' ? 'bg-deep-blue dark:bg-dark-primary text-white shadow-sm' : 'text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-surface-hover'}`}
              >
                Flow
              </button>
            </div>

            <button 
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm font-bold text-charcoal-gray dark:text-dark-text"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-dark-primary/20 rounded-xl flex items-center justify-center text-deep-blue dark:text-dark-primary">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary">Total Spending</p>
              <p className="text-2xl font-bold text-charcoal-gray dark:text-dark-text">{stats.summary.total_spending.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-vibrant-green dark:text-green-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary">Purchases</p>
              <p className="text-2xl font-bold text-charcoal-gray dark:text-dark-text">{stats.summary.num_purchases}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Calculator size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-dark-text-secondary">Avg. Cost</p>
              <p className="text-2xl font-bold text-charcoal-gray dark:text-dark-text">{stats.summary.avg_cost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <section className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-charcoal-gray dark:text-dark-text">
              {viewType === 'cumulative' ? 'Cumulative Spending' : 'Purchase Distribution'}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-light-gray dark:bg-dark-bg rounded-full text-xs font-bold text-gray-500 dark:text-dark-text-secondary">
              {viewType === 'cumulative' ? (
                <><TrendingUp size={14} className="text-deep-blue dark:text-dark-primary" /><span>Accumulated running total</span></>
              ) : (
                <><BarChart3 size={14} className="text-deep-blue dark:text-dark-primary" /><span>Individual transactions</span></>
              )}
            </div>
          </div>

          <div className="h-[400px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'cumulative' ? (
                <AreaChart data={getCumulativeData(stats.chart_data)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003366" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#003366" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94A3B8" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#003366" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCost)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              ) : viewType === 'individual' ? (
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    name="Date" 
                    stroke="#94A3B8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    type="category"
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    dataKey="cost" 
                    name="Cost" 
                    stroke="#94A3B8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Purchases" data={stats.chart_data}>
                    {stats.chart_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#003366" fillOpacity={0.6} stroke="#003366" strokeWidth={2} />
                    ))}
                  </Scatter>
                </ScatterChart>
              ) : (
                <Sankey
                  data={(() => {
                    const nodes_set = new Set();
                    stats.sankey_data.forEach(l => {
                      nodes_set.add(l.source);
                      nodes_set.add(l.target);
                    });
                    const nodes = Array.from(nodes_set).map(name => ({ name }));
                    const links = stats.sankey_data.map(l => ({
                      source: nodes.findIndex(n => n.name === l.source),
                      target: nodes.findIndex(n => n.name === l.target),
                      value: l.value
                    }));
                    return { nodes, links };
                  })()}
                  margin={{ top: 20, left: 20, right: 150, bottom: 20 }}
                  nodePadding={30}
                  link={{ stroke: '#003366', strokeOpacity: 0.1 }}
                  node={<SankeyNode containerWidth={1000} />}
                >
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-gray-100 shadow-lg rounded text-[10px]">
                            <p className="font-bold">{payload[0].payload.name}</p>
                            <p className="text-deep-blue">{payload[0].value.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </Sankey>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalyticsPage;
