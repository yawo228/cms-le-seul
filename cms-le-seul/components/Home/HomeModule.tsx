import React, { useMemo } from 'react';
import { Pill, Stethoscope, FlaskConical, Syringe, History, Package, BarChart3, Users, TrendingUp, Calendar, LayoutDashboard, Wallet, FileText, Archive, Settings, BookOpen, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { UserRole } from '../../types';

interface HomeModuleProps {
  onNavigate: (tab: string) => void;
}

const HomeModule: React.FC<HomeModuleProps> = ({ onNavigate }) => {
  const { tickets, currentUser, cashSessions } = useStore();
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const todayRevenue = tickets
    .filter(t => t.date.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((acc, t) => acc + t.netAPayer, 0);

  const transparencyAlerts = useMemo(() => {
    if (!isAdmin) return [];
    return cashSessions
      .filter(s => {
        if (s.status !== 'CLOSED') return false;
        const gap = (s.closingAmount || 0) - (s.theoreticalClosingAmount || 0);
        return Math.abs(gap) > 0;
      })
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())
      .slice(0, 3);
  }, [cashSessions, isAdmin]);

  const modules = [
    { id: 'caisse', label: 'Caisse', icon: Wallet, color: 'cyan', iconColor: 'text-cyan-500', bgColor: 'bg-cyan-500/10', admin: false },
    { id: 'billing', label: 'Facture', icon: FileText, color: 'magenta', iconColor: 'text-magenta-500', bgColor: 'bg-magenta-500/10', admin: false },
    { id: 'patients', label: 'Patients', icon: Users, color: 'royal', iconColor: 'text-royal-500', bgColor: 'bg-royal-500/10', admin: false },
    { id: 'inventory', label: 'Catalogue', icon: BookOpen, color: 'emerald', iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10', admin: true },
    { id: 'stock', label: 'Stock', icon: Archive, color: 'rose', iconColor: 'text-rose-500', bgColor: 'bg-rose-500/10', admin: false },
    { id: 'reports', label: 'Bilan', icon: BarChart3, color: 'orange', iconColor: 'text-orange-500', bgColor: 'bg-orange-500/10', admin: false }, // Bilan is visible to all but filtered
    { id: 'settings', label: 'Paramètres', icon: Settings, color: 'slate', iconColor: 'text-slate-500', bgColor: 'bg-slate-500/10', admin: true },
  ].filter(m => !m.admin || isAdmin);

  return (
    <div className="space-y-6 pb-20">
      {/* Transparency Alerts for Admin */}
      {isAdmin && transparencyAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-6 animate-pulse-subtle">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-red-400 uppercase tracking-widest">Alertes de Transparence</h2>
              <p className="text-[10px] font-bold text-red-400/60 uppercase tracking-widest">Écarts de caisse détectés</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {transparencyAlerts.map((session) => {
              const gap = (session.closingAmount || 0) - (session.theoreticalClosingAmount || 0);
              return (
                <div key={session.id} className="bg-[var(--bg-primary)]/40 p-4 rounded-2xl border border-red-500/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest">{session.cashierName}</span>
                    <span className="text-[9px] font-bold text-red-400">{new Date(session.endTime!).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-lg font-black text-red-400">{gap.toLocaleString()} F</p>
                    <button 
                      onClick={() => onNavigate('audit')}
                      className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase hover:text-[var(--text-primary)] transition-colors"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Section with XXL Typography */}
      <div className="liquid-glass rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 animate-slide-up relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-royal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 w-full md:w-auto">
          <h1 className="text-[8px] md:text-[9px] font-bold text-[var(--text-secondary)] uppercase leading-none mb-2 md:mb-3 tracking-[0.3em] flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={12} md:size={14} />
            Recette Journalière
          </h1>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tighter leading-none text-gradient-liquid odometer">
               {todayRevenue.toLocaleString()}
             </p>
             <span className="text-sm md:text-lg font-semibold text-[var(--text-secondary)] uppercase">F CFA</span>
          </div>
        </div>

        <div className="relative z-10 hidden md:block">
           <div className="w-24 h-24 rounded-full border border-[var(--border-color)] flex items-center justify-center animate-radar">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] backdrop-blur-md flex items-center justify-center border border-[var(--border-color)]">
                 <BarChart3 size={28} className="text-[var(--text-primary)]/80" />
              </div>
           </div>
        </div>
      </div>

      {/* Bento Grid 2.0 - Centered Icons like reference image */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {modules.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => onNavigate(m.id)}
            className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-[1.05] active:scale-95 group bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg hover:shadow-2xl h-40 md:h-56"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              m.color === 'magenta' ? 'from-magenta/20' : 
              m.color === 'emerald' ? 'from-emerald-500/20' : 
              m.color === 'orange' ? 'from-orange-500/20' : 
              m.color === 'royal' ? 'from-royal/20' :
              m.color === 'cyan' ? 'from-cyan-500/20' :
              'from-slate-500/20'
            } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner border border-[var(--border-color)] ${m.bgColor} ${m.iconColor}`}>
              <m.icon size={32} md:size={40} strokeWidth={1.5} />
            </div>

            <div className="text-center relative z-10">
              <h3 className="font-black uppercase tracking-tighter text-[var(--text-primary)] text-sm md:text-lg group-hover:text-[var(--accent-color)] transition-colors">
                {m.label}
              </h3>
              <div className={`h-1 w-0 group-hover:w-full transition-all duration-500 mx-auto rounded-full mt-1 ${
                m.color === 'magenta' ? 'bg-magenta' : 
                m.color === 'emerald' ? 'bg-emerald-500' : 
                m.color === 'orange' ? 'bg-orange-500' : 
                m.color === 'royal' ? 'bg-royal' :
                m.color === 'cyan' ? 'bg-cyan-500' :
                'bg-slate-500'
              }`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeModule;
