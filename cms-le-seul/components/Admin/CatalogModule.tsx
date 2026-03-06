import React, { useState, useMemo, useEffect } from 'react';
import { Package, Edit3, Trash2, Plus, Search, X, FlaskConical, Syringe, Pill, ChevronDown, PlusCircle, AlertTriangle, ShieldAlert, Clock, CheckCircle2, Stethoscope, Archive } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Medicament, LabExam, CareAct, ConsultationType, UserRole } from '../../types';

type CatalogTab = 'meds' | 'exams' | 'acts' | 'consultations' | 'consumables';
type InventoryFilter = 'ALL' | 'LOW' | 'EXPIRED' | 'NEAR_EXPIRY';

const ConsumableSelector: React.FC<{
  consumables: any[];
  selectedId: string;
  quantity: number;
  onUpdate: (field: 'id' | 'quantity', value: any) => void;
  onRemove: () => void;
}> = ({ consumables, selectedId, quantity, onUpdate, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const selectedConsumable = consumables.find(c => c.id === selectedId);

  const filteredConsumables = useMemo(() => {
    return consumables.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesStock = hideOutOfStock ? c.stock > 0 : true;
      return matchesSearch && matchesStock;
    });
  }, [consumables, search, hideOutOfStock]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex gap-2 items-start" ref={wrapperRef}>
      <div className="relative flex-1">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-bold uppercase cursor-pointer flex justify-between items-center hover:border-[var(--accent-color)] transition-colors"
        >
          <span className={selectedConsumable ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]/40'}>
            {selectedConsumable ? `${selectedConsumable.name} (${selectedConsumable.stock} ${selectedConsumable.unit})` : 'SÉLECTIONNER UN CONSOMMABLE...'}
          </span>
          <ChevronDown size={14} className="text-[var(--text-secondary)]" />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-primary)] rounded-xl shadow-xl border border-[var(--border-color)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-[var(--border-color)] space-y-2 bg-[var(--bg-secondary)]/50">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={12} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="RECHERCHER..." 
                  className="w-full pl-8 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold uppercase outline-none focus:border-[var(--accent-color)] text-[var(--text-primary)]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-[9px] font-black uppercase text-[var(--text-secondary)] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hideOutOfStock}
                  onChange={(e) => setHideOutOfStock(e.target.checked)}
                  className="rounded border-[var(--border-color)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                />
                Masquer rupture de stock
              </label>
            </div>
            
            <div className="max-h-48 overflow-y-auto bg-[var(--bg-primary)]">
              {filteredConsumables.map(c => (
                <div 
                  key={c.id}
                  onClick={() => {
                    onUpdate('id', c.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-4 py-3 hover:bg-[var(--bg-secondary)] cursor-pointer flex justify-between items-center border-b border-[var(--border-color)] last:border-0 ${c.id === selectedId ? 'bg-[var(--accent-color)]/5' : ''}`}
                >
                  <span className="text-[10px] font-bold uppercase text-[var(--text-primary)]">{c.name}</span>
                  <span className={`text-[9px] font-black px-2 py-1 rounded ${c.stock > 10 ? 'bg-emerald-500/20 text-emerald-400' : c.stock > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.stock} {c.unit}
                  </span>
                </div>
              ))}
              {filteredConsumables.length === 0 && (
                <div className="p-4 text-center text-[10px] text-[var(--text-secondary)] italic">Aucun résultat</div>
              )}
            </div>
          </div>
        )}
      </div>

      <input 
        type="number" 
        className="w-20 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-center outline-none focus:border-[var(--accent-color)] text-[var(--text-primary)]"
        value={quantity}
        onChange={(e) => onUpdate('quantity', Number(e.target.value))}
        min="0.1" step="0.1"
        placeholder="QTÉ"
      />
      
      <button type="button" onClick={onRemove} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  );
};

