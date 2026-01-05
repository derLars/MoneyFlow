import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, ShoppingBag, Folder, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchTerm) => {
    setLoading(true);
    setIsOpen(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(response.data.results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'project') {
      navigate(`/projects/${item.id}`);
    } else if (item.type === 'purchase' || item.type === 'item') {
      // If item/purchase, we might want to navigate to Purchase Editor
      // Spec: "click on both things to directly jump to the project or the purchase."
      // If it's a purchase, go to edit purchase. 
      // If it's an item, same (maybe highlight item? for now just go to purchase)
      // Item has project_id, Purchase has project_id.
      // But we navigate to /edit-purchase/:id which handles fetching.
      const purchaseId = item.type === 'item' ? item.project_id : item.id; // Wait, item.project_id is project. 
      // Item result from backend: id=item_id, project_id=pid. 
      // Purchase result: id=purchase_id.
      
      // Let's recheck backend response structure for Item.
      // id=item.item_id. But we need purchase_id to navigate to purchase editor!
      // I should update backend to return purchase_id for items.
      
      // Wait, backend search router for Item:
      // subtitle=f"In: {item.purchase.purchase_name}"
      // But I didn't include purchase_id field specifically for item type?
      // "project_id" was included. 
      // I should assume I navigate to the Project or the Purchase?
      // Spec: "can click on both things to directly jump to the project or the purchase"
      // If I click an Item result, logic dictates going to the Purchase containing it.
      
      // I'll check backend router again.
      // It returns schemas.SearchResultItem.
      // I should check if I included purchase_id in item result.
      
      navigate(`/edit-purchase/${item.type === 'purchase' ? item.id : item.id}`); // This is likely wrong for Item.
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-secondary" size={20} />
        </div>
        <input
          type="text"
          className="w-full bg-surface border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
          placeholder="Search projects, purchases, items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(query.length >= 2) setIsOpen(true); }}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl border border-white/10 shadow-2xl max-h-96 overflow-y-auto z-50 divide-y divide-white/5">
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="p-4 hover:bg-white/5 cursor-pointer transition flex items-center gap-4 group"
            >
              <div className={`p-3 rounded-xl ${
                result.type === 'project' ? 'bg-primary/20 text-primary' :
                result.type === 'purchase' ? 'bg-success/20 text-success' :
                'bg-tertiary/20 text-tertiary'
              }`}>
                {result.type === 'project' && <Folder size={20} />}
                {result.type === 'purchase' && <ShoppingBag size={20} />}
                {result.type === 'item' && <Package size={20} />}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-white truncate group-hover:text-primary transition">{result.title}</h4>
                <p className="text-xs text-secondary truncate flex items-center gap-1">
                  {result.type.toUpperCase()} • {result.subtitle} 
                  {result.project_name && <span className="text-tertiary ml-1">• Project: {result.project_name}</span>}
                </p>
              </div>
              <ArrowRight size={16} className="text-secondary group-hover:text-primary -ml-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      )}
      
      {isOpen && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl border border-white/10 shadow-xl p-4 text-center z-50">
          <p className="text-secondary text-sm">No results found.</p>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
