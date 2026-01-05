import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter,
  X,
  LayoutDashboard,
  TrendingUp, 
  ShoppingBag, 
  Calculator,
  Save,
  FolderOpen
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
import useProjectStore from '../store/projectStore';

// Theme constants
const COLORS = {
  primary: '#3B82F6',
  info: '#60A5FA',
  textSecondary: '#9CA3AF',
  grid: '#334155',
  surface: '#151921'
};

const SankeyNode = ({ x, y, width, height, index, payload, containerWidth }) => {
  const isOut = x + width + 6 > containerWidth;

  return (
    <Layer key={`sankey-node-${index}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS.info}
        fillOpacity="0.8"
      />
      <text
        x={x + (isOut ? -6 : width + 6)}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        verticalAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill={COLORS.textSecondary}
      >
        {payload.name.replace(/^L\d: |^Item: /, '')}
        <tspan fill={COLORS.info} dx="5">
          ({payload.value.toFixed(2)})
        </tspan>
      </text>
    </Layer>
  );
};

const AnalyticsPage = () => {
  const { projects, fetchProjects } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState('cumulative');
  const [scope, setScope] = useState('personal'); // 'personal' or 'total'
  const [stats, setStats] = useState({
    summary: { total_spending: 0, personal_spending: 0, num_purchases: 0, avg_cost: 0, personal_avg_cost: 0 },
    chart_data: [],
    personal_chart_data: [],
    sankey_data: [],
    personal_sankey_data: []
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [newFilterName, setNewFilterName] = useState('');
  const [showSaveFilter, setShowSaveFilter] = useState(false);

  const [filters, setFilters] = useState({
    time_frame: 'year',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    search: '',
    item_search: '',
    cat1: '',
    cat2: '',
    cat3: '',
    project_id: '' // Empty string for All
  });

  const getCumulativeData = (data) => {
    if (!data) return [];
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
      const params = { ...filters };
      if (params.project_id === '') delete params.project_id;
      
      const response = await api.get('/purchases/stats/analytics', { params });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProjects();
    fetchSavedFilters();
    handleAnalyze();
  }, []);

  const fetchSavedFilters = async () => {
    try {
      const res = await api.get('/analytics/filters');
      setSavedFilters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFilter = async () => {
    if (!newFilterName) return;
    try {
      await api.post('/analytics/filters', {
        name: newFilterName,
        configuration: filters
      });
      setNewFilterName('');
      setShowSaveFilter(false);
      fetchSavedFilters();
    } catch (err) {
      alert("Failed to save filter");
    }
  };

  const loadFilter = (filter) => {
    setFilters(filter.configuration);
    // Trigger analyze? Or let useEffect depend on filters? 
    // Usually explicit trigger is better to avoid bouncing.
    // But we need to update UI. 
    // We can call handleAnalyze() after state update if we use a ref or effect.
    // For simplicity, let's just set state and user clicks Analyze, or use effect on filters?
    // Let's stick to manual Analyze click to be safe, or call handleAnalyze with new filters.
    // Actually, setting state is async.
  };

  // Refetch when project changes (optional, or user clicks analyze)
  // Let's make Analyze button primary action.

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCumulative = viewType === 'cumulative';
      
      return (
        <div className="bg-surface p-3 border border-white/5 shadow-xl rounded-lg min-w-[180px]">
          <p className="text-[10px] uppercase font-bold text-secondary mb-1">
            {new Date(data.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>
          
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-xs text-secondary">{isCumulative ? 'Total to date:' : 'Daily cost:'}</span>
            <span className="text-xl font-bold text-primary">{data.cost.toFixed(2)}</span>
          </div>

          {isCumulative && data.daily_cost !== undefined && (
            <div className="flex justify-between items-baseline gap-4 mt-1">
              <span className="text-xs text-secondary">Spend this day:</span>
              <span className="text-sm font-bold text-white">{data.daily_cost.toFixed(2)}</span>
            </div>
          )}

          {data.purchases && data.purchases.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase font-bold text-secondary mb-1">Purchases Breakdown</p>
              {data.purchases.map((p, i) => (
                <div key={i} className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-white truncate">• {p.name}</span>
                  <span className="font-bold text-primary">{p.cost.toFixed(2)}</span>
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
        fixed inset-0 z-[100] lg:z-40 lg:relative lg:bg-transparent lg:block lg:w-72 lg:inset-auto
        ${showFilters ? 'flex items-center justify-center p-4' : 'hidden'}
      `}>
        {/* Mobile Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md lg:hidden"
          onClick={() => setShowFilters(false)}
        />
        
        <div className="w-full max-w-sm flex flex-col relative z-10 pointer-events-none lg:h-full lg:p-0">
          <div className="bg-surface p-6 rounded-[2.5rem] shadow-2xl space-y-6 pointer-events-auto border border-white/10 relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] lg:max-h-none custom-scrollbar">
            {/* Close Button Inside Card (Mobile Only) */}
            <button 
              onClick={() => setShowFilters(false)}
              className="lg:hidden absolute -top-2 -right-2 p-3 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
              aria-label="Close filters"
            >
              <X size={20} strokeWidth={3} />
            </button>

            <div className="flex items-center justify-between text-primary font-bold mb-2">
              <div className="flex items-center gap-2">
                <Filter size={20} />
                <span className="text-lg">Filters</span>
              </div>
              <button 
                onClick={() => setShowSaveFilter(!showSaveFilter)} 
                className="text-xs bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white transition"
                title="Save current filter"
              >
                <Save size={16} />
              </button>
            </div>

            {showSaveFilter && (
              <div className="bg-white/5 p-3 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Filter Name" 
                  className="w-full p-2 bg-background rounded-lg text-xs text-white outline-none"
                  value={newFilterName}
                  onChange={e => setNewFilterName(e.target.value)}
                />
                <button 
                  onClick={handleSaveFilter}
                  disabled={!newFilterName}
                  className="w-full py-1.5 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}

            {savedFilters.length > 0 && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Saved Filters</label>
                <select 
                  className="w-full p-2 bg-background rounded-md text-sm outline-none text-white appearance-none cursor-pointer"
                  onChange={(e) => {
                    const filter = savedFilters.find(f => f.filter_id.toString() === e.target.value);
                    if (filter) loadFilter(filter);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Load a filter...</option>
                  {savedFilters.map(f => (
                    <option key={f.filter_id} value={f.filter_id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            <hr className="border-white/5" />

            {/* Project Selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Project</label>
              <select 
                className="w-full p-2 bg-background rounded-md text-sm outline-none text-white appearance-none cursor-pointer"
                value={filters.project_id}
                onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Time Frame</label>
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
                      ${filters.time_frame === tf.id ? 'bg-primary text-white' : 'bg-background text-secondary hover:bg-background/80'}
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
                    className="w-full p-2 bg-background rounded-md text-xs outline-none text-white"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                  <input
                    type="date"
                    className="w-full p-2 bg-background rounded-md text-xs outline-none text-white"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </div>
              )}

              {filters.time_frame === 'month' && (
                <input
                  type="month"
                  className="mt-3 w-full p-2 bg-background rounded-md text-sm outline-none text-white"
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
                  className="mt-3 w-full p-2 bg-background rounded-md text-sm outline-none text-white"
                  value={filters.start_date.substring(0, 4)}
                  onChange={(e) => setFilters({ ...filters, start_date: `${e.target.value}-01-01` })}
                />
              )}
            </div>

            {/* Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Search Title</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    placeholder="Purchase name..."
                    className="w-full pl-9 pr-3 py-2 bg-background rounded-md text-sm outline-none focus:ring-1 focus:ring-primary text-white"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-2">Search Items</label>
                <div className="relative">
                  <ShoppingBag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    placeholder="Item name (e.g. Milk)..."
                    className="w-full pl-9 pr-3 py-2 bg-background rounded-md text-sm outline-none focus:ring-1 focus:ring-primary text-white"
                    value={filters.item_search}
                    onChange={(e) => setFilters({ ...filters, item_search: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-secondary mb-1">Categories</label>
              <input
                type="text"
                placeholder="Category 1"
                className="w-full p-2 bg-background rounded-md text-sm outline-none text-white"
                value={filters.cat1}
                onChange={(e) => setFilters({ ...filters, cat1: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category 2"
                className="w-full p-2 bg-background rounded-md text-sm outline-none text-white"
                value={filters.cat2}
                onChange={(e) => setFilters({ ...filters, cat2: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category 3"
                className="w-full p-2 bg-background rounded-md text-sm outline-none text-white"
                value={filters.cat3}
                onChange={(e) => setFilters({ ...filters, cat3: e.target.value })}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow space-y-6 lg:space-y-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <LayoutDashboard className="text-primary" size={28} />
              Analytics
            </h1>
            
            <button 
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-surface border border-white/5 rounded-xl text-xs font-bold text-white active:scale-95 transition"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Scope Toggle */}
            <div className="bg-surface border border-white/5 rounded-xl p-1 flex w-full sm:w-auto">
              <button
                onClick={() => setScope('personal')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold transition ${scope === 'personal' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:bg-white/5'}`}
              >
                My Share
              </button>
              <button
                onClick={() => setScope('total')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold transition ${scope === 'total' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:bg-white/5'}`}
              >
                Total
              </button>
            </div>

            {/* View Type Toggle */}
            <div className="bg-surface border border-white/5 rounded-xl p-1 flex w-full sm:w-auto">
              <button
                onClick={() => setViewType('cumulative')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold transition ${viewType === 'cumulative' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:bg-white/5'}`}
              >
                Cumulative
              </button>
              <button
                onClick={() => setViewType('individual')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold transition ${viewType === 'individual' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:bg-white/5'}`}
              >
                Individual
              </button>
              <button
                onClick={() => setViewType('sankey')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold transition ${viewType === 'sankey' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:bg-white/5'}`}
              >
                Flow
              </button>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-3xl shadow-sm flex items-center gap-4 border border-white/5 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity`} />
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary relative z-10">
              <TrendingUp size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-wider font-bold text-secondary">
                {scope === 'personal' ? 'My Contributions' : 'Total Spending'}
              </p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {(scope === 'personal' ? stats.summary.personal_spending : stats.summary.total_spending).toFixed(2)}€
              </p>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-3xl shadow-sm flex items-center gap-4 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-success opacity-0 group-hover:opacity-[0.02] transition-opacity" />
            <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center text-success relative z-10">
              <ShoppingBag size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-wider font-bold text-secondary">Purchases</p>
              <p className="text-2xl font-bold text-white tracking-tight">{stats.summary.num_purchases}</p>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-3xl shadow-sm flex items-center gap-4 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-[0.02] transition-opacity" />
            <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-400 relative z-10">
              <Calculator size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-wider font-bold text-secondary">
                {scope === 'personal' ? 'My Avg. Cost' : 'Avg. Purchase'}
              </p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {(scope === 'personal' ? stats.summary.personal_avg_cost : stats.summary.avg_cost).toFixed(2)}€
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <section className="bg-surface p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">
              {viewType === 'cumulative' ? 'Cumulative Spending' : 'Purchase Distribution'}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-full text-xs font-bold text-secondary">
              {viewType === 'cumulative' ? (
                <><TrendingUp size={14} className="text-primary" /><span>Accumulated running total</span></>
              ) : (
                <><BarChart3 size={14} className="text-primary" /><span>Individual transactions</span></>
              )}
            </div>
          </div>

          <div className="h-[400px] w-full text-xs overflow-x-auto">
            <div className="min-w-[600px] h-full">
                <ResponsiveContainer width="100%" height="100%">
                {viewType === 'cumulative' ? (
                    <AreaChart data={getCumulativeData(scope === 'personal' ? stats.personal_chart_data : stats.chart_data)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={COLORS.info} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                    <XAxis 
                        dataKey="date" 
                        stroke={COLORS.textSecondary}
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                        stroke={COLORS.textSecondary}
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="cost" 
                        stroke={COLORS.info}
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCost)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    </AreaChart>
                ) : viewType === 'individual' ? (
                    <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                    <XAxis 
                        dataKey="date" 
                        name="Date" 
                        stroke={COLORS.textSecondary}
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        type="category"
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                        dataKey="cost" 
                        name="Cost" 
                        stroke={COLORS.textSecondary}
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Purchases" data={scope === 'personal' ? stats.personal_chart_data : stats.chart_data}>
                        {(scope === 'personal' ? stats.personal_chart_data : stats.chart_data).map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS.info}
                            fillOpacity={0.6} 
                            stroke={COLORS.info}
                            strokeWidth={2} 
                        />
                        ))}
                    </Scatter>
                    </ScatterChart>
                ) : (
                    <Sankey
                    data={(() => {
                        const data = scope === 'personal' ? stats.personal_sankey_data : stats.sankey_data;
                        const nodes_set = new Set();
                        data.forEach(l => {
                        nodes_set.add(l.source);
                        nodes_set.add(l.target);
                        });
                        const nodes = Array.from(nodes_set).map(name => ({ name }));
                        const links = data.map(l => ({
                        source: nodes.findIndex(n => n.name === l.source),
                        target: nodes.findIndex(n => n.name === l.target),
                        value: l.value
                        }));
                        return { nodes, links };
                    })()}
                    margin={{ top: 20, left: 20, right: 150, bottom: 20 }}
                    nodePadding={30}
                    link={{ stroke: COLORS.info, strokeOpacity: 0.1 }}
                    node={<SankeyNode containerWidth={1000} />}
                    >
                    <Tooltip 
                        content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                            <div className="bg-white p-2 border border-gray-100 shadow-lg rounded text-[10px]">
                                <p className="font-bold">{payload[0].payload.name}</p>
                                <p className="text-primary">{payload[0].value.toFixed(2)}</p>
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
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalyticsPage;