const CatalogModule: React.FC = () => {
  const { 
    medicaments, medicamentCategories, addMedicamentCategory, updateMedicament, addMedicament, deleteMedicament,
    labExams, updateLabExam, addLabExam, deleteLabExam,
    careActs, updateCareAct, addCareAct, deleteCareAct,
    consultationTypes, updateConsultationType, addConsultationType, deleteConsultationType,
    consumables, addConsumable, updateConsumable, deleteConsumable,
    currentUser
  } = useStore();

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [activeTab, setActiveTab] = useState<CatalogTab>('meds');
  const [search, setSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCatField, setShowNewCatField] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
          <ShieldAlert size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Accès Refusé</h2>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs mt-2">Seul l'administrateur peut gérer le catalogue.</p>
        </div>
      </div>
    );
  }

  const filteredItems = useMemo(() => {
    let items: any[] = activeTab === 'meds' ? [...medicaments] : activeTab === 'exams' ? [...labExams] : activeTab === 'acts' ? [...careActs] : activeTab === 'consultations' ? [...(consultationTypes || [])] : [...consumables];
    
    // Filtrage par texte
    items = items.filter((m: any) => (m.nom || m.label || m.name).toLowerCase().includes(search.toLowerCase()));

    // Filtrage par état d'inventaire (seulement pour la pharmacie)
    if (activeTab === 'meds') {
      const now = new Date();
      const nearThreshold = new Date();
      nearThreshold.setDate(now.getDate() + 90); // 3 mois

      items = items.filter(m => {
        const med = m as Medicament;
        const expiry = new Date(med.dateExpiration);
        const isExpired = expiry < now;
        const isNear = expiry >= now && expiry <= nearThreshold;
        const isLow = med.stock < med.stockMin;

        if (inventoryFilter === 'LOW') return isLow;
        if (inventoryFilter === 'EXPIRED') return isExpired;
        if (inventoryFilter === 'NEAR_EXPIRY') return isNear;
        return true;
      });
    }

    return items;
  }, [activeTab, medicaments, labExams, careActs, search, inventoryFilter]);

  const handleOpenModal = (item: any = null) => {
    setShowNewCatField(false);
    setNewCatInput('');
    if (item) {
      setEditingItem({ ...item, consumables: item.consumables || [] });
    } else {
      const template = activeTab === 'meds' 
        ? { id: `med-${Date.now()}`, nom: '', prix: 0, prixInam: 0, prixAmu: 0, stock: 0, stockMin: 10, categorie: medicamentCategories[0] || 'DIVERS', dateExpiration: new Date().toISOString().split('T')[0], lotNumber: '' }
        : activeTab === 'exams'
        ? { id: `lb-${Date.now()}`, nom: '', prix: 0, prixInam: 0, prixAmu: 0, categorie: 'HÉMATOLOGIE', consumables: [] }
        : activeTab === 'acts'
        ? { id: `sn-${Date.now()}`, nom: '', prix: 0, prixInam: 0, prixAmu: 0, categorie: 'INJECTIONS', consumables: [] }
        : activeTab === 'consultations'
        ? { id: `cons-${Date.now()}`, label: '', price: 0, priceInam: 0, priceAmu: 0, category: 'GP' }
        : { id: `c-${Date.now()}`, name: '', stock: 0, minStock: 10, unit: 'unité' };
      setEditingItem(template);
    }
    setIsModalOpen(true);
  };

  const handleAddNewCategory = () => {
    if (newCatInput.trim()) {
      addMedicamentCategory(newCatInput);
      setEditingItem({ ...editingItem, categorie: newCatInput.toUpperCase().trim() });
      setNewCatInput('');
      setShowNewCatField(false);
    }
  };

  const handleAddConsumableLink = () => {
    if (!editingItem.consumables) editingItem.consumables = [];
    setEditingItem({
      ...editingItem,
      consumables: [...editingItem.consumables, { id: consumables[0]?.id || '', quantity: 1 }]
    });
  };

  const handleRemoveConsumableLink = (index: number) => {
    const newConsumables = [...(editingItem.consumables || [])];
    newConsumables.splice(index, 1);
    setEditingItem({ ...editingItem, consumables: newConsumables });
  };

  const handleUpdateConsumableLink = (index: number, field: 'id' | 'quantity', value: any) => {
    const newConsumables = [...(editingItem.consumables || [])];
    newConsumables[index] = { ...newConsumables[index], [field]: value };
    setEditingItem({ ...editingItem, consumables: newConsumables });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (activeTab === 'meds') {
      medicaments.some(m => m.id === editingItem.id) ? updateMedicament(editingItem.id, editingItem) : addMedicament(editingItem);
    } else if (activeTab === 'exams') {
      labExams.some(e => e.id === editingItem.id) ? updateLabExam(editingItem.id, editingItem) : addLabExam(editingItem);
    } else if (activeTab === 'acts') {
      careActs.some(a => a.id === editingItem.id) ? updateCareAct(editingItem.id, editingItem) : addCareAct(editingItem);
    } else if (activeTab === 'consultations') {
      consultationTypes.some(c => c.id === editingItem.id) ? updateConsultationType(editingItem.id, editingItem) : addConsultationType(editingItem);
    } else if (activeTab === 'consumables') {
      consumables.some(c => c.id === editingItem.id) ? updateConsumable(editingItem.id, editingItem) : addConsumable(editingItem);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 overflow-x-hidden text-[var(--text-primary)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter neon-text">Gestion du Catalogue</h1>
          <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mt-2">Mise à jour des prestations et articles</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-[var(--accent-color)] text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-[var(--accent-color)]/20 flex items-center justify-center space-x-3 text-xs uppercase tracking-tighter active:scale-95">
          <Plus size={20} />
          <span>AJOUTER ÉLÉMENT</span>
        </button>
      </div>

      <div className="flex space-x-2 p-1 glass-panel rounded-2xl w-full md:w-fit overflow-x-auto scrollbar-hide">
        <button onClick={() => { setActiveTab('meds'); setInventoryFilter('ALL'); }} className={`px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center space-x-3 transition-all shrink-0 ${activeTab === 'meds' ? 'bg-[var(--bg-primary)] shadow text-[var(--accent-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          <Pill size={16} /><span>PHARMACIE</span>
        </button>
        <button onClick={() => { setActiveTab('exams'); setInventoryFilter('ALL'); }} className={`px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center space-x-3 transition-all shrink-0 ${activeTab === 'exams' ? 'bg-[var(--bg-primary)] shadow text-purple-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          <FlaskConical size={16} /><span>ANALYSES</span>
        </button>
        <button onClick={() => { setActiveTab('acts'); setInventoryFilter('ALL'); }} className={`px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center space-x-3 transition-all shrink-0 ${activeTab === 'acts' ? 'bg-[var(--bg-primary)] shadow text-orange-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          <Syringe size={16} /><span>SOINS</span>
        </button>
        <button onClick={() => { setActiveTab('consultations'); setInventoryFilter('ALL'); }} className={`px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center space-x-3 transition-all shrink-0 ${activeTab === 'consultations' ? 'bg-[var(--bg-primary)] shadow text-emerald-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          <Stethoscope size={16} /><span>CONSULTATIONS</span>
        </button>
        <button onClick={() => { setActiveTab('consumables'); setInventoryFilter('ALL'); }} className={`px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center space-x-3 transition-all shrink-0 ${activeTab === 'consumables' ? 'bg-[var(--bg-primary)] shadow text-cyan-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
          <Archive size={16} /><span>CONSOMMABLES</span>
        </button>
      </div>

      <div className="glass-panel p-3 rounded-2xl border border-[var(--border-color)] space-y-3">
        <div className="flex items-center gap-4">
          <Search className="text-[var(--text-secondary)] ml-2" size={20} />
          <input type="text" placeholder="RECHERCHER DANS LE CATALOGUE..." className="flex-1 bg-transparent py-2 outline-none font-black uppercase text-xs text-[var(--text-primary)]" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        
        {activeTab === 'meds' && (
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            <button onClick={() => setInventoryFilter('ALL')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${inventoryFilter === 'ALL' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent'}`}>
              <CheckCircle2 size={12}/> TOUS
            </button>
            <button onClick={() => setInventoryFilter('LOW')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${inventoryFilter === 'LOW' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-orange-500/10 text-orange-400 border-transparent'}`}>
              <AlertTriangle size={12}/> STOCK BAS
            </button>
            <button onClick={() => setInventoryFilter('NEAR_EXPIRY')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${inventoryFilter === 'NEAR_EXPIRY' ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20' : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)] border-transparent'}`}>
              <Clock size={12}/> PROCHE EXP.
            </button>
            <button onClick={() => setInventoryFilter('EXPIRED')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${inventoryFilter === 'EXPIRED' ? 'bg-magenta text-white border-magenta shadow-md shadow-magenta/20' : 'bg-magenta/10 text-magenta border-transparent'}`}>
              <ShieldAlert size={12}/> EXPIRÉS
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredItems.map((item: any) => {
          const isMed = activeTab === 'meds';
          const now = new Date();
          const threeMonthsLater = new Date();
          threeMonthsLater.setDate(now.getDate() + 90);
          
          const isExpired = isMed && new Date(item.dateExpiration) < now;
          const isNear = isMed && !isExpired && new Date(item.dateExpiration) <= threeMonthsLater;
          const isLow = isMed && item.stock < item.stockMin;
          const isConsumable = activeTab === 'consumables';

          return (
            <div key={item.id} className={`bg-[var(--bg-secondary)] rounded-xl md:rounded-[1.8rem] p-3 md:p-6 flex items-center md:flex-col justify-between hover:shadow-lg transition-all group border ${isExpired ? 'border-magenta bg-magenta/[0.05]' : isNear ? 'border-[var(--accent-color)]/50 bg-[var(--accent-color)]/[0.02]' : isLow ? 'border-orange-500/50 bg-orange-500/5' : 'border-[var(--border-color)]'}`}>
              <div className="flex items-center md:items-start md:justify-between w-full gap-3 md:gap-4">
                <div className="flex items-center md:space-x-4 gap-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-all ${isExpired ? 'bg-magenta text-white animate-pulse' : isNear ? 'bg-[var(--accent-color)] text-white' : isLow ? 'bg-orange-500 text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] group-hover:bg-[var(--accent-color)] group-hover:text-white'}`}>
                    {activeTab === 'meds' ? <Pill size={20}/> : activeTab === 'exams' ? <FlaskConical size={20}/> : activeTab === 'acts' ? <Syringe size={20}/> : activeTab === 'consultations' ? <Stethoscope size={20}/> : <Archive size={20}/>}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter truncate leading-none mb-1 md:mb-2">{item.nom || item.label || item.name}</h3>
                    <div className="flex flex-wrap items-center gap-1">
                       {!isConsumable && <p className="text-[8px] md:text-[9px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest">{item.categorie || item.category}</p>}
                       {isConsumable && <p className="text-[8px] md:text-[9px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest">{item.stock} {item.unit}</p>}
                       {isExpired && <span className="text-[7px] font-black text-white bg-magenta px-1 rounded shadow-sm">PÉRIMÉ</span>}
                       {isNear && <span className="text-[7px] font-black text-white bg-[var(--accent-color)] px-1 rounded shadow-sm">EXP. PROCHE</span>}
                       {isLow && <span className="text-[7px] font-black text-white bg-orange-500 px-1 rounded shadow-sm">RUPTURE</span>}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex space-x-2">
                  <button onClick={() => handleOpenModal(item)} className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--accent-color)] hover:text-white transition-all"><Edit3 size={14} /></button>
                  <button onClick={() => (activeTab === 'meds' ? deleteMedicament(item.id) : activeTab === 'exams' ? deleteLabExam(item.id) : activeTab === 'acts' ? deleteCareAct(item.id) : activeTab === 'consultations' ? deleteConsultationType(item.id) : deleteConsumable(item.id))} className="p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
              
              <div className="flex flex-col items-end md:items-stretch md:w-full md:mt-4 gap-1 md:gap-3">
                <div className="text-right md:text-left">
                  <p className="text-sm md:text-lg font-mono font-bold text-[var(--text-primary)]">{(item.prix || item.price || 0).toLocaleString()} <span className="text-[10px] opacity-40">F</span></p>
                </div>
                
                <div className="md:hidden flex gap-2">
                  <button onClick={() => handleOpenModal(item)} className="p-1.5 text-[var(--text-secondary)]"><Edit3 size={14} /></button>
                  <button onClick={() => (activeTab === 'meds' ? deleteMedicament(item.id) : activeTab === 'exams' ? deleteLabExam(item.id) : activeTab === 'acts' ? deleteCareAct(item.id) : activeTab === 'consultations' ? deleteConsultationType(item.id) : deleteConsumable(item.id))} className="p-1.5 text-red-400"><Trash2 size={14} /></button>
                </div>

                <div className="hidden md:grid grid-cols-3 gap-2">
                   {!isConsumable && (
                     <>
                       <div className="bg-[var(--bg-primary)] p-2 rounded-xl text-center border border-[var(--border-color)]">
                          <p className="text-[7px] font-black text-[var(--text-secondary)] uppercase mb-0.5">PUBLIC</p>
                          <p className="text-[10px] font-mono font-medium text-[var(--text-primary)]">{(item.prix || item.price || 0).toLocaleString()} F</p>
                       </div>
                       <div className="bg-blue-500/5 p-2 rounded-xl text-center border border-blue-500/10">
                          <p className="text-[7px] font-black text-blue-400 uppercase mb-0.5">INAM</p>
                          <p className="text-[10px] font-mono font-medium text-blue-400">{(item.prixInam || item.priceInam || 0).toLocaleString()} F</p>
                       </div>
                       <div className="bg-emerald-500/5 p-2 rounded-xl text-center border border-emerald-500/10">
                          <p className="text-[7px] font-black text-emerald-400 uppercase mb-0.5">AMU</p>
                          <p className="text-[10px] font-mono font-medium text-emerald-400">{(item.prixAmu || item.priceAmu || 0).toLocaleString()} F</p>
                       </div>
                     </>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
  {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center glass-panel rounded-[2.5rem] border-2 border-dashed border-[var(--border-color)] animate-fade-in">
             <Package size={48} className="mx-auto text-[var(--text-secondary)]/20 mb-4" />
             <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Aucun résultat dans cette catégorie</p>
          </div>
        )}
      
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-primary)] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto border border-[var(--border-color)] my-auto">
            <div className={`p-6 md:p-8 ${activeTab === 'meds' ? 'bg-[var(--accent-color)]' : activeTab === 'exams' ? 'bg-purple-600' : activeTab === 'acts' ? 'bg-orange-600' : activeTab === 'consultations' ? 'bg-emerald-600' : 'bg-cyan-600'} text-white flex justify-between items-center sticky top-0 z-10`}>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Édition Fiche</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-10 space-y-5 md:space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Désignation</label>
                <input 
                  className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-black uppercase text-xs md:text-sm outline-none focus:border-[var(--accent-color)] transition-all text-[var(--text-primary)] shadow-sm" 
                  value={editingItem.nom || editingItem.label || editingItem.name || ''} 
                  onChange={(e) => setEditingItem({...editingItem, [activeTab === 'consultations' ? 'label' : activeTab === 'consumables' ? 'name' : 'nom']: e.target.value})} 
                  required 
                />
              </div>

              {activeTab !== 'consumables' && (
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 flex justify-between items-center tracking-widest">
                  <span>Catégorie (Répertoriage)</span>
                  {activeTab === 'meds' && (
                    <button 
                      type="button" 
                      onClick={() => setShowNewCatField(!showNewCatField)}
                      className="text-[var(--accent-color)] hover:text-[var(--accent-color)]/70 flex items-center gap-1 font-black tracking-widest"
                    >
                      <PlusCircle size={12} />
                      {showNewCatField ? "ANNULER" : "NOUVELLE"}
                    </button>
                  )}
                </label>
                
                {showNewCatField ? (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      className="flex-1 px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-primary)] border-2 border-[var(--accent-color)] rounded-xl md:rounded-2xl font-black uppercase text-xs outline-none text-[var(--text-primary)]"
                      placeholder="NOM DE LA CATÉGORIE..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddNewCategory}
                      className="px-4 md:px-6 bg-[var(--accent-color)] text-white rounded-xl md:rounded-2xl font-black text-xs"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select 
                      className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-black uppercase text-xs appearance-none outline-none focus:border-[var(--accent-color)] transition-all text-[var(--text-primary)] shadow-sm"
                      value={editingItem.categorie || editingItem.category}
                      onChange={(e) => setEditingItem({...editingItem, [activeTab === 'consultations' ? 'category' : 'categorie']: e.target.value})}
                    >
                      {(activeTab === 'meds' ? medicamentCategories : activeTab === 'exams' ? ['HÉMATOLOGIE', 'BIOCHIMIE', 'PARASITOLOGIE', 'SÉROLOGIE', 'MICROBIOLOGIE'] : activeTab === 'acts' ? ['INJECTIONS', 'PANSEMENTS', 'CHIRURGIE MINEURE', 'URGENCES', 'MATERNITÉ'] : ['GP', 'CPN']).map(cat => (
                        <option key={cat} value={cat} className="text-black">{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" size={18} />
                  </div>
                )}
              </div>
              )}
              
              {activeTab !== 'consumables' && (
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Public</label>
                  <input type="number" className="w-full px-3 py-3 md:px-5 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-mono font-medium text-center text-xs md:text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] shadow-sm" value={editingItem.prix || editingItem.price || 0} onChange={(e) => setEditingItem({...editingItem, [activeTab === 'consultations' ? 'price' : 'prix']: Number(e.target.value)})} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">INAM</label>
                  <input type="number" className="w-full px-3 py-3 md:px-5 md:py-4 bg-[var(--bg-secondary)] border border-blue-500/20 rounded-xl md:rounded-2xl font-mono font-medium text-center text-xs md:text-sm text-blue-400 outline-none focus:border-blue-500 shadow-sm" value={editingItem.prixInam || editingItem.priceInam || 0} onChange={(e) => setEditingItem({...editingItem, [activeTab === 'consultations' ? 'priceInam' : 'prixInam']: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">AMU</label>
                  <input type="number" className="w-full px-3 py-3 md:px-5 md:py-4 bg-[var(--bg-secondary)] border border-emerald-500/20 rounded-xl md:rounded-2xl font-mono font-medium text-center text-xs md:text-sm text-emerald-400 outline-none focus:border-emerald-500 shadow-sm" value={editingItem.prixAmu || editingItem.priceAmu || 0} onChange={(e) => setEditingItem({...editingItem, [activeTab === 'consultations' ? 'priceAmu' : 'prixAmu']: Number(e.target.value)})} />
                </div>
              </div>
              )}

              {activeTab === 'consumables' && (
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Stock</label>
                    <input type="number" className="w-full px-3 py-3 md:px-5 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-mono font-medium text-center text-xs md:text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] shadow-sm" value={editingItem.stock || 0} onChange={(e) => setEditingItem({...editingItem, stock: Number(e.target.value)})} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Min</label>
                    <input type="number" className="w-full px-3 py-3 md:px-5 md:py-4 bg-[var(--bg-secondary)] border border-red-500/20 rounded-xl md:rounded-2xl font-mono font-medium text-center text-xs md:text-sm text-red-400 outline-none focus:border-red-500 shadow-sm" value={editingItem.minStock || 0} onChange={(e) => setEditingItem({...editingItem, minStock: Number(e.target.value)})} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Unité</label>
                    <input type="text" className="w-full px-3 py-3 md:px-5 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-black text-center uppercase text-xs md:text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] shadow-sm" value={editingItem.unit || ''} onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})} placeholder="EX: PCS" required />
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Lot / Batch</label>
                    <input className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-mono font-medium text-center uppercase text-xs md:text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] shadow-sm" value={editingItem.lotNumber || ''} onChange={(e) => setEditingItem({...editingItem, lotNumber: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Expiration</label>
                    <input type="date" className="w-full px-5 py-3 md:px-6 md:py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl md:rounded-2xl font-mono font-medium text-center text-xs md:text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] shadow-sm" value={editingItem.dateExpiration} onChange={(e) => setEditingItem({...editingItem, dateExpiration: e.target.value})} />
                  </div>
                </div>
              )}

              {(activeTab === 'exams' || activeTab === 'acts') && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 flex items-center gap-2">
                      <Archive size={12} />
                      Consommables Associés
                    </label>
                    <button type="button" onClick={handleAddConsumableLink} className="text-[var(--accent-color)] text-[10px] font-black uppercase hover:underline">+ Ajouter</button>
                  </div>
                  
                  {editingItem.consumables && editingItem.consumables.map((link: any, idx: number) => (
                    <ConsumableSelector 
                      key={idx}
                      consumables={consumables}
                      selectedId={link.id}
                      quantity={link.quantity}
                      onUpdate={(field, value) => handleUpdateConsumableLink(idx, field, value)}
                      onRemove={() => handleRemoveConsumableLink(idx)}
                    />
                  ))}
                  {(!editingItem.consumables || editingItem.consumables.length === 0) && (
                    <p className="text-xs text-[var(--text-secondary)]/40 italic text-center py-2">Aucun consommable lié</p>
                  )}
                </div>
              )}

              <button type="submit" className="w-full bg-[var(--accent-color)] text-white py-5 rounded-[1.8rem] font-black text-base shadow-xl hover:opacity-90 transition-all active:scale-95 uppercase tracking-tighter">ENREGISTRER LA FICHE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogModule;
