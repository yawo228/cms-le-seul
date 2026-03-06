
import React, { useState, useMemo } from 'react';
import { BarChart3, Printer, Calendar, FileText, Download, TrendingUp, ArrowRight, Shield, Activity, Search, Filter } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Ticket, UserRole } from '../../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

type ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';
type ReportTab = 'FINANCE' | 'STOCK';

const ReportsModule: React.FC = () => {
  const { tickets, stockMovements, medicaments, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('FINANCE');
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const userTickets = useMemo(() => {
    if (isAdmin) return tickets;
    return tickets.filter(t => t.caissierId === currentUser?.id);
  }, [tickets, isAdmin, currentUser]);

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(userTickets.map(t => new Date(t.date).getFullYear()))) as number[];
    if (uniqueYears.length === 0) uniqueYears.push(new Date().getFullYear());
    return uniqueYears.sort((a, b) => b - a);
  }, [userTickets]);

  const filteredTickets = useMemo(() => {
    const now = new Date();
    return userTickets.filter(t => {
      const ticketDate = new Date(t.date);
      let matchesPeriod = false;

      if (period === 'day') matchesPeriod = ticketDate.toDateString() === now.toDateString();
      else if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesPeriod = ticketDate >= weekAgo;
      }
      else if (period === 'month') matchesPeriod = ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear();
      else if (period === 'year') matchesPeriod = ticketDate.getFullYear() === selectedYear;
      else if (period === 'custom') {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999); // Include the end day fully
        matchesPeriod = ticketDate >= start && ticketDate <= end;
      }

      if (!matchesPeriod) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          t.patientNom.toLowerCase().includes(term) ||
          t.numero.toLowerCase().includes(term) ||
          t.type.toLowerCase().includes(term)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userTickets, period, customStart, customEnd, searchTerm, selectedYear]);

  const chartData = useMemo(() => {
    const data: any[] = [];
    if (period === 'day') {
      for (let i = 8; i <= 20; i++) {
        const hourTickets = filteredTickets.filter(t => new Date(t.date).getHours() === i);
        data.push({
          name: `${i}h`,
          revenue: hourTickets.reduce((acc, t) => acc + t.netAPayer, 0),
          count: hourTickets.length
        });
      }
    } else {
      // Group by day
      const grouped = filteredTickets.reduce((acc, t) => {
        const dateKey = new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        if (!acc[dateKey]) acc[dateKey] = { revenue: 0, count: 0 };
        acc[dateKey].revenue += t.netAPayer;
        acc[dateKey].count += 1;
        return acc;
      }, {} as Record<string, { revenue: number, count: number }>);

      // Sort by date if possible, or just use keys
      Object.entries(grouped).forEach(([key, val]) => {
        const v = val as { revenue: number, count: number };
        data.push({ name: key, revenue: v.revenue, count: v.count });
      });
      
      // If empty, show at least something
      if (data.length === 0) {
         data.push({ name: 'Aucune donnée', revenue: 0, count: 0 });
      }
    }
    return data;
  }, [filteredTickets, period]);

  const stats = useMemo(() => {
    const totalRevenue = filteredTickets.reduce((acc, t) => acc + t.netAPayer, 0);
    const totalBrut = filteredTickets.reduce((acc, t) => acc + t.totalBrut, 0);
    const insurancePart = totalBrut - totalRevenue;
    const byType: Record<string, number> = { PHARMACY: 0, CONSULTATION: 0, LABORATORY: 0, NURSING: 0 };
    filteredTickets.forEach(t => {
      if (byType[t.type] !== undefined) byType[t.type] += t.netAPayer;
    });
    return { totalRevenue, totalBrut, insurancePart, byType };
  }, [filteredTickets]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Numéro', 'Patient', 'Type', 'Total Brut', 'Assurance', 'Net Payé', 'Statut'];
    const rows = filteredTickets.map(t => [
      new Date(t.date).toLocaleString('fr-FR'),
      t.numero,
      t.patientNom,
      t.type,
      t.totalBrut,
      t.partAssurance,
      t.netAPayer,
      t.statut
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_caisse_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-32 print:p-0 print:m-0 animate-fade-in text-[var(--text-primary)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-[var(--text-primary)] neon-text">{activeTab === 'FINANCE' ? 'Bilans Financiers' : 'Mouvements de Stock'}</h1>
          <p className="text-[var(--text-secondary)]/60 font-semibold uppercase tracking-widest text-[9px] mt-1">{activeTab === 'FINANCE' ? 'Analyse complète des recettes' : 'Suivi des entrées et sorties'}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <div className="flex p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] mr-4">
              <button onClick={() => setActiveTab('FINANCE')} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase transition-all ${activeTab === 'FINANCE' ? 'bg-royal text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Finance</button>
              <button onClick={() => setActiveTab('STOCK')} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase transition-all ${activeTab === 'STOCK' ? 'bg-royal text-white' : 'text-[var(--text-secondary)] hover:text(--text-primary)]'}`}>Stock</button>
            </div>
          )}
          <button onClick={handleExportCSV} className="px-6 py-4 rounded-2xl font-bold flex items-center space-x-3 uppercase text-[10px] tracking-wider hover:bg-emerald-500/10 hover:text-emerald-600 border border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all">
            <Download size={16} />
            <span className="hidden md:inline">Exporter CSV</span>
          </button>
          <button onClick={handlePrint} className="px-6 py-4 rounded-2xl font-bold flex items-center space-x-3 uppercase text-[10px] tracking-wider hover:bg-[var(--accent-color)]/5 border border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all">
            <Printer size={16} />
            <span className="hidden md:inline">Imprimer</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 print:hidden">
        <div className="flex space-x-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full md:w-fit overflow-x-auto">
          {(['day', 'week', 'month', 'year', 'custom'] as ReportPeriod[]).map(p => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)} 
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${period === p ? 'bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
            >
              {p === 'day' ? 'Aujourd\'hui' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Période'}
            </button>
          ))}
        </div>

        {period === 'year' && (
          <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2 rounded-2xl animate-in fade-in slide-in-from-left-4">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-bold uppercase text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] [&>option]:text-black"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {period === 'custom' && (
          <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2 rounded-2xl animate-in fade-in slide-in-from-left-4">
            <input 
              type="date" 
              value={customStart} 
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-bold uppercase text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
            />
            <span className="text-[var(--text-secondary)]/30">-</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-bold uppercase text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
            />
          </div>
        )}
      </div>

      {activeTab === 'FINANCE' ? (
        <>
          {/* Neon Chart */}
          <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-[var(--text-primary)]">
                <Activity size={16} className="text-cyan-400" />
                Évolution des Revenus
              </h3>
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {filteredTickets.length} Transactions
              </div>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" tick={{fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: '#00ff9d', fontWeight: 'bold', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#00ff9d" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-3xl space-y-4 group">
               <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Recette Net</p>
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none neon-text">{stats.totalRevenue.toLocaleString()} <span className="text-sm opacity-50">F</span></p>
               </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-3xl space-y-4 group">
               <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform"><Shield size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Assurances</p>
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">{stats.insurancePart.toLocaleString()} <span className="text-sm opacity-50">F</span></p>
               </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-3xl space-y-4 group">
               <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform"><FileText size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Total Brut</p>
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">{stats.totalBrut.toLocaleString()} <span className="text-sm opacity-50">F</span></p>
               </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-3xl space-y-4 group">
               <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform"><ArrowRight size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Transactions</p>
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">{filteredTickets.length}</p>
               </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8 print:grid-cols-1`}>
             {/* Breakdown by Service */}
             {isAdmin && (
               <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden lg:col-span-1">
                  <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]/50">
                     <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Par Service</h2>
                     <BarChart3 className="text-[var(--text-secondary)]/30" />
                  </div>
                  <div className="p-8 space-y-4">
                     {Object.entries(stats.byType).map(([type, val]) => (
                       <div key={type} className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors group">
                          <span className="font-black uppercase text-xs tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{type}</span>
                          <span className="font-black text-xl tracking-tighter text-[var(--text-primary)]">{val.toLocaleString()} <span className="text-xs opacity-50">F</span></span>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {/* Detailed Transaction List */}
             <div className={`bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
                <div className="p-6 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-primary)]/50">
                   <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Détail des Transactions</h2>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/30" size={14} />
                     <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs font-bold uppercase text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] w-full md:w-64"
                     />
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/30">
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Date</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">N° Ticket</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Patient</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Service</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-right">Montant</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filteredTickets.slice(0, 50).map(t => (
                         <tr key={t.id} className="border-b border-[var(--border-color)]/5 hover:bg-[var(--bg-primary)]/50 transition-colors group">
                           <td className="p-4 text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">
                             {new Date(t.date).toLocaleDateString('fr-FR')} <span className="text-[10px] opacity-50">{new Date(t.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                           </td>
                           <td className="p-4 text-xs font-bold text-[var(--text-primary)]/80 font-mono">{t.numero}</td>
                           <td className="p-4 text-xs font-bold text-[var(--text-primary)]">{t.patientNom}</td>
                           <td className="p-4">
                             <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                                t.type === 'PHARMACY' ? 'bg-blue-500/20 text-blue-600' :
                                t.type === 'CONSULTATION' ? 'bg-magenta/20 text-pink-600' :
                                t.type === 'LABORATORY' ? 'bg-purple-500/20 text-purple-600' :
                                'bg-orange-500/20 text-orange-600'
                             }`}>
                                {t.type}
                             </span>
                           </td>
                           <td className="p-4 text-right">
                             <span className="font-black text-[var(--accent-color)]">{(t.netAPayer || 0).toLocaleString()} F</span>
                           </td>
                         </tr>
                       ))}
                       {filteredTickets.length === 0 && (
                         <tr>
                           <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]/30 text-xs font-bold uppercase tracking-widest">Aucune transaction trouvée</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                   {filteredTickets.length > 50 && (
                     <div className="p-4 text-center border-t border-[var(--border-color)]">
                       <p className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase">Affichage des 50 premières transactions sur {filteredTickets.length}</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-primary)]/50">
               <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Mouvements de Stock</h2>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/30">
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Date</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Médicament</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Type</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Quantité</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Agent</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Description</th>
                   </tr>
                 </thead>
                 <tbody>
                   {stockMovements.slice().reverse().map((m, i) => {
                     const med = medicaments.find(med => med.id === m.medicamentId);
                     return (
                       <tr key={i} className="border-b border-[var(--border-color)]/5 hover:bg-[var(--bg-primary)]/50 transition-colors">
                         <td className="p-4 text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">
                           {new Date(m.date).toLocaleDateString('fr-FR')} <span className="text-[10px] opacity-50">{new Date(m.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                         </td>
                         <td className="p-4 text-xs font-black text-[var(--text-primary)] uppercase">{med?.nom || 'Inconnu'}</td>
                         <td className="p-4">
                           <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                             m.type === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-600' :
                             m.type === 'VENTE' ? 'bg-blue-500/20 text-blue-600' :
                             'bg-orange-500/20 text-orange-600'
                           }`}>
                             {m.type}
                           </span>
                         </td>
                         <td className={`p-4 text-xs font-black ${m.quantite > 0 ? 'text-emerald-500' : 'text-magenta'}`}>
                           {m.quantite > 0 ? `+${m.quantite}` : m.quantite}
                         </td>
                         <td className="p-4 text-xs font-bold text-[var(--text-primary)]/80">{m.userNom}</td>
                         <td className="p-4 text-xs italic text-[var(--text-secondary)]/50 max-w-xs truncate">{m.description || '-'}</td>
                       </tr>
                     );
                   })}
                   {stockMovements.length === 0 && (
                     <tr>
                       <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]/30 text-xs font-bold uppercase tracking-widest">Aucun mouvement trouvé</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsModule;
