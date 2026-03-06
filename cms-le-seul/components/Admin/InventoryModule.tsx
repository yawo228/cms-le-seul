
import React, { useState } from 'react';
import { Package, Edit3, Trash2, Plus, ArrowUpRight, ArrowDownLeft, Search, Save, X, FlaskConical, Syringe, Pill } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Medicament, LabExam, CareAct } from '../../types';

type CatalogTab = 'meds' | 'exams' | 'acts';

const InventoryModule: React.FC = () => {
  const { 
    medicaments, updateMedicament, addMedicament, deleteMedicament, stockMovements,
    labExams, updateLabExam, addLabExam, deleteLabExam,
    careActs, updateCareAct, addCareAct, deleteCareAct
  } = useStore();

  const [activeTab, setActiveTab] = useState<CatalogTab>('meds');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const filteredMeds = medicaments.filter(m => m.nom.toLowerCase().includes(search.toLowerCase()));
  const filteredExams = labExams.filter(e => e.nom.toLowerCase().includes(search.toLowerCase()));
  const filteredActs = careActs.filter(a => a.nom.toLowerCase().includes(search.toLowerCase()));

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      // Create empty template based on active tab
      const template = activeTab === 'meds' 
        ? { id: `med-${Date.now()}`, nom: '', prix: 0, prixInam: 0, stock: 0, stockMin: 10, categorie: 'Médicaments' }
        : activeTab === 'exams'
        ? { id: `lb-${Date.now()}`, nom: '', prix: 0, categorie: 'Analyses' }
        : { id: `sn-${Date.now()}`, nom: '', prix: 0 };
      setEditingItem(template);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (activeTab === 'meds') {
      const exists = medicaments.some(m => m.id === editingItem.id);
      exists ? updateMedicament(editingItem.id, editingItem) : addMedicament(editingItem);
    } else if (activeTab === 'exams') {
      const exists = labExams.some(e => e.id === editingItem.id);
      exists ? updateLabExam(editingItem.id, editingItem) : addLabExam(editingItem);
    } else if (activeTab === 'acts') {
      const exists = careActs.some(a => a.id === editingItem.id);
      exists ? updateCareAct(editingItem.id, editingItem) : addCareAct(editingItem);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tighter">Catalogue & Stocks</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm">Gestion centralisée des prix et des prestations.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[var(--accent-color)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg flex items-center space-x-2 active:scale-95 text-xs uppercase"
        >
          <Plus size={18} />
          <span>AJOUTER</span>
        </button>
      </div>

      <div className="flex space-x-2 p-1 bg-slate-100 rounded-2xl w-full md:w-fit">
        <button onClick={() => setActiveTab('meds')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === 'meds' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}>
          <Pill size={18} /><span>Pharmacie</span>
        </button>
        <button onClick={() => setActiveTab('exams')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === 'exams' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:bg-white/50'}`}>
          <FlaskConical size={18} /><span>Analyses</span>
        </button>
        <button onClick={() => setActiveTab('acts')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === 'acts' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:bg-white/50'}`}>
          <Syringe size={18} /><span>Actes de Soins</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par nom..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'meds' && filteredMeds.map(med => (
          <div key={med.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition">
            <div className="flex items-center space-x-6 w-full md:w-1/3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">
                {med.nom.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate block">{med.nom}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{med.categorie}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 flex-1">
              <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase">Prix Public</p><p className="font-black text-blue-600">{med.prix.toLocaleString()} F</p></div>
              <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase">Prix INAM</p><p className="font-black text-emerald-600">{med.prixInam?.toLocaleString()} F</p></div>
              <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase">Stock</p><p className={`font-black ${med.stock < med.stockMin ? 'text-red-500' : 'text-slate-800'}`}>{med.stock} U</p></div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleOpenModal(med)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={20} /></button>
              <button onClick={() => deleteMedicament(med.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}

        {activeTab === 'exams' && filteredExams.map(exam => (
          <div key={exam.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition">
            <div className="flex items-center space-x-6 w-full md:w-1/3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl"><FlaskConical size={24} /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate block">{exam.nom}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.categorie}</p>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prix Prestation</p>
              <p className="text-2xl font-black text-purple-600">{exam.prix.toLocaleString()} F CFA</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleOpenModal(exam)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-purple-600 hover:text-white transition-all"><Edit3 size={20} /></button>
              <button onClick={() => deleteLabExam(exam.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}

        {activeTab === 'acts' && filteredActs.map(act => (
          <div key={act.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition">
            <div className="flex items-center space-x-6 w-full md:w-1/3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xl"><Syringe size={24} /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate block">{act.nom}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soin infirmier</p>
              </div>
            </div>
            <div className="flex-1 text-center md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Prix Prestation</p>
              <p className="text-2xl font-black text-orange-600">{act.prix.toLocaleString()} F CFA</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleOpenModal(act)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-orange-600 hover:text-white transition-all"><Edit3 size={20} /></button>
              <button onClick={() => deleteCareAct(act.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className={`p-8 ${activeTab === 'meds' ? 'bg-blue-600' : activeTab === 'exams' ? 'bg-purple-600' : 'bg-orange-600'} text-white flex justify-between items-center`}>
              <h3 className="text-2xl font-black uppercase tracking-tight">Configuration de l'élément</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Désignation / Nom complet</label>
                <input 
                  autoFocus
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold uppercase"
                  value={editingItem.nom}
                  onChange={(e) => setEditingItem({...editingItem, nom: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prix Public (F CFA)</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl" value={editingItem.prix} onChange={(e) => setEditingItem({...editingItem, prix: Number(e.target.value)})} required />
                </div>
                {activeTab === 'meds' ? (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Prix INAM (F CFA)</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl" value={editingItem.prixInam || 0} onChange={(e) => setEditingItem({...editingItem, prixInam: Number(e.target.value)})} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Catégorie</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={editingItem.categorie || ''} onChange={(e) => setEditingItem({...editingItem, categorie: e.target.value})} />
                  </div>
                )}
              </div>
              {activeTab === 'meds' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Quantité initiale</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl" value={editingItem.stock} onChange={(e) => setEditingItem({...editingItem, stock: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seuil Alerte</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-red-500" value={editingItem.stockMin} onChange={(e) => setEditingItem({...editingItem, stockMin: Number(e.target.value)})} />
                  </div>
                </div>
              )}
              <button type="submit" className={`w-full ${activeTab === 'meds' ? 'bg-blue-600' : activeTab === 'exams' ? 'bg-purple-600' : 'bg-orange-600'} text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95`}>
                VALIDER & ENREGISTRER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
