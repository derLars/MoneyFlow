import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Folder, Plus, TrendingUp, ChevronRight, Clock, Users } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import GlobalSearch from '../components/GlobalSearch';
import CreateProjectModal from '../components/CreateProjectModal';

const MainPage = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
    const fetchSummary = async () => {
      try {
        const res = await api.get('/purchases/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch summary', err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-0">
      
      {/* Global Search */}
      <section>
        <GlobalSearch />
      </section>

      {/* KPI Section - Personal Spending */}
      <section className="flex justify-center">
        <div className="bg-surface p-8 rounded-3xl shadow-sm border border-white/5 flex items-center gap-6 min-w-[300px] w-full sm:w-auto">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-secondary uppercase tracking-wider">{currentMonthName} SPENDING</p>
            <p className="text-4xl font-bold text-white mt-1">
              {loadingSummary ? "..." : `€${summary?.month_total?.toFixed(2) || "0.00"}`}
            </p>
          </div>
        </div>
      </section>

      {/* Projects Header & Create Button */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Folder size={20} className="text-primary" />
          Your Projects
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-primary/20 text-sm"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Projects List */}
      <section className="space-y-4">
        {projectsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface rounded-3xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link
                key={project.project_id}
                to={`/projects/${project.project_id}`}
                className="bg-surface p-5 rounded-3xl border border-white/5 shadow-sm hover:bg-white/5 active:scale-[0.98] transition group flex flex-col justify-between min-h-[140px]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-background flex-shrink-0 flex items-center justify-center border border-white/10">
                      {project.image_path ? (
                        <img 
                          src={project.image_path.startsWith('http') || project.image_path.startsWith('/') ? project.image_path : `/api/purchases/images/${project.image_path}`} 
                          alt={project.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = '' }} // Fallback
                        />
                      ) : (
                        <Folder className="text-secondary" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-primary transition line-clamp-1">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-secondary line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-secondary group-hover:text-primary transition" />
                </div>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                  <div className="flex -space-x-2 overflow-hidden">
                    {/* Participant Avatars (Simulated) */}
                    {project.participants.slice(0, 3).map((p) => (
                      <div key={p.user_id} className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-background flex items-center justify-center text-xs font-bold text-secondary" title={p.user_name}>
                        {p.user_name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.participants.length > 3 && (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-background flex items-center justify-center text-xs font-bold text-secondary">
                        +{project.participants.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-secondary flex items-center gap-1 ml-auto">
                    <Clock size={12} />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface rounded-3xl border border-dashed border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-background text-secondary rounded-full mb-4">
              <Folder size={32} />
            </div>
            <p className="text-white font-medium text-lg">No projects yet.</p>
            <p className="text-sm text-secondary mt-1 mb-6 max-w-xs mx-auto">Create a project to start tracking shared expenses for trips, events, or daily life.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              Create Your First Project
            </button>
          </div>
        )}
      </section>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default MainPage;
