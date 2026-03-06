import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { 
  ShieldAlert, 
  FileText, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AuditModule: React.FC = () => {
  const { cashSessions, auditLogs, users } = useStore();
  const [activeTab, setActiveTab] = useState<'sessions' | 'logs'>('sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');

  const filteredSessions = useMemo(() => {
    return cashSessions.filter(session => {
      const matchesSearch = session.cashierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser = filterUser === 'all' || session.cashierId === filterUser;
      return matchesSearch && matchesUser;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [cashSessions, searchTerm, filterUser]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser = filterUser === 'all' || log.userId === filterUser;
      return matchesSearch && matchesUser;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, searchTerm, filterUser]);

  return (
    <div className="h-full flex flex-col space-y-6 p-6 animate-fade-in text-[var(--text-primary)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-[var(--text-primary)]">Audit & Sécurité</h1>
          <p className="text-[var(--text-secondary)] font-semibold uppercase tracking-widest text-[9px] mt-1">Surveillance des sessions de caisse et journal d'activités</p>
        </div>
        
        <div className="flex glass-panel p-1 rounded-xl border border-[var(--border-color)]">
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'sessions' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
          >
            Sessions de Caisse
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'logs' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
          >
            Journal de Sécurité
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-[var(--border-color)] flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'sessions' ? "Rechercher une session..." : "Rechercher dans les logs..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent-color)] font-bold text-xs uppercase text-[var(--text-primary)]"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-[var(--text-secondary)]" size={20} />
          <select 
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="flex-1 md:w-48 py-3 px-4 bg-white/5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent-color)] font-bold text-xs uppercase text-[var(--text-primary)] [&>option]:text-black"
          >
            <option value="all">Tous les utilisateurs</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 glass-panel rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-0">
          {activeTab === 'sessions' ? (
            <table className="w-full text-left">
              <thead className="bg-white/5 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Caissier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Ouverture</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Fermeture</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider text-right">Fond Initial</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider text-right">Ventes</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider text-right">Sorties</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider text-right">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredSessions.map(session => {
                  const totalDisbursements = session.disbursements.reduce((acc, d) => acc + d.amount, 0);
                  const gap = session.status === 'CLOSED' && session.closingAmount !== undefined && session.theoreticalClosingAmount !== undefined
                    ? session.closingAmount - session.theoreticalClosingAmount
                    : 0;
                  
                  return (
                    <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                          session.status === 'OPEN' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-white/10 text-[var(--text-secondary)] border border-white/10'
                        }`}>
                          {session.status === 'OPEN' ? 'EN COURS' : 'CLÔTURÉ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[var(--accent-color)]/20 flex items-center justify-center text-[10px] font-black text-[var(--accent-color)]">
                            {session.cashierName.charAt(0)}
                          </div>
                          {session.cashierName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">
                        {format(new Date(session.startTime), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">
                        {session.endTime ? format(new Date(session.endTime), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[var(--text-primary)]">
                        {session.openingAmount.toLocaleString()} F
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-blue-400">
                        +{session.totalSales.toLocaleString()} F
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-orange-400">
                        -{totalDisbursements.toLocaleString()} F
                      </td>
                      <td className="px-6 py-4 text-right">
                        {session.status === 'CLOSED' ? (
                          <span className={`font-mono font-black ${gap === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {gap > 0 ? '+' : ''}{gap.toLocaleString()} F
                          </span>
                        ) : (
                          <span className="text-white/20 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-secondary)] font-bold uppercase text-xs">
                      Aucune session trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white/5 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Niveau</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Horodatage</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {log.severity === 'CRITICAL' && <ShieldAlert size={18} className="text-red-400" />}
                      {log.severity === 'WARNING' && <AlertTriangle size={18} className="text-orange-400" />}
                      {log.severity === 'INFO' && <CheckCircle size={18} className="text-blue-400" />}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[var(--text-secondary)]">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                      {log.userName}
                    </td>
                    <td className="px-6 py-4 text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--text-secondary)]">
                      {log.details}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)] font-bold uppercase text-xs">
                      Aucun log trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditModule;
