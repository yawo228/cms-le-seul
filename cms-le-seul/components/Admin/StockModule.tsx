
import React, { useState, useMemo } from 'react';
import { PackageCheck, AlertTriangle, ShieldAlert, History, Search, Plus, Minus, Pill, Edit2, X, Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Medicament, UserRole } from '../../types';

const StockModule: React.FC = () => {
  const { medicaments, stockMovements, adjustStock, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'EXPIRED' | 'NEAR_EXPIRY'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'STOCK' | 'EXPIRY'>('NAME');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [selectedMed, setSelectedMed] = useState<Medicament | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'ACHAT' | 'CORRECTION' | 'INVENTAIRE'>('ACHAT');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'ACHAT' | 'AJUSTEMENT'>('ACHAT');

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const filteredMeds = useMemo(() => {
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setDate(now.getDate() + 90);

    return medicaments.filter(m => {
      const matchesSearch = m.nom.toLowerCase().includes(search.toLowerCase());
      const expiryDate = new Date(m.dateExpiration);
      const isExpired = expiryDate < now;
      const isNearExpiry = expiryDate >= now && expiryDate <= threeMonthsLater;
      const isLowStock = m.stock < m.stockMin;

      if (filter === 'LOW') return matchesSearch && isLowStock;
      if (filter === 'EXPIRED') return matchesSearch && isExpired;
      if (filter === 'NEAR_EXPIRY') return matchesSearch && isNearExpiry;
      return matchesSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'NAME') {
        comparison = a.nom.localeCompare(b.nom);
      } else if (sortBy === 'STOCK') {
        comparison = a.stock - b.stock;
      } else if (sortBy === 'EXPIRY') {
        comparison = new Date(a.dateExpiration).getTime() - new Date(b.dateExpiration).getTime();
      }
      return sortOrder === 'ASC' ? comparison : -comparison;
    });
  }, [medicaments, search, filter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setDate(now.getDate() + 90);

    return {
      low: medicaments.filter(m => m.stock < m.stockMin).length,
      expired: medicaments.filter(m => new Date(m.dateExpiration) < now).length,
      near: medicaments.filter(m => {
        const d = new Date(m.dateExpiration);
        return d >= now && d <= threeMonthsLater;
      }).length
    };
  }, [medicaments]);

  const handleConfirm = () => {
    if (!selectedMed) return;
    
    if (mode === 'ACHAT') {
      if (adjustQty <= 0) {
        alert('La quantité d\'achat doit être supérieure à 0');
        return;
      }
      adjustStock(selectedMed.id, adjustQty, 'ACHAT', { description: 'Entrée en stock par achat' });
    } else {
      if (!description.trim()) {
        alert('Une description est obligatoire pour un ajustement');
        return;
      }
      adjustStock(selectedMed.id, adjustQty, adjustType === 'ACHAT' ? 'CORRECTION' : adjustType, { description });
    }
    
    setSelectedMed(null);
    setAdjustQty(0);
    setDescription('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10">
      {/* Mini Stats */}
      <div className="grid grid-cols-5 gap-2">
        <button onClick={() => setFilter('ALL')} className={`p-2 rounded-2xl text-center flex flex-col items-center border-2 transition-all ${filter === 'ALL' ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg shadow-[var(--accent-color)]/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/30'}`}>
          <PackageCheck size={18}/>
          <span className="text-[11px] font-semibold mt-1 uppercase">{medicaments.length}</span>
        </button>
        <button onClick={() => setFilter('LOW')} className={`p-2 rounded-2xl text-center flex flex-col items-center border-2 transition-all ${filter === 'LOW' ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-orange-500/30'}`}>
          <AlertTriangle size={18}/>
          <span className="text-[11px] font-semibold mt-1 uppercase">BAS ({stats.low})</span>
        </button>
        <button onClick={() => setFilter('NEAR_EXPIRY')} className={`p-2 rounded-2xl text-center flex flex-col items-center border-2 transition-all ${filter === 'NEAR_EXPIRY' ? 'bg-blue-400 text-white border-blue-400 shadow-lg shadow-blue-400/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-400/30'}`}>
          <Clock size={18}/>
          <span className="text-[11px] font-semibold mt-1 uppercase">PRÈS ({stats.near})</span>
        </button>
        <button onClick={() => setFilter('EXPIRED')} className={`p-2 rounded-2xl text-center flex flex-col items-center border-2 transition-all ${filter === 'EXPIRED' ? 'bg-magenta text-white border-magenta shadow-lg shadow-magenta/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-magenta/30'}`}>
          <ShieldAlert size={18}/>
          <span className="text-[11px] font-semibold mt-1 uppercase">EXP ({stats.expired})</span>
        </button>
        <div className="p-2 rounded-2xl text-center flex flex-col items-center bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] text-[var(--text-secondary)] opacity-50">
          <History size={18}/>
          <span className="text-[11px] font-semibold mt-1 uppercase">MVT</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-2xl shadow-sm flex items-center gap-3 border border-[var(--border-color)] group focus-within:border-[var(--accent-color)] transition-colors">
          <Search size={20} className="text-[var(--text-secondary)] group-focus-within:text-[var(--accent-color)] transition-colors" />
          <input type="text" placeholder="RECHERCHER DANS LE STOCK..." className="flex-1 bg-transparent py-1 outline-none font-black uppercase text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-color)]">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[10px] font-black uppercase outline-none px-2 text-[var(--text-primary)] cursor-pointer"
          >
            <option value="NAME">NOM</option>
            <option value="STOCK">STOCK</option>
            <option value="EXPIRY">EXPIRATION</option>
          </select>
          <button 
            onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
            className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-all text-[var(--accent-color)]"
          >
            {sortOrder === 'ASC' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredMeds.map(med => {
          const isExpired = new Date(med.dateExpiration) < new Date();
          const isLow = med.stock < med.stockMin;
          return (
            <div key={med.id} className={`bg-[var(--bg-secondary)] p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:shadow-md ${isExpired ? 'border-magenta/30 bg-magenta/5' : isLow ? 'border-orange-500/30 bg-orange-500/5' : 'border-[var(--border-color)]'}`}>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold uppercase truncate leading-none text-[var(--text-primary)]">{med.nom}</h3>
                    {isExpired && <span className="bg-magenta text-white text-[8px] px-2 py-0.5 rounded-full font-black shadow-sm">EXPIRÉ</span>}
                    {isLow && <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black shadow-sm">STOCK BAS</span>}
                  </div>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest leading-none">EXP: {new Date(med.dateExpiration).toLocaleDateString('fr-FR')}</p>
               </div>
               <div className="flex items-center space-x-2">
                  <div className={`text-xl font-black ${isLow ? 'text-magenta' : 'text-[var(--accent-color)]'} min-w-[40px] text-right mr-2`}>{med.stock}</div>
                  {isAdmin && (
                    <>
                      <button onClick={() => { setSelectedMed(med); setMode('ACHAT'); }} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-90 border border-emerald-500/20 flex items-center gap-2">
                        <Plus size={16}/>
                        <span className="text-[9px] font-black uppercase hidden sm:inline">Achat</span>
                      </button>
                      <button onClick={() => { setSelectedMed(med); setMode('AJUSTEMENT'); setAdjustType('CORRECTION'); }} className="p-3 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all active:scale-90 border border-orange-500/20 flex items-center gap-2">
                        <Edit2 size={16}/>
                        <span className="text-[9px] font-black uppercase hidden sm:inline">Ajuster</span>
                      </button>
                    </>
                  )}
               </div>
            </div>
          );
        })}
        {filteredMeds.length === 0 && (
          <div className="py-20 text-center text-[var(--text-secondary)] font-black uppercase text-xs tracking-[0.2em] opacity-50">Aucun médicament ne correspond aux filtres</div>
        )}
      </div>

      {selectedMed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in">
           <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-[2.5rem] p-8 space-y-6 animate-scale-in border border-[var(--border-color)] shadow-2xl">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="font-black uppercase text-sm text-[var(--text-primary)]">{mode === 'ACHAT' ? 'ENTRÉE EN STOCK (ACHAT)' : 'AJUSTEMENT DE STOCK'}</h3>
                    <p className="text-[10px] font-bold text-[var(--accent-color)] uppercase tracking-widest">{selectedMed.nom}</p>
                 </div>
                 <button onClick={() => { setSelectedMed(null); setDescription(''); setAdjustQty(0); }} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded-xl transition-all"><X size={24}/></button>
              </div>

              {mode === 'AJUSTEMENT' && (
                <div className="flex gap-2">
                  {[
                    { id: 'CORRECTION', label: 'CORRECTION' },
                    { id: 'INVENTAIRE', label: 'INVENTAIRE' }
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setAdjustType(t.id as any)} 
                      className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${adjustType === t.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest ml-1">
                  {mode === 'ACHAT' ? 'Quantité achetée' : 'Quantité à ajuster (+/-)'}
                </p>
                <input 
                  type="number" 
                  placeholder="0" 
                  className="w-full p-6 bg-[var(--bg-primary)] rounded-2xl font-black text-center text-3xl outline-none border-2 border-transparent focus:border-[var(--accent-color)] transition-all text-[var(--text-primary)]" 
                  value={adjustQty || ''} 
                  onChange={(e) => setAdjustQty(Number(e.target.value))} 
                />
              </div>

              {mode === 'AJUSTEMENT' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Motif de l'ajustement</p>
                  <textarea 
                    placeholder="Ex: Casse, erreur inventaire, don..." 
                    className="w-full p-4 bg-[var(--bg-primary)] rounded-2xl font-bold text-xs outline-none border-2 border-transparent focus:border-orange-500 transition-all text-[var(--text-primary)] h-24 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              )}

              <button 
                onClick={handleConfirm} 
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all ${mode === 'ACHAT' ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600'}`}
              >
                {mode === 'ACHAT' ? 'Valider l\'entrée' : 'Enregistrer l\'ajustement'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StockModule;
