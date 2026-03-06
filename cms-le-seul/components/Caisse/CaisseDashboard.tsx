import React from 'react';
import { Stethoscope, Pill, FlaskConical, Syringe, ArrowRight } from 'lucide-react';
import SessionManager from './SessionManager';

interface CaisseDashboardProps {
  onNavigate: (tab: string) => void;
}

const CaisseDashboard: React.FC<CaisseDashboardProps> = ({ onNavigate }) => {
  const modules = [
    { id: 'consultation', label: 'Consultation', icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', desc: 'Médecine Générale & Spécialisée', accent: 'bg-blue-400' },
    { id: 'pharmacy', label: 'Pharmacie', icon: Pill, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', desc: 'Vente de Médicaments & Stock', accent: 'bg-emerald-400' },
    { id: 'laboratory', label: 'Laboratoire', icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', desc: 'Analyses & Résultats', accent: 'bg-purple-400' },
    { id: 'nursing', label: 'Soins', icon: Syringe, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', desc: 'Soins Infirmiers & Actes', accent: 'bg-rose-400' },
  ];

  return (
    <SessionManager>
      <div className="h-full flex flex-col animate-fade-in space-y-6">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[var(--text-primary)] text-gradient-liquid uppercase tracking-tighter leading-none">Caisse</h1>
          <p className="text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-[0.2em] mt-2">Point d'Encaissement Centralisé</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1">
          {modules.map((module, idx) => (
            <button
              key={module.id}
              onClick={() => onNavigate(module.id)}
              className={`relative overflow-hidden rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:scale-[1.05] active:scale-95 group bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg hover:shadow-2xl stagger-${idx + 1}`}
            >
              {/* Background Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.bg.replace('/10', '/20')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner border border-[var(--border-color)] ${module.bg} ${module.border} backdrop-blur-md relative z-10`}>
                <module.icon size={28} md:size={32} className={module.color} strokeWidth={1.5} />
              </div>

              <div className="text-center relative z-10">
                <h2 className="text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-0.5 group-hover:text-[var(--accent-color)] transition-colors">{module.label}</h2>
                <p className="text-[var(--text-secondary)] text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-60">{module.desc}</p>
                <div className={`h-1 w-0 group-hover:w-full transition-all duration-500 mx-auto rounded-full mt-1.5 ${module.accent}`} />
              </div>
              
              <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--bg-primary)]/40 flex items-center justify-center group-hover:bg-[var(--accent-color)]/20 transition-colors">
                <ArrowRight size={16} className="text-[var(--text-secondary)]/50 group-hover:text-[var(--text-primary)] -rotate-45 group-hover:rotate-0 transition-all duration-300" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </SessionManager>
  );
};

export default CaisseDashboard;
